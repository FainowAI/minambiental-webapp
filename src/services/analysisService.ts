import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// ---------------------------------------------------------------------------
// Sprint 0b — analysisService refatorado
// ---------------------------------------------------------------------------
// Mudanças principais:
//   - Tabela `analises_agua` (legacy, dropada pela migration 015) substituída
//     por `contrato_analises_fq`. Nenhuma referência a `analises_agua` aqui.
//   - Parâmetros catalogados vêm de `ref_parametros_analise` (DB) via
//     `getParametrosAnalise()` / `listAvailableParameters()` — fonte primária.
//     Constants em `src/constants/analysisParameters.ts` está marcado como
//     @deprecated e permanece apenas como fallback offline (outro agente
//     cuida da remoção).
//   - Valores específicos (pH, cor, turbidez, temperatura_agua) gravam nas
//     colunas dedicadas `resultado_*`. Demais parâmetros + estes ficam
//     espelhados em `parametros_extras` (JSONB) para não perder dados.
//
// BLOQUEIO conhecido (Sprint 0b):
//   A spec do prompt assume uma child-table `contrato_analise_parametros`
//   com inserts em duas etapas (cabeçalho + linhas). Essa tabela NÃO foi
//   criada pelas migrations 010-015 (verificado em types.ts e nos SQLs).
//   Enquanto a child-table não existir, mantemos o modelo JSONB
//   (`parametros_extras`) — que já está no schema atual. Quando a migration
//   da child-table chegar, esta service precisará de:
//     1) Insert em `contrato_analise_parametros` em batch após o cabeçalho.
//     2) Cleanup (delete do cabeçalho) em caso de falha no batch.
//     3) JOIN no SELECT:
//        `parametros:contrato_analise_parametros(*, parametro:ref_parametros_analise(*))`.
// ---------------------------------------------------------------------------

// Tipos do schema novo
type AnaliseFQRow = Tables<'contrato_analises_fq'>;
type AnaliseFQInsert = TablesInsert<'contrato_analises_fq'>;
type AnaliseFQUpdate = TablesUpdate<'contrato_analises_fq'>;

type RefParametroAnalise = Tables<'ref_parametros_analise'>;

export type ParametroGrupo =
  | 'fisico_quimico'
  | 'bacteriologico'
  | 'btex'
  | 'oleos_diesel';

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

  // Parâmetros — valores informados pelo usuário (chave = codigo do parâmetro)
  parametros: Record<string, number | null>;
}

