import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { AnalysisParameter } from '@/constants/analysisParameters';

// Tipos para o serviço
type AnalysisRow = Database['public']['Tables']['analises_agua']['Row'];
type AnalysisInsert = Database['public']['Tables']['analises_agua']['Insert'];
type AnalysisUpdate = Database['public']['Tables']['analises_agua']['Update'];

export interface AnalysisFormData {
  // Campos obrigatórios da coleta
  responsavel_coleta: string;
  identificacao_profissional: string;
  laboratorio: string;
  data_entrada_laboratorio: string;
  data_coleta: string;
  hora_coleta: string;
  temperatura_ambiente: number | null;
  temperatura_amostra: number | null;
  tipo_coleta: string;
  codigo_amostra: string;
  
  // Observações opcionais
  observacoes?: string;
  
  // Parâmetros - valores informados pelo usuário
  parametros: Record<string, number | null>;
}

export interface AnalysisData extends AnalysisRow {
  contrato?: {
    id: string;
    numero: string;
    licenca_id: string;
  };
}

/**
 * Cria uma nova análise físico-química e bacteriológica
 * @param contractId ID do contrato
 * @param licenseId ID da licença
 * @param data Dados do formulário
 * @returns Análise criada
 */
export const createAnalysis = async (
  contractId: string,
  licenseId: string,
  data: AnalysisFormData
): Promise<AnalysisData> => {
  try {
    // Preparar objeto para inserção
    const analysisInsert: AnalysisInsert = {
      contrato_id: contractId,
      licenca_id: licenseId,
      responsavel_coleta: data.responsavel_coleta,
      identificacao_profissional: data.identificacao_profissional,
      laboratorio: data.laboratorio,
      data_entrada_laboratorio: data.data_entrada_laboratorio || null,
      data_coleta: data.data_coleta,
      hora_coleta: data.hora_coleta || null,
      temperatura_ambiente: data.temperatura_ambiente,
      temperatura_amostra: data.temperatura_amostra,
      tipo_coleta: data.tipo_coleta,
      codigo_amostra: data.codigo_amostra,
      observacoes: data.observacoes || null,
      // Armazenar todos os parâmetros no campo JSON
      parametros_adicionais: data.parametros as any,
      // Campos específicos que já existiam na tabela
      ph: data.parametros.ph || null,
      cor: data.parametros.cor || null,
      turbidez: data.parametros.turbidez || null,
      solidos_totais: data.parametros.solidos_totais_dissolvidos || null,
      dureza_total: data.parametros.dureza_total || null,
      coliformes_totais: data.parametros.coliformes_totais || null,
      escherichia_coli: data.parametros.escherichia_coli || null,
      condutividade: data.parametros.condutividade_eletrica || null,
      status: 'ativo',
    };

    const { data: analysis, error } = await supabase
      .from('analises_agua')
      .insert(analysisInsert)
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao criar análise:', error);
      throw error;
    }

    return analysis as AnalysisData;
  } catch (error) {
    console.error('Erro em createAnalysis:', error);
    throw error;
  }
};

/**
 * Busca análises por contrato
 * @param contractId ID do contrato
 * @returns Array de análises
 */
export const getAnalysesByContract = async (
  contractId: string
): Promise<AnalysisData[]> => {
  try {
    const { data: analyses, error } = await supabase
      .from('analises_agua')
      .select(`
        *,
        contrato:contratos(id, numero, licenca_id)
      `)
      .eq('contrato_id', contractId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar análises:', error);
      throw error;
    }

    return (analyses || []) as AnalysisData[];
  } catch (error) {
    console.error('Erro em getAnalysesByContract:', error);
    throw error;
  }
};

/**
 * Busca uma análise específica por ID
 * @param id ID da análise
 * @returns Dados da análise
 */
