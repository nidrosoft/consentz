"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useMemo } from "react";
import { CheckCircle, ClipboardCheck, LogOut01, ChevronRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { cx } from "@/utils/cx";
import { useSignOutConfirm } from "@/providers/sign-out-confirm-provider";

const STEPS = [
    { number: 1, label: "Welcome", description: "Service type selection", path: "/welcome" },
    { number: 2, label: "Organization", description: "Your details", path: "/assessment/2" },
    { number: 3, label: "Assessment", description: "Compliance questions", path: "/assessment/3" },
    { number: 4, label: "Results", description: "Your compliance results", path: "/assessment/results" },
];

function getActiveStep(pathname: string): number {
    if (pathname.includes("/assessment/results")) return 4;
    if (pathname.includes("/assessment/3")) return 3;
    if (pathname.includes("/assessment/2")) return 2;
    return 1;
}

export default function OnboardingLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { requestSignOutConfirm } = useSignOutConfirm();
    const activeStep = useMemo(() => getActiveStep(pathname), [pathname]);

    return (
        <div className="flex min-h-screen flex-col bg-primary">
            <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-secondary bg-primary px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-brand-solid">
                        <ClipboardCheck className="size-5 text-white" />
                    </div>
                    <span className="text-lg font-semibold text-primary">CQC Compliance</span>
                </div>
                <Button
                    color="secondary"
                    size="sm"
                    iconLeading={LogOut01}
                    onClick={() => requestSignOutConfirm()}
                >
                    Sign Out
                </Button>
            </header>

            {/* Mobile stepper */}
            <div className="flex w-full items-center gap-2 border-b border-secondary bg-primary px-4 py-3 md:hidden">
                {STEPS.map((step, i) => {
                    const isActive = step.number === activeStep;
                    const isCompleted = step.number < activeStep;
                    return (
                        <div key={step.number} className="flex items-center gap-2">
                            <div className={cx(
                                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                                isCompleted && "bg-success-solid text-white",
                                isActive && "bg-brand-solid text-white",
                                !isCompleted && !isActive && "bg-tertiary text-quaternary",
                            )}>
                                {isCompleted ? <CheckCircle className="size-3.5 text-white" /> : step.number}
                            </div>
                            {isActive && <span className="text-sm font-semibold text-primary">{step.label}</span>}
                            {i < STEPS.length - 1 && <ChevronRight className="size-4 text-quaternary" />}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Desktop sidebar */}
                <aside className="hidden w-[260px] shrink-0 flex-col justify-between border-r border-secondary bg-secondary p-6 md:flex">
                    <div className="flex flex-col gap-1">
                        {STEPS.map((step, i) => {
                            const isActive = step.number === activeStep;
                            const isCompleted = step.number < activeStep;
                            const isUpcoming = step.number > activeStep;
                            return (
                                <div key={step.number} className="flex items-start gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={cx(
                                            "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition duration-100",
                                            isCompleted && "bg-success-solid text-white",
                                            isActive && "bg-brand-solid text-white ring-4 ring-brand-100",
                                            isUpcoming && "bg-tertiary text-quaternary",
                                        )}>
                                            {isCompleted ? <CheckCircle className="size-4 text-white" /> : step.number}
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div className={cx(
                                                "mt-1 h-8 w-px",
                                                isCompleted ? "bg-success-solid" : "border-l border-dashed border-secondary",
                                            )} />
                                        )}
                                    </div>
                                    <div className="pt-1">
                                        <p className={cx("text-sm leading-tight", isActive && "font-semibold text-primary", isCompleted && "font-medium text-success-primary", isUpcoming && "font-medium text-quaternary")}>
                                            {step.label}
                                        </p>
                                        <p className={cx("mt-0.5 text-xs", isActive ? "text-tertiary" : "text-quaternary")}>
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-medium text-secondary">Step {activeStep} of {STEPS.length}</p>
                        <ProgressBarBase value={activeStep} min={0} max={STEPS.length} />
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-5 sm:py-8 md:px-8 md:py-12">{children}</div>
                </main>
            </div>
        </div>
    );
}
