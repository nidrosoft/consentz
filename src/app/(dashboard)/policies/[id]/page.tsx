"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Edit02, Download01, Trash01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { mockPolicies } from "@/lib/mock-data";

const STATUS_BADGE: Record<string, "success" | "warning" | "error" | "gray" | "brand"> = {
    PUBLISHED: "success", APPROVED: "brand", REVIEW: "warning", DRAFT: "gray", ARCHIVED: "error",
};

export default function PolicyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const policy = mockPolicies.find((p) => p.id === params.id);

    if (!policy) return <p className="text-tertiary">Policy not found.</p>;

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/policies")}>Back to Policies</Button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-display-xs font-semibold text-primary">{policy.title}</h1>
                        <Badge size="sm" color={STATUS_BADGE[policy.status]} type="pill-color">{policy.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-tertiary">{policy.category} &middot; {policy.version} &middot; Created by {policy.createdBy}</p>
                </div>
                <div className="flex gap-2">
                    <Button color="secondary" size="sm" iconLeading={Edit02}>Edit</Button>
                    <Button color="secondary" size="sm" iconLeading={Download01}>Export</Button>
                    <Button color="secondary-destructive" size="sm" iconLeading={Trash01}>Delete</Button>
                </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-secondary bg-primary p-6 sm:grid-cols-4">
                <div>
                    <p className="text-xs text-tertiary">Created</p>
                    <p className="mt-1 text-sm font-medium text-primary">{policy.createdAt}</p>
                </div>
                <div>
                    <p className="text-xs text-tertiary">Last Updated</p>
                    <p className="mt-1 text-sm font-medium text-primary">{policy.updatedAt}</p>
                </div>
                <div>
                    <p className="text-xs text-tertiary">Last Reviewed</p>
                    <p className="mt-1 text-sm font-medium text-primary">{policy.lastReviewDate || "—"}</p>
                </div>
                <div>
                    <p className="text-xs text-tertiary">Next Review</p>
                    <p className="mt-1 text-sm font-medium text-primary">{policy.nextReviewDate || "—"}</p>
                </div>
            </div>

            {/* Content area */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <h2 className="mb-4 text-lg font-semibold text-primary">Policy Content</h2>
                <div className="prose max-w-none text-sm text-secondary">
                    <h3>1. Purpose</h3>
                    <p>This policy sets out the approach of the organisation to ensuring compliance with relevant regulations and standards. It provides a framework for staff to follow in their day-to-day activities.</p>
                    <h3>2. Scope</h3>
                    <p>This policy applies to all staff, volunteers, and contractors working within the organisation. It covers all aspects of service delivery and governance.</p>
                    <h3>3. Responsibilities</h3>
                    <p>The Registered Manager is responsible for ensuring this policy is implemented, reviewed, and updated in line with regulatory requirements and organisational needs.</p>
                    <h3>4. Key Procedures</h3>
                    <p>Detailed procedures will be documented in accompanying standard operating procedures (SOPs) and guidance documents.</p>
                    <p className="text-tertiary italic">[Full policy content would appear here in the production version]</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                {policy.status === "DRAFT" && <Button color="primary" size="lg">Submit for Review</Button>}
                {policy.status === "REVIEW" && <Button color="primary" size="lg">Approve Policy</Button>}
                {policy.status === "APPROVED" && <Button color="primary" size="lg">Publish Policy</Button>}
                {policy.status === "PUBLISHED" && <Button color="secondary" size="lg">Schedule Review</Button>}
            </div>
        </div>
    );
}
