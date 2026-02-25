"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, SearchLg, ShieldTick, BookOpen02, AlertTriangle, CreditCard02, MedicalCross, Award02, FilterLines, XClose } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Table, TableCard } from "@/components/application/table/table";
import { cx } from "@/utils/cx";
import { mockStaff } from "@/lib/mock-data";
import type { CredentialStatus } from "@/types";

const DBS_BADGE: Record<string, "success" | "warning" | "error"> = {
    CLEAR: "success", PENDING: "warning", EXPIRED: "error",
};

const CREDENTIAL_BADGE: Record<CredentialStatus, "success" | "warning" | "error" | "gray"> = {
    VALID: "success", EXPIRING_SOON: "warning", EXPIRED: "error", NOT_APPLICABLE: "gray",
};

const ROLES = [...new Set(mockStaff.map((s) => s.role))];
const DEPARTMENTS = [...new Set(mockStaff.map((s) => s.department))];

function daysUntil(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const STAFF_TYPE_LABELS: Record<string, string> = {
    MEDICAL: "Medical",
    NON_MEDICAL: "Non-Medical",
    ADMINISTRATIVE: "Administrative",
};

export default function StaffPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string | null>(null);
    const [deptFilter, setDeptFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | null>(null);
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const filtered = useMemo(() => {
        return mockStaff.filter((s) => {
            if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
            if (roleFilter && s.role !== roleFilter) return false;
            if (deptFilter && s.department !== deptFilter) return false;
            if (typeFilter && s.staffType !== typeFilter) return false;
            if (statusFilter === "active" && !s.isActive) return false;
            if (statusFilter === "inactive" && s.isActive) return false;
            return true;
        });
    }, [search, roleFilter, deptFilter, typeFilter, statusFilter]);

    const dbsDone = mockStaff.filter((s) => s.dbsStatus === "CLEAR").length;
    const dbsExpiringSoon = mockStaff.filter((s) => s.dbsStatus === "CLEAR" && daysUntil(s.dbsExpiry) <= 30).length;
    const dbsExpired = mockStaff.filter((s) => s.dbsStatus === "EXPIRED").length;
    const activeCount = mockStaff.filter((s) => s.isActive).length;
    const gmcRegistered = mockStaff.filter((s) => s.gmcStatus === "VALID").length;
    const aestheticQualified = mockStaff.filter((s) => s.aestheticQualificationStatus === "VALID" || s.aestheticQualificationStatus === "EXPIRING_SOON").length;

    const hasFilters = !!(roleFilter || deptFilter || statusFilter || typeFilter);
    const activeFilterCount = [roleFilter, deptFilter, statusFilter, typeFilter].filter(Boolean).length;

    function clearAllFilters() {
        setRoleFilter(null);
        setDeptFilter(null);
        setStatusFilter(null);
        setTypeFilter(null);
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Staff Directory</h1>
                    <p className="mt-1 text-sm text-tertiary">{mockStaff.length} staff members</p>
                </div>
                <div className="flex gap-2">
                    <Button color="secondary" size="lg" onClick={() => router.push("/staff/training")}>Training Matrix</Button>
                    <Button color="primary" size="lg" iconLeading={Plus} onClick={() => router.push("/staff/add")}>Add Staff</Button>
                </div>
            </div>

            {/* Compliance Summary Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success-primary">
                        <ShieldTick className="size-5 text-success-primary" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-primary">{dbsDone} / {mockStaff.length}</p>
                        <p className="text-xs text-tertiary">DBS cleared</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary">
                        <BookOpen02 className="size-5 text-brand-secondary" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-primary">{activeCount} / {mockStaff.length}</p>
                        <p className="text-xs text-tertiary">Active staff</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning-primary">
                        <AlertTriangle className="size-5 text-warning-primary" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-primary">{dbsExpiringSoon}</p>
                        <p className="text-xs text-tertiary">DBS expiring soon</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-error-primary">
                        <CreditCard02 className="size-5 text-error-primary" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-primary">{dbsExpired}</p>
                        <p className="text-xs text-tertiary">DBS expired</p>
                    </div>
                </div>
                {/* GMC Registration (medical staff) */}
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#EEF4FF]">
                        <MedicalCross className="size-5 text-[#3538CD]" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-primary">{gmcRegistered}</p>
                        <p className="text-xs text-tertiary">GMC registered</p>
                    </div>
                </div>
                {/* Aesthetic Qualifications (non-medical) */}
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F4F3FF]">
                        <Award02 className="size-5 text-[#6938EF]" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-primary">{aestheticQualified}</p>
                        <p className="text-xs text-tertiary">Aesthetic qualified</p>
                    </div>
                </div>
            </div>

            {/* Search + Filter Toggle */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                    <Input size="sm" placeholder="Search by name or email..." icon={SearchLg} value={search} onChange={(v) => setSearch(v)} />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        color={showFilters || hasFilters ? "secondary" : "tertiary"}
                        size="sm"
                        iconLeading={FilterLines}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
                    </Button>
                    {hasFilters && (
                        <Button color="link-gray" size="sm" onClick={clearAllFilters}>
                            Clear all
                        </Button>
                    )}
                </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
                <div className="rounded-xl border border-secondary bg-primary p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Select
                            label="Role"
                            placeholder="All roles"
                            size="sm"
                            selectedKey={roleFilter}
                            onSelectionChange={(key) => setRoleFilter(key === "" ? null : String(key))}
                            items={[{ id: "" }, ...ROLES.map((r) => ({ id: r }))]}
                        >
                            {(item) => <Select.Item id={item.id}>{item.id || "All roles"}</Select.Item>}
                        </Select>

                        <Select
                            label="Department"
                            placeholder="All departments"
                            size="sm"
                            selectedKey={deptFilter}
                            onSelectionChange={(key) => setDeptFilter(key === "" ? null : String(key))}
                            items={[{ id: "" }, ...DEPARTMENTS.map((d) => ({ id: d }))]}
                        >
                            {(item) => <Select.Item id={item.id}>{item.id || "All departments"}</Select.Item>}
                        </Select>

                        <Select
                            label="Staff Type"
                            placeholder="All types"
                            size="sm"
                            selectedKey={typeFilter}
                            onSelectionChange={(key) => setTypeFilter(key === "" ? null : String(key))}
                            items={[{ id: "" }, { id: "MEDICAL" }, { id: "NON_MEDICAL" }, { id: "ADMINISTRATIVE" }]}
                        >
                            {(item) => (
                                <Select.Item id={item.id}>
                                    {item.id === "MEDICAL" ? "Medical" : item.id === "NON_MEDICAL" ? "Non-Medical" : item.id === "ADMINISTRATIVE" ? "Administrative" : "All types"}
                                </Select.Item>
                            )}
                        </Select>

                        <Select
                            label="Status"
                            placeholder="All statuses"
                            size="sm"
                            selectedKey={statusFilter}
                            onSelectionChange={(key) => setStatusFilter(key === "" ? null : (key as "active" | "inactive"))}
                            items={[{ id: "" }, { id: "active" }, { id: "inactive" }]}
                        >
                            {(item) => (
                                <Select.Item id={item.id}>
                                    {item.id === "active" ? "Active" : item.id === "inactive" ? "Inactive" : "All statuses"}
                                </Select.Item>
                            )}
                        </Select>
                    </div>
                </div>
            )}

            {/* Active filter chips */}
            {hasFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-tertiary">Showing:</span>
                    {roleFilter && (
                        <button onClick={() => setRoleFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">Role:</span> {roleFilter}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                    {deptFilter && (
                        <button onClick={() => setDeptFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">Dept:</span> {deptFilter}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                    {typeFilter && (
                        <button onClick={() => setTypeFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">Type:</span> {STAFF_TYPE_LABELS[typeFilter] ?? typeFilter}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                    {statusFilter && (
                        <button onClick={() => setStatusFilter(null)} className="inline-flex items-center gap-1.5 rounded-full border border-secondary bg-primary px-2.5 py-1 text-xs font-medium capitalize text-secondary transition duration-100 hover:bg-primary_hover">
                            <span className="text-quaternary">Status:</span> {statusFilter}
                            <XClose className="size-3 text-quaternary" />
                        </button>
                    )}
                </div>
            )}

            {/* Table */}
            <TableCard.Root>
                <TableCard.Header title="Staff Directory" badge={String(filtered.length)} description="Click any row to view staff profile." />
                <Table aria-label="Staff" selectionMode="none">
                    <Table.Header>
                        <Table.Head id="name" label="Name" isRowHeader />
                        <Table.Head id="role" label="Role" />
                        <Table.Head id="type" label="Type" />
                        <Table.Head id="dbs" label="DBS" />
                        <Table.Head id="gmc" label="GMC" />
                        <Table.Head id="aesthetic" label="Aesthetic Qual." />
                        <Table.Head id="status" label="Status" />
                    </Table.Header>
                    <Table.Body items={filtered}>
                        {(staff) => {
                            const dbsDays = daysUntil(staff.dbsExpiry);
                            const gmcDays = staff.gmcExpiry ? daysUntil(staff.gmcExpiry) : null;
                            const aqDays = staff.aestheticQualificationExpiry ? daysUntil(staff.aestheticQualificationExpiry) : null;
                            return (
                                <Table.Row id={staff.id} className="cursor-pointer" onAction={() => router.push(`/staff/${staff.id}`)}>
                                    <Table.Cell>
                                        <div className="flex items-center gap-3">
                                            <Avatar size="sm" initials={staff.name.split(" ").map((n) => n[0]).join("")} />
                                            <div>
                                                <p className="text-sm font-medium text-primary whitespace-nowrap">{staff.name}</p>
                                                <p className="text-xs text-tertiary">{staff.email}</p>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-sm text-tertiary whitespace-nowrap">{staff.role}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge size="sm" color={staff.staffType === "MEDICAL" ? "blue" : staff.staffType === "NON_MEDICAL" ? "purple" : "gray"} type="pill-color">
                                            {staff.staffType === "MEDICAL" ? "Medical" : staff.staffType === "NON_MEDICAL" ? "Non-Medical" : "Admin"}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div>
                                            <BadgeWithDot size="sm" color={DBS_BADGE[staff.dbsStatus]}>
                                                {staff.dbsStatus}
                                                {staff.dbsStatus === "CLEAR" && dbsDays <= 30 && dbsDays > 0 && ` (${dbsDays}d)`}
                                            </BadgeWithDot>
                                            <p className={cx("mt-0.5 text-[11px] whitespace-nowrap", dbsDays !== null && dbsDays <= 30 ? "font-medium text-warning-primary" : dbsDays !== null && dbsDays <= 0 ? "font-medium text-error-primary" : "text-tertiary")}>
                                                {new Date(staff.dbsExpiry).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                            </p>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {/* GMC Registration — medical doctors registered with the General Medical Council (UK) */}
                                        {staff.gmcStatus === "NOT_APPLICABLE" ? (
                                            <span className="text-xs text-quaternary">N/A</span>
                                        ) : (
                                            <div>
                                                <BadgeWithDot size="sm" color={CREDENTIAL_BADGE[staff.gmcStatus]}>
                                                    {staff.gmcStatus === "VALID" ? "Registered" : staff.gmcStatus.replace("_", " ")}
                                                </BadgeWithDot>
                                                {staff.gmcNumber && <p className="mt-0.5 text-[11px] text-tertiary">GMC #{staff.gmcNumber}</p>}
                                                {staff.gmcExpiry && (
                                                    <p className={cx("text-[11px] whitespace-nowrap", gmcDays !== null && gmcDays <= 30 ? "font-medium text-warning-primary" : "text-tertiary")}>
                                                        Exp: {new Date(staff.gmcExpiry).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {/* Aesthetic Qualification — Level 7 Diploma or equivalent for non-medical aesthetic practitioners */}
                                        {staff.aestheticQualificationStatus === "NOT_APPLICABLE" ? (
                                            <span className="text-xs text-quaternary">N/A</span>
                                        ) : (
                                            <div>
                                                <BadgeWithDot size="sm" color={CREDENTIAL_BADGE[staff.aestheticQualificationStatus]}>
                                                    {staff.aestheticQualificationStatus === "VALID" ? "Qualified" : staff.aestheticQualificationStatus.replace("_", " ")}
                                                </BadgeWithDot>
                                                {staff.aestheticQualification && <p className="mt-0.5 text-[11px] text-tertiary line-clamp-1">{staff.aestheticQualification}</p>}
                                                {staff.aestheticQualificationExpiry && (
                                                    <p className={cx("text-[11px] whitespace-nowrap", aqDays !== null && aqDays <= 30 ? "font-medium text-warning-primary" : "text-tertiary")}>
                                                        Exp: {new Date(staff.aestheticQualificationExpiry).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <BadgeWithDot size="sm" color={staff.isActive ? "success" : "gray"}>
                                            {staff.isActive ? "Active" : "Inactive"}
                                        </BadgeWithDot>
                                    </Table.Cell>
                                </Table.Row>
                            );
                        }}
                    </Table.Body>
                </Table>
            </TableCard.Root>
        </div>
    );
}
