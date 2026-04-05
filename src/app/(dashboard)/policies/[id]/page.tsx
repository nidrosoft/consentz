"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    Edit02,
    Save01,
    Send01,
    CheckCircle,
    Globe01,
    Trash01,
    AlertTriangle,
    Clock,
    User01,
    Tag01,
    Hash02,
    Calendar,
    Star01,
    RefreshCcw01,
    FileCheck02,
} from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { DialogTrigger, ModalOverlay, Modal, Dialog } from "@/components/application/modals/modal";
import {
    usePolicyDetail,
    usePolicyVersions,
    useUpdatePolicy,
    useApprovePolicy,
    usePublishPolicy,
    useDeletePolicy,
} from "@/hooks/use-policies";
import { useUiStore } from "@/stores/ui-store";

type PolicyData = {
    id: string;
    title: string;
    content: string;
    status: string;
    version: string | number;
    created_by: string;
    created_at: string;
    updated_at: string;
    last_updated: string;
    is_ai_generated: boolean;
    category: string;
    domains: string[];
    approved_by: string | null;
    approved_at: string | null;
    review_date: string | null;
};

type PolicyVersion = {
    id: string;
    version: string | number;
    created_at: string;
    created_by: string;
    change_summary?: string;
};

const STATUS_BADGE: Record<string, { color: "success" | "warning" | "error" | "gray" | "brand"; label: string }> = {
    DRAFT: { color: "gray", label: "Draft" },
    UNDER_REVIEW: { color: "warning", label: "Under Review" },
    ACTIVE: { color: "success", label: "Active" },
    ARCHIVED: { color: "error", label: "Archived" },
};

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    try {
        return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
        return "—";
    }
}

