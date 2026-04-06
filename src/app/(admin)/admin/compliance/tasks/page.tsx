"use client";

import { useState } from "react";
import { SearchMd, CheckSquare, AlertTriangle, Clock, CheckCircle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Table } from "@/components/application/table/table";

import { useAdminTasks } from "@/hooks/use-admin";
import { cx } from "@/utils/cx";

const STATUS_COLORS: Record<string, "gray" | "brand" | "success" | "error" | "warning"> = {
    TODO: "gray", IN_PROGRESS: "brand", DONE: "success", CANCELLED: "gray",
};

const PRIORITY_COLORS: Record<string, "gray" | "error" | "warning" | "brand"> = {
    CRITICAL: "error", HIGH: "error", MEDIUM: "warning", LOW: "gray",
};

function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminTasksPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const { data: result, isLoading } = useAdminTasks(search, page, { status: statusFilter || undefined });
    const tasks = result?.data ?? [];
    const meta = result?.meta as Record<string, unknown> | undefined;
    const kpis = (meta as Record<string, Record<string, number>> | undefined)?.kpis;
    const totalPages = (meta?.totalPages as number) ?? 1;

    const isOverdue = (t: { status: string; due_date: string | null }) =>
        t.due_date && ["TODO", "IN_PROGRESS"].includes(t.status) && new Date(t.due_date) < new Date();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Tasks & Gaps</h1>
                <p className="mt-1 text-sm text-tertiary">All compliance tasks and remediation gaps across the platform.</p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                    { label: "Total Open", value: kpis?.totalOpen ?? "—", icon: CheckSquare, color: "text-fg-brand-primary" },
                    { label: "Overdue", value: kpis?.overdue ?? "—", icon: AlertTriangle, color: "text-fg-error-primary" },
                    { label: "Completed (30d)", value: kpis?.completedThisMonth ?? "—", icon: CheckCircle, color: "text-fg-success-primary" },
                    { label: "Total Tracked", value: String(meta?.total ?? "—"), icon: Clock, color: "text-fg-quaternary" },
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

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1">
                    <SearchMd className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
                    <input
                        className="w-full rounded-lg border border-primary bg-primary py-2 pl-10 pr-3 text-sm text-primary placeholder:text-placeholder outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        placeholder="Search tasks..."
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
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-secondary bg-primary shadow-xs overflow-hidden">
                <Table aria-label="Tasks" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="task" label="Task" isRowHeader />
                        <Table.Head id="organization" label="Organization" />
                        <Table.Head id="status" label="Status" />
                        <Table.Head id="priority" label="Priority" />
                        <Table.Head id="assignedTo" label="Assigned To" />
                        <Table.Head id="dueDate" label="Due Date" />
                    </Table.Header>
                    <Table.Body items={isLoading ? [] : tasks}>
                        {(task) => (
                            <Table.Row id={task.id}>
                                <Table.Cell>
                                    <span className="text-sm font-medium text-primary">{task.title}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-secondary">{task.organizationName ?? "—"}</span>
                                        {task.serviceType && (
                                            <Badge size="sm" color={task.serviceType === "aesthetic_clinic" ? "purple" : "blue"}>
                                                {task.serviceType.replace(/_/g, " ")}
                                            </Badge>
                                        )}
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color={STATUS_COLORS[task.status] ?? "gray"}>
                                        {task.status.replace(/_/g, " ")}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color={PRIORITY_COLORS[task.priority ?? ""] ?? "gray"}>
                                        {task.priority ?? "—"}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell><span className="text-sm text-secondary">{task.assigned_to_name ?? "Unassigned"}</span></Table.Cell>
                                <Table.Cell>
                                    <span className={cx("text-sm", isOverdue(task) ? "font-semibold text-error-primary" : "text-secondary")}>
                                        {formatDate(task.due_date)}
                                    </span>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
                {isLoading && <div className="py-12 text-center text-sm text-tertiary">Loading tasks...</div>}
                {!isLoading && tasks.length === 0 && <div className="py-12 text-center text-sm text-tertiary">No tasks found.</div>}
            </div>

            {/* Pagination */}
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
