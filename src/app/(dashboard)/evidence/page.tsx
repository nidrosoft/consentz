"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SearchLg, Upload01, Grid01, List, File06, ArrowsUp, FilterLines, XClose } from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Table, TableCard } from "@/components/application/table/table";
import { cx } from "@/utils/cx";
import { useEvidence } from "@/hooks/use-evidence";
import { toEvidence } from "@/lib/evidence-mapper";
import { DomainBadgeList } from "@/components/shared/domain-badge";
import type { EvidenceType, EvidenceStatus, DomainSlug } from "@/types";

const STATUS_BADGE: Record<string, "success" | "warning" | "error" | "gray"> = {
    VALID: "success", EXPIRING_SOON: "warning", EXPIRED: "error", PENDING_REVIEW: "gray",
};

const EVIDENCE_TYPES: EvidenceType[] = ["POLICY", "CERTIFICATE", "TRAINING_RECORD", "AUDIT_REPORT", "RISK_ASSESSMENT", "MEETING_MINUTES", "PHOTO", "OTHER"];
const EVIDENCE_STATUSES: EvidenceStatus[] = ["VALID", "EXPIRING_SOON", "EXPIRED"];
const DOMAINS: DomainSlug[] = ["safe", "effective", "caring", "responsive", "well-led"];

