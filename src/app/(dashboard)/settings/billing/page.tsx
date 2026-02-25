"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";

export default function BillingSettingsPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/settings")}>Settings</Button>

            <div>
                <h1 className="text-display-xs font-semibold text-primary">Billing &amp; Plan</h1>
                <p className="mt-1 text-sm text-tertiary">Manage your subscription, payment method, and invoices.</p>
            </div>

            {/* Current plan */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-primary">Professional Plan</h2>
                            <Badge size="sm" color="success" type="pill-color">Active</Badge>
                        </div>
                        <p className="mt-1 text-sm text-tertiary">Up to 50 beds &middot; All features &middot; Priority support</p>
                    </div>
                    <div className="text-right">
                        <p className="font-mono text-2xl font-bold text-primary">&pound;149<span className="text-sm font-normal text-tertiary">/mo</span></p>
                        <p className="text-xs text-tertiary">Next billing: 1 March 2026</p>
                    </div>
                </div>
            </div>

            {/* Upgrade CTA */}
            <div className="rounded-xl border border-brand-300 bg-brand-primary p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-brand-secondary">Need more capacity?</h2>
                        <p className="mt-1 text-sm text-tertiary">Upgrade to Enterprise for unlimited beds, dedicated support, and custom integrations.</p>
                    </div>
                    <Button color="primary" size="lg">Upgrade Plan</Button>
                </div>
            </div>

            {/* Payment method */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <h2 className="mb-4 text-lg font-semibold text-primary">Payment Method</h2>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary font-mono text-xs font-bold text-tertiary">VISA</div>
                        <div>
                            <p className="text-sm font-medium text-primary">&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4242</p>
                            <p className="text-xs text-tertiary">Expires 12/2027</p>
                        </div>
                    </div>
                    <Button color="secondary" size="sm">Update</Button>
                </div>
            </div>

            {/* Invoices */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <h2 className="mb-4 text-lg font-semibold text-primary">Recent Invoices</h2>
                <div className="flex flex-col gap-3">
                    {["Feb 2026", "Jan 2026", "Dec 2025"].map((month) => (
                        <div key={month} className="flex items-center justify-between border-b border-secondary pb-3 last:border-0 last:pb-0">
                            <div>
                                <p className="text-sm font-medium text-primary">{month}</p>
                                <p className="text-xs text-tertiary">Professional Plan</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-sm font-medium text-primary">&pound;149.00</span>
                                <Badge size="sm" color="success" type="pill-color">Paid</Badge>
                                <Button color="link-color" size="sm">Download</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
