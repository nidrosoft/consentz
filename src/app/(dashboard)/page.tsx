"use client";

import { useRouter } from "next/navigation";
import {
    BarChart01, Award02, AlertTriangle, Clock,
    ShieldTick, Target02, Heart, Zap, Trophy01,
    ArrowUpRight, ArrowDownRight, Minus,
    File06, CheckSquare as CheckSquareIcon, PieChart01, AlertCircle, ChevronRight, Users01,
} from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { MetricsChart04 } from "@/components/application/metrics/metrics";
import { Table, TableCard } from "@/components/application/table/table";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { cx } from "@/utils/cx";
import {
    mockUser, mockOrganization, mockComplianceScore, mockGaps, mockTasks,
    mockActivityLog, mockDeadlines,
} from "@/lib/mock-data";
import { RATING_LABELS, RATING_THRESHOLDS, KLOES } from "@/lib/constants/cqc-framework";
import type { FC } from "react";

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

const overdueTasks = mockTasks.filter((t) => t.status === "OVERDUE");
const criticalGaps = mockGaps.filter((g) => g.severity === "CRITICAL" && g.status === "OPEN");
const highGaps = mockGaps.filter((g) => g.severity === "HIGH" && g.status === "OPEN");
const priorityGaps = [...criticalGaps, ...highGaps].slice(0, 5);

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