export const getAnalysisById = async (id: string): Promise<AnalysisData | null> => {
  try {
    const { data: analysis, error } = await supabase
      .from('analises_agua')
      .select(`
        *,
        contrato:contratos(id, numero, licenca_id)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum registro encontrado
        return null;
      }
      console.error('Erro ao buscar análise:', error);
      throw error;
    }

    return analysis as AnalysisData;
  } catch (error) {
    console.error('Erro em getAnalysisById:', error);
    throw error;
  }
};

/**
 * Atualiza uma análise existente
 * @param id ID da análise
 * @param data Dados atualizados
 * @returns Análise atualizada
 */
export const updateAnalysis = async (
  id: string,
  data: Partial<AnalysisFormData>
): Promise<AnalysisData> => {
  try {
    // Preparar objeto para atualização
    const analysisUpdate: AnalysisUpdate = {
      ...(data.responsavel_coleta !== undefined && { responsavel_coleta: data.responsavel_coleta }),
      ...(data.identificacao_profissional !== undefined && { identificacao_profissional: data.identificacao_profissional }),
      ...(data.laboratorio !== undefined && { laboratorio: data.laboratorio }),
      ...(data.data_entrada_laboratorio !== undefined && { data_entrada_laboratorio: data.data_entrada_laboratorio }),
      ...(data.data_coleta !== undefined && { data_coleta: data.data_coleta }),
      ...(data.hora_coleta !== undefined && { hora_coleta: data.hora_coleta }),
      ...(data.temperatura_ambiente !== undefined && { temperatura_ambiente: data.temperatura_ambiente }),
      ...(data.temperatura_amostra !== undefined && { temperatura_amostra: data.temperatura_amostra }),
      ...(data.tipo_coleta !== undefined && { tipo_coleta: data.tipo_coleta }),
      ...(data.codigo_amostra !== undefined && { codigo_amostra: data.codigo_amostra }),
      ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
      ...(data.parametros && {
        parametros_adicionais: data.parametros as any,
        ph: data.parametros.ph || null,
        cor: data.parametros.cor || null,
        turbidez: data.parametros.turbidez || null,
        solidos_totais: data.parametros.solidos_totais_dissolvidos || null,
        dureza_total: data.parametros.dureza_total || null,
        coliformes_totais: data.parametros.coliformes_totais || null,
        escherichia_coli: data.parametros.escherichia_coli || null,
        condutividade: data.parametros.condutividade_eletrica || null,
      }),
      updated_at: new Date().toISOString(),
    };

    const { data: analysis, error } = await supabase
      .from('analises_agua')
      .update(analysisUpdate)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao atualizar análise:', error);
      throw error;
    }

    return analysis as AnalysisData;
  } catch (error) {
    console.error('Erro em updateAnalysis:', error);
    throw error;
  }
};

/**
 * Deleta uma análise
 * @param id ID da análise
 */
export const deleteAnalysis = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('analises_agua')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar análise:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro em deleteAnalysis:', error);
    throw error;
  }
};

/**
 * Mapeia dados da análise do banco para o formulário
 * @param analysis Dados da análise do banco
 * @returns Dados formatados para o formulário
 */
export const mapAnalysisToFormData = (analysis: AnalysisData): AnalysisFormData => {
  // Extrair parâmetros do campo JSON
  const parametrosAdicionais = (analysis.parametros_adicionais as Record<string, number | null>) || {};
  
  // Combinar com campos específicos da tabela
  const parametros: Record<string, number | null> = {
    ...parametrosAdicionais,
    ph: analysis.ph,
    cor: analysis.cor,
    turbidez: analysis.turbidez,
    solidos_totais_dissolvidos: analysis.solidos_totais,
    dureza_total: analysis.dureza_total,
    coliformes_totais: analysis.coliformes_totais,
    escherichia_coli: analysis.escherichia_coli,
    condutividade_eletrica: analysis.condutividade,
  };

  return {
    responsavel_coleta: analysis.responsavel_coleta || '',
    identificacao_profissional: analysis.identificacao_profissional || '',
    laboratorio: analysis.laboratorio || '',
    data_entrada_laboratorio: analysis.data_entrada_laboratorio || '',
    data_coleta: analysis.data_coleta,
    hora_coleta: analysis.hora_coleta || '',
    temperatura_ambiente: analysis.temperatura_ambiente,
    temperatura_amostra: analysis.temperatura_amostra,
    tipo_coleta: analysis.tipo_coleta || '',
    codigo_amostra: analysis.codigo_amostra || '',
    observacoes: analysis.observacoes || '',
    parametros,
  };
};