export default function EvidencePage() {
    const router = useRouter();
    const [view, setView] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<EvidenceStatus | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<EvidenceType | null>(null);
    const [domainFilter, setDomainFilter] = useState<DomainSlug | null>(null);
    const [sortBy, setSortBy] = useState<"date" | "name">("date");
    const [showFilters, setShowFilters] = useState(false);

    const { data, isLoading, error } = useEvidence({
        search: search || undefined,
        status: statusFilter ?? undefined,
        category: categoryFilter ?? undefined,
        domain: domainFilter ?? undefined,
        page: 1,
        pageSize: 100,
    });

    const evidenceList = (data?.data ?? []).map((item) => toEvidence(item as unknown as Record<string, unknown>));
    const filtered = useMemo(() => {
        let result = [...evidenceList];
        if (sortBy === "date") result.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        else result.sort((a, b) => a.name.localeCompare(b.name));
        return result;
    }, [evidenceList, sortBy]);

    const hasFilters = !!(statusFilter || categoryFilter || domainFilter);
    const activeFilterCount = [statusFilter, categoryFilter, domainFilter].filter(Boolean).length;

    function clearAllFilters() {
        setStatusFilter(null);
        setCategoryFilter(null);
        setDomainFilter(null);
    }

    if (error) {
        return (
            <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-error bg-error-secondary p-6">
                    <p className="text-sm font-medium text-error-primary">Failed to load evidence</p>
                    <p className="mt-1 text-sm text-tertiary">{error instanceof Error ? error.message : "An error occurred"}</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary" />
                        <div className="mt-2 h-4 w-24 animate-pulse rounded bg-secondary" />
                    </div>
                </div>
                <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-secondary" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-4">
                            <div className="size-10 animate-pulse rounded-lg bg-secondary" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                                <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-5 w-16 animate-pulse rounded-full bg-secondary" />
                                <div className="h-5 w-20 animate-pulse rounded-full bg-secondary" />
                            </div>
                            <div className="h-3 w-full animate-pulse rounded bg-secondary" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const documentCount = data?.meta?.total ?? evidenceList.length;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Evidence Library</h1>
                    <p className="mt-1 text-sm text-tertiary">{documentCount} documents</p>
                </div>
                <Button color="primary" size="lg" iconLeading={Upload01} onClick={() => router.push("/evidence/upload")}>Upload Evidence</Button>
            </div>

            {/* Search + Filter Toggle + Sort + View toggle */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                    <Input size="sm" placeholder="Search evidence..." icon={SearchLg} value={search} onChange={(v) => setSearch(v)} />
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
                    <button onClick={() => setSortBy(sortBy === "date" ? "name" : "date")} className="flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-1.5 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                        <ArrowsUp className="size-3.5" />
                        {sortBy === "date" ? "Date" : "Name"}
                    </button>
                    {hasFilters && (
                        <Button color="link-gray" size="sm" onClick={clearAllFilters}>
                            Clear all
                        </Button>
                    )}
                    <div className="flex gap-1 rounded-lg border border-secondary bg-secondary p-0.5">
                        <button onClick={() => setView("grid")} className={cx("rounded-md p-1.5 transition duration-100", view === "grid" ? "bg-primary text-secondary shadow-xs" : "text-tertiary hover:text-secondary")}>
                            <Grid01 className="size-4" />
                        </button>
                        <button onClick={() => setView("list")} className={cx("rounded-md p-1.5 transition duration-100", view === "list" ? "bg-primary text-secondary shadow-xs" : "text-tertiary hover:text-secondary")}>
                            <List className="size-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
                <div className="rounded-xl border border-secondary bg-primary p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Select
                            label="Status"
                            placeholder="All statuses"
                            size="sm"
                            selectedKey={statusFilter}
                            onSelectionChange={(key) => setStatusFilter(key === "" ? null : (key as EvidenceStatus))}
                            items={[{ id: "" }, ...EVIDENCE_STATUSES.map((s) => ({ id: s }))]}
                        >
                            {(item) => <Select.Item id={item.id}>{item.id ? item.id.replace("_", " ") : "All statuses"}</Select.Item>}
                        </Select>

                        <Select
                            label="Category"
                            placeholder="All categories"
                            size="sm"
                            selectedKey={categoryFilter}
                            onSelectionChange={(key) => setCategoryFilter(key === "" ? null : (key as EvidenceType))}
                            items={[{ id: "" }, ...EVIDENCE_TYPES.map((t) => ({ id: t }))]}
                        >
                            {(item) => <Select.Item id={item.id}>{item.id ? item.id.replace("_", " ") : "All categories"}</Select.Item>}
                        </Select>

                        <Select
                            label="CQC Domain"
                            placeholder="All domains"
                            size="sm"
                            selectedKey={domainFilter}
                            onSelectionChange={(key) => setDomainFilter(key === "" ? null : (key as DomainSlug))}
                            items={[{ id: "" }, ...DOMAINS.map((d) => ({ id: d }))]}
                        >
                            {(item) => <Select.Item id={item.id} className="capitalize">{item.id || "All domains"}</Select.Item>}
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
                            <span className="text-quaternary">Status:</span> {statusFilter.replace("_", " ")}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                    {categoryFilter && (
                        <button onClick={() => setCategoryFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">Category:</span> {categoryFilter.replace("_", " ")}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                    {domainFilter && (
                        <button onClick={() => setDomainFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium capitalize text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">Domain:</span> {domainFilter}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                </div>
            )}

            {/* Grid view */}
            {view === "grid" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filtered.map((ev) => (
                        <button
                            key={ev.id}
                            onClick={() => router.push(`/evidence/${ev.id}`)}
                            className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-4 text-left transition duration-100 hover:border-brand-300 hover:shadow-xs"
                        >
                            <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                                <File06 className="size-5 text-fg-quaternary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-primary">{ev.name}</p>
                                <p className="mt-0.5 text-xs text-tertiary">{ev.type.replace("_", " ")}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                                <Badge size="sm" color={STATUS_BADGE[ev.status]} type="pill-color">
                                    {ev.status.replace("_", " ")}
                                </Badge>
                                <DomainBadgeList domains={ev.linkedDomains} size="sm" max={2} />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-tertiary">
                                <span>{ev.linkedKloes.join(", ")}</span>
                                <span>&middot;</span>
                                <span>{ev.uploadedBy}</span>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <TableCard.Root>
                    <TableCard.Header
                        title="Evidence Library"
                        badge={String(filtered.length)}
                        description="All uploaded evidence documents and certificates."
                    />
                    <Table aria-label="Evidence documents" selectionMode="none">
                        <Table.Header>
                            <Table.Head id="name" label="Name" isRowHeader />
                            <Table.Head id="type" label="Category" />
                            <Table.Head id="domains" label="Domain" />
                            <Table.Head id="kloes" label="KLOEs" />
                            <Table.Head id="status" label="Status" />
                            <Table.Head id="uploaded" label="Uploaded" />
                        </Table.Header>
                        <Table.Body items={filtered}>
                            {(ev) => (
                                <Table.Row id={ev.id} className="cursor-pointer" onAction={() => router.push(`/evidence/${ev.id}`)}>
                                    <Table.Cell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                                <File06 className="size-4 text-fg-quaternary" />
                                            </div>
                                            <p className="text-sm font-medium text-primary whitespace-nowrap">{ev.name}</p>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge size="sm" color="gray" type="modern">{ev.type.replace("_", " ")}</Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <DomainBadgeList domains={ev.linkedDomains} size="sm" showIcon={false} />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-sm text-tertiary">{ev.linkedKloes.join(", ")}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <BadgeWithDot size="sm" color={STATUS_BADGE[ev.status]}>
                                            {ev.status.replace("_", " ")}
                                        </BadgeWithDot>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-sm text-tertiary whitespace-nowrap">{ev.uploadedAt}</span>
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>
                </TableCard.Root>
            )}
        </div>
    );
}
