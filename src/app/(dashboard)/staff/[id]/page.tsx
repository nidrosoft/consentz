"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Edit02, Mail01, Calendar, ShieldTick, Award02 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { mockStaff } from "@/lib/mock-data";

const DBS_BADGE: Record<string, "success" | "warning" | "error"> = {
    CLEAR: "success", PENDING: "warning", EXPIRED: "error",
};

const MOCK_TRAINING = [
    { id: "tr1", course: "Fire Safety Awareness", completed: "2025-11-15", expiry: "2026-11-15", status: "VALID" as const },
    { id: "tr2", course: "Safeguarding Adults Level 2", completed: "2025-09-20", expiry: "2026-09-20", status: "VALID" as const },
    { id: "tr3", course: "Manual Handling", completed: "2025-06-10", expiry: "2026-06-10", status: "VALID" as const },
    { id: "tr4", course: "Infection Control", completed: "2024-12-01", expiry: "2025-12-01", status: "EXPIRED" as const },
    { id: "tr5", course: "First Aid at Work", completed: "2025-03-15", expiry: "2026-03-15", status: "EXPIRING_SOON" as const },
];

const TRAINING_BADGE: Record<string, "success" | "warning" | "error"> = {
    VALID: "success", EXPIRING_SOON: "warning", EXPIRED: "error",
};

export default function StaffDetailPage() {
    const params = useParams();
    const router = useRouter();
    const staff = mockStaff.find((s) => s.id === params.id);

    if (!staff) return <p className="text-tertiary">Staff member not found.</p>;

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
                            {MOCK_TRAINING.map((t, i) => (
                                <tr key={t.id} className={i < MOCK_TRAINING.length - 1 ? "border-b border-secondary" : ""}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Award02 className="size-4 text-fg-quaternary" />
                                            <span className="text-sm font-medium text-primary">{t.course}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-tertiary">{t.completed}</td>
                                    <td className="px-4 py-3 text-sm text-tertiary">{t.expiry}</td>
                                    <td className="px-4 py-3">
                                        <Badge size="sm" color={TRAINING_BADGE[t.status]} type="pill-color">{t.status.replace("_", " ")}</Badge>
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
