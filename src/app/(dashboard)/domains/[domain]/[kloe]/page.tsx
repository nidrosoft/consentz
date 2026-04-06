"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft, File06, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
    Upload01, Plus, Eye, RefreshCcw01, Link01,
} from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { useComplianceGaps, useUpdateGap } from "@/hooks/use-compliance";
import { useEvidence } from "@/hooks/use-evidence";
import { useMe } from "@/hooks/use-me";
import { useOrganization, useUpdateOrganization } from "@/hooks/use-organization";
import { useEvidenceStatus, useSeedEvidenceStatus, useUpdateEvidenceStatus } from "@/hooks/use-evidence-status";
import { KLOES, REGULATIONS } from "@/lib/constants/cqc-framework";
import {
    getKloeDefinition, SOURCE_LABEL_DISPLAY,
    type KloeDefinition, type KloeEvidenceItem, type EvidenceSourceLabel,
} from "@/lib/constants/cqc-evidence-requirements";
import type { DomainSlug, ServiceType, KloeEvidenceStatus } from "@/types";

const SEVERITY_DOT: Record<string, string> = {
    CRITICAL: "bg-error-solid", HIGH: "bg-warning-solid", MEDIUM: "bg-brand-solid", LOW: "bg-quaternary",
};
const SEVERITY_BADGE: Record<string, "error" | "warning" | "brand" | "gray"> = {
    CRITICAL: "error", HIGH: "warning", MEDIUM: "brand", LOW: "gray",
};

const SOURCE_LABEL_COLORS: Record<EvidenceSourceLabel, "blue" | "orange" | "success" | "blue-light"> = {
    POLICY: "blue",
    MANUAL_UPLOAD: "orange",
    CONSENTZ: "success",
    CONSENTZ_MANUAL: "blue-light",
};

const SOURCE_LEGEND: { label: string; color: string }[] = [
    { label: "Policy", color: "bg-blue-500" },
    { label: "Manual Upload", color: "bg-orange-500" },
    { label: "Consentz", color: "bg-success-solid" },
    { label: "Consentz / Manual", color: "bg-utility-blue-light-500" },
];

interface EvidenceRow {
    id: string;
    title?: string;
    file_name?: string;
    fileName?: string;
    category?: string;
    file_size?: string;
    fileSize?: string;
    uploaded_by?: string;
    uploadedBy?: string;
    status?: string;
    kloe_code?: string;
    kloeCode?: string;
    created_at?: string;
    createdAt?: string;
}

function KloeDetailSkeleton() {
    return (
        <div className="flex flex-col gap-4 sm:gap-6 animate-pulse">
            <div className="h-8 w-40 rounded bg-quaternary" />
            <div className="flex items-center gap-2">
                <div className="h-6 w-12 rounded bg-quaternary" />
                <div className="h-6 w-48 rounded bg-quaternary" />
            </div>
            <div className="h-24 rounded-xl border border-secondary bg-primary" />
            <div className="space-y-3">
                <div className="h-6 w-40 rounded bg-quaternary" />
                <div className="h-32 rounded-xl border border-secondary bg-primary" />
            </div>
            <div className="h-48 rounded-xl border border-secondary bg-primary" />
        </div>
    );
}

function ActionButton({ item, kloeCode, domainSlug, router }: {
    item: KloeEvidenceItem;
    kloeCode: string;
    domainSlug: DomainSlug;
    router: ReturnType<typeof useRouter>;
}) {
    switch (item.sourceLabel) {
        case "POLICY":
            return (
                <Button
                    color="link-color"
                    size="sm"
                    iconLeading={Link01}
                    onClick={() => router.push(`/policies?domain=${domainSlug}`)}
                >
                    View Policies
                </Button>
            );
        case "MANUAL_UPLOAD":
            return (
                <Button
                    color="link-color"
                    size="sm"
                    iconLeading={Upload01}
                    onClick={() => router.push(`/evidence/upload?kloe=${kloeCode}&domain=${domainSlug}`)}
                >
                    Upload
                </Button>
            );
        case "CONSENTZ":
            return (
                <Badge size="sm" color="success" type="pill-color">Auto-synced</Badge>
            );
        case "CONSENTZ_MANUAL":
            return (
                <div className="flex items-center gap-2">
                    <Badge size="sm" color="success" type="pill-color">Auto-synced</Badge>
                    <Button
                        color="link-color"
                        size="sm"
                        iconLeading={Upload01}
                        onClick={() => router.push(`/evidence/upload?kloe=${kloeCode}&domain=${domainSlug}`)}
                    >
                        Upload additional
                    </Button>
                </div>
            );
        default:
            return null;
    }
}

