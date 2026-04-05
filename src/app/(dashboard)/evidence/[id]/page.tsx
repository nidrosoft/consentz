"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Download01, Trash01, File06, Calendar, User01, Link01, AlertTriangle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { DialogTrigger, ModalOverlay, Modal, Dialog } from "@/components/application/modals/modal";
import { useEvidenceDetail, useDeleteEvidence } from "@/hooks/use-evidence";
import { useUiStore } from "@/stores/ui-store";
import { toEvidence } from "@/lib/evidence-mapper";

const STATUS_BADGE: Record<string, "success" | "warning" | "error" | "gray"> = {
    VALID: "success", EXPIRING_SOON: "warning", EXPIRED: "error", PENDING_REVIEW: "gray",
};

export default function EvidenceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params.id === "string" ? params.id : "";
    const { data: rawData, isLoading, error } = useEvidenceDetail(id);
    const evidence = rawData ? toEvidence(rawData as unknown as Record<string, unknown>) : null;
    const deleteMutation = useDeleteEvidence();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const setBreadcrumbLabel = useUiStore((s) => s.setBreadcrumbLabel);
    const clearBreadcrumbLabel = useUiStore((s) => s.clearBreadcrumbLabel);

    useEffect(() => {
        if (evidence?.name) setBreadcrumbLabel(id, evidence.name);
        return () => clearBreadcrumbLabel(id);
    }, [id, evidence?.name, setBreadcrumbLabel, clearBreadcrumbLabel]);

    function handleDownload() {
        setIsDownloading(true);
        const link = document.createElement("a");
        link.href = `/api/evidence/${id}/download`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => setIsDownloading(false), 2000);
    }

    function handleDelete() {
        deleteMutation.mutate(id, {
            onSuccess: () => {
                setShowDeleteConfirm(false);
                router.push("/evidence");
            },
        });
    }

    if (error) {
        return (
            <div className="flex flex-col gap-6">
                <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/evidence")}>Back to Evidence</Button>
                <div className="rounded-xl border border-error bg-error-secondary p-6">
                    <p className="text-sm font-medium text-error-primary">Failed to load evidence</p>
                    <p className="mt-1 text-sm text-tertiary">{error instanceof Error ? error.message : "An error occurred"}</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="h-8 w-24 animate-pulse rounded bg-secondary" />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="size-12 shrink-0 animate-pulse rounded-xl bg-secondary" />
                        <div className="flex-1 space-y-2">
                            <div className="h-6 w-48 animate-pulse rounded bg-secondary" />
                            <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-secondary bg-primary p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-4 w-20 animate-pulse rounded bg-secondary" />
                                <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

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
                    <Button color="secondary" size="sm" iconLeading={Download01} onClick={handleDownload} isLoading={isDownloading}>
                        Download
                    </Button>
                    <Button color="secondary-destructive" size="sm" iconLeading={Trash01} onClick={() => setShowDeleteConfirm(true)}>
                        Delete
                    </Button>
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
                        <span className="text-sm text-primary">{evidence.linkedKloes.join(", ") || "None"}</span>
                    </div>
                </div>
            </div>

            {/* Linked Domains */}
            <div>
                <h2 className="mb-3 text-lg font-semibold text-primary">Linked Domains</h2>
                {evidence.linkedDomains.length > 0 ? (
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
                ) : (
                    <p className="text-sm text-tertiary">No linked domains.</p>
                )}
            </div>

            {/* Preview placeholder */}
            <div className="flex items-center justify-center rounded-xl border border-dashed border-secondary bg-secondary p-16">
                <div className="text-center">
                    <File06 className="mx-auto size-12 text-fg-quaternary" />
                    <p className="mt-3 text-sm text-tertiary">Document preview will appear here</p>
                    <Button color="secondary" size="sm" className="mt-3" iconLeading={Download01} onClick={handleDownload} isLoading={isDownloading}>
                        Download to view
                    </Button>
                </div>
            </div>

            {/* Delete confirmation modal */}
            <DialogTrigger isOpen={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <ModalOverlay isDismissable>
                    <Modal className="sm:max-w-md">
                        <Dialog className="rounded-xl bg-primary p-6 shadow-xl">
                            <div className="flex flex-col items-center text-center">
                                <FeaturedIcon icon={AlertTriangle} color="error" theme="light" size="lg" />
                                <h2 className="mt-4 text-lg font-semibold text-primary">Delete evidence</h2>
                                <p className="mt-1 text-sm text-tertiary">
                                    Are you sure you want to delete <span className="font-medium text-primary">{evidence.name}</span>? This action cannot be undone and will remove the evidence from your compliance records.
                                </p>
                                <div className="mt-6 flex w-full gap-3">
                                    <Button
                                        color="secondary"
                                        size="md"
                                        className="flex-1"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        isDisabled={deleteMutation.isPending}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        color="primary-destructive"
                                        size="md"
                                        className="flex-1"
                                        onClick={handleDelete}
                                        isLoading={deleteMutation.isPending}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            </DialogTrigger>
        </div>
    );
}
