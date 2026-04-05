"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { DatePickerField } from "@/components/application/date-picker/date-picker-field";
import { useCreateStaff } from "@/hooks/use-staff";
import { useMarkOnboardingStep } from "@/hooks/use-onboarding";

const DEPARTMENTS = ["Management", "Care", "Clinical", "Administration", "Housekeeping", "Kitchen"];
const ROLES = [
    { id: "REGISTERED_MANAGER", label: "Registered Manager" },
    { id: "DEPUTY_MANAGER", label: "Deputy Manager" },
    { id: "SENIOR_CARER", label: "Senior Carer" },
    { id: "CARE_ASSISTANT", label: "Care Assistant" },
    { id: "REGISTERED_NURSE", label: "Nurse" },
    { id: "PRACTITIONER", label: "Practitioner" },
    { id: "ADMIN", label: "Admin Officer" },
    { id: "DOMESTIC", label: "Domestic" },
    { id: "OTHER", label: "Other" },
];
const DBS_LEVELS = [
    { id: "basic", label: "Basic" },
    { id: "standard", label: "Standard" },
    { id: "enhanced", label: "Enhanced" },
    { id: "enhanced_barred", label: "Enhanced with Barred List" },
];

export default function AddStaffPage() {
    const router = useRouter();
    const createStaff = useCreateStaff();
    const markOnboardingStep = useMarkOnboardingStep();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [department, setDepartment] = useState<string | null>(null);
    const [staffRole, setStaffRole] = useState<string | null>(null);
    const [jobTitle, setJobTitle] = useState("");
    const [startDate, setStartDate] = useState("");
    const [dbsNumber, setDbsNumber] = useState("");
    const [dbsLevel, setDbsLevel] = useState<string | null>(null);
    const [dbsCertificateDate, setDbsCertificateDate] = useState("");
    const [registrationBody, setRegistrationBody] = useState<string | null>(null);
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [registrationExpiry, setRegistrationExpiry] = useState("");

    const isValid = firstName.trim() && lastName.trim() && staffRole && startDate;

    const handleSubmit = useCallback(() => {
        if (!isValid) return;

        createStaff.mutate(
            {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim() || undefined,
                jobTitle: jobTitle.trim() || ROLES.find((r) => r.id === staffRole)?.label || staffRole!,
                staffRole,
                department: department || undefined,
                startDate,
                dbsNumber: dbsNumber.trim() || undefined,
                dbsLevel: dbsLevel || undefined,
                dbsCertificateDate: dbsCertificateDate || undefined,
                registrationBody: registrationBody || undefined,
                registrationNumber: registrationNumber.trim() || undefined,
                registrationExpiry: registrationExpiry || undefined,
            },
            {
                onSuccess: (data: any) => {
                    markOnboardingStep("add_staff");
                    if (data?.id) {
                        router.push(`/staff/${data.id}`);
                    } else {
                        router.push("/staff");
                    }
                },
            },
        );
    }, [
        isValid, firstName, lastName, email, jobTitle, staffRole, department,
        startDate, dbsNumber, dbsLevel, dbsCertificateDate, registrationBody,
        registrationNumber, registrationExpiry, createStaff, router,
    ]);

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/staff")}>Back to Staff</Button>

            <div>
                <h1 className="text-display-xs font-semibold text-primary">Add Staff Member</h1>
                <p className="mt-1 text-sm text-tertiary">Add a new team member to your organisation.</p>
            </div>

            {/* Personal details */}
            <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6">
                <h2 className="text-sm font-semibold text-secondary">Personal Details</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input label="First name" placeholder="Jane" isRequired value={firstName} onChange={setFirstName} />
                    <Input label="Last name" placeholder="Smith" isRequired value={lastName} onChange={setLastName} />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input label="Email" placeholder="jane@brightwood.co.uk" type="email" value={email} onChange={setEmail} />
                    <Input label="Job title" placeholder="e.g. Senior Care Assistant" value={jobTitle} onChange={setJobTitle} />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Select
                        label="Department"
                        placeholder="Select department..."
                        selectedKey={department}
                        onSelectionChange={(key) => setDepartment(key as string)}
                    >
                        {DEPARTMENTS.map((d) => <Select.Item key={d} id={d}>{d}</Select.Item>)}
                    </Select>
                    <Select
                        label="Staff role"
                        placeholder="Select role..."
                        isRequired
                        selectedKey={staffRole}
                        onSelectionChange={(key) => setStaffRole(key as string)}
                    >
                        {ROLES.map((r) => <Select.Item key={r.id} id={r.id}>{r.label}</Select.Item>)}
                    </Select>
                </div>
                <DatePickerField label="Start date" isRequired value={startDate} onChange={setStartDate} />
            </div>

            {/* DBS Check */}
            <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6">
                <h2 className="text-sm font-semibold text-secondary">DBS Check</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input label="DBS certificate number" placeholder="e.g. 001234567890" value={dbsNumber} onChange={setDbsNumber} />
                    <Select
                        label="DBS level"
                        placeholder="Select level..."
                        selectedKey={dbsLevel}
                        onSelectionChange={(key) => setDbsLevel(key as string)}
                    >
                        {DBS_LEVELS.map((l) => <Select.Item key={l.id} id={l.id}>{l.label}</Select.Item>)}
                    </Select>
                </div>
                <DatePickerField label="DBS certificate date" value={dbsCertificateDate} onChange={setDbsCertificateDate} />
            </div>

            {/* Professional Registration */}
            <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6">
                <h2 className="text-sm font-semibold text-secondary">Professional Registration (optional)</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <Select
                        label="Registration body"
                        placeholder="Select..."
                        selectedKey={registrationBody}
                        onSelectionChange={(key) => setRegistrationBody(key as string)}
                    >
                        {["GMC", "NMC", "GPhC", "GDC", "HCPC", "OTHER"].map((b) => <Select.Item key={b} id={b}>{b}</Select.Item>)}
                    </Select>
                    <Input label="Registration number" placeholder="e.g. 1234567" value={registrationNumber} onChange={setRegistrationNumber} />
                    <DatePickerField label="Registration expiry" value={registrationExpiry} onChange={setRegistrationExpiry} />
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button color="secondary" size="lg" onClick={() => router.push("/staff")} isDisabled={createStaff.isPending}>Cancel</Button>
                <Button
                    color="primary"
                    size="lg"
                    isDisabled={!isValid}
                    isLoading={createStaff.isPending}
                    onClick={handleSubmit}
                >
                    Add Staff Member
                </Button>
            </div>
        </div>
    );
}
