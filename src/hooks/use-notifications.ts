'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api-client';
import { toast } from '@/lib/toast';
import type { Notification } from '@/types';

// =============================================================================
// Notifications List
// =============================================================================

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiGet<Notification[]>('/api/notifications').then((r) => r.data),
    refetchInterval: 30_000,
  });
}

// =============================================================================
// Unread Count (lightweight polling)
// =============================================================================

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: async () => {
      const res = await apiGet<Notification[]>('/api/notifications');
      return res.data.filter((n) => !n.isRead).length;
    },
    refetchInterval: 15_000,
  });
}

// =============================================================================
// Mark As Read
// =============================================================================

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      apiPatch('/api/notifications/read', { notificationIds }),
    onSuccess: (_d, ids) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (ids.length > 1) toast.success('Notifications cleared', 'All notifications marked as read.');
    },
  });
}
