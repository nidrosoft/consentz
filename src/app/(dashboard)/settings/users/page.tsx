"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronLeft, DotsVertical, X } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

const USERS = [
    { id: "1", name: "Jane Smith", email: "jane@brightwood.co.uk", role: "Owner", status: "Active" },
    { id: "2", name: "Mark Jones", email: "mark@brightwood.co.uk", role: "Admin", status: "Active" },
    { id: "3", name: "Sarah Brown", email: "sarah@brightwood.co.uk", role: "Staff", status: "Active" },
    { id: "4", name: "Pending invite", email: "tom@brightwood.co.uk", role: "Viewer", status: "Invited", invitedAgo: "2d ago" },
];

const ROLE_BADGE: Record<string, "brand" | "success" | "warning" | "gray"> = {
    Owner: "brand", Admin: "brand", Staff: "gray", Viewer: "gray",
};

const ROLES = [
    { value: "Admin", label: "Admin", description: "Full access" },
    { value: "Manager", label: "Manager", description: "Manage content" },
    { value: "Staff", label: "Staff", description: "View + limited edit" },
    { value: "Viewer", label: "Viewer", description: "Read only" },
];

export default function UsersSettingsPage() {
    const router = useRouter();
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("Staff");
    const [menuOpen, setMenuOpen] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

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
                    <p className="mt-1 text-sm text-tertiary">{USERS.length} members</p>
                </div>
                <Button color="primary" size="lg" iconLeading={Plus} onClick={() => setShowInvite(true)}>Invite User</Button>
            </div>

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
                        {USERS.map((user, i) => (
                            <tr key={user.id} className={i < USERS.length - 1 ? "border-b border-secondary" : ""}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar size="sm" initials={user.name.split(" ").map((n) => n[0]).join("")} />
                                        <div>
                                            <p className="text-sm font-medium text-primary">{user.name}</p>
                                            <p className="text-xs text-tertiary">{user.email}</p>
                                            {user.invitedAgo && <p className="text-xs text-quaternary">Invited {user.invitedAgo}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge size="sm" color={ROLE_BADGE[user.role] ?? "gray"} type="pill-color">{user.role}</Badge>
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
            </div>

            {/* Invite Dialog */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl border border-secondary bg-primary p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-primary">Invite Team Member</h2>
                            <button onClick={() => setShowInvite(false)} className="rounded-lg p-1 hover:bg-primary_hover"><X className="size-5 text-fg-quaternary" /></button>
                        </div>

                        <div className="flex flex-col gap-4">
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
                            <Button color="secondary" size="lg" onClick={() => setShowInvite(false)}>Cancel</Button>
                            <Button color="primary" size="lg" disabled={!inviteEmail}>Send Invite</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
