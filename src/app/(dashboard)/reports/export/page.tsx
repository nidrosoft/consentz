"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Download01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { DatePickerField } from "@/components/application/date-picker/date-picker-field";
import { cx } from "@/utils/cx";

const SECTIONS = [
    { id: "compliance", label: "Compliance scores & domain breakdown", defaultChecked: true },
    { id: "gaps", label: "Gap analysis", defaultChecked: true },
    { id: "evidence", label: "Evidence inventory", defaultChecked: true },
    { id: "staff", label: "Staff compliance matrix", defaultChecked: false },
    { id: "incidents", label: "Incident history", defaultChecked: false },
    { id: "audit", label: "Full audit log", defaultChecked: false },
];

export default function ExportPage() {
    const router = useRouter();
    const [format, setFormat] = useState<"pdf" | "csv">("pdf");
    const [checked, setChecked] = useState<Record<string, boolean>>(
        Object.fromEntries(SECTIONS.map((s) => [s.id, s.defaultChecked])),
    );
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const toggleSection = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
    const selectedCount = Object.values(checked).filter(Boolean).length;

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/reports")}>Back to Reports</Button>

            <div>
                <h1 className="text-display-xs font-semibold text-primary">Export Compliance Data</h1>
                <p className="mt-1 text-sm text-tertiary">Download compliance data as PDF or CSV for your records.</p>
            </div>

            {/* Format */}
            <div className="rounded-xl border border-secondary bg-primary p-4 sm:p-5">
                <h3 className="mb-3 text-sm font-semibold text-primary">Format</h3>
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                    <button onClick={() => setFormat("pdf")} className={cx("flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition duration-100", format === "pdf" ? "border-brand-600 bg-brand-primary text-brand-secondary" : "border-secondary bg-primary text-secondary hover:bg-primary_hover")}>
                        <span className="size-4 rounded-full border-2 flex items-center justify-center {format === 'pdf' ? 'border-brand-600' : 'border-tertiary'}">
                            {format === "pdf" && <span className="size-2 rounded-full bg-brand-600" />}
                        </span>
                        PDF Report (formatted, printable)
                    </button>
                    <button onClick={() => setFormat("csv")} className={cx("flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition duration-100", format === "csv" ? "border-brand-600 bg-brand-primary text-brand-secondary" : "border-secondary bg-primary text-secondary hover:bg-primary_hover")}>
                        <span className="size-4 rounded-full border-2 flex items-center justify-center {format === 'csv' ? 'border-brand-600' : 'border-tertiary'}">
                            {format === "csv" && <span className="size-2 rounded-full bg-brand-600" />}
                        </span>
                        CSV Data (spreadsheet-ready)
                    </button>
                </div>
            </div>

            {/* Include sections */}
            <div className="rounded-xl border border-secondary bg-primary p-4 sm:p-5">
                <h3 className="mb-3 text-sm font-semibold text-primary">Include</h3>
                <div className="flex flex-col gap-2">
                    {SECTIONS.map((s) => (
                        <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-primary_hover">
                            <input
                                type="checkbox"
                                checked={checked[s.id]}
                                onChange={() => toggleSection(s.id)}
                                className="size-4 rounded border-secondary accent-brand-600"
                            />
                            <span className="text-sm text-primary">{s.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Date range */}
            <div className="rounded-xl border border-secondary bg-primary p-4 sm:p-5">
                <h3 className="mb-3 text-sm font-semibold text-primary">Date Range</h3>
                <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex-1">
                        <DatePickerField label="From" value={dateFrom} onChange={setDateFrom} size="sm" />
                    </div>
                    <div className="flex-1">
                        <DatePickerField label="To" value={dateTo} onChange={setDateTo} size="sm" />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button color="secondary" size="lg" onClick={() => router.push("/reports")}>Cancel</Button>
                <Button color="primary" size="lg" iconLeading={Download01} disabled={selectedCount === 0}>
                    Export {format.toUpperCase()}
                </Button>
            </div>
        </div>
    );
}
