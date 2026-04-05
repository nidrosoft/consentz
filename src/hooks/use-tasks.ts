'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete, buildQueryString } from '@/lib/api-client';
import { toast } from '@/lib/toast';

interface TaskFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  assignee?: string;
  assignedToId?: string;
  domain?: string;
  search?: string;
}

export function useTasks(filters: TaskFilters = {}) {
  const { assignee, ...rest } = filters;
  const params = { ...rest, assignedToId: filters.assignedToId ?? assignee };
  const qs = buildQueryString(params);
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => apiGet<unknown[]>(`/api/tasks${qs}`),
  });
}

export function useTaskDetail(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => apiGet<unknown>(`/api/tasks/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<unknown>('/api/tasks', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task created', 'New task has been added.');
    },
    onError: () => toast.error('Failed to create task', 'Please try again.'),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiPatch<unknown>(`/api/tasks/${id}`, data).then((r) => r.data),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
      toast.success('Task updated', vars.status === 'DONE' ? 'Task marked as complete.' : 'Task has been updated.');
    },
    onError: () => toast.error('Failed to update task', 'Please try again.'),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task deleted', 'The task has been removed.');
    },
    onError: () => toast.error('Failed to delete task', 'Please try again.'),
  });
}
