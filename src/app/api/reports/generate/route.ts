import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { generateReportSchema } from '@/lib/validations/report';
import { getDb } from '@/lib/db';

export const POST = withAuth(async (req, { params, auth }) => {
  const client = await getDb();
  requireMinRole(auth, 'MANAGER');

  const body = await req.json();
  const validated = generateReportSchema.parse(body);

  const orgId = auth.organizationId;
  const now = new Date().toISOString();

  let reportData: Record<string, unknown> = {};

  switch (validated.type) {
    case 'full_compliance': {
      const [
        { data: score },
        { data: allGaps },
        { count: evidenceCount },
        { count: policyCount },
        { count: staffCount },
      ] = await Promise.all([
        client.from('compliance_scores')
          .select('*, domain_scores(*)')
          .eq('organization_id', orgId)
          .order('calculated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        client.from('compliance_gaps')
          .select('status')
          .eq('organization_id', orgId),
        client.from('evidence_items')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .neq('status', 'ARCHIVED'),
        client.from('policies')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .neq('status', 'ARCHIVED'),
        client.from('staff_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('is_active', true),
      ]);

      const gapSummary: Record<string, number> = { total: 0, open: 0, inProgress: 0, resolved: 0 };
      for (const g of allGaps ?? []) {
        gapSummary.total += 1;
        if (g.status === 'OPEN') gapSummary.open += 1;
        if (g.status === 'IN_PROGRESS') gapSummary.inProgress += 1;
        if (g.status === 'RESOLVED') gapSummary.resolved += 1;
      }

      reportData = {
        type: 'full_compliance',
        generatedAt: now,
        compliance: score ? {
          overall: score.score,
          predictedRating: score.predicted_rating,
          domains: ((score.domain_scores ?? []) as any[]).map((d) => ({
            domainName: d.domain,
            score: d.score,
            rating: d.status,
            gapCount: d.total_gaps,
          })),
        } : null,
        gapSummary,
        evidenceCount: evidenceCount ?? 0,
        policyCount: policyCount ?? 0,
        staffCount: staffCount ?? 0,
      };
      break;
    }

    case 'gap_analysis': {
      const { data: gaps } = await client.from('compliance_gaps')
        .select('*')
        .eq('organization_id', orgId);

      const items = gaps ?? [];
      reportData = {
        type: 'gap_analysis',
        generatedAt: now,
        totalGaps: items.length,
        bySeverity: {
          CRITICAL: items.filter((g) => g.severity === 'CRITICAL').length,
          HIGH: items.filter((g) => g.severity === 'HIGH').length,
          MEDIUM: items.filter((g) => g.severity === 'MEDIUM').length,
          LOW: items.filter((g) => g.severity === 'LOW').length,
        },
      };
      break;
    }

    case 'evidence_summary': {
      const [{ data: evidence }, { data: allEvidence }] = await Promise.all([
        client.from('evidence_items')
          .select('*')
          .eq('organization_id', orgId)
          .neq('status', 'ARCHIVED')
          .order('created_at', { ascending: false })
          .limit(10),
        client.from('evidence_items')
          .select('status')
          .eq('organization_id', orgId)
          .neq('status', 'ARCHIVED'),
      ]);

      const byStatus: Record<string, number> = {};
      for (const e of allEvidence ?? []) byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;

      reportData = {
        type: 'evidence_summary',
        generatedAt: now,
        totalEvidence: Object.values(byStatus).reduce((a, b) => a + b, 0),
        byStatus,
        recentUploads: evidence ?? [],
      };
      break;
    }

    case 'staff_compliance': {
      const [{ data: staff }, { data: training }] = await Promise.all([
        client.from('staff_members')
          .select('*')
          .eq('organization_id', orgId)
          .eq('is_active', true),
        client.from('training_records')
          .select('*, staff_members!inner(organization_id)')
          .eq('staff_members.organization_id', orgId),
      ]);

      const staffItems = staff ?? [];
      const trainingItems = training ?? [];
      const now30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const nowStr = new Date().toISOString();

      reportData = {
        type: 'staff_compliance',
        generatedAt: now,
        totalStaff: staffItems.length,
        trainingRecords: trainingItems.length,
        dbsStatus: {
          clear: staffItems.filter((s) => s.dbs_certificate_date != null).length,
          pending: staffItems.filter((s) => !s.dbs_certificate_date).length,
        },
        trainingStatus: {
          valid: trainingItems.filter((t) => !t.is_expired && (!t.expiry_date || t.expiry_date > now30)).length,
          expiringSoon: trainingItems.filter((t) => !t.is_expired && t.expiry_date && t.expiry_date <= now30 && t.expiry_date > nowStr).length,
          expired: trainingItems.filter((t) => t.is_expired).length,
        },
      };
      break;
    }

    default:
      reportData = { type: validated.type, generatedAt: now };
  }

  return apiSuccess(reportData);
});
