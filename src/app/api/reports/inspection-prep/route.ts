import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AIService } from '@/lib/services/ai-service';
import { AuditService } from '@/lib/services/audit-service';
import { checkRateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';

const inspectionPrepSchema = z.object({
  serviceType: z.enum(['AESTHETIC_CLINIC', 'CARE_HOME']).optional(),
  inspectionDate: z.string().optional(),
});

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const rateCheck = checkRateLimit(auth.userId, 'aiGeneration');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const body = await req.json();
  const validated = inspectionPrepSchema.parse(body);

  const report = await AIService.generateInspectionPrep({
    organizationId: auth.organizationId,
    serviceType: validated.serviceType ?? 'CARE_HOME',
  });

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'INSPECTION_PREP_GENERATED',
    entityType: 'ORGANIZATION',
    entityId: auth.organizationId,
    description: 'Generated inspection preparation report',
  });

  return apiSuccess(report);
});
