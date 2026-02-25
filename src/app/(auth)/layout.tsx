"use client";

import { ShieldTick, Star01, Building07, CheckVerified01 } from "@untitledui/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full">
            {/* Left Panel - Brand (hidden on mobile) */}
            <div className="hidden w-1/2 flex-col justify-between bg-brand-950 p-10 md:flex">
                <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-600">
                            <ShieldTick className="size-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">CQC Compliance</span>
                    </div>
                    <div className="mt-8 flex flex-col gap-4">
                        <h1 className="text-display-sm font-bold text-white">
                            Achieve Outstanding CQC Ratings with Confidence
                        </h1>
                        <p className="text-lg text-brand-200">
                            Streamline your compliance workflow, track evidence, and prepare for inspections — all in one place.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    <div className="rounded-2xl border border-brand-800 bg-brand-900 p-6">
                        <div className="mb-4 flex gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star01 key={i} className="size-5 text-warning-300" />
                            ))}
                        </div>
                        <blockquote className="mb-4 text-lg font-medium text-white">
                            &ldquo;This tool helped us go from Requires Improvement to Good in just 4 months.&rdquo;
                        </blockquote>
                        <p className="text-sm text-brand-300">&mdash; Sarah Thompson, Registered Manager</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 rounded-full border border-brand-800 bg-brand-900 px-3 py-1.5">
                            <CheckVerified01 className="size-4 text-success-400" />
                            <span className="text-sm font-medium text-brand-200">UK GDPR Compliant</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-brand-800 bg-brand-900 px-3 py-1.5">
                            <CheckVerified01 className="size-4 text-success-400" />
                            <span className="text-sm font-medium text-brand-200">NHS DSPT Ready</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-brand-800 bg-brand-900 px-3 py-1.5">
                            <Building07 className="size-4 text-brand-300" />
                            <span className="text-sm font-medium text-brand-200">UK Data Centre</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex w-full flex-col bg-primary md:w-1/2">
                <div className="flex items-center gap-3 p-6 md:hidden">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-brand-600">
                        <ShieldTick className="size-5 text-white" />
                    </div>
                    <span className="text-lg font-semibold text-primary">CQC Compliance</span>
                </div>
                <div className="flex flex-1 items-center justify-center px-6 py-8 md:px-12 lg:px-20">
                    <div className="w-full max-w-[400px]">{children}</div>
                </div>
            </div>
        </div>
    );
}
