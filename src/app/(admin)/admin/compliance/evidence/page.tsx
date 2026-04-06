"use client";

import { useState } from "react";
import { SearchMd, File06, AlertTriangle, Clock, CheckCircle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Table } from "@/components/application/table/table";

import { useAdminEvidence } from "@/hooks/use-admin";
import { cx } from "@/utils/cx";

function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminEvidencePage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const { data: result, isLoading } = useAdminEvidence(search, page);
    const items = result?.data ?? [];
    const meta = result?.meta as Record<string, unknown> | undefined;
    const kpis = (meta as Record<string, Record<string, number>> | undefined)?.kpis;
    const totalPages = (meta?.totalPages as number) ?? 1;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Evidence</h1>
                <p className="mt-1 text-sm text-tertiary">All evidence items uploaded across organizations.</p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                    { label: "Total Items", value: kpis?.total ?? "—", icon: File06, color: "text-fg-brand-primary" },
                    { label: "Expiring (30d)", value: kpis?.expiringSoon ?? "—", icon: Clock, color: "text-fg-warning-primary" },
                    { label: "Expired", value: kpis?.expired ?? "—", icon: AlertTriangle, color: "text-fg-error-primary" },
                    { label: "Current", value: ((kpis?.total ?? 0) - (kpis?.expired ?? 0) - (kpis?.expiringSoon ?? 0)) || "—", icon: CheckCircle, color: "text-fg-success-primary" },
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

            <div className="relative">
                <SearchMd className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
                <input
                    className="w-full rounded-lg border border-primary bg-primary py-2 pl-10 pr-3 text-sm text-primary placeholder:text-placeholder outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    placeholder="Search evidence..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <div className="rounded-xl border border-secondary bg-primary shadow-xs overflow-hidden">
                <Table aria-label="Evidence" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="title" label="Title" isRowHeader />
                        <Table.Head id="organization" label="Organization" />
                        <Table.Head id="type" label="Type" />
                        <Table.Head id="status" label="Status" />
                        <Table.Head id="uploaded" label="Uploaded" />
                        <Table.Head id="expiry" label="Expiry" />
                    </Table.Header>
                    <Table.Body items={isLoading ? [] : items}>
                        {(item) => (
                            <Table.Row id={item.id}>
                                <Table.Cell><span className="text-sm font-medium text-primary">{item.title}</span></Table.Cell>
                                <Table.Cell>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-secondary">{item.organizationName ?? "—"}</span>
                                        {item.serviceType && (
                                            <Badge size="sm" color={item.serviceType === "aesthetic_clinic" ? "purple" : "blue"}>
                                                {item.serviceType.replace(/_/g, " ")}
                                            </Badge>
                                        )}
                                    </div>
                                </Table.Cell>
                                <Table.Cell><span className="text-sm text-secondary">{item.type ?? "—"}</span></Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color={item.status === "CURRENT" ? "success" : item.status === "EXPIRED" ? "error" : "gray"}>
                                        {item.status ?? "—"}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell><span className="text-sm text-secondary">{formatDate(item.created_at)}</span></Table.Cell>
                                <Table.Cell>
                                    <span className={cx("text-sm", item.expiry_date && new Date(item.expiry_date) < new Date() ? "font-semibold text-error-primary" : "text-secondary")}>
                                        {formatDate(item.expiry_date)}
                                    </span>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
                {isLoading && <div className="py-12 text-center text-sm text-tertiary">Loading evidence...</div>}
                {!isLoading && items.length === 0 && <div className="py-12 text-center text-sm text-tertiary">No evidence found.</div>}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-tertiary">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-secondary px-3 py-1.5 text-sm font-medium text-secondary hover:bg-primary_hover disabled:opacity-40">Previous</button>
                        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-secondary px-3 py-1.5 text-sm font-medium text-secondary hover:bg-primary_hover disabled:opacity-40">Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}
