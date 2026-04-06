"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Users01, SearchMd, ChevronLeft, ChevronRight, DotsVertical, ShieldTick, XCircle, RefreshCcw01, Key01, Trash01, UserEdit } from "@untitledui/icons";
import { Table } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { Avatar } from "@/components/base/avatar/avatar";
import { useAdminUsers, useAdminUpdateUser } from "@/hooks/use-admin";
import { toast } from "@/lib/toast";
import { cx } from "@/utils/cx";

function formatDate(d: string | null) {
    if (!d) return "Never";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function roleBadgeColor(role: string): "brand" | "success" | "gray" | "error" | "warning" {
    if (role === "OWNER") return "brand";
    if (role === "ADMIN") return "success";
    if (role === "COMPLIANCE_MANAGER") return "warning";
    if (role === "SUSPENDED" || role === "DELETED") return "error";
    return "gray";
}

export default function AdminUsersPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const { data: usersData, isLoading } = useAdminUsers(search, page);
    const updateUser = useAdminUpdateUser();
    const users = usersData?.data ?? [];
    const meta = usersData?.meta;

    const debounceRef = useMemo(() => ({ timer: null as ReturnType<typeof setTimeout> | null }), []);

    // Close menu on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setActionMenuId(null);
            }
        }
        if (actionMenuId) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [actionMenuId]);

    const handleSearch = (value: string) => {
        setSearch(value);
        if (debounceRef.timer) clearTimeout(debounceRef.timer);
        debounceRef.timer = setTimeout(() => setPage(1), 300);
    };

    const handleAction = async (userId: string, action: string, role?: string) => {
        setActionMenuId(null);

        const confirmMsg: Record<string, string> = {
            suspend: "Are you sure you want to suspend this user? They will be unable to sign in.",
            delete: "Are you sure you want to permanently delete this user? This cannot be undone.",
        };
        if (confirmMsg[action] && !window.confirm(confirmMsg[action])) return;

        try {
            await updateUser.mutateAsync({ userId, action, role });
            const messages: Record<string, string> = {
                update_role: `Role updated to ${role}`,
                suspend: "User has been suspended",
                activate: "User has been reactivated",
                reset_password: "Password reset email sent",
                delete: "User has been deleted",
            };
            toast.success("User updated", messages[action] ?? "Action completed.");
        } catch {
            toast.error("Failed", "Could not update user. Try again.");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Users</h1>
                <p className="mt-1 text-sm text-tertiary">All users across every organization. Manage roles and access.</p>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <SearchMd className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full rounded-lg border border-primary bg-primary py-2 pl-9 pr-3 text-sm text-primary placeholder:text-placeholder shadow-xs outline-none transition duration-100 focus:border-brand focus:ring-2 focus:ring-brand-100"
                />
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-secondary shadow-xs">
                <div className="flex items-center gap-3 border-b border-secondary px-5 py-4">
                    <h2 className="text-lg font-semibold text-primary">All Users</h2>
                    {meta && <Badge size="sm" color="gray">{String(meta.total)}</Badge>}
                </div>
                <Table aria-label="Users" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="user" label="User" isRowHeader />
                        <Table.Head id="org" label="Organization" />
                        <Table.Head id="role" label="Role" />
                        <Table.Head id="created" label="Joined" />
                        <Table.Head id="lastLogin" label="Last Login" />
                        <Table.Head id="actions" label="" />
                    </Table.Header>
                    <Table.Body items={isLoading ? [] : users}>
                        {(user) => (
                            <Table.Row id={user.id}>
                                <Table.Cell>
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            size="sm"
                                            initials={(user.full_name ?? user.email).charAt(0).toUpperCase()}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-primary">{user.full_name ?? "—"}</p>
                                            <p className="text-xs text-tertiary">{user.email}</p>
                                        </div>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-secondary">{user.organizationName ?? "—"}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color={roleBadgeColor(user.role)}>
                                        {user.role?.replace(/_/g, " ")}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-tertiary">{formatDate(user.created_at)}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-tertiary">{formatDate(user.last_sign_in_at)}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="relative" ref={actionMenuId === user.id ? menuRef : undefined}>
                                        <button
                                            onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                                            className="flex size-8 items-center justify-center rounded-lg transition duration-100 hover:bg-primary_hover"
                                        >
                                            <DotsVertical className="size-4 text-fg-tertiary" />
                                        </button>
                                        {actionMenuId === user.id && (
                                            <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-secondary_alt bg-primary shadow-lg">
                                                <div className="py-1">
                                                    {user.role !== "SUSPENDED" && user.role !== "DELETED" ? (
                                                        <>
                                                            <MenuSection label="Change Role" />
                                                            <ActionItem
                                                                icon={ShieldTick}
                                                                label="Make Admin"
                                                                onClick={() => handleAction(user.id, "update_role", "ADMIN")}
                                                            />
                                                            <ActionItem
                                                                icon={UserEdit}
                                                                label="Make Compliance Manager"
                                                                onClick={() => handleAction(user.id, "update_role", "COMPLIANCE_MANAGER")}
                                                            />
                                                            <ActionItem
                                                                icon={Users01}
                                                                label="Make Member"
                                                                onClick={() => handleAction(user.id, "update_role", "MEMBER")}
                                                            />
                                                            <div className="my-1 border-t border-secondary" />
                                                            <MenuSection label="Account Actions" />
                                                            <ActionItem
                                                                icon={Key01}
                                                                label="Send Password Reset"
                                                                onClick={() => handleAction(user.id, "reset_password")}
                                                            />
                                                            <ActionItem
                                                                icon={XCircle}
                                                                label="Suspend User"
                                                                onClick={() => handleAction(user.id, "suspend")}
                                                                destructive
                                                            />
                                                            <ActionItem
                                                                icon={Trash01}
                                                                label="Delete User"
                                                                onClick={() => handleAction(user.id, "delete")}
                                                                destructive
                                                            />
                                                        </>
                                                    ) : user.role === "SUSPENDED" ? (
                                                        <ActionItem
                                                            icon={RefreshCcw01}
                                                            label="Reactivate User"
                                                            onClick={() => handleAction(user.id, "activate", "MEMBER")}
                                                        />
                                                    ) : null}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>

                {isLoading && (
                    <div className="px-5 py-8 text-center text-sm text-tertiary">Loading users...</div>
                )}
                {!isLoading && users.length === 0 && (
                    <div className="flex flex-col items-center py-12 text-center">
                        <Users01 className="size-8 text-fg-quaternary" />
                        <p className="mt-3 text-sm font-medium text-primary">No users found</p>
                        <p className="mt-1 text-xs text-tertiary">Try adjusting your search.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-tertiary">
                        Page {meta.page} of {meta.totalPages} ({meta.total} total)
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            className={cx(
                                "flex items-center gap-1 rounded-lg border border-secondary px-3 py-1.5 text-sm font-medium shadow-xs transition duration-100",
                                page <= 1 ? "cursor-not-allowed text-disabled" : "text-secondary hover:bg-primary_hover",
                            )}
                        >
                            <ChevronLeft className="size-4" /> Previous
                        </button>
                        <button
                            disabled={!meta.hasMore}
                            onClick={() => setPage((p) => p + 1)}
                            className={cx(
                                "flex items-center gap-1 rounded-lg border border-secondary px-3 py-1.5 text-sm font-medium shadow-xs transition duration-100",
                                !meta.hasMore ? "cursor-not-allowed text-disabled" : "text-secondary hover:bg-primary_hover",
                            )}
                        >
                            Next <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function MenuSection({ label }: { label: string }) {
    return <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-quaternary">{label}</p>;
}

function ActionItem({
    icon: Icon,
    label,
    onClick,
    destructive,
}: {
    icon: React.FC<{ className?: string }>;
    label: string;
    onClick: () => void;
    destructive?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={cx(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium transition duration-100 hover:bg-primary_hover",
                destructive ? "text-error-primary" : "text-secondary",
            )}
        >
            <Icon className={cx("size-4", destructive ? "text-fg-error-secondary" : "text-fg-quaternary")} />
            {label}
        </button>
    );
}
