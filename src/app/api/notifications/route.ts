import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { parsePagination } from '@/lib/pagination';
import { NotificationService } from '@/lib/services/notification-service';

export const GET = withAuth(async (req, { params, auth }) => {
  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams);

  const result = NotificationService.listForUser(auth.organizationId, pagination);

  return apiSuccess(result.data, {
    ...result.meta,
    unreadCount: result.unreadCount,
  });
});
