import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  usuario_id: string;
  licenca_id: string | null;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean | null;
  data_envio: string | null;
  created_at: string | null;
}

export interface NotificationWithContract extends Notification {
  contractId: string | null;
}

/**
 * Busca todas as notificações não lidas do usuário atual
 * userId deve ser o auth_user_id (UUID do Supabase Auth)
 * A RLS policy mostra que usuario_id = auth.uid(), então usamos o userId diretamente
 */
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', userId)
      .eq('lida', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getNotifications:', error);
    throw error;
  }
};

/**
 * Marca uma notificação como lida
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in markAsRead:', error);
    throw error;
  }
};

/**
 * Remove uma notificação (fechar durante a sessão)
 */
export const dismissNotification = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error dismissing notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in dismissNotification:', error);
    throw error;
  }
};

/**
 * Deleta uma notificação definitivamente
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    throw error;
  }
};

/**
 * Busca o ID do contrato relacionado a uma licença
 * Retorna o primeiro contrato encontrado para a licença
 */
export const getContractIdFromLicense = async (licenseId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('contratos')
      .select('id')
      .eq('licenca_id', licenseId)
      .limit(1)
      .single();

    if (error) {
      // Se não encontrar contrato, retorna null (não é erro crítico)
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching contract from license:', error);
      throw error;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in getContractIdFromLicense:', error);
    return null;
  }
};

/**
 * Busca notificações com informações do contrato incluídas
 */
export const getNotificationsWithContract = async (userId: string): Promise<NotificationWithContract[]> => {
  try {
    const notifications = await getNotifications(userId);
    
    // Buscar contractId para cada notificação que tem licenca_id
    const notificationsWithContract = await Promise.all(
      notifications.map(async (notification) => {
        let contractId: string | null = null;
        
        if (notification.licenca_id) {
          contractId = await getContractIdFromLicense(notification.licenca_id);
        }
        
        return {
          ...notification,
          contractId,
        };
      })
    );

    return notificationsWithContract;
  } catch (error) {
    console.error('Error in getNotificationsWithContract:', error);
    throw error;
  }
};

/**
 * Cria notificação para o requerente
 * @param requerenteUserId auth_user_id do requerente
 * @param licenseId ID da licença
 * @param titulo Título da notificação
 * @param mensagem Mensagem da notificação
 */
export const createNotificationForRequerente = async (
  requerenteUserId: string,
  licenseId: string,
  titulo: string,
  mensagem: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notificacoes')
      .insert({
        usuario_id: requerenteUserId,
        licenca_id: licenseId,
        tipo: 'nova_edicao_solicitada',
        titulo,
        mensagem,
        lida: false,
        data_envio: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating notification for requerente:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in createNotificationForRequerente:', error);
    throw error;
  }
};

