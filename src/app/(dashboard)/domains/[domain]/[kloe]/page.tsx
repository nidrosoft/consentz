"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, File06, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { cx } from "@/utils/cx";
import { useComplianceGaps, useUpdateGap } from "@/hooks/use-compliance";
import { useEvidence } from "@/hooks/use-evidence";
import { KLOES, REGULATIONS, POLICY_TEMPLATES } from "@/lib/constants/cqc-framework";
import type { DomainSlug } from "@/types";

const SEVERITY_DOT: Record<string, string> = {
    CRITICAL: "bg-error-solid", HIGH: "bg-warning-solid", MEDIUM: "bg-brand-solid", LOW: "bg-quaternary",
};
const SEVERITY_BADGE: Record<string, "error" | "warning" | "brand" | "gray"> = {
    CRITICAL: "error", HIGH: "warning", MEDIUM: "brand", LOW: "gray",
};

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

export default function KloeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const domainSlug = params.domain as DomainSlug;
    const kloeCode = (params.kloe as string).toUpperCase();

    const kloe = KLOES.find((k) => k.code === kloeCode);
    const { data: gapsResponse, isLoading: gapsLoading, error } = useComplianceGaps({ domain: domainSlug, pageSize: 100 });
    const { data: evidenceResponse, isLoading: evidenceLoading } = useEvidence({ domain: domainSlug, pageSize: 200 });
    const updateGap = useUpdateGap();

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

    const kloeRegCodes = new Set<string>();
    POLICY_TEMPLATES.forEach((pt) => {
        if ((pt.linkedKloes as readonly string[]).includes(kloeCode)) {
            pt.linkedRegulations.forEach((r) => kloeRegCodes.add(r));
        }
    });
    const kloeRegulations = REGULATIONS.filter((r) => kloeRegCodes.has(r.code));

    const hasPolicy = kloeEvidence.some((e) => e.category === "POLICY");
    const hasTraining = kloeEvidence.some((e) => e.category === "TRAINING_RECORD");
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    const hasAudit = kloeEvidence.some((e) => {
        if (e.category !== "AUDIT_REPORT") return false;
        const dateStr = e.created_at ?? e.createdAt;
        if (!dateStr) return true;
        return new Date(dateStr) >= twelveMonthsAgo;
    });

    const coverageFactors = [
        openGaps.length === 0 ? 40 : openGaps.some((g) => g.severity === "CRITICAL") ? 0 : 15,
        kloeEvidence.length > 0 ? 25 : 0,
        hasPolicy ? 20 : 0,
        hasTraining ? 15 : 0,
    ];
    const kloeScore = Math.min(100, coverageFactors.reduce((a, b) => a + b, 0));

    const isLoading = gapsLoading || evidenceLoading;

    const [expandedGapId, setExpandedGapId] = useState<string | null>(null);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    function handleResolve(gapId: string) {
        setResolvingId(gapId);
        updateGap.mutate(
            { id: gapId, status: "RESOLVED" },
            { onSettled: () => setResolvingId(null) },
        );
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

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push(`/domains/${domainSlug}`)}>
                Back to {domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)}
            </Button>

            <div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge size="md" color="gray" type="pill-color">{kloe.code}</Badge>
                    <h1 className="text-display-xs font-semibold text-primary">{kloe.title}</h1>
                </div>
                <p className="mt-1 text-sm text-tertiary">Domain: {domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)}</p>
            </div>

            {/* Score */}
            <div className="rounded-xl border border-secondary bg-primary p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <span className="font-mono text-2xl font-bold text-primary">{kloeScore}%</span>
                    <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1"><ProgressBarBase value={kloeScore} min={0} max={100} /></div>
                    <Badge size="sm" color={openGaps.length === 0 ? "success" : "warning"} type="pill-color">
                        {openGaps.length === 0 ? "Compliant" : "Gaps Found"}
                    </Badge>
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

            {/* Requirements Checklist */}
            <div>
                <h2 className="mb-3 text-lg font-semibold text-primary">Requirements Checklist</h2>
                <div className="rounded-xl border border-secondary bg-primary">
                    {[
                        { label: "Policy or procedure documented", done: hasPolicy, action: `/evidence/upload?category=POLICY&kloe=${kloeCode}&domain=${domainSlug}`, actionLabel: "Upload policy" },
                        { label: "Evidence uploaded and linked", done: kloeEvidence.length > 0, action: `/evidence/upload?kloe=${kloeCode}&domain=${domainSlug}`, actionLabel: "Upload evidence" },
                        { label: "No open compliance gaps", done: openGaps.length === 0, action: null as string | null, actionLabel: "Resolve gaps below" },
                        { label: "Staff training completed", done: hasTraining, action: `/evidence/upload?category=TRAINING_RECORD&kloe=${kloeCode}&domain=${domainSlug}`, actionLabel: "Upload training record" },
                        { label: "Last audit within 12 months", done: hasAudit, action: `/evidence/upload?category=AUDIT_REPORT&kloe=${kloeCode}&domain=${domainSlug}`, actionLabel: "Upload audit report" },
                    ].map((item, i) => (
                        <div key={item.label} className={cx("flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3", i > 0 && "border-t border-secondary")}>
                            <div className="flex items-center gap-3">
                                {item.done ? (
                                    <CheckCircle className="size-5 shrink-0 text-success-primary" />
                                ) : (
                                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-tertiary" />
                                )}
                                <span className={cx("text-sm", item.done ? "text-primary" : "text-tertiary")}>{item.label}</span>
                            </div>
                            {!item.done && item.action && (
                                <Button color="link-color" size="sm" onClick={() => router.push(item.action!)}>{item.actionLabel}</Button>
                            )}
                            {!item.done && !item.action && (
                                <span className="text-xs text-tertiary">{item.actionLabel}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Linked Evidence */}
            <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-primary">Linked Evidence ({kloeEvidence.length})</h2>
                    <Button color="secondary" size="sm" onClick={() => router.push("/evidence/upload")}>Upload Evidence</Button>
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
                                    className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-3 text-left transition duration-100 hover:border-brand-300 sm:p-4"
                                >
                                    <File06 className="size-5 text-fg-quaternary" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-primary">{name}</p>
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
                        <Button color="primary" size="sm" className="mt-3" onClick={() => router.push("/evidence/upload")}>Upload Evidence</Button>
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
                                            <div className="mt-2 flex items-center gap-2">
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