export default function KloeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const domainSlug = params.domain as DomainSlug;
    const kloeCode = (params.kloe as string).toUpperCase();

    const kloe = KLOES.find((k) => k.code === kloeCode);
    const { data: org } = useOrganization();
    const { data: me } = useMe();
    const updateOrg = useUpdateOrganization();
    const serviceType: ServiceType =
        org?.service_type === "CARE_HOME" || org?.serviceType === "CARE_HOME" ? "CARE_HOME" : "AESTHETIC_CLINIC";

    const kloeDef: KloeDefinition | undefined = getKloeDefinition(serviceType, kloeCode);

    const { data: gapsResponse, isLoading: gapsLoading, error } = useComplianceGaps({ domain: domainSlug, pageSize: 100 });
    const { data: evidenceResponse, isLoading: evidenceLoading } = useEvidence({ domain: domainSlug, pageSize: 200 });
    const { data: statusRecords, isLoading: statusLoading } = useEvidenceStatus(kloeCode);
    const updateGap = useUpdateGap();
    const seedStatus = useSeedEvidenceStatus();
    const updateStatus = useUpdateEvidenceStatus();

    const allGaps = gapsResponse?.data ?? [];
    const kloeGaps = allGaps.filter((g) => g.kloe === kloeCode);
    const openGaps = kloeGaps.filter((g) => g.status === "OPEN");

    const allEvidence = (evidenceResponse?.data ?? []) as EvidenceRow[];
    const kloeEvidence = useMemo(() => {
        return allEvidence.filter((ev) => {
            const codes = (ev.kloe_code ?? ev.kloeCode ?? "").split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
            return codes.includes(kloeCode);
        });
    }, [allEvidence, kloeCode]);

    const kloeRegulations = useMemo(() => {
        const regCodes = kloeDef?.regulations ?? kloe?.regulations ?? [];
        return REGULATIONS.filter((r) => regCodes.includes(r.code));
    }, [kloeDef, kloe]);

    const statusMap = useMemo(() => {
        const map = new Map<string, KloeEvidenceStatus>();
        for (const s of statusRecords ?? []) {
            map.set(s.evidenceItemId, s);
        }
        return map;
    }, [statusRecords]);

    const evidenceItems: KloeEvidenceItem[] = kloeDef?.evidenceItems ?? [];
    const isE3Clinic = kloeCode === "E3" && serviceType === "AESTHETIC_CLINIC";
    const e3NutritionNa = org?.e3_nutrition_na_aesthetic === true;
    const evidenceExcluded = isE3Clinic && e3NutritionNa;
    const canEditE3Na = me?.role === "OWNER" || me?.role === "ADMIN";

    const completedCount = evidenceExcluded
        ? 0
        : evidenceItems.filter((item) => statusMap.get(item.id)?.status === "complete").length;
    const evidenceCompletionPct = evidenceExcluded
        ? 0
        : evidenceItems.length > 0
            ? Math.round((completedCount / evidenceItems.length) * 100)
            : 0;

    const hasPolicy = kloeEvidence.some((e) => e.category === "POLICY");
    const hasTraining = kloeEvidence.some((e) => e.category === "TRAINING_RECORD");
    const coverageFactors = [
        openGaps.length === 0 ? 40 : openGaps.some((g) => g.severity === "CRITICAL") ? 0 : 15,
        kloeEvidence.length > 0 ? 25 : 0,
        hasPolicy ? 20 : 0,
        hasTraining ? 15 : 0,
    ];
    const assessmentScore = Math.min(100, coverageFactors.reduce((a, b) => a + b, 0));

    const isLoading = gapsLoading || evidenceLoading;
    const needsSeeding =
        !evidenceExcluded &&
        !statusLoading &&
        statusRecords !== undefined &&
        statusRecords.length === 0 &&
        evidenceItems.length > 0;

    const [expandedGapId, setExpandedGapId] = useState<string | null>(null);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    function handleResolve(gapId: string) {
        setResolvingId(gapId);
        updateGap.mutate(
            { id: gapId, status: "RESOLVED" },
            { onSettled: () => setResolvingId(null) },
        );
    }

    function handleToggleComplete(item: KloeEvidenceItem) {
        const current = statusMap.get(item.id);
        const nextStatus = current?.status === "complete" ? "not_started" : "complete";
        updateStatus.mutate({ evidenceItemId: item.id, status: nextStatus });
    }

    if (!kloe) return <p className="text-tertiary">KLOE not found.</p>;
    if (isLoading) return <KloeDetailSkeleton />;
    if (error) {
        return (
            <div className="flex flex-col gap-4 sm:gap-6">
                <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push(`/domains/${domainSlug}`)}>
                    Back to {domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)}
                </Button>
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <AlertTriangle className="size-10 text-warning-primary" />
                    <p className="text-sm text-tertiary">Failed to load compliance data. Please try again.</p>
                    <Button color="secondary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    const displayTitle = kloeDef?.title ?? kloe.title;
    const displayQuestion = kloeDef?.keyQuestion ?? kloe.keyQuestion;
    const displayDescription = kloeDef?.description ?? null;

    return (
        <div className="flex flex-col gap-5 sm:gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push(`/domains/${domainSlug}`)}>
                Back to {domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)}
            </Button>

            {/* Header */}
            <div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge size="md" color="gray" type="pill-color">{kloe.code}</Badge>
                    <h1 className="text-display-xs font-semibold text-primary">{displayTitle}</h1>
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-secondary">{displayQuestion}</p>
                {displayDescription && (
                    <p className="mt-1.5 text-sm leading-relaxed text-tertiary">{displayDescription}</p>
                )}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <Badge size="sm" color="gray" type="pill-color">
                        {serviceType === "CARE_HOME" ? "Care Home" : "Aesthetic Clinic"}
                    </Badge>
                    <span className="text-xs text-tertiary">
                        Domain: {domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)}
                    </span>
                </div>
                {isE3Clinic && (
                    <div className="mt-3 rounded-lg border border-secondary bg-secondary/40 px-3 py-3 sm:px-4">
                        <Toggle
                            size="sm"
                            isSelected={e3NutritionNa}
                            isDisabled={!canEditE3Na || updateOrg.isPending}
                            onChange={(selected) => updateOrg.mutate({ e3NutritionNaAesthetic: selected })}
                            label="Nutrition not applicable for our service"
                            hint="When enabled, this KLOE is excluded from evidence completion scoring. Only Owners and Admins can change this."
                        />
                    </div>
                )}
            </div>

            {/* Dual Score Display */}
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-secondary bg-primary p-4">
                    <p className="text-xs font-medium text-tertiary uppercase tracking-wide">Evidence Completion</p>
                    {evidenceExcluded ? (
                        <>
                            <p className="mt-2 font-mono text-2xl font-bold text-tertiary">N/A</p>
                            <p className="mt-1.5 text-xs text-tertiary">
                                Marked not applicable; excluded from domain scoring.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="mt-2 flex items-center gap-3">
                                <span className="font-mono text-2xl font-bold text-primary">{evidenceCompletionPct}%</span>
                                <div className="flex-1"><ProgressBarBase value={evidenceCompletionPct} min={0} max={100} /></div>
                            </div>
                            <p className="mt-1.5 text-xs text-tertiary">{completedCount} of {evidenceItems.length} items provided</p>
                        </>
                    )}
                </div>
                <div className="rounded-xl border border-secondary bg-primary p-4">
                    <p className="text-xs font-medium text-tertiary uppercase tracking-wide">Assessment Score</p>
                    <div className="mt-2 flex items-center gap-3">
                        <span className="font-mono text-2xl font-bold text-primary">{assessmentScore}%</span>
                        <div className="flex-1"><ProgressBarBase value={assessmentScore} min={0} max={100} /></div>
                    </div>
                    <div className="mt-1.5">
                        <Badge size="sm" color={openGaps.length === 0 ? "success" : "warning"} type="pill-color">
                            {openGaps.length === 0 ? "Compliant" : `${openGaps.length} gap${openGaps.length !== 1 ? "s" : ""}`}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Linked Regulations */}
            {kloeRegulations.length > 0 && (
                <div>
                    <h2 className="mb-3 text-lg font-semibold text-primary">Linked Regulations</h2>
                    <div className="flex flex-wrap gap-2">
                        {kloeRegulations.map((reg) => (
                            <div key={reg.code} className="rounded-lg border border-secondary bg-primary px-3 py-2">
                                <span className="text-sm font-medium text-primary">{reg.code.replace("REG", "Reg ")}</span>
                                <span className="ml-1.5 text-sm text-tertiary">{reg.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Evidence Requirements Checklist */}
            <div>
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-primary">
                        Evidence Requirements
                        {evidenceExcluded ? " (not tracked)" : ` (${evidenceItems.length})`}
                    </h2>
                    {needsSeeding && (
                        <Button
                            color="secondary"
                            size="sm"
                            iconLeading={RefreshCcw01}
                            isLoading={seedStatus.isPending}
                            onClick={() => seedStatus.mutate(serviceType)}
                        >
                            Initialize Tracking
                        </Button>
                    )}
                </div>
                {evidenceExcluded ? (
                    <div className="rounded-xl border border-dashed border-secondary bg-secondary/30 px-4 py-6 text-center">
                        <p className="text-sm text-secondary">
                            Evidence checklist is hidden because this KLOE is marked not applicable for your service type.
                        </p>
                    </div>
                ) : evidenceItems.length > 0 ? (
                    <div className="rounded-xl border border-secondary bg-primary divide-y divide-secondary">
                        {evidenceItems.map((item) => {
                            const statusRecord = statusMap.get(item.id);
                            const isComplete = statusRecord?.status === "complete";

                            return (
                                <div key={item.id} className="flex items-start gap-3 px-3 py-3 sm:px-4 sm:py-3.5">
                                    <button
                                        type="button"
                                        className="mt-0.5 shrink-0"
                                        onClick={() => handleToggleComplete(item)}
                                        aria-label={isComplete ? "Mark as incomplete" : "Mark as complete"}
                                    >
                                        {isComplete ? (
                                            <CheckCircle className="size-5 text-success-primary" />
                                        ) : (
                                            <div className="flex size-5 items-center justify-center rounded-full border-2 border-tertiary transition hover:border-brand" />
                                        )}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className={cx("text-sm", isComplete ? "text-primary" : "text-secondary")}>
                                            {item.description}
                                        </p>
                                        <div className="mt-1.5">
                                            <ActionButton
                                                item={item}
                                                kloeCode={kloeCode}
                                                domainSlug={domainSlug}
                                                router={router}
                                            />
                                        </div>
                                    </div>
                                    <Badge
                                        size="sm"
                                        color={SOURCE_LABEL_COLORS[item.sourceLabel]}
                                        type="pill-color"
                                    >
                                        {SOURCE_LABEL_DISPLAY[item.sourceLabel]}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-secondary bg-secondary p-6 text-center">
                        <p className="text-sm text-tertiary">Evidence requirements for this KLOE are not yet defined for your service type.</p>
                    </div>
                )}
                {!evidenceExcluded && (
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-tertiary">
                        {SOURCE_LEGEND.map((l) => (
                            <span key={l.label} className="flex items-center gap-1.5">
                                <span className={cx("inline-block size-2 rounded-full", l.color)} /> {l.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Linked Evidence */}
            <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-primary">Linked Evidence ({kloeEvidence.length})</h2>
                    <Button color="secondary" size="sm" iconLeading={Upload01} onClick={() => router.push(`/evidence/upload?kloe=${kloeCode}&domain=${domainSlug}`)}>Upload Evidence</Button>
                </div>
                {kloeEvidence.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {kloeEvidence.map((ev) => {
                            const name = ev.title ?? ev.file_name ?? ev.fileName ?? "Untitled";
                            const category = ev.category ?? "OTHER";
                            const size = ev.file_size ?? ev.fileSize ?? "";
                            const uploader = ev.uploaded_by ?? ev.uploadedBy ?? "";
                            const status = ev.status ?? "VALID";

                            return (
                                <button
                                    key={ev.id}
                                    onClick={() => router.push(`/evidence/${ev.id}`)}
                                    className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-3 text-left transition duration-100 hover:border-brand sm:p-4"
                                >
                                    <File06 className="size-5 text-fg-quaternary" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-primary truncate">{name}</p>
                                        <p className="text-xs text-tertiary">
                                            {category.replace(/_/g, " ")}{size ? ` · ${size}` : ""}{uploader ? ` · Uploaded by ${uploader}` : ""}
                                        </p>
                                    </div>
                                    <Badge size="sm" color={status === "VALID" ? "success" : status === "EXPIRED" ? "error" : "warning"} type="pill-color">
                                        {status.replace(/_/g, " ")}
                                    </Badge>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-secondary bg-secondary p-8 text-center">
                        <p className="text-sm text-tertiary">No evidence linked to this KLOE yet.</p>
                        <Button color="primary" size="sm" className="mt-3" iconLeading={Upload01} onClick={() => router.push(`/evidence/upload?kloe=${kloeCode}&domain=${domainSlug}`)}>Upload Evidence</Button>
                    </div>
                )}
            </div>

            {/* Gaps */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-primary">Compliance Gaps ({kloeGaps.length})</h2>
                {kloeGaps.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {kloeGaps.map((gap) => {
                            const isExpanded = expandedGapId === gap.id;
                            const hasSteps = gap.remediationSteps && gap.remediationSteps.length > 0;

                            return (
                                <div key={gap.id} className="rounded-xl border border-secondary bg-primary p-4">
                                    <div className="flex items-start gap-3">
                                        <span className={cx("mt-1 size-2.5 shrink-0 rounded-full", SEVERITY_DOT[gap.severity])} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-primary">{gap.title}</p>
                                            <p className="mt-1 text-xs text-tertiary">{gap.description}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <Badge size="sm" color={SEVERITY_BADGE[gap.severity]} type="pill-color">{gap.severity}</Badge>
                                                <Badge size="sm" color="gray" type="pill-color">{gap.status.replace("_", " ")}</Badge>
                                                <span className="text-xs text-tertiary">{gap.regulation}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            iconTrailing={isExpanded ? ChevronUp : ChevronDown}
                                            onClick={() => setExpandedGapId(isExpanded ? null : gap.id)}
                                        >
                                            {isExpanded ? "Hide Remediation" : "View Remediation"}
                                        </Button>
                                        {gap.status !== "RESOLVED" && (
                                            <Button
                                                color="tertiary"
                                                size="sm"
                                                isLoading={resolvingId === gap.id}
                                                onClick={() => handleResolve(gap.id)}
                                            >
                                                Mark Resolved
                                            </Button>
                                        )}
                                    </div>

                                    {isExpanded && (
                                        <div className="mt-3 rounded-lg border border-secondary bg-secondary p-4">
                                            <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Remediation Steps</p>
                                            {hasSteps ? (
                                                <ol className="mt-2 list-decimal space-y-1.5 pl-4">
                                                    {gap.remediationSteps!.map((step: string, i: number) => (
                                                        <li key={i} className="text-sm text-primary">{step}</li>
                                                    ))}
                                                </ol>
                                            ) : (
                                                <p className="mt-2 text-sm text-tertiary">
                                                    No specific remediation steps recorded. Review this gap with your compliance manager and document the corrective actions taken.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-success-200 bg-success-primary p-4">
                        <CheckCircle className="size-5 text-success-primary" />
                        <p className="text-sm font-medium text-success-primary">No gaps — this KLOE is fully compliant.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
