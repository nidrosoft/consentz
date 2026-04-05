"use client";

import { useState, useMemo } from "react";
import {
    File06, CheckSquare, PieChart01, AlertCircle, AlertTriangle, Users01,
    Award02, SearchLg, FilterLines, XClose, FileSearch01,
    Clock, ArrowRight, Edit01, Plus, Trash01, RefreshCw01, Eye,
    ShieldTick, Link01,
} from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Table, TableCard } from "@/components/application/table/table";
import { Badge, BadgeWithIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Avatar } from "@/components/base/avatar/avatar";
import { cx } from "@/utils/cx";
import { useAuditLog } from "@/hooks/use-audit";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import type { FC } from "react";

const ENTITY_META: Record<string, { icon: FC<{ className?: string }>; bg: string; fg: string; label: string }> = {
    EVIDENCE:     { icon: File06,        bg: "bg-[#ECFDF3]", fg: "text-[#12B76A]", label: "Evidence" },
    TASK:         { icon: CheckSquare,   bg: "bg-[#EEF4FF]", fg: "text-[#3538CD]", label: "Task" },
    ORGANIZATION: { icon: PieChart01,    bg: "bg-[#F4F3FF]", fg: "text-[#6938EF]", label: "Organisation" },
    POLICY:       { icon: File06,        bg: "bg-[#FFF1F3]", fg: "text-[#C01048]", label: "Policy" },
    INCIDENT:     { icon: AlertCircle,   bg: "bg-[#FEF3F2]", fg: "text-[#D92D20]", label: "Incident" },
    STAFF:        { icon: Users01,       bg: "bg-[#F0F9FF]", fg: "text-[#026AA2]", label: "Staff" },
    TRAINING:     { icon: Award02,       bg: "bg-[#FFFAEB]", fg: "text-[#DC6803]", label: "Training" },
    GAP:          { icon: AlertTriangle, bg: "bg-[#FEF0C7]", fg: "text-[#B54708]", label: "Gap" },
    ASSESSMENT:   { icon: ShieldTick,    bg: "bg-[#F4F3FF]", fg: "text-[#6938EF]", label: "Assessment" },
    NOTIFICATION: { icon: AlertCircle,   bg: "bg-[#EEF4FF]", fg: "text-[#3538CD]", label: "Notification" },
};

const ACTION_META: Record<string, { icon: FC<{ className?: string }>; color: "success" | "brand" | "warning" | "error" | "gray" | "blue" }> = {
    CREATE:     { icon: Plus,        color: "success" },
    UPDATE:     { icon: Edit01,      color: "brand" },
    DELETE:     { icon: Trash01,     color: "error" },
    UPLOAD:     { icon: ArrowRight,  color: "success" },
    VIEW:       { icon: Eye,         color: "gray" },
    SYNC:       { icon: RefreshCw01, color: "blue" },
    INVITE:     { icon: Users01,     color: "brand" },
    REMOVE:     { icon: Trash01,     color: "error" },
    LINK:       { icon: Link01,      color: "brand" },
    COMPLETE:   { icon: CheckSquare, color: "success" },
    GENERATE:   { icon: ShieldTick,  color: "brand" },
};

