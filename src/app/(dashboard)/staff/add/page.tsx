"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { DatePickerField } from "@/components/application/date-picker/date-picker-field";

const DEPARTMENTS = ["Management", "Care", "Clinical", "Administration", "Housekeeping", "Kitchen"];
const ROLES = ["Registered Manager", "Deputy Manager", "Senior Carer", "Care Assistant", "Nurse", "Admin Officer", "Kitchen Staff", "Housekeeper"];

export default function AddStaffPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/staff")}>Back to Staff</Button>

            <div>
                <h1 className="text-display-xs font-semibold text-primary">Add Staff Member</h1>
                <p className="mt-1 text-sm text-tertiary">Add a new team member to your organisation.</p>
            </div>

            <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input label="Full name" placeholder="Jane Smith" isRequired />
                    <Input label="Email" placeholder="jane@brightwood.co.uk" type="email" isRequired />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Select label="Department" placeholder="Select...">
                        {DEPARTMENTS.map((d) => <Select.Item key={d} id={d}>{d}</Select.Item>)}
                    </Select>
                    <Select label="Role" placeholder="Select...">
                        {ROLES.map((r) => <Select.Item key={r} id={r}>{r}</Select.Item>)}
                    </Select>
                </div>
                <DatePickerField label="Start date" isRequired />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Select label="DBS Status" placeholder="Select...">
                        {["Clear", "Pending", "Not Started"].map((s) => <Select.Item key={s} id={s}>{s}</Select.Item>)}
                    </Select>
                    <DatePickerField label="DBS expiry date" />
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button color="secondary" size="lg" onClick={() => router.push("/staff")}>Cancel</Button>
                <Button color="primary" size="lg" onClick={() => router.push("/staff")}>Add Staff Member</Button>
            </div>
        </div>
    );
}
