"use client";

import { useRouter } from "next/navigation";
import { Building07, Users01, CreditCard02, PuzzlePiece01, Bell01 } from "@untitledui/icons";

const SETTINGS_SECTIONS = [
    { id: "organization", title: "Organisation", description: "Manage organisation name, CQC IDs, and service details", icon: Building07, href: "/settings/organization" },
    { id: "users", title: "Users", description: "Manage team members and access permissions", icon: Users01, href: "/settings/users" },
    { id: "billing", title: "Billing", description: "Subscription, payment method, and invoices", icon: CreditCard02, href: "/settings/billing" },
    { id: "integrations", title: "Integrations", description: "Connect third-party services and APIs", icon: PuzzlePiece01, href: "/settings/integrations" },
    { id: "notifications", title: "Notifications", description: "Configure email and push notification preferences", icon: Bell01, href: "/settings/notifications" },
];

export default function SettingsPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-display-xs font-semibold text-primary">Settings</h1>
                <p className="mt-1 text-sm text-tertiary">Manage your organisation and platform settings.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {SETTINGS_SECTIONS.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => router.push(section.href)}
                        className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-5 text-left transition duration-100 hover:border-brand-300 hover:shadow-xs"
                    >
                        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                            <section.icon className="size-5 text-fg-quaternary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-primary">{section.title}</h3>
                            <p className="mt-1 text-xs text-tertiary">{section.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
