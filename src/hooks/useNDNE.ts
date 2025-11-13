import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchNDNERecords,
  createNDNERecord,
  updateNDNERecord,
  fetchNDNERecordById,
  findChatbotRecord,
  NDNEFilters,
  NDNERecord,
} from '@/services/ndneService';
import { Database } from '@/integrations/supabase/types';

type NDNEInsert = Database['public']['Tables']['contrato_nd_ne']['Insert'];
type NDNEUpdate = Database['public']['Tables']['contrato_nd_ne']['Update'];

/**
 * Hook para buscar registros de ND/NE de um contrato
 * @param contractId ID do contrato
 * @param filters Filtros opcionais
 */
export const useNDNERecords = (contractId: string, filters?: NDNEFilters) => {
  return useQuery({
    queryKey: ['nd-ne', contractId, filters],
    queryFn: () => fetchNDNERecords(contractId, filters),
    enabled: !!contractId,
    staleTime: 30000, // Cache por 30 segundos
  });
};

/**
 * Hook para buscar um registro específico de ND/NE
 * @param id ID do registro
 */
export const useNDNERecord = (id: string | null) => {
  return useQuery({
    queryKey: ['nd-ne', id],
    queryFn: () => fetchNDNERecordById(id!),
    enabled: !!id,
  });
};

/**
 * Hook para buscar registro do chatbot para um período específico
 * @param contractId ID do contrato
 * @param periodo Período (chuvoso ou seco)
 */
export const useChatbotRecord = (
  contractId: string,
  periodo: 'chuvoso' | 'seco' | null
) => {
  return useQuery({
    queryKey: ['nd-ne', 'chatbot', contractId, periodo],
    queryFn: () => findChatbotRecord(contractId, periodo!),
    enabled: !!contractId && !!periodo,
  });
};

/**
 * Hook para criar um novo registro de ND/NE
 */
export const useCreateNDNE = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (record: NDNEInsert) => createNDNERecord(record),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nd-ne'] });
      toast({
        title: 'Sucesso!',
        description: 'Registro de ND/NE criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar registro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para atualizar um registro de ND/NE
 */
export const useUpdateNDNE = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: NDNEUpdate }) =>
      updateNDNERecord(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nd-ne'] });
      toast({
        title: 'Sucesso!',
        description: 'Registro atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
