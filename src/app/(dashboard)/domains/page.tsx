"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldTick, Target02, Heart, Zap, Trophy01, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, ChevronRight } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { useComplianceScore, useComplianceGaps } from "@/hooks/use-compliance";
import { RATING_LABELS, KLOES } from "@/lib/constants/cqc-framework";
import { useMarkOnboardingStep } from "@/hooks/use-onboarding";
import type { FC } from "react";

const DOMAIN_ICONS: Record<string, FC<{ className?: string }>> = {
    safe: ShieldTick, effective: Target02, caring: Heart, responsive: Zap, "well-led": Trophy01,
};

const DOMAIN_THEME: Record<string, {
    accent: string;
    accentLight: string;
    text: string;
    iconBg: string;
    trackStroke: string;
    filledStroke: string;
}> = {
    safe: {
        accent: "#3B82F6", accentLight: "#EFF6FF", text: "text-blue-600",
        iconBg: "bg-blue-50 ring-blue-100", trackStroke: "#E0EAFF", filledStroke: "#3B82F6",
    },
    effective: {
        accent: "#7C3AED", accentLight: "#F5F3FF", text: "text-violet-600",
        iconBg: "bg-violet-50 ring-violet-100", trackStroke: "#EDE9FE", filledStroke: "#7C3AED",
    },
    caring: {
        accent: "#DB2777", accentLight: "#FDF2F8", text: "text-pink-600",
        iconBg: "bg-pink-50 ring-pink-100", trackStroke: "#FCE7F3", filledStroke: "#DB2777",
    },
    responsive: {
        accent: "#D97706", accentLight: "#FFFBEB", text: "text-amber-600",
        iconBg: "bg-amber-50 ring-amber-100", trackStroke: "#FEF3C7", filledStroke: "#D97706",
    },
    "well-led": {
        accent: "#059669", accentLight: "#ECFDF5", text: "text-emerald-600",
        iconBg: "bg-emerald-50 ring-emerald-100", trackStroke: "#D1FAE5", filledStroke: "#059669",
    },
};

const DOMAIN_QUESTIONS: Record<string, string> = {
    safe: "Are people safe?",
    effective: "Is care effective?",
    caring: "Is care caring?",
    responsive: "Is care responsive to people's needs?",
    "well-led": "Is care well-led?",
};

function ScoreRing({ score, filledColor, trackColor }: { score: number; filledColor: string; trackColor: string }) {
    const r = 40;
    const strokeW = 9;
    const viewBox = 104;
    const center = viewBox / 2;
    const circumference = 2 * Math.PI * r;
    const clamped = Math.max(0, Math.min(100, score));
    const filledLen = (clamped / 100) * circumference;
    const gapLen = circumference - filledLen;

    return (
        <div className="relative size-20 shrink-0 sm:size-[104px]">
            <svg viewBox={`0 0 ${viewBox} ${viewBox}`} className="size-full" style={{ transform: "rotate(-90deg)" }}>
                {/* Track */}
                <circle
                    cx={center} cy={center} r={r}
                    fill="none" stroke={trackColor} strokeWidth={strokeW}
                />
                {/* Filled arc */}
                {clamped > 0 && (
                    <circle
                        cx={center} cy={center} r={r}
                        fill="none" stroke={filledColor} strokeWidth={strokeW}
                        strokeDasharray={clamped >= 100 ? `${circumference} 0` : `${filledLen} ${gapLen}`}
                        strokeLinecap="round"
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-primary leading-none tracking-tight">{score}<span className="text-sm font-semibold text-tertiary">%</span></span>
            </div>
        </div>
    );
}

function DomainsSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <div className="h-8 w-48 animate-pulse rounded-lg bg-quaternary" />
                <div className="mt-2 h-4 w-64 animate-pulse rounded bg-quaternary" />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-72 animate-pulse rounded-2xl border border-secondary bg-primary" />
                ))}
            </div>
        </div>
    );
}

