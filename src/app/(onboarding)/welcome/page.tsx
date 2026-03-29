"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building07, HeartHand } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { apiPost } from "@/lib/api-client";
import { cx } from "@/utils/cx";

type ServiceType = "AESTHETIC_CLINIC" | "CARE_HOME" | null;

const SERVICE_OPTIONS = [
    {
        id: "AESTHETIC_CLINIC" as const,
        title: "Aesthetic Clinic",
        description: "Independent healthcare providing cosmetic or aesthetic procedures",
        Icon: HeartHand,
    },
    {
        id: "CARE_HOME" as const,
        title: "Care Home",
        description: "Residential adult social care with or without nursing",
        Icon: Building07,
    },
];

export default function WelcomePage() {
    const router = useRouter();
    const [selected, setSelected] = useState<ServiceType>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    async function onContinue() {
        if (!selected) return;
        setSaving(true);
        setSaveError("");
        try {
            await apiPost("/api/onboarding/service-type", { serviceType: selected });
            sessionStorage.setItem("consentz_service_type", selected);
            router.push("/assessment");
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : "Could not save. Try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-display-xs font-semibold text-primary">Welcome to CQC Compliance</h1>
                <p className="text-md text-tertiary">
                    Let&apos;s set up your compliance workspace. This takes about 10 minutes.
                </p>
            </div>

            <div className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-primary">What type of service do you provide?</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {SERVICE_OPTIONS.map((option) => {
                        const isSelected = selected === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setSelected(option.id)}
                                className={cx(
                                    "flex w-full min-w-0 flex-col gap-4 rounded-xl border-2 p-4 text-left transition duration-100 ease-linear sm:p-6",
                                    isSelected
                                        ? "border-brand-600 bg-brand-primary shadow-md"
                                        : "border-secondary bg-primary hover:border-brand-300 hover:bg-primary_hover",
                                )}
                            >
                                <div className={cx(
                                    "flex size-12 items-center justify-center rounded-xl",
                                    isSelected ? "bg-brand-solid" : "bg-secondary",
                                )}>
                                    <option.Icon className={cx("size-6", isSelected ? "text-white" : "text-fg-secondary")} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-primary">{option.title}</h3>
                                    <p className="mt-1 text-sm text-tertiary">{option.description}</p>
                                </div>
                                <div className={cx(
                                    "flex size-5 items-center justify-center rounded-full border-2",
                                    isSelected ? "border-brand-600 bg-brand-600" : "border-secondary",
                                )}>
                                    {isSelected && <div className="size-2 rounded-full bg-white" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {saveError && (
                <p className="text-sm text-error-primary" role="alert">
                    {saveError}
                </p>
            )}
            <div className="flex justify-stretch sm:justify-end">
                <Button
                    color="primary"
                    size="lg"
                    className="w-full sm:w-auto"
                    isDisabled={!selected || saving}
                    isLoading={saving}
                    onClick={() => void onContinue()}
                >
                    Continue &rarr;
                </Button>
            </div>
        </div>
    );
}
