"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Circle, X } from "@untitledui/icons";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { apiGet } from "@/lib/api-client";

const DISMISS_KEY = "consentz_onboarding_dismissed";

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

    useEffect(() => {
        setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
    }, []);

    const { data, isLoading } = useQuery({
        queryKey: ["onboarding-progress"],
        queryFn: () =>
            apiGet<{ steps: { step_key: string; completed_at: string }[] }>("/api/onboarding/progress").then((r) => r.data),
    });

    if (isLoading || dismissed) return null;

    const completedKeys = new Set(data?.steps?.map((s) => s.step_key) ?? []);
    const completedCount = STEPS.filter((s) => completedKeys.has(s.key)).length;
    const progress = Math.round((completedCount / STEPS.length) * 100);
    const allDone = completedCount === STEPS.length;

    const nextStep = STEPS.find((s) => !completedKeys.has(s.key));

    function handleDismiss() {
        localStorage.setItem(DISMISS_KEY, "true");
        setDismissed(true);
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
