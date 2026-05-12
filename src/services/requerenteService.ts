import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// =============================================================================
// Types
// =============================================================================

export type Requerente = Tables<'requerentes'>;
export type RequerenteInsert = TablesInsert<'requerentes'>;
export type RequerenteUpdate = TablesUpdate<'requerentes'>;

export type RequerenteStatus = 'ativo' | 'inativo';
export type TipoPessoa = 'PF' | 'PJ';

export interface ListRequerentesFilters {
  status?: RequerenteStatus;
  search?: string;
}

/**
 * Payload for the legacy `create-requerente` Edge Function.
 * Keeping the original (loose) shape so other callers don't break;
 * the Edge Function is being updated by a separate agent.
 */
export interface CreateRequerenteData {
  nome: string;
  cpf: string;
  email?: string;
  celular?: string;
  contato_medicao_cpf?: string;
  contato_medicao_email?: string;
  contato_medicao_celular?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/** Strip everything that is not a digit (used for CPF/CNPJ lookups). */
const stripDigits = (value: string): string => value.replace(/\D/g, '');

/** Trim a string field, returning null when the result is empty. */
const sanitizeString = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/** Trim + lowercase an email field, returning null when empty. */
const sanitizeEmail = (value: string | null | undefined): string | null => {
  const trimmed = sanitizeString(value);
  return trimmed ? trimmed.toLowerCase() : null;
};

/**
 * Sanitize an update payload: trim strings, lowercase emails,
 * strip non-digits from CPF/CNPJ fields. Undefined keys are preserved
 * as undefined so we don't accidentally overwrite columns with null.
 */
const sanitizeRequerentePayload = (
  data: Partial<RequerenteUpdate>,
): Partial<RequerenteUpdate> => {
  const out: Partial<RequerenteUpdate> = { ...data };

  if (out.nome_razao_social !== undefined) {
    out.nome_razao_social = sanitizeString(out.nome_razao_social) ?? '';
  }
  if (out.cpf_cnpj !== undefined) {
    out.cpf_cnpj = stripDigits(out.cpf_cnpj ?? '');
  }
  if (out.email !== undefined) {
    out.email = sanitizeEmail(out.email);
  }
  if (out.celular !== undefined) {
    out.celular = sanitizeString(out.celular);
  }
  if (out.contato_medicao_nome !== undefined) {
    out.contato_medicao_nome = sanitizeString(out.contato_medicao_nome);
  }
  if (out.contato_medicao_cpf !== undefined) {
    const digits = stripDigits(out.contato_medicao_cpf ?? '');
    out.contato_medicao_cpf = digits.length > 0 ? digits : null;
  }
  if (out.contato_medicao_email !== undefined) {
    out.contato_medicao_email = sanitizeEmail(out.contato_medicao_email);
  }
  if (out.contato_medicao_celular !== undefined) {
    out.contato_medicao_celular = sanitizeString(out.contato_medicao_celular);
  }

  return out;
};

// =============================================================================
// Read operations
// =============================================================================

/**
 * List active (non-soft-deleted) requerentes, optionally filtered by status
 * and a search string applied to nome_razao_social and cpf_cnpj.
 */
export async function listRequerentes(
  filters: ListRequerentesFilters = {},
): Promise<Requerente[]> {
  let query = supabase
    .from('requerentes')
    .select('*')
    .is('deleted_at', null);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = filters.search.trim();
    const digits = stripDigits(term);
    // ILIKE on nome_razao_social always; on cpf_cnpj only when there are digits.
    const orParts: string[] = [`nome_razao_social.ilike.%${term}%`];
    if (digits.length > 0) {
      orParts.push(`cpf_cnpj.ilike.%${digits}%`);
    }
    query = query.or(orParts.join(','));
  }

  const { data, error } = await query.order('nome_razao_social', { ascending: true });

  if (error) {
    console.error('Error in listRequerentes:', error);
    throw new Error(error.message || 'Erro ao listar Requerentes');
  }

  return data ?? [];
}

/** Fetch a single requerente by id; returns null when not found / soft-deleted. */
export async function getRequerenteById(id: string): Promise<Requerente | null> {
  const { data, error } = await supabase
    .from('requerentes')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('Error in getRequerenteById:', error);
    throw new Error(error.message || 'Erro ao buscar Requerente');
  }

  return data;
}

/**
 * Find a requerente by CPF/CNPJ (digits only). Returns null when not found.
 * Soft-deleted rows are excluded.
 */
export async function findRequerenteByCpfCnpj(
  cpfCnpj: string,
): Promise<Requerente | null> {
  const digits = stripDigits(cpfCnpj ?? '');
  if (digits.length === 0) return null;

  const { data, error } = await supabase
    .from('requerentes')
    .select('*')
    .eq('cpf_cnpj', digits)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('Error in findRequerenteByCpfCnpj:', error);
    throw new Error(error.message || 'Erro ao buscar Requerente por CPF/CNPJ');
  }

  return data;
}

// =============================================================================
// Write operations
// =============================================================================

/**
 * Create a requerente via the `create-requerente` Edge Function.
 * Behavior is intentionally preserved — the Edge Function itself
 * will be updated by a separate agent.
 */
export async function createRequerente(data: CreateRequerenteData) {
  try {
    const { data: result, error } = await supabase.functions.invoke('create-requerente', {
      body: data,
    });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(error.message || 'Erro ao criar Requerente');
    }

    if (result?.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error in createRequerente:', error);
    throw error;
  }
}

/**
 * Update a requerente. Only the provided fields are written.
 * Soft-deleted rows are not updated.
 */
export async function updateRequerente(
  id: string,
  data: Partial<RequerenteUpdate>,
): Promise<Requerente> {
  const payload = sanitizeRequerentePayload(data);

  const { data: updated, error } = await supabase
    .from('requerentes')
    .update(payload)
    .eq('id', id)
    .is('deleted_at', null)
    .select('*')
    .single();

  if (error) {
    console.error('Error in updateRequerente:', error);
    throw new Error(error.message || 'Erro ao atualizar Requerente');
  }

  return updated;
}

/**
 * Soft-delete a requerente. Refuses to proceed when an active, non-deleted
 * contract is still linked to one of the requerente's licencas.
 */
export async function softDeleteRequerente(id: string): Promise<void> {
  // 1) Block deletion when there is at least one active contract attached
  //    to a licenca that points to this requerente.
  const { data: ativos, error: checkError } = await supabase
    .from('contratos')
    .select('id, licenca:licencas!inner(requerente_id)')
    .eq('licenca.requerente_id', id)
    .eq('status', 'ativo')
    .is('deleted_at', null)
    .limit(1);

  if (checkError) {
    console.error('Error checking active contracts in softDeleteRequerente:', checkError);
    throw new Error(checkError.message || 'Erro ao verificar contratos ativos do Requerente');
  }

  if (ativos && ativos.length > 0) {
    throw new Error(
      'Não é possível inativar o Requerente, pois existe um contrato ativo vinculado a ele.',
    );
  }

  // 2) Perform the soft delete + inactivate.
  const { error: updateError } = await supabase
    .from('requerentes')
    .update({
      status: 'inativo',
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    console.error('Error in softDeleteRequerente:', updateError);
    throw new Error(updateError.message || 'Erro ao inativar Requerente');
  }
}
