import { getDb } from '@/lib/db';
import {
  type AssessmentQuestion,
  type ServiceType,
} from '@/lib/constants/assessment-questions';
import {
  getKloesForDomain,
  getEvidenceItems,
  CRITICALITY_WEIGHT,
} from '@/lib/constants/cqc-evidence-requirements';
import type { DomainSlug } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScoreInputs {
  assessmentScore: number;
  evidenceCoverage: number;
  consentzMetrics: {
    consentCompletionRate: number;
    staffCompetencyRate: number;
    incidentResolutionRate: number;
    safetyChecklistScore: number;
    patientFeedbackAvg: number;
    policyAckRate: number;
  };
  taskCompletionRate: number;
  overdueCriticalItems: number;
}

export type CqcRatingType = 'OUTSTANDING' | 'GOOD' | 'REQUIRES_IMPROVEMENT' | 'INADEQUATE';

export interface KloeScoreResult {
  kloeCode: string;
  score: number;
  criticalGapCount: number;
  highGapCount: number;
  isHighRisk: boolean;
}

// ---------------------------------------------------------------------------
// scoreAnswer — per-question scoring following the spec
// ---------------------------------------------------------------------------

export function scoreAnswer(
  question: AssessmentQuestion,
  answerValue: unknown,
): { score: number; maxScore: number; createsGap: boolean; gapSeverity: string | null } {
  const { scoring, weight, gapTrigger } = question;
  let rawScore = 0;

  switch (question.answerType) {
    case 'yes_no':
    case 'yes_no_partial':
      rawScore = scoring.scoringMap[String(answerValue)] ?? 0;
      break;
    case 'multi_select': {
      const selected = Array.isArray(answerValue) ? answerValue : [];
      rawScore = selected.reduce((sum: number, val: string) => {
        const opt = question.options?.find((o) => o.value === val);
        return sum + (opt?.points ?? 0);
      }, 0);
      break;
    }
    case 'scale':
      rawScore = Number(answerValue) * 2;
      break;
    case 'text':
      rawScore = 0;
      break;
    default:
      rawScore = scoring.scoringMap[String(answerValue)] ?? 0;
  }

  const weightedMax = scoring.maxPoints * weight;
  const weightedScore = rawScore * weight;

  let createsGap = false;
  let gapSeverity: string | null = null;

  if (gapTrigger) {
    const checkValue = String(answerValue);
    if (gapTrigger.triggerValues.includes(checkValue)) {
      createsGap = true;
      gapSeverity = gapTrigger.severity;
    }
    if (question.answerType === 'multi_select' && rawScore < scoring.maxPoints / 2) {
      createsGap = true;
      gapSeverity = gapTrigger.severity;
    }
  }

  return { score: weightedScore, maxScore: weightedMax, createsGap, gapSeverity };
}

// ---------------------------------------------------------------------------
// Evidence quality factor (0.5–1.0)
// ---------------------------------------------------------------------------

function calculateEvidenceQuality(
  domain: string,
  evidence: any[],
  policies: any[],
): number {
  const domainEvidence = evidence.filter((e) => e.domains?.includes(domain));
  const domainPolicies = policies.filter(
    (p) => p.domains?.includes(domain) && p.status === 'ACTIVE',
  );
  const totalItems = domainEvidence.length + domainPolicies.length;

  if (totalItems === 0) return 0.5;

  let qualitySum = 0;

  for (const item of domainEvidence) {
    let q = 0.5;
    if (item.status === 'VALID') q += 0.3;
    else if (item.status === 'EXPIRING_SOON') q += 0.15;
    if (item.kloe_code) q += 0.1;
    qualitySum += Math.min(q, 1.0);
  }

  for (const policy of domainPolicies) {
    let q = 0.7;
    if (policy.next_review_date && new Date(policy.next_review_date) > new Date()) {
      q += 0.2;
    }
    qualitySum += Math.min(q, 1.0);
  }

  return Math.max(0.5, Math.min(1.0, qualitySum / totalItems));
}

