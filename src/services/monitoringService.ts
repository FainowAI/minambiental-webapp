import { supabase } from '@/integrations/supabase/client';

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

/**
 * Verifica se existe leitura do requerente para o mês atual
 * @param licenseId ID da licença
 * @returns Leitura do requerente ou null se não existir
 */
export const checkRequerenteReading = async (
  licenseId: string
): Promise<RequerenteReading | null> => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Primeiro, buscar todos os usuários requerentes ativos
    const { data: requerentes } = await supabase
      .from('usuarios')
      .select('auth_user_id')
      .eq('perfil', 'Requerente')
      .eq('status', 'Ativo');

    if (!requerentes || requerentes.length === 0) {
      return null;
    }

    const requerenteAuthIds = requerentes
      .map((r) => r.auth_user_id)
      .filter((id): id is string => id !== null);

    if (requerenteAuthIds.length === 0) {
      return null;
    }

    // Buscar monitoramentos do mês atual criados por requerentes
    // Como a RLS permite que admins vejam todos, vamos usar uma abordagem diferente
    // Buscar monitoramentos e verificar se o usuario_id está na lista de requerentes
    const { data: monitoramentos, error } = await supabase
      .from('monitoramentos')
      .select(`
        id,
        hidrometro_leitura_atual,
        horimetro_leitura_atual,
        data_leitura,
        observacoes,
        created_at,
        usuario_id
      `)
      .eq('licenca_id', licenseId)
      .eq('mes', currentMonth)
      .eq('ano', currentYear)
      .in('usuario_id', requerenteAuthIds)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching monitoramentos:', error);
      throw error;
    }

    if (!monitoramentos) {
      return null;
    }

    return {
      id: monitoramentos.id,
      hidrometro_leitura_atual: monitoramentos.hidrometro_leitura_atual,
      horimetro_leitura_atual: monitoramentos.horimetro_leitura_atual,
      data_leitura: monitoramentos.data_leitura,
      observacoes: monitoramentos.observacoes,
      created_at: monitoramentos.created_at,
    };
  } catch (error) {
    console.error('Error in checkRequerenteReading:', error);
    throw error;
  }
};

/**
 * Busca leitura do requerente com imagens (se houver)
 */
export const getRequerenteReadingWithImages = async (
  licenseId: string
): Promise<RequerenteReading | null> => {
  return await checkRequerenteReading(licenseId);
};

/**
 * Verifica se existe apuração do corpo técnico para o mês atual
 * @param licenseId ID da licença
 * @returns Apuração do corpo técnico ou null se não existir
 */
export const checkCorpoTecnicoApuracao = async (
  licenseId: string
): Promise<CorpoTecnicoApuracao | null> => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Buscar todos os usuários do corpo técnico ativos
    const { data: corpoTecnico } = await supabase
      .from('usuarios')
      .select('auth_user_id')
      .eq('perfil', 'Corpo Técnico')
      .eq('status', 'Ativo')
      .eq('status_aprovacao', 'Aprovado');

    if (!corpoTecnico || corpoTecnico.length === 0) {
      return null;
    }

    const corpoTecnicoAuthIds = corpoTecnico
      .map((ct) => ct.auth_user_id)
      .filter((id): id is string => id !== null);

    if (corpoTecnicoAuthIds.length === 0) {
      return null;
    }

    // Buscar monitoramentos do mês atual criados pelo corpo técnico com status finalizado
    const { data: monitoramento, error } = await supabase
      .from('monitoramentos')
      .select(`
        id,
        hidrometro_leitura_atual,
        horimetro_leitura_atual,
        data_leitura,
        observacoes,
        created_at,
        usuario_id
      `)
      .eq('licenca_id', licenseId)
      .eq('mes', currentMonth)
      .eq('ano', currentYear)
      .eq('status', 'finalizado')
      .in('usuario_id', corpoTecnicoAuthIds)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching corpo técnico apuracao:', error);
      throw error;
    }

    if (!monitoramento) {
      return null;
    }

    return {
      id: monitoramento.id,
      hidrometro_leitura_atual: monitoramento.hidrometro_leitura_atual,
      horimetro_leitura_atual: monitoramento.horimetro_leitura_atual,
      data_leitura: monitoramento.data_leitura,
      observacoes: monitoramento.observacoes,
      created_at: monitoramento.created_at,
    };
  } catch (error) {
    console.error('Error in checkCorpoTecnicoApuracao:', error);
    throw error;
  }
};

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

/**
 * Busca histórico de monitoramentos dos últimos 12 meses a partir da primeira apuração
 * @param licenseId ID da licença
 * @returns Array com dados dos últimos 12 meses ou null se não houver apurações
 */
