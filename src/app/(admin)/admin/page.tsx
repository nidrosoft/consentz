"use client";

import {
    Building07, Users01, FileCheck02, CheckSquare,
    AlertTriangle, CreditCard01, TrendUp01, Activity,
    File06, AlertCircle,
} from "@untitledui/icons";
import { MetricsChart04 } from "@/components/application/metrics/metrics";
import { Badge } from "@/components/base/badges/badges";
import { useAdminMetrics } from "@/hooks/use-admin";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

const TIER_COLORS: Record<string, "gray" | "brand" | "success"> = {
    free: "gray",
    professional: "brand",
    enterprise: "success",
};

export default function AdminDashboardPage() {
    const { data: metrics, isLoading } = useAdminMetrics();
    const t = metrics?.totals;
    const r = metrics?.revenue;
    const g = metrics?.growth;

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div>
                <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Platform Overview</h1>
                <p className="mt-1 text-sm text-tertiary">
                    Real-time metrics across all Consentz organizations.
                </p>
            </div>

            {/* Primary Metrics — MetricsChart04 cards */}
            <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 xl:grid-cols-4 [&_[data-slot=actions-dropdown]]:hidden [&_.absolute.top-4.right-4]:hidden [&_.absolute.top-5.right-5]:hidden">
                <MetricsChart04
                    subtitle="Monthly Revenue"
                    title={isLoading ? "—" : formatCurrency(r?.mrr ?? 0)}
                    change={`${r?.activeSubscriptions ?? 0} active`}
                    changeTrend="positive"
                    changeDescription="subscriptions"
                    chartColor="text-fg-success-secondary"
                    chartData={[{ value: 0 }, { value: 20 }, { value: 40 }, { value: 60 }, { value: 80 }, { value: r?.mrr ?? 0 }]}
                />
                <MetricsChart04
                    subtitle="Organizations"
                    title={isLoading ? "—" : String(t?.organizations ?? 0)}
                    change={`+${g?.newOrgsLast30Days ?? 0}`}
                    changeTrend="positive"
                    changeDescription="last 30 days"
                    chartColor="text-fg-brand-primary"
                    chartData={[{ value: 2 }, { value: 4 }, { value: 6 }, { value: 8 }, { value: 12 }, { value: t?.organizations ?? 0 }]}
                />
                <MetricsChart04
                    subtitle="Total Users"
                    title={isLoading ? "—" : String(t?.users ?? 0)}
                    change={`${t?.staff ?? 0} staff`}
                    changeTrend="positive"
                    changeDescription="across all orgs"
                    chartColor="text-fg-brand-primary"
                    chartData={[{ value: 1 }, { value: 3 }, { value: 5 }, { value: 8 }, { value: 12 }, { value: t?.users ?? 0 }]}
                />
                <MetricsChart04
                    subtitle="Open Gaps"
                    title={isLoading ? "—" : String(t?.openGaps ?? 0)}
                    change={`${t?.openTasks ?? 0} open tasks`}
                    changeTrend={t?.openGaps ? "negative" : "positive"}
                    changeDescription="platform-wide"
                    chartColor="text-fg-error-secondary"
                    chartData={[{ value: 3 }, { value: 5 }, { value: 7 }, { value: 8 }, { value: 10 }, { value: t?.openGaps ?? 0 }]}
                />
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                {([
                    { label: "Policies", value: t?.policies ?? 0, icon: FileCheck02, color: "text-fg-success-secondary" },
                    { label: "Evidence", value: t?.evidence ?? 0, icon: File06, color: "text-fg-brand-primary" },
                    { label: "Tasks", value: t?.tasks ?? 0, icon: CheckSquare, color: "text-fg-warning-secondary" },
                    { label: "Incidents", value: t?.incidents ?? 0, icon: AlertCircle, color: "text-fg-error-secondary" },
                    { label: "Active Orgs", value: t?.activeOrganizations ?? 0, icon: Building07, color: "text-fg-success-primary" },
                    { label: "Activity (7d)", value: g?.activityLast7Days ?? 0, icon: Activity, color: "text-fg-brand-primary" },
                ] as const).map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4 shadow-xs">
                        <Icon className={`size-5 shrink-0 ${color}`} />
                        <div>
                            <p className="text-xs text-tertiary">{label}</p>
                            <p className="text-lg font-semibold text-primary">{isLoading ? "—" : value.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Subscription Tier Breakdown */}
            <div className="rounded-xl border border-secondary bg-primary shadow-xs">
                <div className="border-b border-secondary px-5 py-4">
                    <h2 className="text-md font-semibold text-primary">Subscription Breakdown</h2>
                    <p className="text-sm text-tertiary">Distribution of organizations by plan tier.</p>
                </div>
                <div className="grid grid-cols-1 divide-y divide-secondary md:grid-cols-3 md:divide-x md:divide-y-0">
                    {(["free", "professional", "enterprise"] as const).map((tier) => {
                        const count = r?.tierBreakdown[tier] ?? 0;
                        const price = (r?.planPrices[tier] ?? 0) / 100;
                        return (
                            <div key={tier} className="flex flex-col items-center gap-1 px-5 py-6">
                                <Badge size="md" color={TIER_COLORS[tier]} type="pill-color">
                                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                </Badge>
                                <p className="mt-2 text-display-xs font-bold text-primary">{count}</p>
                                <p className="text-xs text-tertiary">{formatCurrency(price)}/mo per org</p>
                                <p className="text-sm font-medium text-secondary">{formatCurrency(count * price)}/mo total</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Two-column: Recent Orgs + Recent Activity */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Recent Organizations */}
                <div className="rounded-xl border border-secondary bg-primary shadow-xs">
                    <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
                        <div>
                            <h2 className="text-md font-semibold text-primary">Recent Organizations</h2>
                            <p className="text-sm text-tertiary">Latest signups on the platform.</p>
                        </div>
                        <a href="/admin/organizations" className="text-sm font-medium text-brand-secondary transition duration-100 hover:text-brand-primary">
                            View all
                        </a>
                    </div>
                    <div className="divide-y divide-secondary">
                        {isLoading && <div className="px-5 py-8 text-center text-sm text-tertiary">Loading...</div>}
                        {metrics?.recentOrganizations.map((org) => (
                            <div key={org.id} className="flex items-center justify-between px-5 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-lg bg-brand-secondary text-sm font-semibold text-brand-primary">
                                        {org.name?.charAt(0).toUpperCase() ?? "?"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-primary">{org.name}</p>
                                        <p className="text-xs text-tertiary">{org.service_type?.replace(/_/g, " ") ?? "—"} · {formatDate(org.created_at)}</p>
                                    </div>
                                </div>
                                <Badge size="sm" color={TIER_COLORS[org.subscription_tier ?? "free"] ?? "gray"}>
                                    {org.subscription_tier ?? "free"}
                                </Badge>
                            </div>
                        ))}
                        {!isLoading && (metrics?.recentOrganizations.length ?? 0) === 0 && (
                            <div className="px-5 py-8 text-center text-sm text-tertiary">No organizations yet.</div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="rounded-xl border border-secondary bg-primary shadow-xs">
                    <div className="border-b border-secondary px-5 py-4">
                        <h2 className="text-md font-semibold text-primary">Recent Activity</h2>
                        <p className="text-sm text-tertiary">Audit log across all organizations.</p>
                    </div>
                    <div className="divide-y divide-secondary">
                        {isLoading && <div className="px-5 py-8 text-center text-sm text-tertiary">Loading...</div>}
                        {metrics?.recentActivity.map((log) => (
                            <div key={log.id} className="flex items-center justify-between px-5 py-3">
                                <div>
                                    <p className="text-sm text-primary">
                                        <span className="font-medium">{log.user_name ?? "System"}</span>
                                        {" "}
                                        <span className="text-tertiary">{log.action.toLowerCase().replace(/_/g, " ")}</span>
                                        {" "}
                                        <span className="text-secondary">{log.entity_type?.toLowerCase()}</span>
                                    </p>
                                </div>
                                <span className="shrink-0 text-xs text-tertiary">{timeAgo(log.created_at)}</span>
                            </div>
                        ))}
                        {!isLoading && (metrics?.recentActivity.length ?? 0) === 0 && (
                            <div className="px-5 py-8 text-center text-sm text-tertiary">No activity yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
