import { z } from 'zod';
import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { StripeService } from '@/lib/services/stripe-service';

const checkoutSchema = z.object({
  priceId: z.string().min(1).max(200),
});

export const POST = withAuth(async (req, { auth }) => {
  const body = await req.json();
  const { priceId } = checkoutSchema.parse(body);

  const origin = new URL(req.url).origin;

  const session = await StripeService.createCheckoutSession({
    organizationId: auth.organizationId,
    priceId,
    successUrl: `${origin}/settings/billing?success=1`,
    cancelUrl: `${origin}/settings/billing?cancelled=1`,
  });

  return apiSuccess(session);
});
