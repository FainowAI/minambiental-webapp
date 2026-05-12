import { supabase } from '@/integrations/supabase/client';
import {
  Tables,
  TablesInsert,
  Database,
} from '@/integrations/supabase/types';
import { uploadMonitoringEvidence } from '@/utils/storage';

export type PeriodoMedicao = Database['public']['Enums']['periodo_medicao'];
export type TipoMedidor = Database['public']['Enums']['tipo_medidor'];

export type ContratoAnaliseFq = Tables<'contrato_analises_fq'>;
export type ContratoNdNe = Tables<'contrato_nd_ne'>;
export type ContratoMonitoramento = Tables<'contrato_monitoramentos'>;
export type ContratoMonitoramentoImagem = Tables<'contrato_monitoramento_imagens'>;

export interface PhysicalChemicalAnalysisPayload {
  contractId: string;
  createdBy?: string;
  responsavelColeta?: string;
  indProfissional?: string;
  laboratorio?: string;
  dataEntradaLaboratorio?: string;
  dataColeta: string;
  horaColeta?: string;
  temperaturaAmbiente?: number;
  temperaturaAmostra?: number;
  condicoesTempo?: string;
  codigoAmostra?: string;
  resultadoTemperaturaAgua?: number;
  resultadoCor?: number;
  resultadoTurbidez?: number;
  resultadoPh?: number;
  observacoes?: string;
  parametrosExtras?: Record<string, unknown>;
}

export interface NdNeEntryPayload {
  periodo: PeriodoMedicao;
  dataMedicao?: string;
  responsavel?: string;
  nivelEstatico: number;
  nivelDinamico: number;
  observacoes?: string;
}

export interface NdNeBatchPayload {
  contractId: string;
  createdBy?: string;
  entries: NdNeEntryPayload[];
}

export interface MeterReadingImage {
  file: File;
}

export interface MeterReadingPayload {
  contractId: string;
  createdBy?: string;
  tipo: TipoMedidor;
  referenciaAno: number;
  referenciaMes: number;
  dataLeitura: string;
  leituraDeclarada?: number;
  horaDeclarada?: number;
  leituraApurada: number;
  horaApurada: number;
  leituraAnterior?: number;
  observacoes?: string;
  images?: MeterReadingImage[];
}

function sanitizeNumber(value: number | undefined | null): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (Number.isNaN(value)) {
    return null;
  }
  return value;
}

