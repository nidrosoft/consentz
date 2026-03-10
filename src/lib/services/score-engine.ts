import { db } from '@/lib/db';

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

const DOMAIN_METRIC_MAPPING: Record<string, (metrics: ScoreInputs['consentzMetrics']) => number> = {
  safe: (m) => (m.consentCompletionRate * 0.3 + m.incidentResolutionRate * 0.4 + m.safetyChecklistScore * 0.3),
  effective: (m) => (m.staffCompetencyRate * 0.5 + m.consentCompletionRate * 0.5),
  caring: (m) => m.patientFeedbackAvg,
  responsive: (m) => (m.patientFeedbackAvg * 0.5 + m.consentCompletionRate * 0.5),
  well_led: (m) => {
    const allMetrics = (m.consentCompletionRate + m.staffCompetencyRate + m.incidentResolutionRate + m.safetyChecklistScore + m.patientFeedbackAvg + m.policyAckRate) / 6;
    return m.policyAckRate * 0.4 + allMetrics * 0.6;
  },
};

function getConsentzMetricForDomain(domain: string, metrics: ScoreInputs['consentzMetrics']): number {
  const fn = DOMAIN_METRIC_MAPPING[domain];
  return fn ? fn(metrics) : 50;
}

export function calculateDomainScore(domain: string, inputs: ScoreInputs): number {
  let score =
    inputs.assessmentScore * 0.30 +
    inputs.evidenceCoverage * 0.25 +
    getConsentzMetricForDomain(domain, inputs.consentzMetrics) * 0.25 +
    inputs.taskCompletionRate * 0.15;

  score -= inputs.overdueCriticalItems * 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export type CqcRatingType = 'OUTSTANDING' | 'GOOD' | 'REQUIRES_IMPROVEMENT' | 'INADEQUATE';

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

export async function recalculateComplianceScores(organizationId: string) {
  const domains = ['safe', 'effective', 'caring', 'responsive', 'well_led'];

  // Get latest assessment
  const assessment = await db.assessment.findFirst({
    where: { organizationId, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
  });

  // Get evidence coverage per domain
  const evidence = await db.evidenceItem.findMany({
    where: { organizationId, status: 'VALID' },
  });

  // Get tasks
  const allTasks = await db.task.findMany({ where: { organizationId } });
  const completedTasks = allTasks.filter((t) => t.status === 'COMPLETED');
  const taskCompletionRate = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 50;

  // Get overdue critical items
  const overdueCritical = await db.task.count({
    where: {
      organizationId,
      priority: 'CRITICAL',
      status: { not: 'COMPLETED' },
      dueDate: { lt: new Date() },
    },
  });

  // Get gaps
  const openGaps = await db.complianceGap.findMany({
    where: { organizationId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
  });
  const hasCriticalGap = openGaps.some((g) => g.severity === 'CRITICAL');

  // Default Consentz metrics (will be populated from sync data)
  const consentzMetrics = {
    consentCompletionRate: 85,
    staffCompetencyRate: 80,
    incidentResolutionRate: 75,
    safetyChecklistScore: 70,
    patientFeedbackAvg: 80,
    policyAckRate: 90,
  };

  const domainScoreData: { domain: string; score: number; rating: CqcRatingType }[] = [];
  let totalScore = 0;

  for (const domain of domains) {
    const domainEvidence = evidence.filter((e) => e.domains.includes(domain));
    const kloeCount = domain === 'safe' ? 6 : domain === 'effective' ? 7 : domain === 'caring' ? 3 : domain === 'responsive' ? 3 : 6;
    const evidenceCoverage = Math.min(100, (domainEvidence.length / Math.max(kloeCount * 2, 1)) * 100);

    const assessmentScore = assessment?.domainResults
      ? ((assessment.domainResults as Record<string, { score?: number }>)[domain]?.score ?? 50)
      : 50;

    const domainGaps = openGaps.filter((g) => g.domain === domain);

    const score = calculateDomainScore(domain, {
      assessmentScore,
      evidenceCoverage,
      consentzMetrics,
      taskCompletionRate,
      overdueCriticalItems: domainGaps.filter((g) => g.severity === 'CRITICAL').length,
    });

    const rating = scoreToRating(score);
    domainScoreData.push({ domain, score, rating });
    totalScore += score;
  }

  const overallScore = Math.round(totalScore / domains.length);
  let predictedRating = scoreToRating(overallScore);
  if (hasCriticalGap && (predictedRating === 'OUTSTANDING' || predictedRating === 'GOOD')) {
    predictedRating = 'REQUIRES_IMPROVEMENT';
  }

  // Upsert compliance score
  const existing = await db.complianceScore.findUnique({
    where: { organizationId },
  });

  if (existing) {
    await db.complianceScore.update({
      where: { organizationId },
      data: {
        score: overallScore,
        rating: predictedRating as any,
        domainCode: 'overall',
        previousScore: existing.score,
        scoreTrend: overallScore - existing.score,
        predictedRating: predictedRating as any,
        hasCriticalGap,
        totalGaps: openGaps.length,
        criticalGaps: openGaps.filter((g) => g.severity === 'CRITICAL').length,
        calculatedAt: new Date(),
      },
    });

    // Delete old domain scores and insert new ones
    await db.domainScore.deleteMany({ where: { complianceScoreId: existing.id } });
    for (const ds of domainScoreData) {
      await db.domainScore.create({
        data: {
          complianceScoreId: existing.id,
          domain: ds.domain,
          score: ds.score,
          maxScore: 100,
          percentage: ds.score,
          status: ds.rating as any,
          totalGaps: openGaps.filter((g) => g.domain === ds.domain).length,
          criticalGaps: openGaps.filter((g) => g.domain === ds.domain && g.severity === 'CRITICAL').length,
          highGaps: openGaps.filter((g) => g.domain === ds.domain && g.severity === 'HIGH').length,
          mediumGaps: openGaps.filter((g) => g.domain === ds.domain && g.severity === 'MEDIUM').length,
          lowGaps: openGaps.filter((g) => g.domain === ds.domain && g.severity === 'LOW').length,
        },
      });
    }
  } else {
    const cs = await db.complianceScore.create({
      data: {
        organizationId,
        score: overallScore,
        rating: predictedRating as any,
        domainCode: 'overall',
        predictedRating: predictedRating as any,
        hasCriticalGap,
        totalGaps: openGaps.length,
        criticalGaps: openGaps.filter((g) => g.severity === 'CRITICAL').length,
        calculatedAt: new Date(),
      },
    });

    for (const ds of domainScoreData) {
      await db.domainScore.create({
        data: {
          complianceScoreId: cs.id,
          domain: ds.domain,
          score: ds.score,
          maxScore: 100,
          percentage: ds.score,
          status: ds.rating as any,
          totalGaps: openGaps.filter((g) => g.domain === ds.domain).length,
          criticalGaps: openGaps.filter((g) => g.domain === ds.domain && g.severity === 'CRITICAL').length,
          highGaps: openGaps.filter((g) => g.domain === ds.domain && g.severity === 'HIGH').length,
          mediumGaps: openGaps.filter((g) => g.domain === ds.domain && g.severity === 'MEDIUM').length,
          lowGaps: openGaps.filter((g) => g.domain === ds.domain && g.severity === 'LOW').length,
        },
      });
    }
  }

  return { overallScore, predictedRating, domainScores: domainScoreData };
}
