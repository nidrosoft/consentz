import { getDb } from "@/lib/db";
import {
    getQuestionsForServiceType,
    type AssessmentQuestion,
    type CqcDomainType,
    type ServiceType,
} from "@/lib/constants/assessment-questions";

/** Stored on auto-generated gaps for idempotent updates and resolution. */
export interface AutoGapRemediationSteps {
    questionId: string;
    steps: string[];
    linkedRegulations: string[];
}

interface GeneratedGap {
    organizationId: string;
    domain: string;
    kloeCode: string;
    regulationCode: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    source: string;
    assessmentId: string;
    remediationSteps: AutoGapRemediationSteps | null;
}

const ASSESSMENT_DOMAIN_TO_DB: Record<CqcDomainType, string> = {
    SAFE: "safe",
    EFFECTIVE: "effective",
    CARING: "caring",
    RESPONSIVE: "responsive",
    WELL_LED: "well_led",
};

function domainForGap(question: AssessmentQuestion): string {
    return ASSESSMENT_DOMAIN_TO_DB[question.domain];
}

function parseMultiSelect(raw: string): string[] {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
            return parsed.map((v) => String(v));
        }
    } catch {
        /* treat as plain string */
    }
    if (trimmed.includes(",")) {
        return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [trimmed];
}

export function isGapTriggeredByAnswer(
    question: AssessmentQuestion,
    rawAnswer: string | undefined,
): boolean {
    if (!question.gapTrigger || rawAnswer === undefined || rawAnswer === "") {
        return false;
    }
    const gt = question.gapTrigger;
    const raw = String(rawAnswer).trim();

    if (question.answerType === "multi_select") {
        const selected = parseMultiSelect(raw);
        const totalPoints = selected.reduce((sum, val) => {
            const opt = question.options?.find((o) => o.value === val);
            return sum + (opt?.points ?? 0);
        }, 0);
        if (totalPoints < question.scoring.maxPoints / 2) {
            return true;
        }
        if (gt.triggerValues.length > 0) {
            return selected.some((s) => gt.triggerValues.includes(s));
        }
        return false;
    }

    if (question.answerType === "scale") {
        if (gt.triggerValues.length > 0) {
            return gt.triggerValues.includes(raw);
        }
        const num = Number(raw);
        return !Number.isNaN(num) && num <= 2;
    }

    return gt.triggerValues.includes(raw);
}

function buildRemediationSteps(
    question: AssessmentQuestion,
): AutoGapRemediationSteps | null {
    const gt = question.gapTrigger;
    if (!gt) return null;

    const steps = gt.remediationHint ? [gt.remediationHint] : [];
    return {
        questionId: question.id,
        steps,
        linkedRegulations: gt.linkedRegulations ?? [],
    };
}

/**
 * Generates compliance gaps from assessment answers.
 * For each question with a gapTrigger, checks if the answer triggers the gap.
 * Creates new gaps and marks previously auto-generated gaps resolved when answers clear.
 */
