"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, FileCheck02, Download01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";

const TEMPLATES = [
    { id: "t1", title: "Safeguarding Adults Policy", category: "Safeguarding", description: "Comprehensive safeguarding policy covering Reg 13 requirements", domain: "Safe" },
    { id: "t2", title: "Infection Prevention & Control", category: "Clinical", description: "IPC policy template meeting CQC standards for Reg 12", domain: "Safe" },
    { id: "t3", title: "Complaints Handling Procedure", category: "Governance", description: "Complaints procedure template meeting Reg 16 requirements", domain: "Responsive" },
    { id: "t4", title: "Mental Capacity Act Policy", category: "Clinical", description: "MCA policy covering consent and best interests under Reg 11", domain: "Effective" },
    { id: "t5", title: "Fire Safety Policy", category: "Health & Safety", description: "Fire safety policy and procedure template for Reg 15", domain: "Safe" },
    { id: "t6", title: "Whistleblowing Policy", category: "Governance", description: "Whistleblowing and raising concerns procedure under Reg 17", domain: "Well-Led" },
    { id: "t7", title: "Medicines Management Policy", category: "Clinical", description: "Medicines management and administration policy for Reg 12", domain: "Safe" },
    { id: "t8", title: "Staff Recruitment Policy", category: "HR", description: "Fit and proper persons recruitment policy under Reg 19", domain: "Safe" },
];

export default function PolicyTemplatesPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/policies")}>Back to Policies</Button>

            <div>
                <h1 className="text-display-xs font-semibold text-primary">Policy Templates</h1>
                <p className="mt-1 text-sm text-tertiary">Pre-built CQC-compliant policy templates you can customise for your organisation.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {TEMPLATES.map((t) => (
                    <div key={t.id} className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-5">
                        <div className="flex items-center gap-2">
                            <FileCheck02 className="size-5 text-fg-quaternary" />
                            <Badge size="sm" color="gray" type="pill-color">{t.domain}</Badge>
                        </div>
                        <h3 className="text-sm font-semibold text-primary">{t.title}</h3>
                        <p className="flex-1 text-xs text-tertiary">{t.description}</p>
                        <div className="flex gap-2">
                            <Button color="primary" size="sm" className="flex-1" onClick={() => router.push("/policies/create")}>Use Template</Button>
                            <Button color="secondary" size="sm" iconLeading={Download01}>PDF</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
