// =============================================================================
// Notification Service — Create, list, and manage user notifications
// =============================================================================

import type { NotificationType } from '@/types';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';
import { notificationStore, generateId } from '@/lib/mock-data/store';
import { paginateArray } from '@/lib/pagination';

interface CreateNotificationParams {
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
}

interface NotificationListResult {
  data: ReturnType<typeof notificationStore.getAll>;
  meta: PaginationMeta;
  unreadCount: number;
}

export class NotificationService {
  /**
   * Create a new notification.
   */
  static create(params: CreateNotificationParams) {
    const notification = notificationStore.create({
      id: generateId('notif'),
      title: params.title,
      message: params.message,
      type: params.type,
      isRead: false,
      createdAt: new Date().toISOString(),
      actionUrl: params.actionUrl ?? null,
    });

    return notification;
  }

  /**
   * List notifications for an organization, sorted by createdAt desc.
   * Includes unread count.
   */
  static listForUser(
    organizationId: string,
    pagination: PaginationInput,
  ): NotificationListResult {
    const all = notificationStore.getAll();

    // Sort by createdAt descending
    const sorted = [...all].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Apply search filter if provided
    const filtered = pagination.search
      ? sorted.filter(
          (n) =>
            n.title.toLowerCase().includes(pagination.search!.toLowerCase()) ||
            n.message.toLowerCase().includes(pagination.search!.toLowerCase()),
        )
      : sorted;

    const { data, meta } = paginateArray(filtered, pagination);
    const unreadCount = all.filter((n) => !n.isRead).length;

    return { data, meta, unreadCount };
  }

  /**
   * Mark notifications as read.
   * If markAll is true, marks all notifications as read.
   * Otherwise marks only the specified IDs.
   */
  static markRead(notificationIds?: string[], markAll?: boolean): void {
    if (markAll) {
      const all = notificationStore.filter((n) => !n.isRead);
      for (const notification of all) {
        notificationStore.update(notification.id, { isRead: true });
      }
      return;
    }

    if (notificationIds) {
      for (const id of notificationIds) {
        notificationStore.update(id, { isRead: true });
      }
    }
  }
}
