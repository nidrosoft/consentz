"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Stars01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";

const CATEGORIES = ["Health & Safety", "Clinical", "Governance", "HR", "Operations", "Safeguarding"];

export default function CreatePolicyPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/policies")}>Back to Policies</Button>

            <div>
                <h1 className="text-display-xs font-semibold text-primary">Create New Policy</h1>
                <p className="mt-1 text-sm text-tertiary">Write a new policy document or generate one with AI.</p>
            </div>

            {/* AI generate card */}
            <div className="rounded-xl border border-brand-200 bg-brand-primary p-6">
                <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-solid">
                        <Stars01 className="size-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-primary">AI-Generated Policy</h3>
                        <p className="mt-1 text-sm text-tertiary">Generate a CQC-compliant policy draft using AI. You can then review and edit before publishing.</p>
                        <Button color="primary" size="sm" className="mt-3">Generate with AI</Button>
                    </div>
                </div>
            </div>

            {/* Manual form */}
            <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6">
                <h2 className="text-lg font-semibold text-primary">Or write manually</h2>
                <Input label="Policy title" placeholder="Safeguarding Adults Policy" isRequired />
                <Select label="Category" placeholder="Select category...">
                    {CATEGORIES.map((c) => (
                        <Select.Item key={c} id={c}>{c}</Select.Item>
                    ))}
                </Select>
                <Input label="Version" placeholder="v1.0" />

                {/* Rich text editor placeholder */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-secondary">Policy content</label>
                    <div className="min-h-[300px] rounded-lg border border-secondary bg-primary p-4">
                        <p className="text-sm text-quaternary">Start typing your policy content here...</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button color="secondary" size="lg" onClick={() => router.push("/policies")}>Cancel</Button>
                <Button color="tertiary" size="lg">Save as Draft</Button>
                <Button color="primary" size="lg">Submit for Review</Button>
            </div>
        </div>
    );
}
