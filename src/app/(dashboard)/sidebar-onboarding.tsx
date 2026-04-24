"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Circle, X, Rocket01, Stars02 } from "@untitledui/icons";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { apiGet } from "@/lib/api-client";
import { FeaturedCardUpgradeCTA } from "@/components/application/featured-card/featured-card-upgrade-cta";
import { useSubscriptionUpgrade } from "@/hooks/use-subscription";

const DISMISS_KEY = "consentz_onboarding_dismissed";
const UPGRADE_DISMISS_KEY = "consentz_upgrade_cta_dismissed";

const STEPS = [
    { key: "org_profile", label: "Complete your profile" },
    { key: "connect_consentz", label: "Connect Consentz" },
    { key: "upload_evidence", label: "Upload first evidence" },
    { key: "add_staff", label: "Add a staff member" },
    { key: "review_domains", label: "Review CQC domains" },
] as const;

const STEP_HREF: Record<string, string> = {
    org_profile: "/settings",
    connect_consentz: "/settings?tab=integrations",
    upload_evidence: "/evidence/upload",
    add_staff: "/staff/add",
    review_domains: "/domains",
};

export function SidebarOnboarding() {
    const router = useRouter();
    const [dismissed, setDismissed] = useState(true);
    const [upgradeDismissed, setUpgradeDismissed] = useState(true);

    useEffect(() => {
        setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
        setUpgradeDismissed(localStorage.getItem(UPGRADE_DISMISS_KEY) === "true");
    }, []);

    const { data, isLoading } = useQuery({
        queryKey: ["onboarding-progress"],
        queryFn: () =>
            apiGet<{ steps: { step_key: string; completed_at: string }[] }>("/api/onboarding/progress").then((r) => r.data),
    });

    const { currentPlan, nextPlan, isFree, isTopTier, isLoading: subLoading } =
        useSubscriptionUpgrade();

    if (isLoading) return null;

    const completedKeys = new Set(data?.steps?.map((s) => s.step_key) ?? []);
    const completedCount = STEPS.filter((s) => completedKeys.has(s.key)).length;
    const progress = Math.round((completedCount / STEPS.length) * 100);
    const allDone = completedCount === STEPS.length;

    const nextStep = STEPS.find((s) => !completedKeys.has(s.key));

    // Show the upgrade CTA once the user has either completed onboarding OR
    // explicitly dismissed the checklist. Users who are already on the top
    // paid tier, or who have also dismissed the upgrade CTA, see nothing.
    const onboardingFinished = dismissed || allDone;
    const showUpgrade =
        onboardingFinished &&
        !upgradeDismissed &&
        !subLoading &&
        !isTopTier &&
        !!nextPlan;

    if (dismissed && !showUpgrade) return null;

    function handleDismiss() {
        localStorage.setItem(DISMISS_KEY, "true");
        setDismissed(true);
    }

    function handleUpgradeDismiss() {
        localStorage.setItem(UPGRADE_DISMISS_KEY, "true");
        setUpgradeDismissed(true);
    }

    if (onboardingFinished && showUpgrade && nextPlan) {
        // Upgrade card copy adapts to free vs. mid-tier users.
        const title = isFree ? `Upgrade to ${nextPlan.name}` : `Level up to ${nextPlan.name}`;
        const description = isFree
            ? `Unlock full AI policy generation, unlimited evidence verification, and priority CQC insights with ${nextPlan.name}.`
            : `You're on ${currentPlan?.name ?? "the current plan"}. Move to ${nextPlan.name} for expanded limits and premium features.`;
        const icon = isFree ? Stars02 : Rocket01;
        const badge = isFree ? "Free" : currentPlan?.name;
        return (
            <FeaturedCardUpgradeCTA
                icon={icon}
                title={title}
                badge={badge}
                description={description}
                confirmLabel={isFree ? "Upgrade now" : `Upgrade to ${nextPlan.name}`}
                onConfirm={() => router.push("/settings?tab=billing")}
                onDismiss={handleUpgradeDismiss}
            />
        );
    }

    return (
        <div className="flex flex-col gap-2.5 rounded-xl bg-[#EBE5D9] p-3 ring-1 ring-inset ring-[#DDD6C6]">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">
                        {allDone ? "Setup complete!" : "Complete account"}
                    </span>
                    {allDone ? (
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="rounded p-0.5 transition duration-100 hover:bg-[#E0D8CC]"
                            aria-label="Dismiss"
                        >
                            <X className="size-3.5 text-fg-tertiary" />
                        </button>
                    ) : (
                        <span className="text-xs text-quaternary">Step {completedCount + 1} of {STEPS.length}</span>
                    )}
                </div>
                <ProgressBar value={progress} className="bg-white/60" />
            </div>

            <div className="flex flex-col gap-0.5">
                {STEPS.map((step) => {
                    const done = completedKeys.has(step.key);
                    return (
                        <button
                            key={step.key}
                            type="button"
                            onClick={() => {
                                if (!done) {
                                    router.push(STEP_HREF[step.key]);
                                }
                            }}
                            className={cx(
                                "flex items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm transition duration-100",
                                done ? "opacity-50" : "hover:bg-[#E8E0D4] cursor-pointer",
                            )}
                        >
                            {done ? (
                                <CheckCircle className="size-4.5 shrink-0 text-fg-brand-primary" />
                            ) : (
                                <Circle className="size-4.5 shrink-0 text-fg-quaternary" />
                            )}
                            <span className={cx("text-sm", done ? "text-tertiary line-through" : "text-secondary")}>
                                {step.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {allDone ? (
                <Button size="sm" color="secondary" className="w-full" onClick={handleDismiss}>
                    Dismiss
                </Button>
            ) : nextStep ? (
                <Button
                    size="sm"
                    color="secondary"
                    className="w-full"
                    onClick={() => router.push(STEP_HREF[nextStep.key])}
                >
                    Continue setup
                </Button>
            ) : null}
        </div>
    );
}