export async function generateGapsFromAssessment(params: {
    assessmentId: string;
    organizationId: string;
    serviceType: string;
    answers: Record<string, string>;
}): Promise<{ created: number; resolved: number }> {
    const { assessmentId, organizationId, serviceType, answers } = params;
    const client = await getDb();
    const questions = getQuestionsForServiceType(serviceType as ServiceType);

    const gapsToCreate: GeneratedGap[] = [];

    for (const question of questions) {
        if (!question.gapTrigger) continue;

        const answerValue = answers[question.id];
        if (answerValue === undefined || answerValue === "") continue;

        const triggered = isGapTriggeredByAnswer(question, answerValue);

        if (triggered) {
            const gapTrigger = question.gapTrigger;
            gapsToCreate.push({
                organizationId,
                domain: domainForGap(question),
                kloeCode: question.kloeCode,
                regulationCode: question.regulationCodes[0] ?? "",
                title: gapTrigger.gapTitle,
                description: gapTrigger.gapDescription,
                severity: gapTrigger.severity,
                status: "OPEN",
                source: "assessment",
                assessmentId,
                remediationSteps: buildRemediationSteps(question),
            });
        }
    }

    const { data: openGaps } = await client
        .from("compliance_gaps")
        .select("id, title, remediation_steps")
        .eq("organization_id", organizationId)
        .eq("source", "assessment")
        .in("status", ["OPEN", "IN_PROGRESS"]);

    let resolved = 0;
    const resolvedGapIds = new Set<string>();

    for (const question of questions) {
        if (!question.gapTrigger) continue;
        const raw = answers[question.id];
        if (raw === undefined || raw === "") continue;

        if (isGapTriggeredByAnswer(question, raw)) continue;

        const gapTitle = question.gapTrigger.gapTitle;

        for (const gap of openGaps ?? []) {
            if (resolvedGapIds.has(gap.id)) continue;

            const steps = gap.remediation_steps as AutoGapRemediationSteps | null | undefined;
            const matchesQuestion =
                steps?.questionId === question.id ||
                (!steps?.questionId && gap.title === gapTitle);

            if (!matchesQuestion) continue;

            const { error } = await client
                .from("compliance_gaps")
                .update({
                    status: "RESOLVED",
                    resolved_at: new Date().toISOString(),
                    resolution_notes:
                        "Auto-resolved: assessment answer no longer triggers this gap",
                })
                .eq("id", gap.id);

            if (!error) {
                resolvedGapIds.add(gap.id);
                resolved++;
            }
        }
    }

    let created = 0;
    for (const gap of gapsToCreate) {
        const qid = gap.remediationSteps?.questionId;
        if (qid) {
            const { data: existingByQuestion } = await client
                .from("compliance_gaps")
                .select("id")
                .eq("organization_id", gap.organizationId)
                .filter("remediation_steps->>questionId", "eq", qid)
                .in("status", ["OPEN", "IN_PROGRESS"])
                .limit(1)
                .maybeSingle();

            if (existingByQuestion) continue;
        }

        const { data: existingByTitle } = await client
            .from("compliance_gaps")
            .select("id")
            .eq("organization_id", gap.organizationId)
            .eq("domain", gap.domain)
            .eq("title", gap.title)
            .in("status", ["OPEN", "IN_PROGRESS"])
            .limit(1)
            .maybeSingle();

        if (existingByTitle) continue;

        const { error } = await client.from("compliance_gaps").insert({
            organization_id: gap.organizationId,
            domain: gap.domain,
            kloe_code: gap.kloeCode,
            regulation_code: gap.regulationCode,
            title: gap.title,
            description: gap.description,
            severity: gap.severity,
            status: gap.status,
            source: gap.source,
            assessment_id: gap.assessmentId,
            remediation_steps: gap.remediationSteps,
        });

        if (!error) {
            created++;
        }
    }

    return { created, resolved };
}

/**
 * Generates remediation tasks for critical and high severity gaps linked to an assessment.
 */
export async function generateRemediationTasks(params: {
    organizationId: string;
    assessmentId: string;
}): Promise<number> {
    const { organizationId, assessmentId } = params;
    const client = await getDb();

    const { data: gaps } = await client
        .from("compliance_gaps")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("assessment_id", assessmentId)
        .in("severity", ["CRITICAL", "HIGH"])
        .in("status", ["OPEN", "IN_PROGRESS"]);

    if (!gaps || gaps.length === 0) return 0;

    let tasksCreated = 0;
    for (const gap of gaps) {
        const { data: existingTask } = await client
            .from("tasks")
            .select("id")
            .eq("gap_id", gap.id)
            .neq("status", "COMPLETED")
            .limit(1)
            .maybeSingle();

        if (existingTask) continue;

        const remSteps = gap.remediation_steps as { steps?: string[] } | null;
        const description = remSteps?.steps?.[0] ?? gap.description;

        const dueDate = new Date();
        if (gap.severity === "CRITICAL") {
            dueDate.setDate(dueDate.getDate() + 7);
        } else {
            dueDate.setDate(dueDate.getDate() + 30);
        }

        const { error } = await client.from("tasks").insert({
            organization_id: organizationId,
            title: `Fix: ${gap.title}`,
            description,
            status: "TODO",
            priority: gap.severity === "CRITICAL" ? "CRITICAL" : "HIGH",
            domains: [gap.domain],
            kloe_code: gap.kloe_code,
            due_date: dueDate.toISOString(),
            source: "ASSESSMENT",
            source_id: gap.id,
            gap_id: gap.id,
        });

        if (!error) {
            tasksCreated++;
        }
    }

    return tasksCreated;
}

/**
 * Detects gaps from evidence, staff registrations, training, and policies.
 * Called by the daily cron to surface compliance deterioration without a full re-assessment.
 */
