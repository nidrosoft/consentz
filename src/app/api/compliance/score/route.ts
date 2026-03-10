import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { ComplianceService } from '@/lib/services/compliance-service';
import { AuditService } from '@/lib/services/audit-service';

export const GET = withAuth(async (req, { params, auth }) => {
  const score = await ComplianceService.getCurrentScore(auth.organizationId);
  return apiSuccess(score);
});

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const score = await ComplianceService.recalculate(auth.organizationId);

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'SCORE_RECALCULATED',
    entityType: 'ORGANIZATION',
    entityId: auth.organizationId,
    description: `Compliance score recalculated — overall: ${score.overall}%`,
  });

  return apiSuccess(score);
});
