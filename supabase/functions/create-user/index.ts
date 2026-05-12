import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// NOTE: post-Sprint-0b (migration 015) schema:
//   - usuarios: drops perfil, senha_hash, token_senha, token_expiracao, contato_medicao_*
//   - user_roles: { id, usuario_id (NOT NULL FK -> usuarios.id), role app_role NOT NULL }
//   - enum app_role: ('corpo_tecnico', 'tecnico')   ← Requerente NÃO é mais role
//   - status_aprovacao: lowercase 'pendente' | 'aprovado' | 'rejeitado'
// TODO: types.ts will be regenerated after migration 015 lands; until then the
// strict Supabase TS types reflect the pre-015 schema. The casts to `any` on
// insert payloads below are intentional and load-bearing.

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
  // CORS preflight
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
      console.log('Permission denied: solicitante não é Corpo Técnico aprovado', {
        userId: user.id,
      });
      return jsonResponse({ error: 'Sem permissão para criar usuários' }, 403);
    }

    // 3. Parse + validar payload
    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Payload JSON inválido' }, 400);
    }

    const { nome, email, cpf, celular, role, baseUrl } = body ?? {};

    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      return jsonResponse({ error: 'Campo obrigatório: nome' }, 400);
    }
    if (!cpf || typeof cpf !== 'string') {
      return jsonResponse({ error: 'Campo obrigatório: cpf' }, 400);
    }
    if (!role || typeof role !== 'string') {
      return jsonResponse({ error: 'Campo obrigatório: role' }, 400);
    }

    // Rejeitar explicitamente 'requerente' — possui fluxo próprio
    if (role === 'requerente' || role === 'Requerente') {
      return jsonResponse(
        {
          error:
            'Requerentes devem ser cadastrados via create-requerente. Esta função aceita apenas "corpo_tecnico" ou "tecnico".',
        },
        400
      );
    }

    if (!['corpo_tecnico', 'tecnico'].includes(role)) {
      return jsonResponse(
        { error: 'role inválido. Use "corpo_tecnico" ou "tecnico".' },
        400
      );
    }

    const isCorpoTecnico = role === 'corpo_tecnico';

    // Sanitize CPF (digits only); validar comprimento mínimo
    const cpfDigits = String(cpf).replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      return jsonResponse({ error: 'CPF deve conter 11 dígitos' }, 400);
    }

    // Email obrigatório para Corpo Técnico (loga via auth.users)
    if (isCorpoTecnico) {
      if (!email || typeof email !== 'string') {
        return jsonResponse(
          { error: 'Email é obrigatório para Corpo Técnico' },
          400
        );
      }
      if (!EMAIL_REGEX.test(email)) {
        return jsonResponse({ error: 'Email inválido' }, 400);
      }
    } else if (email && !EMAIL_REGEX.test(email)) {
      return jsonResponse({ error: 'Email inválido' }, 400);
    }

    const celularDigits = celular ? String(celular).replace(/\D/g, '') : null;

    // 4. Checar duplicidade em usuarios (cpf ou email)
    let duplicateQuery = supabase
      .from('usuarios')
      .select('id, cpf, email')
      .eq('cpf', cpfDigits);
    if (email) {
      duplicateQuery = supabase
        .from('usuarios')
        .select('id, cpf, email')
        .or(`cpf.eq.${cpfDigits},email.eq.${email}`);
    }

    const { data: existing, error: dupError } = await duplicateQuery.maybeSingle();

    if (dupError) {
      console.error('Duplicate check error:', dupError);
      return jsonResponse(
        { error: `Erro ao verificar duplicidade: ${dupError.message}` },
        500
      );
    }
    if (existing) {
      return jsonResponse(
        {
          error: email
            ? 'CPF ou email já cadastrado no sistema'
            : 'CPF já cadastrado no sistema',
        },
        409
      );
    }

    // 5. Criar usuário no Auth (apenas Corpo Técnico — Técnico não loga)
    let authUserId: string | null = null;

    if (isCorpoTecnico) {
      const { data: authData, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { nome, cpf: cpfDigits, celular: celularDigits, role, source: 'admin' },
        });

      if (createError || !authData?.user) {
        console.error('Create auth user error:', createError);
        return jsonResponse(
          {
            error: `Erro ao criar usuário no Auth: ${
              createError?.message ?? 'desconhecido'
            }`,
          },
          500
        );
      }
      authUserId = authData.user.id;
    }

    // 6. Inserir em usuarios
    // Rollback helpers
    const rollbackAuth = async () => {
      if (authUserId) {
        const { error } = await supabase.auth.admin.deleteUser(authUserId);
        if (error) console.error('Rollback auth.deleteUser failed:', error);
      }
    };

    const usuariosInsert: any = {
      auth_user_id: authUserId, // NULL para Técnico
      nome: nome.trim(),
      cpf: cpfDigits,
      celular: celularDigits,
      email: email ?? null,
      status: 'ativo',
      status_aprovacao: isCorpoTecnico ? 'pendente' : 'aprovado',
    };

    const { data: usuario, error: insertError } = await supabase
      .from('usuarios')
      .insert(usuariosInsert as never)
      .select()
      .single();

    if (insertError || !usuario) {
      console.error('Insert usuarios error:', insertError);
      await rollbackAuth();
      return jsonResponse(
        {
          error: `Erro ao criar registro de usuário: ${
            insertError?.message ?? 'desconhecido'
          }`,
        },
        500
      );
    }

    // Rollback helper p/ usuarios
    const rollbackUsuario = async () => {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', (usuario as any).id);
      if (error) console.error('Rollback usuarios.delete failed:', error);
    };

    // 7. Inserir em user_roles — sempre (Corpo Técnico E Técnico)
    const roleInsert: any = {
      usuario_id: (usuario as any).id,
      role, // 'corpo_tecnico' | 'tecnico'
    };

    const { error: roleError } = await supabase
      .from('user_roles')
      .insert(roleInsert as never);

    if (roleError) {
      console.error('Insert user_roles error:', roleError);
      // Rollback ordem reversa: usuarios → auth
      await rollbackUsuario();
      await rollbackAuth();
      return jsonResponse(
        { error: `Erro ao criar role: ${roleError.message}` },
        500
      );
    }

    // 8. Enviar convite para Corpo Técnico (define a senha no primeiro acesso)
    let inviteSent = false;
    if (isCorpoTecnico && email) {
      try {
        const inviteOptions: { redirectTo?: string; data?: Record<string, unknown> } = {
          data: { nome, role },
        };
        if (baseUrl && typeof baseUrl === 'string') {
          inviteOptions.redirectTo = `${baseUrl}/set-password?email=${encodeURIComponent(email)}`;
        }
        const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
          email,
          inviteOptions
        );
        if (inviteError) {
          // Convite falhou mas o cadastro está íntegro — apenas logar; CT poderá
          // ser convidado manualmente pela UI ou reenviado via outra função.
          console.error('inviteUserByEmail failed (cadastro mantido):', inviteError);
        } else {
          inviteSent = true;
        }
      } catch (emailError) {
        console.error('Falha ao enviar convite:', emailError);
      }
    }

    console.log('User created successfully:', {
      usuarioId: (usuario as any).id,
      role,
      requiresApproval: isCorpoTecnico,
      inviteSent,
    });

    return jsonResponse(
      {
        success: true,
        usuario,
        role,
        requiresApproval: isCorpoTecnico,
        inviteSent,
      },
      200
    );
  } catch (error) {
    console.error('Error in create-user function:', error);
    return jsonResponse(
      { error: (error as Error)?.message ?? 'Erro interno do servidor' },
      500
    );
  }
});
