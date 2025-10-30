import { supabase } from '@/integrations/supabase/client';
import { dmsToDecimal } from '@/utils/masks';

export interface LicenseFilters {
  cnpj?: string;
  requester?: string;
  actType?: string;
  municipality?: string;
  priority?: string;
  status?: string;
  technician?: string;
  validityStart?: string;
  validityEnd?: string;
}

export interface LicenseData {
  id: string;
  numero_licenca: string;
  tipo_ato: string;
  municipio: string;
  prioridade: 'URGENTE' | 'ALTA' | 'MÉDIA' | 'BAIXA';
  status: string;
  data_inicio: string;
  data_fim: string;
  requerente: {
    cpf_cnpj: string;
    nome_razao_social: string;
  } | null;
}

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
        prioridade,
        status,
        data_inicio,
        data_fim,
        pessoas:requerente_id (
          cpf_cnpj,
          nome_razao_social
        )
      `, { count: 'exact' });

    // Aplicar filtros
    if (filters.cnpj) {
      query = query.ilike('pessoas.cpf_cnpj', `%${filters.cnpj}%`);
    }
    
    if (filters.requester) {
      query = query.ilike('pessoas.nome_razao_social', `%${filters.requester}%`);
    }
    
    if (filters.actType) {
      query = query.eq('tipo_ato', filters.actType);
    }
    
    if (filters.municipality) {
      query = query.ilike('municipio', `%${filters.municipality}%`);
    }
    
    if (filters.priority) {
      query = query.eq('prioridade', filters.priority as 'URGENTE' | 'ALTA' | 'MÉDIA' | 'BAIXA');
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

    // Transform data to match expected structure
    const transformedData = (data || []).map((license: any) => ({
      ...license,
      requerente: license.pessoas
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
  prioridadeUi: 'urgente' | 'alta' | 'media' | 'baixa';
  pdfFile: File;
}

function mapPrioridade(ui: CreateLicensePayload['prioridadeUi']): 'URGENTE' | 'ALTA' | 'MÉDIA' | 'BAIXA' {
  switch (ui) {
    case 'urgente': return 'URGENTE';
    case 'alta': return 'ALTA';
    case 'media': return 'MÉDIA';
    default: return 'BAIXA';
  }
}

async function findPessoaByCNPJ(cnpj: string) {
  const { data, error } = await supabase
    .from('pessoas')
    .select('id, cpf_cnpj, nome_razao_social, cidade, estado')
    .eq('cpf_cnpj', cnpj.replace(/\D/g, ''))
    .maybeSingle();

  if (error) throw error;
  return data;
}

export const getPessoaByCNPJ = async (cnpj: string) => {
  return await findPessoaByCNPJ(cnpj);
};

// Busca em usuarios por CPF (usaremos o CNPJ digitado apenas como entrada; a base utiliza cpf em usuarios)
export const getUsuarioByCNPJ = async (cnpj: string) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, cpf, nome')
    .eq('cpf', cnpj.replace(/\D/g, ''))
    .maybeSingle();

  if (error) throw error;
  return data;
};

async function uploadPdf(file: File): Promise<string> {
  const bucket = 'licencas';
  const filePath = `pdfs/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
  const { error: upErr } = await supabase.storage.from(bucket).upload(filePath, file, {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return pub.publicUrl;
}

export const createLicense = async (payload: CreateLicensePayload) => {
  // 1) Requerente
  const pessoa = await findPessoaByCNPJ(payload.cnpj);
  if (!pessoa?.id) {
    throw new Error('Requerente não encontrado. Cadastre o requerente antes de prosseguir.');
  }

  // 2) Upload PDF
  const pdfUrl = await uploadPdf(payload.pdfFile);

  // 3) Conversões
  const latitude = dmsToDecimal(payload.latitudeDms);
  const longitude = dmsToDecimal(payload.longitudeDms);
  const volume = Number(payload.volumeAnual.replace(/\./g, '').replace(',', '.')) || Number(payload.volumeAnual);

  // 4) Insert
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
    pdf_licenca: pdfUrl,
    prioridade: mapPrioridade(payload.prioridadeUi),
    requerente_id: pessoa.id,
    status: 'ATIVA',
  });

  if (error) throw error;
};
