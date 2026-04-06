'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, buildQueryString } from '@/lib/api-client';
import { toast } from '@/lib/toast';
import type { KloeEvidenceStatus, KloeEvidenceStatusValue } from '@/types';

export function useEvidenceStatus(kloeCode?: string) {
  const qs = kloeCode ? buildQueryString({ kloe: kloeCode }) : '';
  return useQuery({
    queryKey: ['evidence-status', kloeCode ?? 'all'],
    queryFn: () => apiGet<KloeEvidenceStatus[]>(`/api/evidence-status${qs}`).then((r) => r.data),
    enabled: kloeCode !== undefined,
  });
}

export function useAllEvidenceStatus() {
  return useQuery({
    queryKey: ['evidence-status', 'all'],
    queryFn: () => apiGet<KloeEvidenceStatus[]>('/api/evidence-status').then((r) => r.data),
  });
}

export function useSeedEvidenceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceType: string) =>
      apiPost<KloeEvidenceStatus[]>('/api/evidence-status', { action: 'seed', serviceType }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence-status'] });
      toast.success('Evidence items seeded', 'All evidence tracking records have been created.');
    },
    onError: () => toast.error('Seed failed', 'Could not create evidence tracking records.'),
  });
}

export function useUpdateEvidenceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      evidenceItemId: string;
      status?: KloeEvidenceStatusValue;
      linkedPolicyId?: string;
      linkedEvidenceId?: string;
      notes?: string;
    }) => apiPatch<KloeEvidenceStatus>('/api/evidence-status', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence-status'] });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
    },
  });
}
