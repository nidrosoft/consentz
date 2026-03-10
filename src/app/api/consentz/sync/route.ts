import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { syncConsentzData } from '@/lib/consentz/sync-service';
import { db } from '@/lib/db';

export const POST = withAuth(async (_req, { auth }) => {
  const org = await db.organization.findUnique({
    where: { id: auth.organizationId },
    select: { consentzClinicId: true },
  });

  if (!org?.consentzClinicId) {
    return ApiErrors.badRequest('Consentz integration not configured');
  }

  await syncConsentzData(auth.organizationId);

  return apiSuccess({ synced: true, organizationId: auth.organizationId });
});
