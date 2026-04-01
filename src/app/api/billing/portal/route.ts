import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { StripeService } from '@/lib/services/stripe-service';

export const POST = withAuth(async (req, { auth }) => {
  const origin = new URL(req.url).origin;

  try {
    const session = await StripeService.createBillingPortalSession({
      organizationId: auth.organizationId,
      returnUrl: `${origin}/settings/billing`,
    });
    return apiSuccess(session);
  } catch {
    return ApiErrors.badRequest('No billing account found. Please subscribe first.');
  }
});
