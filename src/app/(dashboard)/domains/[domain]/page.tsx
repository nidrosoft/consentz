"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldTick, Target02, Heart, Zap, Trophy01, ArrowUpRight, ArrowDownRight, ChevronRight, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Grid01, List } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { cx } from "@/utils/cx";
import { useComplianceScore, useComplianceGaps, useUpdateGap, useTreatmentRiskHeatmap } from "@/hooks/use-compliance";
import { useEvidence } from "@/hooks/use-evidence";
import { useConsentzMetricsForDomain, type ConsentzMetricEntry } from "@/hooks/use-dashboard";
import { RATING_LABELS, KLOES, REGULATIONS } from "@/lib/constants/cqc-framework";
import { getKloeDefinition } from "@/lib/constants/cqc-evidence-requirements";
import { useOrganization } from "@/hooks/use-organization";
import { TreatmentRiskHeatmap, TreatmentRiskHeatmapSkeleton, TreatmentRiskHeatmapEmpty } from "@/components/application/treatment-risk-heatmap";
import type { DomainSlug, ServiceType } from "@/types";
import type { FC } from "react";

type ViewMode = "card" | "list";

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

const SEVERITY_DOT: Record<string, string> = {
    CRITICAL: "bg-error-solid", HIGH: "bg-warning-solid", MEDIUM: "bg-brand-solid", LOW: "bg-quaternary",
};
const SEVERITY_BADGE: Record<string, "error" | "warning" | "brand" | "gray"> = {
    CRITICAL: "error", HIGH: "warning", MEDIUM: "brand", LOW: "gray",
};

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
    return (
        <div className="flex rounded-lg border border-secondary bg-secondary p-0.5">
            <button
                onClick={() => onChange("card")}
                className={cx(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition duration-100",
                    mode === "card" ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
                )}
            >
                <Grid01 className="size-3.5" />
                Cards
            </button>
            <button
                onClick={() => onChange("list")}
                className={cx(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition duration-100",
                    mode === "list" ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
                )}
            >
                <List className="size-3.5" />
                List
            </button>
        </div>
    );
}

function scoreColor(score: number): string {
    if (score >= 80) return "text-success-primary";
    if (score >= 50) return "text-warning-primary";
    return "text-error-primary";
}

function scoreRingColor(score: number): string {
    if (score >= 80) return "stroke-[#16A34A]";
    if (score >= 50) return "stroke-[#F59E0B]";
    return "stroke-[#EF4444]";
}

function scoreTrackColor(score: number): string {
    if (score >= 80) return "stroke-[#DCFCE7]";
    if (score >= 50) return "stroke-[#FEF3C7]";
    return "stroke-[#FEE2E2]";
}

