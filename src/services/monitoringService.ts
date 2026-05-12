import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// =============================================================================
// Sprint 0b: serviço refatorado para o novo modelo de dados.
//
// - Tabela canônica: `contrato_monitoramentos` (a legada `monitoramentos`
//   será dropada pela migration 015).
// - Imagens em `contrato_monitoramento_imagens` (bucket privado
//   `monitoramentos`, acesso via signed URL).
// - Enum `status` em lowercase: 'pendente' | 'aprovado' | 'rejeitado'.
//   Observação: a coluna `status` ainda não está em types.ts (regenerar
//   após 015). Usamos `as any` localmente onde necessário.
// - Enum `tipo` (enum Postgres `tipo_medidor`): 'hidrometro' | 'horimetro'.
// - Schema é normalizado: uma linha por leitura/tipo. Helpers que precisam
//   da visão denormalizada (hidrômetro + horímetro juntos) fazem o merge.
// =============================================================================

export type MonitoramentoStatus = 'pendente' | 'aprovado' | 'rejeitado';
export type TipoMedidor = 'hidrometro' | 'horimetro';

type ContratoMonitoramento = Tables<'contrato_monitoramentos'>;
type ContratoMonitoramentoImagem = Tables<'contrato_monitoramento_imagens'>;

// Status approved alias usado em filtros (lowercase, novo enum).
const STATUS_APROVADO: MonitoramentoStatus = 'aprovado';

export interface RequerenteReading {
  id: string;
  hidrometro_leitura_atual: number | null;
  horimetro_leitura_atual: number | null;
  data_leitura: string;
  observacoes: string | null;
  created_at: string | null;
}

export interface CorpoTecnicoApuracao {
  id: string;
  hidrometro_leitura_atual: number | null;
  horimetro_leitura_atual: number | null;
  data_leitura: string;
  observacoes: string | null;
  created_at: string | null;
}

// -----------------------------------------------------------------------------
// Helpers internos
// -----------------------------------------------------------------------------

/**
 * Mescla múltiplas linhas (uma por `tipo`) do novo schema normalizado em
 * uma única estrutura denormalizada, mantendo compatibilidade com callers
 * que ainda esperam hidrometro/horimetro lado a lado.
 */
function mergeRowsByTipo(
  rows: ContratoMonitoramento[]
): {
  id: string;
  hidrometro_leitura_atual: number | null;
  horimetro_leitura_atual: number | null;
  data_leitura: string;
  observacoes: string | null;
  created_at: string | null;
} | null {
  if (!rows || rows.length === 0) return null;

  const hidro = rows.find((r) => r.tipo === 'hidrometro');
  const hori = rows.find((r) => r.tipo === 'horimetro');
  // Usa qualquer uma das linhas como "âncora" para metadados gerais.
  const anchor = hidro ?? hori ?? rows[0];

  // Preferimos `leitura_apurada` (corpo técnico) e caímos para
  // `leitura_declarada` (requerente). Para horímetro existem variantes
  // `hora_apurada`/`hora_declarada`.
  const hidroValor =
    hidro?.leitura_apurada ?? hidro?.leitura_declarada ?? null;
  const horiValor =
    hori?.hora_apurada ??
    hori?.hora_declarada ??
    hori?.leitura_apurada ??
    hori?.leitura_declarada ??
    null;

  return {
    id: anchor.id,
    hidrometro_leitura_atual: hidroValor,
    horimetro_leitura_atual: horiValor,
    data_leitura: anchor.data_leitura,
    observacoes: anchor.observacoes ?? null,
    created_at: anchor.created_at ?? null,
  };
}

// -----------------------------------------------------------------------------
// Storage / imagens
// -----------------------------------------------------------------------------

/**
 * Gera URL assinada (1h) para um objeto no bucket privado `monitoramentos`.
 * Convenção de path: `monitoramentos/<monitoramento_id>/<timestamp>_<tipo>.jpg`.
 */
export async function getImageSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('monitoramentos')
    .createSignedUrl(storagePath, 60 * 60); // 1h
  if (error) {
    throw new Error(`Erro ao gerar URL assinada: ${error.message}`);
  }
  return data.signedUrl;
}

/**
 * Lista imagens vinculadas a um monitoramento.
 */
