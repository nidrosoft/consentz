"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle, XCircle, AlertTriangle, Download01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

const CHECKLIST = [
    { id: 1, label: "All staff DBS checks are current", status: "warning" as const, note: "1 staff member has expired DBS" },
    { id: 2, label: "Fire safety certificate is valid", status: "warning" as const, note: "Expiring in 7 days" },
    { id: 3, label: "Safeguarding policy is in place and reviewed", status: "done" as const, note: "Last reviewed Jan 2026" },
    { id: 4, label: "Infection control policy is current", status: "done" as const, note: "Updated Dec 2025" },
    { id: 5, label: "Medicines management audits are up to date", status: "fail" as const, note: "Audit overdue by 2 weeks" },
    { id: 6, label: "Staff training records are complete", status: "warning" as const, note: "3 training items expiring soon" },
    { id: 7, label: "Complaints procedure is accessible", status: "fail" as const, note: "No formal procedure documented" },
    { id: 8, label: "Risk assessments are current", status: "done" as const, note: "All risk assessments reviewed" },
    { id: 9, label: "Governance meeting minutes available", status: "done" as const, note: "Latest: Jan 2026" },
    { id: 10, label: "Incident log is up to date", status: "done" as const, note: "Last entry: 2 days ago" },
];

const ICON_MAP = {
    done: CheckCircle,
    warning: AlertTriangle,
    fail: XCircle,
};
const COLOR_MAP = {
    done: "text-success-primary",
    warning: "text-warning-primary",
    fail: "text-error-primary",
};

export default function InspectionPrepPage() {
    const router = useRouter();
    const doneCount = CHECKLIST.filter((c) => c.status === "done").length;

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/reports")}>Back to Reports</Button>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Inspection Preparation</h1>
                    <p className="mt-1 text-sm text-tertiary">{doneCount} of {CHECKLIST.length} items ready</p>
                </div>
                <Button color="secondary" size="lg" iconLeading={Download01}>Export Checklist</Button>
            </div>

            <div className="rounded-xl border border-secondary bg-primary">
                {CHECKLIST.map((item, i) => {
                    const Icon = ICON_MAP[item.status];
                    return (
                        <div
                            key={item.id}
                            className={cx("flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4", i < CHECKLIST.length - 1 && "border-b border-secondary")}
                        >
                            <Icon className={cx("mt-0.5 size-5 shrink-0", COLOR_MAP[item.status])} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-primary">{item.label}</p>
                                <p className="mt-0.5 text-xs text-tertiary">{item.note}</p>
                            </div>
                            <Badge
                                size="sm"
                                color={item.status === "done" ? "success" : item.status === "warning" ? "warning" : "error"}
                                type="pill-color"
                            >
                                {item.status === "done" ? "Ready" : item.status === "warning" ? "Attention" : "Action Needed"}
                            </Badge>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
