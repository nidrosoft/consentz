"use client";

import { useState } from "react";
import { SearchMd } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Table } from "@/components/application/table/table";

import { useAdminPolicies } from "@/hooks/use-admin";

const STATUS_COLORS: Record<string, "gray" | "success" | "error" | "warning" | "brand"> = {
    PUBLISHED: "success", CURRENT: "success", DRAFT: "gray", EXPIRED: "error", UNDER_REVIEW: "warning", APPROVED: "brand",
};

function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminPoliciesPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const { data: result, isLoading } = useAdminPolicies(search, page, { status: statusFilter || undefined });
    const policies = result?.data ?? [];
    const meta = result?.meta;
    const totalPages = (meta?.totalPages as number) ?? 1;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Policies</h1>
                <p className="mt-1 text-sm text-tertiary">All policies across all organizations.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1">
                    <SearchMd className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
                    <input
                        className="w-full rounded-lg border border-primary bg-primary py-2 pl-10 pr-3 text-sm text-primary placeholder:text-placeholder outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        placeholder="Search policies..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <select
                    className="rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="APPROVED">Approved</option>
                    <option value="EXPIRED">Expired</option>
                </select>
            </div>

            <div className="rounded-xl border border-secondary bg-primary shadow-xs overflow-hidden">
                <Table aria-label="Policies" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="policyName" label="Policy Name" isRowHeader />
                        <Table.Head id="organization" label="Organization" />
                        <Table.Head id="domain" label="Domain" />
                        <Table.Head id="status" label="Status" />
                        <Table.Head id="lastUpdated" label="Last Updated" />
                        <Table.Head id="reviewDue" label="Review Due" />
                    </Table.Header>
                    <Table.Body items={isLoading ? [] : policies}>
                        {(policy) => (
                            <Table.Row id={policy.id}>
                                <Table.Cell><span className="text-sm font-medium text-primary">{policy.title}</span></Table.Cell>
                                <Table.Cell>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-secondary">{policy.organizationName ?? "—"}</span>
                                        {policy.serviceType && (
                                            <Badge size="sm" color={policy.serviceType === "aesthetic_clinic" ? "purple" : "blue"}>
                                                {policy.serviceType.replace(/_/g, " ")}
                                            </Badge>
                                        )}
                                    </div>
                                </Table.Cell>
                                <Table.Cell><span className="text-sm text-secondary">{policy.cqc_domain ?? "—"}</span></Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color={STATUS_COLORS[policy.status ?? ""] ?? "gray"}>
                                        {(policy.status ?? "—").replace(/_/g, " ")}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell><span className="text-sm text-secondary">{formatDate(policy.updated_at)}</span></Table.Cell>
                                <Table.Cell><span className="text-sm text-secondary">{formatDate(policy.review_date)}</span></Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
                {isLoading && <div className="py-12 text-center text-sm text-tertiary">Loading policies...</div>}
                {!isLoading && policies.length === 0 && <div className="py-12 text-center text-sm text-tertiary">No policies found.</div>}
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
