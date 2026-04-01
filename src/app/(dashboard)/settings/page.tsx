"use client";

import { useState, useRef, useEffect, useCallback, type FC } from "react";
import type { Key } from "react-aria-components";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Building07, Users01, CreditCard02, PuzzlePiece01, Bell01,
    Lock01, AlertTriangle, Plus, ChevronLeft, DotsVertical, X,
    CheckCircle, Zap, ArrowUpRight,
    Copy01, Key01, RefreshCw01, Trash01, AlertCircle, Link01, LinkBroken01,
} from "@untitledui/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "@/components/application/tabs/tabs";
import { NativeSelect } from "@/components/base/select/select-native";
import { Input } from "@/components/base/input/input";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { PricingCard } from "@/components/application/pricing-card/pricing-card";
import { useOrganization } from "@/hooks/use-organization";
import { cx } from "@/utils/cx";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const tabs = [
    { id: "organisation", label: "Organisation" },
    { id: "users", label: "Users" },
    { id: "billing", label: "Billing" },
    { id: "integrations", label: "Integrations" },
    { id: "notifications", label: "Notifications" },
];

// ---------------------------------------------------------------------------
// Organisation Tab
// ---------------------------------------------------------------------------

function OrganisationPanel() {
    const { data: org, isLoading, error } = useOrganization();

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 animate-pulse">
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-primary">Organisation Details</h2>
                    <p className="mt-1 text-sm text-tertiary">Manage your organisation name, CQC IDs, and service details.</p>
                </div>
                <Button color="primary" size="lg">Save</Button>
            </div>

            <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6">
                <Input label="Organisation name *" defaultValue={org.name} isRequired />

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-primary">Service type</label>
                    <div className="flex items-center gap-3 rounded-lg border border-secondary bg-disabled_subtle px-3 py-2.5">
                        <span className="text-sm text-primary">{org.serviceType === "CARE_HOME" ? "Care Home" : "Aesthetic Clinic"}</span>
                        <Lock01 className="size-4 text-fg-disabled" />
                        <span className="text-xs text-tertiary">Cannot change after onboarding</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input label="CQC Provider ID" defaultValue={org.cqcProviderId} />
                    <Input label="CQC Location ID" defaultValue={org.cqcLocationId} />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input label="Registered Manager" defaultValue={org.registeredManager} />
                    <Input label="Number of beds" type="number" defaultValue={String(org.bedCount)} isRequired />
                </div>

                <Input label="Address" defaultValue={org.postcode} />
            </div>

            <div className="rounded-xl border border-error-primary bg-primary p-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-error-primary" />
                    <div className="flex-1">
                        <h2 className="text-sm font-semibold text-error-primary">Danger Zone</h2>
                        <p className="mt-1 text-sm text-tertiary">Permanently delete this organisation and all its data. This action cannot be undone.</p>
                    </div>
                    <Button color="primary-destructive" size="sm">Delete Organisation</Button>
                </div>
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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-primary">Team Members</h2>
                    <p className="mt-1 text-sm text-tertiary">
                        {listLoading ? "Loading…" : `${users.length} members`}
                    </p>
                </div>
                <Button color="primary" size="lg" iconLeading={Plus} onClick={() => setShowInvite(true)}>Invite User</Button>
            </div>

            {listError && <p className="text-sm text-error-primary" role="alert">{listError}</p>}

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
                        <div className="mt-6 flex justify-end gap-3">
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
        <div className="flex flex-col gap-6">
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
                        <div className="rounded-xl border border-secondary bg-primary p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
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

                    <div className="grid gap-4 sm:grid-cols-3">
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
                        <div className="rounded-xl border border-secondary bg-primary p-6">
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

const INTEGRATIONS = [
    { id: "cqc", name: "CQC API", description: "Automatically sync your CQC profile and inspection data", connected: true },
    { id: "nhs", name: "NHS DSPT", description: "Data Security and Protection Toolkit compliance sync", connected: false },
    { id: "google", name: "Google Workspace", description: "Import documents and share reports via Google Drive", connected: true },
    { id: "ms365", name: "Microsoft 365", description: "OneDrive document storage and Teams notifications", connected: false },
    { id: "slack", name: "Slack", description: "Receive compliance alerts and task notifications", connected: false },
];

const MOCK_WEBHOOK_URL = "https://api.consentz.com/webhooks/cqc-compliance";

function IntegrationsPanel() {
    const queryClient = useQueryClient();
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
        onSuccess: (data) => { setRevealedKey(data.key); setRevealedKeyId(data.id); queryClient.invalidateQueries({ queryKey: ["sdk-keys"] }); },
    });

    const rotateMutation = useMutation({
        mutationFn: (id: string) => apiPatch<SdkKey & { key: string }>(`/api/sdk/keys/${id}`, {}).then((r) => r.data),
        onSuccess: (data) => { setRevealedKey(data.key); setRevealedKeyId(data.id); queryClient.invalidateQueries({ queryKey: ["sdk-keys"] }); },
    });

    const revokeMutation = useMutation({
        mutationFn: (id: string) => apiDelete(`/api/sdk/keys/${id}`),
        onSuccess: () => { setConfirmRevokeId(null); queryClient.invalidateQueries({ queryKey: ["sdk-keys"] }); },
    });

    const { data: consentzStatus, isLoading: consentzLoading } = useQuery({
        queryKey: ["consentz-status"],
        queryFn: () => apiGet<{ connected: boolean; clinicId: number | null; username: string | null }>("/api/consentz/connect").then((r) => r.data),
    });

    const connectMutation = useMutation({
        mutationFn: () => apiPost<{ connected: boolean; clinicId: number; clinicName: string }>("/api/consentz/connect", { username: consentzUser, password: consentzPass }).then((r) => r.data),
        onSuccess: () => { setConsentzUser(""); setConsentzPass(""); queryClient.invalidateQueries({ queryKey: ["consentz-status"] }); },
    });

    const disconnectMutation = useMutation({
        mutationFn: () => apiDelete("/api/consentz/connect"),
        onSuccess: () => { setShowDisconnectConfirm(false); queryClient.invalidateQueries({ queryKey: ["consentz-status"] }); },
    });

    const syncMutation = useMutation({
        mutationFn: () => apiPost<{ synced: boolean }>("/api/consentz/sync", {}),
    });

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-lg font-semibold text-primary">Integrations</h2>
                <p className="mt-1 text-sm text-tertiary">Connect services, manage API keys, and configure the Consentz SDK.</p>
            </div>

            {/* Consentz Platform Connection */}
            <div className={cx("rounded-xl border bg-primary p-6", consentzStatus?.connected ? "border-success" : "border-brand-300")}>
                <div className="flex items-center gap-3">
                    <div className={cx("flex size-10 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold", consentzStatus?.connected ? "bg-success-secondary text-fg-success-primary" : "bg-brand-primary text-brand-secondary")}>
                        {consentzStatus?.connected ? <CheckCircle className="size-5" /> : <Link01 className="size-5" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-primary">Consentz Platform</h3>
                            {consentzLoading ? <Badge size="sm" color="gray" type="pill-color">Checking...</Badge> : consentzStatus?.connected ? <Badge size="sm" color="success" type="pill-color">Connected</Badge> : <Badge size="sm" color="warning" type="pill-color">Not Connected</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-tertiary">Connect your Consentz clinic management system to automatically import consent forms, appointment data, staff credentials, and patient feedback as compliance evidence.</p>
                    </div>
                </div>

                {consentzStatus?.connected ? (
                    <div className="mt-4 space-y-3">
                        <div className="rounded-lg border border-secondary bg-secondary px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-primary">Clinic ID: {consentzStatus.clinicId}</p>
                                    <p className="text-xs text-tertiary">Connected as {consentzStatus.username}</p>
                                </div>
                                <div className="flex gap-2">
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
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-primary">API Keys</h3>
                        <p className="mt-1 text-sm text-tertiary">Use API keys to authenticate requests to the Consentz Compliance API.</p>
                    </div>
                    <Button color="primary" size="sm" iconLeading={Plus} isLoading={generateMutation.isPending} onClick={() => generateMutation.mutate("API Key")}>Generate New Key</Button>
                </div>

                {revealedKey && (
                    <div className="mb-4 rounded-lg border border-warning-300 bg-warning-primary p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 size-5 shrink-0 text-fg-warning-primary" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-primary">Copy your API key now</p>
                                <p className="mt-0.5 text-xs text-tertiary">This key will only be shown once.</p>
                                <div className="mt-3 flex items-center gap-2">
                                    <code className="flex-1 rounded-md bg-primary px-3 py-2 font-mono text-xs text-primary break-all border border-secondary">{revealedKey}</code>
                                    <Button color="secondary" size="sm" iconLeading={Copy01} onClick={() => handleCopy(revealedKey, "revealed")}>{copiedId === "revealed" ? "Copied!" : "Copy"}</Button>
                                </div>
                                <div className="mt-2">
                                    <Button color="link-gray" size="sm" onClick={() => { setRevealedKey(null); setRevealedKeyId(null); }}>Dismiss</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col gap-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="animate-pulse rounded-lg border border-secondary p-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2"><div className="h-4 w-32 rounded bg-tertiary" /><div className="h-3 w-24 rounded bg-tertiary" /></div>
                                    <div className="h-5 w-16 rounded-full bg-tertiary" />
                                </div>
                                <div className="mt-3 h-8 w-full rounded bg-tertiary" />
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && keys.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-secondary py-10">
                        <Key01 className="size-8 text-fg-quaternary" />
                        <p className="mt-3 text-sm font-medium text-primary">No API keys generated yet</p>
                        <p className="mt-1 text-xs text-tertiary">Generate a key to start using the Consentz Compliance API.</p>
                        <div className="mt-4">
                            <Button color="primary" size="sm" isLoading={generateMutation.isPending} onClick={() => generateMutation.mutate("API Key")}>Generate Your First Key</Button>
                        </div>
                    </div>
                )}

                {!isLoading && keys.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {keys.map((key) => {
                            const isActive = key.status === "ACTIVE";
                            const isRevealed = revealedKeyId === key.id && revealedKey;
                            return (
                                <div key={key.id} className={cx("rounded-lg border", isRevealed ? "border-brand bg-brand-section_subtle" : "border-secondary")}>
                                    <div className="flex items-center justify-between border-b border-secondary px-4 py-3">
                                        <div>
                                            <p className="text-sm font-medium text-primary">{key.name}</p>
                                            <p className="text-xs text-tertiary">Created {formatDate(key.created_at)}{key.last_used_at && <> &middot; Last used {formatDate(key.last_used_at)}</>}</p>
                                        </div>
                                        <Badge size="sm" color={isActive ? "success" : "gray"} type="pill-color">{isActive ? "Active" : "Revoked"}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-3">
                                        <code className="flex-1 rounded-md bg-secondary px-3 py-2 font-mono text-xs text-primary">{key.key_prefix}{"••••••••••••"}</code>
                                        <button onClick={() => handleCopy(key.key_prefix, key.id)} className="rounded-lg p-2 transition duration-100 ease-linear hover:bg-primary_hover" title="Copy prefix">
                                            <Copy01 className="size-4 text-fg-quaternary" />
                                        </button>
                                    </div>
                                    {copiedId === key.id && <p className="px-4 pb-3 text-xs text-success-primary">Copied to clipboard!</p>}
                                    {isActive && (
                                        <div className="flex items-center gap-2 border-t border-secondary px-4 py-3">
                                            <Button color="secondary" size="sm" iconLeading={RefreshCw01} isLoading={rotateMutation.isPending} onClick={() => rotateMutation.mutate(key.id)}>Rotate Key</Button>
                                            {confirmRevokeId === key.id ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-error-primary">Are you sure?</span>
                                                    <Button color="primary-destructive" size="sm" isLoading={revokeMutation.isPending} onClick={() => revokeMutation.mutate(key.id)}>Confirm Revoke</Button>
                                                    <Button color="secondary" size="sm" onClick={() => setConfirmRevokeId(null)}>Cancel</Button>
                                                </div>
                                            ) : (
                                                <Button color="primary-destructive" size="sm" iconLeading={Trash01} onClick={() => setConfirmRevokeId(key.id)}>Revoke</Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {generateMutation.isError && <p className="mt-2 text-xs text-error-primary">Failed to generate key. Please try again.</p>}
                {revokeMutation.isError && <p className="mt-2 text-xs text-error-primary">Failed to revoke key. Please try again.</p>}
                {rotateMutation.isError && <p className="mt-2 text-xs text-error-primary">Failed to rotate key. Please try again.</p>}
            </div>

            {/* Webhooks */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-primary">Webhooks</h3>
                        <p className="mt-1 text-sm text-tertiary">Receive real-time notifications when compliance events occur.</p>
                    </div>
                    <Button color="primary" size="sm">Add Endpoint</Button>
                </div>
                <div className="rounded-lg border border-secondary">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <code className="rounded bg-secondary px-2 py-0.5 font-mono text-xs text-primary">{MOCK_WEBHOOK_URL}</code>
                                <Badge size="sm" color="success" type="pill-color">Active</Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                {["gap.created", "score.changed", "evidence.uploaded", "incident.reported"].map((evt) => (
                                    <span key={evt} className="rounded bg-secondary px-1.5 py-0.5 text-xs text-tertiary">{evt}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button color="secondary" size="sm">Edit</Button>
                            <Button color="primary-destructive" size="sm">Delete</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Third-party integrations */}
            <div>
                <h3 className="mb-4 text-lg font-semibold text-primary">Third-Party Services</h3>
                <div className="flex flex-col gap-4">
                    {INTEGRATIONS.map((int) => (
                        <div key={int.id} className="flex items-center gap-4 rounded-xl border border-secondary bg-primary p-5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary font-mono text-xs font-bold text-tertiary">{int.name.slice(0, 2).toUpperCase()}</div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-primary">{int.name}</p>
                                    {int.connected && <Badge size="sm" color="success" type="pill-color">Connected</Badge>}
                                </div>
                                <p className="mt-0.5 text-xs text-tertiary">{int.description}</p>
                            </div>
                            <Button color={int.connected ? "secondary" : "primary"} size="sm">{int.connected ? "Configure" : "Connect"}</Button>
                        </div>
                    ))}
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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-primary">Notification Preferences</h2>
                    <p className="mt-1 text-sm text-tertiary">Choose which notifications you receive by email. All notifications appear in-app regardless.</p>
                </div>
                <Button color="primary" size="lg">Save</Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-secondary">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-secondary bg-secondary">
                            <th className="px-4 py-3 text-left text-xs font-medium text-tertiary">Notification Type</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-tertiary">In-App</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-tertiary">Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {NOTIFICATION_PREFS.map((pref, i) => (
                            <tr key={pref.id} className={i < NOTIFICATION_PREFS.length - 1 ? "border-b border-secondary" : ""}>
                                <td className="px-4 py-3"><p className="text-sm font-medium text-primary">{pref.label}</p></td>
                                <td className="px-4 py-3 text-center"><span className="text-xs font-medium text-tertiary">Always</span></td>
                                <td className="px-4 py-3 text-center"><input type="checkbox" defaultChecked={pref.email} className="size-4 rounded border-secondary accent-brand-600" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="rounded-xl border border-secondary bg-primary p-6">
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
    users: "users",
    billing: "billing",
    integrations: "integrations",
    notifications: "notifications",
};

export default function SettingsPage() {
    const router = useRouter();
    const params = useSearchParams();

    const tabFromUrl = params.get("tab");
    const initialTab = (tabFromUrl && TAB_MAP[tabFromUrl]) ? TAB_MAP[tabFromUrl] : (tabFromUrl ?? "organisation");

    const [selectedTab, setSelectedTab] = useState<Key>(initialTab);

    const handleTabChange = (key: Key) => {
        setSelectedTab(key);
        const url = key === "organisation" ? "/settings" : `/settings?tab=${String(key)}`;
        window.history.replaceState({}, "", url);
    };

    return (
        <div className="flex flex-col gap-6">
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
            </div>
        </div>
    );
}
