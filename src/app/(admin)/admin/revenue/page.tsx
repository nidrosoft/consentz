"use client";

import {
    CreditCard01, TrendUp01, AlertTriangle, CheckCircle,
    XCircle, Clock,
} from "@untitledui/icons";
import { MetricsChart04 } from "@/components/application/metrics/metrics";
import { Badge } from "@/components/base/badges/badges";
import { Table, TableCard } from "@/components/application/table/table";
import { useAdminRevenue } from "@/hooks/use-admin";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const TIER_COLORS: Record<string, "gray" | "brand" | "success"> = {
    free: "gray",
    professional: "brand",
    enterprise: "success",
};

const STATUS_CONFIG: Record<string, { color: "success" | "error" | "warning" | "gray"; icon: typeof CheckCircle }> = {
    active: { color: "success", icon: CheckCircle },
    past_due: { color: "error", icon: AlertTriangle },
    canceled: { color: "gray", icon: XCircle },
    trialing: { color: "warning", icon: Clock },
};

export default function AdminRevenuePage() {
    const { data, isLoading } = useAdminRevenue();
    const s = data?.summary;

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Revenue & Billing</h1>
                <p className="mt-1 text-sm text-tertiary">Subscription revenue, plan distribution, and payment status.</p>
            </div>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 xl:grid-cols-4 [&_.absolute.top-4.right-4]:hidden [&_.absolute.top-5.right-5]:hidden">
                <MetricsChart04
                    subtitle="Monthly Recurring Revenue"
                    title={isLoading ? "—" : formatCurrency(s?.totalMrr ?? 0)}
                    change={`${s?.activeSubscriptions ?? 0} paying`}
                    changeTrend="positive"
                    changeDescription="organizations"
                    chartColor="text-fg-success-secondary"
                    chartData={[{ value: 0 }, { value: 10 }, { value: 30 }, { value: 50 }, { value: 80 }, { value: s?.totalMrr ?? 0 }]}
                />
                <MetricsChart04
                    subtitle="Annual Run Rate"
                    title={isLoading ? "—" : formatCurrency((s?.totalMrr ?? 0) * 12)}
                    change={formatCurrency(s?.totalMrr ?? 0)}
                    changeTrend="positive"
                    changeDescription="per month"
                    chartColor="text-fg-brand-primary"
                    chartData={[{ value: 0 }, { value: 50 }, { value: 150 }, { value: 300 }, { value: 500 }, { value: (s?.totalMrr ?? 0) * 12 }]}
                />
                <MetricsChart04
                    subtitle="Past Due"
                    title={isLoading ? "—" : String(s?.pastDueCount ?? 0)}
                    change={`${s?.canceledCount ?? 0} canceled`}
                    changeTrend={s?.pastDueCount ? "negative" : "positive"}
                    changeDescription="organizations"
                    chartColor={s?.pastDueCount ? "text-fg-error-secondary" : "text-fg-success-secondary"}
                    chartData={[{ value: 0 }, { value: 1 }, { value: 1 }, { value: 2 }, { value: 1 }, { value: s?.pastDueCount ?? 0 }]}
                />
                <MetricsChart04
                    subtitle="Trialing"
                    title={isLoading ? "—" : String(s?.trialingCount ?? 0)}
                    change="on trial"
                    changeTrend="positive"
                    changeDescription="organizations"
                    chartColor="text-fg-warning-secondary"
                    chartData={[{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 2 }, { value: s?.trialingCount ?? 0 }]}
                />
            </div>

            {/* Tier Breakdown */}
            <div className="rounded-xl border border-secondary bg-primary shadow-xs">
                <div className="border-b border-secondary px-5 py-4">
                    <h2 className="text-md font-semibold text-primary">Revenue by Plan</h2>
                    <p className="text-sm text-tertiary">Breakdown of recurring revenue per subscription tier.</p>
                </div>
                <div className="grid grid-cols-1 divide-y divide-secondary md:grid-cols-3 md:divide-x md:divide-y-0">
                    {(["free", "professional", "enterprise"] as const).map((tier) => {
                        const count = s?.tierCounts[tier] ?? 0;
                        const revenue = s?.tierRevenue[tier] ?? 0;
                        const percentage = s?.totalMrr ? Math.round((revenue / s.totalMrr) * 100) : 0;
                        return (
                            <div key={tier} className="flex flex-col items-center gap-2 px-5 py-6">
                                <Badge size="md" color={TIER_COLORS[tier]} type="pill-color">
                                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                </Badge>
                                <p className="text-display-xs font-bold text-primary">{formatCurrency(revenue)}</p>
                                <p className="text-sm text-tertiary">{count} orgs · {percentage}% of MRR</p>
                                {/* Revenue bar */}
                                <div className="mt-1 h-2 w-full max-w-32 overflow-hidden rounded-full bg-secondary">
                                    <div
                                        className={`h-full rounded-full ${tier === "enterprise" ? "bg-success-solid" : tier === "professional" ? "bg-brand-solid" : "bg-quaternary"}`}
                                        style={{ width: `${Math.max(percentage, 2)}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Plans Table */}
            <TableCard.Root>
                <TableCard.Header
                    title="Subscription Plans"
                    description="All available plans and their Stripe configuration."
                />
                <Table aria-label="Plans" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="name" label="Plan" isRowHeader />
                        <Table.Head id="tier" label="Tier" />
                        <Table.Head id="monthly" label="Monthly" />
                        <Table.Head id="yearly" label="Yearly" />
                        <Table.Head id="status" label="Status" />
                    </Table.Header>
                    <Table.Body items={isLoading ? [] : (data?.plans ?? [])}>
                        {(plan: Record<string, unknown>) => (
                            <Table.Row id={plan.id as string}>
                                <Table.Cell>
                                    <span className="text-sm font-medium text-primary">{plan.name as string}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color={TIER_COLORS[(plan.tier as string) ?? "free"] ?? "gray"}>
                                        {plan.tier as string}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-secondary">{formatCurrency((plan.price_monthly as number) / 100)}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-secondary">{formatCurrency((plan.price_yearly as number) / 100)}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color={plan.is_active ? "success" : "gray"}>
                                        {plan.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </TableCard.Root>

            {/* Organization Billing Status */}
            <TableCard.Root>
                <TableCard.Header
                    title="Organization Billing Status"
                    badge={String(data?.organizations.length ?? 0)}
                    description="Current subscription tier and payment status for each organization."
                />
                <Table aria-label="Org billing" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="org" label="Organization" isRowHeader />
                        <Table.Head id="tier" label="Plan" />
                        <Table.Head id="status" label="Status" />
                        <Table.Head id="stripe" label="Stripe ID" />
                        <Table.Head id="trial" label="Trial Ends" />
                    </Table.Header>
                    <Table.Body items={isLoading ? [] : (data?.organizations ?? [])}>
                        {(org: Record<string, unknown>) => {
                            const tier = (org.subscription_tier as string) ?? "free";
                            const status = (org.subscription_status as string) ?? "active";
                            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
                            return (
                                <Table.Row id={org.id as string}>
                                    <Table.Cell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-secondary text-xs font-semibold text-brand-primary">
                                                {(org.name as string)?.charAt(0).toUpperCase() ?? "?"}
                                            </div>
                                            <span className="text-sm font-medium text-primary">{org.name as string}</span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge size="sm" color={TIER_COLORS[tier] ?? "gray"}>
                                            {tier}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge size="sm" color={cfg.color}>
                                            {status.replace(/_/g, " ")}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-xs font-mono text-tertiary">
                                            {org.stripe_customer_id ? (org.stripe_customer_id as string).slice(0, 18) + "..." : "—"}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-sm text-tertiary">{formatDate(org.trial_ends_at as string | null)}</span>
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
