'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api-client';
import { toast } from '@/lib/toast';
import type { Organization, AppUser } from '@/types';

export function useOrganization() {
  return useQuery({
    queryKey: ['organization'],
    queryFn: () => apiGet<Organization>('/api/organization').then((r) => r.data),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Organization>) =>
      apiPatch<Organization>('/api/organization', data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      if (variables?.e3NutritionNaAesthetic !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['compliance'] });
      }
      toast.success('Organisation updated', 'Your changes have been saved.');
    },
    onError: () => toast.error('Update failed', 'Could not update the organisation.'),
  });
}

export function useOrganizationUsers() {
  return useQuery({
    queryKey: ['organization', 'users'],
    queryFn: () => apiGet<AppUser[]>('/api/organization/users').then((r) => r.data),
  });
}
