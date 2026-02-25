import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { exportSchema } from '@/lib/validations/report';
import { checkRateLimit } from '@/lib/rate-limiter';

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const rateCheck = checkRateLimit(auth.userId, 'export');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const body = await req.json();
  const validated = exportSchema.parse(body);

  // Mock export response — in production this would generate and upload the file
  const fileName = `${validated.reportType}-${new Date().toISOString().split('T')[0]}.${validated.format}`;
  const url = `https://exports.consentz.co.uk/${auth.organizationId}/${fileName}`;

  return apiSuccess({
    url,
    fileName,
    format: validated.format,
    expiresIn: 86400,
  });
});
