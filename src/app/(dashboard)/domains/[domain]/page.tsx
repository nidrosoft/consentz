"use client";

import { useParams, useRouter } from "next/navigation";
import { ShieldTick, Target02, Heart, Zap, Trophy01, ArrowUpRight, ArrowDownRight, ChevronRight, AlertTriangle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { cx } from "@/utils/cx";
import { useComplianceScore, useComplianceGaps } from "@/hooks/use-compliance";
import { RATING_LABELS, KLOES, REGULATIONS } from "@/lib/constants/cqc-framework";
import type { DomainSlug } from "@/types";
import type { FC } from "react";

const DOMAIN_ICONS: Record<string, FC<{ className?: string }>> = {
    safe: ShieldTick, effective: Target02, caring: Heart, responsive: Zap, "well-led": Trophy01,
};
const DOMAIN_COLORS: Record<string, string> = {
    safe: "text-[#3B82F6]", effective: "text-[#8B5CF6]", caring: "text-[#EC4899]", responsive: "text-[#F59E0B]", "well-led": "text-[#10B981]",
};
const DOMAIN_DESCRIPTIONS: Record<string, string> = {
    safe: "Are people protected from abuse and avoidable harm?",
    effective: "Does care, treatment and support achieve good outcomes?",
    caring: "Does staff treat people with compassion, kindness and respect?",
    responsive: "Are services organised to meet people's needs?",
    "well-led": "Does leadership ensure high-quality care and promote improvement?",
};

// Build KLOE → Regulations lookup from REGULATIONS + POLICY_TEMPLATES data
const KLOE_REGULATIONS: Record<string, string[]> = {};
KLOES.forEach((k) => {
    const domainRegs = REGULATIONS.filter((r) => r.domains.includes(k.domain));
    KLOE_REGULATIONS[k.code] = domainRegs.map((r) => r.code.replace("REG", "Reg "));
});

const SEVERITY_DOT: Record<string, string> = {
    CRITICAL: "bg-error-solid", HIGH: "bg-warning-solid", MEDIUM: "bg-brand-solid", LOW: "bg-quaternary",
};
const SEVERITY_BADGE: Record<string, "error" | "warning" | "brand" | "gray"> = {
    CRITICAL: "error", HIGH: "warning", MEDIUM: "brand", LOW: "gray",
};

function DomainDetailSkeleton() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-6 rounded bg-quaternary" />
                    <div>
                        <div className="h-6 w-48 rounded bg-quaternary" />
                        <div className="mt-2 h-4 w-72 rounded bg-quaternary" />
                    </div>
                </div>
                <div className="h-8 w-24 rounded bg-quaternary" />
            </div>
            <div className="h-24 rounded-xl border border-secondary bg-primary" />
            <div className="space-y-3">
                <div className="h-6 w-48 rounded bg-quaternary" />
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 rounded-xl border border-secondary bg-primary" />
                ))}
            </div>
        </div>
    );
}

