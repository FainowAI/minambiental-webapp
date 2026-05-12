import { supabase } from '@/integrations/supabase/client';
import { validateCPFOrCNPJ } from '@/utils/validators';

export interface CreateUserData {
  nome: string;
  cpf: string;
  perfil: 'corpo_tecnico' | 'tecnico';
  email?: string;
  celular?: string;
}

export interface UserApprovalStatus {
  isApproved: boolean;
  isCorpoTecnico: boolean;
  status?: string;
}

/**
 * Generate a secure password reset token
 * @deprecated Password reset agora é gerenciado por Supabase Auth.
 */
export async function generatePasswordToken(): Promise<string> {
  // Simple token generation for now
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Create a new user (funcionário) with invite (Corpo Técnico function).
 * NOTE: Para criar/gerenciar Requerentes, use `requerenteService` — este serviço
 * agora opera apenas sobre funcionários (Corpo Técnico e Técnico).
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

    // Validar email (obrigatório para funcionários)
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
      baseUrl: window.location.origin,
    });

    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        nome: userData.nome,
        email: userData.email,
        cpf: userData.cpf,
        celular: userData.celular,
        perfil: userData.perfil,
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
      status_aprovacao: 'aprovado',
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
      status_aprovacao: 'rejeitado',
      updated_at: new Date().toISOString()
    })
    .eq('auth_user_id', userId);

  if (error) {
    throw new Error(`Erro ao rejeitar usuário: ${error.message}`);
  }
}

/**
 * Get user approval status — lê a role via JOIN em user_roles (role_v2).
 * Tolera status capitalizado de dados legados por uma release.
 */
export async function getUserApprovalStatus(authUserId: string): Promise<UserApprovalStatus> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, status, status_aprovacao, user_roles(role_v2)')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  if (error) throw new Error(`Erro ao buscar status do usuário: ${error.message}`);
  if (!data) return { isApproved: false, isCorpoTecnico: false, status: undefined };
  const roles = ((data as any).user_roles ?? []).map((r: any) => r.role_v2).filter(Boolean);
  const isCorpoTecnico = roles.includes('corpo_tecnico');
  const isApproved = isCorpoTecnico
    && ((data as any).status_aprovacao === 'aprovado' || (data as any).status_aprovacao === 'Aprovado')
    && ((data as any).status === 'ativo' || (data as any).status === 'Ativo');
  return { isApproved, isCorpoTecnico, status: (data as any).status_aprovacao ?? undefined };
}


/**
 * Get all users for admin view — somente funcionários (corpo_tecnico/tecnico).
 * Filtra defensivamente Requerentes legados que possam ter sobrado em `usuarios`.
 */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      id, auth_user_id, nome, email, cpf, celular, status, status_aprovacao,
      created_at, updated_at,
      roles:user_roles(role_v2)
    `)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Erro ao buscar usuários: ${error.message}`);
  // Filter out any leftover Requerente rows (inativos depois de 012) — defensive
  return (data ?? []).filter(u => (u as any).roles?.some((r: any) => r.role_v2 === 'corpo_tecnico' || r.role_v2 === 'tecnico'));
}

/**
 * Validate password reset token
 * @deprecated Stub legacy — token_senha/token_expiracao removidos. Use Supabase Auth.
 */
export async function validatePasswordToken(_token: string, _email: string) {
  throw new Error('Password reset agora é gerenciado por Supabase Auth — não use este fluxo legacy.');
}

/**
 * Clear password reset token after use
 * @deprecated Stub legacy — token_senha/token_expiracao removidos. Use Supabase Auth.
 */
export async function clearPasswordToken(_userId: string): Promise<void> {
  throw new Error('Password reset agora é gerenciado por Supabase Auth — não use este fluxo legacy.');
}

/**
 * Get user by ID (inclui roles via JOIN em user_roles)
 */
export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*, user_roles(role_v2)')
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
  perfil: 'corpo_tecnico' | 'tecnico';
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
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id')
      .eq('cpf', cleanedCpf)
      .neq('id', userId)
      .single();

    if (existingUser) {
      throw new Error('CPF já cadastrado no sistema');
    }

    // Preparar dados para atualização (sem `perfil` — agora vive em user_roles.role_v2)
    const updateData: any = {
      nome: userData.nome,
      cpf: cleanedCpf,
      email: userData.email,
      celular: cleanedCelular,
      updated_at: new Date().toISOString()
    };

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
 * Check if a Requerente has active contracts.
 * contratos has no requerente_id — join through licencas.requerente_id.
 *
 * NOTE: este check é sobre um Requerente (não funcionário). Será movido para
 * `requerenteService` em um cleanup futuro.
 */
export async function hasActiveContracts(requerenteId: string): Promise<boolean> {
  try {
    // First, get license IDs for this requerente
    const { data: licencas, error: licencasError } = await supabase
      .from('licencas')
      .select('id')
      .eq('requerente_id', requerenteId);

    if (licencasError) {
      console.error('Error fetching licencas for requerente:', licencasError);
      return true;
    }

    if (!licencas || licencas.length === 0) {
      return false;
    }

    const licencaIds = licencas.map((l) => l.id);

    const { data, error } = await supabase
      .from('contratos')
      .select('id')
      .in('licenca_id', licencaIds)
      .eq('status', 'Ativo')
      .limit(1);

    if (error) {
      console.error('Error checking active contracts:', error);
      return true;
    }

    return data !== null && data.length > 0;
  } catch (error) {
    console.error('Error in hasActiveContracts:', error);
    return true;
  }
}

/**
 * Toggle user status (activate/deactivate).
 * `status` e `status_aprovacao` são conceitos independentes agora; só togglamos `status`.
 */
export async function toggleUserStatus(userId: string, currentStatus: string): Promise<void> {
  const normalized = (currentStatus ?? '').toLowerCase();
  const newStatus = normalized === 'ativo' ? 'inativo' : 'ativo';
  const { error } = await supabase
    .from('usuarios')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw new Error(`Erro ao atualizar status do usuário: ${error.message}`);
}
