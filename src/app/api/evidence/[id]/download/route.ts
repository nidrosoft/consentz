import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { ApiErrors, apiSuccess } from '@/lib/api-response';
import { EvidenceService } from '@/lib/services/evidence-service';
import { getDb } from '@/lib/db';

export const GET = withAuth(async (_req, { params }) => {
  const evidence = await EvidenceService.getById(params.id);
  if (!evidence) {
    return ApiErrors.notFound('Evidence');
  }

  const fileUrl: string | undefined = evidence.file_url;
  if (!fileUrl) {
    return ApiErrors.badRequest('No file associated with this evidence');
  }

  const client = await getDb();

  const bucket = 'evidence';
  let storagePath = fileUrl;

  const publicBase = `/storage/v1/object/public/${bucket}/`;
  const idx = fileUrl.indexOf(publicBase);
  if (idx !== -1) {
    storagePath = fileUrl.slice(idx + publicBase.length);
  }

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(storagePath, 300);

  if (error || !data?.signedUrl) {
    return ApiErrors.internal('Could not generate download link');
  }

  return NextResponse.redirect(data.signedUrl, 302);
});
