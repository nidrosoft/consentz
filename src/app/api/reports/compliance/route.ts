import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { ComplianceService } from '@/lib/services/compliance-service';
import { db } from '@/lib/db';

export const GET = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const orgId = auth.organizationId;

  const [score, gaps, domainBreakdown] = await Promise.all([
    ComplianceService.getCurrentScore(orgId),
    db.complianceGap.findMany({
      where: { organizationId: orgId },
      orderBy: { severity: 'asc' },
    }),
    db.domainScore.findMany({
      where: { complianceScore: { organizationId: orgId } },
      orderBy: { score: 'asc' },
    }),
  ]);

  const gapsBySeverity: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  const gapsByStatus: Record<string, number> = {
    OPEN: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
  };

  for (const gap of gaps) {
    gapsBySeverity[gap.severity] = (gapsBySeverity[gap.severity] ?? 0) + 1;
    gapsByStatus[gap.status] = (gapsByStatus[gap.status] ?? 0) + 1;
  }

  const [evidenceCount, policyCount, staffCount, trainingCount] = await Promise.all([
    db.evidenceItem.count({ where: { organizationId: orgId, status: { not: 'ARCHIVED' } } }),
    db.policy.count({ where: { organizationId: orgId, status: { not: 'ARCHIVED' } } }),
    db.staffMember.count({ where: { organizationId: orgId, isActive: true } }),
    db.trainingRecord.count({ where: { staffMember: { organizationId: orgId } } }),
  ]);

  return apiSuccess({
    generatedAt: new Date().toISOString(),
    overall: {
      score: score.overall,
      predictedRating: score.predictedRating,
      lastUpdated: score.lastUpdated,
    },
    domains: score.domains,
    gaps: {
      total: gaps.length,
      bySeverity: gapsBySeverity,
      byStatus: gapsByStatus,
    },
    coverage: {
      evidenceCount,
      policyCount,
      staffCount,
      trainingCount,
    },
  });
});
