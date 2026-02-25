"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle, AlertTriangle, XCircle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { mockStaff } from "@/lib/mock-data";

const COURSES = ["Fire Safety", "Safeguarding", "Manual Handling", "Infection Control", "First Aid", "MCA/DoLS", "Food Hygiene"];

// Mock training matrix data
const MATRIX: Record<string, Record<string, "VALID" | "EXPIRING" | "EXPIRED" | "NOT_DONE">> = {
    "staff-1": { "Fire Safety": "VALID", Safeguarding: "VALID", "Manual Handling": "VALID", "Infection Control": "VALID", "First Aid": "VALID", "MCA/DoLS": "VALID", "Food Hygiene": "VALID" },
    "staff-2": { "Fire Safety": "VALID", Safeguarding: "VALID", "Manual Handling": "EXPIRING", "Infection Control": "VALID", "First Aid": "EXPIRED", "MCA/DoLS": "NOT_DONE", "Food Hygiene": "VALID" },
    "staff-3": { "Fire Safety": "VALID", Safeguarding: "VALID", "Manual Handling": "VALID", "Infection Control": "VALID", "First Aid": "VALID", "MCA/DoLS": "VALID", "Food Hygiene": "NOT_DONE" },
    "staff-4": { "Fire Safety": "EXPIRING", Safeguarding: "VALID", "Manual Handling": "VALID", "Infection Control": "EXPIRED", "First Aid": "VALID", "MCA/DoLS": "NOT_DONE", "Food Hygiene": "VALID" },
    "staff-5": { "Fire Safety": "VALID", Safeguarding: "EXPIRED", "Manual Handling": "NOT_DONE", "Infection Control": "VALID", "First Aid": "NOT_DONE", "MCA/DoLS": "NOT_DONE", "Food Hygiene": "VALID" },
};

const CELL_ICON: Record<string, typeof CheckCircle> = {
    VALID: CheckCircle, EXPIRING: AlertTriangle, EXPIRED: XCircle, NOT_DONE: XCircle,
};
const CELL_COLOR: Record<string, string> = {
    VALID: "text-success-primary", EXPIRING: "text-warning-primary", EXPIRED: "text-error-primary", NOT_DONE: "text-quaternary",
};

export default function TrainingMatrixPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/staff")}>Back to Staff</Button>

            <div>
                <h1 className="text-display-xs font-semibold text-primary">Training Matrix</h1>
                <p className="mt-1 text-sm text-tertiary">Overview of mandatory training completion across all staff.</p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5 text-xs"><CheckCircle className="size-4 text-success-primary" /> Valid</span>
                <span className="flex items-center gap-1.5 text-xs"><AlertTriangle className="size-4 text-warning-primary" /> Expiring Soon</span>
                <span className="flex items-center gap-1.5 text-xs"><XCircle className="size-4 text-error-primary" /> Expired</span>
                <span className="flex items-center gap-1.5 text-xs"><XCircle className="size-4 text-quaternary" /> Not Done</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-secondary">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-secondary bg-secondary">
                            <th className="sticky left-0 bg-secondary px-4 py-3 text-left text-xs font-medium text-tertiary">Staff Member</th>
                            {COURSES.map((c) => (
                                <th key={c} className="px-3 py-3 text-center text-xs font-medium text-tertiary">{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {mockStaff.map((staff, i) => {
                            const record = MATRIX[staff.id] ?? {};
                            return (
                                <tr key={staff.id} className={i < mockStaff.length - 1 ? "border-b border-secondary" : ""}>
                                    <td className="sticky left-0 bg-primary px-4 py-3">
                                        <button onClick={() => router.push(`/staff/${staff.id}`)} className="text-sm font-medium text-primary hover:text-brand-600">
                                            {staff.name}
                                        </button>
                                    </td>
                                    {COURSES.map((c) => {
                                        const status = record[c] ?? "NOT_DONE";
                                        const Icon = CELL_ICON[status];
                                        return (
                                            <td key={c} className="px-3 py-3 text-center">
                                                <Icon className={cx("mx-auto size-5", CELL_COLOR[status])} />
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
