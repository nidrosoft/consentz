'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';

export function useCqcDomains() {
  return useQuery({
    queryKey: ['cqc', 'domains'],
    queryFn: () => apiGet<unknown[]>('/api/cqc/domains').then((r) => r.data),
    staleTime: 1000 * 60 * 60,
  });
}

export function useCqcKloes(domain?: string) {
  return useQuery({
    queryKey: ['cqc', 'kloes', domain],
    queryFn: () =>
      apiGet<unknown[]>(`/api/cqc/kloes${domain ? `?domain=${domain}` : ''}`).then(
        (r) => r.data,
      ),
    staleTime: 1000 * 60 * 60,
  });
}

export function useCqcRegulations() {
  return useQuery({
    queryKey: ['cqc', 'regulations'],
    queryFn: () => apiGet<unknown[]>('/api/cqc/regulations').then((r) => r.data),
    staleTime: 1000 * 60 * 60,
  });
}
