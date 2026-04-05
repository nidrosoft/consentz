"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { apiPost } from "@/lib/api-client";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { RATING_LABELS } from "@/lib/constants/cqc-framework";
import type { CqcRating } from "@/types";

const STORAGE_KEY = "consentz_onboarding_results";

const DOMAIN_VIS: Record<string, { name: string; color: string }> = {
    safe: { name: "Safe", color: "#3B82F6" },
    effective: { name: "Effective", color: "#8B5CF6" },
    caring: { name: "Caring", color: "#EC4899" },
    responsive: { name: "Responsive", color: "#F59E0B" },
    well_led: { name: "Well-Led", color: "#10B981" },
};

interface StoredSummary {
    rawAverage: number;
    predictedRating: string;
    overallComplianceScore: number;
    gapSummary: { critical: number; high: number; medium: number; low: number };
    domainScores: Array<{
        domain: string;
        percentage: number;
        status: string;
        totalGaps: number;
    }>;
}

function ratingBadgeColor(r: string): "success" | "blue" | "warning" | "error" | "gray" {
    if (r === "OUTSTANDING") return "success";
    if (r === "GOOD") return "blue";
    if (r === "INADEQUATE") return "error";
    return "warning";
}

export default function ResultsPage() {
    const router = useRouter();
    const [summary, setSummary] = useState<StoredSummary | null | undefined>(undefined);
    const [finishing, setFinishing] = useState(false);
    const [finishError, setFinishError] = useState("");

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (raw) {
                setSummary(JSON.parse(raw) as StoredSummary);
            } else {
                setSummary(null);
            }
        } catch {
            setSummary(null);
        }
    }, []);

    async function goToDashboard() {
        setFinishing(true);
        setFinishError("");
        try {
            const supabase = createBrowserSupabaseClient();
            const { error } = await supabase.auth.updateUser({
                data: { onboarding_complete: true },
            });
            if (error) {
                setFinishError(error.message);
                return;
            }
            await apiPost("/api/onboarding/complete");
            sessionStorage.removeItem(STORAGE_KEY);
            window.location.replace("/");
        } finally {
            setFinishing(false);
        }
    }

    if (summary === undefined) {
        return (
            <div className="mx-auto w-full max-w-[80%] py-12">
                <div className="h-10 w-64 animate-pulse rounded-lg bg-quaternary" />
                <div className="mt-4 h-40 animate-pulse rounded-xl bg-quaternary" />
            </div>
        );
    }

    if (summary === null) {
        return (
            <div className="mx-auto w-full max-w-[80%] py-12">
                <div className="flex flex-col gap-6 rounded-xl border border-secondary bg-primary p-8">
                    <h1 className="text-display-xs font-semibold text-primary">No results yet</h1>
                    <p className="text-md text-tertiary">
                        Complete the assessment first. If you already finished, open the assessment step again — your scores are stored when you submit.
                    </p>
                    <Button color="primary" size="lg" onClick={() => router.push("/assessment")}>
                        Go to assessment
                    </Button>
                </div>
            </div>
        );
    }

    const pr = summary.predictedRating as CqcRating;
    const overall = Math.round(summary.overallComplianceScore);

    // Multi-ring donut chart parameters
    const chartSize = 200;
    const center = chartSize / 2;
    const ringWidth = 12;
    const ringGap = 4;
    const domainOrder = ["safe", "effective", "caring", "responsive", "well_led"] as const;
    const domainRings = domainOrder.map((key, i) => {
        const ds = summary.domainScores.find((d) => d.domain === key);
        const vis = DOMAIN_VIS[key] ?? { name: key, color: "#6B7280" };
        const pct = ds ? Math.max(0, Math.min(100, ds.percentage)) : 0;
        const r = center - ringWidth / 2 - i * (ringWidth + ringGap) - 6;
        const circ = 2 * Math.PI * r;
        const dash = (pct / 100) * circ;
        return { key, vis, pct, r, circ, dash, ds };
    });

    const gapRows = [
        { severity: "Critical", count: summary.gapSummary.critical, color: "bg-error-solid" },
        { severity: "High", count: summary.gapSummary.high, color: "bg-warning-solid" },
        { severity: "Medium", count: summary.gapSummary.medium, color: "bg-brand-solid" },
        { severity: "Low", count: summary.gapSummary.low, color: "bg-quaternary" },
    ];
    const totalDerivedGaps = gapRows.reduce((s, g) => s + g.count, 0);

    return (
        <div className="flex w-full justify-center overflow-y-auto py-8 sm:py-12">
            <div className="flex w-[90%] max-w-5xl flex-col gap-8 sm:w-[80%]">
                <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-display-xs font-semibold text-primary">Your Compliance Results</h1>
                    <p className="text-md text-tertiary">Here&apos;s where you stand today (from your self-assessment and our scoring model).</p>
                </div>

                <div className="flex flex-col items-center gap-6 rounded-xl border border-secondary bg-primary p-6 sm:flex-row sm:p-8">
                    <div className="relative flex shrink-0 items-center justify-center" style={{ width: chartSize, height: chartSize }}>
                        <svg viewBox={`0 0 ${chartSize} ${chartSize}`} style={{ width: chartSize, height: chartSize }}>
                            {domainRings.map((ring) => (
                                <g key={ring.key}>
                                    <circle
                                        cx={center}
                                        cy={center}
                                        r={ring.r}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={ringWidth}
                                        className="text-quaternary"
                                        opacity={0.35}
                                    />
                                    {ring.pct > 0 && (
                                        <circle
                                            cx={center}
                                            cy={center}
                                            r={ring.r}
                                            fill="none"
                                            stroke={ring.vis.color}
                                            strokeWidth={ringWidth}
                                            strokeDasharray={`${ring.dash} ${ring.circ}`}
                                            strokeLinecap="round"
                                            transform={`rotate(-90 ${center} ${center})`}
                                            style={{
                                                filter: `drop-shadow(0 0 3px ${ring.vis.color}40)`,
                                                transition: "stroke-dasharray 0.8s ease-out",
                                            }}
                                        />
                                    )}
                                </g>
                            ))}
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="font-mono text-3xl font-bold text-primary">{overall}%</span>
                            <span className="text-xs text-tertiary">Overall</span>
                        </div>
                    </div>
                    <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
                        <p className="text-lg font-semibold text-primary">Predicted Rating</p>
                        <Badge color={ratingBadgeColor(summary.predictedRating)} size="lg" type="pill-color">
                            {RATING_LABELS[pr] ?? summary.predictedRating}
                        </Badge>
                        <p className="text-sm text-tertiary">
                            Modelled compliance score (raw self-assessment average {Math.round(summary.rawAverage)}%).
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            {domainRings.map((ring) => (
                                <div key={ring.key} className="flex items-center gap-1.5">
                                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: ring.vis.color }} />
                                    <span className="text-xs text-tertiary">{ring.vis.name} {Math.round(ring.pct)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="mb-4 text-lg font-semibold text-primary">Domain Breakdown</h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {summary.domainScores.map((d) => {
                            const vis = DOMAIN_VIS[d.domain] ?? { name: d.domain, color: "#6B7280" };
                            const st = d.status as CqcRating;
                            const short = RATING_LABELS[st] ?? d.status;
                            const ok = d.status === "GOOD" || d.status === "OUTSTANDING";
                            return (
                                <div
                                    key={d.domain}
                                    className="flex min-w-0 flex-col items-center gap-2 rounded-xl border border-secondary bg-primary p-4 text-center"
                                >
                                    <div className="size-3 shrink-0 rounded-full" style={{ backgroundColor: vis.color }} />
                                    <span className="w-full truncate text-sm font-medium text-primary">{vis.name}</span>
                                    <span className="font-mono text-2xl font-bold text-primary">{Math.round(d.percentage)}%</span>
                                    <Badge size="sm" color={ok ? "success" : "warning"} type="pill-color" className="max-w-full">
                                        <span className="block truncate">{short}</span>
                                    </Badge>
                                    <span className="text-xs text-tertiary">{d.totalGaps} gaps</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-xl border border-secondary bg-primary p-5 sm:p-6">
                    <h2 className="mb-4 text-lg font-semibold text-primary">
                        {totalDerivedGaps > 0
                            ? `${totalDerivedGaps} focus areas from your answers`
                            : "No major focus areas flagged from your answers"}
                    </h2>
                    <div className="flex flex-col gap-3">
                        {gapRows.map((g) => (
                            <div key={g.severity} className="flex items-center gap-3">
                                <div className={cx("size-3 shrink-0 rounded-full", g.color)} />
                                <span className="text-sm text-primary">
                                    <strong>{g.count}</strong> {g.severity}
                                </span>
                                <span className="text-sm text-tertiary">
                                    {g.severity === "Critical" && "— prioritise immediately"}
                                    {g.severity === "High" && "— address soon"}
                                    {g.severity === "Medium" && "— plan improvements"}
                                    {g.severity === "Low" && "— monitor"}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-4 text-sm text-tertiary">
                        Your dashboard will track real gaps, tasks, and evidence as you use Consentz.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-3 pb-4">
                    {finishError && (
                        <p className="text-center text-sm text-error-primary">{finishError}</p>
                    )}
                    <Button color="primary" size="xl" isLoading={finishing} onClick={() => void goToDashboard()}>
                        Go to Your Dashboard →
                    </Button>
                </div>
            </div>
        </div>
    );
}
