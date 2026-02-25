// =============================================================================
// Assessment Service — Self-assessment engine with scoring and gap generation
// =============================================================================

import type { ComplianceScore, DomainSlug, GapSeverity, TaskPriority } from '@/types';
import type { Assessment, AssessmentAnswer } from '@/lib/mock-data/store';
import {
  assessmentStore,
  complianceScoreStore,
  gapStore,
  taskStore,
  generateId,
} from '@/lib/mock-data/store';
import { CQC_DOMAINS, KLOES, getRatingFromScore } from '@/lib/constants/cqc-framework';

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

export class AssessmentService {
  /**
   * Get the latest assessment for an organization.
   */
  static getLatest(organizationId: string): Assessment | undefined {
    const assessments = assessmentStore.filter(
      (a) => a.organizationId === organizationId,
    );

    if (assessments.length === 0) return undefined;

    // Return the most recently updated
    return assessments.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];
  }

  /**
   * Get a single assessment by ID.
   */
  static getById(id: string): Assessment | undefined {
    return assessmentStore.getById(id);
  }

  /**
   * Create or update an assessment with new answers.
   * Merges answers by questionId.
   */
  static saveAnswers(params: SaveAnswersParams): Assessment {
    const now = new Date().toISOString();

    if (params.assessmentId) {
      // Update existing assessment
      const existing = assessmentStore.getById(params.assessmentId);
      if (existing) {
        // Merge answers: new answers override existing ones by questionId
        const answerMap = new Map<string, AssessmentAnswer>();
        for (const answer of existing.answers) {
          answerMap.set(answer.questionId, answer);
        }
        for (const answer of params.answers) {
          answerMap.set(answer.questionId, answer);
        }

        const mergedAnswers = Array.from(answerMap.values());

        const updated = assessmentStore.update(params.assessmentId, {
          currentStep: params.currentStep,
          answers: mergedAnswers,
          updatedAt: now,
        });

        return updated!;
      }
    }

    // Create new assessment
    const assessment: Assessment = {
      id: generateId('assess'),
      organizationId: params.organizationId,
      userId: params.userId,
      serviceType: params.serviceType,
      status: 'IN_PROGRESS',
      currentStep: params.currentStep,
      answers: params.answers,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };

    return assessmentStore.create(assessment);
  }

  /**
   * Calculate assessment results, generate gaps and tasks, update compliance score.
   *
   * Scoring rules per answer type:
   * - yes_no: yes=1, no=0
   * - yes_no_partial: yes=1, partial=0.5, no=0
   * - scale: value/5
   * - multi_select: count/5 (capped at 1)
   */
  static calculate(params: CalculateParams): AssessmentResult {
    const assessment = assessmentStore.getById(params.assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${params.assessmentId} not found`);
    }

    const answers = assessment.answers;

    // Group answers by domain
    const domainAnswers = new Map<string, AssessmentAnswer[]>();
    for (const answer of answers) {
      const domain = answer.domain;
      if (!domainAnswers.has(domain)) {
        domainAnswers.set(domain, []);
      }
      domainAnswers.get(domain)!.push(answer);
    }

    // Score each domain
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

      // Calculate score for each answer
      const scores = domainAns.map((answer) => {
        return AssessmentService.scoreAnswer(answer);
      });

      const totalScore = scores.reduce((sum, s) => sum + s, 0);
      const percentage = Math.round((totalScore / domainAns.length) * 100);
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

    // Overall score = average of domain scores, capped by lowest
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

    // Generate gaps for low-scoring areas
    let gapsCreated = 0;
    let tasksCreated = 0;

    for (const domainResult of scoredDomains) {
      if (domainResult.score < 63) {
        // Below "Good" threshold
        const severity = AssessmentService.getSeverityFromScore(domainResult.score);

        const gap = gapStore.create({
          id: generateId('gap'),
          title: `${domainResult.domainName} domain needs improvement`,
          description: `Assessment scored ${domainResult.score}% in the ${domainResult.domainName} domain, below the "Good" threshold of 63%.`,
          severity,
          status: 'OPEN',
          domain: domainResult.slug,
          kloe: KLOES.find((k) => k.domain === domainResult.slug)?.code ?? '',
          regulation: '',
          createdAt: new Date().toISOString(),
        });
        gapsCreated++;

        // Create tasks for CRITICAL and HIGH severity gaps
        if (severity === 'CRITICAL' || severity === 'HIGH') {
          const priority: TaskPriority = severity === 'CRITICAL' ? 'URGENT' : 'HIGH';
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + (severity === 'CRITICAL' ? 7 : 14));

          taskStore.create({
            id: generateId('task'),
            title: `Address ${domainResult.domainName} compliance gap`,
            description: `Review and improve ${domainResult.domainName} domain compliance. Current score: ${domainResult.score}%.`,
            status: 'TODO',
            priority,
            assignee: params.userId,
            dueDate: dueDate.toISOString().split('T')[0],
            relatedGapId: gap.id,
            domain: domainResult.slug,
          });
          tasksCreated++;
        }
      }
    }

    // Update compliance score store
    const updatedScore: ComplianceScore = {
      overall: overallScore,
      domains: domainResults.map((d) => ({
        domainId: d.domainId,
        domainName: d.domainName,
        slug: d.slug,
        score: d.score,
        rating: getRatingFromScore(d.score),
        gapCount: gapStore.count(
          (g) => g.domain === d.slug && (g.status === 'OPEN' || g.status === 'IN_PROGRESS'),
        ),
        trend: 0,
        kloeCount: d.answeredCount,
      })),
      predictedRating: getRatingFromScore(overallScore),
      lastUpdated: new Date().toISOString(),
    };

    complianceScoreStore.current = updatedScore;

    // Mark assessment as completed
    assessmentStore.update(params.assessmentId, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    });

    return {
      assessmentId: params.assessmentId,
      overallScore,
      overallRating,
      domains: domainResults,
      gapsCreated,
      tasksCreated,
    };
  }

  /**
   * Score a single answer on a 0-1 scale.
   */
  private static scoreAnswer(answer: AssessmentAnswer): number {
    const value = answer.answerValue;
    const type = answer.answerType;

    switch (type) {
      case 'yes_no': {
        return value === true || value === 'yes' ? 1 : 0;
      }

      case 'yes_no_partial': {
        if (value === true || value === 'yes') return 1;
        if (value === 'partial') return 0.5;
        return 0;
      }

      case 'scale': {
        const numVal = typeof value === 'number' ? value : Number(value);
        return isNaN(numVal) ? 0 : Math.min(numVal / 5, 1);
      }

      case 'multi_select': {
        if (Array.isArray(value)) {
          return Math.min(value.length / 5, 1);
        }
        return 0;
      }

      default:
        return 0;
    }
  }

  /**
   * Map a domain score to a gap severity level.
   */
  private static getSeverityFromScore(score: number): GapSeverity {
    if (score < 25) return 'CRITICAL';
    if (score < 40) return 'HIGH';
    if (score < 55) return 'MEDIUM';
    return 'LOW';
  }
}
