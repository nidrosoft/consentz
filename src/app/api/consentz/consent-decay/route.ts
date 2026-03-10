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
  const startDate = searchParams.get('startDate') ?? '';
  const endDate = searchParams.get('endDate') ?? '';
  const expiringWithinDays = Number(searchParams.get('expiringWithinDays') ?? 30);
  const showOnlyExpired = Number(searchParams.get('showOnlyExpired') ?? 0);

  const client = new ConsentzClient({
    sessionToken: process.env.CONSENTZ_SESSION_TOKEN ?? '',
    clinicId: org.consentzClinicId,
  });

  const data = await client.getConsentDecay(startDate, endDate, expiringWithinDays, showOnlyExpired);
  return apiSuccess(data);
});