export default function DashboardPage() {
    const router = useRouter();
    const score = mockComplianceScore;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-display-xs font-semibold text-primary">
                    {getGreeting()}, {mockUser.name.split(" ")[0]}
                </h1>
                <p className="mt-1 text-sm text-tertiary">
                    {mockOrganization.name} &mdash; last updated {timeAgo(score.lastUpdated)}
                </p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {/* Compliance Score */}
                <MetricsChart04
                    subtitle="Compliance Score"
                    title={`${score.overall}%`}
                    change="+3%"
                    changeTrend="positive"
                    changeDescription="vs last month"
                    chartColor="text-fg-success-secondary"
                    chartData={[{ value: 42 }, { value: 45 }, { value: 48 }, { value: 52 }, { value: 55 }, { value: 58 }]}
                />

                {/* Predicted Rating — CQC uses terminology: Outstanding, Good, Requires Improvement, Inadequate */}
                <div className="relative">
                    <MetricsChart04
                        subtitle="Predicted Rating"
                        title={`${score.overall}%`}
                        change={`${RATING_THRESHOLDS.GOOD - score.overall}% to Good`}
                        changeTrend={score.overall >= RATING_THRESHOLDS.GOOD ? "positive" : "negative"}
                        changeDescription={score.overall >= RATING_THRESHOLDS.GOOD ? "target met" : "remaining"}
                        chartColor={score.predictedRating === "GOOD" || score.predictedRating === "OUTSTANDING" ? "text-fg-success-secondary" : "text-fg-warning-secondary"}
                        chartData={[{ value: 30 }, { value: 35 }, { value: 38 }, { value: 45 }, { value: 50 }, { value: 58 }]}
                    />
                    <Badge
                        size="sm"
                        color={score.predictedRating === "OUTSTANDING" ? "success" : score.predictedRating === "GOOD" ? "blue" : score.predictedRating === "INADEQUATE" ? "error" : "warning"}
                        type="pill-color"
                        className="absolute top-4 right-4"
                    >
                        {RATING_LABELS[score.predictedRating]}
                    </Badge>
                </div>

                {/* Open Gaps */}
                <MetricsChart04
                    subtitle="Open Gaps"
                    title={String(mockGaps.filter((g) => g.status === "OPEN").length)}
                    change={`${criticalGaps.length} critical`}
                    changeTrend="negative"
                    changeDescription={`· ${highGaps.length} high`}
                    chartColor="text-fg-error-secondary"
                    chartData={[{ value: 8 }, { value: 10 }, { value: 11 }, { value: 12 }, { value: 13 }, { value: 13 }]}
                />

                {/* Overdue Tasks */}
                <MetricsChart04
                    subtitle="Overdue Tasks"
                    title={String(overdueTasks.length)}
                    change={`${mockTasks.filter((t) => t.status === "TODO").length} pending`}
                    changeTrend="negative"
                    changeDescription="to do"
                    chartColor="text-fg-warning-secondary"
                    chartData={[{ value: 0 }, { value: 1 }, { value: 1 }, { value: 2 }, { value: 1 }, { value: 1 }]}
                />
            </div>

            {/* Domain Overview */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-primary">CQC Domain Overview</h2>
                    <Button color="link-color" size="sm" onClick={() => router.push("/assessment/3")}>Retake Assessment &rarr;</Button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {score.domains.map((d) => {
                        const Icon = DOMAIN_ICONS[d.slug];
                        const colors = DOMAIN_COLORS[d.slug];
                        const domainKloes = KLOES.filter((k) => k.domain === d.slug);
                        return (
                            <button
                                key={d.slug}
                                onClick={() => router.push(`/domains/${d.slug}`)}
                                className="flex flex-col gap-2 rounded-xl border border-secondary bg-primary p-4 text-left transition duration-100 hover:border-brand-300 hover:shadow-xs"
                            >
                                <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5">
                                        {Icon && <Icon className={cx("size-4", colors.text)} />}
                                        <span className="text-sm font-medium text-primary">{d.domainName}</span>
                                    </div>
                                    <span className={cx(
                                        "inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[10px] font-medium leading-tight",
                                        d.rating === "GOOD" || d.rating === "OUTSTANDING"
                                            ? "bg-success-primary text-success-primary"
                                            : d.rating === "INADEQUATE"
                                                ? "bg-error-primary text-error-primary"
                                                : "bg-warning-primary text-warning-primary",
                                    )}>
                                        {RATING_LABELS[d.rating]}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="font-mono text-xl font-bold text-primary">{d.score}%</span>
                                    <TrendIndicator value={d.trend} />
                                </div>
                                <ProgressBarBase value={d.score} min={0} max={100} />
                                <span className="text-[11px] text-tertiary">{d.gapCount} gaps</span>
                                <div className="flex flex-wrap gap-0.5 pt-1 border-t border-secondary">
                                    {domainKloes.map((k) => (
                                        <span key={k.code} className={cx("rounded px-1 py-px text-[9px] font-semibold leading-tight", colors.text, colors.bg)}>
                                            {k.code}
                                        </span>
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Priority Gaps + Recent Activity */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                {/* Priority Gaps (3/5) */}
                <div className="lg:col-span-3 rounded-xl border border-secondary bg-primary">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-secondary">
                        <h2 className="text-lg font-semibold text-primary">Priority Gaps</h2>
                        <Button color="link-color" size="sm" onClick={() => router.push("/domains")}>View all {mockGaps.length} gaps &rarr;</Button>
                    </div>
                    <div className="flex flex-col gap-3 p-4">
                        {priorityGaps.map((gap) => (
                            <div key={gap.id} className="flex items-start gap-3 rounded-lg border border-secondary p-3">
                                <span className="relative mt-1 flex size-2.5 shrink-0 items-center justify-center">
                                    <span className={cx("absolute inset-0 rounded-full animate-pulse-dot", SEVERITY_DOT[gap.severity])} />
                                    <span className={cx("relative size-2 rounded-full", SEVERITY_DOT[gap.severity])} />
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-primary">{gap.title}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <Badge size="sm" color={SEVERITY_BADGE_COLOR[gap.severity]} type="pill-color">{gap.severity}</Badge>
                                        <span className="text-xs text-tertiary capitalize">{gap.domain}</span>
                                        <span className="text-xs text-tertiary">&middot; {gap.kloe}</span>
                                        <span className="text-xs text-tertiary">&middot; {gap.regulation}</span>
                                    </div>
                                </div>
                                <Button color="secondary" size="sm" onClick={() => router.push(`/domains/${gap.domain}`)}>Fix now &rarr;</Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity (2/5) */}
                <div className="lg:col-span-2 rounded-xl border border-secondary bg-primary">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-secondary">
                        <h2 className="text-lg font-semibold text-primary">Recent Activity</h2>
                        <Button color="link-color" size="sm" onClick={() => router.push("/audits")}>View all &rarr;</Button>
                    </div>
                    <div className="flex flex-col gap-3 p-4">
                        {mockActivityLog.slice(0, 5).map((entry) => (
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
                        ))}
                    </div>
                </div>
            </div>

            {/* Upcoming Deadlines */}
            <TableCard.Root>
                <TableCard.Header
                    title="Upcoming Deadlines"
                    badge={String(mockDeadlines.length)}
                    description="Tasks and renewals requiring attention soon."
                />
                <Table aria-label="Upcoming deadlines" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="title" label="Deadline" isRowHeader />
                        <Table.Head id="type" label="Type" />
                        <Table.Head id="severity" label="Severity" />
                        <Table.Head id="urgency" label="Urgency" className="min-w-40" />
                    </Table.Header>
                    <Table.Body items={mockDeadlines}>
                        {(dl) => {
                            const days = daysUntil(dl.dueDate);
                            const urgencyPercent = Math.max(0, Math.min(100, 100 - (days / 30) * 100));
                            const urgencyLabel = days <= 0 ? "Today" : `${days} days`;
                            const severityBadgeColor: Record<string, "error" | "warning" | "brand" | "gray"> = { CRITICAL: "error", HIGH: "warning", MEDIUM: "brand", LOW: "gray" };
                            const typeLabels: Record<string, string> = { POLICY_REVIEW: "Policy Review", DBS_RENEWAL: "DBS Renewal", EVIDENCE_EXPIRY: "Evidence Expiry", TRAINING_DUE: "Training Due", AUDIT_DUE: "Audit Due" };
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
        </div>
    );
}
