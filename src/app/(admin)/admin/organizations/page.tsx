"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Building07, SearchMd, ChevronLeft, ChevronRight } from "@untitledui/icons";
import { Table, TableCard } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { useAdminOrgs, useAdminOrgDetail } from "@/hooks/use-admin";
import { cx } from "@/utils/cx";
import { AdminOrgDetailPanel } from "./org-detail-panel";

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const TIER_COLORS: Record<string, "gray" | "brand" | "success"> = {
    free: "gray",
    professional: "brand",
    enterprise: "success",
};

export default function AdminOrganizationsPage() {
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const { data: orgsData, isLoading } = useAdminOrgs(search, page);
    const orgs = orgsData?.data ?? [];
    const meta = orgsData?.meta;

    const preselectedOrgId = searchParams.get("orgId");
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(preselectedOrgId);
    const panelOrgId = selectedOrgId ?? preselectedOrgId;
    const panelOpen = !!panelOrgId;

    const debounceRef = useMemo(() => ({ timer: null as ReturnType<typeof setTimeout> | null }), []);

    const handleSearch = (value: string) => {
        setSearch(value);
        if (debounceRef.timer) clearTimeout(debounceRef.timer);
        debounceRef.timer = setTimeout(() => setPage(1), 300);
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Organizations</h1>
                <p className="mt-1 text-sm text-tertiary">Browse and manage all tenant organizations.</p>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <SearchMd className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
                <input
                    type="text"
                    placeholder="Search organizations..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full rounded-lg border border-primary bg-primary py-2 pl-9 pr-3 text-sm text-primary placeholder:text-placeholder shadow-xs outline-none transition duration-100 focus:border-brand focus:ring-2 focus:ring-brand-100"
                />
            </div>

            {/* Table */}
            <TableCard.Root>
                <TableCard.Header
                    title="All Organizations"
                    badge={meta ? String(meta.total) : undefined}
                />
                <Table aria-label="Organizations" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="name" label="Organization" isRowHeader />
                        <Table.Head id="type" label="Service Type" />
                        <Table.Head id="plan" label="Plan" />
                        <Table.Head id="consentz" label="Consentz" />
                        <Table.Head id="created" label="Created" />
                        <Table.Head id="actions" label="" />
                    </Table.Header>
                    <Table.Body items={isLoading ? [] : orgs}>
                        {(org) => (
                            <Table.Row id={org.id}>
                                <Table.Cell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-brand-secondary text-xs font-semibold text-brand-primary">
                                            {org.name?.charAt(0).toUpperCase() ?? "?"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-primary">{org.name}</p>
                                            <p className="text-xs text-tertiary">{org.service_type?.replace(/_/g, " ") ?? "—"}</p>
                                        </div>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-secondary">{org.service_type?.replace(/_/g, " ") ?? "—"}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color={TIER_COLORS[org.subscription_tier ?? "free"] ?? "gray"}>
                                        {org.subscription_tier ?? "free"}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    {org.consentz_clinic_id ? (
                                        <Badge size="sm" color="success">Connected</Badge>
                                    ) : (
                                        <Badge size="sm" color="gray">Not linked</Badge>
                                    )}
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-tertiary">{formatDate(org.created_at)}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <button
                                        onClick={() => setSelectedOrgId(org.id)}
                                        className="text-sm font-medium text-brand-secondary transition duration-100 hover:text-brand-primary"
                                    >
                                        View
                                    </button>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>

                {isLoading && (
                    <div className="px-5 py-8 text-center text-sm text-tertiary">Loading organizations...</div>
                )}
                {!isLoading && orgs.length === 0 && (
                    <div className="flex flex-col items-center py-12 text-center">
                        <Building07 className="size-8 text-fg-quaternary" />
                        <p className="mt-3 text-sm font-medium text-primary">No organizations found</p>
                        <p className="mt-1 text-xs text-tertiary">Try adjusting your search.</p>
                    </div>
                )}
            </TableCard.Root>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-tertiary">
                        Page {meta.page} of {meta.totalPages} ({meta.total} total)
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            className={cx(
                                "flex items-center gap-1 rounded-lg border border-secondary px-3 py-1.5 text-sm font-medium shadow-xs transition duration-100",
                                page <= 1 ? "cursor-not-allowed text-disabled" : "text-secondary hover:bg-primary_hover",
                            )}
                        >
                            <ChevronLeft className="size-4" /> Previous
                        </button>
                        <button
                            disabled={!meta.hasMore}
                            onClick={() => setPage((p) => p + 1)}
                            className={cx(
                                "flex items-center gap-1 rounded-lg border border-secondary px-3 py-1.5 text-sm font-medium shadow-xs transition duration-100",
                                !meta.hasMore ? "cursor-not-allowed text-disabled" : "text-secondary hover:bg-primary_hover",
                            )}
                        >
                            Next <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Org Detail Slide Panel */}
            <SlideoutMenu isOpen={panelOpen} onOpenChange={(open) => { if (!open) setSelectedOrgId(null); }} isDismissable>
                <AdminOrgDetailPanel orgId={panelOrgId} onClose={() => setSelectedOrgId(null)} />
            </SlideoutMenu>
        </div>
    );
}
