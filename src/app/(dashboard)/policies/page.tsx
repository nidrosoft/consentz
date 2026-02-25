"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, SearchLg, FileCheck02, ArrowsUp, FilterLines, XClose } from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Table, TableCard } from "@/components/application/table/table";
import { cx } from "@/utils/cx";
import { mockPolicies } from "@/lib/mock-data";
import type { PolicyStatus } from "@/types";

const STATUS_BADGE: Record<string, "success" | "warning" | "error" | "gray" | "brand"> = {
    PUBLISHED: "success", APPROVED: "brand", REVIEW: "warning", DRAFT: "gray", ARCHIVED: "error",
};

const CATEGORIES = [...new Set(mockPolicies.map((p) => p.category))];
const STATUSES: PolicyStatus[] = ["PUBLISHED", "APPROVED", "REVIEW", "DRAFT"];

export default function PoliciesPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<PolicyStatus | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<"updated" | "review">("updated");
    const [showFilters, setShowFilters] = useState(false);

    const filtered = useMemo(() => {
        let result = mockPolicies.filter((p) => {
            if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
            if (statusFilter && p.status !== statusFilter) return false;
            if (categoryFilter && p.category !== categoryFilter) return false;
            return true;
        });
        if (sortBy === "updated") result = [...result].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        else result = [...result].sort((a, b) => {
            if (!a.nextReviewDate) return 1;
            if (!b.nextReviewDate) return -1;
            return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
        });
        return result;
    }, [search, statusFilter, categoryFilter, sortBy]);

    const hasFilters = !!(statusFilter || categoryFilter);
    const activeFilterCount = [statusFilter, categoryFilter].filter(Boolean).length;

    function clearAllFilters() {
        setStatusFilter(null);
        setCategoryFilter(null);
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Policies</h1>
                    <p className="mt-1 text-sm text-tertiary">{mockPolicies.length} policies</p>
                </div>
                <div className="flex gap-2">
                    <Button color="secondary" size="lg" onClick={() => router.push("/policies/templates")}>Templates</Button>
                    <Button color="primary" size="lg" iconLeading={Plus} onClick={() => router.push("/policies/create")}>Create Policy</Button>
                </div>
            </div>

            {/* Search + Filter Toggle + Sort */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                    <Input size="sm" placeholder="Search policies..." icon={SearchLg} value={search} onChange={(v) => setSearch(v)} />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        color={showFilters || hasFilters ? "secondary" : "tertiary"}
                        size="sm"
                        iconLeading={FilterLines}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
                    </Button>
                    <button onClick={() => setSortBy(sortBy === "updated" ? "review" : "updated")} className="flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-1.5 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                        <ArrowsUp className="size-3.5" />
                        {sortBy === "updated" ? "Last updated" : "Review date"}
                    </button>
                    {hasFilters && (
                        <Button color="link-gray" size="sm" onClick={clearAllFilters}>
                            Clear all
                        </Button>
                    )}
                </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
                <div className="rounded-xl border border-secondary bg-primary p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Select
                            label="Status"
                            placeholder="All statuses"
                            size="sm"
                            selectedKey={statusFilter}
                            onSelectionChange={(key) => setStatusFilter(key === "" ? null : (key as PolicyStatus))}
                            items={[{ id: "" }, ...STATUSES.map((s) => ({ id: s }))]}
                        >
                            {(item) => <Select.Item id={item.id}>{item.id || "All statuses"}</Select.Item>}
                        </Select>

                        <Select
                            label="Category"
                            placeholder="All categories"
                            size="sm"
                            selectedKey={categoryFilter}
                            onSelectionChange={(key) => setCategoryFilter(key === "" ? null : String(key))}
                            items={[{ id: "" }, ...CATEGORIES.map((c) => ({ id: c }))]}
                        >
                            {(item) => <Select.Item id={item.id}>{item.id || "All categories"}</Select.Item>}
                        </Select>
                    </div>
                </div>
            )}

            {/* Active filter chips */}
            {hasFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-tertiary">Showing:</span>
                    {statusFilter && (
                        <button onClick={() => setStatusFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">Status:</span> {statusFilter}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                    {categoryFilter && (
                        <button onClick={() => setCategoryFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">Category:</span> {categoryFilter}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                </div>
            )}

            {/* Table */}
            <TableCard.Root>
                <TableCard.Header title="Policy Library" badge={String(filtered.length)} description="Click any row to view or edit the policy." />
                <Table aria-label="Policies" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="title" label="Policy" isRowHeader />
                        <Table.Head id="category" label="Category" />
                        <Table.Head id="version" label="Version" />
                        <Table.Head id="author" label="Author" />
                        <Table.Head id="status" label="Status" />
                        <Table.Head id="updated" label="Last Updated" />
                        <Table.Head id="review" label="Next Review" />
                    </Table.Header>
                    <Table.Body items={filtered}>
                        {(policy) => (
                            <Table.Row id={policy.id} className="cursor-pointer" onAction={() => router.push(`/policies/${policy.id}`)}>
                                <Table.Cell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                            <FileCheck02 className="size-4 text-fg-quaternary" />
                                        </div>
                                        <p className="text-sm font-medium text-primary whitespace-nowrap">{policy.title}</p>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color="gray" type="modern">{policy.category}</Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="font-mono text-sm text-tertiary">{policy.version}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-tertiary whitespace-nowrap">{policy.createdBy}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <BadgeWithDot size="sm" color={STATUS_BADGE[policy.status]}>{policy.status}</BadgeWithDot>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-tertiary whitespace-nowrap">{policy.updatedAt}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-tertiary whitespace-nowrap">{policy.nextReviewDate || "—"}</span>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </TableCard.Root>
        </div>
    );
}
