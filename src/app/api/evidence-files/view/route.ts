import { withAuth } from '@/lib/api-handler';
import { ApiErrors, apiSuccess } from '@/lib/api-response';
import { getDb } from '@/lib/db';

export const GET = withAuth(async (req, { auth }) => {
  const url = new URL(req.url);
  const fileId = url.searchParams.get('id');

  if (!fileId) {
    return ApiErrors.badRequest('id query parameter is required');
  }

  const client = await getDb();
  const { data: file } = await client
    .from('evidence_file_versions')
    .select('file_url, file_name, file_type')
    .eq('id', fileId)
    .eq('organization_id', auth.organizationId)
    .maybeSingle();

  if (!file) {
    return ApiErrors.notFound('Evidence file');
  }

  const fileUrl: string = file.file_url;
  const bucket = 'evidence';
  let storagePath = fileUrl;

  const publicBase = `/storage/v1/object/public/${bucket}/`;
  const idx = fileUrl.indexOf(publicBase);
  if (idx !== -1) {
    storagePath = fileUrl.slice(idx + publicBase.length);
  }

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(storagePath, 600); // 10 min

  if (error || !data?.signedUrl) {
    return ApiErrors.internal('Could not generate view link');
  }

  return apiSuccess({
    signedUrl: data.signedUrl,
    fileName: file.file_name,
    fileType: file.file_type,
  });
});
