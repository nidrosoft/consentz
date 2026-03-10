import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { db } from '@/lib/db';

export const GET = withAuth(async (req, { auth }) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;
  const staffName = searchParams.get('staffName') ?? undefined;

  const credentials = await db.staffCredential.findMany({
    where: {
      organizationId: auth.organizationId,
      ...(status && { status: status as any }),
      ...(staffName && { staffName: { contains: staffName, mode: 'insensitive' as const } }),
    },
    orderBy: { createdAt: 'desc' },
  });

  return apiSuccess(credentials);
});

export const POST = withAuth(async (req, { auth }) => {
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

  const credential = await db.staffCredential.create({
    data: {
      organizationId: auth.organizationId,
      staffName,
      staffEmail: staffEmail ?? null,
      consentzUserId: consentzUserId ?? null,
      credentialType: credentialType as any,
      credentialName,
      issueDate: issueDate ? new Date(issueDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      referenceNumber: referenceNumber ?? null,
      fileUrl: fileUrl ?? null,
    },
  });

  return apiSuccess(credential, undefined, 201);
});
