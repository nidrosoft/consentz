'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiGet<{ id: string; fullName: string; email: string; role: string }>('/api/me').then((r) => r.data),
  });
}
