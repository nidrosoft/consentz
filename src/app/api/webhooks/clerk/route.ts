import { withPublic } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';

export const POST = withPublic(async (req, { params }) => {
  // Mock Clerk webhook handler
  // In production: verify Svix signature, parse event type, handle user/org sync
  return apiSuccess({ received: true });
});
