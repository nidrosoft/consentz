// =============================================================================
// useSubscriptionUpgrade — resolves the user's current subscription tier and
// the next upgrade target. Used by the sidebar widget once onboarding is done.
// =============================================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';

export interface SubscriptionPlan {
    id: string;
    name: string;
    description?: string | null;
    price_monthly: number | null;
    stripe_price_id?: string | null;
    is_active?: boolean;
}

export interface Subscription {
    id: string;
    plan_id: string | null;
    status: string;
    plan?: SubscriptionPlan | null;
}

export interface SubscriptionUpgradeState {
    currentPlan: SubscriptionPlan | null;
    /** Plan the user should upgrade to, or null if they're already on the top tier. */
    nextPlan: SubscriptionPlan | null;
    /** True if there is no active subscription at all. */
    isFree: boolean;
    /** True if the user is on the most expensive active plan. */
    isTopTier: boolean;
    isLoading: boolean;
}

export function useSubscriptionUpgrade(): SubscriptionUpgradeState {
    const { data: sub, isLoading: subLoading } = useQuery({
        queryKey: ['billing', 'subscription'],
        queryFn: () => apiGet<Subscription | null>('/api/billing/subscription').then((r) => r.data),
        staleTime: 5 * 60 * 1000,
    });
    const { data: plans, isLoading: plansLoading } = useQuery({
        queryKey: ['billing', 'plans'],
        queryFn: () => apiGet<SubscriptionPlan[]>('/api/billing/plans').then((r) => r.data),
        staleTime: 10 * 60 * 1000,
    });

    const isLoading = subLoading || plansLoading;

    // Sort active plans by monthly price ascending; nulls treated as 0 (free).
    const sortedPlans = (plans ?? [])
        .filter((p) => p.is_active !== false)
        .slice()
        .sort((a, b) => (a.price_monthly ?? 0) - (b.price_monthly ?? 0));

    const isActiveSub = !!sub && (sub.status === 'active' || sub.status === 'trialing');
    const currentPlan = isActiveSub ? sub.plan ?? null : null;
    const isFree = !currentPlan;

    let nextPlan: SubscriptionPlan | null = null;
    if (isFree) {
        // Free user → upgrade to cheapest paid plan.
        nextPlan = sortedPlans.find((p) => (p.price_monthly ?? 0) > 0) ?? null;
    } else if (currentPlan) {
        const idx = sortedPlans.findIndex((p) => p.id === currentPlan.id);
        nextPlan = idx >= 0 && idx < sortedPlans.length - 1 ? sortedPlans[idx + 1] : null;
    }

    const isTopTier = !isFree && !nextPlan;

    return { currentPlan, nextPlan, isFree, isTopTier, isLoading };
}
