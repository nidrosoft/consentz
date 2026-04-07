import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { DashboardService } from '@/lib/services/dashboard-service';

export const maxDuration = 30;

export const GET = withAuth(async (req, { params, auth }) => {
  const overview = await DashboardService.getOverview({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
  });

  return apiSuccess(overview);
});
