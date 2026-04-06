"use client";

import dynamic from "next/dynamic";
import { Mail01, ShieldTick, CheckVerified01, Building07 } from "@untitledui/icons";
import { RatingStars } from "@/components/foundations/rating-stars";

const ShaderBackground = dynamic(() => import("@/components/ui/shader-background"), { ssr: false });

export default function AuthFlowLayout({ children }: { children: React.ReactNode }) {
    return (
        <section className="grid min-h-screen grid-cols-1 bg-primary lg:grid-cols-[640px_1fr]">
            {/* Left: Form panel */}
            <div className="flex w-full flex-1 flex-col bg-primary">
                <header className="hidden p-8 lg:block">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-600">
                            <ShieldTick className="size-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-primary">CQC Compliance</span>
                    </div>
                </header>

                <div className="flex flex-1 justify-center px-4 py-12 md:items-center md:px-8 md:py-0">
                    <div className="flex w-full flex-col gap-8 sm:max-w-90">
                        <div className="flex items-center gap-3 lg:hidden">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-600">
                                <ShieldTick className="size-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-primary">CQC Compliance</span>
                        </div>

                        {children}
                    </div>
                </div>

                <footer className="hidden justify-between p-8 pt-11 lg:flex">
                    <p className="text-sm text-tertiary">&copy; Consentz {new Date().getFullYear()}</p>
                    <a href="mailto:support@consentz.com" className="flex items-center gap-2 text-sm text-tertiary transition duration-100 hover:text-secondary">
                        <Mail01 className="size-4 text-fg-quaternary" />
                        support@consentz.com
                    </a>
                </footer>
            </div>

            {/* Right: Shader animation + quote panel */}
            <div className="relative hidden flex-1 overflow-hidden lg:flex lg:flex-col">
                <ShaderBackground />

                <div className="relative z-10 flex flex-1 flex-col justify-between p-16 pt-24">
                    <figure className="flex max-w-3xl flex-col gap-6">
                        <blockquote>
                            <p className="text-display-sm font-medium text-white">
                                &ldquo;This platform transformed how we manage CQC compliance. We went from Requires Improvement to Good in just 4 months.&rdquo;
                            </p>
                        </blockquote>
                        <figcaption className="flex items-start gap-3">
                            <div className="flex-1">
                                <p className="text-lg font-semibold text-white">&mdash; Sarah Thompson</p>
                                <cite className="text-md font-medium text-brand-200 not-italic">Registered Manager, Sunrise Care Home</cite>
                            </div>
                            <RatingStars className="gap-0.5" starClassName="text-warning-300" />
                        </figcaption>
                    </figure>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                            <CheckVerified01 className="size-4 text-success-400" />
                            <span className="text-sm font-medium text-white/80">UK GDPR Compliant</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                            <CheckVerified01 className="size-4 text-success-400" />
                            <span className="text-sm font-medium text-white/80">NHS DSPT Ready</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                            <Building07 className="size-4 text-brand-200" />
                            <span className="text-sm font-medium text-white/80">UK Data Centre</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
