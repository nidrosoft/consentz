import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';

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

  if (!file || !(file instanceof File)) {
    return ApiErrors.badRequest('No file provided');
  }

  if (file.size > MAX_FILE_SIZE) {
    return ApiErrors.fileTooLarge();
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return ApiErrors.unsupportedFileType(file.type);
  }

  // Mock upload response — in production this would upload to cloud storage
  const storagePath = `organizations/${auth.organizationId}/evidence/${Date.now()}-${file.name}`;
  const fileUrl = `https://storage.consentz.co.uk/${storagePath}`;

  return apiSuccess({
    fileUrl,
    storagePath,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  }, undefined, 201);
});
