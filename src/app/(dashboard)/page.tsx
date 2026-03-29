"use client";

import { useRouter } from "next/navigation";
import {
    BarChart01, Award02, AlertTriangle, Clock, ClockRefresh, CheckCircle,
    ShieldTick, Target02, Heart, Zap, Trophy01,
    ArrowUpRight, ArrowDownRight, Minus,
    File06, CheckSquare as CheckSquareIcon, PieChart01, AlertCircle, ChevronRight, Users01,
} from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { MetricsChart04 } from "@/components/application/metrics/metrics";
import { Table, TableCard } from "@/components/application/table/table";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { cx } from "@/utils/cx";
import { useDashboard } from "@/hooks/use-dashboard";
import { RATING_LABELS, RATING_THRESHOLDS, KLOES } from "@/lib/constants/cqc-framework";
import type { FC } from "react";
import type { ComplianceGap, ActivityLogEntry, UpcomingDeadline } from "@/types";

const DOMAIN_ICONS: Record<string, FC<{ className?: string }>> = {
    safe: ShieldTick,
    effective: Target02,
    caring: Heart,
    responsive: Zap,
    "well-led": Trophy01,
};

const DOMAIN_COLORS: Record<string, { text: string; bg: string }> = {
    safe: { text: "text-[#3B82F6]", bg: "bg-[#EFF6FF]" },
    effective: { text: "text-[#8B5CF6]", bg: "bg-[#F5F3FF]" },
    caring: { text: "text-[#EC4899]", bg: "bg-[#FDF2F8]" },
    responsive: { text: "text-[#F59E0B]", bg: "bg-[#FFFBEB]" },
    "well-led": { text: "text-[#10B981]", bg: "bg-[#ECFDF5]" },
};

const SEVERITY_DOT: Record<string, string> = {
    CRITICAL: "bg-error-solid",
    HIGH: "bg-warning-solid",
    MEDIUM: "bg-brand-solid",
    LOW: "bg-quaternary",
};

const SEVERITY_BADGE_COLOR: Record<string, "error" | "warning" | "brand" | "gray"> = {
    CRITICAL: "error",
    HIGH: "warning",
    MEDIUM: "brand",
    LOW: "gray",
};

const ENTITY_STYLE: Record<string, { bg: string; fg: string }> = {
    EVIDENCE:     { bg: "bg-[#ECFDF3]", fg: "text-[#12B76A]" },
    TASK:         { bg: "bg-[#EEF4FF]", fg: "text-[#3538CD]" },
    ORGANIZATION: { bg: "bg-[#F4F3FF]", fg: "text-[#6938EF]" },
    POLICY:       { bg: "bg-[#ECFDF3]", fg: "text-[#12B76A]" },
    INCIDENT:     { bg: "bg-[#FFF4ED]", fg: "text-[#E04F16]" },
    STAFF:        { bg: "bg-[#EEF4FF]", fg: "text-[#3538CD]" },
    TRAINING:     { bg: "bg-[#F4F3FF]", fg: "text-[#6938EF]" },
    GAP:          { bg: "bg-[#FEF3F2]", fg: "text-[#D92D20]" },
    ASSESSMENT:   { bg: "bg-[#FFFAEB]", fg: "text-[#DC6803]" },
    NOTIFICATION: { bg: "bg-[#EEF4FF]", fg: "text-[#3538CD]" },
};

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

function TrendIndicator({ value }: { value: number }) {
    if (value > 0) return <span className="flex items-center gap-0.5 text-xs font-medium text-success-primary"><ArrowUpRight className="size-3" />+{value}</span>;
    if (value < 0) return <span className="flex items-center gap-0.5 text-xs font-medium text-error-primary"><ArrowDownRight className="size-3" />{value}</span>;
    return <span className="flex items-center gap-0.5 text-xs font-medium text-tertiary"><Minus className="size-3" />0</span>;
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

function daysUntil(dateStr: string): number {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-10 w-72 rounded-lg bg-quaternary" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-36 rounded-xl bg-quaternary" />)}
            </div>
            <div className="h-64 rounded-xl bg-quaternary" />
        </div>
    );
}

