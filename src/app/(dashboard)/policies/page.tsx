"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, SearchLg, FileCheck02, ArrowsUp, FilterLines, XClose, File06, Stars01 } from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Table, TableCard } from "@/components/application/table/table";
import { usePolicies } from "@/hooks/use-policies";
import type { PolicyStatus } from "@/types";

const STATUS_BADGE: Record<string, "success" | "warning" | "error" | "gray" | "brand"> = {
    PUBLISHED: "success", APPROVED: "brand", REVIEW: "warning", DRAFT: "gray", ARCHIVED: "error",
    ACTIVE: "success", UNDER_REVIEW: "warning",
};

const STATUS_LABEL: Record<string, string> = {
    ACTIVE: "Active", UNDER_REVIEW: "Under Review", DRAFT: "Draft", ARCHIVED: "Archived",
};

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    try {
        return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
        return "—";
    }
}

const STATUSES: PolicyStatus[] = ["PUBLISHED", "APPROVED", "REVIEW", "DRAFT"];

type ApiPolicy = {
    id: string;
    title: string;
    status: string;
    version?: string;
    category?: string;
    domains?: string[];
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    last_updated?: string;
    is_ai_generated?: boolean;
    review_date?: string;
};

function toDisplayPolicy(p: ApiPolicy) {
    const category = p.category ?? p.domains?.[0] ?? "—";
    return {
        ...p,
        category,
        version: p.version ?? "1.0",
        createdBy: p.created_by ?? "—",
        updatedAt: p.updated_at ?? p.last_updated ?? "",
        reviewDate: p.review_date ?? null,
        isAiGenerated: p.is_ai_generated ?? false,
    };
}

