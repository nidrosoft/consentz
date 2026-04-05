"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Edit02, Save01, Mail01, Calendar, ShieldTick, Award02, Phone01, Briefcase01, Hash02 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useStaffDetail, useTrainingRecords, useUpdateStaff } from "@/hooks/use-staff";
import { useUiStore } from "@/stores/ui-store";
import { PageSkeleton } from "@/components/shared/page-skeleton";

const DBS_BADGE: Record<string, "success" | "warning" | "error"> = {
    CLEAR: "success", PENDING: "warning", EXPIRED: "error",
};

const TRAINING_BADGE: Record<string, "success" | "warning" | "error"> = {
    VALID: "success", EXPIRING_SOON: "warning", EXPIRED: "error",
};

type ApiStaffMember = Record<string, any>;

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr || dateStr === "N/A") return "—";
    try {
        return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
        return "—";
    }
}

function normalizeStaff(raw: ApiStaffMember) {
    return {
        id: raw.id,
        name: raw.name ?? `${raw.first_name ?? raw.firstName ?? ""} ${raw.last_name ?? raw.lastName ?? ""}`.trim(),
        firstName: raw.first_name ?? raw.firstName ?? "",
        lastName: raw.last_name ?? raw.lastName ?? "",
        email: raw.email ?? null,
        phone: raw.phone ?? null,
        role: raw.job_title ?? raw.jobTitle ?? "—",
        department: raw.department ?? "—",
        staffRole: raw.staff_role ?? raw.staffRole ?? "OTHER",
        isActive: raw.is_active ?? raw.isActive ?? true,
        startDate: raw.start_date ?? raw.startDate ?? null,
        dbsNumber: raw.dbs_number ?? raw.dbsNumber ?? null,
        dbsCertificateDate: raw.dbs_certificate_date ?? raw.dbsCertificateDate ?? null,
        dbsLevel: raw.dbs_level ?? raw.dbsLevel ?? null,
        dbsStatus: (raw.dbs_certificate_date ?? raw.dbsCertificateDate) ? "CLEAR" : "PENDING",
        registrationBody: raw.registration_body ?? raw.registrationBody ?? null,
        registrationNumber: raw.registration_number ?? raw.registrationNumber ?? null,
        registrationExpiry: raw.registration_expiry ?? raw.registrationExpiry ?? null,
    };
}

