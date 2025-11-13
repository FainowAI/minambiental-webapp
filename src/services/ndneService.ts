import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type NDNERow = Database['public']['Tables']['contrato_nd_ne']['Row'];
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
 * Busca registros de ND/NE para um contrato específico
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
 * Cria um novo registro de ND/NE
 * @param record Dados do registro
 * @returns ID do registro criado
 */
export const createNDNERecord = async (
  record: NDNEInsert
): Promise<string> => {
  const { data, error } = await supabase
    .from('contrato_nd_ne')
    .insert(record)
    .select('id')
    .single();

  if (error) {
    console.error('Erro ao criar registro de ND/NE:', error);
    throw new Error(`Erro ao criar registro: ${error.message}`);
  }

  return data.id;
};

/**
 * Atualiza um registro de ND/NE existente
 * @param id ID do registro
 * @param updates Campos a serem atualizados
 */
export const updateNDNERecord = async (
  id: string,
  updates: NDNEUpdate
): Promise<void> => {
  const { error } = await supabase
    .from('contrato_nd_ne')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar registro de ND/NE:', error);
    throw new Error(`Erro ao atualizar registro: ${error.message}`);
  }
};

/**
 * Busca um registro específico de ND/NE por ID
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
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar registro de ND/NE:', error);
    throw new Error(`Erro ao buscar registro: ${error.message}`);
  }

  return data as NDNERecord | null;
};

/**
 * Verifica se existe registro do chatbot para um período específico
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
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar registro do chatbot:', error);
    throw new Error(`Erro ao buscar registro: ${error.message}`);
  }

  return data as NDNERecord | null;
};

/**
 * Deleta um registro de ND/NE (soft delete se implementado)
 * @param id ID do registro
 */
export const deleteNDNERecord = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('contrato_nd_ne')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar registro de ND/NE:', error);
    throw new Error(`Erro ao deletar registro: ${error.message}`);
  }
};