export default function DomainsPage() {
    const router = useRouter();
    const markOnboardingStep = useMarkOnboardingStep();
    const { data: score, isLoading: scoreLoading, error: scoreError } = useComplianceScore();
    const { data: gapsResponse, isLoading: gapsLoading } = useComplianceGaps({ pageSize: 100 });
    const gaps = gapsResponse?.data ?? [];
    const domains = score?.domains ?? [];
    const isLoading = scoreLoading || gapsLoading;

    useEffect(() => {
        if (!isLoading && score) markOnboardingStep("review_domains");
    }, [isLoading, score, markOnboardingStep]);

    if (isLoading) return <DomainsSkeleton />;
    if (scoreError || !score) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
                <AlertTriangle className="size-10 text-warning-primary" />
                <p className="text-sm text-tertiary">Failed to load compliance data. Please try again.</p>
                <Button color="secondary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div>
                <h1 className="text-display-xs font-semibold text-primary">CQC Domains</h1>
                <p className="mt-1 text-sm text-tertiary">Your compliance across all 5 key questions.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {domains.map((d) => {
                    const Icon = DOMAIN_ICONS[d.slug];
                    const theme = DOMAIN_THEME[d.slug];
                    const domainKloes = KLOES.filter((k) => k.domain === d.slug);
                    const domainGaps = gaps.filter((g) => g.domain === d.slug && g.status === "OPEN");
                    const ratingColor = d.rating === "GOOD" || d.rating === "OUTSTANDING" ? "success" as const
                        : d.rating === "INADEQUATE" ? "error" as const : "warning" as const;

                    return (
                        <button
                            key={d.slug}
                            onClick={() => router.push(`/domains/${d.slug}`)}
                            className="group flex flex-col rounded-2xl border border-secondary bg-primary text-left transition duration-150 hover:shadow-lg hover:border-brand-300"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 p-4 pb-0 sm:p-5 sm:pb-0">
                                <div className={cx("flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", theme.iconBg)}>
                                    {Icon && <Icon className={cx("size-[18px]", theme.text)} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold text-primary leading-tight">{d.domainName}</h3>
                                    <p className="text-xs text-tertiary mt-0.5 leading-tight">{DOMAIN_QUESTIONS[d.slug]}</p>
                                </div>
                            </div>

                            {/* Score ring + metrics */}
                            <div className="flex items-center gap-3 p-4 sm:gap-5 sm:p-5">
                                <ScoreRing
                                    score={d.score}
                                    filledColor={theme.filledStroke}
                                    trackColor={theme.trackStroke}
                                />
                                <div className="flex flex-col gap-3 flex-1">
                                    <Badge size="sm" color={ratingColor} type="pill-color">
                                        {RATING_LABELS[d.rating]}
                                    </Badge>
                                    <div className="flex items-center gap-1.5">
                                        {d.trend > 0 && <ArrowUpRight className="size-4 text-success-primary" />}
                                        {d.trend < 0 && <ArrowDownRight className="size-4 text-error-primary" />}
                                        {d.trend === 0 && <Minus className="size-4 text-quaternary" />}
                                        <span className={cx(
                                            "text-sm font-semibold",
                                            d.trend > 0 ? "text-success-primary" : d.trend < 0 ? "text-error-primary" : "text-tertiary",
                                        )}>
                                            {d.trend > 0 ? `+${d.trend}` : d.trend}
                                        </span>
                                    </div>
                                    <div className="text-xs text-tertiary">
                                        {domainKloes.length} KLOEs · <span className={domainGaps.length > 0 ? "text-warning-primary font-medium" : ""}>{domainGaps.length} gap{domainGaps.length !== 1 ? "s" : ""}</span>
                                    </div>
                                </div>
                            </div>

                            {/* KLOE status row */}
                            <div className="border-t border-secondary px-3 py-2.5 sm:px-5 sm:py-3.5 flex items-center justify-between">
                                <div className="flex flex-wrap gap-1.5">
                                    {domainKloes.map((k) => {
                                        const hasGap = gaps.some((g) => g.kloe === k.code && g.status === "OPEN");
                                        return (
                                            <span
                                                key={k.code}
                                                className={cx(
                                                    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                                                    hasGap
                                                        ? "bg-warning-secondary text-warning-primary"
                                                        : "bg-success-secondary text-success-primary",
                                                )}
                                            >
                                                {k.code}
                                                <span className="text-[10px] leading-none">{hasGap ? "△" : "✓"}</span>
                                            </span>
                                        );
                                    })}
                                </div>
                                <ChevronRight className="size-4 text-fg-quaternary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