export default function DomainDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.domain as DomainSlug;

    const { data: score, isLoading: scoreLoading, error: scoreError } = useComplianceScore();
    const { data: gapsResponse, isLoading: gapsLoading } = useComplianceGaps({ domain: slug, pageSize: 100 });
    const gaps = gapsResponse?.data ?? [];
    const domainScore = score?.domains.find((d) => d.slug === slug);
    const domainKloes = KLOES.filter((k) => k.domain === slug);
    const domainGaps = gaps.filter((g) => g.domain === slug && g.status !== "RESOLVED");
    const Icon = DOMAIN_ICONS[slug];
    const color = DOMAIN_COLORS[slug];
    const isLoading = scoreLoading || gapsLoading;

    if (isLoading) return <DomainDetailSkeleton />;
    if (scoreError || !score) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
                <AlertTriangle className="size-10 text-warning-primary" />
                <p className="text-sm text-tertiary">Failed to load compliance data. Please try again.</p>
                <Button color="secondary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }
    if (!domainScore) return <p className="text-tertiary">Domain not found.</p>;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    {Icon && <Icon className={cx("size-6", color)} />}
                    <div>
                        <h1 className="text-display-xs font-semibold text-primary">{domainScore.domainName} Domain</h1>
                        <p className="text-sm text-tertiary">{DOMAIN_DESCRIPTIONS[slug]}</p>
                    </div>
                </div>
                <span className="font-mono text-2xl font-bold text-primary">Score: {domainScore.score}%</span>
            </div>

            {/* Score bar */}
            <div className="rounded-xl border border-secondary bg-primary p-5">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <ProgressBarBase value={domainScore.score} min={0} max={100} />
                    </div>
                    <span className="font-mono text-lg font-bold text-primary">{domainScore.score}%</span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm">
                    <Badge
                        size="sm"
                        color={domainScore.rating === "GOOD" || domainScore.rating === "OUTSTANDING" ? "success" : domainScore.rating === "INADEQUATE" ? "error" : "warning"}
                        type="pill-color"
                    >
                        Rating: {RATING_LABELS[domainScore.rating]}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs">
                        {domainScore.trend > 0 && <><ArrowUpRight className="size-3 text-success-primary" /><span className="text-success-primary">+{domainScore.trend} from last assessment</span></>}
                        {domainScore.trend < 0 && <><ArrowDownRight className="size-3 text-error-primary" /><span className="text-error-primary">{domainScore.trend} from last assessment</span></>}
                        {domainScore.trend === 0 && <span className="text-tertiary">No change</span>}
                    </span>
                    <span className="text-xs text-tertiary">{domainGaps.length} gaps remaining</span>
                </div>
            </div>

            {/* KLOEs */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-primary">Key Lines of Enquiry</h2>
                <div className="flex flex-col gap-3">
                    {domainKloes.map((kloe) => {
                        const kloeGaps = gaps.filter((g) => g.kloe === kloe.code && g.status === "OPEN");
                        const kloeEvidence: { type: string }[] = [];
                        const mockKloeScore = kloeGaps.length === 0 ? 85 : kloeGaps.some((g) => g.severity === "CRITICAL") ? 40 : 60;

                        return (
                            <button
                                key={kloe.code}
                                onClick={() => router.push(`/domains/${slug}/${kloe.code.toLowerCase()}`)}
                                className="flex items-center gap-4 rounded-xl border border-secondary bg-primary p-4 text-left transition duration-100 hover:border-brand-300"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-tertiary">{kloe.code}</span>
                                        <span className="text-sm font-medium text-primary">{kloe.title}</span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-tertiary">
                                        {KLOE_REGULATIONS[kloe.code]?.length > 0 && (
                                            <span>Linked: {KLOE_REGULATIONS[kloe.code].join(", ")}</span>
                                        )}
                                        <span>Evidence: {kloeEvidence.length} documents</span>
                                        {kloeGaps.length > 0 && (
                                            <span className="text-warning-primary">{kloeGaps.length} gap{kloeGaps.length > 1 ? "s" : ""}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm font-bold text-primary">{mockKloeScore}%</span>
                                    <Badge
                                        size="sm"
                                        color={kloeGaps.length === 0 ? "success" : "warning"}
                                        type="pill-color"
                                    >
                                        {kloeGaps.length === 0 ? "✓" : "⚠"}
                                    </Badge>
                                    <ChevronRight className="size-4 text-fg-quaternary" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Gaps in this domain */}
            {domainGaps.length > 0 && (
                <div>
                    <h2 className="mb-4 text-lg font-semibold text-primary">Gaps in This Domain</h2>
                    <div className="flex flex-col gap-3">
                        {domainGaps.map((gap) => (
                            <div key={gap.id} className="rounded-xl border border-secondary bg-primary p-4">
                                <div className="flex items-start gap-3">
                                    <span className={cx("mt-1 size-2.5 shrink-0 rounded-full", SEVERITY_DOT[gap.severity])} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-primary">{gap.title}</p>
                                        <p className="mt-1 text-xs text-tertiary">{gap.description}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Badge size="sm" color={SEVERITY_BADGE[gap.severity]} type="pill-color">{gap.severity}</Badge>
                                            <span className="text-xs text-tertiary">{gap.kloe} &middot; {gap.regulation}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <Button color="secondary" size="sm">View Remediation</Button>
                                    <Button color="tertiary" size="sm">Mark Resolved</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
