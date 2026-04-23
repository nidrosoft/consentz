// =============================================================================
// Dashboard Service — Aggregated overview data for the main dashboard
// =============================================================================

import { getDb } from '@/lib/db';
import type { ActivityLogEntry, ComplianceScore, CqcRating, DomainScore, DomainSlug } from '@/types';

const DOMAIN_ORDER: { db: string; slug: DomainSlug }[] = [
  { db: 'safe', slug: 'safe' },
  { db: 'effective', slug: 'effective' },
  { db: 'caring', slug: 'caring' },
  { db: 'responsive', slug: 'responsive' },
  { db: 'well_led', slug: 'well-led' },
];

function dbDomainToSlug(domain: string): DomainSlug {
  if (domain === 'well_led') return 'well-led';
  if (domain === 'safe' || domain === 'effective' || domain === 'caring' || domain === 'responsive') {
    return domain;
  }
  return 'safe';
}

interface DashboardOverviewParams {
  organizationId: string;
  userId: string;
}

export class DashboardService {
  static async getOverview(params: DashboardOverviewParams) {
    const client = await getDb();
    const now = new Date();
    const nowISO = now.toISOString();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      complianceScoreRes,
      openGapsRes,
      allTasksRes,
      evidenceItemsRes,
      activeStaffRes,
      allPoliciesRes,
      monthlyIncidentsRes,
      investigatingIncidentsRes,
      recentActivityRes,
      unreadNotifsRes,
      orgConsentzRes,
    ] = await Promise.all([
      client
        .from('compliance_scores')
        .select('id, organization_id, domain_code, score, rating, calculated_at, breakdown, previous_score, score_trend, predicted_rating, rating_confidence, has_critical_gap, total_requirements, met_requirements, total_gaps, critical_gaps, domain_scores(id, compliance_score_id, domain, score, max_score, percentage, status, previous_score, trend, total_gaps, critical_gaps, high_gaps, medium_gaps, low_gaps, total_kloes, covered_kloes, calculated_at)')
        .eq('organization_id', params.organizationId)
        .maybeSingle(),
      client
        .from('compliance_gaps')
        .select('*')
        .eq('organization_id', params.organizationId)
        .in('status', ['OPEN', 'IN_PROGRESS']),
      client
        .from('tasks')
        .select('*')
        .eq('organization_id', params.organizationId)
        .order('due_date', { ascending: true }),
      client
        .from('evidence_items')
        .select('*')
        .eq('organization_id', params.organizationId)
        .order('created_at', { ascending: false }),
      client
        .from('staff_members')
        .select('*')
        .eq('organization_id', params.organizationId)
        .eq('is_active', true),
      client
        .from('policies')
        .select('*')
        .eq('organization_id', params.organizationId),
      client
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', params.organizationId)
        .gte('reported_at', startOfMonth.toISOString()),
      client
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', params.organizationId)
        .eq('status', 'INVESTIGATING'),
      client
        .from('activity_logs')
        .select('*')
        .eq('organization_id', params.organizationId)
        .order('created_at', { ascending: false })
        .limit(10),
      client
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', params.organizationId)
        .eq('user_id', params.userId)
        .eq('is_read', false),
      client
        .from('organizations')
        .select('consentz_clinic_id')
        .eq('id', params.organizationId)
        .single(),
    ]);

    if (complianceScoreRes.error) {
      console.error('[DashboardService] compliance_scores query error:', complianceScoreRes.error);
    }

    // Read scores as-is from the DB. Scores are recalculated only when
    // evidence is explicitly changed (uploads, deletes, status changes,
    // syncs) — never on a read-only GET to avoid side effects on navigation.
    let complianceScore = complianceScoreRes.data;

    const openGaps = openGapsRes.data ?? [];
    const allTasks = allTasksRes.data ?? [];
    const evidenceItems = evidenceItemsRes.data ?? [];
    const activeStaff = activeStaffRes.data ?? [];
    const allPolicies = allPoliciesRes.data ?? [];
    const monthlyIncidents = monthlyIncidentsRes.count ?? 0;
    const investigatingIncidents = investigatingIncidentsRes.count ?? 0;
    const recentActivity = recentActivityRes.data ?? [];
    const unreadNotifs = unreadNotifsRes.count ?? 0;
    const consentzConnected = !!orgConsentzRes.data?.consentz_clinic_id;

