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
        usuarios:requerente_id (
          cpf,
          nome
        )
      `, { count: 'exact' });

    // Aplicar filtros
    if (filters.cnpj) {
      query = query.ilike('usuarios.cpf', `%${filters.cnpj}%`);
    }
    
    if (filters.requester) {
      query = query.ilike('usuarios.nome', `%${filters.requester}%`);
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
      requerente: license.usuarios ? {
        cpf_cnpj: license.usuarios.cpf,
        nome_razao_social: license.usuarios.nome
      } : null
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

async function findUsuarioRequerenteByCNPJ(cnpj: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, cpf, nome, email, celular, perfil')
    .eq('cpf', cnpj.replace(/\D/g, ''))
    .eq('perfil', 'Requerente')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export const getUsuarioRequerenteByCNPJ = async (cnpj: string) => {
  return await findUsuarioRequerenteByCNPJ(cnpj);
};

// Manter getUsuarioByCNPJ para compatibilidade (sem filtro de perfil)
export const getUsuarioByCNPJ = async (cnpj: string) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, cpf, nome')
    .eq('cpf', cnpj.replace(/\D/g, ''))
    .maybeSingle();

  if (error) throw error;
  return data;
};

async function uploadPdf(file: File, requerenteId: string, numeroLicenca: string): Promise<string> {
  const bucket = 'licencas';
  
  // Sanitizar nome do arquivo
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  
  // Estrutura: pdfs/{requerente_id}/{numero_licenca}_{timestamp}_{arquivo}
  const timestamp = Date.now();
  const filePath = `pdfs/${requerenteId}/${numeroLicenca}_${timestamp}_${sanitizedFileName}`;
  
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
  
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
    
  return publicUrlData.publicUrl;
}

export const createLicense = async (payload: CreateLicensePayload) => {
  // 1) Buscar requerente na tabela usuarios
  const usuario = await findUsuarioRequerenteByCNPJ(payload.cnpj);
  
  if (!usuario?.id) {
    throw new Error('Requerente não encontrado. Cadastre o usuário com perfil Requerente antes de prosseguir.');
  }

  // 2) Upload PDF com estrutura organizada
  const pdfUrl = await uploadPdf(payload.pdfFile, usuario.id, payload.numeroLicenca);

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
    pdf_licenca: pdfUrl,
    prioridade: mapPrioridade(payload.prioridadeUi),
    requerente_id: usuario.id, // Agora referencia usuarios.id
    status: 'Ativo', // Padronizar como 'Ativo'
  });

  if (error) {
    console.error('Insert error:', error);
    throw new Error(`Erro ao criar licença: ${error.message}`);
  }
};
