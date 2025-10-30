import { supabase } from '@/integrations/supabase/client';

export interface CreateRequerenteData {
  nome: string;
  cpf: string;
  email?: string;
  celular?: string;
  contato_medicao_cpf?: string;
  contato_medicao_email?: string;
  contato_medicao_celular?: string;
}

export async function createRequerente(data: CreateRequerenteData) {
  try {
    const { data: result, error } = await supabase.functions.invoke('create-requerente', {
      body: data
    });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(error.message || 'Erro ao criar Requerente');
    }

    if (result?.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error in createRequerente:', error);
    throw error;
  }
}
