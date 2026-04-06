"use client";

import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Badge } from "@/components/base/badges/badges";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { useAdminOrgDetail, useAdminUpdateOrg } from "@/hooks/use-admin";
import { toast } from "@/lib/toast";
import { cx } from "@/utils/cx";

interface Props {
    orgId: string | null;
    onClose: () => void;
}

function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function scoreColor(s: number) {
    if (s >= 80) return "text-fg-success-primary";
    if (s >= 60) return "text-fg-warning-primary";
    return "text-fg-error-primary";
}

const DOMAIN_LABELS = [
    { key: "safe_score", label: "Safe" },
    { key: "effective_score", label: "Effective" },
    { key: "caring_score", label: "Caring" },
    { key: "responsive_score", label: "Responsive" },
    { key: "well_led_score", label: "Well-Led" },
] as const;

const TIER_LABELS: Record<string, { label: string; color: "gray" | "brand" | "success" }> = {
    free: { label: "Free", color: "gray" },
    professional: { label: "Professional", color: "brand" },
    enterprise: { label: "Enterprise", color: "success" },
};

export function AdminOrgDetailPanel({ orgId, onClose }: Props) {
    const { data, isLoading } = useAdminOrgDetail(orgId);
    const updateOrg = useAdminUpdateOrg();
    const org = data?.organization as Record<string, string> | undefined;
    const currentTier = org?.subscription_tier ?? "free";
    const currentStatus = org?.subscription_status ?? "active";

    const handleTierChange = async (tier: string) => {
        if (!orgId) return;
        try {
            await updateOrg.mutateAsync({ orgId, action: "update_tier", tier });
            toast.success("Plan updated", `Organization is now on the ${tier} plan.`);
        } catch {
            toast.error("Failed", "Could not update plan.");
        }
    };

    const handleToggleActive = async () => {
        if (!orgId) return;
        const action = currentStatus === "active" ? "deactivate" : "activate";
        try {
            await updateOrg.mutateAsync({ orgId, action });
            toast.success("Status updated", `Organization ${action === "deactivate" ? "deactivated" : "activated"}.`);
        } catch {
            toast.error("Failed", "Could not update status.");
        }
    };

    return (
        <>
            <SlideoutMenu.Header onClose={onClose} className="relative flex w-full flex-col gap-1 px-4 pt-6 md:px-6">
                <h2 className="text-lg font-semibold text-primary">
                    {isLoading ? "Loading..." : org?.name ?? "Organization"}
                </h2>
                <p className="text-sm text-tertiary">Full organization details and management.</p>
            </SlideoutMenu.Header>

            <SlideoutMenu.Content>
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <p className="text-sm text-tertiary">Loading details...</p>
                    </div>
                ) : data ? (
                    <div className="flex flex-col gap-6">
                        {/* Subscription & Actions */}
                        <section>
                            <h3 className="mb-3 text-sm font-semibold text-primary">Subscription Management</h3>
                            <div className="rounded-lg border border-secondary p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge size="md" color={TIER_LABELS[currentTier]?.color ?? "gray"} type="pill-color">
                                            {TIER_LABELS[currentTier]?.label ?? currentTier}
                                        </Badge>
                                        <Badge size="sm" color={currentStatus === "active" ? "success" : currentStatus === "past_due" ? "error" : "gray"}>
                                            {currentStatus}
                                        </Badge>
                                    </div>
                                    <Button
                                        size="sm"
                                        color={currentStatus === "active" ? "primary-destructive" : "primary"}
                                        onClick={handleToggleActive}
                                        isLoading={updateOrg.isPending}
                                    >
                                        {currentStatus === "active" ? "Deactivate" : "Activate"}
                                    </Button>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    {(["free", "professional", "enterprise"] as const).map((tier) => (
                                        <Button
                                            key={tier}
                                            size="sm"
                                            color={currentTier === tier ? "primary" : "secondary"}
                                            isDisabled={currentTier === tier}
                                            onClick={() => handleTierChange(tier)}
                                        >
                                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Compliance Scores */}
                        <section>
                            <h3 className="mb-3 text-sm font-semibold text-primary">Compliance</h3>
                            {data.compliance ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2 flex items-center gap-3 rounded-lg border border-secondary bg-secondary_subtle p-4">
                                        <span className={cx("text-display-xs font-bold", scoreColor(data.compliance.overall_score))}>
                                            {data.compliance.overall_score}%
                                        </span>
                                        <div>
                                            <span className="text-sm text-secondary">Overall Score</span>
                                            <p className="text-xs text-tertiary">Updated {formatDate(data.compliance.updated_at)}</p>
                                        </div>
                                    </div>
                                    {DOMAIN_LABELS.map(({ key, label }) => {
                                        const score = (data.compliance as unknown as Record<string, number>)?.[key] ?? 0;
                                        return (
                                            <div key={key} className="flex items-center justify-between rounded-lg border border-secondary bg-primary p-3">
                                                <span className="text-sm text-tertiary">{label}</span>
                                                <span className={cx("text-sm font-semibold", scoreColor(score))}>{score}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-tertiary">No compliance data available yet.</p>
                            )}
                        </section>

                        {/* Data Counts */}
                        <section>
                            <h3 className="mb-3 text-sm font-semibold text-primary">Data Overview</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {(
                                    [
                                        ["Staff", data.counts.staff],
                                        ["Policies", data.counts.policies],
                                        ["Tasks", data.counts.tasks],
                                        ["Open Gaps", data.counts.openGaps],
                                        ["Evidence Items", data.counts.evidenceItems ?? 0],
                                        ["Completed", data.counts.evidenceComplete ?? 0],
                                    ] as [string, number][]
                                ).map(([label, val]) => (
                                    <div key={label} className="flex flex-col rounded-lg border border-secondary bg-primary p-3">
                                        <span className="text-xs text-tertiary">{label}</span>
                                        <span className="text-lg font-semibold text-primary">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Organization Info */}
                        <section>
                            <h3 className="mb-3 text-sm font-semibold text-primary">Details</h3>
                            <dl className="divide-y divide-secondary rounded-lg border border-secondary">
                                {([
                                    ["Service Type", org?.service_type?.replace(/_/g, " ") ?? "—"],
                                    ...(org?.service_type === "AESTHETIC_CLINIC" ? [["E3 Nutrition N/A", org?.e3_nutrition_na_aesthetic ? "Yes" : "No"]] : []),
                                    ["CQC Rating", org?.cqc_current_rating ?? "—"],
                                    ["CQC Provider ID", org?.cqc_provider_id ?? "—"],
                                    ["Registered Manager", org?.registered_manager ?? "—"],
                                    ["Consentz ID", org?.consentz_clinic_id ?? "Not linked"],
                                    ["Stripe ID", org?.stripe_customer_id ?? "—"],
                                    ["Created", formatDate(org?.created_at ?? null)],
                                ] as [string, string][]).map(([label, value]) => (
                                    <div key={label} className="flex items-center justify-between px-4 py-2.5">
                                        <dt className="text-sm text-tertiary">{label}</dt>
                                        <dd className="max-w-[200px] truncate text-sm font-medium text-primary">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>

                        {/* Users */}
                        <section>
                            <h3 className="mb-3 text-sm font-semibold text-primary">Users ({data.users.length})</h3>
                            <div className="divide-y divide-secondary rounded-lg border border-secondary">
                                {data.users.map((u) => (
                                    <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                                        <Avatar
                                            size="sm"
                                            initials={(u.full_name ?? u.email).charAt(0).toUpperCase()}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-primary">{u.full_name ?? "—"}</p>
                                            <p className="truncate text-xs text-tertiary">{u.email}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-0.5">
                                            <Badge size="sm" color={u.role === "OWNER" ? "brand" : u.role === "ADMIN" ? "success" : u.role === "SUSPENDED" ? "error" : "gray"}>
                                                {u.role}
                                            </Badge>
                                            <span className="text-[10px] text-tertiary">Last: {formatDate(u.last_sign_in_at)}</span>
                                        </div>
                                    </div>
                                ))}
                                {data.users.length === 0 && (
                                    <div className="px-4 py-6 text-center text-sm text-tertiary">No users in this organization.</div>
                                )}
                            </div>
                        </section>

                        {/* Recent Activity */}
                        {data.recentActivity.length > 0 && (
                            <section>
                                <h3 className="mb-3 text-sm font-semibold text-primary">Recent Activity</h3>
                                <div className="divide-y divide-secondary rounded-lg border border-secondary">
                                    {data.recentActivity.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between px-4 py-2.5">
                                            <p className="text-sm text-primary">
                                                <span className="font-medium">{log.user_name ?? "System"}</span>
                                                {" "}
                                                <span className="text-tertiary">{log.action.toLowerCase().replace(/_/g, " ")}</span>
                                            </p>
                                            <span className="text-xs text-tertiary">{timeAgo(log.created_at)}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                ) : null}
            </SlideoutMenu.Content>
        </>
    );
}
