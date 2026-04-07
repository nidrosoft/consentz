// =============================================================================
// Assessment Service — Self-assessment engine with scoring and gap generation
// =============================================================================

import type { DomainSlug, GapSeverity } from '@/types';
import { getDb } from '@/lib/db';
import { CQC_DOMAINS, KLOES, getRatingFromScore } from '@/lib/constants/cqc-framework';
import { recalculateComplianceScores } from '@/lib/services/score-engine';

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
    const client = await getDb();
    const { data: assessment } = await client.from('assessments')
      .select('*, assessment_responses(*, assessment_questions(*, kloes(*)))')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!assessment) return null;

    return AssessmentService.toApiFormat(assessment);
  }

  /**
   * Get a single assessment by ID with responses.
   */
  static async getById(id: string) {
    const client = await getDb();
    const { data: assessment } = await client.from('assessments')
      .select('*, assessment_responses(*, assessment_questions(*, kloes(*)))')
      .eq('id', id)
      .maybeSingle();

    if (!assessment) return null;

    return AssessmentService.toApiFormat(assessment);
  }

  /**
   * Create or update an assessment with new answers.
   * Merges answers by questionId.
   */
  static async saveAnswers(params: SaveAnswersParams) {
    const client = await getDb();
    if (params.assessmentId) {
      const { data: existing } = await client.from('assessments')
        .select('*, assessment_responses(*, assessment_questions(*, kloes(*)))')
        .eq('id', params.assessmentId)
        .eq('organization_id', params.organizationId)
        .maybeSingle();

      if (existing) {
        const answerMap = new Map<string, AssessmentAnswer>();
        for (const r of (existing.assessment_responses ?? [])) {
          const q = r.assessment_questions;
          const code = q?.kloes?.code ?? 'S1';
          const domainCode = code[0] ?? 'S';
          const domain = CQC_DOMAINS.find((d) => d.code === domainCode)?.slug ?? 'safe';
          answerMap.set(r.question_id, {
            questionId: r.question_id,
            questionText: q?.question ?? '',
            step: 1,
            domain,
            kloeCode: q?.kloes?.code,
            answerValue: r.answer as string | boolean | number,
            answerType: q?.question_type ?? 'YES_NO',
          });
        }
        for (const a of params.answers) {
          answerMap.set(a.questionId, a);
        }

        const mergedAnswers = Array.from(answerMap.values());

        await client.from('assessment_responses')
          .delete()
          .eq('assessment_id', params.assessmentId);

        await client.from('assessments')
          .update({
            current_step: params.currentStep,
            updated_at: new Date().toISOString(),
          })
          .eq('id', params.assessmentId);

        await client.from('assessment_responses').insert(
          mergedAnswers.map((a) => ({
            assessment_id: params.assessmentId,
            question_id: a.questionId,
            answer: serializeAnswerValue(a.answerValue),
            evidence_ids: [],
          })),
        );

        return AssessmentService.getById(params.assessmentId) as Promise<NonNullable<Awaited<ReturnType<typeof AssessmentService.getById>>>>;
      }
    }

    const { data: assessment } = await client.from('assessments').insert({
      organization_id: params.organizationId,
      service_type: params.serviceType,
      status: 'IN_PROGRESS',
      started_by: params.userId,
      current_step: params.currentStep,
    }).select().single();

    await client.from('assessment_responses').insert(
      params.answers.map((a) => ({
        assessment_id: assessment.id,
        question_id: a.questionId,
        answer: serializeAnswerValue(a.answerValue),
        evidence_ids: [],
      })),
    );

    return AssessmentService.getById(assessment.id) as Promise<NonNullable<Awaited<ReturnType<typeof AssessmentService.getById>>>>;
  }

  /**
   * Calculate assessment results, generate gaps and tasks, update compliance score.
   */
  static async calculate(params: CalculateParams): Promise<AssessmentResult> {
    const client = await getDb();
    const { data: assessment } = await client.from('assessments')
      .select('*, assessment_responses(*, assessment_questions(*, kloes(*)))')
      .eq('id', params.assessmentId)
      .eq('organization_id', params.organizationId)
      .single();

    if (!assessment) {
      throw new Error(`Assessment ${params.assessmentId} not found`);
    }

    const answers = (assessment.assessment_responses ?? []).map((r: any) => {
      const q = r.assessment_questions;
      const code = q?.kloes?.code ?? 'S1';
      const domainCode = code[0] ?? 'S';
      const domain = CQC_DOMAINS.find((d) => d.code === domainCode)?.slug ?? 'safe';
      return {
        questionId: r.question_id,
        questionText: q?.question ?? '',
        step: 1,
        domain,
        kloeCode: q?.kloes?.code,
        answerValue: r.answer,
        answerType: q?.question_type ?? 'YES_NO',
        weight: q?.weight ?? 1.0,
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

    // Batch-insert gaps for domains below "Good" threshold
    const gapRows = scoredDomains
      .filter((d) => d.score < 63)
      .map((d) => ({
        organization_id: params.organizationId,
        domain: d.slug,
        kloe_code: KLOES.find((k) => k.domain === d.slug)?.code ?? '',
        title: `${d.domainName} domain needs improvement`,
        description: `Assessment scored ${d.score}% in the ${d.domainName} domain, below the "Good" threshold of 63%.`,
        severity: AssessmentService.getSeverityFromScore(d.score),
        status: 'OPEN',
        source: 'assessment',
        assessment_id: params.assessmentId,
        remediation_steps: { action: 'Upload evidence' },
      }));

    let gapsCreated = 0;
    let tasksCreated = 0;
    let insertedGaps: any[] = [];

    if (gapRows.length > 0) {
      const { data: gaps } = await client.from('compliance_gaps')
        .insert(gapRows)
        .select();
      insertedGaps = gaps ?? [];
      gapsCreated = insertedGaps.length;
    }

    // Batch-insert tasks for critical/high gaps
    const taskRows = insertedGaps
      .filter((g: any) => g.severity === 'CRITICAL' || g.severity === 'HIGH')
      .map((g: any) => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (g.severity === 'CRITICAL' ? 7 : 14));
        return {
          organization_id: params.organizationId,
          title: `Address ${g.domain.charAt(0).toUpperCase() + g.domain.slice(1)} compliance gap`,
          description: `Review and improve ${g.domain} domain compliance.`,
          status: 'TODO',
          priority: g.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          assigned_to: params.userId,
          assigned_to_name: params.userId,
          due_date: dueDate.toISOString(),
          source: 'ASSESSMENT',
          source_id: params.assessmentId,
          gap_id: g.id,
          domains: [g.domain],
          kloe_code: g.kloe_code,
        };
      });

    if (taskRows.length > 0) {
      await client.from('tasks').insert(taskRows);
      tasksCreated = taskRows.length;
    }

    const domainResultsJson = Object.fromEntries(
      domainResults.map((d) => [d.slug, { score: d.score, rating: d.rating }]),
    );

    await client.from('assessments')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        overall_score: overallScore,
        predicted_rating: overallRating as 'OUTSTANDING' | 'GOOD' | 'REQUIRES_IMPROVEMENT' | 'INADEQUATE',
        total_gaps: gapsCreated,
        critical_gaps: domainResults.filter((d) => d.rating === 'INADEQUATE').length,
        high_gaps: domainResults.filter((d) => d.rating === 'REQUIRES_IMPROVEMENT').length,
        medium_gaps: 0,
        low_gaps: 0,
        domain_results: domainResultsJson,
      })
      .eq('id', params.assessmentId);

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

  private static toApiFormat(assessment: any) {
    if (!assessment) return null;

    const answers = (assessment.assessment_responses ?? []).map((r: any) => {
      const q = r.assessment_questions;
      const code = q?.kloes?.code ?? 'S1';
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
        questionId: r.question_id,
        questionText: q?.question ?? '',
        step: 1,
        domain,
        kloeCode: q?.kloes?.code,
        answerValue,
        answerType: q?.question_type ?? 'YES_NO',
      };
    });

    return {
      id: assessment.id,
      organizationId: assessment.organization_id,
      userId: assessment.started_by,
      serviceType: assessment.service_type,
      status: assessment.status,
      currentStep: assessment.current_step,
      answers,
      createdAt: assessment.created_at,
      updatedAt: assessment.updated_at,
      completedAt: assessment.completed_at ?? null,
    };
  }
}
