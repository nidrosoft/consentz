"use client";

import { useState } from "react";
import { SearchMd, AlertCircle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Table } from "@/components/application/table/table";

import { useAdminIncidents } from "@/hooks/use-admin";

const STATUS_COLORS: Record<string, "gray" | "brand" | "success" | "error" | "warning"> = {
    OPEN: "error", UNDER_INVESTIGATION: "warning", RESOLVED: "success", CLOSED: "gray",
};

const SEVERITY_COLORS: Record<string, "gray" | "error" | "warning" | "brand"> = {
    CRITICAL: "error", HIGH: "error", MEDIUM: "warning", LOW: "gray",
};

function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminIncidentsPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [severityFilter, setSeverityFilter] = useState("");
    const { data: result, isLoading } = useAdminIncidents(search, page, { status: statusFilter || undefined, severity: severityFilter || undefined });
    const incidents = result?.data ?? [];
    const meta = result?.meta;
    const totalPages = (meta?.totalPages as number) ?? 1;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Incidents</h1>
                <p className="mt-1 text-sm text-tertiary">All incidents reported across organizations.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1">
                    <SearchMd className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
                    <input
                        className="w-full rounded-lg border border-primary bg-primary py-2 pl-10 pr-3 text-sm text-primary placeholder:text-placeholder outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        placeholder="Search incidents..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <select className="rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="UNDER_INVESTIGATION">Under Investigation</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                </select>
                <select className="rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand" value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}>
                    <option value="">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>
            </div>

            <div className="rounded-xl border border-secondary bg-primary shadow-xs overflow-hidden">
                <Table aria-label="Incidents" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="incident" label="Incident" isRowHeader />
                        <Table.Head id="organization" label="Organization" />
                        <Table.Head id="category" label="Category" />
                        <Table.Head id="severity" label="Severity" />
                        <Table.Head id="status" label="Status" />
                        <Table.Head id="reported" label="Reported" />
                    </Table.Header>
                    <Table.Body items={isLoading ? [] : incidents}>
                        {(incident) => (
                            <Table.Row id={incident.id}>
                                <Table.Cell><span className="text-sm font-medium text-primary">{incident.title}</span></Table.Cell>
                                <Table.Cell>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-secondary">{incident.organizationName ?? "—"}</span>
                                        {incident.serviceType && (
                                            <Badge size="sm" color={incident.serviceType === "aesthetic_clinic" ? "purple" : "blue"}>
                                                {incident.serviceType.replace(/_/g, " ")}
                                            </Badge>
                                        )}
                                    </div>
                                </Table.Cell>
                                <Table.Cell><span className="text-sm text-secondary">{incident.category ?? "—"}</span></Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color={SEVERITY_COLORS[incident.severity ?? ""] ?? "gray"}>
                                        {incident.severity ?? "—"}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color={STATUS_COLORS[incident.status ?? ""] ?? "gray"}>
                                        {(incident.status ?? "—").replace(/_/g, " ")}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell><span className="text-sm text-secondary">{formatDate(incident.reported_date ?? incident.created_at)}</span></Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
                {isLoading && <div className="py-12 text-center text-sm text-tertiary">Loading incidents...</div>}
                {!isLoading && incidents.length === 0 && <div className="py-12 text-center text-sm text-tertiary">No incidents found.</div>}
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
