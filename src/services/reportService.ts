/**
 * Report Service
 * 
 * Serviço para geração de relatórios Excel de monitoramento
 */

import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface MonthlyReading {
  tipo: 'Hidrometro' | 'Horimetro';
  referencia_mes: number;
  leitura_apurada: number | null;
  consumo: number | null;
}

interface LicenseReportData {
  requerente_nome: string;
  hidrometro_readings: (number | null)[];
  horimetro_readings: (number | null)[];
  water_analysis_count: number;
  total_consumption: number;
  contact: string;
}

/**
 * Busca o contrato vigente de uma licença para o ano atual
 */
async function getActiveContract(licenseId: string) {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('contratos')
    .select('*')
    .eq('licenca_id', licenseId)
    .lte('data_inicio', currentDate)
    .gte('previsao_termino', currentDate)
    .order('data_inicio', { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (error) {
    console.error('Erro ao buscar contrato vigente:', error);
    return null;
  }
  
  return data;
}

/**
 * Busca as leituras mensais de um contrato para o ano especificado
 */
async function getMonthlyReadings(contractId: string, year: number): Promise<MonthlyReading[]> {
  const { data, error } = await (supabase as any)
    .from('contrato_monitoramentos')
    .select('tipo, referencia_mes, leitura_apurada, consumo')
    .eq('contrato_id', contractId)
    .eq('referencia_ano', year)
    .order('referencia_mes', { ascending: true });
    
  if (error) {
    console.error('Erro ao buscar leituras mensais:', error);
    return [];
  }
  
  return (data || []) as MonthlyReading[];
}

/**
 * Conta as análises físico-químicas de um contrato no ano especificado
 */
async function getWaterAnalysisCount(contractId: string, year: number): Promise<number> {
  const { count, error } = await (supabase as any)
    .from('contrato_analises_fq')
    .select('id', { count: 'exact', head: true })
    .eq('contrato_id', contractId)
    .gte('data_coleta', `${year}-01-01`)
    .lte('data_coleta', `${year}-12-31`);
    
  if (error) {
    console.error('Erro ao contar análises de água:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Organiza leituras em array de 12 posições (Jan-Dez)
 */
function organizeReadingsByMonth(readings: MonthlyReading[], type: 'Hidrometro' | 'Horimetro'): (number | null)[] {
  const monthlyData: (number | null)[] = Array(12).fill(null);
  
  readings
    .filter(r => r.tipo === type)
    .forEach(reading => {
      const monthIndex = reading.referencia_mes - 1; // Converter para índice 0-11
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex] = reading.leitura_apurada;
      }
    });
  
  return monthlyData;
}

/**
 * Calcula o consumo total (última leitura - primeira leitura)
 */
function calculateTotalConsumption(readings: (number | null)[]): number {
  const validReadings = readings.filter(r => r !== null) as number[];
  if (validReadings.length === 0) return 0;
  
  const firstReading = validReadings[0];
  const lastReading = validReadings[validReadings.length - 1];
  
  return lastReading - firstReading;
}

/**
 * Gera o relatório de monitoramento em formato Excel
 */
export async function generateMonitoringReport(licenseIds: string[]): Promise<void> {
  if (licenseIds.length === 0) {
    throw new Error('Nenhuma licença selecionada');
  }

  const currentYear = new Date().getFullYear();
  const reportData: LicenseReportData[] = [];
  const skippedLicenses: string[] = [];

  // Processar cada licença
  for (const licenseId of licenseIds) {
    try {
      // Buscar dados da licença
      const { data: license, error: licenseError } = await supabase
        .from('licencas')
        .select(`
          id,
          numero_licenca,
          usuarios:requerente_id (
            id,
            nome,
            contato_medicao_cpf,
            contato_medicao_celular
          )
        `)
        .eq('id', licenseId)
        .single();

      if (licenseError || !license) {
        console.error('Erro ao buscar licença:', licenseError);
        skippedLicenses.push(licenseId);
        continue;
      }

      // Buscar contrato vigente
      const contract = await getActiveContract(licenseId);
      
      if (!contract) {
        console.log(`Licença ${license.numero_licenca} não possui contrato vigente`);
        skippedLicenses.push(licenseId);
        continue;
      }

      // Buscar leituras mensais
      const readings = await getMonthlyReadings(contract.id, currentYear);
      
      // Organizar leituras por tipo
      const hidrometroReadings = organizeReadingsByMonth(readings, 'Hidrometro');
      const horimetroReadings = organizeReadingsByMonth(readings, 'Horimetro');
      
      // Buscar contagem de análises
      const analysisCount = await getWaterAnalysisCount(contract.id, currentYear);
      
      // Calcular consumo total
      const totalConsumption = calculateTotalConsumption(hidrometroReadings);
      
      // Formatar contato
      const contactName = contract.nome_contato || 'Não informado';
      const contactPhone = contract.telefone_contato || '';
      const contact = contactPhone ? `${contactName} - ${contactPhone}` : contactName;

      reportData.push({
        requerente_nome: (license.usuarios as any)?.nome || 'Nome não disponível',
        hidrometro_readings: hidrometroReadings,
        horimetro_readings: horimetroReadings,
        water_analysis_count: analysisCount,
        total_consumption: totalConsumption,
        contact: contact,
      });
    } catch (error) {
      console.error(`Erro ao processar licença ${licenseId}:`, error);
      skippedLicenses.push(licenseId);
    }
  }

  if (reportData.length === 0) {
    throw new Error('Nenhuma licença com contrato vigente encontrada');
  }

  // Gerar Excel
  await generateExcelFile(reportData, currentYear);

  // Notificar sobre licenças puladas
  if (skippedLicenses.length > 0) {
    console.warn(`${skippedLicenses.length} licença(s) foram puladas por não possuírem contrato vigente`);
  }
}

/**
 * Gera o arquivo Excel e inicia o download
 */
async function generateExcelFile(data: LicenseReportData[], year: number): Promise<void> {
  // Criar cabeçalho
  const headers = [
    'CLIENTES',
    'leituras',
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    'Análise de água do ano',
    'Consumo Total',
    'Contato'
  ];

  // Criar linhas de dados
  const rows: any[][] = [headers];

  data.forEach(license => {
    // Linha do Hidrômetro
    const hidroRow = [
      license.requerente_nome,
      'Hidrometro',
      ...license.hidrometro_readings.map(r => r !== null ? r : ''),
      license.water_analysis_count,
      license.total_consumption.toFixed(2),
      license.contact
    ];
    rows.push(hidroRow);

    // Linha do Horímetro
    const horiRow = [
      '', // Nome vazio na segunda linha
      'Horímetro',
      ...license.horimetro_readings.map(r => r !== null ? r : ''),
      '', '', '' // Colunas vazias
    ];
    rows.push(horiRow);
  });

  // Criar workbook e worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Definir largura das colunas
  const colWidths = [
    { wch: 30 }, // CLIENTES
    { wch: 12 }, // leituras
    ...Array(12).fill({ wch: 10 }), // Jan-Dez
    { wch: 20 }, // Análise de água
    { wch: 15 }, // Consumo Total
    { wch: 30 }, // Contato
  ];
  ws['!cols'] = colWidths;

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Monitoramento');

  // Gerar arquivo e fazer download
  const fileName = `Relatorio_Monitoramento_${year}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