const PAGE_SIZE = 10;

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string): string {
    return name.split(/[\s@]/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatAction(action: string): string {
    return action.charAt(0) + action.slice(1).toLowerCase().replace(/_/g, " ");
}

export default function AuditLogPage() {
    return <AuditLogPanel />;
}

export function AuditLogPanel() {
    const { data, isLoading, error, refetch } = useAuditLog({ pageSize: 100 });
    const activityLog = data?.data ?? [];
    const users = useMemo(() => [...new Set(activityLog.map((e: { user: string }) => e.user))], [activityLog]);
    const entityTypes = useMemo(() => [...new Set(activityLog.map((e: { entityType: string }) => e.entityType))], [activityLog]);
    const actions = useMemo(() => [...new Set(activityLog.map((e: { action: string }) => e.action))], [activityLog]);

    const [search, setSearch] = useState("");
    const [userFilter, setUserFilter] = useState<string | null>(null);
    const [entityFilter, setEntityFilter] = useState<string | null>(null);
    const [actionFilter, setActionFilter] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    const filtered = useMemo(() => {
        return activityLog
            .filter((e: { description: string; user: string; entityType: string; action: string }) => {
                if (search && !e.description.toLowerCase().includes(search.toLowerCase()) && !e.user.toLowerCase().includes(search.toLowerCase())) return false;
                if (userFilter && e.user !== userFilter) return false;
                if (entityFilter && e.entityType !== entityFilter) return false;
                if (actionFilter && e.action !== actionFilter) return false;
                return true;
            })
            .sort((a: { createdAt: string }, b: { createdAt: string }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [activityLog, search, userFilter, entityFilter, actionFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const hasFilters = !!(userFilter || entityFilter || actionFilter);
    const activeFilterCount = [userFilter, entityFilter, actionFilter].filter(Boolean).length;

    function clearAllFilters() {
        setUserFilter(null);
        setEntityFilter(null);
        setActionFilter(null);
    }

    if (isLoading) return <PageSkeleton variant="list" rows={10} />;

    if (error) {
        return (
            <div className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-6">
                <p className="text-sm text-error-primary">Failed to load audit log.</p>
                <Button color="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Audit Log</h1>
                    <p className="mt-1 text-sm text-tertiary">Immutable record of all platform activity.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-1.5">
                        <span className="size-2 rounded-full bg-success-solid animate-pulse" />
                        <span className="text-xs font-medium text-tertiary">{filtered.length} entries</span>
                    </div>
                </div>
            </div>

            {/* Search + Filter Toggle */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                    <Input size="sm" placeholder="Search audit log..." icon={SearchLg} value={search} onChange={(v) => setSearch(v)} />
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Select
                            label="User"
                            placeholder="All users"
                            size="sm"
                            selectedKey={userFilter}
                            onSelectionChange={(key) => { setUserFilter(key === "" ? null : String(key)); setPage(1); }}
                            items={[{ id: "" }, ...users.map((u) => ({ id: u }))]}
                        >
                            {(item) => <Select.Item id={item.id}>{item.id || "All users"}</Select.Item>}
                        </Select>

                        <Select
                            label="Entity Type"
                            placeholder="All entities"
                            size="sm"
                            selectedKey={entityFilter}
                            onSelectionChange={(key) => { setEntityFilter(key === "" ? null : String(key)); setPage(1); }}
                            items={[{ id: "" }, ...entityTypes.map((t) => ({ id: t }))]}
                        >
                            {(item) => <Select.Item id={item.id}>{item.id || "All entities"}</Select.Item>}
                        </Select>

                        <Select
                            label="Action"
                            placeholder="All actions"
                            size="sm"
                            selectedKey={actionFilter}
                            onSelectionChange={(key) => { setActionFilter(key === "" ? null : String(key)); setPage(1); }}
                            items={[{ id: "" }, ...actions.map((a) => ({ id: a }))]}
                        >
                            {(item) => <Select.Item id={item.id}>{item.id || "All actions"}</Select.Item>}
                        </Select>
                    </div>
                </div>
            )}

            {/* Active filter chips */}
            {hasFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-tertiary">Showing:</span>
                    {userFilter && (
                        <button onClick={() => setUserFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">User:</span> {userFilter}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                    {entityFilter && (
                        <button onClick={() => setEntityFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">Entity:</span> {entityFilter}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                    {actionFilter && (
                        <button onClick={() => setActionFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">Action:</span> {actionFilter}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                </div>
            )}

            {/* Table */}
            <TableCard.Root>
                <Table aria-label="Audit log entries" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="description" label="Activity" isRowHeader />
                        <Table.Head id="user" label="User" />
                        <Table.Head id="entity" label="Entity" />
                        <Table.Head id="action" label="Action" />
                        <Table.Head id="date" label="Date" />
                    </Table.Header>
                    <Table.Body items={paged}>
                        {(entry) => {
                            const meta = ENTITY_META[entry.entityType] ?? ENTITY_META.ORGANIZATION;
                            const Icon = meta.icon;
                            const actionMeta = ACTION_META[entry.action];

                            return (
                                <Table.Row id={entry.id}>
                                    <Table.Cell>
                                        <div className="flex items-center gap-3">
                                            <span className={cx("flex size-9 shrink-0 items-center justify-center rounded-full", meta.bg)}>
                                                <Icon className={cx("size-4", meta.fg)} />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-primary max-w-xs xl:max-w-md">{entry.description}</p>
                                                <p className="mt-0.5 text-xs text-tertiary font-mono">{entry.id.slice(0, 8)}…</p>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center gap-2.5">
                                            <Avatar initials={getInitials(entry.user)} size="sm" />
                                            <span className="whitespace-nowrap text-sm text-secondary">{entry.user.split("@")[0]}</span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge size="sm" color={
                                            entry.entityType === "EVIDENCE" ? "success"
                                            : entry.entityType === "TASK" ? "blue"
                                            : entry.entityType === "INCIDENT" ? "error"
                                            : entry.entityType === "GAP" ? "warning"
                                            : entry.entityType === "TRAINING" ? "orange"
                                            : entry.entityType === "POLICY" ? "pink"
                                            : entry.entityType === "STAFF" ? "blue-light"
                                            : entry.entityType === "ORGANIZATION" ? "purple"
                                            : entry.entityType === "ASSESSMENT" ? "indigo"
                                            : "gray"
                                        } type="pill-color">
                                            {meta.label}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {actionMeta ? (
                                            <BadgeWithIcon
                                                size="sm"
                                                color={actionMeta.color}
                                                iconLeading={actionMeta.icon}
                                            >
                                                {formatAction(entry.action)}
                                            </BadgeWithIcon>
                                        ) : (
                                            <Badge size="sm" color="gray" type="pill-color">
                                                {formatAction(entry.action)}
                                            </Badge>
                                        )}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                            <Clock className="size-3.5 text-fg-quaternary" />
                                            <div>
                                                <p className="text-sm text-primary">{formatDate(entry.createdAt)}</p>
                                                <p className="text-xs text-tertiary">{formatTime(entry.createdAt)}</p>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            );
                        }}
                    </Table.Body>
                </Table>

                {paged.length === 0 && (
                    <div className="px-5 py-12">
                        <EmptyState size="md">
                            <EmptyState.Header>
                                <EmptyState.FeaturedIcon icon={FileSearch01} color="gray" theme="light" />
                            </EmptyState.Header>
                            <EmptyState.Content>
                                <EmptyState.Title>No audit entries found</EmptyState.Title>
                                <EmptyState.Description>Audit log entries will appear as your team interacts with the platform. Try adjusting your filters.</EmptyState.Description>
                            </EmptyState.Content>
                        </EmptyState>
                    </div>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-secondary px-4 py-3 md:px-6 md:pt-3 md:pb-4">
                    <span className="text-sm text-tertiary">{filtered.length} entries &middot; Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        <Button color="secondary" size="sm" isDisabled={page <= 1} onClick={() => setPage(page - 1)}>&larr; Previous</Button>
                        <Button color="secondary" size="sm" isDisabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next &rarr;</Button>
                    </div>
                </div>
            </TableCard.Root>

            {/* Retention notice */}
            <div className="flex items-center gap-2 rounded-lg border border-secondary bg-secondary_subtle px-4 py-3">
                <ShieldTick className="size-4 shrink-0 text-fg-brand-secondary" />
                <p className="text-xs text-tertiary">Entries are read-only and cannot be edited or deleted. 7-year retention per NHS Records Management Code.</p>
            </div>
        </div>
    );
}