export default function DashboardPage() {
    const router = useRouter();
    const { data: overview, isLoading, error } = useDashboard();

    if (isLoading) return <DashboardSkeleton />;
    if (error || !overview) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
                <AlertTriangle className="size-10 text-warning-primary" />
                <p className="text-sm text-tertiary">Failed to load dashboard data. Please try again.</p>
                <Button color="secondary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    const score = overview.compliance;
    const gaps = overview.gaps;
    const activity = overview.activity ?? [];
    const deadlines = overview.deadlines ?? [];

    const criticalGaps = gaps?.CRITICAL ?? 0;
    const highGaps = gaps?.HIGH ?? 0;
    const totalOpenGaps = gaps?.total ?? 0;
    const domainCards = score?.domains ?? [];
    const overdueCount = overview.tasks?.overdueCount ?? 0;
    const pendingCount = overview.tasks?.totalActive ?? 0;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-display-xs font-semibold text-primary">
                    {getGreeting()}
                </h1>
                <p className="mt-1 text-sm text-tertiary">
                    Last updated {score?.lastUpdated ? timeAgo(score.lastUpdated) : "recently"}
                </p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 xl:grid-cols-4">
                <MetricsChart04
                    subtitle="Compliance Score"
                    title={`${score?.overall ?? 0}%`}
                    change="+3%"
                    changeTrend="positive"
                    changeDescription="vs last month"
                    chartColor="text-fg-success-secondary"
                    chartData={[{ value: 42 }, { value: 45 }, { value: 48 }, { value: 52 }, { value: 55 }, { value: score?.overall ?? 58 }]}
                />

                <div className="relative">
                    <MetricsChart04
                        subtitle="Predicted Rating"
                        title={`${score?.overall ?? 0}%`}
                        change={`${Math.max(0, RATING_THRESHOLDS.GOOD - (score?.overall ?? 0))}% to Good`}
                        changeTrend={(score?.overall ?? 0) >= RATING_THRESHOLDS.GOOD ? "positive" : "negative"}
                        changeDescription={(score?.overall ?? 0) >= RATING_THRESHOLDS.GOOD ? "target met" : "remaining"}
                        chartColor={score?.predictedRating === "GOOD" || score?.predictedRating === "OUTSTANDING" ? "text-fg-success-secondary" : "text-fg-warning-secondary"}
                        chartData={[{ value: 30 }, { value: 35 }, { value: 38 }, { value: 45 }, { value: 50 }, { value: score?.overall ?? 58 }]}
                    />
                    {score?.predictedRating && (
                        <Badge
                            size="sm"
                            color={score.predictedRating === "OUTSTANDING" ? "success" : score.predictedRating === "GOOD" ? "blue" : score.predictedRating === "INADEQUATE" ? "error" : "warning"}
                            type="pill-color"
                            className="absolute top-4 right-4"
                        >
                            {RATING_LABELS[score.predictedRating]}
                        </Badge>
                    )}
                </div>

                <MetricsChart04
                    subtitle="Open Gaps"
                    title={String(totalOpenGaps)}
                    change={`${criticalGaps} critical`}
                    changeTrend="negative"
                    changeDescription={`· ${highGaps} high`}
                    chartColor="text-fg-error-secondary"
                    chartData={[{ value: 8 }, { value: 10 }, { value: 11 }, { value: 12 }, { value: 13 }, { value: totalOpenGaps }]}
                />

                <MetricsChart04
                    subtitle="Overdue Tasks"
                    title={String(overdueCount)}
                    change={`${pendingCount} active`}
                    changeTrend="negative"
                    changeDescription="total"
                    chartColor="text-fg-warning-secondary"
                    chartData={[{ value: 0 }, { value: 1 }, { value: 1 }, { value: 2 }, { value: 1 }, { value: overdueCount }]}
                />
            </div>

            {/* Domain Overview — always show five domains; placeholders when no compliance data yet */}
            <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-primary">CQC Domain Overview</h2>
                    <Button color="link-color" size="sm" className="self-start sm:self-auto" onClick={() => router.push("/reassessment")}>
                        Retake Assessment &rarr;
                    </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {domainCards.map((d) => {
                        const Icon = DOMAIN_ICONS[d.slug];
                        const colors = DOMAIN_COLORS[d.slug] ?? { text: "text-tertiary", bg: "bg-secondary" };
                        const domainKloes = KLOES.filter((k) => k.domain === d.slug);
                        const isPlaceholder = d.domainId.startsWith("empty-");
                        const cardClass = cx(
                            "flex min-w-0 flex-col gap-2 rounded-xl border border-secondary bg-primary p-3 text-left transition duration-100 sm:p-4",
                            isPlaceholder ? "opacity-90" : "hover:border-brand-300 hover:shadow-xs",
                        );
                        const body = (
                            <>
                                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                                    <div className="flex min-w-0 items-center gap-1.5">
                                        {Icon && <Icon className={cx("size-4 shrink-0", colors.text)} />}
                                        <span className="truncate text-sm font-medium text-primary">{d.domainName}</span>
                                    </div>
                                    <span className={cx(
                                        "inline-flex w-fit max-w-full shrink-0 items-center rounded-full px-1.5 py-px text-[10px] font-medium leading-tight",
                                        d.rating === "GOOD" || d.rating === "OUTSTANDING"
                                            ? "bg-success-primary text-success-primary"
                                            : d.rating === "INADEQUATE"
                                                ? "bg-error-primary text-error-primary"
                                                : "bg-warning-primary text-warning-primary",
                                    )}>
                                        <span className="truncate">{RATING_LABELS[d.rating]}</span>
                                    </span>
                                </div>
                                <div className="flex min-w-0 flex-wrap items-baseline gap-1.5">
                                    <span className="font-mono text-lg font-bold text-primary sm:text-xl">{d.score}%</span>
                                    {!isPlaceholder && <TrendIndicator value={d.trend} />}
                                </div>
                                <div className="min-w-0">
                                    <ProgressBarBase value={d.score} min={0} max={100} />
                                </div>
                                <span className="text-[11px] leading-snug text-tertiary">
                                    {isPlaceholder ? "No score yet — complete onboarding or add evidence" : `${d.gapCount} gaps`}
                                </span>
                                <div className="flex min-h-[1.25rem] min-w-0 flex-wrap gap-0.5 border-t border-secondary pt-1.5">
                                    {domainKloes.map((k) => (
                                        <span key={k.code} className={cx("rounded px-1 py-px text-[9px] font-semibold leading-tight", colors.text, colors.bg)}>
                                            {k.code}
                                        </span>
                                    ))}
                                </div>
                            </>
                        );
                        if (isPlaceholder) {
                            return (
                                <div key={d.domainId} className={cardClass}>
                                    {body}
                                </div>
                            );
                        }
                        return (
                            <button
                                key={d.domainId}
                                type="button"
                                onClick={() => router.push(`/domains/${d.slug}`)}
                                className={cardClass}
                            >
                                {body}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Priority Gaps + Recent Activity */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3 rounded-xl border border-secondary bg-primary">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-secondary">
                        <h2 className="text-lg font-semibold text-primary">Priority Gaps</h2>
                        <Button color="link-color" size="sm" onClick={() => router.push("/domains")}>View all gaps &rarr;</Button>
                    </div>
                    <div className="flex flex-col gap-3 p-4">
                        {totalOpenGaps === 0 ? (
                            <EmptyState size="sm">
                                <EmptyState.Header pattern="none">
                                    <EmptyState.FeaturedIcon icon={CheckCircle} color="success" theme="light" size="sm" />
                                </EmptyState.Header>
                                <EmptyState.Content>
                                    <EmptyState.Title>No open gaps — great job!</EmptyState.Title>
                                    <EmptyState.Description>Your compliance gaps are all resolved. Keep monitoring for new ones.</EmptyState.Description>
                                </EmptyState.Content>
                            </EmptyState>
                        ) : (
                            <p className="text-sm text-tertiary">{criticalGaps} critical, {highGaps} high priority gaps require attention.</p>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 rounded-xl border border-secondary bg-primary">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-secondary">
                        <h2 className="text-lg font-semibold text-primary">Recent Activity</h2>
                        <Button color="link-color" size="sm" onClick={() => router.push("/audits")}>View all &rarr;</Button>
                    </div>
                    <div className="flex flex-col gap-3 p-4">
                        {activity.length === 0 ? (
                            <EmptyState size="sm">
                                <EmptyState.Header pattern="none">
                                    <EmptyState.FeaturedIcon icon={ClockRefresh} color="gray" theme="light" size="sm" />
                                </EmptyState.Header>
                                <EmptyState.Content>
                                    <EmptyState.Title>No recent activity</EmptyState.Title>
                                    <EmptyState.Description>Activity from your team will appear here as they use the platform.</EmptyState.Description>
                                </EmptyState.Content>
                            </EmptyState>
                        ) : (
                            activity.slice(0, 5).map((entry: ActivityLogEntry) => (
                                <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-secondary p-3">
                                    <span className={cx("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", ENTITY_STYLE[entry.entityType]?.bg ?? "bg-secondary")}>
                                        {entry.entityType === "EVIDENCE" && <File06 className={cx("size-4", ENTITY_STYLE.EVIDENCE.fg)} />}
                                        {entry.entityType === "TASK" && <CheckSquareIcon className={cx("size-4", ENTITY_STYLE.TASK.fg)} />}
                                        {entry.entityType === "ORGANIZATION" && <PieChart01 className={cx("size-4", ENTITY_STYLE.ORGANIZATION.fg)} />}
                                        {entry.entityType === "POLICY" && <File06 className={cx("size-4", ENTITY_STYLE.POLICY.fg)} />}
                                        {entry.entityType === "INCIDENT" && <AlertCircle className={cx("size-4", ENTITY_STYLE.INCIDENT.fg)} />}
                                        {entry.entityType === "STAFF" && <Users01 className={cx("size-4", ENTITY_STYLE.STAFF.fg)} />}
                                        {entry.entityType === "TRAINING" && <Award02 className={cx("size-4", ENTITY_STYLE.TRAINING.fg)} />}
                                        {entry.entityType === "GAP" && <AlertTriangle className={cx("size-4", ENTITY_STYLE.GAP.fg)} />}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm text-primary">{entry.description}</p>
                                        <p className="mt-0.5 text-xs text-tertiary">{entry.user} &middot; {timeAgo(entry.createdAt)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Upcoming Deadlines */}
            {deadlines.length > 0 && (
                <TableCard.Root>
                    <TableCard.Header
                        title="Upcoming Deadlines"
                        badge={String(deadlines.length)}
                        description="Tasks and renewals requiring attention soon."
                    />
                    <Table aria-label="Upcoming deadlines" selectionMode="none">
                        <Table.Header>
                            <Table.Head id="title" label="Deadline" isRowHeader />
                            <Table.Head id="type" label="Type" />
                            <Table.Head id="severity" label="Severity" />
                            <Table.Head id="urgency" label="Urgency" className="min-w-40" />
                        </Table.Header>
                        <Table.Body items={deadlines}>
                            {(dl: UpcomingDeadline) => {
                                const days = daysUntil(dl.dueDate);
                                const urgencyPercent = Math.max(0, Math.min(100, 100 - (days / 30) * 100));
                                const urgencyLabel = days <= 0 ? "Today" : `${days} days`;
                                const severityBadgeColor: Record<string, "error" | "warning" | "brand" | "gray"> = { CRITICAL: "error", HIGH: "warning", MEDIUM: "brand", LOW: "gray" };
                                const typeLabels: Record<string, string> = { POLICY_REVIEW: "Policy Review", DBS_RENEWAL: "DBS Renewal", EVIDENCE_EXPIRY: "Evidence Expiry", TRAINING_DUE: "Training Due", AUDIT_DUE: "Audit Due", TASK: "Task" };
                                return (
                                    <Table.Row id={dl.id}>
                                        <Table.Cell>
                                            <div className="flex items-center gap-3">
                                                <span className="relative flex size-2.5 shrink-0 items-center justify-center">
                                                    {(dl.severity === "CRITICAL" || dl.severity === "HIGH") && <span className={cx("absolute inset-0 rounded-full animate-pulse-dot", SEVERITY_DOT[dl.severity])} />}
                                                    <span className={cx("relative size-2 rounded-full", SEVERITY_DOT[dl.severity])} />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium text-primary whitespace-nowrap">{dl.title}</p>
                                                    <p className="text-xs text-tertiary">{new Date(dl.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                                                </div>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge size="sm" color="gray" type="modern">{typeLabels[dl.type] ?? dl.type}</Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <BadgeWithDot size="sm" color={severityBadgeColor[dl.severity] ?? "gray"}>
                                                {dl.severity.charAt(0) + dl.severity.slice(1).toLowerCase()}
                                            </BadgeWithDot>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <ProgressBar
                                                labelPosition="right"
                                                value={urgencyPercent}
                                                valueFormatter={() => urgencyLabel}
                                                progressClassName={cx(
                                                    days <= 0 && "bg-error-solid",
                                                    days > 0 && days <= 7 && "bg-warning-solid",
                                                    days > 7 && days <= 14 && "bg-brand-solid",
                                                    days > 14 && "bg-success-solid",
                                                )}
                                            />
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            }}
                        </Table.Body>
                    </Table>
                </TableCard.Root>
            )}
        </div>
    );
}
