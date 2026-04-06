"use client";

import { RefreshCw05, CheckCircle, AlertTriangle, XCircle, Wifi } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Table } from "@/components/application/table/table";

import { useAdminSync } from "@/hooks/use-admin";
import { cx } from "@/utils/cx";

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function syncStatusBadge(status: string) {
    const map: Record<string, { color: "success" | "error" | "warning" | "brand" | "gray"; label: string }> = {
        success: { color: "success", label: "Healthy" },
        failed: { color: "error", label: "Failed" },
        error: { color: "error", label: "Error" },
        in_progress: { color: "brand", label: "Syncing" },
        pending: { color: "warning", label: "Pending" },
        never_synced: { color: "gray", label: "Never Synced" },
    };
    const s = map[status] ?? { color: "gray" as const, label: status };
    return <Badge size="sm" color={s.color}>{s.label}</Badge>;
}

export default function AdminSyncPage() {
    const { data, isLoading } = useAdminSync();
    const s = data?.summary;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Consentz Sync</h1>
                <p className="mt-1 text-sm text-tertiary">Monitor data sync between Consentz and the platform.</p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                    { label: "Connected Orgs", value: s?.connected ?? "—", icon: Wifi, color: "text-fg-brand-primary" },
                    { label: "Healthy", value: s?.healthy ?? "—", icon: CheckCircle, color: "text-fg-success-primary" },
                    { label: "Stale (>12h)", value: s?.stale ?? "—", icon: AlertTriangle, color: "text-fg-warning-primary" },
                    { label: "Failed", value: s?.failed ?? "—", icon: XCircle, color: "text-fg-error-primary" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4 shadow-xs">
                        <Icon className={cx("size-5", color)} />
                        <div>
                            <p className="text-xs text-tertiary">{label}</p>
                            <p className="text-lg font-semibold text-primary">{isLoading ? "—" : value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sync jobs table */}
            <div className="rounded-xl border border-secondary bg-primary shadow-xs overflow-hidden">
                <Table aria-label="Sync Jobs" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="organization" label="Organization" isRowHeader />
                        <Table.Head id="serviceType" label="Service Type" />
                        <Table.Head id="status" label="Status" />
                        <Table.Head id="recordsSynced" label="Records Synced" />
                        <Table.Head id="lastSync" label="Last Sync" />
                        <Table.Head id="error" label="Error" />
                    </Table.Header>
                    <Table.Body items={isLoading ? [] : (data?.syncJobs ?? [])}>
                        {(job) => (
                            <Table.Row id={job.organizationId}>
                                <Table.Cell><span className="text-sm font-medium text-primary">{job.organizationName}</span></Table.Cell>
                                <Table.Cell>
                                    {job.serviceType ? (
                                        <Badge size="sm" color={job.serviceType === "aesthetic_clinic" ? "purple" : "blue"}>
                                            {job.serviceType.replace(/_/g, " ")}
                                        </Badge>
                                    ) : "—"}
                                </Table.Cell>
                                <Table.Cell>{syncStatusBadge(job.status)}</Table.Cell>
                                <Table.Cell><span className="text-sm text-secondary">{job.recordsSynced}</span></Table.Cell>
                                <Table.Cell><span className="text-sm text-secondary">{job.lastSync ? timeAgo(job.lastSync) : "Never"}</span></Table.Cell>
                                <Table.Cell>
                                    {job.error ? (
                                        <span className="max-w-[200px] truncate text-xs text-error-primary" title={job.error}>{job.error}</span>
                                    ) : (
                                        <span className="text-sm text-tertiary">—</span>
                                    )}
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
                {isLoading && <div className="py-12 text-center text-sm text-tertiary">Loading sync data...</div>}
                {!isLoading && (data?.syncJobs.length ?? 0) === 0 && (
                    <div className="py-12 text-center text-sm text-tertiary">No Consentz connections found.</div>
                )}
            </div>
        </div>
    );
}
