import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getSupabaseAdmin } from '@/lib/supabase';

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
  const bucket = (formData.get('bucket') as string) || 'evidence';

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
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return ApiErrors.internal(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabaseAdmin.storage
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
