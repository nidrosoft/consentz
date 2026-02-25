"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Download01, Trash01, File06, Calendar, User01, Link01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { mockEvidence } from "@/lib/mock-data";

const STATUS_BADGE: Record<string, "success" | "warning" | "error" | "gray"> = {
    VALID: "success", EXPIRING_SOON: "warning", EXPIRED: "error", PENDING_REVIEW: "gray",
};

export default function EvidenceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const evidence = mockEvidence.find((e) => e.id === params.id);

    if (!evidence) return <p className="text-tertiary">Evidence not found.</p>;

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/evidence")}>Back to Evidence</Button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                        <File06 className="size-6 text-fg-quaternary" />
                    </div>
                    <div>
                        <h1 className="text-display-xs font-semibold text-primary">{evidence.name}</h1>
                        <p className="mt-1 text-sm text-tertiary">{evidence.fileName} &middot; {evidence.fileSize}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button color="secondary" size="sm" iconLeading={Download01}>Download</Button>
                    <Button color="secondary-destructive" size="sm" iconLeading={Trash01}>Delete</Button>
                </div>
            </div>

            {/* Details card */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-tertiary">Status</span>
                        <Badge size="sm" color={STATUS_BADGE[evidence.status]} type="pill-color">{evidence.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-tertiary">Type</span>
                        <span className="text-sm text-primary">{evidence.type.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="size-4 text-fg-quaternary" />
                        <span className="text-sm font-medium text-tertiary">Uploaded</span>
                        <span className="text-sm text-primary">{evidence.uploadedAt}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="size-4 text-fg-quaternary" />
                        <span className="text-sm font-medium text-tertiary">Expires</span>
                        <span className="text-sm text-primary">{evidence.expiresAt ?? "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <User01 className="size-4 text-fg-quaternary" />
                        <span className="text-sm font-medium text-tertiary">Uploaded by</span>
                        <span className="text-sm text-primary">{evidence.uploadedBy}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link01 className="size-4 text-fg-quaternary" />
                        <span className="text-sm font-medium text-tertiary">Linked KLOEs</span>
                        <span className="text-sm text-primary">{evidence.linkedKloes.join(", ")}</span>
                    </div>
                </div>
            </div>

            {/* Linked Domains */}
            <div>
                <h2 className="mb-3 text-lg font-semibold text-primary">Linked Domains</h2>
                <div className="flex flex-wrap gap-2">
                    {evidence.linkedDomains.map((d) => (
                        <button
                            key={d}
                            onClick={() => router.push(`/domains/${d}`)}
                            className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-primary transition duration-100 hover:border-brand-300"
                        >
                            {d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview placeholder */}
            <div className="flex items-center justify-center rounded-xl border border-dashed border-secondary bg-secondary p-16">
                <div className="text-center">
                    <File06 className="mx-auto size-12 text-fg-quaternary" />
                    <p className="mt-3 text-sm text-tertiary">Document preview will appear here</p>
                    <Button color="secondary" size="sm" className="mt-3" iconLeading={Download01}>Download to view</Button>
                </div>
            </div>
        </div>
    );
}
