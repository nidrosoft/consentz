"use client";

import { Building07, HeartHand } from "@untitledui/icons";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { cx } from "@/utils/cx";
import type { AssessmentData } from "../page";

interface Props {
    data: AssessmentData;
    updateData: <K extends keyof AssessmentData>(field: K, value: AssessmentData[K]) => void;
}

const SERVICE_OPTIONS = [
    {
        id: "AESTHETIC_CLINIC",
        label: "Aesthetic Clinic",
        desc: "Independent healthcare providing cosmetic or aesthetic procedures regulated by CQC",
        Icon: HeartHand,
    },
    {
        id: "CARE_HOME",
        label: "Care Home",
        desc: "Residential adult social care with or without nursing, regulated by CQC",
        Icon: Building07,
    },
];

export default function Step1ServiceType({ data, updateData }: Props) {
    return (
        <div className="space-y-6">
            {/* Context box (Pattern 4) */}
            <div className="rounded-xl border border-brand-200 bg-brand-primary p-4">
                <p className="text-sm font-medium text-brand-secondary">
                    Why does this matter?
                </p>
                <p className="mt-1 text-sm text-brand-secondary">
                    Different CQC-regulated services have different compliance requirements.
                    Your service type determines which assessment questions you&apos;ll see
                    and what regulations apply.
                </p>
            </div>

            {/* Section label */}
            <div>
                <p className="text-md font-semibold text-primary">
                    What type of service do you provide?
                </p>
                <p className="mt-1 text-sm text-tertiary">
                    Select the option that best describes your registered activity.
                </p>
            </div>

            {/* Service type cards (Pattern 3 — selectable cards) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {SERVICE_OPTIONS.map((option) => {
                    const isSelected = data.serviceType === option.id;
                    return (
                        <label
                            key={option.id}
                            className={cx(
                                "flex cursor-pointer items-start gap-4 rounded-xl border p-5 transition-colors",
                                isSelected
                                    ? "border-brand-solid bg-brand-primary"
                                    : "border-secondary bg-primary hover:bg-secondary",
                            )}
                        >
                            <Checkbox
                                isSelected={isSelected}
                                onChange={() => updateData("serviceType", option.id)}
                            />
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p
                                        className={cx(
                                            "font-semibold",
                                            isSelected ? "text-primary" : "text-primary",
                                        )}
                                    >
                                        {option.label}
                                    </p>
                                </div>
                                <p
                                    className={cx(
                                        "mt-1 text-sm",
                                        isSelected ? "text-brand-secondary" : "text-tertiary",
                                    )}
                                >
                                    {option.desc}
                                </p>
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
