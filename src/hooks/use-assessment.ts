'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api-client';
import type { ComplianceScore } from '@/types';

// =============================================================================
// Assessment Types (from store)
// =============================================================================

interface AssessmentAnswer {
  questionId: string;
  questionText: string;
  step: number;
  domain: string;
  kloeCode?: string;
  answerValue: boolean | string | string[] | number;
  answerType: string;
}

interface Assessment {
  id: string;
  organizationId: string;
  userId: string;
  serviceType: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  currentStep: number;
  answers: AssessmentAnswer[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface CalculateResult {
  score: ComplianceScore;
  gapsCreated: number;
  tasksCreated: number;
}

// =============================================================================
// Hooks
// =============================================================================

export function useCurrentAssessment() {
  return useQuery({
    queryKey: ['assessment', 'current'],
    queryFn: () => apiGet<Assessment>('/api/assessment').then((r) => r.data),
  });
}

export function useSaveAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      serviceType: string;
      currentStep: number;
      answers: AssessmentAnswer[];
    }) => apiPost<Assessment>('/api/assessment', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment'] });
    },
  });
}

export function useCalculateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessmentId: string) =>
      apiPost<CalculateResult>('/api/assessment/calculate', { assessmentId }).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment'] });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
