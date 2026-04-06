"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings01, Sliders01, RefreshCw05, Mail01, Shield01, Trash01, Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { Avatar } from "@/components/base/avatar/avatar";
import { cx } from "@/utils/cx";
import { toast } from "@/lib/toast";

interface PlatformSettings {
    feature_flags: Record<string, boolean>;
    scoring_weights: Record<string, number>;
    sync_frequency_hours: number;
}

const FLAG_META: Record<string, { label: string; description: string }> = {
    ai_chat: { label: "AI Chat", description: "Enable the AI compliance assistant for all users." },
    onboarding: { label: "Onboarding Walkthrough", description: "Show the guided onboarding flow for new users." },
    consentz_sync: { label: "Consentz Sync", description: "Enable automatic data sync from Consentz." },
    policy_autogen: { label: "Policy Auto-Generation", description: "Allow AI-generated compliance policies." },
    maintenance_mode: { label: "Maintenance Mode", description: "Show maintenance page to all non-admin users." },
};

function SettingsSection({ title, icon: Icon, children }: { title: string; icon: React.FC<{ className?: string }>; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-secondary bg-primary shadow-xs">
            <div className="flex items-center gap-3 border-b border-secondary px-5 py-4">
                <Icon className="size-5 text-fg-quaternary" />
                <h2 className="text-md font-semibold text-primary">{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function Toggle({ enabled, onToggle, label, description }: { enabled: boolean; onToggle: () => void; label: string; description: string }) {
    return (
        <div className="flex items-center justify-between py-3">
            <div>
                <p className="text-sm font-medium text-primary">{label}</p>
                <p className="text-xs text-tertiary">{description}</p>
            </div>
            <button
                onClick={onToggle}
                className={cx(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
                    enabled ? "bg-brand-solid" : "bg-quaternary"
                )}
            >
                <span className={cx("inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200", enabled ? "translate-x-6" : "translate-x-1")} />
            </button>
        </div>
    );
}

interface PlatformAdmin {
    id: string;
    auth_user_id: string;
    email: string;
    platform_role: string;
    created_at: string;
    created_by: string;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"super_admin" | "support_admin">("support_admin");
    const [inviting, setInviting] = useState(false);

    const loadAdmins = useCallback(() => {
        fetch("/api/admin/admins")
            .then((r) => r.json())
            .then((d) => { if (Array.isArray(d.data)) setAdmins(d.data); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then((r) => r.json())
            .then((d) => setSettings(d.data))
            .catch(() => {});
        loadAdmins();
    }, [loadAdmins]);

    const toggleFlag = useCallback((key: string) => {
        setSettings((prev) => {
            if (!prev) return prev;
            const newValue = !prev.feature_flags[key];
            const label = FLAG_META[key]?.label ?? key;
            toast.info(`${label} ${newValue ? "enabled" : "disabled"}`, "Remember to save your changes.");
            return { ...prev, feature_flags: { ...prev.feature_flags, [key]: newValue } };
        });
        setDirty(true);
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                toast.success("Settings saved", "Platform settings have been updated.");
                setDirty(false);
            } else {
                toast.error("Error", "Failed to save settings.");
            }
        } catch {
            toast.error("Error", "Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (!settings) {
        return (
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Platform Settings</h1>
                    <p className="mt-1 text-sm text-tertiary">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">Platform Settings</h1>
                    <p className="mt-1 text-sm text-tertiary">Global configuration for the Consentz platform.</p>
                </div>
                <Button size="md" color="primary" onClick={handleSave} isLoading={saving} isDisabled={!dirty}>
                    Save Settings
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <SettingsSection title="Feature Flags" icon={Sliders01}>
                    <div className="divide-y divide-secondary">
                        {Object.entries(FLAG_META).map(([key, meta]) => (
                            <Toggle
                                key={key}
                                enabled={settings.feature_flags[key] ?? false}
                                onToggle={() => toggleFlag(key)}
                                label={meta.label}
                                description={meta.description}
                            />
                        ))}
                    </div>
                </SettingsSection>

                <SettingsSection title="Compliance Engine" icon={Settings01}>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-primary">Scoring Weights</p>
                            <p className="text-xs text-tertiary">Equal weighting (20% each) across all 5 CQC domains.</p>
                            <div className="mt-3 grid grid-cols-5 gap-2">
                                {Object.entries(settings.scoring_weights).map(([domain, weight]) => (
                                    <div key={domain} className="flex flex-col items-center rounded-lg border border-secondary p-2">
                                        <span className="text-xs text-tertiary capitalize">{domain.replace(/_/g, " ")}</span>
                                        <span className="text-sm font-semibold text-primary">{weight}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-primary">Score Thresholds</p>
                            <div className="mt-2 space-y-1.5">
                                {[
                                    { label: "Outstanding", range: "≥90%", color: "bg-success-solid" },
                                    { label: "Good", range: "75-89%", color: "bg-brand-solid" },
                                    { label: "Requires Improvement", range: "50-74%", color: "bg-warning-solid" },
                                    { label: "Inadequate", range: "<50%", color: "bg-error-solid" },
                                ].map(({ label, range, color }) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <div className={cx("size-3 rounded-full", color)} />
                                        <span className="text-sm text-primary">{label}</span>
                                        <span className="text-xs text-tertiary">{range}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </SettingsSection>

                <SettingsSection title="Sync Settings" icon={RefreshCw05}>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-primary">Sync Frequency</p>
                                <p className="text-xs text-tertiary">How often data syncs from Consentz.</p>
                            </div>
                            <span className="rounded-lg bg-brand-secondary px-3 py-1 text-sm font-medium text-brand-primary">
                                Every {settings.sync_frequency_hours} hours
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-primary">API Base URL</p>
                                <p className="text-xs text-tertiary">Target Consentz environment.</p>
                            </div>
                            <span className="rounded-lg bg-warning-secondary px-3 py-1 text-xs font-medium text-warning-primary">staging.consentz.com</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-primary">Retry Policy</p>
                                <p className="text-xs text-tertiary">Retries on failed sync attempts.</p>
                            </div>
                            <span className="text-sm text-secondary">3 retries, exponential backoff</span>
                        </div>
                    </div>
                </SettingsSection>

                <SettingsSection title="Email & Subscription" icon={Mail01}>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-primary">Sender Address</p>
                                <p className="text-xs text-tertiary">Via Resend email service.</p>
                            </div>
                            <span className="text-sm text-secondary">mail@consentz.com</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-primary">Primary Plan</p>
                                <p className="text-xs text-tertiary">Default active subscription tier.</p>
                            </div>
                            <span className="text-sm font-medium text-primary">£200/month (Professional)</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-primary">Trial Duration</p>
                                <p className="text-xs text-tertiary">Free trial period for new orgs.</p>
                            </div>
                            <span className="text-sm text-secondary">14 days</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-primary">Payment Grace Period</p>
                                <p className="text-xs text-tertiary">Days before suspension on failed payment.</p>
                            </div>
                            <span className="text-sm text-secondary">7 days</span>
                        </div>
                    </div>
                </SettingsSection>
            </div>

            {/* Admin Accounts Management */}
            <div className="rounded-xl border border-secondary bg-primary shadow-xs">
                <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
                    <div className="flex items-center gap-3">
                        <Shield01 className="size-5 text-fg-quaternary" />
                        <div>
                            <h2 className="text-md font-semibold text-primary">Platform Administrators</h2>
                            <p className="text-xs text-tertiary">Manage who has access to this admin panel.</p>
                        </div>
                    </div>
                    <Button size="sm" color="primary" iconLeading={Plus} onClick={() => setShowInvite(!showInvite)}>
                        Add Admin
                    </Button>
                </div>

                {showInvite && (
                    <div className="border-b border-secondary bg-secondary_subtle px-5 py-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex-1">
                                <label className="mb-1 block text-xs font-medium text-secondary">Email Address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="admin@company.com"
                                    className="w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-secondary">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as "super_admin" | "support_admin")}
                                    className="rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand"
                                >
                                    <option value="support_admin">Support Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                            <Button
                                size="sm"
                                color="primary"
                                isLoading={inviting}
                                isDisabled={!inviteEmail.includes("@")}
                                onClick={async () => {
                                    setInviting(true);
                                    try {
                                        const res = await fetch("/api/admin/admins", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                            toast.success("Admin invited", `${inviteEmail} has been added as ${inviteRole.replace(/_/g, " ")}.`);
                                            setInviteEmail("");
                                            setShowInvite(false);
                                            loadAdmins();
                                        } else {
                                            toast.error("Failed", data.error?.message ?? "Could not invite admin.");
                                        }
                                    } catch {
                                        toast.error("Error", "Failed to invite admin.");
                                    } finally {
                                        setInviting(false);
                                    }
                                }}
                            >
                                Send Invite
                            </Button>
                            <Button size="sm" color="tertiary" onClick={() => { setShowInvite(false); setInviteEmail(""); }}>
                                Cancel
                            </Button>
                        </div>
                        <p className="mt-2 text-xs text-tertiary">
                            If the email doesn't have an account, one will be created and a password reset link will be sent.
                        </p>
                    </div>
                )}

                <div className="divide-y divide-secondary">
                    {admins.map((a) => (
                        <div key={a.id} className="flex items-center justify-between px-5 py-3">
                            <div className="flex items-center gap-3">
                                <Avatar size="sm" initials={a.email.charAt(0).toUpperCase()} />
                                <div>
                                    <p className="text-sm font-medium text-primary">{a.email}</p>
                                    <p className="text-xs text-tertiary">Added by {a.created_by} · {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge size="sm" color={a.platform_role === "super_admin" ? "brand" : "gray"}>
                                    {a.platform_role.replace(/_/g, " ")}
                                </Badge>
                                <button
                                    onClick={async () => {
                                        if (!window.confirm(`Remove ${a.email} from platform admins?`)) return;
                                        try {
                                            const res = await fetch("/api/admin/admins", {
                                                method: "DELETE",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ adminId: a.id }),
                                            });
                                            if (res.ok) {
                                                toast.success("Admin removed", `${a.email} has been removed.`);
                                                loadAdmins();
                                            } else {
                                                const d = await res.json();
                                                toast.error("Failed", d.error?.message ?? "Could not remove admin.");
                                            }
                                        } catch {
                                            toast.error("Error", "Failed to remove admin.");
                                        }
                                    }}
                                    className="flex size-8 items-center justify-center rounded-lg text-fg-tertiary transition duration-100 hover:bg-primary_hover hover:text-fg-error-primary"
                                    aria-label="Remove admin"
                                >
                                    <Trash01 className="size-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {admins.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-tertiary">No admin accounts found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
