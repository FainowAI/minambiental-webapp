import { supabase } from '@/integrations/supabase/client';
import { dmsToDecimal } from '@/utils/masks';

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
  requerente: (LicenseRequerente & { email?: string | null }) | null;
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
        status,
        data_inicio,
        data_fim,
        usuarios:requerente_id (
          id,
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
        id: license.usuarios.id,
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
  pdfFile: File;
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
    requerente_id: usuario.id, // Agora referencia usuarios.id
    status: 'Ativo', // Padronizar como 'Ativo'
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
      usuarios:requerente_id (
        id,
        cpf,
        nome,
        email
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
    requerente: data.usuarios
      ? {
          id: data.usuarios.id,
          cpf_cnpj: data.usuarios.cpf,
          nome_razao_social: data.usuarios.nome,
          email: data.usuarios.email,
        }
      : null,
  };
};

export interface UpdateLicensePayload {
  id: string;
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
  volumeAnual: string;
  dataInicio: string;
  dataFim: string;
  pdfFile?: File | null;
}

export const updateLicense = async (payload: UpdateLicensePayload) => {
  const usuario = await findUsuarioRequerenteByCNPJ(payload.cnpj);

  if (!usuario?.id) {
    throw new Error('Requerente não encontrado. Cadastre o usuário com perfil Requerente antes de prosseguir.');
  }

  const latitude = dmsToDecimal(payload.latitudeDms);
  const longitude = dmsToDecimal(payload.longitudeDms);
  const volume = Number(payload.volumeAnual.replace(/\./g, '').replace(',', '.')) || Number(payload.volumeAnual);

  let pdfUrl: string | undefined;
  if (payload.pdfFile) {
    pdfUrl = await uploadPdf(payload.pdfFile, usuario.id, payload.numeroLicenca);
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
    requerente_id: usuario.id,
  };

  if (pdfUrl) {
    updateData.pdf_licenca = pdfUrl;
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
