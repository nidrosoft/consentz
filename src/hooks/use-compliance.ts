'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, buildQueryString } from '@/lib/api-client';
import type { ComplianceScore, ComplianceGap, GapStatus, GapSeverity, DomainSlug } from '@/types';

// =============================================================================
// Compliance Score
// =============================================================================

export function useComplianceScore() {
  return useQuery({
    queryKey: ['compliance', 'score'],
    queryFn: () => apiGet<ComplianceScore>('/api/compliance/score').then((r) => r.data),
  });
}

export function useRecalculate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<ComplianceScore>('/api/compliance/score').then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// =============================================================================
// Compliance Gaps
// =============================================================================

interface GapFilters {
  page?: number;
  pageSize?: number;
  severity?: GapSeverity;
  status?: GapStatus;
  domain?: DomainSlug;
  search?: string;
}

export function useComplianceGaps(filters: GapFilters = {}) {
  const qs = buildQueryString(filters);

  return useQuery({
    queryKey: ['compliance', 'gaps', filters],
    queryFn: () => apiGet<ComplianceGap[]>(`/api/compliance/gaps${qs}`),
  });
}

export function useGapDetail(id: string) {
  return useQuery({
    queryKey: ['compliance', 'gaps', id],
    queryFn: () => apiGet<ComplianceGap>(`/api/compliance/gaps/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useUpdateGap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: GapStatus; severity?: GapSeverity }) =>
      apiPatch<ComplianceGap>(`/api/compliance/gaps/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
