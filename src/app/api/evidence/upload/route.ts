import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getDb } from '@/lib/db';

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

const MAX_FILE_SIZE = 52_428_800; // 50 MB

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'STAFF');

  const rateCheck = checkRateLimit(auth.userId, 'upload');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const formData = await req.formData();
  const file = formData.get('file');
  const ALLOWED_BUCKETS = new Set(['evidence', 'policies', 'training']);
  const rawBucket = (formData.get('bucket') as string) || 'evidence';
  const bucket = ALLOWED_BUCKETS.has(rawBucket) ? rawBucket : 'evidence';

  if (!file || !(file instanceof File)) {
    return ApiErrors.badRequest('No file provided');
  }

  if (file.size > MAX_FILE_SIZE) {
    return ApiErrors.fileTooLarge();
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return ApiErrors.unsupportedFileType(file.type);
  }

  const year = new Date().getFullYear();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${auth.organizationId}/${bucket}/${year}/${Date.now()}-${sanitizedName}`;

  const arrayBuffer = await file.arrayBuffer();
  const client = await getDb();
  const { data, error } = await client.storage
    .from(bucket)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('[UPLOAD] Storage error:', error.message);
    return ApiErrors.internal('File upload failed. Please try again.');
  }

  const { data: urlData } = client.storage
    .from(bucket)
    .getPublicUrl(data.path);

  const fileUrl = urlData.publicUrl;

  return apiSuccess({
    fileUrl,
    storagePath: data.path,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  }, undefined, 201);
});
