"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";

const INCIDENT_TYPES = ["Premises", "Patient Complication"];
const CATEGORIES = ["Clinical", "Health & Safety", "Safeguarding", "Medication", "Equipment", "Environmental", "Complication", "Other"];
const SEVERITIES = ["Critical", "Major", "Minor", "Near Miss"];
const DOMAINS = ["Safe", "Effective", "Caring", "Responsive", "Well-Led"];

export default function ReportIncidentPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/incidents")}>Back to Incidents</Button>

            <div>
                <h1 className="text-display-xs font-semibold text-primary">Report an Incident</h1>
                <p className="mt-1 text-sm text-tertiary">Record a new incident or near miss for investigation and tracking.</p>
            </div>

            <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6">
                <Input label="Incident title" placeholder="Brief description of the incident" isRequired />
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-secondary">Description</label>
                    <textarea
                        className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary placeholder:text-quaternary focus:border-brand-300 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                        rows={5}
                        placeholder="Detailed description of what happened, when, and who was involved..."
                    />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Select label="Incident type" placeholder="Select..." hint="Premises = facility incidents. Patient Complication = adverse reactions or clinical complications.">
                        {INCIDENT_TYPES.map((t) => <Select.Item key={t} id={t}>{t}</Select.Item>)}
                    </Select>
                    <Select label="Category" placeholder="Select...">
                        {CATEGORIES.map((c) => <Select.Item key={c} id={c}>{c}</Select.Item>)}
                    </Select>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Select label="Severity" placeholder="Select...">
                        {SEVERITIES.map((s) => <Select.Item key={s} id={s}>{s}</Select.Item>)}
                    </Select>
                    <Select label="Related domain" placeholder="Select...">
                        {DOMAINS.map((d) => <Select.Item key={d} id={d}>{d}</Select.Item>)}
                    </Select>
                </div>
                <Input label="Date and time of incident" type="datetime-local" isRequired />
                <Input label="Persons involved" placeholder="Names of staff/residents involved" />
                <Input label="Witnesses" placeholder="Names of witnesses" />
                <Input label="Immediate action taken" placeholder="What steps were taken immediately?" />
            </div>

            <div className="flex justify-end gap-3">
                <Button color="secondary" size="lg" onClick={() => router.push("/incidents")}>Cancel</Button>
                <Button color="primary" size="lg" onClick={() => router.push("/incidents")}>Submit Report</Button>
            </div>
        </div>
    );
}