export default function PolicyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params.id === "string" ? params.id : "";

    const { data: rawPolicy, isLoading, error } = usePolicyDetail(id);
    const { data: rawVersions } = usePolicyVersions(id);

    const policy = rawPolicy as PolicyData | null | undefined;
    const versions = (rawVersions ?? []) as PolicyVersion[];

    const updateMutation = useUpdatePolicy();
    const approveMutation = useApprovePolicy();
    const publishMutation = usePublishPolicy();
    const deleteMutation = useDeletePolicy();

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const setBreadcrumbLabel = useUiStore((s) => s.setBreadcrumbLabel);
    const clearBreadcrumbLabel = useUiStore((s) => s.clearBreadcrumbLabel);

    useEffect(() => {
        if (policy?.title) setBreadcrumbLabel(id, policy.title);
        return () => clearBreadcrumbLabel(id);
    }, [id, policy?.title, setBreadcrumbLabel, clearBreadcrumbLabel]);

    const canEdit = policy?.status === "DRAFT" || policy?.status === "UNDER_REVIEW";

    const handleStartEdit = useCallback(() => {
        if (!policy) return;
        setEditTitle(policy.title);
        setEditContent(policy.content ?? "");
        setIsEditing(true);
    }, [policy]);

    function handleSave() {
        updateMutation.mutate(
            { id, title: editTitle, content: editContent },
            { onSuccess: () => setIsEditing(false) },
        );
    }

    function handleCancelEdit() {
        setIsEditing(false);
        setEditTitle("");
        setEditContent("");
    }

    function handleSubmitForReview() {
        updateMutation.mutate({ id, status: "UNDER_REVIEW" });
    }

    function handleApprove() {
        approveMutation.mutate(id);
    }

    function handlePublish() {
        publishMutation.mutate(id);
    }

    function handleDelete() {
        deleteMutation.mutate(id, {
            onSuccess: () => {
                setShowDeleteConfirm(false);
                router.push("/policies");
            },
        });
    }

    if (error) {
        return (
            <div className="flex flex-col gap-6">
                <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/policies")}>
                    Back to Policies
                </Button>
                <div className="rounded-xl border border-error bg-error-secondary p-6">
                    <p className="text-sm font-medium text-error-primary">Failed to load policy</p>
                    <p className="mt-1 text-sm text-tertiary">
                        {error instanceof Error ? error.message : "An error occurred"}
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="h-6 w-32 animate-pulse rounded bg-secondary" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-secondary" />
                <div className="flex flex-col gap-6 lg:flex-row">
                    <div className="flex-1 space-y-4">
                        <div className="h-64 animate-pulse rounded-xl border border-secondary bg-primary" />
                    </div>
                    <div className="w-full space-y-4 lg:w-80">
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
                                <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="h-32 animate-pulse rounded-xl border border-secondary bg-primary" />
            </div>
        );
    }

    if (!policy) {
        return (
            <div className="flex flex-col gap-6">
                <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/policies")}>
                    Back to Policies
                </Button>
                <p className="text-sm text-tertiary">Policy not found.</p>
            </div>
        );
    }

    const statusInfo = STATUS_BADGE[policy.status] ?? { color: "gray" as const, label: policy.status };

    return (
        <div className="flex flex-col gap-6">
            {/* Back link */}
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/policies")}>
                Back to Policies
            </Button>

            {/* Action bar */}
            <div className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <FeaturedIcon icon={FileCheck02} color="brand" theme="light" size="md" />
                    <div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full border-b border-brand bg-transparent text-lg font-semibold text-primary outline-none transition duration-100 ease-linear focus:border-brand-600"
                            />
                        ) : (
                            <h1 className="text-lg font-semibold text-primary">{policy.title}</h1>
                        )}
                        <p className="mt-0.5 text-sm text-tertiary">
                            Version {policy.version} &middot; {formatDate(policy.updated_at || policy.last_updated)}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                        <>
                            <Button color="secondary" size="sm" onClick={handleCancelEdit} isDisabled={updateMutation.isPending}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                size="sm"
                                iconLeading={Save01}
                                onClick={handleSave}
                                isLoading={updateMutation.isPending}
                            >
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <>
                            {canEdit && (
                                <Button color="secondary" size="sm" iconLeading={Edit02} onClick={handleStartEdit}>
                                    Edit
                                </Button>
                            )}
                            {policy.status === "DRAFT" && (
                                <Button
                                    color="secondary"
                                    size="sm"
                                    iconLeading={Send01}
                                    onClick={handleSubmitForReview}
                                    isLoading={updateMutation.isPending}
                                >
                                    Submit for Review
                                </Button>
                            )}
                            {policy.status === "UNDER_REVIEW" && (
                                <Button
                                    color="primary"
                                    size="sm"
                                    iconLeading={CheckCircle}
                                    onClick={handleApprove}
                                    isLoading={approveMutation.isPending}
                                >
                                    Approve
                                </Button>
                            )}
                            {policy.status === "ACTIVE" && (
                                <Button
                                    color="primary"
                                    size="sm"
                                    iconLeading={Globe01}
                                    onClick={handlePublish}
                                    isLoading={publishMutation.isPending}
                                >
                                    Publish Version
                                </Button>
                            )}
                            <Button
                                color="secondary-destructive"
                                size="sm"
                                iconLeading={Trash01}
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Main layout: content + sidebar */}
            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Content area */}
                <div className="flex-1">
                    <div className="rounded-xl border border-secondary bg-primary p-6">
                        <h2 className="mb-4 text-sm font-semibold text-secondary">Policy Content</h2>
                        {isEditing ? (
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={24}
                                className="w-full resize-y rounded-lg border border-primary bg-primary p-4 font-mono text-sm leading-relaxed text-primary outline-none transition duration-100 ease-linear placeholder:text-placeholder focus:border-brand focus:ring-1 focus:ring-brand"
                                placeholder="Enter policy content..."
                            />
                        ) : (
                            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-secondary">
                                {policy.content || (
                                    <span className="italic text-tertiary">No content yet. Click Edit to add policy content.</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Metadata sidebar */}
                <div className="w-full shrink-0 lg:w-80">
                    <div className="rounded-xl border border-secondary bg-primary p-6">
                        <h2 className="mb-5 text-sm font-semibold text-secondary">Policy Details</h2>
                        <div className="flex flex-col gap-5">
                            <MetaRow icon={Tag01} label="Status">
                                <BadgeWithDot size="sm" color={statusInfo.color} type="pill-color">
                                    {statusInfo.label}
                                </BadgeWithDot>
                            </MetaRow>
                            <MetaRow icon={Hash02} label="Category">
                                <span className="text-sm text-primary">{policy.category || "—"}</span>
                            </MetaRow>
                            <MetaRow icon={User01} label="Author">
                                <span className="text-sm text-primary">{policy.created_by || "—"}</span>
                            </MetaRow>
                            <MetaRow icon={Star01} label="AI Generated">
                                {policy.is_ai_generated ? (
                                    <Badge size="sm" color="brand" type="pill-color">AI</Badge>
                                ) : (
                                    <span className="text-sm text-tertiary">No</span>
                                )}
                            </MetaRow>
                            <MetaRow icon={RefreshCcw01} label="Version">
                                <span className="text-sm font-medium text-primary">{policy.version ?? "1"}</span>
                            </MetaRow>
                            <MetaRow icon={Calendar} label="Created">
                                <span className="text-sm text-primary">{formatDate(policy.created_at)}</span>
                            </MetaRow>
                            <MetaRow icon={Clock} label="Last Updated">
                                <span className="text-sm text-primary">
                                    {formatDate(policy.updated_at || policy.last_updated)}
                                </span>
                            </MetaRow>
                            {policy.review_date && (
                                <MetaRow icon={Calendar} label="Review Date">
                                    <span className="text-sm text-primary">{formatDate(policy.review_date)}</span>
                                </MetaRow>
                            )}
                            {policy.approved_by && (
                                <MetaRow icon={CheckCircle} label="Approved By">
                                    <span className="text-sm text-primary">{policy.approved_by}</span>
                                </MetaRow>
                            )}
                            {policy.approved_at && (
                                <MetaRow icon={Calendar} label="Approved At">
                                    <span className="text-sm text-primary">{formatDate(policy.approved_at)}</span>
                                </MetaRow>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Version History */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <h2 className="mb-4 text-sm font-semibold text-secondary">Version History</h2>
                {versions.length > 0 ? (
                    <div className="divide-y divide-secondary">
                        {versions.map((v) => (
                            <div key={v.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <Badge size="sm" color="gray" type="pill-color">v{v.version}</Badge>
                                    <span className="text-sm text-primary">{v.change_summary || "Published version"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-tertiary">{v.created_by}</span>
                                    <span className="text-xs text-tertiary">{formatDate(v.created_at)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-tertiary">No version history available yet.</p>
                )}
            </div>

            {/* Delete confirmation modal */}
            <DialogTrigger isOpen={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <ModalOverlay isDismissable>
                    <Modal className="sm:max-w-md">
                        <Dialog className="rounded-xl bg-primary p-6 shadow-xl">
                            <div className="flex flex-col items-center text-center">
                                <FeaturedIcon icon={AlertTriangle} color="error" theme="light" size="lg" />
                                <h2 className="mt-4 text-lg font-semibold text-primary">Delete policy</h2>
                                <p className="mt-1 text-sm text-tertiary">
                                    Are you sure you want to delete{" "}
                                    <span className="font-medium text-primary">{policy.title}</span>? This action
                                    cannot be undone and will remove the policy from your compliance records.
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

function MetaRow({ icon: Icon, label, children }: { icon: React.FC<React.SVGProps<SVGSVGElement>>; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <Icon className="size-4 text-fg-quaternary" />
                <span className="text-sm text-tertiary">{label}</span>
            </div>
            <div>{children}</div>
        </div>
    );
}
