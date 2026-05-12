import { supabase } from '@/integrations/supabase/client';
import { dmsToDecimal } from '@/utils/masks';
import type { Tables } from '@/integrations/supabase/types';
import { createRequerente } from '@/services/requerenteService';

export interface LicenseFilters {
  cnpj?: string;
  requester?: string;
  actType?: string;
  municipality?: string;
  status?: string;
  technician?: string;
  validityStart?: string;
  validityEnd?: string;
}

type LicenseRequerente = {
  id: string;
  cpf_cnpj: string;
  nome_razao_social: string;
  email?: string | null;
  celular?: string | null;
  tipo_pessoa?: string | null;
};

export interface LicenseData {
  id: string;
  numero_licenca: string;
  tipo_ato: string;
  municipio: string;
  status: string;
  data_inicio: string;
  data_fim: string;
  requerente: LicenseRequerente | null;
}

export interface LicenseDetails extends LicenseData {
  objeto_ato: string | null;
  tipo_ponto_interferencia: string | null;
  finalidade_uso: string | null;
  estado: string;
  unidade_planejamento: string | null;
  sistema_aquifero: string | null;
  latitude: number | null;
  longitude: number | null;
  volume_anual_captado: number | null;
  pdf_licenca: string | null;
  requerente: LicenseRequerente | null;
}

const onlyDigits = (value: string) => value.replace(/\D/g, '');