export interface AnalysisData extends AnaliseFQRow {
  contrato?: {
    id: string;
    numero: string;
    licenca_id: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Constrói o objeto Insert/Update mapeando o form para as colunas reais
 * do schema novo. Valores conhecidos vão em colunas dedicadas; tudo é
 * espelhado em `parametros_extras` (JSONB) para não perder dados.
 *
 * Observação: `tipo_coleta` não existe em `contrato_analises_fq` no schema
 * atual — armazenamos dentro de `parametros_extras.__meta.tipo_coleta`.
 */
const buildAnaliseFQPayload = (
  data: Partial<AnalysisFormData>,
): AnaliseFQUpdate => {
  const payload: AnaliseFQUpdate = {};

  if (data.responsavel_coleta !== undefined) payload.responsavel_coleta = data.responsavel_coleta;
  if (data.identificacao_profissional !== undefined) payload.ind_profissional = data.identificacao_profissional;
  if (data.laboratorio !== undefined) payload.laboratorio = data.laboratorio;
  if (data.data_entrada_laboratorio !== undefined) {
    payload.data_entrada_laboratorio = data.data_entrada_laboratorio || null;
  }
  if (data.data_coleta !== undefined) payload.data_coleta = data.data_coleta;
  if (data.hora_coleta !== undefined) payload.hora_coleta = data.hora_coleta || null;
  if (data.temperatura_ambiente !== undefined) payload.temperatura_ambiente = data.temperatura_ambiente;
  if (data.temperatura_amostra !== undefined) payload.temperatura_amostra = data.temperatura_amostra;
  if (data.codigo_amostra !== undefined) payload.codigo_amostra = data.codigo_amostra;
  if (data.observacoes !== undefined) payload.observacoes = data.observacoes || null;

  if (data.parametros) {
    const p = data.parametros;
    payload.resultado_ph = p.ph ?? null;
    payload.resultado_cor = p.cor ?? null;
    payload.resultado_turbidez = p.turbidez ?? null;
    payload.resultado_temperatura_agua = p.temperatura_agua ?? null;

    // Espelha o map completo + meta-fields que o schema atual não tem coluna
    payload.parametros_extras = {
      ...p,
      __meta: {
        tipo_coleta: data.tipo_coleta ?? null,
      },
    } as AnaliseFQUpdate['parametros_extras'];
  } else if (data.tipo_coleta !== undefined) {
    // Tipo de coleta sem o resto dos parâmetros — preserva no JSON existente.
    payload.parametros_extras = {
      __meta: { tipo_coleta: data.tipo_coleta },
    } as AnaliseFQUpdate['parametros_extras'];
  }

  return payload;
};

// ---------------------------------------------------------------------------
// Catálogo de parâmetros (ref_parametros_analise) — fonte primária no DB
// ---------------------------------------------------------------------------

/**
 * Busca parâmetros catalogados em `ref_parametros_analise`.
 * Filtra por grupo se informado. Retorna apenas registros ativos,
 * ordenados por `ordem_exibicao`.
 */
export async function getParametrosAnalise(
  grupo?: ParametroGrupo,
): Promise<RefParametroAnalise[]> {
  let q = supabase
    .from('ref_parametros_analise')
    .select('id, codigo, nome, grupo, unidade, valor_referencia, metodologia, ordem_exibicao, ativo, created_at')
    .eq('ativo', true)
    .order('ordem_exibicao', { ascending: true });

  if (grupo) q = q.eq('grupo', grupo);

  const { data, error } = await q;
  if (error) throw new Error(`Erro ao buscar parâmetros de análise: ${error.message}`);
  return data ?? [];
}

/**
 * Alias para `getParametrosAnalise` alinhado com a nomenclatura da spec
 * Sprint 0b. Mesma semântica: lista do catálogo `ref_parametros_analise`
 * com filtro opcional por grupo.
 */
export const listAvailableParameters = getParametrosAnalise;

// ---------------------------------------------------------------------------
// CRUD — Análises físico-químicas
// ---------------------------------------------------------------------------

/**
 * Cria uma nova análise físico-química e bacteriológica em `contrato_analises_fq`.
 * Mantida a assinatura legacy (contractId, licenseId, data) para não quebrar
 * callers. `licenseId` é ignorado: o schema novo deriva a licença via
 * `contratos.licenca_id` e não tem coluna direta na análise.
 *
 * @param contractId ID do contrato
 * @param _licenseId ID da licença (legacy — não persistido na tabela nova)
 * @param data Dados do formulário
 * @returns Análise criada
 */
export const createAnalysis = async (
  contractId: string,
  _licenseId: string,
  data: AnalysisFormData,
): Promise<AnalysisData> => {
  // `data_coleta` é NOT NULL no schema — força default sane se vier vazio
  const base = buildAnaliseFQPayload(data);

  const analysisInsert: AnaliseFQInsert = {
    contrato_id: contractId,
    data_coleta: data.data_coleta,
    ...base,
  };

  const { data: analysis, error } = await supabase
    .from('contrato_analises_fq')
    .insert(analysisInsert)
    .select('*')
    .single();

  if (error) {
    console.error('Erro ao criar análise:', error);
    throw new Error(`Erro ao criar análise: ${error.message}`);
  }

  return analysis as AnalysisData;
};

/**
 * Alternativa "limpa" para criar análise. Recebe `contratoId` + campos
 * planos. Aceita opcionalmente `parametros` como Array<{ parametroId, valor }>
 * — equivalentes futuros a uma child-table (não existe ainda no schema, então
 * são serializados em `parametros_extras` indexados por `parametroId`).
 */
export async function createAnaliseFQ(payload: {
  contratoId: string;
  data_coleta: string;
  hora_coleta?: string | null;
  responsavel_coleta?: string | null;
  identificacao_profissional?: string | null;
  codigo_amostra?: string | null;
  laboratorio?: string | null;
  tipo_coleta?: string | null;
  temperatura_ambiente?: number | null;
  temperatura_amostra?: number | null;
  data_entrada_laboratorio?: string | null;
  observacoes?: string | null;
  parametros?: Array<{ parametroId: string; valor: string | number | null }>;
}): Promise<AnaliseFQRow> {
  const { contratoId, parametros, tipo_coleta, identificacao_profissional, ...rest } = payload;

  // Converte parametros array em mapa por id (única opção sem child-table)
  const parametrosMap: Record<string, string | number | null> = {};
  if (parametros) {
    for (const p of parametros) {
      if (p.valor !== null && p.valor !== '') {
        parametrosMap[p.parametroId] = p.valor;
      }
    }
  }

  const insertPayload: AnaliseFQInsert = {
    contrato_id: contratoId,
    data_coleta: rest.data_coleta,
    hora_coleta: rest.hora_coleta ?? null,
    responsavel_coleta: rest.responsavel_coleta ?? null,
    ind_profissional: identificacao_profissional ?? null,
    codigo_amostra: rest.codigo_amostra ?? null,
    laboratorio: rest.laboratorio ?? null,
    temperatura_ambiente: rest.temperatura_ambiente ?? null,
    temperatura_amostra: rest.temperatura_amostra ?? null,
    data_entrada_laboratorio: rest.data_entrada_laboratorio ?? null,
    observacoes: rest.observacoes ?? null,
    parametros_extras: {
      ...parametrosMap,
      __meta: { tipo_coleta: tipo_coleta ?? null },
    } as AnaliseFQInsert['parametros_extras'],
  };

  const { data: analise, error } = await supabase
    .from('contrato_analises_fq')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) throw new Error(`Erro ao criar análise: ${error.message}`);
  return analise;
}

/**
 * Busca análises por contrato (com join no contrato).
 * @param contractId ID do contrato
 * @returns Array de análises
 */
export const getAnalysesByContract = async (
  contractId: string,
): Promise<AnalysisData[]> => {
  const { data: analyses, error } = await supabase
    .from('contrato_analises_fq')
    .select(`
      *,
      contrato:contratos(id, numero, licenca_id)
    `)
    .eq('contrato_id', contractId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar análises:', error);
    throw new Error(`Erro ao buscar análises: ${error.message}`);
  }

  return (analyses ?? []) as AnalysisData[];
};

/**
 * Lista resumida para tabelas. Não traz o contrato joined nem `parametros_extras`.
 * NOTA: a coluna `status` mencionada na spec original não existe em
 * `contrato_analises_fq` — selecionamos apenas o que de fato existe.
 */
export async function listAnalisesByContract(contratoId: string) {
  const { data, error } = await supabase
    .from('contrato_analises_fq')
    .select('id, data_coleta, hora_coleta, codigo_amostra, laboratorio, created_at')
    .eq('contrato_id', contratoId)
    .order('data_coleta', { ascending: false });
  if (error) throw new Error(`Erro ao listar análises do contrato: ${error.message}`);
  return data ?? [];
}

/**
 * Busca uma análise específica por ID.
 * NOTA: a spec sugeria join com `contrato_analise_parametros`, mas essa
 * tabela não existe no schema atual. Retornamos `parametros_extras` (JSONB)
 * como já vem na própria row.
 */
export const getAnalysisById = async (
  id: string,
): Promise<AnalysisData | null> => {
  const { data: analysis, error } = await supabase
    .from('contrato_analises_fq')
    .select(`
      *,
      contrato:contratos(id, numero, licenca_id)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Nenhum registro
    console.error('Erro ao buscar análise:', error);
    throw new Error(`Erro ao buscar análise: ${error.message}`);
  }

  return analysis as AnalysisData;
};

/**
 * Versão "nova" do getAnalysisById, alinhada com a nomenclatura da spec
 * (`getAnaliseById`). Mesma semântica, retorna a row direta de
 * `contrato_analises_fq` (sem join com contratos).
 */
export async function getAnaliseById(id: string): Promise<AnaliseFQRow | null> {
  const { data, error } = await supabase
    .from('contrato_analises_fq')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao buscar análise: ${error.message}`);
  }
  return data;
}

