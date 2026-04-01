import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { StripeService } from '@/lib/services/stripe-service';

export const GET = withAuth(async (_req, { auth }) => {
  const sub = await StripeService.getSubscription(auth.organizationId);
  return apiSuccess(sub);
});
