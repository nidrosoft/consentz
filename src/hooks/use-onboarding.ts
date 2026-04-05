import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api-client';

type OnboardingStepKey = 'org_profile' | 'connect_consentz' | 'upload_evidence' | 'add_staff' | 'review_domains';

export function useMarkOnboardingStep() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (stepKey: OnboardingStepKey) =>
      apiPost('/api/onboarding/progress', { stepKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
    },
  });

  const mark = useCallback(
    (stepKey: OnboardingStepKey) => {
      if (!mutation.isPending) {
        mutation.mutate(stepKey);
      }
    },
    [mutation],
  );

  return mark;
}
