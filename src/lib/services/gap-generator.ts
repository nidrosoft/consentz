import { getDb } from "@/lib/db";
import {
    getEvidenceItems,
    getAllKloeCodes,
    getKloeDefinition,
    type KloeEvidenceItem,
} from "@/lib/constants/cqc-evidence-requirements";
import {
    getQuestionsForServiceType,
    type AssessmentQuestion,
    type CqcDomainType,
} from "@/lib/constants/assessment-questions";
import type { DomainSlug, EvidenceCriticality, ServiceType } from "@/types";

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

const DOMAIN_FROM_PREFIX: Record<string, DomainSlug> = {
    S: "safe",
    E: "effective",
    C: "caring",
    R: "responsive",
    W: "well-led",
};

function domainSlugFromKloeCode(kloeCode: string): DomainSlug {
    const prefix = kloeCode.charAt(0);
    return DOMAIN_FROM_PREFIX[prefix] ?? "well-led";
}

function criticalityToGapSeverity(c: EvidenceCriticality): "CRITICAL" | "HIGH" | "MEDIUM" {
    const map: Record<EvidenceCriticality, "CRITICAL" | "HIGH" | "MEDIUM"> = {
        critical: "CRITICAL",
        high: "HIGH",
        medium: "MEDIUM",
    };
    return map[c];
}

function remediationActionForEvidenceItem(
    item: KloeEvidenceItem,
): "Upload evidence" | "Generate or upload policy" | "Connect to Consentz or sync data" {
    switch (item.sourceLabel) {
        case "MANUAL_UPLOAD":
            return "Upload evidence";
        case "POLICY":
            return "Generate or upload policy";
        case "CONSENTZ":
        case "CONSENTZ_MANUAL":
            return "Connect to Consentz or sync data";
    }
}

interface KloeEvidenceStatusRow {
    evidence_item_id: string;
    kloe_code: string;
    status: string;
    evidence_type: string;
    expiry_status: string | null;
    consentz_synced_at: string | null;
}

function evidenceStatusGapReasons(row: KloeEvidenceStatusRow): string[] {
    const reasons: string[] = [];
    if (row.status === "not_started") {
        reasons.push("This evidence item has not been started yet.");
    }
    if (row.expiry_status === "expired") {
        reasons.push("The linked evidence is expired.");
    }
    const isConsentzType =
        row.evidence_type === "CONSENTZ" || row.evidence_type === "CONSENTZ_MANUAL";
    if (isConsentzType && !row.consentz_synced_at) {
        reasons.push("Consentz is not connected or data has not been synced.");
    }
    return reasons;
}

function shouldHaveEvidenceStatusGap(row: KloeEvidenceStatusRow): boolean {
    return evidenceStatusGapReasons(row).length > 0;
}

/**
 * Auto-creates compliance gaps from KLOE evidence status (missing, expired, Consentz not synced)
 * and resolves gaps when those conditions clear.
 */
export async function generateEvidenceStatusGaps(params: {
    organizationId: string;
    serviceType: string;
}): Promise<{ created: number; resolved: number }> {
    const { organizationId, serviceType } = params;
    const st = serviceType as ServiceType;
    const client = await getDb();

    const { data: statusRows, error: statusErr } = await client
        .from("kloe_evidence_status")
        .select(
            "evidence_item_id, kloe_code, status, evidence_type, expiry_status, consentz_synced_at",
        )
        .eq("organization_id", organizationId);

    if (statusErr) {
        return { created: 0, resolved: 0 };
    }

    const rows = (statusRows ?? []) as KloeEvidenceStatusRow[];
    const statusByItemId = new Map(rows.map((r) => [r.evidence_item_id, r]));

    const itemById = new Map<string, { item: KloeEvidenceItem; kloeCode: string }>();
    for (const kloeCode of getAllKloeCodes(st)) {
        for (const item of getEvidenceItems(st, kloeCode)) {
            itemById.set(item.id, { item, kloeCode });
        }
    }

    const { data: existingOpen } = await client
        .from("compliance_gaps")
        .select("id, source, source_id")
        .eq("organization_id", organizationId)
        .eq("source", "evidence_status")
        .in("status", ["OPEN", "IN_PROGRESS"]);

    const existingKeys = new Set(
        (existingOpen ?? []).map((g) => `evidence_status_${g.source_id as string}`),
    );

    let resolved = 0;

    for (const gap of existingOpen ?? []) {
        const eid = gap.source_id as string;
        const row = statusByItemId.get(eid);
        if (row && !shouldHaveEvidenceStatusGap(row)) {
            const { error } = await client
                .from("compliance_gaps")
                .update({
                    status: "RESOLVED",
                    resolved_at: new Date().toISOString(),
                    resolution_notes:
                        "Auto-resolved: evidence status is complete, not expired, and Consentz sync satisfied where applicable",
                })
                .eq("id", gap.id);
            if (!error) {
                resolved++;
            }
        }
    }

    let created = 0;

    for (const row of rows) {
        const reasons = evidenceStatusGapReasons(row);
        if (reasons.length === 0) continue;

        const def = itemById.get(row.evidence_item_id);
        if (!def) continue;

        const { item, kloeCode } = def;
        const kloeDef = getKloeDefinition(st, kloeCode);
        const regulationCode = kloeDef?.regulations[0] ?? "";

        const key = `evidence_status_${row.evidence_item_id}`;
        if (existingKeys.has(key)) continue;

        const domainSlug = domainSlugFromKloeCode(kloeCode);
        const severity = criticalityToGapSeverity(item.criticality);
        const action = remediationActionForEvidenceItem(item);

        const titleParts: string[] = [];
        if (row.status === "not_started") titleParts.push("Not started");
        if (row.expiry_status === "expired") titleParts.push("Expired evidence");
        if (
            (row.evidence_type === "CONSENTZ" || row.evidence_type === "CONSENTZ_MANUAL") &&
            !row.consentz_synced_at
        ) {
            titleParts.push("Consentz not synced");
        }
        const titleLabel = titleParts.length > 0 ? titleParts.join(" · ") : "Evidence gap";
        const title = `${titleLabel} (${kloeCode})`;

        const description = `${item.description} ${reasons.join(" ")}`.trim();

        const { error } = await client.from("compliance_gaps").insert({
            organization_id: organizationId,
            domain: domainSlug,
            kloe_code: kloeCode,
            regulation_code: regulationCode,
            title,
            description,
            severity,
            status: "OPEN",
            source: "evidence_status",
            source_id: row.evidence_item_id,
            remediation_steps: { action },
        });

        if (!error) {
            existingKeys.add(key);
            created++;
        }
    }

    return { created, resolved };
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
