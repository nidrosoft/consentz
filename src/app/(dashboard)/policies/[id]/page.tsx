"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Edit02, Download01, Trash01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { usePolicyDetail } from "@/hooks/use-policies";

const STATUS_BADGE: Record<string, "success" | "warning" | "error" | "gray" | "brand"> = {
    PUBLISHED: "success", APPROVED: "brand", REVIEW: "warning", DRAFT: "gray", ARCHIVED: "error",
    ACTIVE: "success", UNDER_REVIEW: "warning",
};

type ApiPolicy = {
    id: string;
    title: string;
    status: string;
    version?: string;
    category?: string;
    domains?: string[];
    content?: string;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
    lastUpdated?: string;
    approvedAt?: string;
    lastReviewDate?: string;
    nextReviewDate?: string;
};

export default function PolicyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params.id === "string" ? params.id : "";
    const { data: policy, isLoading, error } = usePolicyDetail(id);

    const p = policy as ApiPolicy | null | undefined;
    const displayPolicy = p
        ? {
            id: p.id,
            title: p.title,
            status: p.status,
            content: p.content,
            category: p.category ?? p.domains?.[0] ?? "—",
            version: p.version ?? "1.0",
            createdBy: p.createdBy ?? "—",
            createdAt: p.createdAt ?? "—",
            updatedAt: p.updatedAt ?? p.lastUpdated ?? "—",
            lastReviewDate: p.lastReviewDate ?? p.approvedAt ?? p.lastUpdated ?? "—",
            nextReviewDate: p.nextReviewDate ?? "—",
        }
        : null;

    if (error) {
        return (
            <div className="flex flex-col gap-6">
                <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/policies")}>Back to Policies</Button>
                <div className="rounded-xl border border-error bg-error-secondary/20 p-6">
                    <p className="text-sm font-medium text-error-primary">Failed to load policy</p>
                    <p className="mt-1 text-sm text-tertiary">{String(error)}</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="h-6 w-24 animate-pulse rounded bg-secondary" />
                <div className="flex flex-col gap-4">
                    <div className="h-10 w-64 animate-pulse rounded bg-secondary" />
                    <div className="h-4 w-48 animate-pulse rounded bg-secondary" />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 animate-pulse rounded bg-secondary" />
                    ))}
                </div>
                <div className="h-48 animate-pulse rounded-xl border border-secondary bg-primary" />
            </div>
        );
    }

    if (!displayPolicy) return <p className="text-tertiary">Policy not found.</p>;

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/policies")}>Back to Policies</Button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-display-xs font-semibold text-primary">{displayPolicy.title}</h1>
                        <Badge size="sm" color={STATUS_BADGE[displayPolicy.status] ?? "gray"} type="pill-color">{displayPolicy.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-tertiary">{displayPolicy.category} &middot; {displayPolicy.version} &middot; Created by {displayPolicy.createdBy}</p>
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
                    <p className="mt-1 text-sm font-medium text-primary">{displayPolicy.createdAt ?? "—"}</p>
                </div>
                <div>
                    <p className="text-xs text-tertiary">Last Updated</p>
                    <p className="mt-1 text-sm font-medium text-primary">{displayPolicy.updatedAt ?? "—"}</p>
                </div>
                <div>
                    <p className="text-xs text-tertiary">Last Reviewed</p>
                    <p className="mt-1 text-sm font-medium text-primary">{displayPolicy.lastReviewDate ?? "—"}</p>
                </div>
                <div>
                    <p className="text-xs text-tertiary">Next Review</p>
                    <p className="mt-1 text-sm font-medium text-primary">{displayPolicy.nextReviewDate ?? "—"}</p>
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
                {displayPolicy.status === "DRAFT" && <Button color="primary" size="lg">Submit for Review</Button>}
                {(displayPolicy.status === "REVIEW" || displayPolicy.status === "UNDER_REVIEW") && <Button color="primary" size="lg">Approve Policy</Button>}
                {(displayPolicy.status === "APPROVED" || displayPolicy.status === "ACTIVE") && <Button color="primary" size="lg">Publish Policy</Button>}
                {displayPolicy.status === "PUBLISHED" && <Button color="secondary" size="lg">Schedule Review</Button>}
            </div>
        </div>
    );
}
