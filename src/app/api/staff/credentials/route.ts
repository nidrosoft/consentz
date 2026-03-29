import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const GET = withAuth(async (req, { auth }) => {
  const client = await getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;
  const staffName = searchParams.get('staffName') ?? undefined;

  let query = client.from('staff_credentials')
    .select('*')
    .eq('organization_id', auth.organizationId);

  if (status) {
    query = query.eq('status', status);
  }
  if (staffName) {
    query = query.ilike('staff_name', `%${staffName}%`);
  }

  const { data: credentials } = await query.order('created_at', { ascending: false });

  return apiSuccess(credentials ?? []);
});

export const POST = withAuth(async (req, { auth }) => {
  const client = await getDb();
  requireMinRole(auth, 'STAFF');

  const body = await req.json();
  const {
    staffName,
    staffEmail,
    consentzUserId,
    credentialType,
    credentialName,
    issueDate,
    expiryDate,
    referenceNumber,
    fileUrl,
  } = body as {
    staffName: string;
    staffEmail?: string;
    consentzUserId?: number;
    credentialType: string;
    credentialName: string;
    issueDate?: string;
    expiryDate?: string;
    referenceNumber?: string;
    fileUrl?: string;
  };

  const { data: credential } = await client.from('staff_credentials')
    .insert({
      organization_id: auth.organizationId,
      staff_name: staffName,
      staff_email: staffEmail ?? null,
      consentz_user_id: consentzUserId ?? null,
      credential_type: credentialType,
      credential_name: credentialName,
      issue_date: issueDate ? new Date(issueDate).toISOString() : null,
      expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
      reference_number: referenceNumber ?? null,
      file_url: fileUrl ?? null,
    })
    .select()
    .single();

  return apiSuccess(credential, undefined, 201);
});
