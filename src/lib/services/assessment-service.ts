// =============================================================================
// Assessment Service — Self-assessment engine with scoring and gap generation
// =============================================================================

import type { DomainSlug, GapSeverity } from '@/types';
import { db } from '@/lib/db';
import { CQC_DOMAINS, KLOES, getRatingFromScore } from '@/lib/constants/cqc-framework';
import { recalculateComplianceScores } from '@/lib/services/score-engine';
import type { ServiceType } from '@prisma/client';

interface AssessmentAnswer {
  questionId: string;
  questionText: string;
  step: number;
  domain: string;
  kloeCode?: string;
  answerValue: boolean | string | string[] | number;
  answerType: string;
}

interface SaveAnswersParams {
  assessmentId?: string;
  organizationId: string;
  userId: string;
  serviceType: string;
  currentStep: number;
  answers: AssessmentAnswer[];
}

interface CalculateParams {
  assessmentId: string;
  organizationId: string;
  userId: string;
}

interface DomainResult {
  domainId: string;
  domainName: string;
  slug: DomainSlug;
  score: number;
  rating: string;
  answeredCount: number;
  totalQuestions: number;
}

interface AssessmentResult {
  assessmentId: string;
  overallScore: number;
  overallRating: string;
  domains: DomainResult[];
  gapsCreated: number;
  tasksCreated: number;
}

