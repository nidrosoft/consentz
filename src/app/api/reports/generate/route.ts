import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { generateReportSchema } from '@/lib/validations/report';
import { db } from '@/lib/db';

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const body = await req.json();
  const validated = generateReportSchema.parse(body);

  const orgId = auth.organizationId;
  const now = new Date().toISOString();

  let reportData: Record<string, unknown> = {};

  switch (validated.type) {
    case 'full_compliance': {
      const [score, gapCounts, evidenceCount, policyCount, staffCount] = await Promise.all([
        db.complianceScore.findFirst({ where: { organizationId: orgId }, orderBy: { calculatedAt: 'desc' }, include: { domainScores: true } }),
        db.complianceGap.groupBy({ by: ['status'], where: { organizationId: orgId }, _count: true }),
        db.evidenceItem.count({ where: { organizationId: orgId, status: { not: 'ARCHIVED' } } }),
        db.policy.count({ where: { organizationId: orgId, status: { not: 'ARCHIVED' } } }),
        db.staffMember.count({ where: { organizationId: orgId, isActive: true } }),
      ]);

      const gapSummary: Record<string, number> = { total: 0, open: 0, inProgress: 0, resolved: 0 };
      for (const g of gapCounts) {
        gapSummary.total += g._count;
        if (g.status === 'OPEN') gapSummary.open = g._count;
        if (g.status === 'IN_PROGRESS') gapSummary.inProgress = g._count;
        if (g.status === 'RESOLVED') gapSummary.resolved = g._count;
      }

      reportData = {
        type: 'full_compliance',
        generatedAt: now,
        compliance: score ? {
          overall: score.score,
          predictedRating: score.predictedRating,
          domains: score.domainScores.map((d) => ({
            domainName: d.domain,
            score: d.score,
            rating: d.status,
            gapCount: d.totalGaps,
          })),
        } : null,
        gapSummary,
        evidenceCount,
        policyCount,
        staffCount,
      };
      break;
    }

    case 'gap_analysis': {
      const gaps = await db.complianceGap.findMany({ where: { organizationId: orgId } });
      reportData = {
        type: 'gap_analysis',
        generatedAt: now,
        totalGaps: gaps.length,
        bySeverity: {
          CRITICAL: gaps.filter((g) => g.severity === 'CRITICAL').length,
          HIGH: gaps.filter((g) => g.severity === 'HIGH').length,
          MEDIUM: gaps.filter((g) => g.severity === 'MEDIUM').length,
          LOW: gaps.filter((g) => g.severity === 'LOW').length,
        },
      };
      break;
    }

    case 'evidence_summary': {
      const evidence = await db.evidenceItem.findMany({
        where: { organizationId: orgId, status: { not: 'ARCHIVED' } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      const statusCounts = await db.evidenceItem.groupBy({
        by: ['status'],
        where: { organizationId: orgId, status: { not: 'ARCHIVED' } },
        _count: true,
      });

      const byStatus: Record<string, number> = {};
      for (const s of statusCounts) byStatus[s.status] = s._count;

      reportData = {
        type: 'evidence_summary',
        generatedAt: now,
        totalEvidence: Object.values(byStatus).reduce((a, b) => a + b, 0),
        byStatus,
        recentUploads: evidence,
      };
      break;
    }

    case 'staff_compliance': {
      const [staff, training] = await Promise.all([
        db.staffMember.findMany({ where: { organizationId: orgId, isActive: true } }),
        db.trainingRecord.findMany({ where: { staffMember: { organizationId: orgId } } }),
      ]);

      const now30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      reportData = {
        type: 'staff_compliance',
        generatedAt: now,
        totalStaff: staff.length,
        trainingRecords: training.length,
        dbsStatus: {
          clear: staff.filter((s) => s.dbsCertificateDate != null).length,
          pending: staff.filter((s) => !s.dbsCertificateDate).length,
        },
        trainingStatus: {
          valid: training.filter((t) => !t.isExpired && (!t.expiryDate || t.expiryDate > now30)).length,
          expiringSoon: training.filter((t) => !t.isExpired && t.expiryDate && t.expiryDate <= now30 && t.expiryDate > new Date()).length,
          expired: training.filter((t) => t.isExpired).length,
        },
      };
      break;
    }

    default:
      reportData = { type: validated.type, generatedAt: now };
  }

  return apiSuccess(reportData);
});
