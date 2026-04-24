"use client";

import { useState, useRef, useEffect, useCallback, type FC } from "react";
import type { Key } from "react-aria-components";
import { useRouter, useSearchParams } from "next/navigation";
import { AuditLogPanel } from "@/app/(dashboard)/audits/page";
import { ReportsPanel } from "@/app/(dashboard)/reports/page";
import {
    Building07, Users01, CreditCard02, PuzzlePiece01, Bell01,
    Lock01, AlertTriangle, Plus, ChevronLeft, DotsVertical, X,
    CheckCircle, Zap, ArrowUpRight, Check,
    Copy01, Key01, RefreshCw01, Trash01, AlertCircle, Link01, LinkBroken01,
    Rocket01, Calendar as CalendarIcon, MessageChatSquare,
} from "@untitledui/icons";
import { useWalkthrough } from "@/components/walkthrough/walkthrough-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "@/components/application/tabs/tabs";
import { NativeSelect } from "@/components/base/select/select-native";
import { Input } from "@/components/base/input/input";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { PricingCard } from "@/components/application/pricing-card/pricing-card";
import { Table, TableCard } from "@/components/application/table/table";
import { BadgeWithIcon } from "@/components/base/badges/badges";
import { useOrganization, useUpdateOrganization } from "@/hooks/use-organization";
import { useMarkOnboardingStep } from "@/hooks/use-onboarding";
import { cx } from "@/utils/cx";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { toast } from "@/lib/toast";

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const tabs = [
    { id: "organisation", label: "Organisation" },
    { id: "users", label: "Users" },
    { id: "billing", label: "Billing" },
    { id: "integrations", label: "Integrations" },
    { id: "notifications", label: "Notifications" },
    { id: "audit-log", label: "Audit Log" },
    { id: "reports", label: "Reports" },
];

// ---------------------------------------------------------------------------
// Organisation Tab
// ---------------------------------------------------------------------------

function OrganisationPanel() {
    const { data: org, isLoading, error } = useOrganization();
    const updateOrg = useUpdateOrganization();
    const markOnboardingStep = useMarkOnboardingStep();

    const [name, setName] = useState("");
    const [cqcProviderId, setCqcProviderId] = useState("");
    const [cqcLocationId, setCqcLocationId] = useState("");
    const [registeredManager, setRegisteredManager] = useState("");
    const [bedCount, setBedCount] = useState("");
    const [postcode, setPostcode] = useState("");
    const [initialised, setInitialised] = useState(false);

    useEffect(() => {
        if (org && !initialised) {
            setName(org.name ?? "");
            setCqcProviderId(org.cqcProviderId ?? "");
            setCqcLocationId(org.cqcLocationId ?? "");
            setRegisteredManager(org.registeredManager ?? "");
            setBedCount(org.bedCount != null ? String(org.bedCount) : "");
            setPostcode(org.postcode ?? "");
            setInitialised(true);
        }
    }, [org, initialised]);

    const handleSaveOrg = useCallback(() => {
        if (!name.trim()) return;
        updateOrg.mutate(
            {
                name: name.trim(),
                cqcProviderId: cqcProviderId.trim() || undefined,
                cqcLocationId: cqcLocationId.trim() || undefined,
                registeredManager: registeredManager.trim() || undefined,
                bedCount: bedCount ? Number(bedCount) : undefined,
                postcode: postcode.trim() || undefined,
            } as any,
            {
                onSuccess: () => markOnboardingStep("org_profile"),
            },
        );
    }, [name, cqcProviderId, cqcLocationId, registeredManager, bedCount, postcode, updateOrg, markOnboardingStep]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 sm:gap-6 animate-pulse">
                <div className="h-8 w-48 rounded-lg bg-quaternary" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="h-10 w-full rounded-lg bg-quaternary" />
                    <div className="h-10 w-full rounded-lg bg-quaternary" />
                </div>
                <div className="h-64 rounded-xl bg-quaternary" />
            </div>
        );
    }

    if (error || !org) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-secondary bg-primary py-20">
                <AlertTriangle className="size-10 text-warning-primary" />
                <p className="text-sm text-tertiary">Failed to load organisation details.</p>
                <Button color="secondary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-primary">Organisation Details</h2>
                    <p className="mt-1 text-sm text-tertiary">Manage your organisation name, CQC IDs, and service details.</p>
                </div>
                <Button color="primary" size="lg" isLoading={updateOrg.isPending} onClick={handleSaveOrg}>Save</Button>
            </div>

            <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-4 sm:p-6">
                <Input label="Organisation name *" value={name} onChange={(v) => setName(v)} isRequired />

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-primary">Service type</label>
                    <div className="flex items-center gap-3 rounded-lg border border-secondary bg-disabled_subtle px-3 py-2.5">
                        <span className="text-sm text-primary">{org.serviceType === "CARE_HOME" ? "Care Home" : "Aesthetic Clinic"}</span>
                        <Lock01 className="size-4 text-fg-disabled" />
                        <span className="text-xs text-tertiary">Cannot change after onboarding</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input label="CQC Provider ID" value={cqcProviderId} onChange={(v) => setCqcProviderId(v)} />
                    <Input label="CQC Location ID" value={cqcLocationId} onChange={(v) => setCqcLocationId(v)} />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input label="Registered Manager" value={registeredManager} onChange={(v) => setRegisteredManager(v)} />
                    <Input label="Number of beds" type="number" value={bedCount} onChange={(v) => setBedCount(v)} isRequired />
                </div>

                <Input label="Address" value={postcode} onChange={(v) => setPostcode(v)} />
            </div>

            <RestartTourCard />

            <DeleteOrganisationSection orgName={org.name ?? ""} />
        </div>
    );
}

