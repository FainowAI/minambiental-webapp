import { supabase } from '@/integrations/supabase/client';
import { validateCPFOrCNPJ } from '@/utils/validators';

export interface CreateUserData {
  nome: string;
  cpf: string;
  perfil: 'Corpo Técnico' | 'Requerente' | 'Técnico';
  // Campos opcionais para outros perfis
  email?: string;
  celular?: string;
  // Campos específicos para perfil Requerente
  contato_medicao_cpf?: string;
  contato_medicao_email?: string;
  contato_medicao_celular?: string;
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
 * Create a new user with invite (Corpo Técnico function)
 */
export async function createUserWithInvite(userData: CreateUserData): Promise<{
  success: boolean;
  inviteLink?: string;
  requiresApproval: boolean;
  user?: any;
}> {
  try {
    // Validar CPF/CNPJ antes de enviar
    const cpfValidation = validateCPFOrCNPJ(userData.cpf);
    if (!cpfValidation.valid) {
      throw new Error(`CPF/CNPJ inválido`);
    }

    // Validar email apenas se fornecido (não obrigatório para Requerente)
    if (userData.email && !userData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('Email inválido');
    }

    // A verificação de duplicidade será feita na Edge Function
    // para evitar problemas de RLS

    console.log('🚀 Enviando dados para Edge Function create-user:', {
      nome: userData.nome,
      email: userData.email,
      cpf: userData.cpf,
      celular: userData.celular,
      perfil: userData.perfil,
      contato_medicao_cpf: userData.contato_medicao_cpf,
      contato_medicao_email: userData.contato_medicao_email,
      contato_medicao_celular: userData.contato_medicao_celular,
      baseUrl: window.location.origin,
    });

    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        nome: userData.nome,
        email: userData.email,
        cpf: userData.cpf,
        celular: userData.celular,
        perfil: userData.perfil,
        contato_medicao_cpf: userData.contato_medicao_cpf,
        contato_medicao_email: userData.contato_medicao_email,
        contato_medicao_celular: userData.contato_medicao_celular,
        baseUrl: window.location.origin,
      },
    });

    console.log('📥 Resposta da Edge Function:', { data, error });

    if (error) {
      console.error('❌ Erro na Edge Function:', error);
      
      // Tratamento de erros específicos
      if (error.message?.includes('403') || error.message?.includes('Sem permissão')) {
        throw new Error('Você não tem permissão para criar usuários.');
      }
      if (error.message?.includes('409') || error.message?.includes('já cadastrado')) {
        throw new Error('CPF ou email já cadastrado no sistema.');
      }
      if (error.message?.includes('401') || error.message?.includes('autenticação')) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      console.error('❌ Erro não tratado:', error);
      throw new Error(error.message || 'Erro ao criar usuário');
    }

    return data;
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
