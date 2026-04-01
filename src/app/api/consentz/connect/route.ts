import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { getDb } from '@/lib/db';

const CONSENTZ_BASE_URL = process.env.CONSENTZ_API_URL || 'https://staging.consentz.com';
const APP_ID = process.env.CONSENTZ_APPLICATION_ID || 'admin';

export const GET = withAuth(async (_req, { auth }) => {
  const dbClient = await getDb();
  const { data: org } = await dbClient.from('organizations')
    .select('consentz_clinic_id, consentz_username')
    .eq('id', auth.organizationId)
    .single();

  return apiSuccess({
    connected: !!org?.consentz_clinic_id,
    clinicId: org?.consentz_clinic_id ?? null,
    username: org?.consentz_username ?? null,
  });
});

export const POST = withAuth(async (req, { auth }) => {
  const body = await req.json();
  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return ApiErrors.badRequest('Username and password are required');
  }

  const loginRes = await fetch(`${CONSENTZ_BASE_URL}/api/v1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-APPLICATION-ID': APP_ID },
    body: JSON.stringify({ username, password, confirmLogin: true }),
  });

  if (!loginRes.ok) {
    const errorText = await loginRes.text().catch(() => '');
    return ApiErrors.badRequest(`Consentz login failed: ${errorText || loginRes.statusText}`);
  }

  const data = await loginRes.json();
  const clinicId = data?.user?.clinic?.id;
  const clinicName = data?.user?.clinic?.name;
  const sessionToken = data?.user?.sessionToken;

  if (!clinicId || !sessionToken) {
    return ApiErrors.badRequest('Invalid Consentz credentials — no clinic found');
  }

  const dbClient = await getDb();
  await dbClient.from('organizations')
    .update({
      consentz_clinic_id: clinicId,
      consentz_username: username,
      consentz_password: password,
    })
    .eq('id', auth.organizationId);

  return apiSuccess({
    connected: true,
    clinicId,
    clinicName,
  });
});

export const DELETE = withAuth(async (_req, { auth }) => {
  const dbClient = await getDb();
  await dbClient.from('organizations')
    .update({
      consentz_clinic_id: null,
      consentz_username: null,
      consentz_password: null,
    })
    .eq('id', auth.organizationId);

  return apiSuccess({ disconnected: true });
});
