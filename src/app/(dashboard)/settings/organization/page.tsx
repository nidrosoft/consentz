"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Lock01, AlertTriangle } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { mockOrganization } from "@/lib/mock-data";

export default function OrganizationSettingsPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/settings")}>Settings</Button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Organisation Details</h1>
                    <p className="mt-1 text-sm text-tertiary">Manage your organisation name, CQC IDs, and service details.</p>
                </div>
                <Button color="primary" size="lg">Save</Button>
            </div>

            <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6">
                <Input label="Organisation name *" defaultValue={mockOrganization.name} isRequired />

                {/* Service type — locked after onboarding */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-primary">Service type</label>
                    <div className="flex items-center gap-3 rounded-lg border border-secondary bg-disabled_subtle px-3 py-2.5">
                        <span className="text-sm text-primary">{mockOrganization.serviceType === "CARE_HOME" ? "Care Home" : "Aesthetic Clinic"}</span>
                        <Lock01 className="size-4 text-fg-disabled" />
                        <span className="text-xs text-tertiary">Cannot change after onboarding</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input label="CQC Provider ID" defaultValue={mockOrganization.cqcProviderId} />
                    <Input label="CQC Location ID" defaultValue={mockOrganization.cqcLocationId} />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input label="Registered Manager" defaultValue={mockOrganization.registeredManager} />
                    <Input label="Number of beds" type="number" defaultValue={String(mockOrganization.bedCount)} isRequired />
                </div>

                <Input label="Address" defaultValue="123 Oak Street, London, SW1A 1AA" />
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl border border-error-primary bg-primary p-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-error-primary" />
                    <div className="flex-1">
                        <h2 className="text-sm font-semibold text-error-primary">Danger Zone</h2>
                        <p className="mt-1 text-sm text-tertiary">Permanently delete this organisation and all its data. This action cannot be undone.</p>
                    </div>
                    <Button color="primary-destructive" size="sm">Delete Organisation</Button>
                </div>
            </div>
        </div>
    );
}
