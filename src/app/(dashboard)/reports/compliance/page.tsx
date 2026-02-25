"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Download01, ShieldTick, Target02, Heart, Zap, Trophy01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { mockComplianceScore, mockGaps } from "@/lib/mock-data";
import { RATING_LABELS } from "@/lib/constants/cqc-framework";
import type { FC } from "react";

const DOMAIN_ICONS: Record<string, FC<{ className?: string }>> = {
    safe: ShieldTick, effective: Target02, caring: Heart, responsive: Zap, "well-led": Trophy01,
};

export default function ComplianceReportPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/reports")}>Back to Reports</Button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Compliance Report</h1>
                    <p className="mt-1 text-sm text-tertiary">Generated {new Date().toLocaleDateString("en-GB")}</p>
                </div>
                <Button color="secondary" size="lg" iconLeading={Download01}>Export PDF</Button>
            </div>

            {/* Overall */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <h2 className="mb-4 text-lg font-semibold text-primary">Overall Compliance</h2>
                <div className="flex items-center gap-6">
                    <span className="font-mono text-4xl font-bold text-primary">{mockComplianceScore.overall}%</span>
                    <div>
                        <Badge
                            size="lg"
                            color={mockComplianceScore.predictedRating === "GOOD" ? "success" : "warning"}
                            type="pill-color"
                        >
                            {RATING_LABELS[mockComplianceScore.predictedRating]}
                        </Badge>
                        <p className="mt-1 text-sm text-tertiary">{mockGaps.filter((g) => g.status === "OPEN").length} open gaps &middot; {mockGaps.filter((g) => g.severity === "CRITICAL").length} critical</p>
                    </div>
                </div>
            </div>

            {/* Domain breakdown */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-primary">Domain Breakdown</h2>
                <div className="flex flex-col gap-3">
                    {mockComplianceScore.domains.map((d) => {
                        const Icon = DOMAIN_ICONS[d.slug];
                        const gaps = mockGaps.filter((g) => g.domain === d.slug && g.status === "OPEN");
                        return (
                            <div key={d.slug} className="rounded-xl border border-secondary bg-primary p-5">
                                <div className="flex items-center justify-between">
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
                                <p className="mt-2 text-xs text-tertiary">{gaps.length} open gaps &middot; {d.kloeCount} KLOEs assessed</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