/**
 * Atualiza uma análise existente.
 */
export const updateAnalysis = async (
  id: string,
  data: Partial<AnalysisFormData>,
): Promise<AnalysisData> => {
  const payload: AnaliseFQUpdate = {
    ...buildAnaliseFQPayload(data),
    updated_at: new Date().toISOString(),
  };

  const { data: analysis, error } = await supabase
    .from('contrato_analises_fq')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Erro ao atualizar análise:', error);
    throw new Error(`Erro ao atualizar análise: ${error.message}`);
  }

  return analysis as AnalysisData;
};

/**
 * Deleta uma análise.
 */
export const deleteAnalysis = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('contrato_analises_fq')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar análise:', error);
    throw new Error(`Erro ao deletar análise: ${error.message}`);
  }
};

/**
 * Mapeia dados da análise do banco para o formulário.
 * Combina `parametros_extras` (JSONB) com as colunas dedicadas `resultado_*`
 * (estas têm prioridade quando ambos coexistem).
 */
export const mapAnalysisToFormData = (analysis: AnalysisData): AnalysisFormData => {
  const rawExtras = (analysis.parametros_extras as Record<string, unknown> | null) ?? {};
  const meta = (rawExtras.__meta as { tipo_coleta?: string | null } | undefined) ?? {};

  // Remove a chave __meta antes de espalhar
  const { __meta: _ignored, ...extras } = rawExtras as Record<string, unknown> & {
    __meta?: unknown;
  };

  const parametros: Record<string, number | null> = {
    ...(extras as Record<string, number | null>),
    // Colunas dedicadas sobrepõem o JSON (são a fonte canônica)
    ph: analysis.resultado_ph ?? null,
    cor: analysis.resultado_cor ?? null,
    turbidez: analysis.resultado_turbidez ?? null,
    temperatura_agua: analysis.resultado_temperatura_agua ?? null,
  };

  return {
    responsavel_coleta: analysis.responsavel_coleta || '',
    identificacao_profissional: analysis.ind_profissional || '',
    laboratorio: analysis.laboratorio || '',
    data_entrada_laboratorio: analysis.data_entrada_laboratorio || '',
    data_coleta: analysis.data_coleta,
    hora_coleta: analysis.hora_coleta || '',
    temperatura_ambiente: analysis.temperatura_ambiente,
    temperatura_amostra: analysis.temperatura_amostra,
    tipo_coleta: meta.tipo_coleta ?? '',
    codigo_amostra: analysis.codigo_amostra || '',
    observacoes: analysis.observacoes || '',
    parametros,
  };
};
