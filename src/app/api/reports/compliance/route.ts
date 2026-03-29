import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { ComplianceService } from '@/lib/services/compliance-service';
import { getDb } from '@/lib/db';

export const GET = withAuth(async (req, { params, auth }) => {
  const client = await getDb();
  requireMinRole(auth, 'MANAGER');

  const orgId = auth.organizationId;

  const [score, { data: gaps }, { data: domainBreakdown }] = await Promise.all([
    ComplianceService.getCurrentScore(orgId),
    client.from('compliance_gaps')
      .select('*')
      .eq('organization_id', orgId)
      .order('severity', { ascending: true }),
    client.from('domain_scores')
      .select('*, compliance_scores!inner(organization_id)')
      .eq('compliance_scores.organization_id', orgId)
      .order('score', { ascending: true }),
  ]);

  const gapItems = gaps ?? [];

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

  for (const gap of gapItems) {
    gapsBySeverity[gap.severity] = (gapsBySeverity[gap.severity] ?? 0) + 1;
    gapsByStatus[gap.status] = (gapsByStatus[gap.status] ?? 0) + 1;
  }

  const [
    { count: evidenceCount },
    { count: policyCount },
    { count: staffCount },
    { count: trainingCount },
  ] = await Promise.all([
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
    client.from('training_records')
      .select('*, staff_members!inner(organization_id)', { count: 'exact', head: true })
      .eq('staff_members.organization_id', orgId),
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
      total: gapItems.length,
      bySeverity: gapsBySeverity,
      byStatus: gapsByStatus,
    },
    coverage: {
      evidenceCount: evidenceCount ?? 0,
      policyCount: policyCount ?? 0,
      staffCount: staffCount ?? 0,
      trainingCount: trainingCount ?? 0,
    },
  });
});
