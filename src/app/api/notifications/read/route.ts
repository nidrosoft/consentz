import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { NotificationService } from '@/lib/services/notification-service';
import { markReadSchema } from '@/lib/validations/notification';

export const PATCH = withAuth(async (req, { params, auth }) => {
  const body = await req.json();
  const validated = markReadSchema.parse(body);

  await NotificationService.markRead(
    auth.organizationId,
    validated.notificationIds,
    validated.markAll,
  );

  return apiSuccess({ success: true });
});
