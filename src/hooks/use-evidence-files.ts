'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, buildQueryString } from '@/lib/api-client';
import { toast } from '@/lib/toast';
import type { EvidenceFileVersion } from '@/types';

/** Fetch all file versions for a specific evidence item */
export function useEvidenceFileVersions(evidenceItemId: string | null) {
  const qs = evidenceItemId ? buildQueryString({ evidenceItemId }) : '';
  return useQuery({
    queryKey: ['evidence-files', evidenceItemId],
    queryFn: () =>
      apiGet<EvidenceFileVersion[]>(`/api/evidence-files${qs}`).then((r) => r.data),
    enabled: !!evidenceItemId,
  });
}

/** Fetch current file versions for a KLOE */
export function useCurrentEvidenceFiles(kloeCode: string | null) {
  const qs = kloeCode ? buildQueryString({ kloeCode }) : '';
  return useQuery({
    queryKey: ['evidence-files', 'current', kloeCode],
    queryFn: () =>
      apiGet<EvidenceFileVersion[]>(`/api/evidence-files${qs}`).then((r) => r.data),
    enabled: !!kloeCode,
  });
}

/** Upload a new evidence file version */
export function useUploadEvidenceFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      evidenceItemId: string;
      kloeCode: string;
      fileUrl: string;
      fileName: string;
      fileType?: string;
      expiresAt?: string | null;
    }) => apiPost<EvidenceFileVersion>('/api/evidence-files', params).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evidence-files', variables.evidenceItemId] });
      queryClient.invalidateQueries({ queryKey: ['evidence-files', 'current', variables.kloeCode] });
      queryClient.invalidateQueries({ queryKey: ['evidence-status'] });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Evidence uploaded', 'New file version has been added.');
    },
    onError: () =>
      toast.error('Upload failed', 'Could not save the evidence file version. Please try again.'),
  });
}