function MiniScoreRing({ score }: { score: number }) {
    const r = 18;
    const sw = 4;
    const size = 44;
    const c = size / 2;
    const circumference = 2 * Math.PI * r;
    const clamped = Math.max(0, Math.min(100, score));
    const filled = (clamped / 100) * circumference;
    const gap = circumference - filled;

    return (
        <div className="relative size-11 shrink-0">
            <svg viewBox={`0 0 ${size} ${size}`} className="size-full" style={{ transform: "rotate(-90deg)" }}>
                <circle cx={c} cy={c} r={r} fill="none" className={scoreTrackColor(score)} strokeWidth={sw} />
                {clamped > 0 && (
                    <circle
                        cx={c} cy={c} r={r} fill="none"
                        className={scoreRingColor(score)} strokeWidth={sw}
                        strokeDasharray={clamped >= 100 ? `${circumference} 0` : `${filled} ${gap}`}
                        strokeLinecap="round"
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={cx("text-[10px] font-bold leading-none", scoreColor(score))}>{score}%</span>
            </div>
        </div>
    );
}

function DomainDetailSkeleton() {
    return (
        <div className="flex flex-col gap-4 sm:gap-6 animate-pulse">
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

type GapItem = { id: string; title: string; description: string; severity: string; kloe: string; regulation: string; remediationSteps?: string[] };

function GapCard({ gap, onResolve, isResolving }: { gap: GapItem; onResolve: (id: string) => void; isResolving: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const hasSteps = gap.remediationSteps && gap.remediationSteps.length > 0;

    return (
        <div className="flex flex-col rounded-xl border border-secondary bg-primary p-4">
            <div className="flex items-start gap-2.5">
                <span className={cx("mt-1 size-2.5 shrink-0 rounded-full", SEVERITY_DOT[gap.severity])} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary line-clamp-2">{gap.title}</p>
                    <p className="mt-1 text-xs text-tertiary line-clamp-2">{gap.description}</p>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge size="sm" color={SEVERITY_BADGE[gap.severity]} type="pill-color">{gap.severity}</Badge>
                <span className="text-xs text-tertiary">{gap.kloe} &middot; {gap.regulation}</span>
            </div>
            <div className="mt-auto pt-3 flex flex-wrap gap-2">
                <Button color="secondary" size="sm" iconTrailing={expanded ? ChevronUp : ChevronDown} onClick={() => setExpanded(!expanded)}>
                    {expanded ? "Hide" : "Remediation"}
                </Button>
                <Button color="tertiary" size="sm" isLoading={isResolving} onClick={() => onResolve(gap.id)}>Resolve</Button>
            </div>
            {expanded && (
                <div className="mt-3 rounded-lg border border-secondary bg-secondary p-3">
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Remediation Steps</p>
                    {hasSteps ? (
                        <ol className="mt-2 list-decimal space-y-1 pl-4">
                            {gap.remediationSteps!.map((step, i) => <li key={i} className="text-sm text-primary">{step}</li>)}
                        </ol>
                    ) : (
                        <p className="mt-2 text-sm text-tertiary">No specific remediation steps recorded.</p>
                    )}
                </div>
            )}
        </div>
    );
}

function GapListRow({ gap, onResolve, isResolving }: { gap: GapItem; onResolve: (id: string) => void; isResolving: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const hasSteps = gap.remediationSteps && gap.remediationSteps.length > 0;

    return (
        <div className="rounded-xl border border-secondary bg-primary p-4">
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
            <div className="mt-3 flex flex-wrap gap-2">
                <Button color="secondary" size="sm" iconTrailing={expanded ? ChevronUp : ChevronDown} onClick={() => setExpanded(!expanded)}>
                    {expanded ? "Hide Remediation" : "View Remediation"}
                </Button>
                <Button color="tertiary" size="sm" isLoading={isResolving} onClick={() => onResolve(gap.id)}>Mark Resolved</Button>
            </div>
            {expanded && (
                <div className="mt-3 rounded-lg border border-secondary bg-secondary p-4">
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Remediation Steps</p>
                    {hasSteps ? (
                        <ol className="mt-2 list-decimal space-y-1.5 pl-4">
                            {gap.remediationSteps!.map((step, i) => <li key={i} className="text-sm text-primary">{step}</li>)}
                        </ol>
                    ) : (
                        <p className="mt-2 text-sm text-tertiary">No specific remediation steps recorded. Review this gap with your compliance manager.</p>
                    )}
                </div>
            )}
        </div>
    );
}

function GapsSection({ gaps, viewMode }: { gaps: GapItem[]; viewMode: ViewMode }) {
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const updateGap = useUpdateGap();

    function handleResolve(gapId: string) {
        setResolvingId(gapId);
        updateGap.mutate({ id: gapId, status: "RESOLVED" }, { onSettled: () => setResolvingId(null) });
    }

    if (gaps.length === 0) {
        return (
            <EmptyState size="sm">
                <EmptyState.Header pattern="none">
                    <EmptyState.FeaturedIcon icon={CheckCircle} color="success" theme="light" size="sm" />
                </EmptyState.Header>
                <EmptyState.Content>
                    <EmptyState.Title>No gaps in this domain</EmptyState.Title>
                    <EmptyState.Description>Great progress! Continue maintaining your compliance standards.</EmptyState.Description>
                </EmptyState.Content>
            </EmptyState>
        );
    }

    if (viewMode === "card") {
        return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {gaps.map((gap) => (
                    <GapCard key={gap.id} gap={gap} onResolve={handleResolve} isResolving={resolvingId === gap.id} />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {gaps.map((gap) => (
                <GapListRow key={gap.id} gap={gap} onResolve={handleResolve} isResolving={resolvingId === gap.id} />
            ))}
        </div>
    );
}

function ConsentzDomainMetrics({ domain }: { domain: string }) {
    const { data: metrics, freshness } = useConsentzMetricsForDomain(domain);
    if (!metrics) return null;

    return (
        <div className="rounded-xl border border-secondary bg-primary p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-primary">Consentz Metrics</h3>
                    <p className="mt-0.5 text-xs text-tertiary">Auto-synced from Consentz (live data)</p>
                    {freshness && <p className="mt-0.5 text-xs text-tertiary">Synced {timeAgo(freshness)}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <span className="text-xs text-tertiary">Live data from Consentz</span>
                    <Badge size="sm" color="brand" type="pill-color">Live</Badge>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(metrics).map(([key, m]: [string, ConsentzMetricEntry]) => {
                    const val = m.value;
                    const displayValue = val != null
                        ? m.unit === '/10' ? `${val}${m.unit}` : `${Math.round(val)}${m.unit}`
                        : '—';
                    const isGood = val != null && (m.unit === '/10' ? val >= 7 : val >= 75);
                    const isWarning = val != null && (m.unit === '/10' ? val >= 5 && val < 7 : val >= 50 && val < 75);
                    return (
                        <div key={key} className="flex flex-col gap-2 rounded-lg border border-secondary p-3">
                            <span className="text-xs font-medium text-tertiary">{m.label}</span>
                            <span className={cx(
                                "font-mono text-2xl font-bold",
                                val == null ? "text-quaternary" : isGood ? "text-success-primary" : isWarning ? "text-warning-primary" : "text-error-primary",
                            )}>
                                {displayValue}
                            </span>
                            <div className="h-1.5 w-full rounded-full bg-quaternary overflow-hidden">
                                <div
                                    className={cx(
                                        "h-full rounded-full transition-all duration-500",
                                        val == null ? "w-0" : isGood ? "bg-success-solid" : isWarning ? "bg-warning-solid" : "bg-error-solid",
                                    )}
                                    style={{ width: val != null ? `${Math.min(100, m.unit === '/10' ? val * 10 : val)}%` : '0%' }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function SafeTreatmentRiskSection() {
    const { data, isLoading, error } = useTreatmentRiskHeatmap();

    return (
        <div className="rounded-xl border border-secondary bg-primary p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-primary">Treatment Risk Heatmap</h3>
                    <p className="mt-1 text-sm text-tertiary">Visual analysis of treatment risks across procedures.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge color="brand" size="sm" type="pill-color">S2 · Reg 12</Badge>
                </div>
            </div>
            <div className="mt-5 overflow-x-auto">
                {isLoading && <TreatmentRiskHeatmapSkeleton />}
                {error && <TreatmentRiskHeatmapEmpty />}
                {data && <TreatmentRiskHeatmap data={data} />}
            </div>
        </div>
    );
}

export default function DomainDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.domain as DomainSlug;

    const [kloeView, setKloeView] = useState<ViewMode>("card");
    const [gapsView, setGapsView] = useState<ViewMode>("card");

    const { data: org } = useOrganization();
    const serviceType: ServiceType = org?.serviceType === "CARE_HOME" ? "CARE_HOME" : "AESTHETIC_CLINIC";

    const { data: score, isLoading: scoreLoading, error: scoreError } = useComplianceScore();
    const { data: gapsResponse, isLoading: gapsLoading } = useComplianceGaps({ domain: slug, pageSize: 100 });
    const { data: evidenceResponse } = useEvidence({ domain: slug, pageSize: 200 });
    const allEvidence = (evidenceResponse?.data ?? []) as { id: string; kloe_code?: string; kloeCode?: string; category?: string; title?: string; file_name?: string; status?: string }[];

    const evidenceByKloe = useMemo(() => {
        const map: Record<string, typeof allEvidence> = {};
        for (const ev of allEvidence) {
            const codes = (ev.kloe_code ?? ev.kloeCode ?? "").split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
            for (const code of codes) {
                (map[code] ??= []).push(ev);
            }
        }
        return map;
    }, [allEvidence]);

    const gaps = gapsResponse?.data ?? [];
    const domainScore = score?.domains.find((d) => d.slug === slug);
    const domainKloes = KLOES.filter((k) => {
        if (k.domain !== slug) return false;
        const def = getKloeDefinition(serviceType, k.code);
        return def !== undefined;
    });
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
    if (!domainScore) {
        // Build a placeholder so the page still renders with domain info
        const domainNames: Record<string, string> = { safe: 'Safe', effective: 'Effective', caring: 'Caring', responsive: 'Responsive', 'well-led': 'Well-Led' };
        const placeholderName = domainNames[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
        return (
            <div className="flex flex-col gap-4 sm:gap-6">
                <div className="flex items-center gap-3">
                    {Icon && <Icon className={cx("size-6", color)} />}
                    <div>
                        <h1 className="text-display-xs font-semibold text-primary">{placeholderName} Domain</h1>
                        <p className="text-sm text-tertiary">{DOMAIN_DESCRIPTIONS[slug]}</p>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-secondary bg-primary py-16">
                    <div className="flex size-12 items-center justify-center rounded-full bg-brand-secondary">
                        {Icon && <Icon className="size-6 text-brand-secondary" />}
                    </div>
                    <h2 className="text-lg font-semibold text-primary">No score calculated yet</h2>
                    <p className="max-w-md text-center text-sm text-tertiary">
                        Complete your compliance assessment to see your {placeholderName.toLowerCase()} domain score, KLOE breakdown, and identified gaps.
                    </p>
                    <Button color="primary" size="md" href="/reassessment">Take Assessment</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
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
            <div className="rounded-xl border border-secondary bg-primary p-4 sm:p-5">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <ProgressBarBase value={domainScore.score} min={0} max={100} />
                    </div>
                    <span className="font-mono text-lg font-bold text-primary">{domainScore.score}%</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm sm:gap-4">
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

            {/* Consentz Metrics for this domain */}
            <ConsentzDomainMetrics domain={slug} />

            {/* KLOEs */}
            <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-primary">Key Lines of Enquiry</h2>
                    <ViewToggle mode={kloeView} onChange={setKloeView} />
                </div>

                {kloeView === "card" ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {domainKloes.map((kloe) => {
                            const kloeGaps = gaps.filter((g) => g.kloe === kloe.code && g.status === "OPEN");
                            const criticalCount = kloeGaps.filter((g) => g.severity === "CRITICAL").length;
                            const kloeEvidenceList = evidenceByKloe[kloe.code] ?? [];
                            const hasPolicy = kloeEvidenceList.some((e) => e.category === "POLICY");
                            const hasTraining = kloeEvidenceList.some((e) => e.category === "TRAINING_RECORD");
                            const coverageFactors = [
                                kloeGaps.length === 0 ? 40 : kloeGaps.some((g) => g.severity === "CRITICAL") ? 0 : 15,
                                kloeEvidenceList.length > 0 ? 25 : 0,
                                hasPolicy ? 20 : 0,
                                hasTraining ? 15 : 0,
                            ];
                            const kloeScore = Math.min(100, coverageFactors.reduce((a, b) => a + b, 0));

                            const kloeDef = getKloeDefinition(serviceType, kloe.code);
                            const displayTitle = kloeDef?.title ?? kloe.title;
                            const displayQuestion = kloeDef?.keyQuestion ?? kloe.keyQuestion;
                            const evidenceCount = kloeDef?.evidenceItems.length ?? 0;
                            const kloeRegs = (kloeDef?.regulations ?? kloe.regulations).map((r) => r.replace("REG", "Reg "));

                            return (
                                <button
                                    key={kloe.code}
                                    onClick={() => router.push(`/domains/${slug}/${kloe.code.toLowerCase()}`)}
                                    className="group flex flex-col rounded-xl border border-secondary bg-primary p-4 text-left transition duration-100 hover:border-brand hover:shadow-xs"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                            <Badge size="sm" color="gray" type="pill-color">{kloe.code}</Badge>
                                            {criticalCount >= 2 && <Badge size="sm" color="error" type="pill-color">High Risk</Badge>}
                                        </div>
                                        <MiniScoreRing score={kloeScore} />
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-primary line-clamp-2">{displayTitle}</p>
                                    <p className="mt-1 text-xs text-tertiary line-clamp-2">{displayQuestion}</p>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {kloeRegs.map((r) => (
                                            <span key={r} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-tertiary">{r}</span>
                                        ))}
                                    </div>
                                    <div className="mt-auto flex items-center justify-between pt-3">
                                        <div className="flex items-center gap-3 text-xs text-tertiary">
                                            <span>{kloeEvidenceList.length} doc{kloeEvidenceList.length !== 1 ? "s" : ""}</span>
                                            {evidenceCount > 0 && <span>{evidenceCount} required</span>}
                                            {kloeGaps.length > 0 && (
                                                <span className="text-warning-primary">{kloeGaps.length} gap{kloeGaps.length > 1 ? "s" : ""}</span>
                                            )}
                                        </div>
                                        <ChevronRight className="size-4 text-fg-quaternary opacity-0 transition duration-100 group-hover:opacity-100" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {domainKloes.map((kloe) => {
                            const kloeGaps = gaps.filter((g) => g.kloe === kloe.code && g.status === "OPEN");
                            const criticalCount = kloeGaps.filter((g) => g.severity === "CRITICAL").length;
                            const kloeEvidenceList = evidenceByKloe[kloe.code] ?? [];
                            const hasPolicy = kloeEvidenceList.some((e) => e.category === "POLICY");
                            const hasTraining = kloeEvidenceList.some((e) => e.category === "TRAINING_RECORD");
                            const coverageFactors = [
                                kloeGaps.length === 0 ? 40 : kloeGaps.some((g) => g.severity === "CRITICAL") ? 0 : 15,
                                kloeEvidenceList.length > 0 ? 25 : 0,
                                hasPolicy ? 20 : 0,
                                hasTraining ? 15 : 0,
                            ];
                            const kloeScore = Math.min(100, coverageFactors.reduce((a, b) => a + b, 0));

                            const kloeDef = getKloeDefinition(serviceType, kloe.code);
                            const displayTitle = kloeDef?.title ?? kloe.title;
                            const displayQuestion = kloeDef?.keyQuestion ?? kloe.keyQuestion;
                            const evidenceCount = kloeDef?.evidenceItems.length ?? 0;
                            const kloeRegs = (kloeDef?.regulations ?? kloe.regulations).map((r) => r.replace("REG", "Reg "));

                            return (
                                <button
                                    key={kloe.code}
                                    onClick={() => router.push(`/domains/${slug}/${kloe.code.toLowerCase()}`)}
                                    className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-4 text-left transition duration-100 hover:border-brand sm:flex-row sm:items-center sm:gap-4"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-tertiary">{kloe.code}</span>
                                            <span className="text-sm font-medium text-primary">{displayTitle}</span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-tertiary line-clamp-1">{displayQuestion}</p>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-tertiary">
                                            {kloeRegs.length > 0 && (
                                                <span>Linked: {kloeRegs.join(", ")}</span>
                                            )}
                                            <span>Evidence: {kloeEvidenceList.length} document{kloeEvidenceList.length !== 1 ? "s" : ""}</span>
                                            {evidenceCount > 0 && <span>{evidenceCount} required</span>}
                                            {kloeGaps.length > 0 && (
                                                <span className="text-warning-primary">{kloeGaps.length} gap{kloeGaps.length > 1 ? "s" : ""}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-sm font-bold text-primary">{kloeScore}%</span>
                                        {criticalCount >= 2 && <Badge size="sm" color="error" type="pill-color">High Risk</Badge>}
                                        <Badge size="sm" color={kloeGaps.length === 0 ? "success" : "warning"} type="pill-color">
                                            {kloeGaps.length === 0 ? "✓" : "⚠"}
                                        </Badge>
                                        <ChevronRight className="size-4 text-fg-quaternary" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Gaps in this domain */}
            <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-primary">Gaps in This Domain</h2>
                    {domainGaps.length > 0 && <ViewToggle mode={gapsView} onChange={setGapsView} />}
                </div>
                <GapsSection gaps={domainGaps} viewMode={gapsView} />
            </div>

            {slug === "safe" && <SafeTreatmentRiskSection />}
        </div>
    );
}