export async function detectEvidenceGaps(organizationId: string): Promise<number> {
    const client = await getDb();
    const [evidenceRes, staffRes, trainingRes, policiesRes, existingRes] = await Promise.all([
        client.from("evidence_items").select("*").eq("organization_id", organizationId),
        client.from("staff_members").select("*").eq("organization_id", organizationId).eq("is_active", true),
        client.from("training_records").select("*, staff_members(first_name, last_name)").eq("organization_id", organizationId),
        client.from("policies").select("*").eq("organization_id", organizationId).is("deleted_at", null),
        client.from("compliance_gaps").select("source, source_id").eq("organization_id", organizationId).in("status", ["OPEN", "IN_PROGRESS"]),
    ]);

    const evidence = evidenceRes.data ?? [];
    const staff = staffRes.data ?? [];
    const training = trainingRes.data ?? [];
    const policies = policiesRes.data ?? [];
    const existingKeys = new Set((existingRes.data ?? []).map((g: any) => `${g.source}_${g.source_id}`));

    const now = new Date();
    let created = 0;

    for (const item of evidence) {
        if (item.status !== "EXPIRED" || item.deleted_at) continue;
        const key = `EVIDENCE_EXPIRY_${item.id}`;
        if (existingKeys.has(key)) continue;

        const { error } = await client.from("compliance_gaps").insert({
            organization_id: organizationId,
            domain: item.domains?.[0] ?? "well_led",
            title: `Expired evidence: ${item.title}`,
            description: `Evidence "${item.title}" has expired. This may affect compliance.`,
            severity: item.category === "CERTIFICATE" ? "HIGH" : "MEDIUM",
            status: "OPEN",
            source: "EVIDENCE_EXPIRY",
            source_id: item.id,
        });
        if (!error) created++;
    }

    for (const s of staff) {
        if (!s.registration_expiry) continue;
        if (new Date(s.registration_expiry) > now) continue;
        const key = `STAFF_REG_EXPIRY_${s.id}`;
        if (existingKeys.has(key)) continue;

        const { error } = await client.from("compliance_gaps").insert({
            organization_id: organizationId,
            domain: "safe",
            kloe_code: "S3",
            title: `Expired registration: ${s.first_name} ${s.last_name}`,
            description: `${s.first_name} ${s.last_name}'s professional registration has expired. Staff must not practise without valid registration.`,
            severity: "CRITICAL",
            status: "OPEN",
            source: "STAFF_REG_EXPIRY",
            source_id: s.id,
        });
        if (!error) created++;
    }

    for (const record of training) {
        if (!record.expiry_date) continue;
        if (new Date(record.expiry_date) > now) continue;
        const key = `TRAINING_EXPIRY_${record.id}`;
        if (existingKeys.has(key)) continue;

        const mandatory = ["SAFEGUARDING", "FIRE_SAFETY", "BLS_ILS", "MANUAL_HANDLING", "IPC"].includes(record.category);
        const staffName = record.staff_members
            ? `${record.staff_members.first_name} ${record.staff_members.last_name}`
            : "Unknown staff";

        const { error } = await client.from("compliance_gaps").insert({
            organization_id: organizationId,
            domain: record.category === "SAFEGUARDING" ? "safe" : "effective",
            kloe_code: record.category === "SAFEGUARDING" ? "S1" : "E2",
            title: `Expired training: ${record.course_name} — ${staffName}`,
            description: `Training "${record.course_name}" for ${staffName} has expired.`,
            severity: mandatory ? "HIGH" : "MEDIUM",
            status: "OPEN",
            source: "TRAINING_EXPIRY",
            source_id: record.id,
        });
        if (!error) created++;
    }

    for (const policy of policies) {
        if (!policy.next_review_date || policy.status !== "ACTIVE") continue;
        if (new Date(policy.next_review_date) > now) continue;
        const key = `POLICY_REVIEW_${policy.id}`;
        if (existingKeys.has(key)) continue;

        const { error } = await client.from("compliance_gaps").insert({
            organization_id: organizationId,
            domain: policy.domains?.[0] ?? "well_led",
            title: `Policy overdue for review: ${policy.title}`,
            description: `Policy "${policy.title}" was due for review on ${policy.next_review_date}. Policies must be reviewed at least annually.`,
            severity: "MEDIUM",
            status: "OPEN",
            source: "POLICY_REVIEW",
            source_id: policy.id,
        });
        if (!error) created++;
    }

    return created;
}
