import { getDb } from '@/lib/db';
import {
  ASSESSMENT_QUESTIONS,
  getQuestionsForServiceType,
  type AssessmentQuestion,
  type ServiceType,
} from '@/lib/constants/assessment-questions';
import { getKloesForDomain } from '@/lib/constants/cqc-evidence-requirements';
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
  answeredCount: number,
  totalQuestions: number,
  currentEvidenceCount: number,
): number {
  const questionCoverage =
    Math.min(answeredCount / Math.max(totalQuestions, 1), 1.0) * 0.4;
  const expectedEvidence = totalQuestions * 0.6;
  const evidenceCoverage =
    Math.min(currentEvidenceCount / Math.max(expectedEvidence, 1), 1.0) * 0.4;
  const recencyFactor = 0.15;
  return Math.round((questionCoverage + evidenceCoverage + recencyFactor) * 100) / 100;
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
// Main recalculation
// ---------------------------------------------------------------------------

export async function recalculateComplianceScores(organizationId: string) {
  const client = await getDb();
  const domains = ['safe', 'effective', 'caring', 'responsive', 'well_led'];

  // Domain key used in ASSESSMENT_QUESTIONS is UPPER_CASE; map lowercase slugs.
  const domainKeyMap: Record<string, string> = {
    safe: 'SAFE',
    effective: 'EFFECTIVE',
    caring: 'CARING',
    responsive: 'RESPONSIVE',
    well_led: 'WELL_LED',
  };

  // --- Load data in parallel ---------------------------------------------------

  const [
    assessmentResult,
    responsesResult,
    evidenceResult,
    allEvidenceResult,
    policiesResult,
    staffResult,
    trainingResult,
    allTasksResult,
    overdueCriticalResult,
    openGapsResult,
    orgResult,
  ] = await Promise.all([
    client
      .from('assessments')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from('assessment_responses')
      .select('question_id, answer, assessment_id')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false }),
    client
      .from('evidence_items')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'VALID'),
    client
      .from('evidence_items')
      .select('*')
      .eq('organization_id', organizationId),
    client
      .from('policies')
      .select('*')
      .eq('organization_id', organizationId),
    client
      .from('staff_members')
      .select('*')
      .eq('organization_id', organizationId),
    client
      .from('training_records')
      .select('*')
      .eq('organization_id', organizationId),
    client
      .from('tasks')
      .select('*')
      .eq('organization_id', organizationId),
    client
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('priority', 'CRITICAL')
      .neq('status', 'COMPLETED')
      .lt('due_date', new Date().toISOString()),
    client
      .from('compliance_gaps')
      .select('*')
      .eq('organization_id', organizationId)
      .in('status', ['OPEN', 'IN_PROGRESS']),
    client
      .from('organizations')
      .select('service_type')
      .eq('id', organizationId)
      .maybeSingle(),
  ]);

  const assessment = assessmentResult.data;
  const allEvidence = allEvidenceResult.data ?? [];
  const validEvidence = evidenceResult.data ?? [];
  const policies = policiesResult.data ?? [];
  const staff = staffResult.data ?? [];
  const trainingRecords = trainingResult.data ?? [];
  const tasks = allTasksResult.data ?? [];
  const openGaps = openGapsResult.data ?? [];
  const hasCriticalGap = openGaps.some((g: any) => g.severity === 'CRITICAL');

  const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED');
  const taskCompletionRate =
    tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 50;

  const serviceType = (orgResult.data?.service_type ?? 'AESTHETIC_CLINIC') as ServiceType;

  // Build a map of question_id → answer value from the latest completed assessment
  const answerMap = new Map<string, string>();
  let assessmentResponses = responsesResult.data ?? [];
  if (assessment) {
    assessmentResponses = assessmentResponses.filter(
      (r: any) => r.assessment_id === assessment.id,
    );
  }
  for (const r of assessmentResponses) {
    answerMap.set(r.question_id, r.answer);
  }

  // Get questions for this service type
  const allQuestions = getQuestionsForServiceType(serviceType);

  // Build a lookup for quick question access
  const questionById = new Map<string, AssessmentQuestion>();
  for (const q of ASSESSMENT_QUESTIONS) {
    questionById.set(q.id, q);
  }

  // Fetch real Consentz metrics from sync logs
  const consentzMetrics = await getConsentzMetrics(organizationId);

  // --- Per-domain scoring using scoreAnswer ------------------------------------

  const domainScoreData: { domain: string; score: number; rating: CqcRatingType }[] = [];
  let totalAnswered = 0;
  let totalQuestionsCount = 0;

  for (const domain of domains) {
    const upperDomain = domainKeyMap[domain];
    const domainQuestions = allQuestions.filter((q) => q.domain === upperDomain);
    totalQuestionsCount += domainQuestions.length;

    let totalWeightedScore = 0;
    let totalWeightedMax = 0;
    let answeredCount = 0;

    for (const question of domainQuestions) {
      const rawAnswer = answerMap.get(question.id);
      if (rawAnswer === undefined) continue;

      answeredCount++;

      // Parse multi_select answers stored as JSON strings
      let parsedAnswer: unknown = rawAnswer;
      if (question.answerType === 'multi_select') {
        try {
          parsedAnswer = JSON.parse(rawAnswer);
        } catch {
          parsedAnswer = rawAnswer;
        }
      }

      const result = scoreAnswer(question, parsedAnswer);
      totalWeightedScore += result.score;
      totalWeightedMax += result.maxScore;
    }

    totalAnswered += answeredCount;

    // Assessment percentage for this domain
    const assessmentScore =
      totalWeightedMax > 0
        ? (totalWeightedScore / totalWeightedMax) * 100
        : assessment?.domain_results
          ? ((assessment.domain_results as Record<string, { score?: number }>)[domain]
              ?.score ?? 50)
          : 50;

    // Evidence coverage
    const domainEvidence = validEvidence.filter((e: any) => e.domains?.includes(domain));
    const kloeCount = domainQuestions.length;
    const evidenceCoverage = Math.min(
      100,
      (domainEvidence.length / Math.max(kloeCount * 2, 1)) * 100,
    );

    // Evidence quality factor (0.5–1.0), blended with evidence status completion
    const rawQuality = calculateEvidenceQuality(domain, allEvidence, policies);
    const statusFactor = await getEvidenceStatusFactor(organizationId, domain, serviceType);
    const evidenceQuality = rawQuality * 0.5 + statusFactor * 0.5;

    // Timeliness factor (0.5–1.0)
    const timeliness = calculateTimeliness(domain, allEvidence, trainingRecords, staff);

    // Domain gaps
    const domainGaps = openGaps.filter((g: any) => g.domain === domain);

    // Base score via the existing weighted formula
    const baseScore = calculateDomainScore(domain, {
      assessmentScore,
      evidenceCoverage,
      consentzMetrics,
      taskCompletionRate,
      overdueCriticalItems: domainGaps.filter((g: any) => g.severity === 'CRITICAL')
        .length,
    });

    // Apply evidence quality & timeliness modifiers
    const adjustedScore = Math.max(
      0,
      Math.min(100, Math.round(baseScore * evidenceQuality * timeliness)),
    );

    // Rating with limiters
    let rating = scoreToRating(adjustedScore);
    const domainCritical = domainGaps.filter(
      (g: any) => g.severity === 'CRITICAL',
    ).length;
    const domainHigh = domainGaps.filter((g: any) => g.severity === 'HIGH').length;

    if (domainCritical > 0 && (rating === 'OUTSTANDING' || rating === 'GOOD')) {
      rating = 'REQUIRES_IMPROVEMENT';
    }
    if (domainHigh > 0 && rating === 'OUTSTANDING') {
      rating = 'GOOD';
    }

    domainScoreData.push({ domain, score: adjustedScore, rating });
  }

  // --- Overall score & CQC domain-level aggregation ----------------------------

  const overallScore = calculateOverallScore(domainScoreData);
  const predictedRating = determineOverallRating(domainScoreData, hasCriticalGap);

  // --- Confidence ---------------------------------------------------------------

  const confidence = calculateConfidence(
    totalAnswered,
    totalQuestionsCount,
    allEvidence.length,
  );

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

    for (const ds of domainScoreData) {
    const domainGaps = openGaps.filter((g: any) => g.domain === ds.domain);
    await client.from('domain_scores').insert({
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
    });
  }

  const estimatedTimeToGood = calculateTimeToGood(domainScoreData, openGaps);

  return { overallScore, predictedRating, domainScores: domainScoreData, confidence, estimatedTimeToGood };
}