export async function listMonitoramentoImagens(
  monitoramentoId: string
): Promise<ContratoMonitoramentoImagem[]> {
  const { data, error } = await supabase
    .from('contrato_monitoramento_imagens')
    .select('*')
    .eq('monitoramento_id', monitoramentoId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar imagens do monitoramento: ${error.message}`);
  }
  return data ?? [];
}

// -----------------------------------------------------------------------------
// Leituras do mês corrente
// -----------------------------------------------------------------------------

/**
 * Verifica se existe leitura do requerente para o mês corrente em um contrato.
 * Observação: o parâmetro mantém o nome `licenseId` para preservar a
 * assinatura existente, mas é tratado como `contrato_id` no novo modelo.
 */
export const checkRequerenteReading = async (
  licenseId: string
): Promise<RequerenteReading | null> => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Identifica usuários requerentes ativos.
    const { data: requerentes } = await supabase
      .from('usuarios')
      .select('auth_user_id')
      .eq('perfil', 'Requerente')
      .eq('status', 'Ativo');

    if (!requerentes || requerentes.length === 0) return null;

    const requerenteAuthIds = requerentes
      .map((r) => r.auth_user_id)
      .filter((id): id is string => id !== null);

    if (requerenteAuthIds.length === 0) return null;

    // Busca todas as linhas (uma por `tipo`) do mês corrente criadas por
    // requerentes para este contrato.
    const { data, error } = await supabase
      .from('contrato_monitoramentos')
      .select('*')
      .eq('contrato_id', licenseId)
      .eq('referencia_mes', currentMonth)
      .eq('referencia_ano', currentYear)
      // `created_by` substitui o antigo `usuario_id` no novo schema.
      .in('created_by', requerenteAuthIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar leitura do requerente: ${error.message}`);
    }

    const merged = mergeRowsByTipo((data ?? []) as ContratoMonitoramento[]);
    return merged;
  } catch (error) {
    console.error('Error in checkRequerenteReading:', error);
    throw error;
  }
};

/**
 * Busca leitura do requerente (mesma resposta de `checkRequerenteReading`).
 * Imagens devem ser carregadas separadamente via `listMonitoramentoImagens`
 * + `getImageSignedUrl`.
 */
export const getRequerenteReadingWithImages = async (
  licenseId: string
): Promise<RequerenteReading | null> => {
  return await checkRequerenteReading(licenseId);
};

/**
 * Verifica se existe apuração APROVADA do corpo técnico para o mês corrente
 * em um contrato.
 */
export const checkCorpoTecnicoApuracao = async (
  licenseId: string
): Promise<CorpoTecnicoApuracao | null> => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const { data: corpoTecnico } = await supabase
      .from('usuarios')
      .select('auth_user_id')
      .eq('perfil', 'Corpo Técnico')
      .eq('status', 'Ativo')
      .eq('status_aprovacao', 'Aprovado');

    if (!corpoTecnico || corpoTecnico.length === 0) return null;

    const corpoTecnicoAuthIds = corpoTecnico
      .map((ct) => ct.auth_user_id)
      .filter((id): id is string => id !== null);

    if (corpoTecnicoAuthIds.length === 0) return null;

    // `status` ainda não está em types.ts (será regenerado pós-015) — cast.
    const query = supabase
      .from('contrato_monitoramentos')
      .select('*')
      .eq('contrato_id', licenseId)
      .eq('referencia_mes', currentMonth)
      .eq('referencia_ano', currentYear)
      .in('created_by', corpoTecnicoAuthIds)
      .order('created_at', { ascending: false });

    const { data, error } = await (query as unknown as {
      eq: (col: string, val: string) => typeof query;
    })
      .eq('status', STATUS_APROVADO);

    if (error) {
      throw new Error(
        `Erro ao buscar apuração do corpo técnico: ${error.message}`
      );
    }

    const merged = mergeRowsByTipo((data ?? []) as ContratoMonitoramento[]);
    return merged;
  } catch (error) {
    console.error('Error in checkCorpoTecnicoApuracao:', error);
    throw error;
  }
};

// -----------------------------------------------------------------------------
// Histórico (12 meses)
// -----------------------------------------------------------------------------

export interface MonthlyReading {
  mes: string;
  ano?: number;
  hidrometro: number | null;
  horimetro: number | null;
  nd: number | null;
  ne: number | null;
  ndneData?: {
    periodo: 'chuvoso' | 'seco';
    tecnico: string | null;
    dataMedicao: string;
    origem: 'chatbot' | 'sistema';
  };
  hidrometroData?: {
    tecnico: string | null;
    dataLeitura: string;
  };
  horimetroData?: {
    tecnico: string | null;
    dataLeitura: string;
  };
}

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * Helper canônico: retorna as linhas brutas do novo schema dos últimos
 * `months` meses (default 12) para um contrato. Inclui todos os status.
 */
export async function getMonitoringHistoryByContract(
  contratoId: string,
  months = 12
): Promise<ContratoMonitoramento[]> {
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - (months - 1),
    1
  );
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;

  // Usa filtro composto sobre (referencia_ano, referencia_mes).
  // Para evitar complexidade com `.or` em ambos os lados, filtramos por
  // `data_leitura` em uma janela equivalente e refinamos em memória.
  const startIso = new Date(startYear, startMonth - 1, 1).toISOString();
  const endIso = new Date(endYear, endMonth, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from('contrato_monitoramentos')
    .select('*')
    .eq('contrato_id', contratoId)
    .gte('data_leitura', startIso)
    .lte('data_leitura', endIso)
    .order('referencia_ano', { ascending: true })
    .order('referencia_mes', { ascending: true });

  if (error) {
    throw new Error(
      `Erro ao buscar histórico de monitoramentos: ${error.message}`
    );
  }

  // Filtro defensivo em memória sobre referencia_ano/mes
  // (cobre casos onde data_leitura difere da referência).
  const rows = (data ?? []) as ContratoMonitoramento[];
  return rows.filter((r) => {
    const ymRow = r.referencia_ano * 12 + r.referencia_mes;
    const ymStart = startYear * 12 + startMonth;
    const ymEnd = endYear * 12 + endMonth;
    return ymRow >= ymStart && ymRow <= ymEnd;
  });
}

