"use client";

import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { RadioGroup, RadioButton } from "@/components/base/radio-buttons/radio-buttons";
import { DatePickerField } from "@/components/application/date-picker/date-picker-field";
import type { AssessmentData } from "../page";

interface Props {
    data: AssessmentData;
    updateData: <K extends keyof AssessmentData>(field: K, value: AssessmentData[K]) => void;
}

const RATING_OPTIONS = [
    { id: "Not yet rated", label: "Not yet rated" },
    { id: "Outstanding", label: "Outstanding" },
    { id: "Good", label: "Good" },
    { id: "Requires Improvement", label: "Requires Improvement" },
    { id: "Inadequate", label: "Inadequate" },
];

export default function Step2Organization({ data, updateData }: Props) {
    return (
        <div className="space-y-8">
            {/* Context box (Pattern 4) */}
            <div className="rounded-xl border border-brand-200 bg-brand-primary p-4">
                <p className="text-sm font-medium text-brand-secondary">
                    Why we need these details
                </p>
                <p className="mt-1 text-sm text-brand-secondary">
                    We use your organisation details to personalise your compliance requirements,
                    tailor the question bank, and pre-populate your CQC compliance dashboard.
                </p>
            </div>

            {/* Organisation name (Pattern 1) */}
            <div className="space-y-2">
                <label className="text-md font-semibold text-primary">Organisation name *</label>
                <Input
                    placeholder="eg. Brightwood Care Home"
                    value={data.organizationName}
                    onChange={(v) => updateData("organizationName", v)}
                    size="md"
                />
            </div>

            {/* CQC IDs — two-col grid (Pattern 1) */}
            <div className="space-y-4">
                <p className="text-md font-semibold text-primary">CQC Registration (optional)</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">CQC Provider ID</label>
                        <Input
                            placeholder="eg. 1-123456789"
                            value={data.cqcProviderId}
                            onChange={(v) => updateData("cqcProviderId", v)}
                            size="md"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">CQC Location ID</label>
                        <Input
                            placeholder="eg. 1-987654321"
                            value={data.cqcLocationId}
                            onChange={(v) => updateData("cqcLocationId", v)}
                            size="md"
                        />
                    </div>
                </div>
            </div>

            {/* Registered Manager (Pattern 1) */}
            <div className="space-y-2">
                <label className="text-md font-semibold text-primary">Registered Manager name</label>
                <Input
                    placeholder="eg. Jane Smith"
                    value={data.registeredManager}
                    onChange={(v) => updateData("registeredManager", v)}
                    size="md"
                />
            </div>

            {/* Postcode + Beds (Pattern 1 — two-col) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-md font-semibold text-primary">Postcode *</label>
                    <Input
                        placeholder="eg. SW1A 1AA"
                        value={data.postcode}
                        onChange={(v) => updateData("postcode", v)}
                        size="md"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-md font-semibold text-primary">Number of beds / rooms *</label>
                    <Input
                        placeholder="eg. 35"
                        type="number"
                        value={data.bedCount}
                        onChange={(v) => updateData("bedCount", v)}
                        size="md"
                    />
                </div>
            </div>

            {/* CQC Rating (Pattern 2 — radio grid) */}
            <div className="space-y-4">
                <p className="text-md font-semibold text-primary">Current CQC rating (if known)</p>
                <RadioGroup
                    value={data.cqcRating}
                    onChange={(v) => updateData("cqcRating", v)}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                    {RATING_OPTIONS.map((opt) => (
                        <RadioButton key={opt.id} value={opt.id} label={opt.label} />
                    ))}
                </RadioGroup>
            </div>

            {/* Last Inspection (Pattern 1) */}
            <DatePickerField
                label="Last inspection date (if known)"
                value={data.lastInspection}
                onChange={(v) => updateData("lastInspection", v)}
                size="md"
            />
        </div>
    );
}
