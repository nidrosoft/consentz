import { getDb } from "@/lib/db";
import { stableAssessmentQuestionUuid } from "@/lib/assessment-question-stable-id";
import { getQuestionsForServiceType, type ServiceType } from "@/lib/constants/assessment-questions";
import { AuditService } from "@/lib/services/audit-service";
import { EvidenceStatusService } from "@/lib/services/evidence-status-service";
import {
    generateGapsFromAssessment,
    generateRemediationTasks,
} from "@/lib/services/gap-generator";
import {
    recalculateComplianceScores,
    scoreAnswer,
    scoreToRating,
} from "@/lib/services/score-engine";

type CqcRating = 'OUTSTANDING' | 'GOOD' | 'REQUIRES_IMPROVEMENT' | 'INADEQUATE';

function mapUiRatingToEnum(
    label: string | undefined,
): CqcRating | undefined {
    if (!label || label === "Not yet rated") return undefined;
    const m: Record<string, CqcRating> = {
        Outstanding: "OUTSTANDING",
        Good: "GOOD",
        "Requires Improvement": "REQUIRES_IMPROVEMENT",
        Inadequate: "INADEQUATE",
    };
    return m[label];
}

export class OnboardingService {
    /** Step 1: ensure organisation exists and user is linked. */
    static async setServiceType(params: { dbUserId: string; serviceType: string }) {
        const client = await getDb();
        const { data: user } = await client.from('users')
            .select('*')
            .eq('id', params.dbUserId)
            .maybeSingle();
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }

        if (user.organization_id) {
            await client.from('organizations')
                .update({ service_type: params.serviceType })
                .eq('id', user.organization_id);
            await AuditService.log({
                organizationId: user.organization_id,
                userId: params.dbUserId,
                action: "ONBOARDING_SERVICE_TYPE_UPDATED",
                entityType: "ORGANIZATION",
                entityId: user.organization_id,
                description: `Updated service type during onboarding: ${params.serviceType}`,
                actorName: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email,
            });
            EvidenceStatusService.seedForOrganization(user.organization_id, params.serviceType as ServiceType).catch(() => {});
            return { organizationId: user.organization_id };
        }

        const orgId = crypto.randomUUID();
        await client.from('organizations').insert({
            id: orgId,
            name: "My organisation",
            service_type: params.serviceType,
            onboarding_complete: false,
        });

        await client.from('users')
            .update({
                organization_id: orgId,
                role: "COMPLIANCE_MANAGER",
            })
            .eq('id', params.dbUserId);

        await AuditService.log({
            organizationId: orgId,
            userId: params.dbUserId,
            action: "ORGANIZATION_CREATED",
            entityType: "ORGANIZATION",
            entityId: orgId,
            description: "Organisation created at onboarding (service type)",
            actorName: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email,
        });

        EvidenceStatusService.seedForOrganization(orgId, params.serviceType as ServiceType).catch(() => {});