    // Enrich activity entries with kloe_code from related entities
    const kloeEntityTypes = ['EVIDENCE', 'TASK', 'GAP'];
    const kloeEntityIds = recentActivity
      .filter((a) => kloeEntityTypes.includes(a.entity_type) && a.entity_id)
      .map((a) => ({ type: a.entity_type, id: a.entity_id }));

    const kloeMap = new Map<string, string>();
    if (kloeEntityIds.length > 0) {
      const evidenceIds = kloeEntityIds.filter((e) => e.type === 'EVIDENCE').map((e) => e.id);
      const taskIds = kloeEntityIds.filter((e) => e.type === 'TASK').map((e) => e.id);
      const gapIds = kloeEntityIds.filter((e) => e.type === 'GAP').map((e) => e.id);

      const [evidenceKloes, taskKloes, gapKloes] = await Promise.all([
        evidenceIds.length > 0
          ? client.from('evidence_items').select('id, kloe_code').in('id', evidenceIds)
          : { data: [] },
        taskIds.length > 0
          ? client.from('tasks').select('id, kloe_code').in('id', taskIds)
          : { data: [] },
        gapIds.length > 0
          ? client.from('compliance_gaps').select('id, kloe_code').in('id', gapIds)
          : { data: [] },
      ]);

      for (const row of [...(evidenceKloes.data ?? []), ...(taskKloes.data ?? []), ...(gapKloes.data ?? [])]) {
        if (row.kloe_code) kloeMap.set(row.id, row.kloe_code);
      }
    }

    const activeTasks = allTasks.filter((t) => t.status !== 'COMPLETED');
    const overdueTasks = allTasks.filter((t) => t.due_date && t.due_date < nowISO && t.status !== 'COMPLETED');
    const dueSoon = activeTasks
      .filter((t) => t.due_date && t.due_date >= nowISO && t.due_date <= sevenDaysFromNow.toISOString())
      .slice(0, 5);
    const userTasks = activeTasks
      .filter((t) => t.assigned_to === params.userId)
      .slice(0, 5);

    const dbsExpiring = activeStaff.filter((s) => {
      if (!s.dbs_certificate_date) return false;
      const oneYearFromDbs = new Date(s.dbs_certificate_date);
      oneYearFromDbs.setFullYear(oneYearFromDbs.getFullYear() + 3);
      return oneYearFromDbs <= thirtyDaysFromNow && oneYearFromDbs >= now;
    });

    const DOMAIN_CONFIG: Record<string, { name: string; icon: string; color: string; kloeCount: number }> = {
      safe: { name: 'Safe', icon: 'Shield', color: '#3B82F6', kloeCount: 6 },
      effective: { name: 'Effective', icon: 'Target', color: '#10B981', kloeCount: 7 },
      caring: { name: 'Caring', icon: 'Heart', color: '#EC4899', kloeCount: 3 },
      responsive: { name: 'Responsive', icon: 'Zap', color: '#F59E0B', kloeCount: 3 },
      well_led: { name: 'Well-Led', icon: 'Crown', color: '#8B5CF6', kloeCount: 6 },
    };

    // If the join returned domain_scores, use them; otherwise fetch separately
    let domainScoresArr = complianceScore?.domain_scores as Array<{
      id: string;
      compliance_score_id: string;
      domain: string;
      score: number;
      max_score: number;
      percentage: number;
      status: string;
      previous_score: number | null;
      trend: number;
      total_gaps: number;
      critical_gaps: number;
      high_gaps: number;
      medium_gaps: number;
      low_gaps: number;
      total_kloes: number;
      covered_kloes: number;
      calculated_at: string;
    }> | undefined;