/**
 * Busca histórico de leituras dos últimos 12 meses a partir da primeira
 * apuração APROVADA do contrato. Retorna estrutura denormalizada com
 * hidrômetro e horímetro mesclados por mês.
 */
export const getMonitoringHistory = async (
  licenseId: string
): Promise<MonthlyReading[] | null> => {
  try {
    // 1) Primeira apuração aprovada (ordenada por referência).
    // `status` ainda não em types.ts — cast.
    const firstQuery = supabase
      .from('contrato_monitoramentos')
      .select('referencia_mes, referencia_ano, created_at')
      .eq('contrato_id', licenseId)
      .order('referencia_ano', { ascending: true })
      .order('referencia_mes', { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: firstApuracao, error: firstError } = await (firstQuery as unknown as {
      eq: (col: string, val: string) => typeof firstQuery;
    })
      .eq('status', STATUS_APROVADO);

    if (firstError) {
      throw new Error(
        `Erro ao buscar primeira apuração: ${firstError.message}`
      );
    }

    if (!firstApuracao) return null;

    const startMonth = firstApuracao.referencia_mes;
    const startYear = firstApuracao.referencia_ano;

    const months: Array<{ mes: number; ano: number; mesNome: string }> = [];
    for (let i = 0; i < 12; i++) {
      const month = ((startMonth - 1 + i) % 12) + 1;
      const year = startYear + Math.floor((startMonth - 1 + i) / 12);
      months.push({ mes: month, ano: year, mesNome: MESES_PT[month - 1] });
    }

    // 2) Buscar monitoramentos APROVADOS dos 12 meses (todas as linhas,
    // de qualquer `tipo`).
    const histQuery = supabase
      .from('contrato_monitoramentos')
      .select('*')
      .eq('contrato_id', licenseId)
      .in('referencia_mes', months.map((m) => m.mes))
      .in('referencia_ano', months.map((m) => m.ano));

    const { data: monitoramentos, error: histError } = await (histQuery as unknown as {
      eq: (col: string, val: string) => typeof histQuery;
    })
      .eq('status', STATUS_APROVADO);

    if (histError) {
      throw new Error(
        `Erro ao buscar histórico de monitoramentos: ${histError.message}`
      );
    }

    const rows = (monitoramentos ?? []) as ContratoMonitoramento[];

    // 3) Agrupar linhas por (ano, mes) e mesclar por tipo.
    const result: MonthlyReading[] = months.map((monthInfo) => {
      const rowsForMonth = rows.filter(
        (r) =>
          r.referencia_mes === monthInfo.mes &&
          r.referencia_ano === monthInfo.ano
      );
      const merged = mergeRowsByTipo(rowsForMonth);

      return {
        mes: monthInfo.mesNome,
        ano: monthInfo.ano,
        hidrometro: merged?.hidrometro_leitura_atual ?? null,
        horimetro: merged?.horimetro_leitura_atual ?? null,
        // ND/NE não pertencem mais a contrato_monitoramentos —
        // são preenchidos por `getMonitoringHistoryWithNDNE`.
        nd: null,
        ne: null,
      };
    });

    return result;
  } catch (error) {
    console.error('Error in getMonitoringHistory:', error);
    throw error;
  }
};

/**
 * Combina dados mensais (hidrômetro/horímetro) com ND/NE do contrato.
 */
export const getMonitoringHistoryWithNDNE = async (
  licenseId: string,
  contractId: string
): Promise<MonthlyReading[] | null> => {
  try {
    const { fetchNDNERecords } = await import('./ndneService');

    const monthlyData = await getMonitoringHistory(licenseId);
    if (!monthlyData) return null;

    const ndneRecords = await fetchNDNERecords(contractId);
    if (!ndneRecords || ndneRecords.length === 0) {
      return monthlyData;
    }

    const result: MonthlyReading[] = monthlyData.map((monthData) => {
      const mesIndex = MESES_PT.indexOf(monthData.mes);

      const ndneRecord = ndneRecords.find((record) => {
        const recordDate = new Date(record.data_medicao);
        const recordMonth = recordDate.getMonth();
        const recordYear = recordDate.getFullYear();
        return recordMonth === mesIndex && recordYear === monthData.ano;
      });

      if (ndneRecord) {
        return {
          ...monthData,
          nd: ndneRecord.nivel_dinamico,
          ne: ndneRecord.nivel_estatico,
          ndneData: {
            periodo: ndneRecord.periodo,
            tecnico: ndneRecord.tecnico?.nome || ndneRecord.responsavel || null,
            dataMedicao: ndneRecord.data_medicao,
            origem: ndneRecord.origem_cadastro,
          },
        };
      }

      return monthData;
    });

    return result;
  } catch (error) {
    console.error('Error in getMonitoringHistoryWithNDNE:', error);
    throw error;
  }
};
