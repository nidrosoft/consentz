"use client";

import { useState, useMemo } from "react";
import { File06, CheckSquare, PieChart01, AlertCircle, AlertTriangle, Users01, Award02, SearchLg, ChevronDown, ChevronUp, FilterLines, XClose } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { useAuditLog } from "@/hooks/use-audit";
import { PageSkeleton } from "@/components/shared/page-skeleton";

const ENTITY_ICONS: Record<string, typeof File06> = {
    EVIDENCE: File06, TASK: CheckSquare, ORGANIZATION: PieChart01, POLICY: File06,
    INCIDENT: AlertCircle, STAFF: Users01, TRAINING: Award02, GAP: AlertTriangle,
};

const ENTITY_COLORS: Record<string, "brand" | "success" | "warning" | "error" | "gray"> = {
    EVIDENCE: "brand", TASK: "success", ORGANIZATION: "gray", POLICY: "brand",
    INCIDENT: "error", STAFF: "gray", TRAINING: "success", GAP: "warning",
};

const PAGE_SIZE = 5;

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function AuditLogPage() {
    const { data, isLoading, error, refetch } = useAuditLog({ pageSize: 100 });
    const activityLog = data?.data ?? [];
    const users = useMemo(() => [...new Set(activityLog.map((e: { user: string }) => e.user))], [activityLog]);
    const entityTypes = useMemo(() => [...new Set(activityLog.map((e: { entityType: string }) => e.entityType))], [activityLog]);
    const actions = useMemo(() => [...new Set(activityLog.map((e: { action: string }) => e.action))], [activityLog]);

    const [search, setSearch] = useState("");
    const [userFilter, setUserFilter] = useState<string | null>(null);
    const [entityFilter, setEntityFilter] = useState<string | null>(null);
    const [actionFilter, setActionFilter] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
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
            <div>
                <h1 className="text-display-xs font-semibold text-primary">Audit Log</h1>
                <p className="mt-1 text-sm text-tertiary">Immutable record of all platform activity.</p>
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

            {/* Log entries */}
            <div className="rounded-xl border border-secondary bg-primary">
                {paged.map((entry, i) => {
                    const Icon = ENTITY_ICONS[entry.entityType] ?? File06;
                    const isExpanded = expandedId === entry.id;
                    return (
                        <div key={entry.id} className={cx(i < paged.length - 1 && "border-b border-secondary")}>
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                className="flex w-full items-start gap-4 px-5 py-4 text-left transition duration-100 hover:bg-primary_hover"
                            >
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                                    <Icon className="size-4 text-fg-quaternary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-primary">{entry.description}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="text-xs text-tertiary">{entry.user}</span>
                                        <span className="text-xs text-quaternary">&middot;</span>
                                        <span className="text-xs text-tertiary">{formatDate(entry.createdAt)} at {formatTime(entry.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge size="sm" color={ENTITY_COLORS[entry.entityType] ?? "gray"} type="pill-color">
                                        {entry.entityType}
                                    </Badge>
                                    {isExpanded ? <ChevronUp className="size-4 text-fg-quaternary" /> : <ChevronDown className="size-4 text-fg-quaternary" />}
                                </div>
                            </button>
                            {isExpanded && (
                                <div className="border-t border-dashed border-secondary bg-secondary px-5 py-3">
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                                        <div><span className="font-medium text-tertiary">Action:</span> <span className="text-primary">{entry.action}</span></div>
                                        <div><span className="font-medium text-tertiary">Entity:</span> <span className="text-primary">{entry.entityType}</span></div>
                                        <div><span className="font-medium text-tertiary">User:</span> <span className="text-primary">{entry.user}</span></div>
                                        <div><span className="font-medium text-tertiary">Timestamp:</span> <span className="text-primary">{new Date(entry.createdAt).toISOString()}</span></div>
                                    </div>
                                    <p className="mt-2 text-xs text-quaternary">Entry ID: {entry.id}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
                {paged.length === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-tertiary">No audit log entries match your filters.</div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-tertiary">{filtered.length} entries &middot; Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                    <Button color="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>&larr; Previous</Button>
                    <Button color="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next &rarr;</Button>
                </div>
            </div>

            {/* Retention notice */}
            <div className="rounded-lg border border-secondary bg-secondary px-4 py-3">
                <p className="text-xs text-tertiary">Entries are read-only and cannot be edited or deleted. 7-year retention per NHS Records Management Code.</p>
            </div>
        </div>
    );
}