export default function PoliciesPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<PolicyStatus | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<"updated" | "review">("updated");
    const [showFilters, setShowFilters] = useState(false);

    const { data, isLoading, error } = usePolicies({
        search: search || undefined,
        status: statusFilter ?? undefined,
        category: categoryFilter ?? undefined,
        pageSize: 100,
    });

    const policies = (data?.success && data?.data ? data.data : []) as ApiPolicy[];
    const displayPolicies = policies.map(toDisplayPolicy);
    const categories = useMemo(() => [...new Set(displayPolicies.map((p) => p.category).filter(Boolean))], [displayPolicies]);

    const statusMatches = (apiStatus: string, filter: PolicyStatus) => {
        if (filter === "REVIEW") return apiStatus === "UNDER_REVIEW";
        if (filter === "APPROVED" || filter === "PUBLISHED") return apiStatus === "ACTIVE";
        return apiStatus === filter;
    };

    const filtered = useMemo(() => {
        let result = displayPolicies.filter((p) => {
            if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
            if (statusFilter && !statusMatches(p.status, statusFilter)) return false;
            if (categoryFilter && p.category !== categoryFilter) return false;
            return true;
        });
        if (sortBy === "updated") result = [...result].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        else result = [...result].sort((a, b) => {
            if (!a.reviewDate) return 1;
            if (!b.reviewDate) return -1;
            return new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime();
        });
        return result;
    }, [displayPolicies, search, statusFilter, categoryFilter, sortBy]);

    const hasFilters = !!(statusFilter || categoryFilter);
    const activeFilterCount = [statusFilter, categoryFilter].filter(Boolean).length;

    function clearAllFilters() {
        setStatusFilter(null);
        setCategoryFilter(null);
    }

    if (error) {
        return (
            <div className="flex flex-col gap-4 sm:gap-6">
                <h1 className="text-display-xs font-semibold text-primary">Policies</h1>
                <div className="rounded-xl border border-error bg-error-secondary/20 p-6">
                    <p className="text-sm font-medium text-error-primary">Failed to load policies</p>
                    <p className="mt-1 text-sm text-tertiary">{String(error)}</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 sm:gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="h-8 w-32 animate-pulse rounded bg-secondary" />
                        <div className="mt-2 h-4 w-24 animate-pulse rounded bg-secondary" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="h-10 w-24 animate-pulse rounded-lg bg-secondary" />
                        <div className="h-10 w-32 animate-pulse rounded-lg bg-secondary" />
                    </div>
                </div>
                <div className="h-10 w-full animate-pulse rounded-lg bg-secondary" />
                <div className="rounded-xl border border-secondary bg-primary p-6">
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-4">
                                <div className="h-10 w-10 animate-pulse rounded-lg bg-secondary" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-48 animate-pulse rounded bg-secondary" />
                                    <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Policies</h1>
                    <p className="mt-1 text-sm text-tertiary">{filtered.length} policies</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button color="secondary" size="md" onClick={() => router.push("/policies/templates")}>Templates</Button>
                    <Button color="primary" size="md" iconLeading={Plus} onClick={() => router.push("/policies/create")}>Create Policy</Button>
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
                            items={[{ id: "" }, ...categories.map((c) => ({ id: c }))]}
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

            {/* Empty state */}
            {filtered.length === 0 && !isLoading && (
                <div className="flex flex-1 items-center justify-center py-16">
                    <EmptyState size="lg">
                        <EmptyState.Header>
                            <EmptyState.FeaturedIcon icon={File06} color="brand" theme="light" />
                        </EmptyState.Header>
                        <EmptyState.Content>
                            <EmptyState.Title>No policies created yet</EmptyState.Title>
                            <EmptyState.Description>
                                Create and manage your organisation's policies to demonstrate CQC compliance. You can start from a template or create from scratch.
                            </EmptyState.Description>
                        </EmptyState.Content>
                        <EmptyState.Footer>
                            <Button color="primary" size="md" iconLeading={Plus} onClick={() => router.push("/policies/create")}>
                                Create Policy
                            </Button>
                        </EmptyState.Footer>
                    </EmptyState>
                </div>
            )}

            {/* Table */}
            {filtered.length > 0 && <TableCard.Root>
                <TableCard.Header title="Policy Library" badge={String(filtered.length)} description="Click any row to view or edit the policy." />
                <Table aria-label="Policies" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="title" label="Policy" isRowHeader />
                        <Table.Head id="category" label="Category" className="hidden sm:table-cell" />
                        <Table.Head id="version" label="Version" className="hidden sm:table-cell" />
                        <Table.Head id="author" label="Author" className="hidden sm:table-cell" />
                        <Table.Head id="status" label="Status" />
                        <Table.Head id="updated" label="Last Updated" />
                        <Table.Head id="review" label="Next Review" className="hidden sm:table-cell" />
                    </Table.Header>
                    <Table.Body items={filtered}>
                        {(policy) => (
                            <Table.Row id={policy.id} className="cursor-pointer" onAction={() => router.push(`/policies/${policy.id}`)}>
                                <Table.Cell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                            <FileCheck02 className="size-4 text-fg-quaternary" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-primary">{policy.title}</p>
                                            {policy.isAiGenerated && <Stars01 className="size-3.5 text-fg-brand-secondary" aria-label="AI generated" />}
                                        </div>
                                    </div>
                                </Table.Cell>
                                <Table.Cell className="hidden sm:table-cell">
                                    <Badge size="sm" color="gray" type="modern">{policy.category}</Badge>
                                </Table.Cell>
                                <Table.Cell className="hidden sm:table-cell">
                                    <span className="font-mono text-sm text-tertiary">{policy.version}</span>
                                </Table.Cell>
                                <Table.Cell className="hidden sm:table-cell">
                                    <span className="text-sm text-tertiary whitespace-nowrap">{policy.createdBy}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <BadgeWithDot size="sm" color={STATUS_BADGE[policy.status] ?? "gray"}>{STATUS_LABEL[policy.status] ?? policy.status}</BadgeWithDot>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-tertiary whitespace-nowrap">{formatDate(policy.updatedAt)}</span>
                                </Table.Cell>
                                <Table.Cell className="hidden sm:table-cell">
                                    <span className="text-sm text-tertiary whitespace-nowrap">{formatDate(policy.reviewDate)}</span>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </TableCard.Root>}
        </div>
    );
}
