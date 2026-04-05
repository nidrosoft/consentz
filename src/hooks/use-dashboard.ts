'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import type {
  ComplianceScore, Task, Evidence, ActivityLogEntry, UpcomingDeadline,
} from '@/types';

// =============================================================================
// Dashboard Overview
// =============================================================================

export interface PriorityGap {
  id: string;
  title: string;
  domain: string;
  kloeCode: string;
  severity: string;
  dueDate: string | null;
}

export interface ConsentzMetricEntry {
  value: number | null;
  label: string;
  unit: string;
  domain: string;
}

export type ConsentzMetrics = Record<string, ConsentzMetricEntry> | null;

interface DashboardOverview {
  compliance: ComplianceScore;
  priorityGaps: PriorityGap[];
  consentzDataFreshness: string | null;
  consentzMetrics: ConsentzMetrics;
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
// Consentz Metrics (filtered by domain)
// =============================================================================

export function useConsentzMetricsForDomain(domain: string) {
  const { data, ...rest } = useDashboard();
  const metrics = data?.consentzMetrics;
  const freshness = data?.consentzDataFreshness ?? null;

  if (!metrics) return { data: null as Record<string, ConsentzMetricEntry> | null, freshness, ...rest };

  const domainMetrics = Object.entries(metrics).filter(([, m]) => m.domain === domain);
  return {
    data: domainMetrics.length > 0 ? Object.fromEntries(domainMetrics) as Record<string, ConsentzMetricEntry> : null,
    freshness,
    ...rest,
  };
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
