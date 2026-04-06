"use client";

import { useState } from "react";
import { SearchMd, Download01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Table } from "@/components/application/table/table";

import { Button } from "@/components/base/buttons/button";
import { useAdminAuditLog } from "@/hooks/use-admin";

function formatDateTime(d: string) {
    return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const ACTION_COLORS: Record<string, "gray" | "brand" | "success" | "error" | "warning"> = {
    CREATE: "success", UPDATE: "brand", DELETE: "error", LOGIN: "gray", LOGOUT: "gray",
    APPROVE: "success", PUBLISH: "success", ASSIGN: "brand",
};

function actionColor(action: string): "gray" | "brand" | "success" | "error" | "warning" {
    const upper = action.toUpperCase();
    for (const [key, color] of Object.entries(ACTION_COLORS)) {
        if (upper.includes(key)) return color;
    }
    return "gray";
}

export default function AdminAuditLogPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const { data: result, isLoading } = useAdminAuditLog(search, page);
    const logs = result?.data ?? [];
    const meta = result?.meta;
    const totalPages = (meta?.totalPages as number) ?? 1;

    const handleExport = () => {
        const csv = [
            "Timestamp,User,Organization,Action,Entity Type,Entity ID",
            ...logs.map((l) =>
                `"${l.created_at}","${l.user_name ?? "System"}","${l.organizationName ?? "—"}","${l.action}","${l.entity_type ?? "—"}","${l.entity_id ?? "—"}"`
            ),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Audit Log</h1>
                    <p className="mt-1 text-sm text-tertiary">Platform-wide audit trail of all significant actions.</p>
                </div>
                <Button size="sm" color="secondary" iconLeading={Download01} onClick={handleExport}>Export CSV</Button>
            </div>

            <div className="relative">
                <SearchMd className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
                <input
                    className="w-full rounded-lg border border-primary bg-primary py-2 pl-10 pr-3 text-sm text-primary placeholder:text-placeholder outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    placeholder="Search by user, action, or entity..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <div className="rounded-xl border border-secondary bg-primary shadow-xs overflow-hidden">
                <Table aria-label="Audit Log" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="timestamp" label="Timestamp" isRowHeader />
                        <Table.Head id="user" label="User" />
                        <Table.Head id="organization" label="Organization" />
                        <Table.Head id="action" label="Action" />
                        <Table.Head id="entity" label="Entity" />
                    </Table.Header>
                    <Table.Body items={isLoading ? [] : logs}>
                        {(log) => (
                            <Table.Row id={log.id}>
                                <Table.Cell><span className="text-sm text-secondary">{formatDateTime(log.created_at)}</span></Table.Cell>
                                <Table.Cell><span className="text-sm font-medium text-primary">{log.user_name ?? "System"}</span></Table.Cell>
                                <Table.Cell><span className="text-sm text-secondary">{log.organizationName ?? "—"}</span></Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color={actionColor(log.action)}>
                                        {log.action.replace(/_/g, " ")}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-secondary">
                                        {log.entity_type ?? "—"}
                                        {log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ""}
                                    </span>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
                {isLoading && <div className="py-12 text-center text-sm text-tertiary">Loading audit log...</div>}
                {!isLoading && logs.length === 0 && <div className="py-12 text-center text-sm text-tertiary">No audit log entries found.</div>}
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
