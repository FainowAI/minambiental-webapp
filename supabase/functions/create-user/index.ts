import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Criar cliente com Service Role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Autenticar usuário solicitante
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

    // 3. Verificar se solicitante é Corpo Técnico aprovado
    const { data: solicitante, error: solicitanteError } = await supabase
      .from('usuarios')
      .select('perfil, status_aprovacao')
      .eq('auth_user_id', user.id)
      .single();

    if (solicitanteError || !solicitante) {
      console.error('Solicitante error:', solicitanteError);
      return new Response(
        JSON.stringify({ error: 'Perfil do usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (solicitante.perfil !== 'Corpo Técnico' || solicitante.status_aprovacao !== 'Aprovado') {
      console.log('Permission denied:', { perfil: solicitante.perfil, status: solicitante.status_aprovacao });
      return new Response(
        JSON.stringify({ error: 'Sem permissão para criar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Validar payload
    const { nome, email, cpf, celular, perfil, baseUrl } = await req.json();

    if (!nome || !email || !cpf || !perfil) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios faltando' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['Corpo Técnico', 'Requerente', 'Técnico'].includes(perfil)) {
      return new Response(
        JSON.stringify({ error: 'Perfil inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Verificar duplicidade
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id')
      .or(`cpf.eq.${cpf},email.eq.${email}`)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'CPF ou email já cadastrado no sistema' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Criar usuário no Auth
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { nome, cpf, celular, perfil, source: 'admin' }
    });

    if (createError || !authData.user) {
      console.error('Create auth user error:', createError);
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${createError?.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Lógica diferenciada por perfil
    const isCorpoTecnico = perfil === 'Corpo Técnico';
    let token_senha = null;
    let token_expiracao = null;

    if (isCorpoTecnico) {
      // Gerar token URL-safe
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      token_senha = btoa(String.fromCharCode(...tokenBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      token_expiracao = expirationDate.toISOString();
    }

    // 8. Inserir em usuarios
    const { error: insertError } = await supabase
      .from('usuarios')
      .insert({
        auth_user_id: authData.user.id,
        nome,
        email,
        cpf,
        celular: celular || null,
        perfil,
        status_aprovacao: 'Pendente', // Todos os perfis iniciam como Pendente
        token_senha,
        token_expiracao,
      });

    if (insertError) {
      console.error('Insert usuarios error:', insertError);
      // Limpar auth user se falhar
      await supabase.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: `Erro ao criar registro: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Enviar email via Supabase Auth se for Corpo Técnico
    if (isCorpoTecnico && baseUrl) {
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${baseUrl}/set-password?email=${encodeURIComponent(email)}`
          }
        );
        
        if (resetError) {
          console.error('Erro ao enviar email de redefinição:', resetError);
        } else {
          console.log('Email de redefinição enviado com sucesso para:', email);
        }
      } catch (emailError) {
        console.error('Falha ao enviar email:', emailError);
      }
    }

    // 10. Retornar resposta apropriada
    const response: any = {
      success: true,
      requiresApproval: true, // Todos os perfis agora precisam de aprovação
      user: { nome, email, perfil },
    };

    if (isCorpoTecnico && baseUrl) {
      response.inviteLink = `${baseUrl}/set-password?token=${token_senha}&email=${encodeURIComponent(email)}`;
    }

    console.log('User created successfully:', { email, perfil, requiresApproval: isCorpoTecnico });

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-user function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