function DeleteOrganisationSection({ orgName }: { orgName: string }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmInput, setConfirmInput] = useState("");
    const [deleting, setDeleting] = useState(false);

    const handleDelete = useCallback(async () => {
        if (confirmInput !== orgName) return;
        setDeleting(true);
        try {
            const res = await fetch("/api/organization", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirmName: confirmInput }),
            });
            const json = await res.json();
            if (json.success) {
                const { signOutEverywhere } = await import("@/lib/supabase/client-sign-out");
                await signOutEverywhere();
            } else {
                toast.error("Deletion failed", json.error?.message ?? "Could not delete the organisation.");
                setDeleting(false);
            }
        } catch {
            toast.error("Deletion failed", "Something went wrong. Please try again.");
            setDeleting(false);
        }
    }, [confirmInput, orgName]);

    return (
        <div className="rounded-xl border border-error-primary bg-primary p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-error-primary" />
                <div className="flex-1">
                    <h2 className="text-sm font-semibold text-error-primary">Danger Zone</h2>
                    <p className="mt-1 text-sm text-tertiary">Permanently delete this organisation and all its data. This action cannot be undone.</p>
                </div>
                <Button color="primary-destructive" size="sm" onClick={() => setShowConfirm(true)}>Delete Organisation</Button>
            </div>

            {showConfirm && (
                <div className="mt-5 rounded-lg border border-error bg-error-secondary p-4">
                    <p className="text-sm font-medium text-error-primary">
                        This will permanently delete all data including staff, policies, evidence, tasks, incidents, compliance scores, and audit logs.
                    </p>
                    <p className="mt-3 text-sm text-secondary">
                        Type <span className="font-semibold text-primary">{orgName}</span> to confirm:
                    </p>
                    <input
                        type="text"
                        value={confirmInput}
                        onChange={(e) => setConfirmInput(e.target.value)}
                        placeholder={orgName}
                        className="mt-2 w-full rounded-lg border border-error bg-primary px-3 py-2 text-sm text-primary outline-none transition duration-100 focus:ring-2 focus:ring-error"
                        autoFocus
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                            color="primary-destructive"
                            size="sm"
                            isDisabled={confirmInput !== orgName}
                            isLoading={deleting}
                            onClick={handleDelete}
                        >
                            Permanently delete
                        </Button>
                        <Button
                            color="secondary"
                            size="sm"
                            isDisabled={deleting}
                            onClick={() => { setShowConfirm(false); setConfirmInput(""); }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function RestartTourCard() {
    const { progress, restartWalkthrough } = useWalkthrough();
    const router = useRouter();
    const isCompleted = progress.phase1Status === "COMPLETED" || progress.phase1Status === "SKIPPED";

    return (
        <div className="rounded-xl border border-secondary bg-primary p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-secondary">
                    <Rocket01 className="size-5 text-fg-brand-primary" />
                </div>
                <div className="flex-1">
                    <h2 className="text-sm font-semibold text-primary">Welcome Tour</h2>
                    <p className="mt-1 text-sm text-tertiary">
                        {isCompleted
                            ? "You\u2019ve completed the welcome tour. Restart it anytime to refresh your memory."
                            : "Take the guided tour to learn about every feature in the CQC Compliance Module."}
                    </p>
                </div>
                <Button
                    color="secondary"
                    size="sm"
                    iconLeading={Rocket01}
                    onClick={() => {
                        restartWalkthrough();
                        router.push("/");
                    }}
                >
                    {isCompleted ? "Restart Tour" : "Start Tour"}
                </Button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Users Tab
// ---------------------------------------------------------------------------

type TeamUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: "Active" | "Invited";
};

const ROLE_DISPLAY: Record<string, string> = {
    SUPER_ADMIN: "Super Admin", COMPLIANCE_MANAGER: "Compliance Manager",
    DEPARTMENT_LEAD: "Department Lead", STAFF_MEMBER: "Staff", AUDITOR: "Auditor",
    OWNER: "Owner", ADMIN: "Admin", MANAGER: "Manager", STAFF: "Staff", VIEWER: "Viewer",
};

const ROLE_BADGE: Record<string, "brand" | "success" | "warning" | "gray"> = {
    SUPER_ADMIN: "brand", COMPLIANCE_MANAGER: "brand", OWNER: "brand", ADMIN: "brand",
    DEPARTMENT_LEAD: "brand", MANAGER: "brand", STAFF_MEMBER: "gray", STAFF: "gray",
    AUDITOR: "gray", VIEWER: "gray",
};

const ROLES = [
    { value: "ADMIN", label: "Admin", description: "Full access" },
    { value: "MANAGER", label: "Manager", description: "Manage content" },
    { value: "STAFF", label: "Staff", description: "View + limited edit" },
    { value: "VIEWER", label: "Viewer", description: "Read only" },
] as const;

const MEMBER_ROLES = [
    { value: "COMPLIANCE_MANAGER", label: "Compliance Manager" },
    { value: "DEPARTMENT_LEAD", label: "Department Lead" },
    { value: "STAFF_MEMBER", label: "Staff" },
    { value: "AUDITOR", label: "Auditor" },
] as const;

function UsersPanel() {
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

    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [removeLoading, setRemoveLoading] = useState(false);
    const [changeRoleUser, setChangeRoleUser] = useState<TeamUser | null>(null);
    const [newRole, setNewRole] = useState("");
    const [roleLoading, setRoleLoading] = useState(false);
    const [resendingId, setResendingId] = useState<string | null>(null);
    const [actionFeedback, setActionFeedback] = useState<string | null>(null);

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

    useEffect(() => { void loadUsers(); }, [loadUsers]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleRemoveUser = async (userId: string) => {
        setRemoveLoading(true);
        try {
            const res = await fetch(`/api/organization/users/${userId}`, { method: "DELETE" });
            const json = await res.json();
            if (!json.success) {
                toast.error("Failed to remove user", json.error?.message ?? "Please try again.");
                return;
            }
            toast.success("User removed", "The team member has been removed.");
            setConfirmRemoveId(null);
            await loadUsers();
        } catch {
            toast.error("Failed to remove user", "Please try again.");
        } finally {
            setRemoveLoading(false);
        }
    };

    const handleChangeRole = async () => {
        if (!changeRoleUser || !newRole) return;
        setRoleLoading(true);
        try {
            const res = await fetch(`/api/organization/users/${changeRoleUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            const json = await res.json();
            if (!json.success) {
                toast.error("Failed to change role", json.error?.message ?? "Please try again.");
                return;
            }
            toast.success("Role updated", `Role changed to ${ROLE_DISPLAY[newRole] ?? newRole}.`);
            setChangeRoleUser(null);
            setNewRole("");
            await loadUsers();
        } catch {
            toast.error("Failed to change role", "Please try again.");
        } finally {
            setRoleLoading(false);
        }
    };

    const handleResendInvite = async (user: TeamUser) => {
        setResendingId(user.id);
        setMenuOpen(null);
        try {
            const res = await fetch("/api/organization/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, role: "STAFF" }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success("Invitation resent", `Invitation resent to ${user.email}.`);
            } else {
                toast.error("Resend failed", json.error?.message ?? "Failed to resend invitation.");
            }
        } catch {
            toast.error("Resend failed", "Failed to resend invitation.");
        } finally {
            setResendingId(null);
        }
    };

    useEffect(() => {
        if (actionFeedback) {
            const t = setTimeout(() => setActionFeedback(null), 4000);
            return () => clearTimeout(t);
        }
    }, [actionFeedback]);

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-primary">Team Members</h2>
                    <p className="mt-1 text-sm text-tertiary">
                        {listLoading ? "Loading…" : `${users.length} member${users.length !== 1 ? "s" : ""}`}
                    </p>
                </div>
                <Button color="primary" size="lg" iconLeading={Plus} onClick={() => setShowInvite(true)}>Invite User</Button>
            </div>

            {listError && <p className="text-sm text-error-primary" role="alert">{listError}</p>}

            {actionFeedback && (
                <div className="flex items-center gap-2 rounded-lg border border-secondary bg-secondary p-3">
                    <CheckCircle className="size-4 shrink-0 text-fg-success-secondary" />
                    <p className="text-sm text-primary">{actionFeedback}</p>
                </div>
            )}

            <div className="rounded-xl border border-secondary">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-secondary bg-secondary">
                            <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-tertiary">User</th>
                            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-tertiary">Role</th>
                            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-tertiary">Status</th>
                            <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-tertiary"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, i) => (
                            <tr key={user.id} className={i < users.length - 1 ? "border-b border-secondary" : ""}>
                                <td className="px-3 sm:px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar size="sm" initials={user.name.split(" ").map((n) => n[0]).join("")} />
                                        <div>
                                            <p className="text-sm font-medium text-primary">{user.name}</p>
                                            <p className="text-xs text-tertiary">{user.email}</p>
                                            <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                                                <Badge size="sm" color={ROLE_BADGE[user.role] ?? "gray"} type="pill-color">
                                                    {ROLE_DISPLAY[user.role] ?? user.role}
                                                </Badge>
                                                <Badge size="sm" color={user.status === "Active" ? "success" : "warning"} type="pill-color">{user.status}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="hidden sm:table-cell px-4 py-3">
                                    <Badge size="sm" color={ROLE_BADGE[user.role] ?? "gray"} type="pill-color">
                                        {ROLE_DISPLAY[user.role] ?? user.role}
                                    </Badge>
                                </td>
                                <td className="hidden sm:table-cell px-4 py-3">
                                    <Badge size="sm" color={user.status === "Active" ? "success" : "warning"} type="pill-color">{user.status}</Badge>
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-right">
                                    <div className="relative inline-block">
                                        <button onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)} className="rounded-lg p-1 hover:bg-primary_hover">
                                            <DotsVertical className="size-4 text-fg-quaternary" />
                                        </button>
                                        {menuOpen === user.id && (
                                            <div ref={menuRef} className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-secondary bg-primary py-1 shadow-lg">
                                                <button
                                                    className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-primary_hover"
                                                    onClick={() => { setMenuOpen(null); setChangeRoleUser(user); setNewRole(user.role); }}
                                                >
                                                    Change role
                                                </button>
                                                {user.status === "Invited" && (
                                                    <button
                                                        className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-primary_hover"
                                                        onClick={() => handleResendInvite(user)}
                                                        disabled={resendingId === user.id}
                                                    >
                                                        {resendingId === user.id ? "Sending…" : "Resend invite"}
                                                    </button>
                                                )}
                                                <button
                                                    className="w-full px-3 py-2 text-left text-sm text-error-primary hover:bg-primary_hover"
                                                    onClick={() => { setMenuOpen(null); setConfirmRemoveId(user.id); }}
                                                >
                                                    {user.status === "Invited" ? "Cancel invitation" : "Remove user"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!listLoading && users.length === 0 && !listError && (
                    <p className="px-4 py-8 text-center text-sm text-tertiary">No team members yet.</p>
                )}
            </div>

            {/* Confirm Remove Dialog */}
            {confirmRemoveId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-sm rounded-xl border border-secondary bg-primary p-6 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error-secondary">
                                <AlertTriangle className="size-5 text-error-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-primary">
                                    {users.find(u => u.id === confirmRemoveId)?.status === "Invited" ? "Cancel invitation?" : "Remove team member?"}
                                </h3>
                                <p className="mt-1 text-sm text-tertiary">
                                    {users.find(u => u.id === confirmRemoveId)?.status === "Invited"
                                        ? `This will revoke the pending invitation for ${users.find(u => u.id === confirmRemoveId)?.email}.`
                                        : `This will remove ${users.find(u => u.id === confirmRemoveId)?.name} from your organisation. They will lose access immediately.`}
                                </p>
                            </div>
                        </div>
                        <div className="mt-5 flex flex-wrap justify-end gap-3">
                            <Button color="secondary" size="sm" onClick={() => setConfirmRemoveId(null)} isDisabled={removeLoading}>Cancel</Button>
                            <Button color="primary-destructive" size="sm" isLoading={removeLoading} onClick={() => handleRemoveUser(confirmRemoveId)}>
                                {users.find(u => u.id === confirmRemoveId)?.status === "Invited" ? "Revoke invitation" : "Remove user"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Role Dialog */}
            {changeRoleUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-sm rounded-xl border border-secondary bg-primary p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-primary">Change Role</h3>
                            <button type="button" onClick={() => { setChangeRoleUser(null); setNewRole(""); }} className="rounded-lg p-1 hover:bg-primary_hover">
                                <X className="size-5 text-fg-quaternary" />
                            </button>
                        </div>
                        <p className="mb-4 text-sm text-tertiary">Update role for <strong className="text-primary">{changeRoleUser.name}</strong> ({changeRoleUser.email})</p>
                        <div className="flex flex-col gap-2">
                            {MEMBER_ROLES.map((r) => (
                                <label key={r.value} className={cx("flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5", newRole === r.value ? "border-brand-600 bg-brand-primary" : "border-secondary hover:bg-primary_hover")}>
                                    <input type="radio" name="newRole" value={r.value} checked={newRole === r.value} onChange={() => setNewRole(r.value)} className="sr-only" />
                                    <div className={cx("flex size-4 items-center justify-center rounded-full border-2", newRole === r.value ? "border-brand-600" : "border-tertiary")}>
                                        {newRole === r.value && <div className="size-2 rounded-full bg-brand-600" />}
                                    </div>
                                    <span className={cx("text-sm font-medium", newRole === r.value ? "text-brand-secondary" : "text-primary")}>{r.label}</span>
                                </label>
                            ))}
                        </div>
                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <Button color="secondary" size="sm" onClick={() => { setChangeRoleUser(null); setNewRole(""); }}>Cancel</Button>
                            <Button color="primary" size="sm" isLoading={roleLoading} isDisabled={newRole === changeRoleUser.role} onClick={handleChangeRole}>Update Role</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Dialog */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl border border-secondary bg-primary p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-primary">Invite Team Member</h2>
                            <button type="button" onClick={() => { setShowInvite(false); setInviteError(null); }} className="rounded-lg p-1 hover:bg-primary_hover">
                                <X className="size-5 text-fg-quaternary" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-4">
                            {inviteError && <p className="text-sm text-error-primary" role="alert">{inviteError}</p>}
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
                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <Button color="secondary" size="lg" onClick={() => { setShowInvite(false); setInviteError(null); }}>Cancel</Button>
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
                                            body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
                                        });
                                        const json = await res.json();
                                        if (!json.success) { setInviteError(json.error?.message ?? "Invitation failed"); return; }
                                        toast.success("Invitation sent", `Invite sent to ${inviteEmail.trim()}.`);
                                        setShowInvite(false);
                                        setInviteEmail("");
                                        setInviteRole("STAFF");
                                        await loadUsers();
                                    } catch { setInviteError("Invitation failed"); } finally { setInviteSubmitting(false); }
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

// ---------------------------------------------------------------------------
// Billing Tab
// ---------------------------------------------------------------------------

interface Plan {
    id: string; name: string; tier: string; stripe_price_id: string;
    price_monthly: number; features: string[]; is_active: boolean;
}

interface Subscription {
    id: string; status: string; stripe_customer_id: string | null;
    current_period_end: string | null; cancel_at: string | null; plan: Plan | null;
}

const TIER_DESCRIPTIONS: Record<string, string> = {
    free: "Perfect for getting started",
    professional: "Ideal for growing practices",
    enterprise: "For large-scale organisations",
};

const TIER_ICONS: Record<string, FC<React.SVGProps<SVGSVGElement>>> = {
    free: Zap, professional: CreditCard02, enterprise: Building07,
};

function BillingPanel() {
    const params = useSearchParams();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (params.get("success") === "1") {
            setSuccessMessage("Subscription updated successfully!");
            window.history.replaceState({}, "", "/settings?tab=billing");
        }
    }, [params]);

    const fetchData = useCallback(async () => {
        try {
            const [plansRes, subRes] = await Promise.all([
                fetch("/api/billing/plans"),
                fetch("/api/billing/subscription"),
            ]);
            if (plansRes.ok) { const j = await plansRes.json(); setPlans(j.data ?? []); }
            if (subRes.ok) { const j = await subRes.json(); setSubscription(j.data ?? null); }
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCheckout = async (priceId: string) => {
        setCheckoutLoading(priceId);
        try {
            const res = await fetch("/api/billing/checkout", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId }),
            });
            const json = await res.json();
            if (json.data?.url) window.location.href = json.data.url;
        } finally { setCheckoutLoading(null); }
    };

    const handlePortal = async () => {
        setPortalLoading(true);
        try {
            const res = await fetch("/api/billing/portal", { method: "POST" });
            const json = await res.json();
            if (json.data?.url) window.location.href = json.data.url;
        } finally { setPortalLoading(false); }
    };

    const currentTier = subscription?.plan?.tier ?? "free";
    const formatPrice = (pence: number) => pence === 0 ? "Free" : `£${(pence / 100).toFixed(0)}`;

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div>
                <h2 className="text-lg font-semibold text-primary">Billing &amp; Plan</h2>
                <p className="mt-1 text-sm text-tertiary">Manage your subscription, payment method, and invoices.</p>
            </div>

            {successMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-success-300 bg-success-primary p-4">
                    <CheckCircle className="size-5 text-fg-success-primary" />
                    <p className="text-sm font-medium text-success-primary">{successMessage}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="size-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                </div>
            ) : (
                <>
                    {subscription && subscription.status !== "cancelled" && (
                        <div className="rounded-xl border border-secondary bg-primary p-4 sm:p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-semibold text-primary">{subscription.plan?.name ?? "Current"} Plan</h3>
                                        <Badge size="sm" color={subscription.status === "active" ? "success" : "warning"} type="pill-color">
                                            {subscription.status === "active" ? "Active" : subscription.status === "past_due" ? "Past Due" : subscription.status}
                                        </Badge>
                                    </div>
                                    {subscription.current_period_end && (
                                        <p className="mt-1 text-sm text-tertiary">
                                            {subscription.cancel_at ? "Cancels" : "Renews"} on {new Date(subscription.current_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                                        </p>
                                    )}
                                </div>
                                <Button color="secondary" size="sm" iconTrailing={ArrowUpRight} onClick={handlePortal} isLoading={portalLoading}>
                                    Manage Subscription
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {plans.map((plan) => {
                            const isCurrent = plan.tier === currentTier;
                            const isPopular = plan.tier === "professional";
                            const isUpgrade = plans.findIndex(p => p.tier === plan.tier) > plans.findIndex(p => p.tier === currentTier);
                            const Icon = TIER_ICONS[plan.tier] ?? Zap;
                            return (
                                <PricingCard.Card key={plan.id} className={isCurrent ? "border-brand ring-1 ring-brand-300" : ""}>
                                    <PricingCard.Header>
                                        <PricingCard.Plan>
                                            <PricingCard.PlanName>
                                                <Icon className="size-4 text-fg-quaternary" />
                                                <span>{plan.name}</span>
                                            </PricingCard.PlanName>
                                            {isPopular && <PricingCard.PlanBadge>Popular</PricingCard.PlanBadge>}
                                            {isCurrent && !isPopular && <PricingCard.PlanBadge>Current</PricingCard.PlanBadge>}
                                        </PricingCard.Plan>
                                        <PricingCard.Price>
                                            <PricingCard.MainPrice>{formatPrice(plan.price_monthly)}</PricingCard.MainPrice>
                                            {plan.price_monthly > 0 && <PricingCard.Period>/month</PricingCard.Period>}
                                        </PricingCard.Price>
                                        {isCurrent ? (
                                            <Button color="secondary" size="md" isDisabled className="w-full">Current plan</Button>
                                        ) : plan.tier === "free" ? (
                                            <Button color="tertiary" size="md" isDisabled className="w-full">Free tier</Button>
                                        ) : (
                                            <Button color={isUpgrade ? "primary" : "secondary"} size="md" className="w-full" isLoading={checkoutLoading === plan.stripe_price_id} onClick={() => handleCheckout(plan.stripe_price_id)}>
                                                {isUpgrade ? "Upgrade" : "Switch"} to {plan.name}
                                            </Button>
                                        )}
                                    </PricingCard.Header>
                                    <PricingCard.Body>
                                        <PricingCard.Description>{TIER_DESCRIPTIONS[plan.tier] ?? ""}</PricingCard.Description>
                                        <PricingCard.List>
                                            {(plan.features as string[]).map((feature) => (
                                                <PricingCard.ListItem key={feature}>
                                                    <CheckCircle className="mt-0.5 size-4 shrink-0 text-fg-success-secondary" aria-hidden="true" />
                                                    <span>{feature}</span>
                                                </PricingCard.ListItem>
                                            ))}
                                        </PricingCard.List>
                                    </PricingCard.Body>
                                </PricingCard.Card>
                            );
                        })}
                    </div>

                    {subscription?.stripe_customer_id && (
                        <div className="rounded-xl border border-secondary bg-primary p-4 sm:p-6">
                            <h3 className="mb-2 text-lg font-semibold text-primary">Payment &amp; Invoices</h3>
                            <p className="mb-4 text-sm text-tertiary">Update your card, download invoices, or cancel your subscription through the Stripe billing portal.</p>
                            <Button color="secondary" size="sm" iconTrailing={ArrowUpRight} onClick={handlePortal} isLoading={portalLoading}>
                                Open Billing Portal
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Integrations Tab
// ---------------------------------------------------------------------------

interface SdkKey {
    id: string; name: string; key_prefix: string; key?: string;
    status: "ACTIVE" | "REVOKED"; created_at: string; last_used_at: string | null;
}

const MOCK_WEBHOOK_URL = "https://api.consentz.com/webhooks/cqc-compliance";

// ---------------------------------------------------------------------------
// Third-Party Integration Cards
// ---------------------------------------------------------------------------

function CqcIntegrationCard() {
    return (
        <div className="flex flex-col justify-between rounded-xl border border-secondary bg-primary p-5">
            <div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-success-secondary">
                    <CheckCircle className="size-5 text-fg-success-primary" />
                </div>
                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-primary">CQC API</p>
                        <Badge size="sm" color="success" type="pill-color">Connected</Badge>
                    </div>
                    <p className="mt-1 text-xs text-tertiary">Automatically sync your CQC profile and inspection data with the compliance module.</p>
                </div>
            </div>
            <div className="mt-5">
                <Button color="secondary" size="sm" className="w-full">Configure</Button>
            </div>
        </div>
    );
}

function CalendarIntegrationCard() {
    const { data: calStatus, isLoading } = useQuery({
        queryKey: ["calendar-status"],
        queryFn: () => apiGet<{ connected: boolean; configured: boolean; calendars: { id: string; name: string; provider: string; primary: boolean }[] }>("/api/calendar").then((r) => r.data),
    });

    const isConnected = calStatus?.connected ?? false;
    const calCount = calStatus?.calendars?.length ?? 0;
    const primaryCal = calStatus?.calendars?.find((c) => c.primary);

    return (
        <div className="flex flex-col justify-between rounded-xl border border-secondary bg-primary p-5">
            <div>
                <div className={cx("flex size-10 items-center justify-center rounded-lg", isConnected ? "bg-brand-secondary" : "bg-secondary")}>
                    <CalendarIcon className={cx("size-5", isConnected ? "text-fg-brand-primary" : "text-fg-quaternary")} />
                </div>
                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-primary">Calendar</p>
                        {isLoading ? (
                            <Badge size="sm" color="gray" type="pill-color">Checking…</Badge>
                        ) : isConnected ? (
                            <Badge size="sm" color="success" type="pill-color">Connected</Badge>
                        ) : (
                            <Badge size="sm" color="warning" type="pill-color">Not Connected</Badge>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-tertiary">
                        {isConnected
                            ? `${calCount} calendar${calCount !== 1 ? "s" : ""} synced${primaryCal ? ` — ${primaryCal.provider}` : ""} via Cal.com. Tasks with due dates are pushed to your calendar.`
                            : "Connect Google Calendar, Microsoft 365, or any calendar via Cal.com to sync tasks and deadlines."}
                    </p>
                </div>
            </div>
            <div className="mt-5">
                <Button
                    color={isConnected ? "secondary" : "primary"}
                    size="sm"
                    className="w-full"
                    href="https://app.cal.com/settings/my-account/calendars"
                >
                    {isConnected ? "Manage Calendars" : "Connect Calendar"}
                </Button>
            </div>
        </div>
    );
}

function SlackIntegrationCard() {
    return (
        <div className="flex flex-col justify-between rounded-xl border border-secondary bg-primary p-5">
            <div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                    <MessageChatSquare className="size-5 text-fg-quaternary" />
                </div>
                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-primary">Slack</p>
                        <Badge size="sm" color="gray" type="pill-color">Coming Soon</Badge>
                    </div>
                    <p className="mt-1 text-xs text-tertiary">Receive compliance alerts, task notifications, and gap reminders directly in your Slack workspace channels.</p>
                </div>
            </div>
            <div className="mt-5">
                <Button color="secondary" size="sm" className="w-full" isDisabled>Coming Soon</Button>
            </div>
        </div>
    );
}

function IntegrationsPanel() {
    const queryClient = useQueryClient();
    const markOnboardingStep = useMarkOnboardingStep();
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
    const [consentzUser, setConsentzUser] = useState("");
    const [consentzPass, setConsentzPass] = useState("");
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

    const { data: keys = [], isLoading } = useQuery({
        queryKey: ["sdk-keys"],
        queryFn: () => apiGet<SdkKey[]>("/api/sdk/keys").then((r) => r.data),
    });

    const generateMutation = useMutation({
        mutationFn: (name: string) => apiPost<SdkKey & { key: string }>("/api/sdk/keys", { name }).then((r) => r.data),
        onSuccess: (data) => { setRevealedKey(data.key); setRevealedKeyId(data.id); queryClient.invalidateQueries({ queryKey: ["sdk-keys"] }); toast.success("API key generated", "Your new key is ready. Copy it now — it won't be shown again."); },
        onError: () => toast.error("Key generation failed", "Please try again."),
    });

    const rotateMutation = useMutation({
        mutationFn: (id: string) => apiPatch<SdkKey & { key: string }>(`/api/sdk/keys/${id}`, {}).then((r) => r.data),
        onSuccess: (data) => { setRevealedKey(data.key); setRevealedKeyId(data.id); queryClient.invalidateQueries({ queryKey: ["sdk-keys"] }); toast.success("Key rotated", "A new key has been issued. Copy it now."); },
        onError: () => toast.error("Key rotation failed", "Please try again."),
    });

    const revokeMutation = useMutation({
        mutationFn: (id: string) => apiDelete(`/api/sdk/keys/${id}`),
        onMutate: async (id: string) => {
            setConfirmRevokeId(null);
            await queryClient.cancelQueries({ queryKey: ["sdk-keys"] });
            const prev = queryClient.getQueryData<SdkKey[]>(["sdk-keys"]);
            queryClient.setQueryData<SdkKey[]>(["sdk-keys"], (old) =>
                old?.map((k) => k.id === id ? { ...k, status: "REVOKED" } : k),
            );
            return { prev };
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sdk-keys"] }); toast.success("Key revoked", "The API key has been permanently revoked."); },
        onError: (_err, _id, context) => { if (context?.prev) queryClient.setQueryData(["sdk-keys"], context.prev); toast.error("Revocation failed", "Could not revoke the key."); },
    });

    const { data: consentzStatus, isLoading: consentzLoading } = useQuery({
        queryKey: ["consentz-status"],
        queryFn: () => apiGet<{ connected: boolean; clinicId: number | null; username: string | null }>("/api/consentz/connect").then((r) => r.data),
    });

    const connectMutation = useMutation({
        mutationFn: () => apiPost<{ connected: boolean; clinicId: number; clinicName: string }>("/api/consentz/connect", { username: consentzUser, password: consentzPass }).then((r) => r.data),
        onSuccess: () => { setConsentzUser(""); setConsentzPass(""); queryClient.invalidateQueries({ queryKey: ["consentz-status"] }); queryClient.invalidateQueries({ queryKey: ["organization"] }); queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }); markOnboardingStep("connect_consentz"); toast.success("Connected", "Consentz integration is now active."); },
        onError: () => toast.error("Connection failed", "Could not connect to Consentz."),
    });

    const disconnectMutation = useMutation({
        mutationFn: () => apiDelete("/api/consentz/connect"),
        onSuccess: () => { setShowDisconnectConfirm(false); queryClient.invalidateQueries({ queryKey: ["consentz-status"] }); queryClient.invalidateQueries({ queryKey: ["consentz-last-sync"] }); queryClient.invalidateQueries({ queryKey: ["compliance"] }); queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }); queryClient.invalidateQueries({ queryKey: ["organization"] }); toast.success("Disconnected", "Consentz integration has been removed."); },
        onError: () => toast.error("Disconnect failed", "Could not disconnect from Consentz."),
    });

    const { data: lastSyncData } = useQuery({
        queryKey: ["consentz-last-sync"],
        queryFn: () => apiGet<{ synced_at: string | null }>("/api/consentz/last-sync").then((r) => r.data),
        enabled: !!consentzStatus?.connected,
    });

    const syncMutation = useMutation({
        mutationFn: () => apiPost<{ synced: boolean }>("/api/consentz/sync", {}),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["consentz-last-sync"] }); queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }); toast.success("Sync complete", "Data has been synced with Consentz."); },
        onError: () => toast.error("Sync failed", "Could not sync with Consentz."),
    });

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.info("Copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

    const syncTimeAgo = (dateStr: string | null | undefined): string => {
        if (!dateStr) return "Never";
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div>
                <h2 className="text-lg font-semibold text-primary">Integrations</h2>
                <p className="mt-1 text-sm text-tertiary">Connect services, manage API keys, and configure the Consentz SDK.</p>
            </div>

            {/* Consentz Platform Connection */}
            <div className={cx("rounded-xl border bg-primary p-4 sm:p-6", consentzStatus?.connected ? "border-secondary" : "border-brand-300")}>
                <div className="flex items-start gap-3">
                    <div className={cx("flex size-10 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold", consentzStatus?.connected ? "bg-success-secondary text-fg-success-primary" : "bg-brand-primary text-brand-secondary")}>
                        {consentzStatus?.connected ? <CheckCircle className="size-5" /> : <Link01 className="size-5" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-primary">Consentz Platform</h3>
                            {consentzLoading ? <Badge size="sm" color="gray" type="pill-color">Checking...</Badge> : consentzStatus?.connected ? <Badge size="sm" color="success" type="pill-color">Connected</Badge> : <Badge size="sm" color="warning" type="pill-color">Not Connected</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-tertiary">Connect your Consentz clinic management system to automatically import consent forms, appointment data, staff credentials, and patient feedback as compliance evidence.</p>
                    </div>
                </div>

                {consentzStatus?.connected ? (
                    <div className="mt-4 space-y-3">
                        <div className="rounded-lg border border-secondary bg-secondary px-3 sm:px-4 py-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-medium text-primary">Clinic ID: {consentzStatus.clinicId}</p>
                                    <p className="text-xs text-tertiary">Connected as {consentzStatus.username}</p>
                                    {lastSyncData?.synced_at && (
                                        <p className="mt-0.5 text-xs text-tertiary">
                                            Last synced: {new Date(lastSyncData.synced_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })},{" "}
                                            {new Date(lastSyncData.synced_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button color="secondary" size="sm" iconLeading={RefreshCw01} isLoading={syncMutation.isPending} onClick={() => syncMutation.mutate()}>
                                        {syncMutation.isSuccess ? "Synced!" : "Sync Now"}
                                    </Button>
                                    {showDisconnectConfirm ? (
                                        <div className="flex items-center gap-2">
                                            <Button color="primary-destructive" size="sm" isLoading={disconnectMutation.isPending} onClick={() => disconnectMutation.mutate()}>Confirm</Button>
                                            <Button color="secondary" size="sm" onClick={() => setShowDisconnectConfirm(false)}>Cancel</Button>
                                        </div>
                                    ) : (
                                        <Button color="tertiary-destructive" size="sm" iconLeading={LinkBroken01} onClick={() => setShowDisconnectConfirm(true)}>Disconnect</Button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {syncMutation.isError && <p className="text-xs text-error-primary">Sync failed. Please try again.</p>}
                    </div>
                ) : (
                    <div className="mt-4 space-y-3">
                        <div className="rounded-lg border border-secondary bg-secondary p-4">
                            <p className="mb-3 text-xs text-tertiary">Enter your Consentz platform credentials to connect. Data will sync automatically every 6 hours.</p>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Input label="Username" placeholder="your-username" size="sm" value={consentzUser} onChange={setConsentzUser} />
                                <Input label="Password" placeholder="••••••••" size="sm" type="password" value={consentzPass} onChange={setConsentzPass} />
                            </div>
                            <div className="mt-3">
                                <Button color="primary" size="sm" iconLeading={Link01} isLoading={connectMutation.isPending} isDisabled={!consentzUser || !consentzPass} onClick={() => connectMutation.mutate()}>
                                    Connect to Consentz
                                </Button>
                            </div>
                            {connectMutation.isError && <p className="mt-2 text-xs text-error-primary">Connection failed. Please check your credentials and try again.</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* API Keys */}
            <div>
                {revealedKey && (
                    <div className="mb-4 rounded-xl border border-secondary bg-primary p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 size-5 shrink-0 text-fg-warning-primary" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-primary">Copy your API key now</p>
                                <p className="mt-0.5 text-xs text-tertiary">This key will only be shown once.</p>
                                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <code className="flex-1 rounded-md border border-secondary bg-secondary px-3 py-2 font-mono text-xs text-primary break-all">{revealedKey}</code>
                                    <Button color="secondary" size="sm" iconLeading={Copy01} onClick={() => handleCopy(revealedKey, "revealed")}>{copiedId === "revealed" ? "Copied!" : "Copy"}</Button>
                                </div>
                                <div className="mt-2">
                                    <Button color="link-gray" size="sm" onClick={() => { setRevealedKey(null); setRevealedKeyId(null); }}>Dismiss</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <TableCard.Root size="sm">
                    <TableCard.Header
                        title="API Keys"
                        description="Use API keys to authenticate requests to the Consentz Compliance API."
                        contentTrailing={
                            <Button color="primary" size="sm" iconLeading={Plus} isLoading={generateMutation.isPending} onClick={() => generateMutation.mutate("API Key")}>Generate New Key</Button>
                        }
                    />

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="size-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                        </div>
                    ) : keys.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Key01 className="size-8 text-fg-quaternary" />
                            <p className="mt-3 text-sm font-medium text-primary">No API keys generated yet</p>
                            <p className="mt-1 text-xs text-tertiary">Generate a key to start using the Consentz Compliance API.</p>
                            <div className="mt-4">
                                <Button color="primary" size="sm" isLoading={generateMutation.isPending} onClick={() => generateMutation.mutate("API Key")}>Generate Your First Key</Button>
                            </div>
                        </div>
                    ) : (
                        <Table aria-label="API Keys" size="sm">
                            <Table.Header>
                                <Table.Head id="name" label="Name" isRowHeader />
                                <Table.Head id="key" label="Key" />
                                <Table.Head id="status" label="Status" />
                                <Table.Head id="created" label="Created" />
                                <Table.Head id="actions" label="" />
                            </Table.Header>
                            <Table.Body items={keys}>
                                {(key) => (
                                    <Table.Row id={key.id}>
                                        <Table.Cell className="font-medium text-primary">{key.name}</Table.Cell>
                                        <Table.Cell>
                                            <div className="flex items-center gap-1.5">
                                                <code className="font-mono text-xs text-tertiary">{key.key_prefix}••••••••</code>
                                                <button onClick={() => handleCopy(key.key_prefix, key.id)} className="rounded p-0.5 transition duration-100 hover:bg-primary_hover" title="Copy prefix">
                                                    {copiedId === key.id ? <Check className="size-3.5 text-fg-success-secondary" /> : <Copy01 className="size-3.5 text-fg-quaternary" />}
                                                </button>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <BadgeWithIcon size="sm" color={key.status === "ACTIVE" ? "success" : "gray"} iconLeading={key.status === "ACTIVE" ? Check : X}>
                                                {key.status === "ACTIVE" ? "Active" : "Revoked"}
                                            </BadgeWithIcon>
                                        </Table.Cell>
                                        <Table.Cell className="whitespace-nowrap text-tertiary">{formatDate(key.created_at)}</Table.Cell>
                                        <Table.Cell>
                                            {key.status === "ACTIVE" && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button color="link-gray" size="sm" isLoading={rotateMutation.isPending} onClick={() => rotateMutation.mutate(key.id)}>Rotate</Button>
                                                    {confirmRevokeId === key.id ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <Button color="primary-destructive" size="sm" isLoading={revokeMutation.isPending} onClick={() => revokeMutation.mutate(key.id)}>Confirm</Button>
                                                            <Button color="link-gray" size="sm" onClick={() => setConfirmRevokeId(null)}>Cancel</Button>
                                                        </div>
                                                    ) : (
                                                        <Button color="link-destructive" size="sm" onClick={() => setConfirmRevokeId(key.id)}>Revoke</Button>
                                                    )}
                                                </div>
                                            )}
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table>
                    )}
                </TableCard.Root>

                {generateMutation.isError && <p className="mt-2 text-xs text-error-primary">Failed to generate key. Please try again.</p>}
                {revokeMutation.isError && <p className="mt-2 text-xs text-error-primary">Failed to revoke key. Please try again.</p>}
                {rotateMutation.isError && <p className="mt-2 text-xs text-error-primary">Failed to rotate key. Please try again.</p>}
            </div>

            {/* Webhooks */}
            <div className="rounded-xl border border-secondary bg-primary p-4 sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-primary">Webhooks</h3>
                        <p className="mt-1 text-sm text-tertiary">Receive real-time notifications when compliance events occur.</p>
                    </div>
                    <Button color="primary" size="sm">Add Endpoint</Button>
                </div>
                <div className="rounded-lg border border-secondary">
                    <div className="flex flex-col gap-3 px-3 sm:px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <code className="rounded bg-secondary px-2 py-0.5 font-mono text-xs text-primary break-all">{MOCK_WEBHOOK_URL}</code>
                                <Badge size="sm" color="success" type="pill-color">Active</Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                {["gap.created", "score.changed", "evidence.uploaded", "incident.reported"].map((evt) => (
                                    <span key={evt} className="rounded bg-secondary px-1.5 py-0.5 text-xs text-tertiary">{evt}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button color="secondary" size="sm">Edit</Button>
                            <Button color="primary-destructive" size="sm">Delete</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Third-party integrations — 3-column card grid */}
            <div>
                <h3 className="mb-4 text-lg font-semibold text-primary">Third-Party Services</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <CqcIntegrationCard />
                    <CalendarIntegrationCard />
                    <SlackIntegrationCard />
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Notifications Tab
// ---------------------------------------------------------------------------

const NOTIFICATION_PREFS = [
    { id: "expiry", label: "Document expiring soon", email: true },
    { id: "training", label: "Training due", email: true },
    { id: "tasks", label: "Task overdue", email: true },
    { id: "incidents", label: "Incident reported", email: true },
    { id: "score", label: "Compliance score changed", email: false },
    { id: "gaps", label: "New gap identified", email: true },
    { id: "policies", label: "Policy review due", email: true },
    { id: "registration", label: "Registration expiring", email: true },
    { id: "inspection", label: "Inspection reminder", email: true },
];

const DIGEST_OPTIONS = [
    { value: "individual", label: "Individual emails", description: "As they happen" },
    { value: "daily", label: "Daily digest", description: "9am summary" },
    { value: "weekly", label: "Weekly digest", description: "Monday morning" },
];

function NotificationsPanel() {
    const [digest, setDigest] = useState("individual");
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch("/api/me").then(r => r.json()).then(json => {
            if (json.success && json.data) {
                setEmailEnabled(json.data.emailNotifications ?? true);
            }
        }).catch(() => {});
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const res = await fetch("/api/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emailNotifications: emailEnabled }),
            });
            const json = await res.json();
            if (json.success) {
                setSaved(true);
                toast.success("Preferences saved", "Notification settings have been updated.");
            } else {
                toast.error("Save failed", "Could not update notification preferences.");
            }
        } catch {
            toast.error("Save failed", "Could not update notification preferences.");
        } finally {
            setSaving(false);
            if (saved) setTimeout(() => setSaved(false), 3000);
        }
    };

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-primary">Notification Preferences</h2>
                    <p className="mt-1 text-sm text-tertiary">Choose which notifications you receive by email. All notifications appear in-app regardless.</p>
                </div>
                <div className="flex items-center gap-3">
                    {saved && <span className="text-sm text-success-primary">Saved</span>}
                    <Button color="primary" size="lg" isLoading={saving} onClick={handleSave}>Save</Button>
                </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                <input
                    id="master-email-toggle"
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="size-4 rounded border-secondary accent-brand-600"
                />
                <label htmlFor="master-email-toggle" className="cursor-pointer">
                    <p className="text-sm font-medium text-primary">Receive email notifications</p>
                    <p className="text-xs text-tertiary">When disabled, you will only see notifications in-app.</p>
                </label>
            </div>

            <div className={cx("overflow-hidden rounded-xl border border-secondary", !emailEnabled && "opacity-50 pointer-events-none")}>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-secondary bg-secondary">
                            <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-tertiary">Notification Type</th>
                            <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-tertiary">In-App</th>
                            <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-tertiary">Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {NOTIFICATION_PREFS.map((pref, i) => (
                            <tr key={pref.id} className={i < NOTIFICATION_PREFS.length - 1 ? "border-b border-secondary" : ""}>
                                <td className="px-3 sm:px-4 py-3"><p className="text-sm font-medium text-primary">{pref.label}</p></td>
                                <td className="px-3 sm:px-4 py-3 text-center"><span className="text-xs font-medium text-tertiary">Always</span></td>
                                <td className="px-3 sm:px-4 py-3 text-center"><input type="checkbox" defaultChecked={pref.email} className="size-4 rounded border-secondary accent-brand-600" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="rounded-xl border border-secondary bg-primary p-4 sm:p-6">
                <h3 className="mb-3 text-sm font-semibold text-primary">Email Digest</h3>
                <div className="flex flex-col gap-2">
                    {DIGEST_OPTIONS.map((opt) => (
                        <label key={opt.value} className={cx("flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5", digest === opt.value ? "border-brand-600 bg-brand-primary" : "border-secondary hover:bg-primary_hover")}>
                            <input type="radio" name="digest" value={opt.value} checked={digest === opt.value} onChange={() => setDigest(opt.value)} className="sr-only" />
                            <div className={cx("flex size-4 items-center justify-center rounded-full border-2", digest === opt.value ? "border-brand-600" : "border-tertiary")}>
                                {digest === opt.value && <div className="size-2 rounded-full bg-brand-600" />}
                            </div>
                            <span className={cx("text-sm font-medium", digest === opt.value ? "text-brand-secondary" : "text-primary")}>{opt.label}</span>
                            <span className="text-xs text-tertiary">({opt.description})</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Settings Page
// ---------------------------------------------------------------------------

const TAB_MAP: Record<string, string> = {
    organization: "organisation",
    // "profile" is an alias for the organisation tab — it shows the clinic's
    // registered profile (name, CQC IDs, registered manager, address). Users
    // reach this via the sidebar menu's "View profile" item.
    profile: "organisation",
    users: "users",
    billing: "billing",
    integrations: "integrations",
    notifications: "notifications",
    "audit-log": "audit-log",
    audits: "audit-log",
    reports: "reports",
};

export default function SettingsPage() {
    const router = useRouter();
    const params = useSearchParams();

    const tabFromUrl = params.get("tab");
    const initialTab = (tabFromUrl && TAB_MAP[tabFromUrl]) ? TAB_MAP[tabFromUrl] : (tabFromUrl ?? "organisation");

    const [selectedTab, setSelectedTab] = useState<Key>(initialTab);

    // Sync tab state when URL search params change (e.g. navigating from another page)
    useEffect(() => {
        const t = params.get("tab");
        const resolved = (t && TAB_MAP[t]) ? TAB_MAP[t] : (t ?? "organisation");
        setSelectedTab(resolved);
    }, [params]);

    const handleTabChange = (key: Key) => {
        setSelectedTab(key);
        const url = key === "organisation" ? "/settings" : `/settings?tab=${String(key)}`;
        window.history.replaceState({}, "", url);
    };

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div>
                <h1 className="text-display-xs font-semibold text-primary">Settings</h1>
                <p className="mt-1 text-sm text-tertiary">Manage your organisation and platform settings.</p>
            </div>

            <NativeSelect
                aria-label="Settings section"
                value={selectedTab as string}
                onChange={(event) => handleTabChange(event.target.value)}
                options={tabs.map((tab) => ({ label: tab.label, value: tab.id }))}
                className="w-full md:hidden"
            />

            <Tabs selectedKey={selectedTab} onSelectionChange={handleTabChange} className="max-md:hidden">
                <Tabs.List type="underline" items={tabs}>
                    {(tab) => <Tabs.Item {...tab} />}
                </Tabs.List>
            </Tabs>

            <div className="mt-2">
                {selectedTab === "organisation" && <OrganisationPanel />}
                {selectedTab === "users" && <UsersPanel />}
                {selectedTab === "billing" && <BillingPanel />}
                {selectedTab === "integrations" && <IntegrationsPanel />}
                {selectedTab === "notifications" && <NotificationsPanel />}
                {selectedTab === "audit-log" && <AuditLogPanel />}
                {selectedTab === "reports" && <ReportsPanel />}
            </div>
        </div>
    );
}