export const getLicenses = async (
  filters: LicenseFilters,
  page: number = 1,
  itemsPerPage: number = 10
) => {
  try {
    let query = supabase
      .from('licencas')
      .select(`
        id,
        numero_licenca,
        tipo_ato,
        municipio,
        status,
        data_inicio,
        data_fim,
        requerente:requerentes!licencas_requerente_id_fkey (
          id,
          nome_razao_social,
          cpf_cnpj,
          email,
          celular,
          tipo_pessoa
        )
      `, { count: 'exact' });

    // Aplicar filtros
    if (filters.cnpj) {
      query = query.ilike('requerente.cpf_cnpj', `%${filters.cnpj}%`);
    }

    if (filters.requester) {
      query = query.ilike('requerente.nome_razao_social', `%${filters.requester}%`);
    }

    if (filters.actType) {
      query = query.eq('tipo_ato', filters.actType);
    }

    if (filters.municipality) {
      query = query.ilike('municipio', `%${filters.municipality}%`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Filtro de validade
    if (filters.validityStart) {
      query = query.gte('data_inicio', filters.validityStart);
    }

    if (filters.validityEnd) {
      query = query.lte('data_fim', filters.validityEnd);
    }

    // Paginação
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching licenses:', error);
      throw error;
    }

    // Normalizar shape do join (requerente já vem com as colunas certas)
    const transformedData = (data || []).map((license: any) => ({
      ...license,
      requerente: license.requerente
        ? {
            id: license.requerente.id,
            cpf_cnpj: license.requerente.cpf_cnpj,
            nome_razao_social: license.requerente.nome_razao_social,
            email: license.requerente.email,
            celular: license.requerente.celular,
            tipo_pessoa: license.requerente.tipo_pessoa,
          }
        : null,
    }));

    return {
      data: transformedData as LicenseData[],
      count: count || 0,
    };
  } catch (error) {
    console.error('Error in getLicenses:', error);
    throw error;
  }
};

// Payload de criação vindo do formulário
export interface CreateLicensePayload {
  numeroLicenca: string;
  cnpj: string;
  nomeRazaoSocial?: string;
  tipoAto: string;
  objetoAto: string;
  tipoPontoInterferencia: string;
  finalidadeUso: string;
  municipio: string;
  estado: string;
  unidadePlanejamento: string;
  sistemaAquifero: string;
  latitudeDms: string;
  longitudeDms: string;
  volumeAnual: string; // string com 2 casas
  dataInicio: string; // ISO yyyy-mm-dd
  dataFim: string;    // ISO yyyy-mm-dd
  pdfFile: File;
}

/**
 * Busca um requerente pelo CPF/CNPJ (apenas dígitos).
 */
export async function getRequerenteByCpfCnpj(
  cpfCnpj: string
): Promise<Tables<'requerentes'> | null> {
  const { data, error } = await supabase
    .from('requerentes')
    .select('*')
    .eq('cpf_cnpj', onlyDigits(cpfCnpj))
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Resolve o requerente_id para uma licença. Se o requerente não existir,
 * cria via edge function (RLS bloqueia insert direto pelo client).
 */
async function resolveRequerenteId(cpfCnpj: string, nomeRazaoSocial?: string): Promise<string> {
  const existing = await getRequerenteByCpfCnpj(cpfCnpj);
  if (existing?.id) return existing.id;

  if (!nomeRazaoSocial) {
    throw new Error(
      'Requerente não encontrado para o CPF/CNPJ informado e nome/razão social não fornecido para cadastro automático.'
    );
  }

  const result = await createRequerente({
    cpf: onlyDigits(cpfCnpj),
    nome: nomeRazaoSocial,
  });

  const newId: string | undefined = result?.id ?? result?.data?.id ?? result?.requerente?.id;
  if (!newId) {
    throw new Error('Falha ao cadastrar Requerente automaticamente.');
  }
  return newId;
}

async function uploadPdf(file: File, requerenteId: string, numeroLicenca: string): Promise<string> {
  const bucket = 'licencas';

  // Estrutura: licencas/{requerente_id}/{numero_licenca}_{timestamp}.pdf
  const timestamp = Date.now();
  const safeNumero = numeroLicenca.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const filePath = `licencas/${requerenteId}/${safeNumero}_${timestamp}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error(`Erro ao fazer upload do PDF: ${uploadError.message}`);
  }

  return filePath;
}

// Bucket 'licencas' é privado — gerar URL assinada (TTL 1h)
// pathOrUrl pode ser path relativo (novos registros) ou URL pública antiga
export async function getLicensePdfSignedUrl(pathOrUrl: string): Promise<string> {
  let storagePath = pathOrUrl;

  const publicPattern = '/storage/v1/object/public/licencas/';
  const signedPattern = '/storage/v1/object/sign/licencas/';

  if (pathOrUrl.includes(publicPattern)) {
    storagePath = pathOrUrl.split(publicPattern)[1];
  } else if (pathOrUrl.includes(signedPattern)) {
    storagePath = pathOrUrl.split(signedPattern)[1].split('?')[0];
  }

  const { data, error } = await supabase.storage
    .from('licencas')
    .createSignedUrl(storagePath, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

function validateLicenseDates(dataInicio: string, dataFim: string) {
  if (new Date(dataFim) <= new Date(dataInicio)) {
    throw new Error('A data de validade deve ser posterior à data de início.');
  }
}

export const createLicense = async (payload: CreateLicensePayload) => {
  // 0) Validar datas (cliente-side; constraint de DB também protege)
  validateLicenseDates(payload.dataInicio, payload.dataFim);

  // 1) Resolver requerente (busca em `requerentes`; cria via edge function se não existir)
  const requerenteId = await resolveRequerenteId(payload.cnpj, payload.nomeRazaoSocial);

  // 2) Upload PDF com estrutura organizada
  const pdfPath = await uploadPdf(payload.pdfFile, requerenteId, payload.numeroLicenca);

  // 3) Conversões de dados
  const latitude = dmsToDecimal(payload.latitudeDms);
  const longitude = dmsToDecimal(payload.longitudeDms);
  const volume = Number(payload.volumeAnual.replace(/\./g, '').replace(',', '.')) || Number(payload.volumeAnual);

  // 4) Inserir licença no banco
  const { error } = await supabase.from('licencas').insert({
    numero_licenca: payload.numeroLicenca,
    tipo_ato: payload.tipoAto,
    objeto_ato: payload.objetoAto,
    tipo_ponto_interferencia: payload.tipoPontoInterferencia,
    finalidade_uso: payload.finalidadeUso,
    municipio: payload.municipio,
    estado: payload.estado,
    unidade_planejamento: payload.unidadePlanejamento,
    sistema_aquifero: payload.sistemaAquifero,
    latitude: latitude,
    longitude: longitude,
    volume_anual_captado: Number.isFinite(volume) ? volume : null,
    data_inicio: payload.dataInicio,
    data_fim: payload.dataFim,
    pdf_licenca: pdfPath,
    requerente_id: requerenteId,
    status: 'Ativo',
  });

  if (error) {
    console.error('Insert error:', error);
    throw new Error(`Erro ao criar licença: ${error.message}`);
  }
};

export const getLicenseById = async (id: string): Promise<LicenseDetails | null> => {
  const { data, error } = await supabase
    .from('licencas')
    .select(`
      id,
      numero_licenca,
      tipo_ato,
      objeto_ato,
      tipo_ponto_interferencia,
      finalidade_uso,
      municipio,
      estado,
      unidade_planejamento,
      sistema_aquifero,
      latitude,
      longitude,
      volume_anual_captado,
      data_inicio,
      data_fim,
      status,
      pdf_licenca,
      requerente:requerentes!licencas_requerente_id_fkey (
        id,
        nome_razao_social,
        cpf_cnpj,
        email,
        celular,
        tipo_pessoa
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching license by id:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  const requerenteRow: any = (data as any).requerente;

  return {
    id: data.id,
    numero_licenca: data.numero_licenca,
    tipo_ato: data.tipo_ato,
    objeto_ato: data.objeto_ato,
    tipo_ponto_interferencia: data.tipo_ponto_interferencia,
    finalidade_uso: data.finalidade_uso,
    municipio: data.municipio,
    estado: data.estado,
    unidade_planejamento: data.unidade_planejamento,
    sistema_aquifero: data.sistema_aquifero,
    latitude: data.latitude,
    longitude: data.longitude,
    volume_anual_captado: data.volume_anual_captado,
    data_inicio: data.data_inicio,
    data_fim: data.data_fim,
    status: data.status,
    pdf_licenca: data.pdf_licenca,
    requerente: requerenteRow
      ? {
          id: requerenteRow.id,
          cpf_cnpj: requerenteRow.cpf_cnpj,
          nome_razao_social: requerenteRow.nome_razao_social,
          email: requerenteRow.email,
          celular: requerenteRow.celular,
          tipo_pessoa: requerenteRow.tipo_pessoa,
        }
      : null,
  };
};

export interface UpdateLicensePayload {
  id: string;
  numeroLicenca: string;
  cnpj: string;
  nomeRazaoSocial?: string;
  tipoAto: string;
  objetoAto: string;
  tipoPontoInterferencia: string;
  finalidadeUso: string;
  municipio: string;
  estado: string;
  unidadePlanejamento: string;
  sistemaAquifero: string;
  latitudeDms: string;
  longitudeDms: string;
  volumeAnual: string;
  dataInicio: string;
  dataFim: string;
  pdfFile?: File | null;
}

export const updateLicense = async (payload: UpdateLicensePayload) => {
  validateLicenseDates(payload.dataInicio, payload.dataFim);

  const requerenteId = await resolveRequerenteId(payload.cnpj, payload.nomeRazaoSocial);

  const latitude = dmsToDecimal(payload.latitudeDms);
  const longitude = dmsToDecimal(payload.longitudeDms);
  const volume = Number(payload.volumeAnual.replace(/\./g, '').replace(',', '.')) || Number(payload.volumeAnual);

  let pdfPath: string | undefined;
  if (payload.pdfFile) {
    pdfPath = await uploadPdf(payload.pdfFile, requerenteId, payload.numeroLicenca);
  }

  const updateData: Record<string, unknown> = {
    numero_licenca: payload.numeroLicenca,
    tipo_ato: payload.tipoAto,
    objeto_ato: payload.objetoAto,
    tipo_ponto_interferencia: payload.tipoPontoInterferencia,
    finalidade_uso: payload.finalidadeUso,
    municipio: payload.municipio,
    estado: payload.estado,
    unidade_planejamento: payload.unidadePlanejamento,
    sistema_aquifero: payload.sistemaAquifero,
    latitude: latitude,
    longitude: longitude,
    volume_anual_captado: Number.isFinite(volume) ? volume : null,
    data_inicio: payload.dataInicio,
    data_fim: payload.dataFim,
    requerente_id: requerenteId,
  };

  if (pdfPath) {
    updateData.pdf_licenca = pdfPath;
  }

  const { error } = await supabase
    .from('licencas')
    .update(updateData)
    .eq('id', payload.id);

  if (error) {
    console.error('Update error:', error);
    throw new Error(`Erro ao atualizar licença: ${error.message}`);
  }
};

// ============================================================================
// Lookup helpers — alimentam <Select> no formulário de licenças.
// As colunas correspondentes em `licencas` continuam TEXT por ora (migração
// 015 ainda não converteu para FK).
// ============================================================================

export interface RefOption {
  codigo: string;
  nome: string;
}

export async function getRefTiposAto(): Promise<RefOption[]> {
  const { data, error } = await supabase
    .from('ref_tipos_ato' as any)
    .select('codigo, nome')
    .eq('ativo', true)
    .order('nome');
  if (error) throw error;
  return (data ?? []) as RefOption[];
}

export async function getRefFinalidadesUso(): Promise<RefOption[]> {
  const { data, error } = await supabase
    .from('ref_finalidades_uso' as any)
    .select('codigo, nome')
    .eq('ativo', true)
    .order('nome');
  if (error) throw error;
  return (data ?? []) as RefOption[];
}

export async function getRefMunicipiosMs(): Promise<RefOption[]> {
  const { data, error } = await supabase
    .from('ref_municipios_ms' as any)
    .select('codigo, nome')
    .eq('ativo', true)
    .order('nome');
  if (error) throw error;
  return (data ?? []) as RefOption[];
}

export async function getRefSistemasAquiferos(): Promise<RefOption[]> {
  const { data, error } = await supabase
    .from('ref_sistemas_aquiferos' as any)
    .select('codigo, nome')
    .eq('ativo', true)
    .order('nome');
  if (error) throw error;
  return (data ?? []) as RefOption[];
}

export async function getRefUnidadesPlanejamento(): Promise<RefOption[]> {
  const { data, error } = await supabase
    .from('ref_unidades_planejamento' as any)
    .select('codigo, nome')
    .eq('ativo', true)
    .order('nome');
  if (error) throw error;
  return (data ?? []) as RefOption[];
}
