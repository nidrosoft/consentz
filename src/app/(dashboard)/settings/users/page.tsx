"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronLeft, DotsVertical, X } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

type TeamUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: "Active" | "Invited";
};

const ROLE_DISPLAY: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    COMPLIANCE_MANAGER: "Compliance Manager",
    DEPARTMENT_LEAD: "Department Lead",
    STAFF_MEMBER: "Staff",
    AUDITOR: "Auditor",
    OWNER: "Owner",
    ADMIN: "Admin",
    MANAGER: "Manager",
    STAFF: "Staff",
    VIEWER: "Viewer",
};

const ROLE_BADGE: Record<string, "brand" | "success" | "warning" | "gray"> = {
    SUPER_ADMIN: "brand",
    COMPLIANCE_MANAGER: "brand",
    OWNER: "brand",
    ADMIN: "brand",
    DEPARTMENT_LEAD: "brand",
    MANAGER: "brand",
    STAFF_MEMBER: "gray",
    STAFF: "gray",
    AUDITOR: "gray",
    VIEWER: "gray",
};

const ROLES = [
    { value: "ADMIN", label: "Admin", description: "Full access" },
    { value: "MANAGER", label: "Manager", description: "Manage content" },
    { value: "STAFF", label: "Staff", description: "View + limited edit" },
    { value: "VIEWER", label: "Viewer", description: "Read only" },
] as const;

export default function UsersSettingsPage() {
    const router = useRouter();
    const [users, setUsers] = useState<TeamUser[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<(typeof ROLES)[number]["value"]>("STAFF");
    const [inviteSubmitting, setInviteSubmitting] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const loadUsers = useCallback(async () => {
        setListLoading(true);
        setListError(null);
        try {
            const res = await fetch("/api/organization/users");
            const json = await res.json();
            if (!json.success) {
                setListError(json.error?.message ?? "Failed to load team members");
                setUsers([]);
                return;
            }
            setUsers(json.data as TeamUser[]);
        } catch {
            setListError("Failed to load team members");
            setUsers([]);
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/settings")}>Settings</Button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Team Members</h1>
                    <p className="mt-1 text-sm text-tertiary">
                        {listLoading ? "Loading…" : `${users.length} members`}
                    </p>
                </div>
                <Button color="primary" size="lg" iconLeading={Plus} onClick={() => setShowInvite(true)}>Invite User</Button>
            </div>

            {listError && (
                <p className="text-sm text-error-primary" role="alert">
                    {listError}
                </p>
            )}

            <div className="overflow-hidden rounded-xl border border-secondary">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-secondary bg-secondary">
                            <th className="px-4 py-3 text-left text-xs font-medium text-tertiary">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-tertiary">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-tertiary">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-tertiary"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, i) => (
                            <tr key={user.id} className={i < users.length - 1 ? "border-b border-secondary" : ""}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar size="sm" initials={user.name.split(" ").map((n) => n[0]).join("")} />
                                        <div>
                                            <p className="text-sm font-medium text-primary">{user.name}</p>
                                            <p className="text-xs text-tertiary">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge size="sm" color={ROLE_BADGE[user.role] ?? "gray"} type="pill-color">
                                        {ROLE_DISPLAY[user.role] ?? user.role}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge size="sm" color={user.status === "Active" ? "success" : "warning"} type="pill-color">{user.status}</Badge>
                                </td>
                                <td className="relative px-4 py-3 text-right">
                                    <button onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)} className="rounded-lg p-1 hover:bg-primary_hover">
                                        <DotsVertical className="size-4 text-fg-quaternary" />
                                    </button>
                                    {menuOpen === user.id && (
                                        <div ref={menuRef} className="absolute right-4 top-12 z-10 w-48 rounded-lg border border-secondary bg-primary py-1 shadow-lg">
                                            <button className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-primary_hover">Change role</button>
                                            {user.status === "Invited" && <button className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-primary_hover">Resend invite</button>}
                                            <button className="w-full px-3 py-2 text-left text-sm text-error-primary hover:bg-primary_hover">Remove user</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!listLoading && users.length === 0 && !listError && (
                    <p className="px-4 py-8 text-center text-sm text-tertiary">No team members yet.</p>
                )}
            </div>

            {/* Invite Dialog */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl border border-secondary bg-primary p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-primary">Invite Team Member</h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowInvite(false);
                                    setInviteError(null);
                                }}
                                className="rounded-lg p-1 hover:bg-primary_hover"
                            >
                                <X className="size-5 text-fg-quaternary" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {inviteError && (
                                <p className="text-sm text-error-primary" role="alert">
                                    {inviteError}
                                </p>
                            )}
                            <Input label="Email *" placeholder="tom@brightwood.co.uk" value={inviteEmail} onChange={(v) => setInviteEmail(v)} isRequired />

                            <div>
                                <label className="mb-2 block text-sm font-medium text-primary">Role *</label>
                                <div className="flex flex-col gap-2">
                                    {ROLES.map((r) => (
                                        <label key={r.value} className={cx("flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5", inviteRole === r.value ? "border-brand-600 bg-brand-primary" : "border-secondary hover:bg-primary_hover")}>
                                            <input type="radio" name="role" value={r.value} checked={inviteRole === r.value} onChange={() => setInviteRole(r.value)} className="sr-only" />
                                            <div className={cx("flex size-4 items-center justify-center rounded-full border-2", inviteRole === r.value ? "border-brand-600" : "border-tertiary")}>
                                                {inviteRole === r.value && <div className="size-2 rounded-full bg-brand-600" />}
                                            </div>
                                            <div>
                                                <span className={cx("text-sm font-medium", inviteRole === r.value ? "text-brand-secondary" : "text-primary")}>{r.label}</span>
                                                <span className="ml-1.5 text-xs text-tertiary">— {r.description}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button
                                color="secondary"
                                size="lg"
                                onClick={() => {
                                    setShowInvite(false);
                                    setInviteError(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                size="lg"
                                isLoading={inviteSubmitting}
                                isDisabled={!inviteEmail.trim() || inviteSubmitting}
                                onClick={async () => {
                                    setInviteError(null);
                                    setInviteSubmitting(true);
                                    try {
                                        const res = await fetch("/api/organization/users", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                email: inviteEmail.trim(),
                                                role: inviteRole,
                                            }),
                                        });
                                        const json = await res.json();
                                        if (!json.success) {
                                            setInviteError(json.error?.message ?? "Invitation failed");
                                            return;
                                        }
                                        setShowInvite(false);
                                        setInviteEmail("");
                                        setInviteRole("STAFF");
                                        await loadUsers();
                                    } catch {
                                        setInviteError("Invitation failed");
                                    } finally {
                                        setInviteSubmitting(false);
                                    }
                                }}
                            >
                                Send Invite
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
