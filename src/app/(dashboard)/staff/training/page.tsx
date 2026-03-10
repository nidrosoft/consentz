"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle, AlertTriangle, XCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { useTrainingRecords } from "@/hooks/use-staff";
import { PageSkeleton } from "@/components/shared/page-skeleton";

const CELL_ICON: Record<string, typeof CheckCircle> = {
    VALID: CheckCircle, EXPIRING: AlertTriangle, EXPIRED: XCircle, EXPIRING_SOON: AlertTriangle, NOT_DONE: XCircle,
};
const CELL_COLOR: Record<string, string> = {
    VALID: "text-success-primary", EXPIRING: "text-warning-primary", EXPIRING_SOON: "text-warning-primary", EXPIRED: "text-error-primary", NOT_DONE: "text-quaternary",
};

export default function TrainingMatrixPage() {
    const router = useRouter();
    const { data, isLoading, error, refetch } = useTrainingRecords({ view: "matrix" });
    const matrixData = data?.data as { staff?: { id: string; name: string; trainings: { courseName: string; status: string }[] }[] } | undefined;
    const staffRows = matrixData?.staff ?? [];

    const courses = useMemo(() => {
        const set = new Set<string>();
        staffRows.forEach((row) => row.trainings?.forEach((t) => set.add(t.courseName)));
        return [...set].sort();
    }, [staffRows]);

    const getStatusForCourse = (trainings: { courseName: string; status: string }[], course: string) => {
        const t = trainings?.find((x) => x.courseName === course);
        return t?.status ?? "NOT_DONE";
    };

    if (isLoading) return <PageSkeleton variant="list" />;

    if (error) {
        return (
            <div className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-6">
                <p className="text-sm text-error-primary">Failed to load training matrix.</p>
                <Button color="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
        );
    }

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
                            {courses.map((c) => (
                                <th key={c} className="px-3 py-3 text-center text-xs font-medium text-tertiary">{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {staffRows.map((row, i) => {
                            const statuses = row.trainings ?? [];
                            return (
                                <tr key={row.id} className={i < staffRows.length - 1 ? "border-b border-secondary" : ""}>
                                    <td className="sticky left-0 bg-primary px-4 py-3">
                                        <button onClick={() => router.push(`/staff/${row.id}`)} className="text-sm font-medium text-primary hover:text-brand-600">
                                            {row.name}
                                        </button>
                                    </td>
                                    {courses.map((c) => {
                                        const status = getStatusForCourse(statuses, c);
                                        const Icon = CELL_ICON[status] ?? CELL_ICON.NOT_DONE;
                                        return (
                                            <td key={c} className="px-3 py-3 text-center">
                                                <Icon className={cx("mx-auto size-5", CELL_COLOR[status] ?? CELL_COLOR.NOT_DONE)} />
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
