import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// NOTE: post-Sprint-0b (migration 015) schema:
//   - requerentes é entidade própria (NÃO em usuarios; NÃO cria auth.users)
//   - cpf_cnpj é UNIQUE (constraint do banco — captura 23505 abaixo)
//   - Requerente NÃO loga no sistema; sem auth_user_id.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Autenticar solicitante
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Token de autenticação não fornecido' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return jsonResponse({ error: 'Não autenticado' }, 401);
    }

    // 2. Verificar que solicitante é Corpo Técnico aprovado
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'is_corpo_tecnico',
      { _auth_user_id: user.id }
    );

    if (rpcError) {
      console.error('RPC is_corpo_tecnico error:', rpcError);
      return jsonResponse(
        { error: 'Falha ao verificar permissões do solicitante' },
        500
      );
    }

    if (rpcResult !== true) {
      return jsonResponse({ error: 'Sem permissão para criar Requerentes' }, 403);
    }

    // 3. Parse + validar payload
    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Payload JSON inválido' }, 400);
    }

    const {
      tipo_pessoa,
      cpf_cnpj,
      nome_razao_social,
      email,
      celular,
      contato_medicao_nome,
      contato_medicao_cpf,
      contato_medicao_email,
      contato_medicao_celular,
    } = body ?? {};

    if (!tipo_pessoa || !cpf_cnpj || !nome_razao_social) {
      return jsonResponse(
        { error: 'Campos obrigatórios: tipo_pessoa, cpf_cnpj, nome_razao_social' },
        400
      );
    }

    if (!['PF', 'PJ'].includes(tipo_pessoa)) {
      return jsonResponse(
        { error: 'tipo_pessoa inválido. Use "PF" ou "PJ".' },
        400
      );
    }

    const cpfCnpjDigits = String(cpf_cnpj).replace(/\D/g, '');

    if (tipo_pessoa === 'PF' && cpfCnpjDigits.length !== 11) {
      return jsonResponse({ error: 'CPF deve conter 11 dígitos' }, 400);
    }
    if (tipo_pessoa === 'PJ' && cpfCnpjDigits.length !== 14) {
      return jsonResponse({ error: 'CNPJ deve conter 14 dígitos' }, 400);
    }

    if (email && !EMAIL_REGEX.test(email)) {
      return jsonResponse({ error: 'Email inválido' }, 400);
    }
    if (contato_medicao_email && !EMAIL_REGEX.test(contato_medicao_email)) {
      return jsonResponse(
        { error: 'Email do contato de medição inválido' },
        400
      );
    }

    // 4. Pré-check duplicidade (ignora soft-deleted) — UX-friendly antes do insert.
    //    A UNIQUE constraint do banco é a fonte de verdade; race condition é tratada
    //    abaixo no catch de 23505.
    const { data: existing, error: dupError } = await supabase
      .from('requerentes')
      .select('id, nome_razao_social')
      .eq('cpf_cnpj', cpfCnpjDigits)
      .is('deleted_at', null)
      .maybeSingle();

    if (dupError) {
      console.error('Duplicate check error:', dupError);
      return jsonResponse(
        { error: `Erro ao verificar duplicidade: ${dupError.message}` },
        500
      );
    }

    if (existing) {
      return jsonResponse(
        { error: 'Já existe um Requerente cadastrado com este CPF/CNPJ.' },
        409
      );
    }

    // 5. Inserir em requerentes
    const insertData: any = {
      tipo_pessoa,
      cpf_cnpj: cpfCnpjDigits,
      nome_razao_social: String(nome_razao_social).trim(),
      email: email ?? null,
      celular: celular ? String(celular).replace(/\D/g, '') : null,
      contato_medicao_nome: contato_medicao_nome ?? null,
      contato_medicao_cpf: contato_medicao_cpf
        ? String(contato_medicao_cpf).replace(/\D/g, '')
        : null,
      contato_medicao_email: contato_medicao_email ?? null,
      contato_medicao_celular: contato_medicao_celular
        ? String(contato_medicao_celular).replace(/\D/g, '')
        : null,
      status: 'ativo',
      created_by: user.id,
      updated_by: user.id,
    };

    const { data: requerente, error: insertError } = await supabase
      .from('requerentes')
      .insert(insertData as never)
      .select()
      .single();

    if (insertError) {
      console.error('Insert requerentes error:', insertError);
      // 23505 = unique_violation. Captura race ou caso o pré-check tenha falhado.
      if ((insertError as any)?.code === '23505') {
        return jsonResponse(
          { error: 'Já existe um Requerente cadastrado com este CPF/CNPJ.' },
          409
        );
      }
      return jsonResponse(
        { error: `Erro ao criar Requerente: ${insertError.message}` },
        500
      );
    }

    console.log('Requerente created successfully:', (requerente as any).id);

    return jsonResponse({ success: true, requerente }, 200);
  } catch (error) {
    console.error('Error in create-requerente function:', error);
    return jsonResponse(
      { error: (error as Error)?.message ?? 'Erro interno do servidor' },
      500
    );
  }
});