function sanitizeString(value: string | undefined | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createPhysicalChemicalAnalysis(
  payload: PhysicalChemicalAnalysisPayload
): Promise<ContratoAnaliseFq> {
  const insertData: TablesInsert<'contrato_analises_fq'> = {
    contrato_id: payload.contractId,
    created_by: sanitizeString(payload.createdBy),
    responsavel_coleta: sanitizeString(payload.responsavelColeta),
    ind_profissional: sanitizeString(payload.indProfissional),
    laboratorio: sanitizeString(payload.laboratorio),
    data_entrada_laboratorio: sanitizeString(payload.dataEntradaLaboratorio),
    data_coleta: payload.dataColeta,
    hora_coleta: sanitizeString(payload.horaColeta),
    temperatura_ambiente: sanitizeNumber(payload.temperaturaAmbiente),
    temperatura_amostra: sanitizeNumber(payload.temperaturaAmostra),
    condicoes_tempo: sanitizeString(payload.condicoesTempo),
    codigo_amostra: sanitizeString(payload.codigoAmostra),
    resultado_temperatura_agua: sanitizeNumber(payload.resultadoTemperaturaAgua),
    resultado_cor: sanitizeNumber(payload.resultadoCor),
    resultado_turbidez: sanitizeNumber(payload.resultadoTurbidez),
    resultado_ph: sanitizeNumber(payload.resultadoPh),
    observacoes: sanitizeString(payload.observacoes),
    parametros_extras: payload.parametrosExtras ?? null,
  };

  const { data, error } = await supabase
    .from('contrato_analises_fq')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Falha ao registrar análise físico-química: ${error.message}`);
  }

  return data as ContratoAnaliseFq;
}

export async function createNdNeEntries(
  payload: NdNeBatchPayload
): Promise<ContratoNdNe[]> {
  if (!payload.entries || payload.entries.length === 0) {
    throw new Error('Nenhum registro de ND/NE informado.');
  }

  const insertRows: TablesInsert<'contrato_nd_ne'>[] = payload.entries.map((entry) => ({
    contrato_id: payload.contractId,
    created_by: sanitizeString(payload.createdBy),
    periodo: entry.periodo,
    data_medicao: sanitizeString(entry.dataMedicao),
    responsavel: sanitizeString(entry.responsavel),
    nivel_estatico: entry.nivelEstatico,
    nivel_dinamico: entry.nivelDinamico,
    observacoes: sanitizeString(entry.observacoes),
  }));

  const { data, error } = await supabase
    .from('contrato_nd_ne')
    .insert(insertRows)
    .select();

  if (error) {
    throw new Error(`Falha ao registrar ND/NE: ${error.message}`);
  }

  return (data as ContratoNdNe[]) ?? [];
}

export async function createMeterReading(
  payload: MeterReadingPayload
): Promise<{
  monitoramento: ContratoMonitoramento;
  imagens: ContratoMonitoramentoImagem[];
}> {
  const consumo =
    payload.leituraAnterior !== undefined && payload.leituraAnterior !== null
      ? payload.leituraApurada - payload.leituraAnterior
      : null;

  const insertData: TablesInsert<'contrato_monitoramentos'> = {
    contrato_id: payload.contractId,
    created_by: sanitizeString(payload.createdBy),
    tipo: payload.tipo,
    referencia_ano: payload.referenciaAno,
    referencia_mes: payload.referenciaMes,
    data_leitura: payload.dataLeitura,
    leitura_declarada: sanitizeNumber(payload.leituraDeclarada),
    hora_declarada: sanitizeNumber(payload.horaDeclarada),
    leitura_apurada: payload.leituraApurada,
    hora_apurada: payload.horaApurada,
    leitura_anterior: sanitizeNumber(payload.leituraAnterior),
    consumo: sanitizeNumber(consumo),
    observacoes: sanitizeString(payload.observacoes),
  };

  const { data, error } = await supabase
    .from('contrato_monitoramentos')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Falha ao registrar monitoramento: ${error?.message ?? 'erro desconhecido'}`);
  }

  const monitoramento = data as ContratoMonitoramento;

  if (!payload.images || payload.images.length === 0) {
    return { monitoramento, imagens: [] };
  }

  const uploadedImages: ContratoMonitoramentoImagem[] = [];

  try {
    for (const image of payload.images) {
      const uploadResult = await uploadMonitoringEvidence({
        contractId: payload.contractId,
        monitoramentoId: monitoramento.id,
        file: image.file,
        referenciaAno: payload.referenciaAno,
        referenciaMes: payload.referenciaMes,
      });

      const { data: insertedImage, error: imageError } = await supabase
        .from('contrato_monitoramento_imagens')
        .insert({
          monitoramento_id: monitoramento.id,
          created_by: sanitizeString(payload.createdBy),
          arquivo_url: uploadResult.publicUrl,
          bucket_path: uploadResult.path,
          content_type: image.file.type || null,
          tamanho_bytes: image.file.size ?? null,
        })
        .select()
        .single();

      if (imageError || !insertedImage) {
        throw new Error(`Falha ao salvar metadados da imagem: ${imageError?.message ?? 'erro desconhecido'}`);
      }

      uploadedImages.push(insertedImage as ContratoMonitoramentoImagem);
    }
  } catch (uploadError) {
    await supabase.from('contrato_monitoramentos').delete().eq('id', monitoramento.id);
    throw uploadError;
  }

  return { monitoramento, imagens: uploadedImages };
}

export async function getAnalysesByContract(
  contractId: string
): Promise<ContratoAnaliseFq[]> {
  const { data, error } = await supabase
    .from('contrato_analises_fq')
    .select('*')
    .eq('contrato_id', contractId)
    .order('data_coleta', { ascending: false });

  if (error) {
    throw new Error(`Falha ao buscar análises: ${error.message}`);
  }

  return (data as ContratoAnaliseFq[]) ?? [];
}

export async function getNdNeByContract(
  contractId: string
): Promise<ContratoNdNe[]> {
  const { data, error } = await supabase
    .from('contrato_nd_ne')
    .select('*')
    .eq('contrato_id', contractId)
    .order('periodo', { ascending: true })
    .order('data_medicao', { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Falha ao buscar ND/NE: ${error.message}`);
  }

  return (data as ContratoNdNe[]) ?? [];
}

export async function getMonitoramentosByContract(
  contractId: string,
  params?: { tipo?: TipoMedidor }
): Promise<ContratoMonitoramento[]> {
  let query = supabase
    .from('contrato_monitoramentos')
    .select('*')
    .eq('contrato_id', contractId)
    .order('referencia_ano', { ascending: false })
    .order('referencia_mes', { ascending: false });

  if (params?.tipo) {
    query = query.eq('tipo', params.tipo);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Falha ao buscar monitoramentos: ${error.message}`);
  }

  return (data as ContratoMonitoramento[]) ?? [];
}

export async function getMonitoramentoImages(
  monitoramentoId: string
): Promise<ContratoMonitoramentoImagem[]> {
  const { data, error } = await supabase
    .from('contrato_monitoramento_imagens')
    .select('*')
    .eq('monitoramento_id', monitoramentoId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Falha ao buscar imagens: ${error.message}`);
  }

  return (data as ContratoMonitoramentoImagem[]) ?? [];
}













