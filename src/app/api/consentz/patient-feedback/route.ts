import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { getAuthenticatedClient } from '@/lib/consentz/client';
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
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  const client = await getAuthenticatedClient(org.consentz_clinic_id);
  const data = await client.getPatientFeedback(from, to);
  return apiSuccess(data);
});
