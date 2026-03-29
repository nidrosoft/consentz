"use client";

import { type ReactNode, createContext, useContext, useEffect } from "react";
import { ClipboardCheck, HelpCircle, LogOut01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { useSignOutConfirm } from "@/providers/sign-out-confirm-provider";

// ─── Context for sidebar stepper data ────────────────────────────────────────
export interface AssessmentLayoutContextType {
    currentStep: number;
    totalSteps: number;
    steps: { title: string; description: string }[];
}

const AssessmentLayoutContext = createContext<AssessmentLayoutContextType>({
    currentStep: 1,
    totalSteps: 7,
    steps: [],
});

export function useAssessmentLayout() {
    return useContext(AssessmentLayoutContext);
}

export { AssessmentLayoutContext };

export default function AssessmentLayout({ children }: { children: ReactNode }) {
    const { requestSignOutConfirm } = useSignOutConfirm();

    useEffect(() => {
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        return () => {
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
        };
    }, []);

    return (
        <div className="fixed inset-0 flex flex-col overflow-clip">
            {/* ── Header ──────────────────────────────────────────────── */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-secondary bg-primary px-4 sm:px-6 lg:h-16">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-brand-solid">
                        <ClipboardCheck className="size-5 text-white" />
                    </div>
                    <span className="text-lg font-semibold text-primary">CQC Compliance</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        className="flex items-center gap-1.5 text-sm font-medium text-tertiary hover:text-secondary"
                    >
                        <HelpCircle className="size-4" />
                        <span className="hidden sm:inline">Help</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => requestSignOutConfirm()}
                        className="flex items-center gap-1.5 text-sm font-medium text-tertiary hover:text-secondary"
                    >
                        <LogOut01 className="size-4" />
                        <span className="hidden sm:inline">Log out</span>
                    </button>
                </div>
            </header>

            {/* ── Main ────────────────────────────────────────────────── */}
            <main className="flex min-h-0 flex-1 overflow-clip">
                {children}
            </main>
        </div>
    );
}