async function getEvidenceStatusFactor(
  organizationId: string,
  domain: string,
  serviceType: ServiceType,
): Promise<number> {
  try {
    const client = await getDb();
    const domainSlug = domain as DomainSlug;
    const kloeDefs = getKloesForDomain(serviceType, domainSlug);
    let kloeCodes = kloeDefs.map((d) => d.code);

    if (domainSlug === 'effective' && serviceType === 'AESTHETIC_CLINIC') {
      const { data: orgRow } = await client
        .from('organizations')
        .select('e3_nutrition_na_aesthetic')
        .eq('id', organizationId)
        .maybeSingle();
      if (orgRow?.e3_nutrition_na_aesthetic) {
        kloeCodes = kloeCodes.filter((c) => c !== 'E3');
      }
    }

    if (kloeCodes.length === 0) return 0.5;

    const { data } = await client
      .from('kloe_evidence_status')
      .select('status')
      .eq('organization_id', organizationId)
      .in('kloe_code', kloeCodes);

    if (!data?.length) return 0.5;

    const total = data.length;
    const complete = data.filter((r) => r.status === 'complete').length;
    return Math.max(0.5, Math.min(1.0, 0.5 + (complete / total) * 0.5));
  } catch {
    return 0.5;
  }
}

// ---------------------------------------------------------------------------
// Timeliness factor (0.5–1.0)
// ---------------------------------------------------------------------------

function calculateTimeliness(
  domain: string,
  evidence: any[],
  trainingRecords: any[],
  staff: any[],
): number {
  const factors: number[] = [];
  const domainEvidence = evidence.filter((e) => e.domains?.includes(domain));

  for (const item of domainEvidence) {
    if (!item.expiry_date) {
      factors.push(0.8);
      continue;
    }
    const daysUntil = Math.floor(
      (new Date(item.expiry_date).getTime() - Date.now()) / 86400000,
    );
    if (daysUntil > 90) factors.push(1.0);
    else if (daysUntil > 30) factors.push(0.8);
    else if (daysUntil > 0) factors.push(0.6);
    else if (daysUntil > -30) factors.push(0.3);
    else factors.push(0.1);
  }

  if (domain === 'safe' || domain === 'effective') {
    for (const s of staff.filter((st: any) => st.is_active)) {
      if (!s.registration_expiry) continue;
      const daysUntil = Math.floor(
        (new Date(s.registration_expiry).getTime() - Date.now()) / 86400000,
      );
      if (daysUntil > 90) factors.push(1.0);
      else if (daysUntil > 30) factors.push(0.7);
      else if (daysUntil > 0) factors.push(0.4);
      else factors.push(0.1);
    }

    for (const tr of trainingRecords) {
      if (!tr.expiry_date) continue;
      const daysUntil = Math.floor(
        (new Date(tr.expiry_date).getTime() - Date.now()) / 86400000,
      );
      if (daysUntil > 90) factors.push(1.0);
      else if (daysUntil > 30) factors.push(0.8);
      else if (daysUntil > 0) factors.push(0.5);
      else factors.push(0.2);
    }
  }

  if (factors.length === 0) return 0.7;
  return Math.max(
    0.5,
    Math.min(1.0, factors.reduce((a, b) => a + b, 0) / factors.length),
  );
}

// ---------------------------------------------------------------------------
// Confidence score (0–1.0)
// ---------------------------------------------------------------------------

function calculateConfidence(
  evidenceCompleteCount: number,
  totalEvidenceItems: number,
): number {
  // Confidence is driven purely by what percentage of required evidence
  // items have status 'complete' (0–1.0). The self-assessment questionnaire
  // is a declaration of intent and does not contribute to confidence.
  if (totalEvidenceItems === 0) return 0;
  const coverage = Math.min(evidenceCompleteCount / totalEvidenceItems, 1.0);
  return Math.round(coverage * 100) / 100;
}

// ---------------------------------------------------------------------------
// Consentz metrics from sync logs
// ---------------------------------------------------------------------------

