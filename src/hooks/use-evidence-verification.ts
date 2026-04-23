'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api-client';
import { toast } from '@/lib/toast';

export interface VerificationFinding {
  criterion: string;
  met: boolean;
  detail: string;
}

export interface VerificationResult {
  isCompliant: boolean;
  confidenceScore: number;
  complianceScore: number;
  summary: string;
  findings: VerificationFinding[];
  missingElements: string[];
  recommendations: string[];
  documentType: string;
  dateRelevance: 'current' | 'outdated' | 'undated' | 'not_applicable';
}

export interface VerificationResponse {
  verificationStatus: 'verified' | 'rejected' | 'error';
  result: VerificationResult;
  evidenceRequirementId: string;
  kloeCode: string;
}

export function useVerifyEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      evidenceItemId?: string;
      fileVersionId?: string;
      evidenceId?: string;
      kloeCode: string;
      evidenceRequirementId: string;
      documentCategory: string;
      fileName: string;
      fileUrl: string;
      fileType: string;
    }) => {
      const res = await apiPost<VerificationResponse>('/api/evidence/verify', params);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['evidence-files'] });
      queryClient.invalidateQueries({ queryKey: ['evidence-status'] });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      if (data?.verificationStatus === 'verified') {
        toast.success(
          'Evidence verified',
          `AI compliance check passed (${data.result.complianceScore}% compliance score).`,
        );
      } else if (data?.verificationStatus === 'rejected') {
        toast.error(
          'Evidence not compliant',
          data.result.summary || 'The document does not meet the CQC requirement.',
        );
      }
    },
    onError: () => {
      toast.error(
        'Verification failed',
        'AI verification could not be completed. You can retry from the evidence details.',
      );
    },
  });
}
