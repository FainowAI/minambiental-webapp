import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Authenticate requesting user (admin Corpo Técnico)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify requester is approved Corpo Técnico
    const { data: requester, error: requesterError } = await supabase
      .from('usuarios')
      .select('perfil, status_aprovacao')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (requesterError || !requester) {
      console.error('Requester error:', requesterError);
      return new Response(
        JSON.stringify({ error: 'Perfil do usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (requester.perfil !== 'Corpo Técnico' || requester.status_aprovacao !== 'Aprovado') {
      return new Response(
        JSON.stringify({ error: 'Sem permissão para criar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Validate payload
    const { 
      nome, 
      cpf, 
      email,
      celular,
      contato_medicao_cpf,
      contato_medicao_email,
      contato_medicao_celular
    } = await req.json();

    if (!nome || !cpf) {
      return new Response(
        JSON.stringify({ error: 'Nome e CPF/CNPJ são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Attempting to create Requerente with CPF:', cpf);

    // 4. Check duplicate by CPF
    const { data: existingByCPF } = await supabase
      .from('usuarios')
      .select('cpf, nome, perfil')
      .eq('cpf', cpf)
      .maybeSingle();

    if (existingByCPF) {
      console.log('Duplicate CPF found:', existingByCPF);
      return new Response(
        JSON.stringify({ 
          error: `CPF/CNPJ ${cpf} já cadastrado no sistema para ${existingByCPF.nome} (${existingByCPF.perfil})` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Check duplicate by email (if provided)
    if (email) {
      const { data: existingByEmail } = await supabase
        .from('usuarios')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingByEmail) {
        return new Response(
          JSON.stringify({ error: 'Email já cadastrado no sistema' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 6. Insert into usuarios table (WITHOUT creating Auth User)
    const insertData = {
      auth_user_id: null,  // Requerente doesn't have Auth User
      nome,
      cpf,
      email: email || null,
      celular: celular || null,
      perfil: 'Requerente',
      status_aprovacao: 'Pendente',
      contato_medicao_cpf: contato_medicao_cpf || null,
      contato_medicao_email: contato_medicao_email || null,
      contato_medicao_celular: contato_medicao_celular || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: usuario, error: insertError } = await supabase
      .from('usuarios')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: `Erro ao criar Requerente: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Requerente created successfully:', usuario.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        usuario: usuario,
        requiresApproval: true
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
