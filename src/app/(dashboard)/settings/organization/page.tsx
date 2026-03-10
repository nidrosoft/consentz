"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Lock01, AlertTriangle } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Button } from "@/components/base/buttons/button";
import { useOrganization } from "@/hooks/use-organization";

function OrganizationSkeleton() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-8 w-48 rounded-lg bg-quaternary" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="h-10 w-full rounded-lg bg-quaternary" />
                <div className="h-10 w-full rounded-lg bg-quaternary" />
            </div>
            <div className="h-64 rounded-xl bg-quaternary" />
        </div>
    );
}

export default function OrganizationSettingsPage() {
    const router = useRouter();
    const { data: org, isLoading, error } = useOrganization();

    if (isLoading) return <OrganizationSkeleton />;

    if (error || !org) {
        return (
            <div className="flex flex-col gap-6">
                <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/settings")}>Settings</Button>
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-secondary bg-primary py-20">
                    <AlertTriangle className="size-10 text-warning-primary" />
                    <p className="text-sm text-tertiary">Failed to load organisation details.</p>
                    <Button color="secondary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

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
                <Input label="Organisation name *" defaultValue={org.name} isRequired />

                {/* Service type — locked after onboarding */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-primary">Service type</label>
                    <div className="flex items-center gap-3 rounded-lg border border-secondary bg-disabled_subtle px-3 py-2.5">
                        <span className="text-sm text-primary">{org.serviceType === "CARE_HOME" ? "Care Home" : "Aesthetic Clinic"}</span>
                        <Lock01 className="size-4 text-fg-disabled" />
                        <span className="text-xs text-tertiary">Cannot change after onboarding</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input label="CQC Provider ID" defaultValue={org.cqcProviderId} />
                    <Input label="CQC Location ID" defaultValue={org.cqcLocationId} />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input label="Registered Manager" defaultValue={org.registeredManager} />
                    <Input label="Number of beds" type="number" defaultValue={String(org.bedCount)} isRequired />
                </div>

                <Input label="Address" defaultValue={org.postcode} />
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
