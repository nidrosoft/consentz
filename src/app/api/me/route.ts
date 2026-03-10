import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';

export const GET = withAuth(async (req, { params, auth }) => {
  return apiSuccess({
    id: auth.dbUserId,
    userId: auth.userId,
    fullName: auth.fullName,
    email: auth.email,
    role: auth.role,
  });
});
