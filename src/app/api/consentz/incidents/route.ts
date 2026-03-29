import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { ConsentzClient } from '@/lib/consentz/client';
import { getDb } from '@/lib/db';

export const GET = withAuth(async (req, { auth }) => {
  const dbClient = await getDb();
  const { data: org } = await dbClient.from('organizations')
    .select('consentz_clinic_id')
    .eq('id', auth.organizationId)
    .single();

  if (!org?.consentz_clinic_id) {
    return ApiErrors.badRequest('Consentz integration not configured');
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;
  const severity = searchParams.get('severity') ?? undefined;

  const client = new ConsentzClient({
    sessionToken: process.env.CONSENTZ_SESSION_TOKEN ?? '',
    clinicId: org.consentz_clinic_id,
  });

  const data = await client.getIncidentFeed(status, severity);
  return apiSuccess(data);
});
