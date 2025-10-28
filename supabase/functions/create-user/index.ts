import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";

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
      user_metadata: { nome, cpf, celular, perfil }
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
        status_aprovacao: isCorpoTecnico ? 'Pendente' : 'Aprovado',
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

    // 9. Enviar email se for Corpo Técnico
    if (isCorpoTecnico && token_senha) {
      try {
        const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
        const inviteLink = `${baseUrl}/set-password?token=${token_senha}&email=${encodeURIComponent(email)}`;
        
        const { error: emailError } = await resend.emails.send({
          from: 'MinAmbiental <onboarding@resend.dev>',
          to: [email],
          subject: 'Convite - Defina sua senha | MinAmbiental',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #059669 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🌿 Bem-vindo ao MinAmbiental</h1>
                </div>
                <div class="content">
                  <p>Olá <strong>${nome}</strong>,</p>
                  
                  <p>Você foi convidado para se juntar ao sistema MinAmbiental como <strong>Corpo Técnico</strong>.</p>
                  
                  <p>Para ativar sua conta, você precisa definir uma senha de acesso. Clique no botão abaixo:</p>
                  
                  <div style="text-align: center;">
                    <a href="${inviteLink}" class="button">Definir Minha Senha</a>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px;">Ou copie e cole este link no navegador:</p>
                  <p style="background: #e5e7eb; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
                    ${inviteLink}
                  </p>
                  
                  <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                      <li>Este link é válido por <strong>7 dias</strong></li>
                      <li>Seu acesso será liberado após aprovação do administrador</li>
                      <li>Se você não solicitou este convite, ignore este email</li>
                    </ul>
                  </div>
                  
                  <p>Se tiver alguma dúvida, entre em contato com o administrador do sistema.</p>
                  
                  <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe MinAmbiental</strong></p>
                </div>
                <div class="footer">
                  <p>© 2024 MinAmbiental. Todos os direitos reservados.</p>
                  <p>Este é um email automático, por favor não responda.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        
        if (emailError) {
          console.error('Email send error:', emailError);
        } else {
          console.log('Invite email sent successfully to:', email);
        }
      } catch (emailError) {
        console.error('Failed to send invite email:', emailError);
      }
    }

    // 10. Retornar resposta apropriada
    const response: any = {
      success: true,
      requiresApproval: isCorpoTecnico,
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
