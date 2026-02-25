'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete, buildQueryString } from '@/lib/api-client';
import type { Evidence, EvidenceType, EvidenceStatus, DomainSlug } from '@/types';

// =============================================================================
// Evidence List
// =============================================================================

interface EvidenceFilters {
  page?: number;
  pageSize?: number;
  category?: EvidenceType;
  status?: EvidenceStatus;
  domain?: DomainSlug;
  search?: string;
}

export function useEvidence(filters: EvidenceFilters = {}) {
  const qs = buildQueryString(filters);

  return useQuery({
    queryKey: ['evidence', filters],
    queryFn: () => apiGet<Evidence[]>(`/api/evidence${qs}`),
  });
}

// =============================================================================
// Evidence Detail
// =============================================================================

export function useEvidenceDetail(id: string) {
  return useQuery({
    queryKey: ['evidence', id],
    queryFn: () => apiGet<Evidence>(`/api/evidence/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

// =============================================================================
// Mutations
// =============================================================================

export function useCreateEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      type: EvidenceType;
      fileName: string;
      fileSize: string;
      expiresAt?: string | null;
      linkedDomains: DomainSlug[];
      linkedKloes: string[];
    }) => apiPost<Evidence>('/api/evidence', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUploadEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/evidence/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Upload failed');
      return json.data as Evidence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
    },
  });
}

export function useUpdateEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      type?: EvidenceType;
      expiresAt?: string | null;
      linkedDomains?: DomainSlug[];
      linkedKloes?: string[];
      status?: EvidenceStatus;
    }) => apiPatch<Evidence>(`/api/evidence/${id}`, data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      queryClient.invalidateQueries({ queryKey: ['evidence', variables.id] });
    },
  });
}

export function useDeleteEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/evidence/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
