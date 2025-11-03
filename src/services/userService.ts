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
  isActive: boolean;
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
    .select('perfil, status_aprovacao, status')
    .eq('auth_user_id', authUserId)
    .single();

  if (error) {
    console.error('Error fetching user approval status:', error); // Debug
    throw new Error(`Erro ao buscar status do usuário: ${error.message}`);
  }

  console.log('User data from database:', data); // Debug

  const isCorpoTecnico = data.perfil === 'Corpo Técnico';
  const isApproved = isCorpoTecnico && data.status_aprovacao === 'Aprovado';
  const isActive = data.status === 'Ativo';

  console.log('Approval status result:', { 
    isCorpoTecnico, 
    isApproved, 
    isActive,
    status: data.status_aprovacao,
    userStatus: data.status
  }); // Debug

  return {
    isApproved,
    isCorpoTecnico,
    status: data.status_aprovacao,
    isActive,
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

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Erro ao buscar usuário: ${error.message}`);
  }

  return data;
}

/**
 * Update user data
 */
export interface UpdateUserData {
  nome: string;
  cpf: string;
  email?: string;
  celular?: string;
  perfil: 'Corpo Técnico' | 'Requerente' | 'Técnico';
  // Campos de contato para medição (Requerente)
  contato_medicao_cpf?: string | null;
  contato_medicao_email?: string | null;
  contato_medicao_celular?: string | null;
}

export async function updateUser(userId: string, userData: UpdateUserData): Promise<void> {
  try {
    // Validar CPF/CNPJ antes de enviar
    const cpfValidation = validateCPFOrCNPJ(userData.cpf);
    if (!cpfValidation.valid) {
      throw new Error(`CPF/CNPJ inválido`);
    }

    // Remover caracteres especiais do CPF e celular
    const cleanedCpf = userData.cpf.replace(/\D/g, '');
    const cleanedCelular = userData.celular?.replace(/\D/g, '');

    // Verificar se CPF já existe (exceto para o próprio usuário)
    const { data: existingUser, error: checkError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('cpf', cleanedCpf)
      .neq('id', userId)
      .single();

    if (existingUser) {
      throw new Error('CPF já cadastrado no sistema');
    }

    // Preparar dados para atualização
    const updateData: any = {
      nome: userData.nome,
      cpf: cleanedCpf,
      perfil: userData.perfil,
      updated_at: new Date().toISOString()
    };

    // Adicionar email e celular apenas se o perfil não for Requerente
    if (userData.perfil !== 'Requerente') {
      updateData.email = userData.email;
      updateData.celular = cleanedCelular;
    } else {
      // Adicionar campos de contato para Requerente
      updateData.contato_medicao_cpf = userData.contato_medicao_cpf || null;
      updateData.contato_medicao_email = userData.contato_medicao_email || null;
      updateData.contato_medicao_celular = userData.contato_medicao_celular || null;
    }

    const { error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Check if a Requerente has active contracts
 */
export async function hasActiveContracts(userId: string): Promise<boolean> {
  try {
    // @ts-ignore - Avoid deep type inference issue
    const { data, error } = await supabase
      .from('contratos')
      .select('id')
      .eq('requerente_id', userId)
      .eq('status', 'Ativo')
      .limit(1);
    
    if (error) {
      console.error('Error checking active contracts:', error);
      return true;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error in hasActiveContracts:', error);
    return true;
  }
}

/**
 * Toggle user status (activate/deactivate)
 */
export async function toggleUserStatus(userId: string, currentStatus: string): Promise<void> {
  const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';

  const { error } = await supabase
    .from('usuarios')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Erro ao atualizar status do usuário: ${error.message}`);
  }
}
