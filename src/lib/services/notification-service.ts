// =============================================================================
// Notification Service — Create, list, and manage user notifications
// =============================================================================

import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';
import { db } from '@/lib/db';
import type { NotificationType as PrismaNotificationType, NotificationPriority } from '@prisma/client';

type GenericNotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

const TYPE_MAP: Record<GenericNotificationType, PrismaNotificationType> = {
  INFO: 'POLICY_REVIEW_DUE',
  WARNING: 'DOCUMENT_EXPIRING',
  ERROR: 'SYSTEM_ALERT',
  SUCCESS: 'TASK_COMPLETED',
};

function toPrismaType(
  type: GenericNotificationType | PrismaNotificationType,
): PrismaNotificationType {
  if (type in TYPE_MAP) {
    return TYPE_MAP[type as GenericNotificationType];
  }
  return type as PrismaNotificationType;
}

interface CreateNotificationParams {
  organizationId: string;
  type: GenericNotificationType | PrismaNotificationType;
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
    type: PrismaNotificationType;
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
    const notification = await db.notification.create({
      data: {
        organizationId: params.organizationId,
        type: toPrismaType(params.type),
        title: params.title,
        message: params.message,
        priority: (params.priority as NotificationPriority) ?? 'NORMAL',
        actionUrl: params.actionUrl ?? null,
        userId: params.userId ?? null,
      },
    });

    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      actionUrl: notification.actionUrl,
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
    const where: { organizationId: string; OR?: Array<{ title?: { contains: string; mode: 'insensitive' }; message?: { contains: string; mode: 'insensitive' } }> } = {
      organizationId,
    };

    if (pagination.search) {
      where.OR = [
        { title: { contains: pagination.search, mode: 'insensitive' } },
        { message: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { organizationId, isRead: false },
      }),
    ]);

    const totalPages = Math.ceil(total / pagination.pageSize);
    const meta: PaginationMeta = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPages,
      hasMore: pagination.page < totalPages,
    };

    const data = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
      actionUrl: n.actionUrl,
    }));

    return { data, meta, unreadCount };
  }

  /**
   * Mark notifications as read.
   * If markAll is true, marks all notifications for the organization as read.
   * Otherwise marks only the specified IDs (filtered by organization).
   */
  static async markRead(
    organizationId: string,
    notificationIds?: string[],
    markAll?: boolean,
  ): Promise<void> {
    if (markAll) {
      await db.notification.updateMany({
        where: { organizationId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return;
    }

    if (notificationIds && notificationIds.length > 0) {
      await db.notification.updateMany({
        where: {
          id: { in: notificationIds },
          organizationId,
        },
        data: { isRead: true, readAt: new Date() },
      });
    }
  }

  /**
   * Count unread notifications for an organization.
   */
  static async countUnread(organizationId: string): Promise<number> {
    return db.notification.count({
      where: { organizationId, isRead: false },
    });
  }
}
