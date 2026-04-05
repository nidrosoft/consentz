'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete, buildQueryString } from '@/lib/api-client';
import { toast } from '@/lib/toast';

interface StaffFilters {
  page?: number;
  pageSize?: number;
  department?: string;
  staffRole?: string;
  isActive?: boolean;
  search?: string;
}

export function useStaff(filters: StaffFilters = {}) {
  const qs = buildQueryString(filters);
  return useQuery({
    queryKey: ['staff', filters],
    queryFn: () => apiGet<unknown[]>(`/api/staff${qs}`),
  });
}

export function useStaffDetail(id: string) {
  return useQuery({
    queryKey: ['staff', id],
    queryFn: () => apiGet<unknown>(`/api/staff/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<unknown>('/api/staff', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Staff member added', 'New staff record has been created.');
    },
    onError: () => toast.error('Failed to add staff', 'Please try again.'),
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiPatch<unknown>(`/api/staff/${id}`, data).then((r) => r.data),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff', vars.id] });
      toast.success('Staff updated', 'Staff record has been updated.');
    },
    onError: () => toast.error('Failed to update staff', 'Please try again.'),
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Staff removed', 'Staff record has been deleted.');
    },
    onError: () => toast.error('Failed to remove staff', 'Please try again.'),
  });
}

export function useTrainingRecords(filters: { page?: number; pageSize?: number; staffId?: string; staffMemberId?: string; status?: string; view?: 'matrix' } = {}) {
  const { staffId, staffMemberId, ...rest } = filters;
  const params = { ...rest, staffMemberId: staffMemberId ?? staffId };
  const qs = buildQueryString(params);
  return useQuery({
    queryKey: ['training', filters],
    queryFn: () => apiGet<unknown[]>(`/api/staff/training${qs}`),
  });
}

export function useCreateTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<unknown>('/api/staff/training', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Training recorded', 'Training record has been saved.');
    },
    onError: () => toast.error('Failed to save training', 'Please try again.'),
  });
}
