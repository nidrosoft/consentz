"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Copy01, Eye, EyeOff, RefreshCw01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

const INTEGRATIONS = [
    { id: "cqc", name: "CQC API", description: "Automatically sync your CQC profile and inspection data", connected: true },
    { id: "nhs", name: "NHS DSPT", description: "Data Security and Protection Toolkit compliance sync", connected: false },
    { id: "google", name: "Google Workspace", description: "Import documents and share reports via Google Drive", connected: true },
    { id: "ms365", name: "Microsoft 365", description: "OneDrive document storage and Teams notifications", connected: false },
    { id: "slack", name: "Slack", description: "Receive compliance alerts and task notifications", connected: false },
];

const MOCK_API_KEY = "cqc_live_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";
const MOCK_WEBHOOK_URL = "https://api.consentz.com/webhooks/cqc-compliance";

export default function IntegrationsSettingsPage() {
    const router = useRouter();
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/settings")}>Settings</Button>

            <div>
                <h1 className="text-display-xs font-semibold text-primary">Integrations</h1>
                <p className="mt-1 text-sm text-tertiary">Connect services, manage API keys, and configure the Consentz SDK.</p>
            </div>

            {/* Consentz SDK */}
            <div className="rounded-xl border border-brand-300 bg-primary p-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary font-mono text-xs font-bold text-brand-secondary">SDK</div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-primary">Consentz SDK</h2>
                            <Badge size="sm" color="warning" type="pill-color">Coming Soon</Badge>
                        </div>
                        <p className="mt-1 text-sm text-tertiary">
                            Connect your Consentz clinic management system to automatically import consent forms, appointment data, staff rotas, and stock usage as compliance evidence.
                        </p>
                    </div>
                </div>
                <div className="mt-4 rounded-lg border border-secondary bg-secondary px-4 py-3">
                    <p className="text-xs text-tertiary">The Consentz SDK integration will transform ~70% of your existing Consentz data into CQC compliance evidence automatically. This feature is currently in development.</p>
                </div>
            </div>

            {/* API Keys */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-primary">API Keys</h2>
                        <p className="mt-1 text-sm text-tertiary">Use API keys to authenticate requests to the Consentz Compliance API.</p>
                    </div>
                    <Button color="primary" size="sm">Generate New Key</Button>
                </div>

                <div className="rounded-lg border border-secondary">
                    <div className="flex items-center justify-between border-b border-secondary px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-primary">Live API Key</p>
                            <p className="text-xs text-tertiary">Created 15 Jan 2026</p>
                        </div>
                        <Badge size="sm" color="success" type="pill-color">Active</Badge>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-3">
                        <code className="flex-1 rounded-md bg-secondary px-3 py-2 font-mono text-xs text-primary">
                            {showKey ? MOCK_API_KEY : "cqc_live_sk_••••••••••••••••••••••••••••"}
                        </code>
                        <button onClick={() => setShowKey(!showKey)} className="rounded-lg p-2 hover:bg-primary_hover" title={showKey ? "Hide" : "Reveal"}>
                            {showKey ? <EyeOff className="size-4 text-fg-quaternary" /> : <Eye className="size-4 text-fg-quaternary" />}
                        </button>
                        <button onClick={() => handleCopy(MOCK_API_KEY)} className="rounded-lg p-2 hover:bg-primary_hover" title="Copy">
                            <Copy01 className="size-4 text-fg-quaternary" />
                        </button>
                    </div>
                    {copied && <p className="px-4 pb-3 text-xs text-success-primary">Copied to clipboard!</p>}
                    <div className="flex items-center gap-2 border-t border-secondary px-4 py-3">
                        <Button color="secondary" size="sm" iconLeading={RefreshCw01}>Rotate Key</Button>
                        <Button color="primary-destructive" size="sm">Revoke</Button>
                    </div>
                </div>
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