function serializeAnswerValue(value: boolean | string | string[] | number): string {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

export class AssessmentService {
  /**
   * Get the latest assessment for an organization.
   */
  static async getLatest(organizationId: string) {
    const assessment = await db.assessment.findFirst({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      include: {
        responses: {
          include: {
            question: { include: { kloe: true } },
          },
        },
      },
    });

    if (!assessment) return null;

    return AssessmentService.toApiFormat(assessment);
  }

  /**
   * Get a single assessment by ID with responses.
   */
  static async getById(id: string) {
    const assessment = await db.assessment.findUnique({
      where: { id },
      include: {
        responses: {
          include: {
            question: { include: { kloe: true } },
          },
        },
      },
    });

    if (!assessment) return null;

    return AssessmentService.toApiFormat(assessment);
  }

  /**
   * Create or update an assessment with new answers.
   * Merges answers by questionId.
   */
  static async saveAnswers(params: SaveAnswersParams) {
    const serviceType = params.serviceType as ServiceType;

    if (params.assessmentId) {
      const existing = await db.assessment.findUnique({
        where: { id: params.assessmentId, organizationId: params.organizationId },
        include: {
          responses: {
            include: {
              question: { include: { kloe: true } },
            },
          },
        },
      });

      if (existing) {
        const answerMap = new Map<string, AssessmentAnswer>();
        for (const r of existing.responses) {
          const q = r.question;
          const code = q.kloe?.code ?? 'S1';
          const domainCode = code[0] ?? 'S';
          const domain = CQC_DOMAINS.find((d) => d.code === domainCode)?.slug ?? 'safe';
          answerMap.set(r.questionId, {
            questionId: r.questionId,
            questionText: q.question,
            step: 1,
            domain,
            kloeCode: q.kloe?.code,
            answerValue: r.answer as string | boolean | number,
            answerType: q.questionType,
          });
        }
        for (const a of params.answers) {
          answerMap.set(a.questionId, a);
        }

        const mergedAnswers = Array.from(answerMap.values());

        await db.assessmentResponse.deleteMany({
          where: { assessmentId: params.assessmentId },
        });

        await db.assessment.update({
          where: { id: params.assessmentId },
          data: {
            currentStep: params.currentStep,
            updatedAt: new Date(),
          },
        });

        for (const a of mergedAnswers) {
          await db.assessmentResponse.create({
            data: {
              assessmentId: params.assessmentId,
              questionId: a.questionId,
              answer: serializeAnswerValue(a.answerValue),
              evidenceIds: [],
            },
          });
        }

        return AssessmentService.getById(params.assessmentId) as Promise<NonNullable<Awaited<ReturnType<typeof AssessmentService.getById>>>>;
      }
    }

    const assessment = await db.assessment.create({
      data: {
        organizationId: params.organizationId,
        serviceType,
        status: 'IN_PROGRESS',
        startedBy: params.userId,
        currentStep: params.currentStep,
      },
    });

    for (const a of params.answers) {
      await db.assessmentResponse.create({
        data: {
          assessmentId: assessment.id,
          questionId: a.questionId,
          answer: serializeAnswerValue(a.answerValue),
          evidenceIds: [],
        },
      });
    }

    return AssessmentService.getById(assessment.id) as Promise<NonNullable<Awaited<ReturnType<typeof AssessmentService.getById>>>>;
  }

  /**
   * Calculate assessment results, generate gaps and tasks, update compliance score.
   */
  static async calculate(params: CalculateParams): Promise<AssessmentResult> {
    const assessment = await db.assessment.findUnique({
      where: { id: params.assessmentId, organizationId: params.organizationId },
      include: {
        responses: {
          include: {
            question: {
              include: { kloe: true },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new Error(`Assessment ${params.assessmentId} not found`);
    }

    const answers = assessment.responses.map((r) => {
      const q = r.question;
      const code = q.kloe?.code ?? 'S1';
      const domainCode = code[0] ?? 'S';
      const domain = CQC_DOMAINS.find((d) => d.code === domainCode)?.slug ?? 'safe';
      return {
        questionId: r.questionId,
        questionText: q.question,
        step: 1,
        domain,
        kloeCode: q.kloe?.code,
        answerValue: r.answer,
        answerType: q.questionType,
        weight: q.weight,
      };
    });

    const domainAnswers = new Map<string, typeof answers>();
    for (const answer of answers) {
      const domain = answer.domain;
      if (!domainAnswers.has(domain)) {
        domainAnswers.set(domain, []);
      }
      domainAnswers.get(domain)!.push(answer);
    }

    const domainResults: DomainResult[] = CQC_DOMAINS.map((domain) => {
      const domainAns = domainAnswers.get(domain.slug) ?? [];

      if (domainAns.length === 0) {
        return {
          domainId: domain.id,
          domainName: domain.name,
          slug: domain.slug as DomainSlug,
          score: 0,
          rating: 'NOT_RATED',
          answeredCount: 0,
          totalQuestions: 0,
        };
      }

      let weightedScore = 0;
      let maxWeightedScore = 0;
      for (const a of domainAns) {
        const raw = AssessmentService.scoreAnswer(a);
        const w = a.weight ?? 1.0;
        weightedScore += raw * w;
        maxWeightedScore += w;
      }
      const percentage = maxWeightedScore > 0 ? Math.round((weightedScore / maxWeightedScore) * 100) : 0;
      const rating = getRatingFromScore(percentage);

      return {
        domainId: domain.id,
        domainName: domain.name,
        slug: domain.slug as DomainSlug,
        score: percentage,
        rating,
        answeredCount: domainAns.length,
        totalQuestions: domainAns.length,
      };
    });

    const scoredDomains = domainResults.filter((d) => d.answeredCount > 0);
    let overallScore = 0;
    let overallRating = 'NOT_RATED';

    if (scoredDomains.length > 0) {
      const average =
        scoredDomains.reduce((sum, d) => sum + d.score, 0) / scoredDomains.length;
      const lowestScore = Math.min(...scoredDomains.map((d) => d.score));
      overallScore = Math.round(Math.min(average, lowestScore + 10));
      overallRating = getRatingFromScore(overallScore);
    }

    let gapsCreated = 0;
    let tasksCreated = 0;

    for (const domainResult of scoredDomains) {
      if (domainResult.score < 63) {
        const severity = AssessmentService.getSeverityFromScore(domainResult.score);
        const kloeCode = KLOES.find((k) => k.domain === domainResult.slug)?.code ?? '';

        await db.complianceGap.create({
          data: {
            organizationId: params.organizationId,
            domain: domainResult.slug,
            kloeCode,
            title: `${domainResult.domainName} domain needs improvement`,
            description: `Assessment scored ${domainResult.score}% in the ${domainResult.domainName} domain, below the "Good" threshold of 63%.`,
            severity,
            status: 'OPEN',
            source: 'assessment',
            assessmentId: params.assessmentId,
          },
        });
        gapsCreated++;

        if (severity === 'CRITICAL' || severity === 'HIGH') {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + (severity === 'CRITICAL' ? 7 : 14));

          const gap = await db.complianceGap.findFirst({
            where: {
              organizationId: params.organizationId,
              assessmentId: params.assessmentId,
              domain: domainResult.slug,
            },
            orderBy: { createdAt: 'desc' },
          });

          await db.task.create({
            data: {
              organizationId: params.organizationId,
              title: `Address ${domainResult.domainName} compliance gap`,
              description: `Review and improve ${domainResult.domainName} domain compliance. Current score: ${domainResult.score}%.`,
              status: 'TODO',
              priority: severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
              assignedTo: params.userId,
              assignedToName: params.userId,
              dueDate,
              source: 'ASSESSMENT',
              sourceId: params.assessmentId,
              gapId: gap?.id,
              domains: [domainResult.slug],
              kloeCode,
            },
          });
          tasksCreated++;
        }
      }
    }

    const domainResultsJson = Object.fromEntries(
      domainResults.map((d) => [d.slug, { score: d.score, rating: d.rating }]),
    );

    await db.assessment.update({
      where: { id: params.assessmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        overallScore,
        predictedRating: overallRating as 'OUTSTANDING' | 'GOOD' | 'REQUIRES_IMPROVEMENT' | 'INADEQUATE',
        totalGaps: gapsCreated,
        criticalGaps: domainResults.filter((d) => d.rating === 'INADEQUATE').length,
        highGaps: domainResults.filter((d) => d.rating === 'REQUIRES_IMPROVEMENT').length,
        mediumGaps: 0,
        lowGaps: 0,
        domainResults: domainResultsJson,
      },
    });

    await recalculateComplianceScores(params.organizationId);

    return {
      assessmentId: params.assessmentId,
      overallScore,
      overallRating,
      domains: domainResults,
      gapsCreated,
      tasksCreated,
    };
  }

  private static scoreAnswer(answer: { answerValue: unknown; answerType: string }): number {
    const value = answer.answerValue;
    const type = answer.answerType.toUpperCase();

    switch (type) {
      case 'YES_NO': {
        return value === true || value === 'yes' ? 1 : 0;
      }
      case 'SCALE': {
        const numVal = typeof value === 'number' ? value : Number(value);
        return isNaN(numVal) ? 0 : Math.min(numVal / 5, 1);
      }
      case 'MULTIPLE_CHOICE': {
        if (Array.isArray(value)) {
          return Math.min(value.length / 5, 1);
        }
        try {
          const parsed = JSON.parse(String(value));
          return Array.isArray(parsed) ? Math.min(parsed.length / 5, 1) : 0;
        } catch {
          return 0;
        }
      }
      case 'TEXT': {
        return value && String(value).trim().length > 0 ? 0.5 : 0;
      }
      default:
        return 0;
    }
  }

  private static getSeverityFromScore(score: number): GapSeverity {
    if (score < 25) return 'CRITICAL';
    if (score < 40) return 'HIGH';
    if (score < 55) return 'MEDIUM';
    return 'LOW';
  }

  private static toApiFormat(
    assessment: Awaited<ReturnType<typeof db.assessment.findUnique>> & {
      responses: Array<{
        id: string;
        questionId: string;
        answer: string;
        score: number | null;
        notes: string | null;
        evidenceIds: string[];
        question: { id: string; question: string; questionType: string; kloe?: { code: string } | null };
      }>;
    },
  ) {
    if (!assessment) return null;

    const answers = assessment.responses.map((r) => {
      const q = r.question;
      const code = q.kloe?.code ?? 'S1';
      const domainCode = code[0] ?? 'S';
      const domain = CQC_DOMAINS.find((d) => d.code === domainCode)?.slug ?? 'safe';
      let answerValue: boolean | string | number | string[] = r.answer;
      if (r.answer === 'yes' || r.answer === 'no') {
        answerValue = r.answer === 'yes';
      } else if (!isNaN(Number(r.answer))) {
        answerValue = Number(r.answer);
      } else {
        try {
          const parsed = JSON.parse(r.answer);
          if (Array.isArray(parsed)) answerValue = parsed;
        } catch {
          /* keep string */
        }
      }
      return {
        questionId: r.questionId,
        questionText: q.question,
        step: 1,
        domain,
        kloeCode: q.kloe?.code,
        answerValue,
        answerType: q.questionType,
      };
    });

    return {
      id: assessment.id,
      organizationId: assessment.organizationId,
      userId: assessment.startedBy,
      serviceType: assessment.serviceType,
      status: assessment.status,
      currentStep: assessment.currentStep,
      answers,
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString(),
      completedAt: assessment.completedAt?.toISOString() ?? null,
    };
  }
}
