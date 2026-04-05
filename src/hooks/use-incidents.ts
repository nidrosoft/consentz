'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, buildQueryString } from '@/lib/api-client';
import { toast } from '@/lib/toast';

interface IncidentFilters {
  page?: number;
  pageSize?: number;
  category?: string;
  severity?: string;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
}

export function useIncidents(filters: IncidentFilters = {}) {
  const qs = buildQueryString(filters);
  return useQuery({
    queryKey: ['incidents', filters],
    queryFn: () => apiGet<unknown[]>(`/api/incidents${qs}`),
  });
}

export function useIncidentDetail(id: string) {
  return useQuery({
    queryKey: ['incidents', id],
    queryFn: () => apiGet<unknown>(`/api/incidents/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      category: string;
      severity: string;
      occurredAt: string;
      location?: string;
    }) => apiPost<unknown>('/api/incidents', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Incident reported', 'The incident has been logged.');
    },
    onError: () => toast.error('Failed to report incident', 'Please try again.'),
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiPatch<unknown>(`/api/incidents/${id}`, data).then((r) => r.data),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incidents', vars.id] });
      toast.success('Incident updated', 'Changes have been saved.');
    },
    onError: () => toast.error('Failed to update incident', 'Please try again.'),
  });
}
