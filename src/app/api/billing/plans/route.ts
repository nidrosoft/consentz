import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { StripeService } from '@/lib/services/stripe-service';

export const GET = withAuth(async () => {
  const plans = await StripeService.getPlans();
  return apiSuccess(plans);
});
