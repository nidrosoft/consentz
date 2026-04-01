import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { StripeService } from '@/lib/services/stripe-service';

export const POST = withAuth(async (req, { auth }) => {
  const body = await req.json();
  const { priceId } = body as { priceId?: string };

  if (!priceId) {
    return ApiErrors.badRequest('priceId is required');
  }

  const origin = new URL(req.url).origin;

  const session = await StripeService.createCheckoutSession({
    organizationId: auth.organizationId,
    priceId,
    successUrl: `${origin}/settings/billing?success=1`,
    cancelUrl: `${origin}/settings/billing?cancelled=1`,
  });

  return apiSuccess(session);
});
