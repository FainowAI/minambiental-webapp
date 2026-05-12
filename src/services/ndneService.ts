import { supabase } from '@/integrations/supabase/client';
import type { Database, Tables } from '@/integrations/supabase/types';

type NDNERow = Tables<'contrato_nd_ne'>;
type NDNEInsert = Database['public']['Tables']['contrato_nd_ne']['Insert'];
type NDNEUpdate = Database['public']['Tables']['contrato_nd_ne']['Update'];

export interface NDNERecord extends NDNERow {
  tecnico?: {
    id: string;
    nome: string;
    email?: string;
  } | null;
}

export interface NDNEFilters {
  periodo?: 'chuvoso' | 'seco';
  origem?: 'chatbot' | 'sistema';
  ano?: number;
}

/**
 * Valida se o período informado é coerente com o mês da data de medição.
 * Regra (CA 03):
 *  - chuvoso: outubro a março (10, 11, 12, 1, 2, 3)
 *  - seco: abril a setembro (4, 5, 6, 7, 8, 9)
 * @throws Error em PT-BR caso a combinação seja inválida.
 */
export function validatePeriodoVsData(
  periodo: 'chuvoso' | 'seco',
  dataMedicao: string
): void {
  const month = new Date(dataMedicao).getUTCMonth() + 1;
  const chuvososMonths = [10, 11, 12, 1, 2, 3];
  const secoMonths = [4, 5, 6, 7, 8, 9];
  const valid =
    (periodo === 'chuvoso' && chuvososMonths.includes(month)) ||
    (periodo === 'seco' && secoMonths.includes(month));
  if (!valid) {
    throw new Error(
      'Não é permitido realizar o cadastro, pois a data informada não corresponde ao período de medição.'
    );
  }
}

/**
 * Trata erros do Postgres lançando mensagens amigáveis em PT-BR.
 * - Violação de UNIQUE (23505) → mensagem específica para ND/NE (CA 04).
 */
const handleSupabaseError = (
  error: { code?: string; message?: string },
  fallbackPrefix: string
): never => {
  const message = (error.message ?? '').toLowerCase();
  if (
    error.code === '23505' ||
    message.includes('duplicate') ||
    message.includes('unique')
  ) {
    throw new Error(
      'Já existe um registro de ND/NE para este contrato, período e ano. Edite o registro existente em vez de criar um novo.'
    );
  }
  throw new Error(`${fallbackPrefix}: ${error.message ?? 'erro desconhecido'}`);
};

/**
 * Busca registros de ND/NE para um contrato específico (ignora soft-deletados).
 * @param contractId ID do contrato
 * @param filters Filtros opcionais (período, origem, ano)
 * @returns Lista de registros de ND/NE
 */
export const fetchNDNERecords = async (
  contractId: string,
  filters?: NDNEFilters
): Promise<NDNERecord[]> => {
  let query = supabase
    .from('contrato_nd_ne')
    .select(`
      *,
      tecnico:usuarios!tecnico_id (
        id,
        nome,
        email
      )
    `)
    .eq('contrato_id', contractId)
    .is('deleted_at', null)
    .order('data_medicao', { ascending: false });

  // Aplicar filtros
  if (filters?.periodo) {
    query = query.eq('periodo', filters.periodo);
  }

  if (filters?.origem) {
    query = query.eq('origem_cadastro', filters.origem);
  }

  if (filters?.ano) {
    query = query
      .gte('data_medicao', `${filters.ano}-01-01`)
      .lte('data_medicao', `${filters.ano}-12-31`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar registros de ND/NE:', error);
    throw new Error(`Erro ao buscar registros: ${error.message}`);
  }

  return (data || []) as NDNERecord[];
};

/**
 * Cria um novo registro de ND/NE.
 * - Valida período x data (CA 03) antes de enviar ao banco.
 * - Força `origem_cadastro = 'sistema'` para inserts vindos do webapp.
 * - Converte violação de UNIQUE em mensagem amigável (CA 04).
 * @param record Dados do registro
 * @returns ID do registro criado
 */
export const createNDNERecord = async (
  record: NDNEInsert
): Promise<string> => {
  if (record.periodo && record.data_medicao) {
    validatePeriodoVsData(
      record.periodo as 'chuvoso' | 'seco',
      record.data_medicao as string
    );
  }

  const payload: NDNEInsert = {
    ...record,
    origem_cadastro: 'sistema',
  };

  const { data, error } = await supabase
    .from('contrato_nd_ne')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    console.error('Erro ao criar registro de ND/NE:', error);
    handleSupabaseError(error, 'Erro ao criar registro');
  }

  return data!.id;
};

/**
 * Atualiza um registro de ND/NE existente.
 * - Valida período x data (CA 03) quando ambos forem informados.
 * - Converte violação de UNIQUE em mensagem amigável (CA 04).
 * @param id ID do registro
 * @param updates Campos a serem atualizados
 */
export const updateNDNERecord = async (
  id: string,
  updates: NDNEUpdate
): Promise<void> => {
  if (updates.periodo && updates.data_medicao) {
    validatePeriodoVsData(
      updates.periodo as 'chuvoso' | 'seco',
      updates.data_medicao as string
    );
  }

  const { error } = await supabase
    .from('contrato_nd_ne')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar registro de ND/NE:', error);
    handleSupabaseError(error, 'Erro ao atualizar registro');
  }
};

/**
 * Busca um registro específico de ND/NE por ID (ignora soft-deletados).
 * @param id ID do registro
 * @returns Registro encontrado ou null
 */
export const fetchNDNERecordById = async (
  id: string
): Promise<NDNERecord | null> => {
  const { data, error } = await supabase
    .from('contrato_nd_ne')
    .select(`
      *,
      tecnico:usuarios!tecnico_id (
        id,
        nome,
        email
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar registro de ND/NE:', error);
    throw new Error(`Erro ao buscar registro: ${error.message}`);
  }

  return data as NDNERecord | null;
};

/**
 * Verifica se existe registro do chatbot para um período específico
 * (ignora soft-deletados).
 * @param contractId ID do contrato
 * @param periodo Período (chuvoso ou seco)
 * @returns Registro do chatbot ou null
 */
export const findChatbotRecord = async (
  contractId: string,
  periodo: 'chuvoso' | 'seco'
): Promise<NDNERecord | null> => {
  const { data, error } = await supabase
    .from('contrato_nd_ne')
    .select(`
      *,
      tecnico:usuarios!tecnico_id (
        id,
        nome,
        email
      )
    `)
    .eq('contrato_id', contractId)
    .eq('periodo', periodo)
    .eq('origem_cadastro', 'chatbot')
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar registro do chatbot:', error);
    throw new Error(`Erro ao buscar registro: ${error.message}`);
  }

  return data as NDNERecord | null;
};

/**
 * Soft delete de um registro de ND/NE: marca `deleted_at = now()`.
 * @param id ID do registro
 */
export const deleteNDNERecord = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('contrato_nd_ne')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar registro de ND/NE:', error);
    throw new Error(`Erro ao deletar registro: ${error.message}`);
  }
};