export const getMonitoringHistory = async (
  licenseId: string
): Promise<MonthlyReading[] | null> => {
  try {
    // Buscar a primeira apuração (monitoramento mais antigo com status finalizado)
    const { data: firstApuracao, error: firstError } = await supabase
      .from('monitoramentos')
      .select('mes, ano, created_at')
      .eq('licenca_id', licenseId)
      .eq('status', 'finalizado')
      .order('ano', { ascending: true })
      .order('mes', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstError) {
      console.error('Error fetching first apuracao:', firstError);
      throw firstError;
    }

    // Se não houver apuração, retornar null
    if (!firstApuracao) {
      return null;
    }

    // Gerar array com os 12 meses subsequentes a partir da primeira apuração
    const startMonth = firstApuracao.mes;
    const startYear = firstApuracao.ano;
    const months: Array<{ mes: number; ano: number; mesNome: string }> = [];

    for (let i = 0; i < 12; i++) {
      const month = ((startMonth - 1 + i) % 12) + 1;
      const year = startYear + Math.floor((startMonth - 1 + i) / 12);
      
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      
      months.push({
        mes: month,
        ano: year,
        mesNome: monthNames[month - 1],
      });
    }

    // Buscar todos os monitoramentos finalizados desses 12 meses
    const { data: monitoramentos, error: monitoramentosError } = await supabase
      .from('monitoramentos')
      .select('mes, ano, hidrometro_leitura_atual, horimetro_leitura_atual, nd_metros, ne_metros')
      .eq('licenca_id', licenseId)
      .eq('status', 'finalizado')
      .in('mes', months.map(m => m.mes))
      .in('ano', months.map(m => m.ano));

    if (monitoramentosError) {
      console.error('Error fetching monitoramentos:', monitoramentosError);
      throw monitoramentosError;
    }

    // Mapear os dados para cada mês
    const result: MonthlyReading[] = months.map((monthInfo) => {
      // Encontrar monitoramento para este mês/ano
      const monitoramento = monitoramentos?.find(
        (m) => m.mes === monthInfo.mes && m.ano === monthInfo.ano
      );

      return {
        mes: monthInfo.mesNome,
        ano: monthInfo.ano,
        hidrometro: monitoramento?.hidrometro_leitura_atual || null,
        horimetro: monitoramento?.horimetro_leitura_atual || null,
        nd: monitoramento?.nd_metros || null,
        ne: monitoramento?.ne_metros || null,
      };
    });

    return result;
  } catch (error) {
    console.error('Error in getMonitoringHistory:', error);
    throw error;
  }
};

/**
 * Busca histórico de monitoramentos combinando dados mensais (Hidrômetro/Horímetro)
 * com dados semestrais (ND/NE) do contrato
 * @param licenseId ID da licença
 * @param contractId ID do contrato
 * @returns Array com dados combinados dos últimos 12 meses ou null
 */
export const getMonitoringHistoryWithNDNE = async (
  licenseId: string,
  contractId: string
): Promise<MonthlyReading[] | null> => {
  try {
    // Importar serviço de ND/NE
    const { fetchNDNERecords } = await import('./ndneService');

    // 1. Buscar dados mensais de hidrômetro/horímetro
    const monthlyData = await getMonitoringHistory(licenseId);

    if (!monthlyData) {
      return null;
    }

    // 2. Buscar registros de ND/NE do contrato
    const ndneRecords = await fetchNDNERecords(contractId);

    if (!ndneRecords || ndneRecords.length === 0) {
      // Se não houver dados de ND/NE, retornar apenas dados mensais
      return monthlyData;
    }

    // 3. Mapear ND/NE para os meses correspondentes
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const result: MonthlyReading[] = monthlyData.map((monthData) => {
      // Extrair índice do mês (0-11) do nome do mês
      const mesIndex = monthNames.indexOf(monthData.mes);

      // Buscar registro ND/NE para este mês específico
      const ndneRecord = ndneRecords.find((record) => {
        const recordDate = new Date(record.data_medicao);
        const recordMonth = recordDate.getMonth(); // 0-11
        const recordYear = recordDate.getFullYear();

        // Verificar se o mês e ano correspondem
        return recordMonth === mesIndex && recordYear === monthData.ano;
      });

      // Se encontrou registro de ND/NE para este mês, adicionar os dados
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

      // Sem dados de ND/NE para este mês, retornar apenas dados mensais
      return monthData;
    });

    return result;
  } catch (error) {
    console.error('Error in getMonitoringHistoryWithNDNE:', error);
    throw error;
  }
};

