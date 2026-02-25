"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

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

export default function NotificationPrefsPage() {
    const router = useRouter();
    const [digest, setDigest] = useState("individual");

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/settings")}>Settings</Button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Notification Preferences</h1>
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
                                <td className="px-4 py-3">
                                    <p className="text-sm font-medium text-primary">{pref.label}</p>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-xs font-medium text-tertiary">Always</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <input type="checkbox" defaultChecked={pref.email} className="size-4 rounded border-secondary accent-brand-600" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Email Digest */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <h2 className="mb-3 text-sm font-semibold text-primary">Email Digest</h2>
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
