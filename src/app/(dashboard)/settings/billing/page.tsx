"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, CheckCircle, Zap, Building07, CreditCard02, ArrowUpRight } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";

interface Plan {
    id: string;
    name: string;
    tier: string;
    stripe_price_id: string;
    price_monthly: number;
    features: string[];
    is_active: boolean;
}

interface Subscription {
    id: string;
    status: string;
    stripe_customer_id: string | null;
    current_period_end: string | null;
    cancel_at: string | null;
    plan: Plan | null;
}

const TIER_META: Record<string, { icon: typeof Zap; badge: string; accent: string }> = {
    free: { icon: Zap, badge: "gray", accent: "border-secondary" },
    professional: { icon: CreditCard02, badge: "brand", accent: "border-brand" },
    enterprise: { icon: Building07, badge: "purple", accent: "border-brand" },
};

export default function BillingSettingsPage() {
    const router = useRouter();
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
            window.history.replaceState({}, "", "/settings/billing");
        }
    }, [params]);

    const fetchData = useCallback(async () => {
        try {
            const [plansRes, subRes] = await Promise.all([
                fetch("/api/billing/plans"),
                fetch("/api/billing/subscription"),
            ]);
            if (plansRes.ok) {
                const plansJson = await plansRes.json();
                setPlans(plansJson.data ?? []);
            }
            if (subRes.ok) {
                const subJson = await subRes.json();
                setSubscription(subJson.data ?? null);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCheckout = async (priceId: string) => {
        setCheckoutLoading(priceId);
        try {
            const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId }),
            });
            const json = await res.json();
            if (json.data?.url) {
                window.location.href = json.data.url;
            }
        } finally {
            setCheckoutLoading(null);
        }
    };

    const handlePortal = async () => {
        setPortalLoading(true);
        try {
            const res = await fetch("/api/billing/portal", { method: "POST" });
            const json = await res.json();
            if (json.data?.url) {
                window.location.href = json.data.url;
            }
        } finally {
            setPortalLoading(false);
        }
    };

    const currentTier = subscription?.plan?.tier ?? "free";

    const formatPrice = (pence: number) => {
        if (pence === 0) return "Free";
        return `£${(pence / 100).toFixed(0)}`;
    };

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/settings")}>Settings</Button>

            <div>
                <h1 className="text-display-xs font-semibold text-primary">Billing &amp; Plan</h1>
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
                    {/* Current subscription status */}
                    {subscription && subscription.status !== "cancelled" && (
                        <div className="rounded-xl border border-secondary bg-primary p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-semibold text-primary">{subscription.plan?.name ?? "Current"} Plan</h2>
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
                                <div className="flex gap-2">
                                    <Button color="secondary" size="sm" iconTrailing={ArrowUpRight} onClick={handlePortal} isLoading={portalLoading}>
                                        Manage Subscription
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pricing cards */}
                    <div className="grid gap-5 sm:grid-cols-3">
                        {plans.map((plan) => {
                            const meta = TIER_META[plan.tier] ?? TIER_META.free;
                            const isCurrent = plan.tier === currentTier;
                            const isUpgrade = plans.findIndex(p => p.tier === plan.tier) > plans.findIndex(p => p.tier === currentTier);
                            const Icon = meta.icon;

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative flex flex-col rounded-xl border-2 bg-primary p-6 transition duration-100 ease-linear ${isCurrent ? meta.accent : "border-secondary hover:border-tertiary"}`}
                                >
                                    {isCurrent && (
                                        <div className="absolute -top-3 left-4">
                                            <Badge size="sm" color="brand" type="pill-color">Current plan</Badge>
                                        </div>
                                    )}

                                    <div className="mb-4 flex items-center gap-2">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                                            <Icon className="size-5 text-fg-quaternary" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-primary">{plan.name}</h3>
                                    </div>

                                    <div className="mb-5">
                                        <span className="font-mono text-3xl font-bold text-primary">{formatPrice(plan.price_monthly)}</span>
                                        {plan.price_monthly > 0 && <span className="text-sm text-tertiary">/mo</span>}
                                    </div>

                                    <ul className="mb-6 flex flex-1 flex-col gap-2.5">
                                        {(plan.features as string[]).map((feature) => (
                                            <li key={feature} className="flex items-start gap-2 text-sm text-secondary">
                                                <CheckCircle className="mt-0.5 size-4 shrink-0 text-fg-success-secondary" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    {isCurrent ? (
                                        <Button color="secondary" size="md" isDisabled className="w-full">
                                            Current plan
                                        </Button>
                                    ) : plan.tier === "free" ? (
                                        <Button color="tertiary" size="md" isDisabled className="w-full">
                                            Free tier
                                        </Button>
                                    ) : (
                                        <Button
                                            color={isUpgrade ? "primary" : "secondary"}
                                            size="md"
                                            className="w-full"
                                            isLoading={checkoutLoading === plan.stripe_price_id}
                                            onClick={() => handleCheckout(plan.stripe_price_id)}
                                        >
                                            {isUpgrade ? "Upgrade" : "Switch"} to {plan.name}
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Manage billing section */}
                    {subscription?.stripe_customer_id && (
                        <div className="rounded-xl border border-secondary bg-primary p-6">
                            <h2 className="mb-2 text-lg font-semibold text-primary">Payment &amp; Invoices</h2>
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
