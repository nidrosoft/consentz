// =============================================================================
// Notification Service — Create, list, and manage user notifications
// =============================================================================

import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';
import { getDb } from '@/lib/db';

type NotificationType =
  | 'DOCUMENT_EXPIRING' | 'DOCUMENT_EXPIRED' | 'TRAINING_DUE' | 'TRAINING_EXPIRED'
  | 'TASK_ASSIGNED' | 'TASK_OVERDUE' | 'TASK_COMPLETED' | 'INCIDENT_REPORTED'
  | 'COMPLIANCE_SCORE_CHANGED' | 'GAP_IDENTIFIED' | 'POLICY_REVIEW_DUE'
  | 'REGISTRATION_EXPIRING' | 'INSPECTION_REMINDER' | 'SYSTEM_ALERT';

type GenericNotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

const TYPE_MAP: Record<GenericNotificationType, NotificationType> = {
  INFO: 'POLICY_REVIEW_DUE',
  WARNING: 'DOCUMENT_EXPIRING',
  ERROR: 'SYSTEM_ALERT',
  SUCCESS: 'TASK_COMPLETED',
};

function toNotificationType(
  type: GenericNotificationType | NotificationType,
): NotificationType {
  if (type in TYPE_MAP) {
    return TYPE_MAP[type as GenericNotificationType];
  }
  return type as NotificationType;
}

interface CreateNotificationParams {
  organizationId: string;
  type: GenericNotificationType | NotificationType;
  title: string;
  message: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  userId?: string;
}

interface NotificationListResult {
  data: Array<{
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    createdAt: string;
    actionUrl: string | null;
  }>;
  meta: PaginationMeta;
  unreadCount: number;
}

export class NotificationService {
  /**
   * Create a new notification.
   */
  static async create(params: CreateNotificationParams) {
    const client = await getDb();
    const { data: notification } = await client.from('notifications').insert({
      organization_id: params.organizationId,
      type: toNotificationType(params.type),
      title: params.title,
      message: params.message,
      priority: params.priority ?? 'NORMAL',
      action_url: params.actionUrl ?? null,
      user_id: params.userId ?? null,
    }).select().single();

    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.is_read,
      createdAt: notification.created_at,
      actionUrl: notification.action_url,
    };
  }

  /**
   * List notifications for an organization, sorted by createdAt desc.
   * Includes unread count.
   */
  static async listForUser(
    organizationId: string,
    pagination: PaginationInput,
  ): Promise<NotificationListResult> {
    const skip = (pagination.page - 1) * pagination.pageSize;

    const client = await getDb();
    let dataQuery = client.from('notifications').select('*')
      .eq('organization_id', organizationId);
    let countQuery = client.from('notifications').select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (pagination.search) {
      const s = pagination.search.replace(/%/g, '\\%');
      dataQuery = dataQuery.or(`title.ilike.%${s}%,message.ilike.%${s}%`);
      countQuery = countQuery.or(`title.ilike.%${s}%,message.ilike.%${s}%`);
    }

    const [{ data: notifications }, { count: total }, { count: unreadCount }] = await Promise.all([
      dataQuery
        .order('created_at', { ascending: false })
        .range(skip, skip + pagination.pageSize - 1),
      countQuery,
      client.from('notifications').select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_read', false),
    ]);

    const safeTotal = total ?? 0;
    const totalPages = Math.ceil(safeTotal / pagination.pageSize);
    const meta: PaginationMeta = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: safeTotal,
      totalPages,
      hasMore: pagination.page < totalPages,
    };

    const data = (notifications ?? []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.is_read,
      createdAt: n.created_at,
      actionUrl: n.action_url,
    }));

    return { data, meta, unreadCount: unreadCount ?? 0 };
  }

  /**
   * Mark notifications as read.
   */
  static async markRead(
    organizationId: string,
    notificationIds?: string[],
    markAll?: boolean,
  ): Promise<void> {
    const client = await getDb();
    if (markAll) {
      await client.from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('organization_id', organizationId)
        .eq('is_read', false);
      return;
    }

    if (notificationIds && notificationIds.length > 0) {
      await client.from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', notificationIds)
        .eq('organization_id', organizationId);
    }
  }

  /**
   * Count unread notifications for an organization.
   */
  static async countUnread(organizationId: string): Promise<number> {
    const client = await getDb();
    const { count } = await client.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_read', false);
    return count ?? 0;
  }
}
