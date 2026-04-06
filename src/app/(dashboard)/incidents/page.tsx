"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, SearchLg, AlertTriangle, AlertCircle, ArrowsUp, FilterLines, XClose, Calendar, User01, ShieldTick, Flag06, Tag01, BarChartSquare02, File06, Clock } from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Table, TableCard } from "@/components/application/table/table";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { useIncidents, useIncidentDetail } from "@/hooks/use-incidents";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { cx } from "@/utils/cx";
import type { Incident, IncidentSeverity, IncidentStatus, IncidentType } from "@/types";

const SEVERITY_BADGE: Record<string, "error" | "warning" | "brand" | "gray"> = {
    CRITICAL: "error", MAJOR: "warning", HIGH: "warning", MINOR: "brand", MEDIUM: "brand", NEAR_MISS: "gray", LOW: "gray",
};
const STATUS_BADGE: Record<string, "error" | "warning" | "success" | "gray"> = {
    REPORTED: "warning", OPEN: "warning", INVESTIGATING: "error", ACTIONED: "error", RESOLVED: "success", CLOSED: "gray",
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const SEVERITIES: IncidentSeverity[] = ["CRITICAL", "MAJOR", "MINOR", "NEAR_MISS"];
const STATUSES: IncidentStatus[] = ["REPORTED", "INVESTIGATING", "RESOLVED", "CLOSED"];
const INCIDENT_TYPES: IncidentType[] = ["PREMISES", "PATIENT_COMPLICATION"];

const TYPE_LABELS: Record<string, string> = {
    PREMISES: "Premises",
    PATIENT_COMPLICATION: "Patient Complication",
    INFECTION: "Infection",
    COMPLICATION: "Complication",
    PREMISES_INCIDENT: "Premises",
    SAFEGUARDING: "Safeguarding",
    MEDICATION_ERROR: "Medication Error",
    DATA_BREACH: "Data Breach",
    COMPLAINT: "Complaint",
    NEAR_MISS: "Near Miss",
    OTHER: "Other",
};

const TYPE_BADGE: Record<string, "blue" | "pink" | "orange" | "purple" | "gray"> = {
    PREMISES: "blue",
    PATIENT_COMPLICATION: "pink",
    INFECTION: "orange",
    COMPLICATION: "pink",
    PREMISES_INCIDENT: "blue",
    SAFEGUARDING: "purple",
    MEDICATION_ERROR: "orange",
    DATA_BREACH: "orange",
    COMPLAINT: "pink",
    NEAR_MISS: "gray",
    OTHER: "gray",
};

export default function IncidentsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data, isLoading, error, refetch } = useIncidents();
    const incidents = (data?.data ?? []) as Incident[];
    const categories = useMemo(() => [...new Set(incidents.map((i) => i.category).filter(Boolean))], [incidents]);

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | null>(null);
    const [statusFilter, setStatusFilter] = useState<IncidentStatus | null>(null);
    const [typeFilter, setTypeFilter] = useState<IncidentType | null>(null);
    const [sortBy, setSortBy] = useState<"date" | "severity">("date");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("detail"));
    const { data: detailData, isLoading: detailLoading } = useIncidentDetail(selectedId ?? "");
    const selectedIncident = selectedId ? (detailData as Incident | undefined) : undefined;

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
        <div className="flex flex-col gap-4 sm:gap-6">
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
                            {(item) => <Select.Item id={item.id}>{item.id ? (TYPE_LABELS[item.id] ?? item.id) : "All types"}</Select.Item>}
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
                            <span className="text-quaternary">Type:</span> {TYPE_LABELS[typeFilter] ?? typeFilter}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                </div>
            )}

            {/* Empty state */}
            {incidents.length === 0 && !isLoading && (
                <div className="flex flex-1 items-center justify-center py-16">
                    <EmptyState size="lg">
                        <EmptyState.Header>
                            <EmptyState.FeaturedIcon icon={AlertCircle} color="success" theme="light" />
                        </EmptyState.Header>
                        <EmptyState.Content>
                            <EmptyState.Title>No incidents recorded</EmptyState.Title>
                            <EmptyState.Description>
                                When incidents occur, record them here to track investigations, outcomes, and lessons learned for CQC compliance.
                            </EmptyState.Description>
                        </EmptyState.Content>
                        <EmptyState.Footer>
                            <Button color="primary" size="md" iconLeading={Plus} onClick={() => router.push("/incidents/report")}>
                                Report Incident
                            </Button>
                        </EmptyState.Footer>
                    </EmptyState>
                </div>
            )}

            {/* Table */}
            {incidents.length > 0 && (<TableCard.Root>
                <TableCard.Header title="Incidents" badge={String(filtered.length)} description="Click any row to view incident details." />
                <Table aria-label="Incidents" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="title" label="Incident" isRowHeader />
                        <Table.Head id="type" label="Type" className="hidden sm:table-cell" />
                        <Table.Head id="category" label="Category" className="hidden sm:table-cell" />
                        <Table.Head id="severity" label="Severity" />
                        <Table.Head id="status" label="Status" />
                        <Table.Head id="reporter" label="Reported by" className="hidden sm:table-cell" />
                        <Table.Head id="date" label="Date" className="hidden sm:table-cell" />
                    </Table.Header>
                    <Table.Body items={filtered}>
                        {(inc) => (
                            <Table.Row id={inc.id} className="cursor-pointer" onAction={() => setSelectedId(inc.id)}>
                                <Table.Cell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-error-primary">
                                            <AlertTriangle className="size-4 text-error-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-primary">{inc.title}</p>
                                            <p className="text-xs text-tertiary line-clamp-1">{inc.description}</p>
                                        </div>
                                    </div>
                                </Table.Cell>
                                <Table.Cell className="hidden sm:table-cell">
                                    <Badge size="sm" color={TYPE_BADGE[inc.incidentType] ?? "gray"} type="pill-color">{TYPE_LABELS[inc.incidentType] ?? inc.incidentType}</Badge>
                                </Table.Cell>
                                <Table.Cell className="hidden sm:table-cell">
                                    <Badge size="sm" color="gray" type="modern">{inc.category}</Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <BadgeWithDot size="sm" color={SEVERITY_BADGE[inc.severity]}>{inc.severity.replace("_", " ")}</BadgeWithDot>
                                </Table.Cell>
                                <Table.Cell>
                                    <BadgeWithDot size="sm" color={STATUS_BADGE[inc.status]}>{inc.status}</BadgeWithDot>
                                </Table.Cell>
                                <Table.Cell className="hidden sm:table-cell">
                                    <span className="text-sm text-tertiary whitespace-nowrap">{inc.reportedBy}</span>
                                </Table.Cell>
                                <Table.Cell className="hidden sm:table-cell">
                                    <span className="text-sm text-tertiary whitespace-nowrap">{formatDate(inc.reportedAt)}</span>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </TableCard.Root>)}

            {/* Incident detail slideout */}
            <SlideoutMenu isOpen={!!selectedId} onOpenChange={(open) => { if (!open) setSelectedId(null); }} isDismissable>
                <SlideoutMenu.Header onClose={() => setSelectedId(null)} className="relative flex w-full flex-col gap-0.5 px-4 pt-6 md:px-6">
                    {detailLoading ? (
                        <div className="flex flex-col gap-3 animate-pulse pr-8">
                            <div className="h-5 w-10 rounded bg-secondary" />
                            <div className="h-6 w-56 rounded bg-secondary" />
                            <div className="flex gap-2"><div className="h-5 w-16 rounded-full bg-secondary" /><div className="h-5 w-20 rounded-full bg-secondary" /><div className="h-5 w-24 rounded-full bg-secondary" /></div>
                        </div>
                    ) : selectedIncident ? (
                        <div className="pr-8">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-tertiary uppercase tracking-wider">Incident Detail</span>
                            </div>
                            <div className="mt-2 flex items-start gap-3">
                                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-error-secondary">
                                    <AlertTriangle className="size-4 text-fg-error-primary" />
                                </div>
                                <h1 className="text-lg font-semibold text-primary leading-snug">{selectedIncident.title}</h1>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <BadgeWithDot size="sm" color={selectedIncident.severity ? (SEVERITY_BADGE[selectedIncident.severity] ?? "gray") : "gray"}>
                                    {selectedIncident.severity ? selectedIncident.severity.replace("_", " ") : "No severity"}
                                </BadgeWithDot>
                                <BadgeWithDot size="sm" color={selectedIncident.status ? (STATUS_BADGE[selectedIncident.status] ?? "gray") : "gray"}>
                                    {selectedIncident.status ?? "No status"}
                                </BadgeWithDot>
                                <Badge size="sm" color={selectedIncident.incidentType ? (TYPE_BADGE[selectedIncident.incidentType] ?? "gray") : "gray"} type="pill-color">
                                    {selectedIncident.incidentType ? (TYPE_LABELS[selectedIncident.incidentType] ?? selectedIncident.incidentType) : "No type"}
                                </Badge>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-tertiary">Incident not found.</p>
                    )}
                </SlideoutMenu.Header>

                <SlideoutMenu.Content>
                    {detailLoading ? (
                        <div className="flex flex-col gap-4 animate-pulse">
                            <div className="grid grid-cols-2 gap-3">
                                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-secondary" />)}
                            </div>
                            <div className="h-4 w-full rounded bg-secondary" />
                            <div className="h-20 w-full rounded bg-secondary" />
                        </div>
                    ) : selectedIncident ? (
                        <div className="flex flex-col gap-6">
                            {/* Detail grid */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="flex items-start gap-3 rounded-lg border border-secondary bg-primary p-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                                        <File06 className="size-4 text-fg-quaternary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-tertiary">Incident Type</p>
                                        <p className="mt-0.5 text-sm font-medium text-primary truncate">
                                            {selectedIncident.incidentType ? (TYPE_LABELS[selectedIncident.incidentType] ?? selectedIncident.incidentType) : "—"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 rounded-lg border border-secondary bg-primary p-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                                        <Tag01 className="size-4 text-fg-quaternary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-tertiary">Category</p>
                                        <p className="mt-0.5 text-sm font-medium text-primary truncate">{selectedIncident.category ?? "—"}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 rounded-lg border border-secondary bg-primary p-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                                        <Flag06 className="size-4 text-fg-quaternary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-tertiary">Severity</p>
                                        <div className="mt-1">
                                            <BadgeWithDot size="sm" color={selectedIncident.severity ? (SEVERITY_BADGE[selectedIncident.severity] ?? "gray") : "gray"}>
                                                {selectedIncident.severity ? selectedIncident.severity.replace("_", " ") : "—"}
                                            </BadgeWithDot>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 rounded-lg border border-secondary bg-primary p-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                                        <Clock className="size-4 text-fg-quaternary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-tertiary">Status</p>
                                        <div className="mt-1">
                                            <BadgeWithDot size="sm" color={selectedIncident.status ? (STATUS_BADGE[selectedIncident.status] ?? "gray") : "gray"}>
                                                {selectedIncident.status ?? "—"}
                                            </BadgeWithDot>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 rounded-lg border border-secondary bg-primary p-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                                        <User01 className="size-4 text-fg-quaternary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-tertiary">Reported by</p>
                                        <p className="mt-0.5 text-sm font-medium text-primary truncate">{selectedIncident.reportedBy ?? "—"}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 rounded-lg border border-secondary bg-primary p-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                                        <Calendar className="size-4 text-fg-quaternary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-tertiary">Date Reported</p>
                                        <p className="mt-0.5 text-sm font-medium text-primary truncate">{selectedIncident.reportedAt ? formatDate(selectedIncident.reportedAt) : "—"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* CQC Domain */}
                            <div className="flex items-center gap-3 rounded-lg border border-secondary bg-primary p-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-secondary">
                                    <BarChartSquare02 className="size-4 text-fg-brand-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-tertiary">CQC Domain</p>
                                    {selectedIncident.domain ? (
                                        <Badge size="sm" color="brand" type="pill-color"><span className="capitalize">{selectedIncident.domain}</span></Badge>
                                    ) : (
                                        <p className="mt-0.5 text-sm font-medium text-primary">—</p>
                                    )}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-secondary" />

                            {/* Description */}
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-primary">Description</h3>
                                <div className="rounded-lg border border-secondary bg-secondary_alt p-3">
                                    <p className="text-sm leading-relaxed text-secondary">
                                        {selectedIncident.description || "No description provided."}
                                    </p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-secondary" />

                            {/* Timeline */}
                            <div>
                                <h3 className="mb-3 text-sm font-semibold text-primary">Timeline</h3>
                                <div className="relative flex flex-col gap-0">
                                    {/* Vertical connector line */}
                                    <div className="absolute left-[5px] top-2.5 bottom-2.5 w-px bg-tertiary/20" />

                                    <div className="relative flex items-start gap-3 pb-4">
                                        <div className="relative z-10 mt-0.5 flex size-[11px] shrink-0 items-center justify-center rounded-full border-2 border-warning-solid bg-primary" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-primary">Incident reported</p>
                                            <p className="text-xs text-tertiary">
                                                {selectedIncident.reportedAt ? formatDate(selectedIncident.reportedAt) : "—"}
                                                {selectedIncident.reportedBy ? ` by ${selectedIncident.reportedBy}` : ""}
                                            </p>
                                        </div>
                                    </div>

                                    {((selectedIncident.status as string) !== "REPORTED" && (selectedIncident.status as string) !== "OPEN") ? (
                                        <div className="relative flex items-start gap-3 pb-4">
                                            <div className="relative z-10 mt-0.5 flex size-[11px] shrink-0 items-center justify-center rounded-full border-2 border-brand-solid bg-primary" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-primary">Investigation started</p>
                                                <p className="text-xs text-tertiary">Assigned for review</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative flex items-start gap-3 pb-4 opacity-40">
                                            <div className="relative z-10 mt-0.5 flex size-[11px] shrink-0 items-center justify-center rounded-full border-2 border-tertiary bg-primary" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-primary">Investigation</p>
                                                <p className="text-xs text-tertiary">Pending</p>
                                            </div>
                                        </div>
                                    )}

                                    {(selectedIncident.status === "RESOLVED" || selectedIncident.status === "CLOSED") ? (
                                        <div className="relative flex items-start gap-3">
                                            <div className="relative z-10 mt-0.5 flex size-[11px] shrink-0 items-center justify-center rounded-full border-2 border-success-solid bg-primary" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-primary">Incident resolved</p>
                                                <p className="text-xs text-tertiary">Corrective actions implemented</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative flex items-start gap-3 opacity-40">
                                            <div className="relative z-10 mt-0.5 flex size-[11px] shrink-0 items-center justify-center rounded-full border-2 border-tertiary bg-primary" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-primary">Resolution</p>
                                                <p className="text-xs text-tertiary">Pending</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </SlideoutMenu.Content>

                {selectedIncident && (
                    <SlideoutMenu.Footer className="flex w-full items-center justify-between">
                        <p className="text-xs text-tertiary">ID: {selectedIncident.id?.slice(0, 8) ?? "—"}</p>
                        <div className="flex flex-wrap gap-2">
                            {((selectedIncident.status as string) === "REPORTED" || (selectedIncident.status as string) === "OPEN") && <Button color="primary" size="sm" iconLeading={ShieldTick}>Begin Investigation</Button>}
                            {((selectedIncident.status as string) === "INVESTIGATING" || (selectedIncident.status as string) === "ACTIONED") && <Button color="primary" size="sm">Mark Resolved</Button>}
                            {selectedIncident.status === "RESOLVED" && <Button color="secondary" size="sm">Close Incident</Button>}
                        </div>
                    </SlideoutMenu.Footer>
                )}
            </SlideoutMenu>
        </div>
    );
}
