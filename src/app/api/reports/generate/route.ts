import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { generateReportSchema } from '@/lib/validations/report';
import {
  complianceScoreStore,
  gapStore,
  evidenceStore,
  staffStore,
  trainingStore,
  policyStore,
} from '@/lib/mock-data/store';

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const body = await req.json();
  const validated = generateReportSchema.parse(body);

  const now = new Date().toISOString();
  const score = complianceScoreStore.current;
  const gaps = gapStore.getAll();
  const evidence = evidenceStore.filter((e) => !e.deletedAt);
  const staff = staffStore.filter((s) => s.isActive);
  const training = trainingStore.getAll();
  const policies = policyStore.filter((p) => !p.deletedAt);

  let reportData: Record<string, unknown> = {};

  switch (validated.type) {
    case 'full_compliance':
      reportData = {
        type: 'full_compliance',
        generatedAt: now,
        compliance: score,
        gapSummary: {
          total: gaps.length,
          open: gaps.filter((g) => g.status === 'OPEN').length,
          inProgress: gaps.filter((g) => g.status === 'IN_PROGRESS').length,
          resolved: gaps.filter((g) => g.status === 'RESOLVED').length,
        },
        evidenceCount: evidence.length,
        policyCount: policies.length,
        staffCount: staff.length,
      };
      break;

    case 'domain_summary':
      reportData = {
        type: 'domain_summary',
        generatedAt: now,
        domain: validated.domain,
        domainScore: validated.domain
          ? score.domains.find((d) => d.slug === validated.domain)
          : score.domains,
        gaps: validated.domain
          ? gaps.filter((g) => g.domain === validated.domain)
          : gaps,
      };
      break;

    case 'gap_analysis':
      reportData = {
        type: 'gap_analysis',
        generatedAt: now,
        gaps,
        bySeverity: {
          CRITICAL: gaps.filter((g) => g.severity === 'CRITICAL').length,
          HIGH: gaps.filter((g) => g.severity === 'HIGH').length,
          MEDIUM: gaps.filter((g) => g.severity === 'MEDIUM').length,
          LOW: gaps.filter((g) => g.severity === 'LOW').length,
        },
        byDomain: score.domains.map((d) => ({
          domain: d.domainName,
          gapCount: d.gapCount,
          score: d.score,
        })),
      };
      break;

    case 'evidence_summary':
      reportData = {
        type: 'evidence_summary',
        generatedAt: now,
        totalEvidence: evidence.length,
        byStatus: {
          VALID: evidence.filter((e) => e.status === 'VALID').length,
          EXPIRING_SOON: evidence.filter((e) => e.status === 'EXPIRING_SOON').length,
          EXPIRED: evidence.filter((e) => e.status === 'EXPIRED').length,
        },
        recentUploads: evidence.slice(0, 10),
      };
      break;

    case 'staff_compliance':
      reportData = {
        type: 'staff_compliance',
        generatedAt: now,
        totalStaff: staff.length,
        trainingRecords: training.length,
        dbsStatus: {
          clear: staff.filter((s) => s.dbsStatus === 'CLEAR').length,
          pending: staff.filter((s) => s.dbsStatus === 'PENDING').length,
          expired: staff.filter((s) => s.dbsStatus === 'EXPIRED').length,
        },
        trainingStatus: {
          valid: training.filter((t) => t.status === 'VALID').length,
          expiringSoon: training.filter((t) => t.status === 'EXPIRING_SOON').length,
          expired: training.filter((t) => t.status === 'EXPIRED').length,
        },
      };
      break;
  }

  return apiSuccess(reportData);
});