        return { organizationId: orgId };
    }

    /** Step 2: organisation details. */
    static async updateOrganizationDetails(params: {
        organizationId: string;
        dbUserId: string;
        data: {
            name: string;
            cqcProviderId?: string | null;
            cqcLocationId?: string | null;
            registeredManager?: string | null;
            postcode: string;
            bedCount: number;
            cqcCurrentRatingLabel?: string | null;
            cqcLastInspection?: string | null;
        };
    }) {
        const cqcCurrentRating = mapUiRatingToEnum(params.data.cqcCurrentRatingLabel ?? undefined);
        let cqcLastInspection: string | undefined;
        if (params.data.cqcLastInspection?.trim()) {
            const d = new Date(params.data.cqcLastInspection.trim());
            if (!Number.isNaN(d.getTime())) {
                cqcLastInspection = d.toISOString();
            }
        }

        const updateData: Record<string, unknown> = {
            name: params.data.name,
            cqc_provider_id: params.data.cqcProviderId || null,
            cqc_location_id: params.data.cqcLocationId || null,
            registered_manager: params.data.registeredManager || null,
            postcode: params.data.postcode,
            bed_count: params.data.bedCount,
        };
        if (cqcCurrentRating !== undefined) updateData.cqc_current_rating = cqcCurrentRating;
        if (cqcLastInspection !== undefined) updateData.cqc_last_inspection = cqcLastInspection;

        const client = await getDb();
        await client.from('organizations')
            .update(updateData)
            .eq('id', params.organizationId);

        const { data: user } = await client.from('users')
            .select('*')
            .eq('id', params.dbUserId)
            .maybeSingle();
        await AuditService.log({
            organizationId: params.organizationId,
            userId: params.dbUserId,
            action: "ONBOARDING_ORG_DETAILS",
            entityType: "ORGANIZATION",
            entityId: params.organizationId,
            description: "Organisation profile saved during onboarding",
            actorName: user ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email : params.dbUserId,
        });
    }

    /** Step 3: save assessment, recompute compliance scores. */
    static async submitInitialAssessment(params: {
        organizationId: string;
        dbUserId: string;
        serviceType: string;
        answers: Record<string, string>;
    }) {
        const questions = getQuestionsForServiceType(params.serviceType as ServiceType);

        const domains = ['SAFE', 'EFFECTIVE', 'CARING', 'RESPONSIVE', 'WELL_LED'] as const;
        for (const domain of domains) {
            const domainQuestions = questions.filter((q) => q.domain === domain);
            const hasAnswer = domainQuestions.some((q) => params.answers[q.id] !== undefined);
            if (!hasAnswer) {
                throw new Error("INCOMPLETE_ASSESSMENT");
            }
        }

        const domainResults: Record<string, { score: number; maxScore: number; percentage: number }> = {};
        const gapSummary = { critical: 0, high: 0, medium: 0, low: 0 };

        for (const domain of domains) {
            const domainQuestions = questions.filter((q) => q.domain === domain);
            let totalScore = 0;
            let totalMax = 0;

            for (const question of domainQuestions) {
                const rawAnswer = params.answers[question.id];
                if (rawAnswer === undefined) continue;

                let parsedAnswer: unknown = rawAnswer;
                if (question.answerType === "multi_select") {
                    try {
                        parsedAnswer = JSON.parse(rawAnswer);
                    } catch {
                        parsedAnswer = rawAnswer;
                    }
                }

                const result = scoreAnswer(question, parsedAnswer);
                totalScore += result.score;
                totalMax += result.maxScore;

                if (result.createsGap && result.gapSeverity) {
                    const sev = result.gapSeverity.toLowerCase();
                    if (sev === "critical") gapSummary.critical++;
                    else if (sev === "high") gapSummary.high++;
                    else if (sev === "medium") gapSummary.medium++;
                    else if (sev === "low") gapSummary.low++;
                }
            }

            const domainKey = domain.toLowerCase();
            domainResults[domainKey] = {
                score: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0,
                maxScore: totalMax,
                percentage: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0,
            };
        }

        const domainScores = Object.values(domainResults);
        const rawAverage =
            domainScores.length > 0
                ? Math.round(domainScores.reduce((sum, d) => sum + d.score, 0) / domainScores.length)
                : 0;

        const predictedFromRaw = scoreToRating(rawAverage) as CqcRating;

        const client = await getDb();
        const assessmentId = crypto.randomUUID();
        await client.from('assessments').insert({
            id: assessmentId,
            organization_id: params.organizationId,
            service_type: params.serviceType,
            status: "COMPLETED",
            started_by: params.dbUserId,
            completed_at: new Date().toISOString(),
            overall_score: rawAverage,
            predicted_rating: predictedFromRaw,
            total_gaps:
                gapSummary.critical + gapSummary.high + gapSummary.medium + gapSummary.low,
            critical_gaps: gapSummary.critical,
            high_gaps: gapSummary.high,
            medium_gaps: gapSummary.medium,
            low_gaps: gapSummary.low,
            domain_results: domainResults as object,
            current_step: questions.length,
        });

        for (const [questionId, answer] of Object.entries(params.answers)) {
            await client.from('assessment_responses').insert({
                assessment_id: assessmentId,
                question_id: stableAssessmentQuestionUuid(questionId, params.serviceType),
                answer,
                evidence_ids: [],
            });
        }

        await recalculateComplianceScores(params.organizationId);

        const gapResult = await generateGapsFromAssessment({
            assessmentId,
            organizationId: params.organizationId,
            serviceType: params.serviceType,
            answers: params.answers,
        });

        const tasksCreated = await generateRemediationTasks({
            organizationId: params.organizationId,
            assessmentId,
        });

        const { data: user } = await client.from('users')
            .select('*')
            .eq('id', params.dbUserId)
            .maybeSingle();
        await AuditService.log({
            organizationId: params.organizationId,
            userId: params.dbUserId,
            action: "INITIAL_ASSESSMENT_COMPLETED",
            entityType: "ASSESSMENT",
            entityId: assessmentId,
            description: `Initial self-assessment completed (overall ${rawAverage}%)`,
            actorName: user ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email : params.dbUserId,
        });

        const { data: cs } = await client.from('compliance_scores')
            .select('*, domain_scores(*)')
            .eq('organization_id', params.organizationId)
            .maybeSingle();

        return {
            assessmentId,
            rawAverage,
            predictedRating: cs?.predicted_rating ?? predictedFromRaw,
            overallComplianceScore: cs ? Math.round(cs.score) : rawAverage,
            domainResults,
            gapSummary,
            domainScores: cs?.domain_scores ?? [],
            gapResult,
            tasksCreated,
        };
    }

    static async markOnboardingFinished(params: { organizationId: string; dbUserId: string }) {
        const client = await getDb();
        await client.from('organizations')
            .update({ onboarding_complete: true })
            .eq('id', params.organizationId);
        const { data: user } = await client.from('users')
            .select('*')
            .eq('id', params.dbUserId)
            .maybeSingle();
        await AuditService.log({
            organizationId: params.organizationId,
            userId: params.dbUserId,
            action: "ONBOARDING_FINISHED",
            entityType: "ORGANIZATION",
            entityId: params.organizationId,
            description: "User completed onboarding and entered the dashboard",
            actorName: user ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email : params.dbUserId,
        });
    }
}