export default function StaffDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params.id === "string" ? params.id : "";
    const { data: rawStaff, isLoading, error, refetch } = useStaffDetail(id);
    const { data: trainingData } = useTrainingRecords({ staffId: id });
    const updateMutation = useUpdateStaff();

    const setBreadcrumbLabel = useUiStore((s) => s.setBreadcrumbLabel);
    const clearBreadcrumbLabel = useUiStore((s) => s.clearBreadcrumbLabel);

    const trainingRecords = ((trainingData?.data ?? []) as any[]).map((t: any) => ({
        id: t.id,
        courseName: t.course_name ?? t.courseName ?? "—",
        completedDate: t.completed_date ?? t.completedDate ?? "",
        expiryDate: t.expiry_date ?? t.expiryDate ?? "",
        status: t.status ?? "VALID",
    }));

    const staff = rawStaff ? normalizeStaff(rawStaff as ApiStaffMember) : null;

    useEffect(() => {
        if (staff?.name) setBreadcrumbLabel(id, staff.name);
        return () => clearBreadcrumbLabel(id);
    }, [id, staff?.name, setBreadcrumbLabel, clearBreadcrumbLabel]);

    const [isEditing, setIsEditing] = useState(false);
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editDepartment, setEditDepartment] = useState("");

    const handleStartEdit = useCallback(() => {
        if (!staff) return;
        setEditEmail(staff.email ?? "");
        setEditPhone(staff.phone ?? "");
        setEditDepartment(staff.department ?? "");
        setIsEditing(true);
    }, [staff]);

    function handleSave() {
        const updates: Record<string, unknown> = {};
        if (editEmail !== (staff?.email ?? "")) updates.email = editEmail;
        if (editPhone !== (staff?.phone ?? "")) updates.phone = editPhone;
        if (editDepartment !== (staff?.department ?? "")) updates.department = editDepartment;

        if (Object.keys(updates).length === 0) {
            setIsEditing(false);
            return;
        }
        updateMutation.mutate(
            { id, ...updates },
            { onSuccess: () => setIsEditing(false) },
        );
    }

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
                    <Avatar size="xl" initials={staff.name.split(" ").map((n: string) => n[0]).join("")} />
                    <div>
                        <h1 className="text-display-xs font-semibold text-primary">{staff.name}</h1>
                        <p className="text-sm text-tertiary">{staff.role} &middot; {staff.department}</p>
                        <div className="mt-2 flex items-center gap-3">
                            <Badge size="sm" color={staff.isActive ? "success" : "gray"} type="pill-color">{staff.isActive ? "Active" : "Inactive"}</Badge>
                            <Badge size="sm" color={DBS_BADGE[staff.dbsStatus]} type="pill-color">DBS: {staff.dbsStatus}</Badge>
                        </div>
                    </div>
                </div>
                {isEditing ? (
                    <div className="flex gap-2">
                        <Button color="secondary" size="sm" onClick={() => setIsEditing(false)} isDisabled={updateMutation.isPending}>Cancel</Button>
                        <Button color="primary" size="sm" iconLeading={Save01} onClick={handleSave} isLoading={updateMutation.isPending}>Save Changes</Button>
                    </div>
                ) : (
                    <Button color="secondary" size="sm" iconLeading={Edit02} onClick={handleStartEdit}>Edit Profile</Button>
                )}
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <Mail01 className="size-5 text-fg-quaternary" />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-tertiary">Email</p>
                        {isEditing ? (
                            <Input size="sm" value={editEmail} onChange={setEditEmail} placeholder="email@example.com" />
                        ) : (
                            <p className="text-sm font-medium text-primary truncate">{staff.email || "—"}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <Phone01 className="size-5 text-fg-quaternary" />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-tertiary">Phone</p>
                        {isEditing ? (
                            <Input size="sm" value={editPhone} onChange={setEditPhone} placeholder="07..." />
                        ) : (
                            <p className="text-sm font-medium text-primary">{staff.phone || "—"}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <Calendar className="size-5 text-fg-quaternary" />
                    <div>
                        <p className="text-xs text-tertiary">Start Date</p>
                        <p className="text-sm font-medium text-primary">{formatDate(staff.startDate)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <ShieldTick className="size-5 text-fg-quaternary" />
                    <div>
                        <p className="text-xs text-tertiary">DBS Certificate</p>
                        <p className="text-sm font-medium text-primary">{formatDate(staff.dbsCertificateDate)}</p>
                        {staff.dbsNumber && <p className="text-[11px] text-tertiary">#{staff.dbsNumber}</p>}
                    </div>
                </div>
            </div>

            {/* Professional registration */}
            {staff.registrationBody && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                        <Briefcase01 className="size-5 text-fg-quaternary" />
                        <div>
                            <p className="text-xs text-tertiary">Registration Body</p>
                            <p className="text-sm font-medium text-primary">{staff.registrationBody}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                        <Hash02 className="size-5 text-fg-quaternary" />
                        <div>
                            <p className="text-xs text-tertiary">Registration Number</p>
                            <p className="text-sm font-medium text-primary">{staff.registrationNumber || "—"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                        <Calendar className="size-5 text-fg-quaternary" />
                        <div>
                            <p className="text-xs text-tertiary">Registration Expiry</p>
                            <p className="text-sm font-medium text-primary">{formatDate(staff.registrationExpiry)}</p>
                        </div>
                    </div>
                </div>
            )}

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
                            {trainingRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-tertiary">No training records yet.</td>
                                </tr>
                            ) : trainingRecords.map((t, i) => (
                                <tr key={t.id} className={i < trainingRecords.length - 1 ? "border-b border-secondary" : ""}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Award02 className="size-4 text-fg-quaternary" />
                                            <span className="text-sm font-medium text-primary">{t.courseName}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-tertiary">{formatDate(t.completedDate)}</td>
                                    <td className="px-4 py-3 text-sm text-tertiary">{formatDate(t.expiryDate)}</td>
                                    <td className="px-4 py-3">
                                        <Badge size="sm" color={TRAINING_BADGE[t.status] ?? "gray"} type="pill-color">{t.status.replace("_", " ")}</Badge>
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
