"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, SearchLg, AlertTriangle, ArrowsUp, FilterLines, XClose } from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Table, TableCard } from "@/components/application/table/table";
import { useIncidents } from "@/hooks/use-incidents";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import type { Incident, IncidentSeverity, IncidentStatus, IncidentType } from "@/types";

const SEVERITY_BADGE: Record<string, "error" | "warning" | "brand" | "gray"> = {
    CRITICAL: "error", MAJOR: "warning", MINOR: "brand", NEAR_MISS: "gray",
};
const STATUS_BADGE: Record<string, "error" | "warning" | "success" | "gray"> = {
    REPORTED: "warning", INVESTIGATING: "error", RESOLVED: "success", CLOSED: "gray",
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const SEVERITIES: IncidentSeverity[] = ["CRITICAL", "MAJOR", "MINOR", "NEAR_MISS"];
const STATUSES: IncidentStatus[] = ["REPORTED", "INVESTIGATING", "RESOLVED", "CLOSED"];
const INCIDENT_TYPES: IncidentType[] = ["PREMISES", "PATIENT_COMPLICATION"];

const TYPE_LABELS: Record<IncidentType, string> = {
    PREMISES: "Premises",
    PATIENT_COMPLICATION: "Patient Complication",
};

const TYPE_BADGE: Record<IncidentType, "blue" | "pink"> = {
    PREMISES: "blue",
    PATIENT_COMPLICATION: "pink",
};

export default function IncidentsPage() {
    const router = useRouter();
    const { data, isLoading, error, refetch } = useIncidents();
    const incidents = (data?.data ?? []) as Incident[];
    const categories = useMemo(() => [...new Set(incidents.map((i) => i.category))], [incidents]);

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | null>(null);
    const [statusFilter, setStatusFilter] = useState<IncidentStatus | null>(null);
    const [typeFilter, setTypeFilter] = useState<IncidentType | null>(null);
    const [sortBy, setSortBy] = useState<"date" | "severity">("date");
    const [showFilters, setShowFilters] = useState(false);

    const filtered = useMemo(() => {
        let result = incidents.filter((inc) => {
            if (search && !inc.title.toLowerCase().includes(search.toLowerCase()) && !inc.description.toLowerCase().includes(search.toLowerCase())) return false;
            if (categoryFilter && inc.category !== categoryFilter) return false;
            if (severityFilter && inc.severity !== severityFilter) return false;
            if (statusFilter && inc.status !== statusFilter) return false;
            if (typeFilter && inc.incidentType !== typeFilter) return false;
            return true;
        });
        const sevOrder: Record<string, number> = { CRITICAL: 0, MAJOR: 1, MINOR: 2, NEAR_MISS: 3 };
        if (sortBy === "date") result = [...result].sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
        else result = [...result].sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
        return result;
    }, [incidents, search, categoryFilter, severityFilter, statusFilter, typeFilter, sortBy]);

    const hasFilters = !!(categoryFilter || severityFilter || statusFilter || typeFilter);
    const activeFilterCount = [categoryFilter, severityFilter, statusFilter, typeFilter].filter(Boolean).length;

    function clearAllFilters() {
        setCategoryFilter(null);
        setSeverityFilter(null);
        setStatusFilter(null);
        setTypeFilter(null);
    }

    if (isLoading) return <PageSkeleton variant="list" rows={8} />;

    if (error) {
        return (
            <div className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-6">
                <p className="text-sm text-error-primary">Failed to load incidents.</p>
                <Button color="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Incident Log</h1>
                    <p className="mt-1 text-sm text-tertiary">{incidents.length} incidents recorded</p>
                </div>
                <Button color="primary" size="lg" iconLeading={Plus} onClick={() => router.push("/incidents/report")}>Report Incident</Button>
            </div>

            {/* Search + Filter Toggle + Sort */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                    <Input size="sm" placeholder="Search incidents..." icon={SearchLg} value={search} onChange={(v) => setSearch(v)} />
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
                    <button onClick={() => setSortBy(sortBy === "date" ? "severity" : "date")} className="flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-1.5 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                        <ArrowsUp className="size-3.5" />
                        {sortBy === "date" ? "Date" : "Severity"}
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

                        <Select
                            label="Severity"
                            placeholder="All severities"
                            size="sm"
                            selectedKey={severityFilter}
                            onSelectionChange={(key) => setSeverityFilter(key === "" ? null : (key as IncidentSeverity))}
                            items={[{ id: "" }, ...SEVERITIES.map((s) => ({ id: s }))]}
                        >
                            {(item) => <Select.Item id={item.id}>{item.id ? item.id.replace("_", " ") : "All severities"}</Select.Item>}
                        </Select>

                        <Select
                            label="Status"
                            placeholder="All statuses"
                            size="sm"
                            selectedKey={statusFilter}
                            onSelectionChange={(key) => setStatusFilter(key === "" ? null : (key as IncidentStatus))}
                            items={[{ id: "" }, ...STATUSES.map((s) => ({ id: s }))]}
                        >
                            {(item) => <Select.Item id={item.id}>{item.id || "All statuses"}</Select.Item>}
                        </Select>

                        <Select
                            label="Incident Type"
                            placeholder="All types"
                            size="sm"
                            selectedKey={typeFilter}
                            onSelectionChange={(key) => setTypeFilter(key === "" ? null : (key as IncidentType))}
                            items={[{ id: "" }, ...INCIDENT_TYPES.map((t) => ({ id: t }))]}
                        >
                            {(item) => <Select.Item id={item.id}>{item.id ? TYPE_LABELS[item.id as IncidentType] : "All types"}</Select.Item>}
                        </Select>
                    </div>
                </div>
            )}

            {/* Active filter chips */}
            {hasFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-tertiary">Showing:</span>
                    {categoryFilter && (
                        <button onClick={() => setCategoryFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">Category:</span> {categoryFilter}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                    {severityFilter && (
                        <button onClick={() => setSeverityFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">Severity:</span> {severityFilter.replace("_", " ")}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                    {statusFilter && (
                        <button onClick={() => setStatusFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">Status:</span> {statusFilter}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                    {typeFilter && (
                        <button onClick={() => setTypeFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">Type:</span> {TYPE_LABELS[typeFilter]}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                </div>
            )}

            {/* Table */}
            <TableCard.Root>
                <TableCard.Header title="Incidents" badge={String(filtered.length)} description="Click any row to view incident details." />
                <Table aria-label="Incidents" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="title" label="Incident" isRowHeader />
                        <Table.Head id="type" label="Type" />
                        <Table.Head id="category" label="Category" />
                        <Table.Head id="severity" label="Severity" />
                        <Table.Head id="status" label="Status" />
                        <Table.Head id="reporter" label="Reported by" />
                        <Table.Head id="date" label="Date" />
                    </Table.Header>
                    <Table.Body items={filtered}>
                        {(inc) => (
                            <Table.Row id={inc.id} className="cursor-pointer" onAction={() => router.push(`/incidents/${inc.id}`)}>
                                <Table.Cell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-error-primary">
                                            <AlertTriangle className="size-4 text-error-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-primary whitespace-nowrap">{inc.title}</p>
                                            <p className="text-xs text-tertiary line-clamp-1">{inc.description}</p>
                                        </div>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color={TYPE_BADGE[inc.incidentType]} type="pill-color">{TYPE_LABELS[inc.incidentType]}</Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color="gray" type="modern">{inc.category}</Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <BadgeWithDot size="sm" color={SEVERITY_BADGE[inc.severity]}>{inc.severity.replace("_", " ")}</BadgeWithDot>
                                </Table.Cell>
                                <Table.Cell>
                                    <BadgeWithDot size="sm" color={STATUS_BADGE[inc.status]}>{inc.status}</BadgeWithDot>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-tertiary whitespace-nowrap">{inc.reportedBy}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-tertiary whitespace-nowrap">{formatDate(inc.reportedAt)}</span>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </TableCard.Root>
        </div>
    );
}
