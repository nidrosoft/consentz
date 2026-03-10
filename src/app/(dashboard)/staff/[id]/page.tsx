"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Edit02, Mail01, Calendar, ShieldTick, Award02 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { useStaffDetail } from "@/hooks/use-staff";
import { useTrainingRecords } from "@/hooks/use-staff";
import { PageSkeleton } from "@/components/shared/page-skeleton";

const DBS_BADGE: Record<string, "success" | "warning" | "error"> = {
    CLEAR: "success", PENDING: "warning", EXPIRED: "error",
};

const TRAINING_BADGE: Record<string, "success" | "warning" | "error"> = {
    VALID: "success", EXPIRING_SOON: "warning", EXPIRED: "error",
};

interface ApiStaffMember {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    jobTitle: string;
    staffRole: string;
    department?: string | null;
    isActive: boolean;
    startDate: string;
    dbsCertificateDate?: string | null;
    dbsNumber?: string | null;
    registrationBody?: string | null;
    registrationNumber?: string | null;
    registrationExpiry?: string | null;
    trainingRecords?: { id: string; courseName: string; completedDate: string; expiryDate: string; status: string }[];
}

export default function StaffDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params.id === "string" ? params.id : "";
    const { data: rawStaff, isLoading, error, refetch } = useStaffDetail(id);
    const { data: trainingData } = useTrainingRecords({ staffId: id });
    const trainingRecords = (trainingData?.data ?? []) as { id: string; courseName: string; completedDate: string; expiryDate: string; status: string }[];
    const apiStaff = rawStaff as ApiStaffMember | null | undefined;
    const staff = apiStaff ? {
        ...apiStaff,
        name: `${apiStaff.firstName} ${apiStaff.lastName}`,
        role: apiStaff.jobTitle,
        department: apiStaff.department ?? apiStaff.staffRole ?? "—",
        dbsStatus: apiStaff.dbsCertificateDate ? "CLEAR" : "PENDING",
        dbsExpiry: apiStaff.dbsCertificateDate ?? "N/A",
    } : null;

    if (isLoading) return <PageSkeleton variant="detail" />;

    if (error || !staff) {
        return (
            <div className="flex flex-col gap-4">
                <p className="text-sm text-tertiary">Staff member not found.</p>
                {error && (
                    <Button color="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/staff")}>Back to Staff</Button>

            {/* Profile header */}
            <div className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Avatar size="xl" initials={staff.name.split(" ").map((n) => n[0]).join("")} />
                    <div>
                        <h1 className="text-display-xs font-semibold text-primary">{staff.name}</h1>
                        <p className="text-sm text-tertiary">{staff.role} &middot; {staff.department}</p>
                        <div className="mt-2 flex items-center gap-3">
                            <Badge size="sm" color={staff.isActive ? "success" : "gray"} type="pill-color">{staff.isActive ? "Active" : "Inactive"}</Badge>
                            <Badge size="sm" color={DBS_BADGE[staff.dbsStatus]} type="pill-color">DBS: {staff.dbsStatus}</Badge>
                        </div>
                    </div>
                </div>
                <Button color="secondary" size="sm" iconLeading={Edit02}>Edit Profile</Button>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <Mail01 className="size-5 text-fg-quaternary" />
                    <div>
                        <p className="text-xs text-tertiary">Email</p>
                        <p className="text-sm font-medium text-primary">{staff.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <Calendar className="size-5 text-fg-quaternary" />
                    <div>
                        <p className="text-xs text-tertiary">Start Date</p>
                        <p className="text-sm font-medium text-primary">{staff.startDate}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <ShieldTick className="size-5 text-fg-quaternary" />
                    <div>
                        <p className="text-xs text-tertiary">DBS Expiry</p>
                        <p className="text-sm font-medium text-primary">{staff.dbsExpiry}</p>
                    </div>
                </div>
            </div>

            {/* Training records */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-primary">Training Records</h2>
                <div className="overflow-hidden rounded-xl border border-secondary">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-secondary bg-secondary">
                                <th className="px-4 py-3 text-left text-xs font-medium text-tertiary">Course</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-tertiary">Completed</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-tertiary">Expiry</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-tertiary">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trainingRecords.map((t: { id: string; courseName: string; completedDate: string; expiryDate: string; status: string }, i: number) => (
                                <tr key={t.id} className={i < trainingRecords.length - 1 ? "border-b border-secondary" : ""}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Award02 className="size-4 text-fg-quaternary" />
                                            <span className="text-sm font-medium text-primary">{t.courseName}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-tertiary">{t.completedDate}</td>
                                    <td className="px-4 py-3 text-sm text-tertiary">{t.expiryDate}</td>
                                    <td className="px-4 py-3">
                                        <Badge size="sm" color={TRAINING_BADGE[t.status] as "success" | "warning" | "error"} type="pill-color">{t.status.replace("_", " ")}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
