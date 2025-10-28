import { supabase } from '@/integrations/supabase/client';

export interface CreateUserData {
  nome: string;
  email: string;
  cpf: string;
  celular?: string;
}

export interface UserApprovalStatus {
  isApproved: boolean;
  isCorpoTecnico: boolean;
  status?: string;
}

/**
 * Generate a secure password reset token
 */
export async function generatePasswordToken(): Promise<string> {
  // Simple token generation for now
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Create a new user with invite (admin function)
 */
export async function createUserWithInvite(userData: CreateUserData): Promise<void> {
  try {
    // Generate token for password setup (simple token generation)
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const tokenExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create user in auth first (without password)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        nome: userData.nome,
        cpf: userData.cpf,
        celular: userData.celular,
        perfil: 'Corpo Técnico',
      },
    });

    if (authError) {
      throw new Error(`Erro ao criar usuário no auth: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado no auth');
    }

    // Create user in usuarios table
    const { error: insertError } = await supabase
      .from('usuarios')
      .insert({
        auth_user_id: authData.user.id,
        nome: userData.nome,
        email: userData.email,
        cpf: userData.cpf,
        celular: userData.celular,
        perfil: 'Corpo Técnico',
        status_aprovacao: 'Aprovado', // Already approved by admin
        token_senha: token,
        token_expiracao: tokenExpiration.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

    if (insertError) {
      // If insert fails, try to clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Erro ao criar usuário na tabela usuarios: ${insertError.message}`);
    }

    // Send invite email with custom link
    const inviteLink = `${window.location.origin}/set-password?token=${token}&email=${encodeURIComponent(userData.email)}`;
    
    // TODO: Implement email sending service
    console.log('Invite link:', inviteLink);
    
    // For now, we'll use a simple alert
    alert(`Link de convite gerado: ${inviteLink}`);
    
  } catch (error) {
    console.error('Error creating user with invite:', error);
    throw error;
  }
}

/**
 * Approve a user (admin function)
 */
export async function approveUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('usuarios')
    .update({ 
      status_aprovacao: 'Aprovado',
      updated_at: new Date().toISOString()
    })
    .eq('auth_user_id', userId);

  if (error) {
    throw new Error(`Erro ao aprovar usuário: ${error.message}`);
  }
}

/**
 * Reject a user (admin function)
 */
export async function rejectUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('usuarios')
    .update({ 
      status_aprovacao: 'Rejeitado',
      updated_at: new Date().toISOString()
    })
    .eq('auth_user_id', userId);

  if (error) {
    throw new Error(`Erro ao rejeitar usuário: ${error.message}`);
  }
}

/**
 * Get user approval status
 */
export async function getUserApprovalStatus(authUserId: string): Promise<UserApprovalStatus> {
  console.log('Checking approval status for user:', authUserId); // Debug
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('perfil, status_aprovacao')
    .eq('auth_user_id', authUserId)
    .single();

  if (error) {
    console.error('Error fetching user approval status:', error); // Debug
    throw new Error(`Erro ao buscar status do usuário: ${error.message}`);
  }

  console.log('User data from database:', data); // Debug

  const isCorpoTecnico = data.perfil === 'Corpo Técnico';
  const isApproved = isCorpoTecnico && data.status_aprovacao === 'Aprovado';

  console.log('Approval status result:', { isCorpoTecnico, isApproved, status: data.status_aprovacao }); // Debug

  return {
    isApproved,
    isCorpoTecnico,
    status: data.status_aprovacao,
  };
}


/**
 * Get all users for admin view
 */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      id,
      auth_user_id,
      nome,
      email,
      cpf,
      celular,
      perfil,
      status,
      status_aprovacao,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar usuários: ${error.message}`);
  }

  return data;
}

/**
 * Validate password reset token
 */
export async function validatePasswordToken(token: string, email: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .eq('token_senha', token)
    .gte('token_expiracao', new Date().toISOString())
    .single();

  if (error) {
    throw new Error('Token inválido ou expirado');
  }

  return data;
}

/**
 * Clear password reset token after use
 */
export async function clearPasswordToken(userId: string): Promise<void> {
  const { error } = await supabase
    .from('usuarios')
    .update({ 
      token_senha: null,
      token_expiracao: null
    })
    .eq('auth_user_id', userId);

  if (error) {
    throw new Error(`Erro ao limpar token: ${error.message}`);
  }
}
