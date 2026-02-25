"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";

const DOMAIN_RESULTS = [
    { name: "Safe", score: 72, rating: "Good", color: "#3B82F6", gapCount: 2 },
    { name: "Effective", score: 45, rating: "RI", color: "#8B5CF6", gapCount: 5 },
    { name: "Caring", score: 68, rating: "Good", color: "#EC4899", gapCount: 1 },
    { name: "Responsive", score: 51, rating: "RI", color: "#F59E0B", gapCount: 3 },
    { name: "Well-Led", score: 54, rating: "RI", color: "#10B981", gapCount: 4 },
];

const GAP_SUMMARY = [
    { severity: "Critical", count: 3, color: "bg-error-solid" },
    { severity: "High", count: 5, color: "bg-warning-solid" },
    { severity: "Medium", count: 4, color: "bg-brand-solid" },
    { severity: "Low", count: 3, color: "bg-quaternary" },
];

export default function ResultsPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-display-xs font-semibold text-primary">Your Compliance Results</h1>
                <p className="text-md text-tertiary">Here&apos;s where you stand today.</p>
            </div>

            {/* Main score */}
            <div className="flex flex-col items-center gap-6 rounded-xl border border-secondary bg-primary p-8 sm:flex-row">
                {/* Donut */}
                <div className="relative flex size-40 shrink-0 items-center justify-center">
                    <svg viewBox="0 0 120 120" className="size-40">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-quaternary" />
                        <circle
                            cx="60" cy="60" r="50" fill="none" stroke="#F59E0B" strokeWidth="10"
                            strokeDasharray={`${58 * 3.14} ${100 * 3.14}`}
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="font-mono text-3xl font-bold text-primary">58%</span>
                        <span className="text-xs text-tertiary">Overall</span>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <p className="text-lg font-semibold text-primary">Predicted Rating</p>
                    <Badge color="warning" size="lg" type="pill-color">Requires Improvement</Badge>
                    <p className="text-sm text-tertiary">Based on your assessment answers across all 5 CQC domains</p>
                </div>
            </div>

            {/* Domain breakdown */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-primary">Domain Breakdown</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {DOMAIN_RESULTS.map((d) => (
                        <div key={d.name} className="flex flex-col items-center gap-2 rounded-xl border border-secondary bg-primary p-4">
                            <div className="size-3 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-sm font-medium text-primary">{d.name}</span>
                            <span className="font-mono text-2xl font-bold text-primary">{d.score}%</span>
                            <Badge
                                size="sm"
                                color={d.rating === "Good" ? "success" : "warning"}
                                type="pill-color"
                            >
                                {d.rating}
                            </Badge>
                            <span className="text-xs text-tertiary">{d.gapCount} gaps</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gap summary */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <h2 className="mb-4 text-lg font-semibold text-primary">15 compliance gaps identified</h2>
                <div className="flex flex-col gap-3">
                    {GAP_SUMMARY.map((g) => (
                        <div key={g.severity} className="flex items-center gap-3">
                            <div className={cx("size-3 rounded-full", g.color)} />
                            <span className="text-sm text-primary">
                                <strong>{g.count}</strong> {g.severity}
                            </span>
                            <span className="text-sm text-tertiary">
                                {g.severity === "Critical" && "— must fix immediately"}
                                {g.severity === "High" && "— address within 2 weeks"}
                                {g.severity === "Medium" && "— address within 1 month"}
                                {g.severity === "Low" && "— address when convenient"}
                            </span>
                        </div>
                    ))}
                </div>
                <p className="mt-4 text-sm font-medium text-tertiary">Estimated time to &quot;Good&quot; rating: ~45 days</p>
            </div>

            {/* CTA */}
            <div className="flex justify-center">
                <Button color="primary" size="xl" onClick={() => router.push("/")}>
                    Go to Your Dashboard &rarr;
                </Button>
            </div>
        </div>
    );
}
