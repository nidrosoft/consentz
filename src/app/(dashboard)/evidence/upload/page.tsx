"use client";

import { useRouter } from "next/navigation";
import { UploadCloud01, ChevronLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { DatePickerField } from "@/components/application/date-picker/date-picker-field";

const EVIDENCE_TYPES = ["Policy", "Certificate", "Training Record", "Audit Report", "Risk Assessment", "Meeting Minutes", "Photo", "Other"];
const DOMAINS = ["Safe", "Effective", "Caring", "Responsive", "Well-Led"];

export default function EvidenceUploadPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/evidence")}>Back to Evidence</Button>

            <div>
                <h1 className="text-display-xs font-semibold text-primary">Upload Evidence</h1>
                <p className="mt-1 text-sm text-tertiary">Add a new document to your evidence library.</p>
            </div>

            {/* Drop zone */}
            <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-secondary bg-secondary p-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary">
                    <UploadCloud01 className="size-6 text-fg-quaternary" />
                </div>
                <div>
                    <p className="text-sm font-medium text-primary">Click to upload or drag and drop</p>
                    <p className="mt-1 text-xs text-tertiary">PDF, DOCX, XLSX, JPG, PNG up to 10MB</p>
                </div>
                <Button color="secondary" size="sm">Choose File</Button>
            </div>

            {/* Meta form */}
            <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6">
                <Input label="Document name" placeholder="Fire Safety Certificate 2026" isRequired />
                <Select label="Document type" placeholder="Select type...">
                    {EVIDENCE_TYPES.map((t) => (
                        <Select.Item key={t} id={t}>{t}</Select.Item>
                    ))}
                </Select>
                <Select label="Linked domain" placeholder="Select domain...">
                    {DOMAINS.map((d) => (
                        <Select.Item key={d} id={d}>{d}</Select.Item>
                    ))}
                </Select>
                <Input label="Linked KLOE code" placeholder="S1, S2, E3..." hint="Comma-separated KLOE codes" />
                <DatePickerField label="Expiry date (if applicable)" />
            </div>

            <div className="flex justify-end gap-3">
                <Button color="secondary" size="lg" onClick={() => router.push("/evidence")}>Cancel</Button>
                <Button color="primary" size="lg" onClick={() => router.push("/evidence")}>Upload &amp; Save</Button>
            </div>
        </div>
    );
}
