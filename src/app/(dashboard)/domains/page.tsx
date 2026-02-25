"use client";

import { useRouter } from "next/navigation";
import { ShieldTick, Target02, Heart, Zap, Trophy01, ArrowUpRight, ArrowDownRight, Minus } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { cx } from "@/utils/cx";
import { mockComplianceScore, mockGaps } from "@/lib/mock-data";
import { RATING_LABELS, KLOES } from "@/lib/constants/cqc-framework";
import type { FC } from "react";

const DOMAIN_ICONS: Record<string, FC<{ className?: string }>> = {
    safe: ShieldTick, effective: Target02, caring: Heart, responsive: Zap, "well-led": Trophy01,
};
const DOMAIN_COLORS: Record<string, string> = {
    safe: "#3B82F6", effective: "#8B5CF6", caring: "#EC4899", responsive: "#F59E0B", "well-led": "#10B981",
};
const DOMAIN_TEXT_COLORS: Record<string, string> = {
    safe: "text-[#3B82F6]", effective: "text-[#8B5CF6]", caring: "text-[#EC4899]", responsive: "text-[#F59E0B]", "well-led": "text-[#10B981]",
};
const DOMAIN_QUESTIONS: Record<string, string> = {
    safe: "Are people safe?", effective: "Is care effective?", caring: "Is care caring?",
    responsive: "Is care responsive to people's needs?", "well-led": "Is care well-led?",
};

export default function DomainsPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-display-xs font-semibold text-primary">CQC Domains</h1>
                <p className="mt-1 text-sm text-tertiary">Your compliance across all 5 key questions.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {mockComplianceScore.domains.map((d) => {
                    const Icon = DOMAIN_ICONS[d.slug];
                    const color = DOMAIN_COLORS[d.slug];
                    const domainKloes = KLOES.filter((k) => k.domain === d.slug);
                    const domainGaps = mockGaps.filter((g) => g.domain === d.slug && g.status === "OPEN");

                    return (
                        <button
                            key={d.slug}
                            onClick={() => router.push(`/domains/${d.slug}`)}
                            className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-5 text-left transition duration-100 hover:border-brand-300 hover:shadow-sm"
                        >
                            <div className="flex items-center gap-2">
                                {Icon && <Icon className={cx("size-5", DOMAIN_TEXT_COLORS[d.slug])} />}
                                <span className="text-lg font-semibold text-primary">{d.domainName}</span>
                            </div>
                            <p className="text-sm text-tertiary">{DOMAIN_QUESTIONS[d.slug]}</p>

                            <div className="flex items-center gap-4">
                                {/* Mini donut placeholder */}
                                <div className="relative flex size-16 shrink-0 items-center justify-center">
                                    <svg viewBox="0 0 64 64" className="size-16">
                                        <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-quaternary" />
                                        <circle
                                            cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="6"
                                            strokeDasharray={`${d.score * 1.63} ${100 * 1.63}`}
                                            strokeLinecap="round"
                                            transform="rotate(-90 32 32)"
                                        />
                                    </svg>
                                    <span className="absolute font-mono text-sm font-bold text-primary">{d.score}%</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Badge
                                        size="sm"
                                        color={d.rating === "GOOD" || d.rating === "OUTSTANDING" ? "success" : d.rating === "INADEQUATE" ? "error" : "warning"}
                                        type="pill-color"
                                    >
                                        {RATING_LABELS[d.rating]}
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                        {d.trend > 0 && <ArrowUpRight className="size-3 text-success-primary" />}
                                        {d.trend < 0 && <ArrowDownRight className="size-3 text-error-primary" />}
                                        {d.trend === 0 && <Minus className="size-3 text-tertiary" />}
                                        <span className={cx("text-xs font-medium", d.trend > 0 ? "text-success-primary" : d.trend < 0 ? "text-error-primary" : "text-tertiary")}>
                                            {d.trend > 0 ? `+${d.trend}` : d.trend}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-tertiary">{domainKloes.length} KLOEs &middot; {domainGaps.length} gaps</p>

                            <div className="flex flex-wrap gap-1.5">
                                {domainKloes.map((k) => {
                                    const hasGap = mockGaps.some((g) => g.kloe === k.code && g.status === "OPEN");
                                    return (
                                        <span
                                            key={k.code}
                                            className={cx(
                                                "rounded px-1.5 py-0.5 text-xs font-medium",
                                                hasGap ? "bg-warning-primary text-warning-primary" : "bg-success-primary text-success-primary",
                                            )}
                                        >
                                            {k.code} {hasGap ? "⚠" : "✓"}
                                        </span>
                                    );
                                })}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
