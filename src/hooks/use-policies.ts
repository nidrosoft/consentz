'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete, buildQueryString } from '@/lib/api-client';
import { toast } from '@/lib/toast';

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
      apiPost<{ id: string }>('/api/policies', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Policy created', 'New policy has been added.');
    },
    onError: () => toast.error('Failed to create policy', 'Please try again.'),
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
      toast.success('Policy updated', 'Your changes have been saved.');
    },
    onError: () => toast.error('Failed to update policy', 'Please try again.'),
  });
}

export function useApprovePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<unknown>(`/api/policies/${id}/approve`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Policy approved', 'The policy has been approved.');
    },
    onError: () => toast.error('Approval failed', 'Could not approve the policy.'),
  });
}

export function usePublishPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<unknown>(`/api/policies/${id}/publish`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Policy published', 'The policy is now live.');
    },
    onError: () => toast.error('Publish failed', 'Could not publish the policy.'),
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/policies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Policy deleted', 'The policy has been removed.');
    },
    onError: () => toast.error('Failed to delete policy', 'Please try again.'),
  });
}

export interface PolicyTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  linkedKloes: string[];
  linkedRegulations: string[];
}

export function useTemplates() {
  return useQuery({
    queryKey: ['policies', 'templates'],
    queryFn: () => apiGet<PolicyTemplate[]>('/api/policies/templates').then((r) => r.data),
  });
}

export function useGeneratePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { templateId: string; customInstructions?: string }) =>
      apiPost<{ policy: { id: string }; linkedKloes: string[] }>('/api/policies/generate', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Policy generated', 'AI-generated policy is ready for review.');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
        toast.error('Rate limit reached', 'You can generate up to 3 policies every 10 minutes. Please wait and try again.');
      } else {
        toast.error('Generation failed', 'Could not generate the policy. Please try again.');
      }
    },
  });
}
