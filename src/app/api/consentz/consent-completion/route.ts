import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { ConsentzClient } from '@/lib/consentz/client';
import { db } from '@/lib/db';

export const GET = withAuth(async (req, { auth }) => {
  const org = await db.organization.findUnique({
    where: { id: auth.organizationId },
    select: { consentzClinicId: true },
  });

  if (!org?.consentzClinicId) {
    return ApiErrors.badRequest('Consentz integration not configured');
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate') ?? undefined;
  const endDate = searchParams.get('endDate') ?? undefined;

  const client = new ConsentzClient({
    sessionToken: process.env.CONSENTZ_SESSION_TOKEN ?? '',
    clinicId: org.consentzClinicId,
  });

  const data = await client.getConsentCompletion(startDate, endDate);
  return apiSuccess(data);
});