async function getConsentzMetrics(organizationId: string) {
  const client = await getDb();
  const endpoints = [
    'consent-completion',
    'staff-competency',
    'incidents',
    'safety-checklist',
    'patient-feedback',
    'policy-acknowledgement',
  ];

  const metrics = {
    consentCompletionRate: 50,
    staffCompetencyRate: 50,
    incidentResolutionRate: 50,
    safetyChecklistScore: 50,
    patientFeedbackAvg: 50,
    policyAckRate: 50,
  };

  for (const endpoint of endpoints) {
    const { data: log } = await client
      .from('consentz_sync_logs')
      .select('response_data')
      .eq('organization_id', organizationId)
      .eq('endpoint', endpoint)
      .eq('status', 'success')
      .order('synced_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (log?.response_data) {
      const d = log.response_data as Record<string, any>;
      switch (endpoint) {
        case 'consent-completion':
          metrics.consentCompletionRate = d.completionRate ?? 50;
          break;
        case 'staff-competency':
          metrics.staffCompetencyRate = d.overallCompetencyRate ?? 50;
          break;
        case 'incidents':
          metrics.incidentResolutionRate = d.resolutionRate ?? 50;
          break;
        case 'safety-checklist':
          metrics.safetyChecklistScore = d.overallScore ?? 50;
          break;
        case 'patient-feedback':
          metrics.patientFeedbackAvg = d.averageRating
            ? (d.averageRating / 10) * 100
            : 50;
          break;
        case 'policy-acknowledgement':
          metrics.policyAckRate = d.acknowledgementRate ?? 50;
          break;
      }
    }
  }

  return metrics;
}

// ---------------------------------------------------------------------------
// Domain-level Consentz metric blending (kept for calculateDomainScore)
// ---------------------------------------------------------------------------

const DOMAIN_METRIC_MAPPING: Record<
  string,
  (metrics: ScoreInputs['consentzMetrics']) => number
> = {
  safe: (m) =>
    m.consentCompletionRate * 0.3 +
    m.incidentResolutionRate * 0.4 +
    m.safetyChecklistScore * 0.3,
  effective: (m) => m.staffCompetencyRate * 0.5 + m.consentCompletionRate * 0.5,
  caring: (m) => m.patientFeedbackAvg,
  responsive: (m) => m.patientFeedbackAvg * 0.5 + m.consentCompletionRate * 0.5,
  well_led: (m) => {
    const allMetrics =
      (m.consentCompletionRate +
        m.staffCompetencyRate +
        m.incidentResolutionRate +
        m.safetyChecklistScore +
        m.patientFeedbackAvg +
        m.policyAckRate) /
      6;
    return m.policyAckRate * 0.4 + allMetrics * 0.6;
  },
};

function getConsentzMetricForDomain(
  domain: string,
  metrics: ScoreInputs['consentzMetrics'],
): number {
  const fn = DOMAIN_METRIC_MAPPING[domain];
  return fn ? fn(metrics) : 50;
}

// ---------------------------------------------------------------------------
// Public helpers (kept — used by other modules)
// ---------------------------------------------------------------------------