    // Fallback: if join didn't populate domain_scores, query them directly
    if (complianceScore && (!domainScoresArr || domainScoresArr.length === 0)) {
      const { data: directDomainScores, error: dsErr } = await client
        .from('domain_scores')
        .select('id, compliance_score_id, domain, score, max_score, percentage, status, previous_score, trend, total_gaps, critical_gaps, high_gaps, medium_gaps, low_gaps, total_kloes, covered_kloes, calculated_at')
        .eq('compliance_score_id', complianceScore.id);
      if (dsErr) {
        console.error('[DashboardService] domain_scores fallback query error:', dsErr);
      }
      if (directDomainScores?.length) {
        domainScoresArr = directDomainScores;
      }
    }

    const buildClientDomains = (): DomainScore[] => {
      if (!domainScoresArr?.length) {
        return DOMAIN_ORDER.map((d) => {
          const cfg = DOMAIN_CONFIG[d.db] ?? { name: d.db, icon: 'Circle', color: '#6B7280', kloeCount: 0 };
          return {
            domainId: `empty-${d.slug}`,
            domainName: cfg.name,
            slug: d.slug,
            score: 0,
            rating: 'INADEQUATE' as CqcRating,
            gapCount: 0,
            trend: 0,
            kloeCount: cfg.kloeCount,
          };
        });
      }
      // Map domain_scores from the DB, preserving DOMAIN_ORDER and filling in
      // placeholders for any domains that may be missing from the result set.
      const byDomain = new Map(domainScoresArr.map((ds) => [ds.domain, ds]));
      return DOMAIN_ORDER.map((d) => {
        const ds = byDomain.get(d.db);
        const cfg = DOMAIN_CONFIG[d.db] ?? { name: d.db, icon: 'Circle', color: '#6B7280', kloeCount: 0 };
        if (!ds) {
          return {
            domainId: `empty-${d.slug}`,
            domainName: cfg.name,
            slug: d.slug,
            score: 0,
            rating: 'INADEQUATE' as CqcRating,
            gapCount: 0,
            trend: 0,
            kloeCount: cfg.kloeCount,
          };
        }
        return {
          domainId: ds.id,
          domainName: cfg.name,
          slug: dbDomainToSlug(ds.domain),
          score: Math.round(ds.percentage),
          rating: ds.status as CqcRating,
          gapCount: ds.total_gaps ?? 0,
          trend: Math.round(ds.trend ?? 0),
          kloeCount: cfg.kloeCount,
        };
      });
    };

    if (complianceScore) {
      console.log('[DashboardService] compliance_scores row found:', {
        id: complianceScore.id,
        score: complianceScore.score,
        predicted_rating: complianceScore.predicted_rating,
        domain_scores_count: domainScoresArr?.length ?? 0,
      });
    } else {
      console.warn('[DashboardService] No compliance_scores row found for org:', params.organizationId);
    }

    const compliance: ComplianceScore = {
      overall: complianceScore ? Math.round(complianceScore.score) : 0,
      predictedRating: (complianceScore?.predicted_rating ?? 'INADEQUATE') as CqcRating,
      lastUpdated: complianceScore?.calculated_at ?? new Date().toISOString(),
      domains: buildClientDomains(),
    };

    const priorityGaps = openGaps
      .filter((g) => g.severity === 'CRITICAL' || g.severity === 'HIGH')
      .sort((a, b) => {
        const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
      })
      .slice(0, 10)
      .map((g) => ({
        id: g.id,
        title: g.title,
        domain: dbDomainToSlug(g.domain),
        kloeCode: g.kloe_code,
        severity: g.severity,
        dueDate: g.due_date ?? null,
      }));

