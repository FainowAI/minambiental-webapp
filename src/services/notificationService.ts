import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// TODO Sprint 0b: vai virar enum no banco
export type TipoNotificacao =
  | 'Vencimento'
  | 'Monitoramento'
  | 'Analise'
  | 'Sistema'
  | 'nova_edicao_solicitada'
  | 'apuracao_disponivel';

export type Notification = Tables<'notificacoes'>;

export interface NotificationWithContract extends Notification {
  contractId: string | null;
}

/**
 * Lista notificações do usuário atual.
 * RLS (migration 014) garante que apenas notificações do usuário autenticado
 * são retornadas — não é necessário passar usuario_id.
 */
export async function listNotifications(filters?: { onlyUnread?: boolean }): Promise<Notification[]> {
  let q = supabase
    .from('notificacoes')
    .select('*')
    .order('data_envio', { ascending: false });

  if (filters?.onlyUnread) {
    q = q.eq('lida', false);
  }

  const { data, error } = await q;
  if (error) {
    throw new Error(`Erro ao listar notificações: ${error.message}`);
  }
  return data ?? [];
}

/**
 * Marca uma notificação como lida.
 * RLS permite update apenas se o usuário for o dono.
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('id', notificationId);

  if (error) {
    throw new Error(`Erro ao marcar notificação como lida: ${error.message}`);
  }
}

/**
 * Marca todas as notificações não lidas do usuário atual como lidas.
 * RLS restringe automaticamente ao escopo do usuário autenticado.
 */
export async function markAllAsRead(): Promise<void> {
  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('lida', false);

  if (error) {
    throw new Error(`Erro ao marcar todas as notificações como lidas: ${error.message}`);
  }
}

/**
 * Conta notificações não lidas do usuário atual.
 * RLS restringe automaticamente ao escopo do usuário autenticado.
 */
export async function countUnread(): Promise<number> {
  const { count, error } = await supabase
    .from('notificacoes')
    .select('*', { count: 'exact', head: true })
    .eq('lida', false);

  if (error) {
    throw new Error(`Erro ao contar notificações não lidas: ${error.message}`);
  }
  return count ?? 0;
}

/**
 * Alias para markAsRead — usado para "fechar" uma notificação na sessão.
 */
export async function dismissNotification(notificationId: string): Promise<void> {
  return markAsRead(notificationId);
}

/**
 * Deleta uma notificação definitivamente.
 * RLS permite delete apenas se o usuário for o dono.
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notificacoes')
    .delete()
    .eq('id', notificationId);

  if (error) {
    throw new Error(`Erro ao deletar notificação: ${error.message}`);
  }
}

/**
 * Criação de notificações é responsabilidade do banco (triggers).
 * Mantido como stub para sinalizar a callers legados.
 */
export async function createNotificationForRequerente(): Promise<never> {
  throw new Error(
    'Notificações são criadas pelo sistema (triggers do banco), não pelo cliente.',
  );
}

/**
 * Busca o ID do contrato relacionado a uma licença.
 * Retorna o primeiro contrato encontrado para a licença.
 */
export async function getContractIdFromLicense(licenseId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('contratos')
    .select('id')
    .eq('licenca_id', licenseId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar contrato da licença: ${error.message}`);
  }
  return data?.id ?? null;
}

/**
 * Lista notificações enriquecidas com o ID do contrato associado (quando houver licença).
 */
export async function getNotificationsWithContract(
  filters?: { onlyUnread?: boolean },
): Promise<NotificationWithContract[]> {
  const notifications = await listNotifications(filters);

  const notificationsWithContract = await Promise.all(
    notifications.map(async (notification) => {
      let contractId: string | null = null;
      if (notification.licenca_id) {
        try {
          contractId = await getContractIdFromLicense(notification.licenca_id);
        } catch {
          contractId = null;
        }
      }
      return { ...notification, contractId };
    }),
  );

  return notificationsWithContract;
}

/**
 * @deprecated Use listNotifications({ onlyUnread: true }) — RLS já filtra pelo usuário.
 */
export async function getNotifications(_userId?: string): Promise<Notification[]> {
  return listNotifications({ onlyUnread: true });
}
