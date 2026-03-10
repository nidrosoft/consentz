'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet, buildQueryString } from '@/lib/api-client';
import type { ActivityLogEntry } from '@/types';

interface AuditFilters {
  page?: number;
  pageSize?: number;
  entityType?: string;
  action?: string;
  search?: string;
}

export function useAuditLog(filters: AuditFilters = {}) {
  const qs = buildQueryString(filters);
  return useQuery({
    queryKey: ['audit', filters],
    queryFn: () => apiGet<ActivityLogEntry[]>(`/api/dashboard/activity${qs}`),
  });
}
