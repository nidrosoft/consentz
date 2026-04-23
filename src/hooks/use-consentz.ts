'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '@/lib/api-client';
import { toast } from '@/lib/toast';
import { useMarkOnboardingStep } from '@/hooks/use-onboarding';

interface ConsentzStatus {
  connected: boolean;
  clinicId: number | null;
  username: string | null;
}

interface LastSyncData {
  synced_at: string | null;
}

export function useConsentzStatus() {
  return useQuery({
    queryKey: ['consentz-status'],
    queryFn: () => apiGet<ConsentzStatus>('/api/consentz/connect').then((r) => r.data),
  });
}

export function useConsentzLastSync(enabled: boolean) {
  return useQuery({
    queryKey: ['consentz-last-sync'],
    queryFn: () => apiGet<LastSyncData>('/api/consentz/last-sync').then((r) => r.data),
    enabled,
  });
}

export function useConsentzConnect() {
  const queryClient = useQueryClient();
  const markOnboardingStep = useMarkOnboardingStep();

  return useMutation({
    mutationFn: (params: { username: string; password: string }) =>
      apiPost<{ connected: boolean; clinicId: number; clinicName: string }>('/api/consentz/connect', params).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consentz-status'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      markOnboardingStep('connect_consentz');
      toast.success('Connected', 'Consentz integration is now active.');
    },
    onError: () => toast.error('Connection failed', 'Could not connect to Consentz.'),
  });
}

export function useConsentzDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiDelete('/api/consentz/connect'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consentz-status'] });
      queryClient.invalidateQueries({ queryKey: ['consentz-last-sync'] });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      queryClient.invalidateQueries({ queryKey: ['evidence-status'] });
      toast.success('Disconnected', 'Consentz integration has been removed.');
    },
    onError: () => toast.error('Disconnect failed', 'Could not disconnect from Consentz.'),
  });
}

export function useConsentzSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<{ synced: boolean }>('/api/consentz/sync', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consentz-last-sync'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['evidence-status'] });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
      toast.success('Sync complete', 'Data has been synced with Consentz.');
    },
    onError: () => toast.error('Sync failed', 'Could not sync with Consentz.'),
  });
}
