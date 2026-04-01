"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Copy01, Key01, RefreshCw01, Trash01, AlertCircle, Plus, CheckCircle, Link01, LinkBroken01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SdkKey {
    id: string;
    name: string;
    key_prefix: string;
    key?: string; // full key, only present right after generation
    status: "ACTIVE" | "REVOKED";
    created_at: string;
    last_used_at: string | null;
}

// ---------------------------------------------------------------------------
// Static data (unchanged sections)
// ---------------------------------------------------------------------------

const INTEGRATIONS = [
    { id: "cqc", name: "CQC API", description: "Automatically sync your CQC profile and inspection data", connected: true },
    { id: "nhs", name: "NHS DSPT", description: "Data Security and Protection Toolkit compliance sync", connected: false },
    { id: "google", name: "Google Workspace", description: "Import documents and share reports via Google Drive", connected: true },
    { id: "ms365", name: "Microsoft 365", description: "OneDrive document storage and Teams notifications", connected: false },
    { id: "slack", name: "Slack", description: "Receive compliance alerts and task notifications", connected: false },
];

const MOCK_WEBHOOK_URL = "https://api.consentz.com/webhooks/cqc-compliance";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function IntegrationsSettingsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

    // Consentz connection state
    const [consentzUser, setConsentzUser] = useState("");
    const [consentzPass, setConsentzPass] = useState("");
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

    // -----------------------------------------------------------------------
    // Queries & Mutations
    // -----------------------------------------------------------------------

    const { data: keys = [], isLoading } = useQuery({
        queryKey: ["sdk-keys"],
        queryFn: () => apiGet<SdkKey[]>("/api/sdk/keys").then((r) => r.data),
    });

    const generateMutation = useMutation({
        mutationFn: (name: string) =>
            apiPost<SdkKey & { key: string }>("/api/sdk/keys", { name }).then((r) => r.data),
        onSuccess: (data) => {
            setRevealedKey(data.key);
            setRevealedKeyId(data.id);
            queryClient.invalidateQueries({ queryKey: ["sdk-keys"] });
        },
    });

    const rotateMutation = useMutation({
        mutationFn: (id: string) =>
            apiPatch<SdkKey & { key: string }>(`/api/sdk/keys/${id}`, {}).then((r) => r.data),
        onSuccess: (data) => {
            setRevealedKey(data.key);
            setRevealedKeyId(data.id);
            queryClient.invalidateQueries({ queryKey: ["sdk-keys"] });
        },
    });

    const revokeMutation = useMutation({
        mutationFn: (id: string) => apiDelete(`/api/sdk/keys/${id}`),
        onSuccess: () => {
            setConfirmRevokeId(null);
            queryClient.invalidateQueries({ queryKey: ["sdk-keys"] });
        },
    });

    // -----------------------------------------------------------------------
    // Consentz Connection
    // -----------------------------------------------------------------------

    const { data: consentzStatus, isLoading: consentzLoading } = useQuery({
        queryKey: ["consentz-status"],
        queryFn: () => apiGet<{ connected: boolean; clinicId: number | null; username: string | null }>("/api/consentz/connect").then((r) => r.data),
    });

    const connectMutation = useMutation({
        mutationFn: () =>
            apiPost<{ connected: boolean; clinicId: number; clinicName: string }>("/api/consentz/connect", {
                username: consentzUser,
                password: consentzPass,
            }).then((r) => r.data),
        onSuccess: () => {
            setConsentzUser("");
            setConsentzPass("");
            queryClient.invalidateQueries({ queryKey: ["consentz-status"] });
        },
    });

    const disconnectMutation = useMutation({
        mutationFn: () => apiDelete("/api/consentz/connect"),
        onSuccess: () => {
            setShowDisconnectConfirm(false);
            queryClient.invalidateQueries({ queryKey: ["consentz-status"] });
        },
    });

    const syncMutation = useMutation({
        mutationFn: () => apiPost<{ synced: boolean }>("/api/consentz/sync", {}),
    });

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/settings")}>Settings</Button>

            <div>
                <h1 className="text-display-xs font-semibold text-primary">Integrations</h1>
                <p className="mt-1 text-sm text-tertiary">Connect services, manage API keys, and configure the Consentz SDK.</p>
            </div>

            {/* Consentz Platform Connection */}
            <div className={cx(
                "rounded-xl border bg-primary p-6",
                consentzStatus?.connected ? "border-success" : "border-brand-300",
            )}>
                <div className="flex items-center gap-3">
                    <div className={cx(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold",
                        consentzStatus?.connected ? "bg-success-secondary text-fg-success-primary" : "bg-brand-primary text-brand-secondary",
                    )}>
                        {consentzStatus?.connected ? <CheckCircle className="size-5" /> : <Link01 className="size-5" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-primary">Consentz Platform</h2>
                            {consentzLoading ? (
                                <Badge size="sm" color="gray" type="pill-color">Checking...</Badge>
                            ) : consentzStatus?.connected ? (
                                <Badge size="sm" color="success" type="pill-color">Connected</Badge>
                            ) : (
                                <Badge size="sm" color="warning" type="pill-color">Not Connected</Badge>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-tertiary">
                            Connect your Consentz clinic management system to automatically import consent forms, appointment data, staff credentials, and patient feedback as compliance evidence.
                        </p>
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
                                    <Button
                                        color="secondary"
                                        size="sm"
                                        iconLeading={RefreshCw01}
                                        isLoading={syncMutation.isPending}
                                        onClick={() => syncMutation.mutate()}
                                    >
                                        {syncMutation.isSuccess ? "Synced!" : "Sync Now"}
                                    </Button>
                                    {showDisconnectConfirm ? (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                color="primary-destructive"
                                                size="sm"
                                                isLoading={disconnectMutation.isPending}
                                                onClick={() => disconnectMutation.mutate()}
                                            >
                                                Confirm
                                            </Button>
                                            <Button color="secondary" size="sm" onClick={() => setShowDisconnectConfirm(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            color="tertiary-destructive"
                                            size="sm"
                                            iconLeading={LinkBroken01}
                                            onClick={() => setShowDisconnectConfirm(true)}
                                        >
                                            Disconnect
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {syncMutation.isError && (
                            <p className="text-xs text-error-primary">Sync failed. Please try again.</p>
                        )}
                    </div>
                ) : (
                    <div className="mt-4 space-y-3">
                        <div className="rounded-lg border border-secondary bg-secondary p-4">
                            <p className="mb-3 text-xs text-tertiary">
                                Enter your Consentz platform credentials to connect. Data will sync automatically every 6 hours.
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Input
                                    label="Username"
                                    placeholder="your-username"
                                    size="sm"
                                    value={consentzUser}
                                    onChange={setConsentzUser}
                                />
                                <Input
                                    label="Password"
                                    placeholder="••••••••"
                                    size="sm"
                                    type="password"
                                    value={consentzPass}
                                    onChange={setConsentzPass}
                                />
                            </div>
                            <div className="mt-3">
                                <Button
                                    color="primary"
                                    size="sm"
                                    iconLeading={Link01}
                                    isLoading={connectMutation.isPending}
                                    isDisabled={!consentzUser || !consentzPass}
                                    onClick={() => connectMutation.mutate()}
                                >
                                    Connect to Consentz
                                </Button>
                            </div>
                            {connectMutation.isError && (
                                <p className="mt-2 text-xs text-error-primary">
                                    Connection failed. Please check your credentials and try again.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* API Keys */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-primary">API Keys</h2>
                        <p className="mt-1 text-sm text-tertiary">Use API keys to authenticate requests to the Consentz Compliance API.</p>
                    </div>
                    <Button
                        color="primary"
                        size="sm"
                        iconLeading={Plus}
                        isLoading={generateMutation.isPending}
                        onClick={() => generateMutation.mutate("API Key")}
                    >
                        Generate New Key
                    </Button>
                </div>

                {/* Newly generated / rotated key banner */}
                {revealedKey && (
                    <div className="mb-4 rounded-lg border border-warning-300 bg-warning-primary p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 size-5 shrink-0 text-fg-warning-primary" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-primary">Copy your API key now</p>
                                <p className="mt-0.5 text-xs text-tertiary">This key will only be shown once. Copy it now and store it securely.</p>
                                <div className="mt-3 flex items-center gap-2">
                                    <code className="flex-1 rounded-md bg-primary px-3 py-2 font-mono text-xs text-primary break-all border border-secondary">
                                        {revealedKey}
                                    </code>
                                    <Button
                                        color="secondary"
                                        size="sm"
                                        iconLeading={Copy01}
                                        onClick={() => handleCopy(revealedKey, "revealed")}
                                    >
                                        {copiedId === "revealed" ? "Copied!" : "Copy"}
                                    </Button>
                                </div>
                                <div className="mt-2">
                                    <Button color="link-gray" size="sm" onClick={() => { setRevealedKey(null); setRevealedKeyId(null); }}>
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading skeleton */}
                {isLoading && (
                    <div className="flex flex-col gap-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="animate-pulse rounded-lg border border-secondary p-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 rounded bg-tertiary" />
                                        <div className="h-3 w-24 rounded bg-tertiary" />
                                    </div>
                                    <div className="h-5 w-16 rounded-full bg-tertiary" />
                                </div>
                                <div className="mt-3 h-8 w-full rounded bg-tertiary" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && keys.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-secondary py-10">
                        <Key01 className="size-8 text-fg-quaternary" />
                        <p className="mt-3 text-sm font-medium text-primary">No API keys generated yet</p>
                        <p className="mt-1 text-xs text-tertiary">Generate a key to start using the Consentz Compliance API.</p>
                        <div className="mt-4">
                            <Button
                                color="primary"
                                size="sm"
                                isLoading={generateMutation.isPending}
                                onClick={() => generateMutation.mutate("API Key")}
                            >
                                Generate Your First Key
                            </Button>
                        </div>
                    </div>
                )}

                {/* Key list */}
                {!isLoading && keys.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {keys.map((key) => {
                            const isActive = key.status === "ACTIVE";
                            const isRevealed = revealedKeyId === key.id && revealedKey;
                            return (
                                <div
                                    key={key.id}
                                    className={cx(
                                        "rounded-lg border",
                                        isRevealed ? "border-brand bg-brand-section_subtle" : "border-secondary",
                                    )}
                                >
                                    {/* Header row */}
                                    <div className="flex items-center justify-between border-b border-secondary px-4 py-3">
                                        <div>
                                            <p className="text-sm font-medium text-primary">{key.name}</p>
                                            <p className="text-xs text-tertiary">
                                                Created {formatDate(key.created_at)}
                                                {key.last_used_at && <> &middot; Last used {formatDate(key.last_used_at)}</>}
                                            </p>
                                        </div>
                                        <Badge
                                            size="sm"
                                            color={isActive ? "success" : "gray"}
                                            type="pill-color"
                                        >
                                            {isActive ? "Active" : "Revoked"}
                                        </Badge>
                                    </div>

                                    {/* Key display */}
                                    <div className="flex items-center gap-2 px-4 py-3">
                                        <code className="flex-1 rounded-md bg-secondary px-3 py-2 font-mono text-xs text-primary">
                                            {key.key_prefix}{"••••••••••••"}
                                        </code>
                                        <button
                                            onClick={() => handleCopy(key.key_prefix, key.id)}
                                            className="rounded-lg p-2 transition duration-100 ease-linear hover:bg-primary_hover"
                                            title="Copy prefix"
                                        >
                                            <Copy01 className="size-4 text-fg-quaternary" />
                                        </button>
                                    </div>
                                    {copiedId === key.id && (
                                        <p className="px-4 pb-3 text-xs text-success-primary">Copied to clipboard!</p>
                                    )}

                                    {/* Actions (only for active keys) */}
                                    {isActive && (
                                        <div className="flex items-center gap-2 border-t border-secondary px-4 py-3">
                                            <Button
                                                color="secondary"
                                                size="sm"
                                                iconLeading={RefreshCw01}
                                                isLoading={rotateMutation.isPending}
                                                onClick={() => rotateMutation.mutate(key.id)}
                                            >
                                                Rotate Key
                                            </Button>

                                            {confirmRevokeId === key.id ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-error-primary">Are you sure?</span>
                                                    <Button
                                                        color="primary-destructive"
                                                        size="sm"
                                                        isLoading={revokeMutation.isPending}
                                                        onClick={() => revokeMutation.mutate(key.id)}
                                                    >
                                                        Confirm Revoke
                                                    </Button>
                                                    <Button
                                                        color="secondary"
                                                        size="sm"
                                                        onClick={() => setConfirmRevokeId(null)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    color="primary-destructive"
                                                    size="sm"
                                                    iconLeading={Trash01}
                                                    onClick={() => setConfirmRevokeId(key.id)}
                                                >
                                                    Revoke
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Error state */}
                {generateMutation.isError && (
                    <p className="mt-2 text-xs text-error-primary">Failed to generate key. Please try again.</p>
                )}
                {revokeMutation.isError && (
                    <p className="mt-2 text-xs text-error-primary">Failed to revoke key. Please try again.</p>
                )}
                {rotateMutation.isError && (
                    <p className="mt-2 text-xs text-error-primary">Failed to rotate key. Please try again.</p>
                )}
            </div>

            {/* Webhooks */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-primary">Webhooks</h2>
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
                <h2 className="mb-4 text-lg font-semibold text-primary">Third-Party Services</h2>
                <div className="flex flex-col gap-4">
                    {INTEGRATIONS.map((int) => (
                        <div key={int.id} className="flex items-center gap-4 rounded-xl border border-secondary bg-primary p-5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary font-mono text-xs font-bold text-tertiary">
                                {int.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-primary">{int.name}</p>
                                    {int.connected && <Badge size="sm" color="success" type="pill-color">Connected</Badge>}
                                </div>
                                <p className="mt-0.5 text-xs text-tertiary">{int.description}</p>
                            </div>
                            <Button color={int.connected ? "secondary" : "primary"} size="sm">
                                {int.connected ? "Configure" : "Connect"}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
