import { supabase } from '@/integrations/supabase/client';

export interface RequerenteReading {
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