export function calculateDomainScore(domain: string, inputs: ScoreInputs): number {
  let score =
    inputs.assessmentScore * 0.3 +
    inputs.evidenceCoverage * 0.25 +
    getConsentzMetricForDomain(domain, inputs.consentzMetrics) * 0.25 +
    inputs.taskCompletionRate * 0.15;

  score -= inputs.overdueCriticalItems * 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreToRating(score: number): CqcRatingType {
  if (score >= 88) return 'OUTSTANDING';
  if (score >= 63) return 'GOOD';
  if (score >= 39) return 'REQUIRES_IMPROVEMENT';
  return 'INADEQUATE';
}

export function calculateOverallScore(domainScores: { score: number }[]): number {
  if (domainScores.length === 0) return 0;
  const total = domainScores.reduce((sum, d) => sum + d.score, 0);
  return Math.round(total / domainScores.length);
}

// ---------------------------------------------------------------------------
// CQC overall rating determination (mirrors CQC aggregation methodology)
// ---------------------------------------------------------------------------

export function determineOverallRating(
  domainScoreData: { domain: string; score: number; rating: CqcRatingType }[],
  hasCriticalGap: boolean,
): CqcRatingType {
  const ratings = domainScoreData.map((d) => d.rating);
  const count = (r: CqcRatingType) => ratings.filter((x) => x === r).length;

  const inadequateCount = count('INADEQUATE');
  const riCount = count('REQUIRES_IMPROVEMENT');
  const goodCount = count('GOOD');
  const outstandingCount = count('OUTSTANDING');

  if (inadequateCount >= 2) return 'INADEQUATE';
  if (inadequateCount > 0) return 'REQUIRES_IMPROVEMENT';
  if (riCount >= 2) return 'REQUIRES_IMPROVEMENT';
  if (hasCriticalGap) return 'REQUIRES_IMPROVEMENT';

  if (outstandingCount >= 2 && goodCount + outstandingCount === 5) {
    return 'OUTSTANDING';
  }

  if (goodCount + outstandingCount === 5) return 'GOOD';

  if (riCount === 1) {
    const riDomain = domainScoreData.find(
      (d) => d.rating === 'REQUIRES_IMPROVEMENT',
    );
    if (riDomain && riDomain.score >= 55) return 'GOOD';
  }

  return 'REQUIRES_IMPROVEMENT';
}

// ---------------------------------------------------------------------------
// Time-to-Good estimate (days)
// ---------------------------------------------------------------------------

export function calculateTimeToGood(
  domainScoreData: { rating: CqcRatingType }[],
  openGaps: { severity: string }[],
): number | null {
  if (
    domainScoreData.every(
      (d) => d.rating === 'GOOD' || d.rating === 'OUTSTANDING',
    )
  ) {
    return null;
  }

  let totalDays = 0;
  for (const gap of openGaps) {
    switch (gap.severity) {
      case 'CRITICAL':
        totalDays += 3;
        break;
      case 'HIGH':
        totalDays += 14;
        break;
      case 'MEDIUM':
        totalDays += 30;
        break;
    }
  }
  return Math.max(totalDays, 14);
}

// ---------------------------------------------------------------------------
// Domain slug mapping (internal 'well_led' → DomainSlug 'well-led')
// ---------------------------------------------------------------------------

function toDomainSlug(domain: string): DomainSlug {
  return (domain === 'well_led' ? 'well-led' : domain) as DomainSlug;
}

// ---------------------------------------------------------------------------
// KLOE-level evidence scoring with hard caps
// ---------------------------------------------------------------------------

export async function calculateKloeScore(
  organizationId: string,
  kloeCode: string,
  serviceType: ServiceType,
  prefetchedStatuses?: Array<{ evidence_item_id: string; status: string; expiry_status: string | null; evidence_type?: string; consentz_synced_at?: string | null }>,
  consentzConnected = true,
): Promise<KloeScoreResult> {
  const items = getEvidenceItems(serviceType, kloeCode);

  if (items.length === 0) {
    return { kloeCode, score: 0, criticalGapCount: 0, highGapCount: 0, isHighRisk: false };
  }

  let statusRows = prefetchedStatuses;
  if (!statusRows) {
    const client = await getDb();
    const { data } = await client
      .from('kloe_evidence_status')
      .select('evidence_item_id, status, expiry_status, evidence_type, consentz_synced_at')
      .eq('organization_id', organizationId)
      .eq('kloe_code', kloeCode);
    statusRows = data ?? [];
  }

  const SYNC_OVERDUE_MS = 24 * 60 * 60 * 1000;
  const statusMap = new Map(
    statusRows.map((r) => [r.evidence_item_id, r]),
  );

  let weightedSum = 0;
  let totalWeight = 0;
  let criticalGapCount = 0;
  let highGapCount = 0;
  let hasCriticalExpired = false;

  for (const item of items) {
    const weight = CRITICALITY_WEIGHT[item.criticality];
    totalWeight += weight;

    const row = statusMap.get(item.id);

    // Consentz items score 0 if org not connected, no sync data, or sync overdue (>24h)
    const isConsentzType = row?.evidence_type === 'CONSENTZ' || row?.evidence_type === 'CONSENTZ_MANUAL';
    const consentzDisconnected = isConsentzType && !consentzConnected;
    const consentzMissing = isConsentzType && consentzConnected && !row?.consentz_synced_at;
    const consentzOverdue = isConsentzType && consentzConnected && row?.consentz_synced_at
      ? (Date.now() - new Date(row.consentz_synced_at).getTime() > SYNC_OVERDUE_MS)
      : false;

    const isPresent = row?.status === 'complete'
      && row?.expiry_status !== 'expired'
      && !consentzDisconnected
      && !consentzMissing
      && !consentzOverdue;

    if (isPresent) {
      weightedSum += weight;
    } else {
      if (item.criticality === 'critical') {
        criticalGapCount++;
        if (row?.expiry_status === 'expired') hasCriticalExpired = true;
      } else if (item.criticality === 'high') {
        highGapCount++;
      }
    }
  }

  let score = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

  if (criticalGapCount > 0) {
    score = Math.min(score, hasCriticalExpired ? 40 : 50);
  }
  if (highGapCount >= 2) {
    score = Math.min(score, 60);
  } else if (highGapCount > 0) {
    score = Math.min(score, 70);
  }

  return {
    kloeCode,
    score: Math.round(score),
    criticalGapCount,
    highGapCount,
    isHighRisk: criticalGapCount >= 2,
  };
}

// ---------------------------------------------------------------------------
// Main recalculation
// ---------------------------------------------------------------------------

export async function recalculateComplianceScores(organizationId: string) {
  const client = await getDb();
  const domains = ['safe', 'effective', 'caring', 'responsive', 'well_led'];

  // --- Load data in parallel ---------------------------------------------------

  const [
    openGapsResult,
    orgResult,
    kloeStatusResult,
  ] = await Promise.all([
    client
      .from('compliance_gaps')
      .select('*')
      .eq('organization_id', organizationId)
      .in('status', ['OPEN', 'IN_PROGRESS']),
    client
      .from('organizations')
      .select('service_type, e3_nutrition_na_aesthetic, consentz_clinic_id')
      .eq('id', organizationId)
      .maybeSingle(),
    client
      .from('kloe_evidence_status')
      .select('kloe_code, evidence_item_id, status, expiry_status, evidence_type, consentz_synced_at')
      .eq('organization_id', organizationId),
  ]);

  const openGaps = openGapsResult.data ?? [];
  const hasCriticalGap = openGaps.some((g: any) => g.severity === 'CRITICAL');

  const serviceType = (orgResult.data?.service_type ?? 'AESTHETIC_CLINIC') as ServiceType;
  const allKloeStatuses = (kloeStatusResult.data ?? []) as Array<{
    kloe_code: string;
    evidence_item_id: string;
    status: string;
    expiry_status: string | null;
    evidence_type?: string;
    consentz_synced_at?: string | null;
  }>;
  const e3NutritionNa = orgResult.data?.e3_nutrition_na_aesthetic ?? false;
  const consentzConnected = !!orgResult.data?.consentz_clinic_id;

  // --- Per-domain scoring: domain score = average of KLOE evidence scores ---
  // The self-assessment questionnaire sets a *claimed* starting position.
  // The displayed compliance score is driven exclusively by evidence status.
  // A provider who claims 80% but has uploaded zero evidence scores 0%.

  const allKloeScores: KloeScoreResult[] = [];
  const domainScoreData: { domain: string; score: number; rating: CqcRatingType }[] = [];

  for (const domain of domains) {
    const domainGaps = openGaps.filter((g: any) => g.domain === domain);

    // --- KLOE evidence-based scoring (domain score = average of KLOE scores) ---

    const slug = toDomainSlug(domain);
    let kloeDefs = getKloesForDomain(serviceType, slug);

    if (slug === 'effective' && serviceType === 'AESTHETIC_CLINIC' && e3NutritionNa) {
      kloeDefs = kloeDefs.filter((k) => k.code !== 'E3');
    }

    let evidenceBasedScore = 0;
    let domainCriticalGaps = 0;
    let domainHighGaps = 0;

    if (kloeDefs.length > 0) {
      const kloeResults: KloeScoreResult[] = [];
      for (const kloe of kloeDefs) {
        const kloeStatuses = allKloeStatuses.filter(
          (s) => s.kloe_code === kloe.code,
        );
        const kloeResult = await calculateKloeScore(
          organizationId,
          kloe.code,
          serviceType,
          kloeStatuses,
          consentzConnected,
        );
        kloeResults.push(kloeResult);
        allKloeScores.push(kloeResult);
        domainCriticalGaps += kloeResult.criticalGapCount;
        domainHighGaps += kloeResult.highGapCount;
      }
      evidenceBasedScore =
        kloeResults.reduce((sum, r) => sum + r.score, 0) / kloeResults.length;
    }

    // Domain score = average of KLOE scores (pure evidence-driven, no defaults)
    const domainScore = Math.max(0, Math.min(100, Math.round(evidenceBasedScore)));

    // Rating with limiters (combine KLOE gaps + compliance_gaps table)
    let rating = scoreToRating(domainScore);
    const gapCritical =
      domainCriticalGaps +
      domainGaps.filter((g: any) => g.severity === 'CRITICAL').length;
    const gapHigh =
      domainHighGaps +
      domainGaps.filter((g: any) => g.severity === 'HIGH').length;

    if (gapCritical > 0 && (rating === 'OUTSTANDING' || rating === 'GOOD')) {
      rating = 'REQUIRES_IMPROVEMENT';
    }
    if (gapHigh > 0 && rating === 'OUTSTANDING') {
      rating = 'GOOD';
    }

    domainScoreData.push({ domain, score: domainScore, rating });
  }

  // --- Overall score & CQC domain-level aggregation ----------------------------

  const overallScore = calculateOverallScore(domainScoreData);
  const predictedRating = determineOverallRating(domainScoreData, hasCriticalGap);

  // --- Confidence (purely evidence-driven) -------------------------------------

  const totalEvidenceItems = allKloeStatuses.length;
  const completeEvidenceItems = allKloeStatuses.filter((s) => s.status === 'complete').length;
  const confidence = calculateConfidence(completeEvidenceItems, totalEvidenceItems);

  // --- Persist -------------------------------------------------------------------

  const { data: existing } = await client
    .from('compliance_scores')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();

  const scorePayload = {
    score: overallScore,
    rating: predictedRating,
    domain_code: 'overall',
    predicted_rating: predictedRating,
    has_critical_gap: hasCriticalGap,
    total_gaps: openGaps.length,
    critical_gaps: openGaps.filter((g: any) => g.severity === 'CRITICAL').length,
    calculated_at: new Date().toISOString(),
    rating_confidence: confidence,
  };

  let complianceScoreId: string;

  if (existing) {
    await client
      .from('compliance_scores')
      .update({
        ...scorePayload,
        previous_score: existing.score,
        score_trend: overallScore - existing.score,
      })
      .eq('organization_id', organizationId);

    complianceScoreId = existing.id;

    await client
      .from('domain_scores')
      .delete()
      .eq('compliance_score_id', existing.id);
  } else {
    const { data: cs } = await client
      .from('compliance_scores')
      .insert({
        organization_id: organizationId,
        ...scorePayload,
      })
      .select()
      .single();

    complianceScoreId = cs.id;
  }

  const domainScoreRows = domainScoreData.map((ds) => {
    const domainGaps = openGaps.filter((g: any) => g.domain === ds.domain);
    return {
      compliance_score_id: complianceScoreId,
      domain: ds.domain,
      score: ds.score,
      max_score: 100,
      percentage: ds.score,
      status: ds.rating,
      total_gaps: domainGaps.length,
      critical_gaps: domainGaps.filter((g: any) => g.severity === 'CRITICAL').length,
      high_gaps: domainGaps.filter((g: any) => g.severity === 'HIGH').length,
      medium_gaps: domainGaps.filter((g: any) => g.severity === 'MEDIUM').length,
      low_gaps: domainGaps.filter((g: any) => g.severity === 'LOW').length,
    };
  });
  if (domainScoreRows.length > 0) {
    await client.from('domain_scores').insert(domainScoreRows);
  }

  const estimatedTimeToGood = calculateTimeToGood(domainScoreData, openGaps);

  return { overallScore, predictedRating, domainScores: domainScoreData, confidence, estimatedTimeToGood, kloeScores: allKloeScores };
}
