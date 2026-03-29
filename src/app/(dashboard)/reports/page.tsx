"use client";

import { useRouter } from "next/navigation";
import { BarChart01, ClipboardCheck, Download01, FileCheck02, File06 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";

const REPORT_TYPES = [
    {
        id: "compliance",
        title: "Compliance Report",
        description: "Full compliance overview across all 5 CQC domains with gap analysis and recommendations.",
        icon: BarChart01,
        href: "/reports/compliance",
    },
    {
        id: "inspection",
        title: "Inspection Preparation",
        description: "Checklist and summary to prepare your team for a CQC inspection visit.",
        icon: ClipboardCheck,
        href: "/reports/inspection-prep",
    },
    {
        id: "export",
        title: "Export Data",
        description: "Export your compliance data, evidence, and policies in various formats.",
        icon: Download01,
        href: "/reports/export",
    },
];

export default function ReportsPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-display-xs font-semibold text-primary">Reports</h1>
                <p className="mt-1 text-sm text-tertiary">Generate compliance reports and prepare for inspections.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {REPORT_TYPES.map((report) => (
                    <button
                        key={report.id}
                        onClick={() => router.push(report.href)}
                        className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-6 text-left transition duration-100 hover:border-brand-300 hover:shadow-xs"
                    >
                        <div className="flex size-10 items-center justify-center rounded-lg bg-brand-primary">
                            <report.icon className="size-5 text-brand-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-primary">{report.title}</h3>
                            <p className="mt-1 text-sm text-tertiary">{report.description}</p>
                        </div>
                        <span className="inline-flex items-center rounded-lg border border-secondary bg-primary px-3 py-1.5 text-sm font-semibold text-secondary shadow-xs">Generate &rarr;</span>
                    </button>
                ))}
            </div>

            {/* Recent Reports */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-primary">Recent Reports</h2>
                <div className="flex flex-col items-center justify-center rounded-xl border border-secondary bg-primary py-12">
                    <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
                        <FileCheck02 className="size-5 text-fg-quaternary" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-primary">No reports generated yet</p>
                    <p className="mt-1 max-w-xs text-center text-xs text-tertiary">
                        Generated reports will appear here for easy access and re-download.
                    </p>
                </div>
            </div>
        </div>
    );
}
