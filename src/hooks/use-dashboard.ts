'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import type {
  ComplianceScore, Task, Evidence, ActivityLogEntry, UpcomingDeadline,
} from '@/types';

// =============================================================================
// Dashboard Overview
// =============================================================================

interface DashboardOverview {
  compliance: ComplianceScore;
  gaps: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    total: number;
  };
  tasks: {
    totalActive: number;
    overdueCount: number;
    dueSoon: Task[];
    userTasks: Task[];
  };
  evidence: {
    total: number;
    expiringSoonCount: number;
    recentUploads: Evidence[];
  };
  staff: {
    totalActive: number;
    dbsExpiringCount: number;
  };
  policies: {
    total: number;
    published: number;
    drafts: number;
    reviewDue: number;
  };
  incidents: {
    thisMonth: number;
    investigating: number;
  };
  activity: ActivityLogEntry[];
  deadlines: UpcomingDeadline[];
  notifications: {
    unreadCount: number;
  };
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => apiGet<DashboardOverview>('/api/dashboard/overview').then((r) => r.data),
  });
}

// =============================================================================
// Activity Feed
// =============================================================================

export function useActivity(page = 1) {
  return useQuery({
    queryKey: ['dashboard', 'activity', page],
    queryFn: () =>
      apiGet<ActivityLogEntry[]>(`/api/dashboard/activity?page=${page}`).then((r) => r.data),
  });
}