    const { data: lastSync } = await client
      .from('consentz_sync_logs')
      .select('*')
      .eq('organization_id', params.organizationId)
      .eq('status', 'success')
      .order('synced_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const consentzMetrics = await getConsentzLiveMetrics(client, params.organizationId);

    return {
      compliance,
      priorityGaps,
      consentzConnected,
      consentzDataFreshness: lastSync?.synced_at ?? null,
      consentzMetrics,
      gaps: {
        CRITICAL: openGaps.filter((g) => g.severity === 'CRITICAL').length,
        HIGH: openGaps.filter((g) => g.severity === 'HIGH').length,
        MEDIUM: openGaps.filter((g) => g.severity === 'MEDIUM').length,
        LOW: openGaps.filter((g) => g.severity === 'LOW').length,
        total: openGaps.length,
      },
      tasks: {
        totalActive: activeTasks.length,
        overdueCount: overdueTasks.length,
        dueSoon,
        userTasks,
      },
      evidence: {
        total: evidenceItems.length,
        expiringSoonCount: evidenceItems.filter((e) => e.status === 'EXPIRING_SOON').length,
        recentUploads: evidenceItems.slice(0, 5),
      },
      staff: {
        totalActive: activeStaff.length,
        dbsExpiringCount: dbsExpiring.length,
      },
      policies: {
        total: allPolicies.length,
        published: allPolicies.filter((p) => p.status === 'ACTIVE').length,
        drafts: allPolicies.filter((p) => p.status === 'DRAFT').length,
        reviewDue: allPolicies.filter((p) => p.next_review_date && p.next_review_date <= thirtyDaysFromNow.toISOString()).length,
      },
      incidents: {
        thisMonth: monthlyIncidents,
        investigating: investigatingIncidents,
      },
      activity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entity_type as ActivityLogEntry['entityType'],
        entityId: a.entity_id ?? '',
        description: a.description,
        user: a.actor_name,
        createdAt: a.created_at,
        kloeCode: a.entity_id ? (kloeMap.get(a.entity_id) ?? null) : null,
      })),
      deadlines: [],
      notifications: { unreadCount: unreadNotifs },
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getConsentzLiveMetrics(client: any, organizationId: string) {
  const endpoints = [
    'consent-completion',
    'staff-competency',
    'incidents',
    'safety-checklist',
    'patient-feedback',
    'policy-acknowledgement',
    'consent-decay',
  ] as const;

  const metrics: Record<string, { value: number | null; label: string; unit: string; domain: string }> = {
    consentCompletion:  { value: null, label: 'Consent Completion', unit: '%', domain: 'effective' },
    staffCompetency:    { value: null, label: 'Staff Competency', unit: '%', domain: 'well-led' },
    incidentResolution: { value: null, label: 'Incident Resolution', unit: '%', domain: 'safe' },
    safetyChecklist:    { value: null, label: 'Safety Checklist', unit: '%', domain: 'safe' },
    patientFeedback:    { value: null, label: 'Patient Feedback', unit: '/10', domain: 'caring' },
    policyAcknowledgement: { value: null, label: 'Policy Acknowledgement', unit: '%', domain: 'well-led' },
    consentDecay:       { value: null, label: 'Consent Decay', unit: '%', domain: 'effective' },
  };

  const { data: logs } = await client
    .from('consentz_sync_logs')
    .select('endpoint, response_data, synced_at')
    .eq('organization_id', organizationId)
    .eq('status', 'success')
    .in('endpoint', [...endpoints])
    .order('synced_at', { ascending: false });

  if (!logs?.length) return null;

  const seen = new Set<string>();
  for (const log of logs) {
    if (seen.has(log.endpoint)) continue;
    seen.add(log.endpoint);
    const d = log.response_data as Record<string, unknown>;
    if (!d) continue;

    switch (log.endpoint) {
      case 'consent-completion':
        metrics.consentCompletion.value = (d.completionRate as number) ?? null;
        break;
      case 'staff-competency':
        metrics.staffCompetency.value = (d.overallCompetencyRate as number) ?? null;
        break;
      case 'incidents':
        metrics.incidentResolution.value = (d.resolutionRate as number) ?? null;
        break;
      case 'safety-checklist':
        metrics.safetyChecklist.value = (d.overallScore as number) ?? null;
        break;
      case 'patient-feedback': {
        const avg = (d.averageRating as number) ?? (d.rollingAvg as number);
        metrics.patientFeedback.value = avg != null ? Math.round(avg * 10) / 10 : null;
        break;
      }
      case 'policy-acknowledgement':
        metrics.policyAcknowledgement.value = (d.acknowledgementRate as number) ?? null;
        break;
      case 'consent-decay':
        metrics.consentDecay.value = (d.decayRate as number) ?? null;
        break;
    }
  }

  return metrics;
}
