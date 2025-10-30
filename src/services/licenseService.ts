import { supabase } from '@/integrations/supabase/client';

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
