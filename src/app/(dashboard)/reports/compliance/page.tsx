"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Download01, ShieldTick, Target02, Heart, Zap, Trophy01, AlertTriangle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { useComplianceScore, useComplianceGaps } from "@/hooks/use-compliance";
import { RATING_LABELS } from "@/lib/constants/cqc-framework";
import type { FC } from "react";

const DOMAIN_ICONS: Record<string, FC<{ className?: string }>> = {
    safe: ShieldTick, effective: Target02, caring: Heart, responsive: Zap, "well-led": Trophy01,
};

function ComplianceSkeleton() {
    return (
        <div className="flex flex-col gap-4 sm:gap-6 animate-pulse">
            <div className="h-8 w-48 rounded-lg bg-quaternary" />
            <div className="h-32 rounded-xl bg-quaternary" />
            <div className="flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-quaternary" />
                ))}
            </div>
        </div>
    );
}

export default function ComplianceReportPage() {
    const router = useRouter();
    const { data: score, isLoading: scoreLoading, error: scoreError } = useComplianceScore();
    const { data: gapsResponse, isLoading: gapsLoading } = useComplianceGaps({});
    const gaps = gapsResponse?.data ?? [];

    const isLoading = scoreLoading || gapsLoading;
    const hasError = scoreError || (!score && !scoreLoading);

    if (isLoading) return <ComplianceSkeleton />;

    if (hasError) {
        return (
            <div className="flex flex-col gap-4 sm:gap-6">
                <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/reports")}>Back to Reports</Button>
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-secondary bg-primary py-12 sm:py-20">
                    <AlertTriangle className="size-10 text-warning-primary" />
                    <p className="text-sm text-tertiary">Failed to load compliance report.</p>
                    <Button color="secondary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/reports")}>Back to Reports</Button>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Compliance Report</h1>
                    <p className="mt-1 text-sm text-tertiary">Generated {new Date().toLocaleDateString("en-GB")}</p>
                </div>
                <Button color="secondary" size="lg" iconLeading={Download01}>Export PDF</Button>
            </div>

            {/* Overall */}
            <div className="rounded-xl border border-secondary bg-primary p-4 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-primary">Overall Compliance</h2>
                <div className="flex items-center gap-4 sm:gap-6">
                    <span className="font-mono text-4xl font-bold text-primary">{score!.overall}%</span>
                    <div>
                        <Badge
                            size="lg"
                            color={score!.predictedRating === "GOOD" ? "success" : "warning"}
                            type="pill-color"
                        >
                            {RATING_LABELS[score!.predictedRating]}
                        </Badge>
                        <p className="mt-1 text-sm text-tertiary">{gaps.filter((g) => g.status === "OPEN").length} open gaps &middot; {gaps.filter((g) => g.severity === "CRITICAL").length} critical</p>
                    </div>
                </div>
            </div>

            {/* Domain breakdown */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-primary">Domain Breakdown</h2>
                <div className="flex flex-col gap-3">
                    {score!.domains.map((d) => {
                        const Icon = DOMAIN_ICONS[d.slug];
                        const domainGaps = gaps.filter((g) => g.domain === d.slug && g.status === "OPEN");
                        return (
                            <div key={d.slug} className="rounded-xl border border-secondary bg-primary p-4 sm:p-5">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        {Icon && <Icon className="size-5 text-fg-quaternary" />}
                                        <span className="text-sm font-semibold text-primary">{d.domainName}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-lg font-bold text-primary">{d.score}%</span>
                                        <Badge size="sm" color={d.rating === "GOOD" ? "success" : d.rating === "INADEQUATE" ? "error" : "warning"} type="pill-color">
                                            {RATING_LABELS[d.rating]}
                                        </Badge>
                                    </div>
                                </div>
                                <ProgressBarBase value={d.score} min={0} max={100} className="mt-3" />
                                <p className="mt-2 text-xs text-tertiary">{domainGaps.length} open gaps &middot; {d.kloeCount} KLOEs assessed</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
