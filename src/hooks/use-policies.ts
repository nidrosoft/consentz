'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete, buildQueryString } from '@/lib/api-client';

interface PolicyFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  domain?: string;
  category?: string;
  search?: string;
}

export function usePolicies(filters: PolicyFilters = {}) {
  const qs = buildQueryString(filters);
  return useQuery({
    queryKey: ['policies', filters],
    queryFn: () => apiGet<unknown[]>(`/api/policies${qs}`),
  });
}

export function usePolicyDetail(id: string) {
  return useQuery({
    queryKey: ['policies', id],
    queryFn: () => apiGet<unknown>(`/api/policies/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePolicyVersions(policyId: string) {
  return useQuery({
    queryKey: ['policies', policyId, 'versions'],
    queryFn: () =>
      apiGet<unknown[]>(`/api/policies/${policyId}/versions`).then((r) => r.data),
    enabled: !!policyId,
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content?: string; category?: string }) =>
      apiPost<unknown>('/api/policies', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; content?: string; status?: string }) =>
      apiPatch<unknown>(`/api/policies/${id}`, data).then((r) => r.data),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['policies', vars.id] });
    },
  });
}

export function useApprovePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<unknown>(`/api/policies/${id}/approve`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}

export function usePublishPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<unknown>(`/api/policies/${id}/publish`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/policies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useGeneratePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; domain?: string; context?: string }) =>
      apiPost<unknown>('/api/policies/generate', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}
