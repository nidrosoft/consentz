"use client";

import { BarChart01, TrendUp01, TrendDown01, AlertTriangle, CheckCircle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { useAdminComplianceOverview } from "@/hooks/use-admin";
import { cx } from "@/utils/cx";

function scoreColor(score: number) {
    if (score >= 75) return "text-fg-success-primary";
    if (score >= 50) return "text-fg-warning-primary";
    return "text-fg-error-primary";
}

function scoreBg(score: number) {
    if (score >= 75) return "bg-success-secondary";
    if (score >= 50) return "bg-warning-secondary";
    return "bg-error-secondary";
}

export default function AdminCompliancePage() {
    const { data, isLoading } = useAdminComplianceOverview();

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Compliance Overview</h1>
                <p className="mt-1 text-sm text-tertiary">Platform-wide compliance health across all organizations.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 xl:grid-cols-5">
                {[
                    { label: "Avg Score", value: data ? `${data.averageScore}%` : "—", icon: BarChart01, color: scoreColor(data?.averageScore ?? 0) },
                    { label: "Outstanding (>90%)", value: data?.outstanding ?? "—", icon: CheckCircle, color: "text-fg-success-primary" },
                    { label: "Requires Improvement (<50%)", value: data?.requiresImprovement ?? "—", icon: AlertTriangle, color: "text-fg-error-primary" },
                    { label: "Open Gaps", value: data?.totalOpenGaps ?? "—", icon: TrendDown01, color: "text-fg-warning-primary" },
                    { label: "Overdue Tasks", value: data?.overdueTasks ?? "—", icon: TrendUp01, color: "text-fg-error-primary" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex flex-col gap-2 rounded-xl border border-secondary bg-primary p-5 shadow-xs">
                        <div className="flex items-center gap-2">
                            <Icon className={cx("size-5", color)} />
                            <span className="text-xs font-medium text-tertiary">{label}</span>
                        </div>
                        <p className="text-display-xs font-bold text-primary">{isLoading ? "—" : value}</p>
                    </div>
                ))}
            </div>

            {/* Domain Averages */}
            <div className="rounded-xl border border-secondary bg-primary shadow-xs">
                <div className="border-b border-secondary px-5 py-4">
                    <h2 className="text-md font-semibold text-primary">Domain Averages</h2>
                    <p className="text-sm text-tertiary">Average scores across all organizations by CQC domain.</p>
                </div>
                <div className="grid grid-cols-1 divide-y divide-secondary sm:grid-cols-5 sm:divide-x sm:divide-y-0">
                    {data && Object.entries({
                        Safe: data.domainAverages.safe,
                        Effective: data.domainAverages.effective,
                        Caring: data.domainAverages.caring,
                        Responsive: data.domainAverages.responsive,
                        "Well-Led": data.domainAverages.wellLed,
                    }).map(([domain, score]) => (
                        <div key={domain} className="flex flex-col items-center gap-2 p-5">
                            <span className="text-xs font-medium text-tertiary">{domain}</span>
                            <div className={cx("flex size-16 items-center justify-center rounded-full", scoreBg(score))}>
                                <span className={cx("text-lg font-bold", scoreColor(score))}>{score}%</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-quaternary">
                                <div
                                    className={cx("h-1.5 rounded-full", score >= 75 ? "bg-success-solid" : score >= 50 ? "bg-warning-solid" : "bg-error-solid")}
                                    style={{ width: `${score}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="col-span-5 py-12 text-center text-sm text-tertiary">Loading domain scores...</div>}
                </div>
            </div>

            {/* Score Distribution */}
            <div className="rounded-xl border border-secondary bg-primary shadow-xs">
                <div className="border-b border-secondary px-5 py-4">
                    <h2 className="text-md font-semibold text-primary">Score Distribution</h2>
                    <p className="text-sm text-tertiary">How organizations are distributed across compliance score bands.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
                    {data && Object.entries(data.scoreBands).map(([band, count]) => {
                        const colors: Record<string, string> = {
                            "0-25": "bg-error-solid",
                            "26-50": "bg-warning-solid",
                            "51-75": "bg-brand-solid",
                            "76-100": "bg-success-solid",
                        };
                        return (
                            <div key={band} className="flex flex-col items-center gap-2 rounded-lg border border-secondary p-4">
                                <span className="text-xs font-medium text-tertiary">{band}%</span>
                                <span className="text-display-xs font-bold text-primary">{count}</span>
                                <div className={cx("h-2 w-full rounded-full", colors[band])} style={{ opacity: Math.max(0.3, count / Math.max(...Object.values(data.scoreBands), 1)) }} />
                            </div>
                        );
                    })}
                    {isLoading && <div className="col-span-4 py-8 text-center text-sm text-tertiary">Loading...</div>}
                </div>
            </div>

            {/* Bottom 10 Orgs */}
            <div className="rounded-xl border border-secondary bg-primary shadow-xs">
                <div className="border-b border-secondary px-5 py-4">
                    <h2 className="text-md font-semibold text-primary">Lowest Scoring Organizations</h2>
                    <p className="text-sm text-tertiary">Bottom 10 organizations by compliance score.</p>
                </div>
                <div className="divide-y divide-secondary">
                    {data?.bottom10.map((org, i) => (
                        <div key={org.id} className="flex items-center justify-between px-5 py-3">
                            <div className="flex items-center gap-3">
                                <span className="flex size-7 items-center justify-center rounded-lg bg-tertiary text-xs font-semibold text-primary">{i + 1}</span>
                                <div>
                                    <p className="text-sm font-medium text-primary">{org.name}</p>
                                    {org.serviceType && (
                                        <Badge size="sm" color={org.serviceType === "aesthetic_clinic" ? "purple" : "blue"}>
                                            {org.serviceType.replace(/_/g, " ")}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <span className={cx("text-lg font-bold", scoreColor(org.score as number))}>{org.score as number}%</span>
                        </div>
                    ))}
                    {isLoading && <div className="px-5 py-8 text-center text-sm text-tertiary">Loading...</div>}
                    {!isLoading && (data?.bottom10.length ?? 0) === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-tertiary">No compliance scores recorded yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
