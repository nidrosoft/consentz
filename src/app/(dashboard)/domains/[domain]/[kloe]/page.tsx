"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft, File06, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
    Upload01, UploadCloud01, RefreshCcw01, Link01, LinkBroken01, Trash01, RefreshCw01,
    Eye, Download01, XClose, SearchLg, ShieldTick, Stars01,
} from "@untitledui/icons";
import { FileIcon } from "@untitledui/file-icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { Table, TableCard } from "@/components/application/table/table";
import { Toggle } from "@/components/base/toggle/toggle";
import { ModalOverlay, Modal, Dialog } from "@/components/application/modals/modal";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { DatePickerField } from "@/components/application/date-picker/date-picker-field";
import { cx } from "@/utils/cx";
import { apiGet, apiPost } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useMarkOnboardingStep } from "@/hooks/use-onboarding";
import { useComplianceGaps, useUpdateGap } from "@/hooks/use-compliance";
import { useEvidence } from "@/hooks/use-evidence";
import { useMe } from "@/hooks/use-me";
import { useOrganization, useUpdateOrganization } from "@/hooks/use-organization";
import { useEvidenceStatus, useSeedEvidenceStatus, useUpdateEvidenceStatus } from "@/hooks/use-evidence-status";
import { KLOES, REGULATIONS } from "@/lib/constants/cqc-framework";
import {
    getKloeDefinition, SOURCE_LABEL_DISPLAY,
    type KloeDefinition, type KloeEvidenceItem, type EvidenceSourceLabel,
} from "@/lib/constants/cqc-evidence-requirements";
import { computeKloeScore, type VerificationInfo } from "@/lib/services/kloe-score-formula";
import { useCurrentEvidenceFiles, useDeleteEvidenceFile } from "@/hooks/use-evidence-files";
import { usePolicyTemplateMapForKloe, getPolicyTemplateDownloadUrl, type PolicyTemplateDTO } from "@/hooks/use-policy-templates";
import { useVerifyEvidence, type VerificationResult, type VerificationResponse } from "@/hooks/use-evidence-verification";
import { usePolicies } from "@/hooks/use-policies";
import { useConsentzStatus, useConsentzLastSync, useConsentzDisconnect, useConsentzSync } from "@/hooks/use-consentz";
import type { DomainSlug, ServiceType, KloeEvidenceStatus, EvidenceCriticality, EvidenceFileVersion, Policy } from "@/types";

const SEVERITY_DOT: Record<string, string> = {
    CRITICAL: "bg-error-solid", HIGH: "bg-warning-solid", MEDIUM: "bg-brand-solid", LOW: "bg-quaternary",
};
const SEVERITY_BADGE: Record<string, "error" | "warning" | "brand" | "gray"> = {
    CRITICAL: "error", HIGH: "warning", MEDIUM: "brand", LOW: "gray",
};

const SOURCE_LABEL_COLORS: Record<EvidenceSourceLabel, "blue" | "orange" | "success" | "blue-light"> = {
    POLICY: "blue",
    MANUAL_UPLOAD: "orange",
    CONSENTZ: "success",
    CONSENTZ_MANUAL: "blue-light",
};

const CRITICALITY_COLORS: Record<EvidenceCriticality, "error" | "warning" | "gray"> = {
    critical: "error",
    high: "warning",
    medium: "gray",
};
const CRITICALITY_LABELS: Record<EvidenceCriticality, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
};

const EVIDENCE_TYPES = [
    { id: "POLICY", label: "Policy" },
    { id: "CERTIFICATE", label: "Certificate" },
    { id: "TRAINING_RECORD", label: "Training Record" },
    { id: "AUDIT_REPORT", label: "Audit Report" },
    { id: "RISK_ASSESSMENT", label: "Risk Assessment" },
    { id: "MEETING_MINUTES", label: "Meeting Minutes" },
    { id: "CHECKLIST", label: "Checklist" },
    { id: "OTHER", label: "Other" },
];

const UPLOAD_ALLOWED_EXTENSIONS = ["pdf", "docx", "doc", "xlsx", "xls", "csv", "jpg", "jpeg", "png", "webp"];
const UPLOAD_MAX_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface EvidenceRow {
    id: string;
    title?: string;
    file_name?: string;
    fileName?: string;
    category?: string;
    file_size?: string;
    fileSize?: string;
    uploaded_by?: string;
    uploadedBy?: string;
    status?: string;
    kloe_code?: string;
    kloeCode?: string;
    created_at?: string;
    createdAt?: string;
}

function KloeDetailSkeleton() {
    return (
        <div className="flex flex-col gap-4 sm:gap-6 animate-pulse">
            <div className="h-8 w-40 rounded bg-quaternary" />
            <div className="flex items-center gap-2">
                <div className="h-6 w-12 rounded bg-quaternary" />
                <div className="h-6 w-48 rounded bg-quaternary" />
            </div>
            <div className="h-24 rounded-xl border border-secondary bg-primary" />
            <div className="space-y-3">
                <div className="h-6 w-40 rounded bg-quaternary" />
                <div className="h-32 rounded-xl border border-secondary bg-primary" />
            </div>
            <div className="h-48 rounded-xl border border-secondary bg-primary" />
        </div>
    );
}

const SYNC_OVERDUE_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Compute a display-ready status for a single evidence row. */
function getRowStatus(
    item: KloeEvidenceItem,
    statusRecord: KloeEvidenceStatus | undefined,
    consentzConnected: boolean,
): { label: string; color: "success" | "error" | "warning" | "gray" } {
    const isConsentz = item.sourceLabel === "CONSENTZ" || item.sourceLabel === "CONSENTZ_MANUAL";

    // Expiry takes priority when evidence is complete
    if (statusRecord?.status === "complete") {
        if (statusRecord.expiryStatus === "expired") return { label: "Expired", color: "error" };
        if (statusRecord.expiryStatus === "expiring_soon") return { label: "Expiring soon", color: "warning" };
        if (isConsentz) {
            if (!consentzConnected) return { label: "Not connected", color: "error" };
            if (!statusRecord.consentzSyncedAt) return { label: "Awaiting sync", color: "warning" };
            const overdue = Date.now() - new Date(statusRecord.consentzSyncedAt).getTime() > SYNC_OVERDUE_MS;
            if (overdue) return { label: "Sync overdue", color: "warning" };
            return { label: "Live", color: "success" };
        }
        return { label: "Complete", color: "success" };
    }

    if (isConsentz && !consentzConnected) return { label: "Not connected", color: "error" };

    return { label: "Not started", color: "gray" };
}

export default function KloeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const domainSlug = params.domain as DomainSlug;
    const kloeCode = (params.kloe as string).toUpperCase();

    const kloe = KLOES.find((k) => k.code === kloeCode);
    const { data: org } = useOrganization();
    const { data: me } = useMe();
    const updateOrg = useUpdateOrganization();
    const serviceType: ServiceType =
        org?.service_type === "CARE_HOME" || org?.serviceType === "CARE_HOME" ? "CARE_HOME" : "AESTHETIC_CLINIC";

    const kloeDef: KloeDefinition | undefined = getKloeDefinition(serviceType, kloeCode);

    const { data: gapsResponse, isLoading: gapsLoading, error } = useComplianceGaps({ domain: domainSlug, pageSize: 100 });
    const { data: evidenceResponse, isLoading: evidenceLoading } = useEvidence({ kloeCode, pageSize: 100 });
    const { data: statusRecords, isLoading: statusLoading } = useEvidenceStatus(kloeCode);
    const updateGap = useUpdateGap();
    const seedStatus = useSeedEvidenceStatus();
    const updateStatus = useUpdateEvidenceStatus();
    const deleteFile = useDeleteEvidenceFile();

    // Consentz hooks for quick-action bar
    const { data: consentzStatus } = useConsentzStatus();
    const { data: lastSyncData } = useConsentzLastSync(!!consentzStatus?.connected);
    const consentzDisconnect = useConsentzDisconnect();
    const consentzSync = useConsentzSync();

    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
    const [confirmDeleteFileId, setConfirmDeleteFileId] = useState<string | null>(null);
    const [viewerFile, setViewerFile] = useState<{ url: string; name: string; type: string } | null>(null);
    const [viewerLoading, setViewerLoading] = useState(false);
    const [linkPolicyTarget, setLinkPolicyTarget] = useState<string | null>(null);
    const [policySearch, setPolicySearch] = useState("");
    const { data: policiesResponse } = usePolicies({ status: "PUBLISHED", pageSize: 100 });

    // AI Evidence Verification
    const verifyEvidence = useVerifyEvidence();
    const [verificationResultModal, setVerificationResultModal] = useState<{
        evidenceItemId: string;
        result: VerificationResult;
        status: "verified" | "rejected" | "error";
    } | null>(null);
    const [verifyingItemId, setVerifyingItemId] = useState<string | null>(null);

    function handleVerifyEvidence(item: KloeEvidenceItem, file: EvidenceFileVersion) {
        setVerifyingItemId(item.id);
        verifyEvidence.mutate(
            {
                fileVersionId: file.id,
                kloeCode: kloeCode.toUpperCase(),
                evidenceRequirementId: item.id,
                documentCategory: item.sourceLabel,
                fileName: file.fileName,
                fileUrl: file.fileUrl,
                fileType: file.fileType,
            },
            {
                onSuccess: (data) => {
                    setVerifyingItemId(null);
                    if (data) {
                        setVerificationResultModal({
                            evidenceItemId: item.id,
                            result: data.result,
                            status: data.verificationStatus,
                        });
                    }
                },
                onError: () => setVerifyingItemId(null),
            },
        );
    }

    // Upload evidence modal state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadTargetItemId, setUploadTargetItemId] = useState<string | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadName, setUploadName] = useState("");
    const [uploadCategory, setUploadCategory] = useState<string | null>(null);
    const [uploadExpiry, setUploadExpiry] = useState("");
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadDragOver, setUploadDragOver] = useState(false);
    const uploadFileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const markOnboardingStep = useMarkOnboardingStep();

    function resetUploadModal() {
        setShowUploadModal(false);
        setUploadTargetItemId(null);
        setUploadFile(null);
        setUploadName("");
        setUploadCategory(null);
        setUploadExpiry("");
        setUploadError(null);
        setUploadDragOver(false);
        if (uploadFileInputRef.current) uploadFileInputRef.current.value = "";
    }

    function handleUploadFileSelect(f: File) {
        const ext = f.name.split(".").pop()?.toLowerCase();
        if (!ext || !UPLOAD_ALLOWED_EXTENSIONS.includes(ext)) {
            setUploadError(`Unsupported file type (.${ext}). Allowed: ${UPLOAD_ALLOWED_EXTENSIONS.join(", ")}`);
            return;
        }
        if (f.size > UPLOAD_MAX_SIZE) {
            setUploadError(`File too large (${formatFileSize(f.size)}). Maximum is 10 MB.`);
            return;
        }
        setUploadError(null);
        setUploadFile(f);
        if (!uploadName) {
            setUploadName(f.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "));
        }
    }

    const handleUploadDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setUploadDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handleUploadFileSelect(f);
    }, [uploadName]);

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!uploadFile) throw new Error("No file selected");
            if (!uploadTargetItemId) {
                if (!uploadName.trim()) throw new Error("Document name is required");
                if (!uploadCategory) throw new Error("Document type is required");
            }

            const formData = new FormData();
            formData.append("file", uploadFile);
            formData.append("bucket", "evidence");

            const uploadRes = await fetch("/api/evidence/upload", { method: "POST", body: formData });
            if (!uploadRes.ok) {
                const errData = await uploadRes.json().catch(() => null);
                throw new Error(errData?.error?.message ?? `Upload failed (${uploadRes.status})`);
            }

            const uploadData = await uploadRes.json();
            const fileInfo = uploadData.data;

            // If uploading for a specific evidence requirement, create a file version
            // linked directly to that requirement (evidence_file_versions).
            if (uploadTargetItemId) {
                await apiPost("/api/evidence-files", {
                    evidenceItemId: uploadTargetItemId,
                    kloeCode: kloeCode.toUpperCase(),
                    fileUrl: fileInfo.fileUrl,
                    fileName: fileInfo.fileName,
                    fileType: fileInfo.fileType,
                    expiresAt: uploadExpiry || null,
                });
            } else {
                // General upload — creates an evidence_items record linked to the KLOE
                await apiPost("/api/evidence", {
                    name: uploadName.trim(),
                    category: uploadCategory,
                    fileUrl: fileInfo.fileUrl,
                    fileName: fileInfo.fileName,
                    fileType: fileInfo.fileType,
                    fileSize: fileInfo.fileSize,
                    storagePath: fileInfo.storagePath,
                    linkedKloes: [kloeCode.toUpperCase()],
                    linkedDomains: [domainSlug],
                    validUntil: uploadExpiry || undefined,
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["evidence"] });
            queryClient.invalidateQueries({ queryKey: ["evidence-files"] });
            queryClient.invalidateQueries({ queryKey: ["evidence-status"] });
            queryClient.invalidateQueries({ queryKey: ["compliance"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            markOnboardingStep("upload_evidence");
            toast.success("Evidence uploaded", uploadTargetItemId
                ? "File linked to this requirement. You can now verify it with AI."
                : "Your document has been saved and linked to this KLOE."
            );
            resetUploadModal();
        },
        onError: (err: Error) => {
            setUploadError(err.message);
            toast.error("Upload failed", err.message);
        },
    });

    const canSubmitUpload = !!uploadFile && !uploadMutation.isPending && (
        uploadTargetItemId ? true : (!!uploadName.trim() && !!uploadCategory)
    );

    async function openFileViewer(fileId: string) {
        setViewerLoading(true);
        try {
            const res = await apiGet<{ signedUrl: string; fileName: string; fileType: string }>(`/api/evidence-files/view?id=${fileId}`);
            if (res.data) {
                setViewerFile({ url: res.data.signedUrl, name: res.data.fileName, type: res.data.fileType });
            }
        } catch {
            // fallback — ignore
        } finally {
            setViewerLoading(false);
        }
    }

    const allGaps = gapsResponse?.data ?? [];
    const kloeGaps = allGaps.filter((g) => g.kloe === kloeCode);
    const criticalGapCount = kloeGaps.filter((g) => g.severity === "CRITICAL").length;
    const isHighRisk = criticalGapCount >= 2;

    const kloeEvidence = (evidenceResponse?.data ?? []) as EvidenceRow[];

    const kloeRegulations = useMemo(() => {
        const regCodes = kloeDef?.regulations ?? kloe?.regulations ?? [];
        return REGULATIONS.filter((r) => regCodes.includes(r.code));
    }, [kloeDef, kloe]);

    const statusMap = useMemo(() => {
        const map = new Map<string, KloeEvidenceStatus>();
        for (const s of statusRecords ?? []) {
            map.set(s.evidenceItemId, s);
        }
        return map;
    }, [statusRecords]);

    const { data: currentFiles } = useCurrentEvidenceFiles(kloeCode);
    const { data: policyTemplateMap } = usePolicyTemplateMapForKloe(kloeCode);
    const fileMap = useMemo(() => {
        const current = new Map<string, EvidenceFileVersion>();
        const versionCounts = new Map<string, number>();
        for (const f of currentFiles ?? []) {
            versionCounts.set(f.evidenceItemId, (versionCounts.get(f.evidenceItemId) ?? 0) + 1);
            if (f.isCurrent) current.set(f.evidenceItemId, f);
        }
        return { current, versionCounts };
    }, [currentFiles]);

    // `evidenceItems` is referenced by React Aria's <Table.Body items={...}>,
    // which caches per-row render output keyed on BOTH the array identity AND
    // individual item identity. The row renderer reads policyTemplateMap /
    // fileMap from closure, so when those async data sources resolve we must
    // produce NEW item object references — otherwise the rows render once at
    // mount (with undefined data) and never pick up the loaded data.
    const evidenceItems: KloeEvidenceItem[] = useMemo(
        () => (kloeDef?.evidenceItems ?? []).map((i) => ({ ...i })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [kloeDef, policyTemplateMap, fileMap, statusMap],
    );
    const hasConsentzItems = evidenceItems.some((i) => i.sourceLabel === "CONSENTZ" || i.sourceLabel === "CONSENTZ_MANUAL");
    const isE3Clinic = kloeCode === "E3" && serviceType === "AESTHETIC_CLINIC";
    const e3NutritionNa = org?.e3_nutrition_na_aesthetic === true;
    const evidenceExcluded = isE3Clinic && e3NutritionNa;
    const canEditE3Na = me?.role === "OWNER" || me?.role === "ADMIN";

    const completedCount = evidenceExcluded
        ? 0
        : evidenceItems.filter((item) => statusMap.get(item.id)?.status === "complete").length;
    const evidenceCompletionPct = evidenceExcluded
        ? 0
        : evidenceItems.length > 0
            ? Math.round((completedCount / evidenceItems.length) * 100)
            : 0;

    // Compute KLOE score using the shared pure formula from `kloe-score-formula.ts`.
    // Identical to the backend score engine — so the tile, domain aggregate,
    // and persisted compliance_scores row always agree.
    //
    // The formula applies the AI-produced complianceScore (0-100) stored on
    // each current evidence_file_version as a graduated multiplier, so a
    // high-quality doc contributes more than a low-quality one.
    const kloeScore = useMemo(() => {
        if (evidenceExcluded || evidenceItems.length === 0) return 0;
        const consentzConnectedForScore = !!org?.consentz_clinic_id;

        // Build verification map from current file versions.
        const verificationByItemId = new Map<string, VerificationInfo>();
        fileMap.current.forEach((f, itemId) => {
            const result = f.verificationResult as Record<string, unknown> | null | undefined;
            const rawScore = result && typeof result.complianceScore === "number" ? result.complianceScore : null;
            verificationByItemId.set(itemId, {
                status: f.verificationStatus ?? "unverified",
                complianceScore: rawScore,
            });
        });

        return computeKloeScore({
            items: evidenceItems,
            statusRows: Array.from(statusMap.values()),
            verificationByItemId,
            consentzConnected: consentzConnectedForScore,
        }).score;
    }, [evidenceItems, statusMap, evidenceExcluded, org, fileMap]);

    // Derive compliance gaps from evidence status so gaps appear immediately
    // for missing/expired evidence without waiting for the cron job.
    const derivedEvidenceGaps = useMemo(() => {
        if (evidenceExcluded || evidenceItems.length === 0) return [];
        const SYNC_OVERDUE = 24 * 60 * 60 * 1000;
        const CRITICALITY_TO_SEVERITY: Record<EvidenceCriticality, "CRITICAL" | "HIGH" | "MEDIUM"> = {
            critical: "CRITICAL", high: "HIGH", medium: "MEDIUM",
        };
        const ACTION_MAP: Record<string, string> = {
            MANUAL_UPLOAD: "Upload evidence",
            POLICY: "Generate or upload policy",
            CONSENTZ: "Connect to Consentz or sync data",
            CONSENTZ_MANUAL: "Connect to Consentz or sync data",
        };
        const dbGapSourceIds = new Set(
            kloeGaps.filter((g) => (g as any).source === "evidence_status").map((g) => (g as any).sourceId),
        );

        const gaps: typeof kloeGaps = [];

        for (const item of evidenceItems) {
            const row = statusMap.get(item.id);
            const reasons: string[] = [];

            if (!row || row.status === "not_started") {
                reasons.push("Evidence has not been provided.");
            } else if (row.status === "complete" && row.expiryStatus === "expired") {
                reasons.push("Evidence has expired.");
            }

            const isConsentz = row?.evidenceType === "CONSENTZ" || row?.evidenceType === "CONSENTZ_MANUAL";
            if (isConsentz) {
                if (!org?.consentz_clinic_id) {
                    reasons.push("Consentz is not connected.");
                } else if (!row?.consentzSyncedAt) {
                    reasons.push("Consentz data has not been synced.");
                } else if (Date.now() - new Date(row.consentzSyncedAt).getTime() > SYNC_OVERDUE) {
                    reasons.push("Consentz sync is overdue.");
                }
            }

            if (reasons.length === 0) continue;
            if (dbGapSourceIds.has(item.id)) continue;

            const severity = CRITICALITY_TO_SEVERITY[item.criticality];
            const titleParts: string[] = [];
            if (!row || row.status === "not_started") titleParts.push("Missing evidence");
            if (row?.expiryStatus === "expired") titleParts.push("Expired");
            if (isConsentz && !org?.consentz_clinic_id) titleParts.push("Consentz not connected");

            gaps.push({
                id: `derived_${item.id}`,
                title: `${titleParts.join(" · ") || "Evidence gap"}: ${item.description}`,
                description: reasons.join(" "),
                severity,
                status: "OPEN" as const,
                domain: domainSlug,
                kloe: kloeCode,
                regulation: kloeDef?.regulations[0] ?? "",
                createdAt: new Date().toISOString(),
                remediationSteps: [],
                remediationAction: ACTION_MAP[item.sourceLabel] ?? "Upload evidence",
                dueDate: null,
                resolutionNotes: null,
            });
        }
        return gaps;
    }, [evidenceItems, statusMap, evidenceExcluded, org, kloeGaps, kloeCode, domainSlug, kloeDef]);

    // Merge DB gaps with derived evidence gaps (DB gaps take priority via dedup)
    const allKloeGaps = useMemo(() => {
        return [...kloeGaps, ...derivedEvidenceGaps];
    }, [kloeGaps, derivedEvidenceGaps]);

    const isLoading = gapsLoading || evidenceLoading;
    const needsSeeding =
        !evidenceExcluded &&
        !statusLoading &&
        statusRecords !== undefined &&
        statusRecords.length === 0 &&
        evidenceItems.length > 0;

    const [expandedGapId, setExpandedGapId] = useState<string | null>(null);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    function handleResolve(gapId: string) {
        setResolvingId(gapId);
        updateGap.mutate(
            { id: gapId, status: "RESOLVED" },
            { onSettled: () => setResolvingId(null) },
        );
    }

    function handleToggleComplete(item: KloeEvidenceItem) {
        const current = statusMap.get(item.id);
        const nextStatus = current?.status === "complete" ? "not_started" : "complete";
        updateStatus.mutate({ evidenceItemId: item.id, status: nextStatus });
    }

    if (!kloe) return <p className="text-tertiary">KLOE not found.</p>;
    if (isLoading) return <KloeDetailSkeleton />;
    if (error) {
        return (
            <div className="flex flex-col gap-4 sm:gap-6">
                <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push(`/domains/${domainSlug}`)}>
                    Back to {domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)}
                </Button>
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <AlertTriangle className="size-10 text-warning-primary" />
                    <p className="text-sm text-tertiary">Failed to load compliance data. Please try again.</p>
                    <Button color="secondary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    const displayTitle = kloeDef?.title ?? kloe.title;
    const displayQuestion = kloeDef?.keyQuestion ?? kloe.keyQuestion;
    const displayDescription = kloeDef?.description ?? null;

    return (
        <div className="flex flex-col gap-5 sm:gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push(`/domains/${domainSlug}`)}>
                Back to {domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)}
            </Button>

            {/* Header */}
            <div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge size="md" color="gray" type="pill-color">{kloe.code}</Badge>
                    {isHighRisk && <Badge size="md" color="error" type="pill-color">High Risk</Badge>}
                    <h1 className="text-display-xs font-semibold text-primary">{displayTitle}</h1>
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-secondary">{displayQuestion}</p>
                {displayDescription && (
                    <p className="mt-1.5 text-sm leading-relaxed text-tertiary">{displayDescription}</p>
                )}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <Badge size="sm" color="gray" type="pill-color">
                        {serviceType === "CARE_HOME" ? "Care Home" : "Aesthetic Clinic"}
                    </Badge>
                    <span className="text-xs text-tertiary">
                        Domain: {domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)}
                    </span>
                </div>
                {isE3Clinic && (
                    <div className="mt-3 rounded-lg border border-secondary bg-secondary/40 px-3 py-3 sm:px-4">
                        <Toggle
                            size="sm"
                            isSelected={e3NutritionNa}
                            isDisabled={!canEditE3Na || updateOrg.isPending}
                            onChange={(selected) => updateOrg.mutate({ e3NutritionNaAesthetic: selected })}
                            label="Nutrition not applicable for our service"
                            hint="When enabled, this KLOE is excluded from evidence completion scoring. Only Owners and Admins can change this."
                        />
                    </div>
                )}
            </div>

            {/* Dual Score Display */}
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-secondary bg-primary p-4">
                    <p className="text-xs font-medium text-tertiary uppercase tracking-wide">Evidence Completion</p>
                    {evidenceExcluded ? (
                        <>
                            <p className="mt-2 font-mono text-2xl font-bold text-tertiary">N/A</p>
                            <p className="mt-1.5 text-xs text-tertiary">
                                Marked not applicable; excluded from domain scoring.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="mt-2 flex items-center gap-3">
                                <span className="font-mono text-2xl font-bold text-primary">{evidenceCompletionPct}%</span>
                                <div className="flex-1"><ProgressBarBase value={evidenceCompletionPct} min={0} max={100} /></div>
                            </div>
                            <p className="mt-1.5 text-xs text-tertiary">{completedCount} of {evidenceItems.length} items provided</p>
                        </>
                    )}
                </div>
                <div className="rounded-xl border border-secondary bg-primary p-4">
                    <p className="text-xs font-medium text-tertiary uppercase tracking-wide">KLOE Score</p>
                    <div className="mt-2 flex items-center gap-3">
                        <span className="font-mono text-2xl font-bold text-primary">{kloeScore}%</span>
                        <div className="flex-1"><ProgressBarBase value={kloeScore} min={0} max={100} /></div>
                    </div>
                    <div className="mt-1.5">
                        <Badge size="sm" color={kloeScore >= 63 ? "success" : kloeScore >= 39 ? "warning" : "error"} type="pill-color">
                            {kloeScore >= 88 ? "Outstanding" : kloeScore >= 63 ? "Good" : kloeScore >= 39 ? "Requires Improvement" : "Inadequate"}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Linked Regulations */}
            {kloeRegulations.length > 0 && (
                <div>
                    <h2 className="mb-1 text-lg font-semibold text-primary">Linked Regulations</h2>
                    <p className="mb-3 text-xs text-tertiary">
                        {domainSlug === "safe" && "CQC regulations governing safety standards and safeguarding for this KLOE."}
                        {domainSlug === "effective" && "CQC regulations ensuring effective, evidence-based care and treatment for this KLOE."}
                        {domainSlug === "caring" && "CQC regulations that uphold compassion, dignity and respect for this KLOE."}
                        {domainSlug === "responsive" && "CQC regulations ensuring services are responsive and person-centred for this KLOE."}
                        {domainSlug === "well-led" && "CQC regulations relating to governance, leadership and accountability for this KLOE."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {kloeRegulations.map((reg) => (
                            <div
                                key={reg.code}
                                className={cx(
                                    "rounded-lg px-2.5 py-1.5",
                                    domainSlug === "safe" && "bg-[#EFF6FF] border border-[#BFDBFE]",
                                    domainSlug === "effective" && "bg-[#F5F3FF] border border-[#DDD6FE]",
                                    domainSlug === "caring" && "bg-[#FDF2F8] border border-[#FBCFE8]",
                                    domainSlug === "responsive" && "bg-[#FFFBEB] border border-[#FDE68A]",
                                    domainSlug === "well-led" && "bg-[#ECFDF5] border border-[#A7F3D0]",
                                )}
                            >
                                <span className={cx(
                                    "text-xs font-bold",
                                    domainSlug === "safe" && "text-[#1D4ED8]",
                                    domainSlug === "effective" && "text-[#6D28D9]",
                                    domainSlug === "caring" && "text-[#BE185D]",
                                    domainSlug === "responsive" && "text-[#B45309]",
                                    domainSlug === "well-led" && "text-[#047857]",
                                )}>
                                    {reg.code.replace("REG", "Reg ")}
                                </span>
                                <span className="ml-1.5 text-xs text-tertiary">{reg.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Evidence Requirements Table */}
            {evidenceExcluded ? (
                <div className="rounded-xl border border-dashed border-secondary bg-secondary/30 px-4 py-6 text-center">
                    <p className="text-sm text-secondary">
                        Evidence checklist is hidden because this KLOE is marked not applicable for your service type.
                    </p>
                </div>
            ) : (
                <TableCard.Root>
                    <TableCard.Header
                        title="Evidence Requirements"
                        badge={evidenceItems.length > 0 ? String(evidenceItems.length) : undefined}
                        description={hasConsentzItems && consentzStatus?.connected && lastSyncData?.synced_at
                            ? `Consentz connected · Last synced ${new Date(lastSyncData.synced_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${new Date(lastSyncData.synced_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
                            : undefined}
                        contentTrailing={
                            <div className="flex flex-wrap items-center gap-2">
                                {needsSeeding && (
                                    <Button
                                        color="secondary"
                                        size="sm"
                                        iconLeading={RefreshCcw01}
                                        isLoading={seedStatus.isPending}
                                        onClick={() => seedStatus.mutate(serviceType)}
                                    >
                                        Initialize Tracking
                                    </Button>
                                )}
                                {hasConsentzItems && consentzStatus?.connected ? (
                                    <>
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            iconLeading={RefreshCw01}
                                            isLoading={consentzSync.isPending}
                                            onClick={() => consentzSync.mutate()}
                                        >
                                            {consentzSync.isSuccess ? "Synced!" : "Sync Now"}
                                        </Button>
                                        {showDisconnectConfirm ? (
                                            <div className="flex items-center gap-1.5">
                                                <Button color="primary-destructive" size="sm" isLoading={consentzDisconnect.isPending} onClick={() => { consentzDisconnect.mutate(); setShowDisconnectConfirm(false); }}>Confirm</Button>
                                                <Button color="secondary" size="sm" onClick={() => setShowDisconnectConfirm(false)}>Cancel</Button>
                                            </div>
                                        ) : (
                                            <Button color="tertiary-destructive" size="sm" iconLeading={LinkBroken01} onClick={() => setShowDisconnectConfirm(true)}>Disconnect</Button>
                                        )}
                                    </>
                                ) : hasConsentzItems ? (
                                    <Button
                                        color="primary"
                                        size="sm"
                                        iconLeading={Link01}
                                        onClick={() => router.push("/settings?tab=integrations")}
                                    >
                                        Connect Consentz
                                    </Button>
                                ) : null}
                            </div>
                        }
                    />
                    {evidenceItems.length > 0 ? (
                        <Table aria-label="Evidence requirements" size="sm">
                            <Table.Header className="bg-primary">
                                <Table.Head id="evidence" label="Evidence" isRowHeader className="min-w-[280px]" />
                                <Table.Head id="status" label="Status" />
                                <Table.Head id="source" label="Source" />
                                <Table.Head id="risk" label="Risk" />
                                <Table.Head id="actions" />
                            </Table.Header>
                            <Table.Body items={evidenceItems}>
                                {(item) => {
                                    const statusRecord = statusMap.get(item.id);
                                    const isComplete = statusRecord?.status === "complete";
                                    const currentFile = fileMap.current.get(item.id);
                                    const hasPreviousVersions = (fileMap.versionCounts.get(item.id) ?? 0) > 1;
                                    // Use the same source the section header reads so per-row
                                    // "Not connected" labels cannot contradict header's "Connected".
                                    const consentzConnected = consentzStatus?.connected ?? !!org?.consentz_clinic_id;
                                    const rowStatus = getRowStatus(item, statusRecord, consentzConnected);
                                    const isConsentz = item.sourceLabel === "CONSENTZ" || item.sourceLabel === "CONSENTZ_MANUAL";
                                    const fileExt = currentFile?.fileName?.split(".").pop() ?? "";
                                    const itemTemplates: PolicyTemplateDTO[] = policyTemplateMap?.[item.id] ?? [];
                                    const primaryTemplate = itemTemplates[0] ?? null;

                                    return (
                                        <Table.Row id={item.id}>
                                            {/* Evidence — thumbnail + description */}
                                            <Table.Cell>
                                                <div className="flex items-center gap-3">
                                                    {currentFile ? (
                                                        <>
                                                            <FileIcon type={fileExt} theme="light" className="size-9 shrink-0 dark:hidden" />
                                                            <FileIcon type={fileExt} theme="dark" className="size-9 shrink-0 not-dark:hidden" />
                                                        </>
                                                    ) : isConsentz ? (
                                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success-primary/10">
                                                            <RefreshCw01 className="size-4 text-success-primary" />
                                                        </div>
                                                    ) : item.sourceLabel === "POLICY" ? (
                                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
                                                            <Link01 className="size-4 text-brand-primary" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                                            <Upload01 className="size-4 text-fg-quaternary" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-primary line-clamp-2">{item.description}</p>
                                                        {currentFile && (
                                                            <div className="mt-0.5 flex items-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    className="flex items-center gap-1 text-xs text-tertiary truncate transition hover:text-brand-primary"
                                                                    onClick={() => openFileViewer(currentFile.id)}
                                                                >
                                                                    <span className="truncate">{currentFile.fileName}</span>
                                                                    {hasPreviousVersions && <span className="shrink-0 text-quaternary">· v{fileMap.versionCounts.get(item.id)}</span>}
                                                                </button>
                                                                {currentFile.verificationStatus === "verified" && (
                                                                    <button type="button" onClick={() => {
                                                                        if (currentFile.verificationResult) {
                                                                            setVerificationResultModal({
                                                                                evidenceItemId: item.id,
                                                                                result: currentFile.verificationResult as unknown as VerificationResult,
                                                                                status: "verified",
                                                                            });
                                                                        }
                                                                    }} className="shrink-0" title="AI Verified — click for details">
                                                                        <Badge size="sm" color="success" type="pill-color">
                                                                            <ShieldTick className="size-3" /> Verified
                                                                            {typeof (currentFile.verificationResult as any)?.complianceScore === "number" && (
                                                                                <span className="ml-1 tabular-nums">· {(currentFile.verificationResult as any).complianceScore}</span>
                                                                            )}
                                                                        </Badge>
                                                                    </button>
                                                                )}
                                                                {currentFile.verificationStatus === "rejected" && (
                                                                    <button type="button" onClick={() => {
                                                                        if (currentFile.verificationResult) {
                                                                            setVerificationResultModal({
                                                                                evidenceItemId: item.id,
                                                                                result: currentFile.verificationResult as unknown as VerificationResult,
                                                                                status: "rejected",
                                                                            });
                                                                        }
                                                                    }} className="shrink-0" title="AI Rejected — click for details">
                                                                        <Badge size="sm" color="error" type="pill-color">
                                                                            <AlertTriangle className="size-3" /> Rejected
                                                                            {typeof (currentFile.verificationResult as any)?.complianceScore === "number" && (
                                                                                <span className="ml-1 tabular-nums">· {(currentFile.verificationResult as any).complianceScore}</span>
                                                                            )}
                                                                        </Badge>
                                                                    </button>
                                                                )}
                                                                {currentFile.verificationStatus === "pending" && (
                                                                    <Badge size="sm" color="warning" type="pill-color">
                                                                        <RefreshCw01 className="size-3 animate-spin" /> Verifying
                                                                    </Badge>
                                                                )}
                                                                {verifyingItemId === item.id && (
                                                                    <Badge size="sm" color="warning" type="pill-color">
                                                                        <RefreshCw01 className="size-3 animate-spin" /> Verifying…
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                        {statusRecord?.expiresAt && rowStatus.label !== "Expired" && rowStatus.label !== "Expiring soon" && (
                                                            <p className="mt-0.5 text-xs text-tertiary">
                                                                Exp. {new Date(statusRecord.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                                            </p>
                                                        )}
                                                        {!currentFile && (primaryTemplate || item.sourceLabel === "POLICY") && (
                                                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                                                {primaryTemplate && (
                                                                    <a
                                                                        href={getPolicyTemplateDownloadUrl(primaryTemplate.code)}
                                                                        className="inline-flex items-center gap-1 text-brand-primary hover:underline"
                                                                        title={`Download pre-filled ${primaryTemplate.title}${itemTemplates.length > 1 ? ` (+${itemTemplates.length - 1} more)` : ""}`}
                                                                    >
                                                                        <Download01 className="size-3" />
                                                                        Cura template: {primaryTemplate.code}
                                                                        {itemTemplates.length > 1 && <span className="text-tertiary">+{itemTemplates.length - 1}</span>}
                                                                    </a>
                                                                )}
                                                                {item.sourceLabel === "POLICY" && (
                                                                    <button
                                                                        type="button"
                                                                        className="inline-flex items-center gap-1 text-brand-primary hover:underline"
                                                                        title={primaryTemplate
                                                                            ? `Generate a personalised ${primaryTemplate.code} policy using AI`
                                                                            : "Generate this policy using AI"}
                                                                        onClick={() => {
                                                                            const qs = new URLSearchParams();
                                                                            if (primaryTemplate) qs.set("templateCode", primaryTemplate.code);
                                                                            qs.set("kloe", kloeCode);
                                                                            qs.set("evidenceItemId", item.id);
                                                                            router.push(`/policies/create?${qs.toString()}`);
                                                                        }}
                                                                    >
                                                                        <Stars01 className="size-3" />
                                                                        Generate with AI
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Table.Cell>

                                            {/* Status */}
                                            <Table.Cell>
                                                <button
                                                    type="button"
                                                    className="group flex items-center gap-1.5"
                                                    onClick={() => handleToggleComplete(item)}
                                                    aria-label={isComplete ? "Mark as incomplete" : "Mark as complete"}
                                                >
                                                    {isComplete ? (
                                                        <CheckCircle className="size-4 text-success-primary" />
                                                    ) : (
                                                        <div className="flex size-4 items-center justify-center rounded-full border-2 border-tertiary transition group-hover:border-brand" />
                                                    )}
                                                    <Badge size="sm" color={rowStatus.color} type="pill-color">{rowStatus.label}</Badge>
                                                </button>
                                            </Table.Cell>

                                            {/* Source */}
                                            <Table.Cell>
                                                <Badge size="sm" color={SOURCE_LABEL_COLORS[item.sourceLabel]} type="pill-color">
                                                    {SOURCE_LABEL_DISPLAY[item.sourceLabel]}
                                                </Badge>
                                            </Table.Cell>

                                            {/* Risk */}
                                            <Table.Cell>
                                                <Badge size="sm" color={CRITICALITY_COLORS[item.criticality]} type="pill-color">
                                                    {CRITICALITY_LABELS[item.criticality]}
                                                </Badge>
                                            </Table.Cell>

                                            {/* Actions — three-dot dropdown */}
                                            <Table.Cell className="px-4">
                                                <div className="flex items-center justify-end">
                                                    <Dropdown.Root>
                                                        <Dropdown.DotsButton />
                                                        <Dropdown.Popover className="w-min">
                                                            <Dropdown.Menu selectionMode="none">
                                                                {/* View document — when a file exists */}
                                                                {currentFile && (
                                                                    <Dropdown.Item
                                                                        icon={Eye}
                                                                        onAction={() => openFileViewer(currentFile.id)}
                                                                    >
                                                                        <span className="pr-4">View document</span>
                                                                    </Dropdown.Item>
                                                                )}

                                                                {/* Download — when a file exists */}
                                                                {currentFile && (
                                                                    <Dropdown.Item
                                                                        icon={Download01}
                                                                        onAction={() => window.open(currentFile.fileUrl, "_blank")}
                                                                    >
                                                                        <span className="pr-4">Download</span>
                                                                    </Dropdown.Item>
                                                                )}

                                                                {/* Verify with AI — when a file exists */}
                                                                {currentFile && (
                                                                    <Dropdown.Item
                                                                        icon={ShieldTick}
                                                                        onAction={() => handleVerifyEvidence(item, currentFile)}
                                                                        isDisabled={verifyingItemId === item.id}
                                                                    >
                                                                        <span className="pr-4">
                                                                            {verifyingItemId === item.id ? "Verifying…" : currentFile.verificationStatus === "verified" ? "Re-verify with AI" : "Verify with AI"}
                                                                        </span>
                                                                    </Dropdown.Item>
                                                                )}

                                                                {currentFile && <Dropdown.Separator />}

                                                                {/* Toggle complete */}
                                                                <Dropdown.Item
                                                                    icon={isComplete ? RefreshCcw01 : CheckCircle}
                                                                    onAction={() => handleToggleComplete(item)}
                                                                >
                                                                    <span className="pr-4">{isComplete ? "Mark incomplete" : "Mark complete"}</span>
                                                                </Dropdown.Item>

                                                                {/* Upload — for MANUAL_UPLOAD and CONSENTZ_MANUAL */}
                                                                {(item.sourceLabel === "MANUAL_UPLOAD" || item.sourceLabel === "CONSENTZ_MANUAL") && (
                                                                    <Dropdown.Item
                                                                        icon={Upload01}
                                                                        onAction={() => { setUploadTargetItemId(item.id); setShowUploadModal(true); }}
                                                                    >
                                                                        <span className="pr-4">{currentFile ? "Replace file" : "Upload evidence"}</span>
                                                                    </Dropdown.Item>
                                                                )}

                                                                {/* Link policy — for POLICY source when not linked */}
                                                                {item.sourceLabel === "POLICY" && !statusRecord?.linkedPolicyId && (
                                                                    <Dropdown.Item
                                                                        icon={Link01}
                                                                        onAction={() => { setPolicySearch(""); setLinkPolicyTarget(item.id); }}
                                                                    >
                                                                        <span className="pr-4">Link a policy</span>
                                                                    </Dropdown.Item>
                                                                )}

                                                                {/* Download Cura policy template(s) — when this evidence has one mapped */}
                                                                {itemTemplates.map((t) => (
                                                                    <Dropdown.Item
                                                                        key={t.code}
                                                                        icon={Download01}
                                                                        onAction={() => window.open(getPolicyTemplateDownloadUrl(t.code), "_blank")}
                                                                    >
                                                                        <span className="pr-4">Download {t.code} template</span>
                                                                    </Dropdown.Item>
                                                                ))}

                                                                {/* View linked policy — for POLICY source when linked */}
                                                                {item.sourceLabel === "POLICY" && statusRecord?.linkedPolicyId && (
                                                                    <Dropdown.Item
                                                                        icon={Eye}
                                                                        onAction={() => router.push(`/policies/${statusRecord.linkedPolicyId}`)}
                                                                    >
                                                                        <span className="pr-4">View linked policy</span>
                                                                    </Dropdown.Item>
                                                                )}

                                                                {/* Sync — for Consentz items when connected */}
                                                                {isConsentz && consentzConnected && (
                                                                    <Dropdown.Item
                                                                        icon={RefreshCw01}
                                                                        onAction={() => consentzSync.mutate()}
                                                                    >
                                                                        <span className="pr-4">Sync now</span>
                                                                    </Dropdown.Item>
                                                                )}

                                                                {/* Disconnect — for Consentz items when connected */}
                                                                {isConsentz && consentzConnected && (
                                                                    <Dropdown.Item
                                                                        icon={LinkBroken01}
                                                                        onAction={() => consentzDisconnect.mutate()}
                                                                        isDisabled={consentzDisconnect.isPending}
                                                                    >
                                                                        <span className="pr-4">Disconnect Consentz</span>
                                                                    </Dropdown.Item>
                                                                )}

                                                                {/* Connect — for Consentz items when not connected */}
                                                                {isConsentz && !consentzConnected && (
                                                                    <Dropdown.Item
                                                                        icon={Link01}
                                                                        onAction={() => router.push("/settings?tab=integrations")}
                                                                    >
                                                                        <span className="pr-4">Connect Consentz</span>
                                                                    </Dropdown.Item>
                                                                )}

                                                                {/* Destructive actions */}
                                                                {(currentFile || (item.sourceLabel === "POLICY" && statusRecord?.linkedPolicyId)) && <Dropdown.Separator />}

                                                                {/* Unlink — for POLICY items with a linked policy */}
                                                                {item.sourceLabel === "POLICY" && statusRecord?.linkedPolicyId && (
                                                                    <Dropdown.Item
                                                                        icon={LinkBroken01}
                                                                        onAction={() => updateStatus.mutate({ evidenceItemId: item.id, status: "not_started", linkedPolicyId: null })}
                                                                    >
                                                                        <span className="pr-4">Unlink policy</span>
                                                                    </Dropdown.Item>
                                                                )}

                                                                {/* Delete — when a file has been uploaded */}
                                                                {currentFile && (
                                                                    <Dropdown.Item
                                                                        icon={Trash01}
                                                                        onAction={() => {
                                                                            if (confirmDeleteFileId === currentFile.id) {
                                                                                deleteFile.mutate(
                                                                                    { id: currentFile.id, kloeCode, evidenceItemId: item.id },
                                                                                    { onSettled: () => setConfirmDeleteFileId(null) },
                                                                                );
                                                                            } else {
                                                                                setConfirmDeleteFileId(currentFile.id);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <span className="pr-4">
                                                                            {confirmDeleteFileId === currentFile.id ? "Confirm delete" : "Delete file"}
                                                                        </span>
                                                                    </Dropdown.Item>
                                                                )}
                                                            </Dropdown.Menu>
                                                        </Dropdown.Popover>
                                                    </Dropdown.Root>
                                                </div>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                }}
                            </Table.Body>
                        </Table>
                    ) : (
                        <div className="px-6 py-10 text-center">
                            <p className="text-sm text-tertiary">Evidence requirements for this KLOE are not yet defined for your service type.</p>
                        </div>
                    )}
                </TableCard.Root>
            )}

            {/* Linked Evidence — includes both per-requirement file uploads and general KLOE evidence */}
            <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-primary">Linked Evidence ({kloeEvidence.length + fileMap.current.size})</h2>
                    <Button color="secondary" size="sm" iconLeading={Upload01} onClick={() => setShowUploadModal(true)}>Upload Evidence</Button>
                </div>
                {(kloeEvidence.length + fileMap.current.size) > 0 ? (
                    <div className="flex flex-col gap-2">
                        {/* Per-requirement file uploads (evidence_file_versions) */}
                        {evidenceItems.map((item) => {
                            const f = fileMap.current.get(item.id);
                            if (!f) return null;
                            const vStatus = f.verificationStatus;
                            const badgeColor: "success" | "error" | "warning" | "gray" =
                                vStatus === "verified" ? "success"
                                : vStatus === "rejected" ? "error"
                                : vStatus === "pending" ? "warning"
                                : "gray";
                            const badgeLabel =
                                vStatus === "verified" ? "Verified"
                                : vStatus === "rejected" ? "Rejected"
                                : vStatus === "pending" ? "Verifying"
                                : "Unverified";
                            return (
                                <button
                                    key={`file_${f.id}`}
                                    onClick={() => openFileViewer(f.id)}
                                    className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-3 text-left transition duration-100 hover:border-brand sm:p-4"
                                >
                                    <File06 className="size-5 text-fg-quaternary" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-primary truncate">{f.fileName}</p>
                                        <p className="text-xs text-tertiary truncate">
                                            Requirement · {item.description}
                                        </p>
                                    </div>
                                    <Badge size="sm" color={badgeColor} type="pill-color">{badgeLabel}</Badge>
                                </button>
                            );
                        })}

                        {/* General KLOE-level evidence (evidence_items) */}
                        {kloeEvidence.map((ev) => {
                            const name = ev.title ?? ev.file_name ?? ev.fileName ?? "Untitled";
                            const category = ev.category ?? "OTHER";
                            const size = ev.file_size ?? ev.fileSize ?? "";
                            const uploader = ev.uploaded_by ?? ev.uploadedBy ?? "";
                            const status = ev.status ?? "VALID";

                            return (
                                <button
                                    key={ev.id}
                                    onClick={() => router.push(`/evidence/${ev.id}`)}
                                    className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-3 text-left transition duration-100 hover:border-brand sm:p-4"
                                >
                                    <File06 className="size-5 text-fg-quaternary" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-primary truncate">{name}</p>
                                        <p className="text-xs text-tertiary">
                                            {category.replace(/_/g, " ")}{size ? ` · ${size}` : ""}{uploader ? ` · Uploaded by ${uploader}` : ""}
                                        </p>
                                    </div>
                                    <Badge size="sm" color={status === "VALID" ? "success" : status === "EXPIRED" ? "error" : "warning"} type="pill-color">
                                        {status.replace(/_/g, " ")}
                                    </Badge>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-secondary bg-secondary p-8 text-center">
                        <p className="text-sm text-tertiary">No evidence linked to this KLOE yet.</p>
                        <Button color="primary" size="sm" className="mt-3" iconLeading={Upload01} onClick={() => setShowUploadModal(true)}>Upload Evidence</Button>
                    </div>
                )}
            </div>

            {/* Gaps */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-primary">Compliance Gaps ({allKloeGaps.length})</h2>
                {allKloeGaps.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {allKloeGaps.map((gap) => {
                            const isExpanded = expandedGapId === gap.id;
                            const hasSteps = gap.remediationSteps && gap.remediationSteps.length > 0;

                            return (
                                <div key={gap.id} className="rounded-xl border border-secondary bg-primary p-4">
                                    <div className="flex items-start gap-3">
                                        <span className={cx("mt-1 size-2.5 shrink-0 rounded-full", SEVERITY_DOT[gap.severity])} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-primary">{gap.title}</p>
                                            <p className="mt-1 text-xs text-tertiary">{gap.description}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <Badge size="sm" color={SEVERITY_BADGE[gap.severity]} type="pill-color">{gap.severity}</Badge>
                                                <Badge size="sm" color="gray" type="pill-color">{gap.status.replace("_", " ")}</Badge>
                                                <span className="text-xs text-tertiary">{gap.regulation}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {gap.remediationAction ? (
                                            <Button
                                                color="primary"
                                                size="sm"
                                                iconLeading={
                                                    gap.remediationAction.includes("Upload") ? Upload01
                                                    : gap.remediationAction.includes("Consentz") ? Link01
                                                    : gap.remediationAction.includes("policy") || gap.remediationAction.includes("Policy") ? Link01
                                                    : undefined
                                                }
                                                onClick={() => {
                                                    if (gap.remediationAction?.includes("Upload")) {
                                                        // Pass kloe in lowercase so the upload-page "Back" button returns to
                                                        // the exact same URL casing the user arrived from.
                                                        router.push(`/evidence/upload?kloe=${kloeCode.toLowerCase()}&domain=${domainSlug}`);
                                                    } else if (gap.remediationAction?.includes("policy") || gap.remediationAction?.includes("Policy")) {
                                                        router.push(`/policies?domain=${domainSlug}`);
                                                    } else if (gap.remediationAction?.includes("Consentz")) {
                                                        router.push("/settings?tab=integrations");
                                                    }
                                                }}
                                            >
                                                {gap.remediationAction}
                                            </Button>
                                        ) : (
                                            <Button
                                                color="secondary"
                                                size="sm"
                                                iconTrailing={isExpanded ? ChevronUp : ChevronDown}
                                                onClick={() => setExpandedGapId(isExpanded ? null : gap.id)}
                                            >
                                                {isExpanded ? "Hide Remediation" : "View Remediation"}
                                            </Button>
                                        )}
                                        {gap.status !== "RESOLVED" && !gap.id.startsWith("derived_") && (
                                            <Button
                                                color="tertiary"
                                                size="sm"
                                                isLoading={resolvingId === gap.id}
                                                onClick={() => handleResolve(gap.id)}
                                            >
                                                Mark Resolved
                                            </Button>
                                        )}
                                    </div>

                                    {!gap.remediationAction && isExpanded && (
                                        <div className="mt-3 rounded-lg border border-secondary bg-secondary p-4">
                                            <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Remediation Steps</p>
                                            {hasSteps ? (
                                                <ol className="mt-2 list-decimal space-y-1.5 pl-4">
                                                    {gap.remediationSteps!.map((step: string, i: number) => (
                                                        <li key={i} className="text-sm text-primary">{step}</li>
                                                    ))}
                                                </ol>
                                            ) : (
                                                <p className="mt-2 text-sm text-tertiary">
                                                    No specific remediation steps recorded. Review this gap with your compliance manager and document the corrective actions taken.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : kloeScore >= 63 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-success-200 bg-success-primary p-4">
                        <CheckCircle className="size-5 text-success-primary" />
                        <p className="text-sm font-medium text-success-primary">No gaps — this KLOE is fully compliant.</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-warning-200 bg-warning-primary p-4">
                        <AlertTriangle className="size-5 text-warning-primary" />
                        <p className="text-sm font-medium text-warning-primary">
                            {evidenceItems.length === 0
                                ? "No evidence requirements defined for this KLOE."
                                : `Evidence incomplete (${evidenceCompletionPct}%). Upload missing evidence to generate a compliant score.`}
                        </p>
                    </div>
                )}
            </div>

            {/* Document Viewer Modal */}
            {viewerFile && (
                <ModalOverlay isOpen onOpenChange={(open) => { if (!open) setViewerFile(null); }}>
                    <Modal className="sm:max-w-4xl">
                        <Dialog>
                            <div className="flex w-full flex-col overflow-hidden rounded-xl bg-primary shadow-xl ring-1 ring-secondary">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-secondary px-4 py-3 sm:px-6">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <File06 className="size-5 shrink-0 text-fg-quaternary" />
                                        <p className="text-sm font-semibold text-primary truncate">{viewerFile.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            iconLeading={Download01}
                                            onClick={() => window.open(viewerFile.url, "_blank")}
                                        >
                                            Download
                                        </Button>
                                        <button
                                            type="button"
                                            className="rounded-md p-1.5 text-fg-quaternary transition hover:bg-secondary hover:text-fg-quaternary_hover"
                                            onClick={() => setViewerFile(null)}
                                            aria-label="Close viewer"
                                        >
                                            <XClose className="size-5" />
                                        </button>
                                    </div>
                                </div>
                                {/* Body */}
                                <div className="relative flex items-center justify-center bg-secondary/50" style={{ height: "min(75vh, 800px)" }}>
                                    {viewerFile.type.startsWith("image/") ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={viewerFile.url}
                                            alt={viewerFile.name}
                                            className="max-h-full max-w-full object-contain p-4"
                                        />
                                    ) : viewerFile.type === "application/pdf" || viewerFile.name.endsWith(".pdf") ? (
                                        <iframe
                                            src={viewerFile.url}
                                            title={viewerFile.name}
                                            className="h-full w-full border-0"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 p-8 text-center">
                                            <File06 className="size-12 text-fg-quaternary" />
                                            <div>
                                                <p className="text-sm font-medium text-primary">Preview not available</p>
                                                <p className="mt-1 text-xs text-tertiary">This file type cannot be previewed in the browser.</p>
                                            </div>
                                            <Button
                                                color="primary"
                                                size="sm"
                                                iconLeading={Download01}
                                                onClick={() => window.open(viewerFile.url, "_blank")}
                                            >
                                                Download to view
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            )}

            {/* Link Policy Modal */}
            {linkPolicyTarget && (
                <ModalOverlay isOpen onOpenChange={(open) => { if (!open) setLinkPolicyTarget(null); }}>
                    <Modal className="sm:max-w-lg">
                        <Dialog>
                            <div className="flex w-full flex-col overflow-hidden rounded-xl bg-primary shadow-xl ring-1 ring-secondary">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
                                    <div>
                                        <h3 className="text-base font-semibold text-primary">Link a policy</h3>
                                        <p className="mt-0.5 text-sm text-tertiary">Select a published policy to link to this evidence requirement.</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="rounded-md p-1.5 text-fg-quaternary transition hover:bg-secondary hover:text-fg-quaternary_hover"
                                        onClick={() => setLinkPolicyTarget(null)}
                                        aria-label="Close"
                                    >
                                        <XClose className="size-5" />
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="border-b border-secondary px-5 py-3">
                                    <div className="flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2">
                                        <SearchLg className="size-4 shrink-0 text-fg-quaternary" />
                                        <input
                                            type="text"
                                            placeholder="Search policies…"
                                            value={policySearch}
                                            onChange={(e) => setPolicySearch(e.target.value)}
                                            className="w-full bg-transparent text-sm text-primary placeholder:text-placeholder outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Policy list */}
                                <div className="max-h-72 overflow-y-auto">
                                    {(() => {
                                        const allPolicies = (policiesResponse?.data ?? []) as Policy[];
                                        const filtered = policySearch.trim()
                                            ? allPolicies.filter((p) => p.title.toLowerCase().includes(policySearch.toLowerCase()))
                                            : allPolicies;

                                        if (filtered.length === 0) {
                                            return (
                                                <div className="px-5 py-8 text-center">
                                                    <p className="text-sm text-tertiary">
                                                        {allPolicies.length === 0 ? "No published policies found." : "No policies match your search."}
                                                    </p>
                                                </div>
                                            );
                                        }

                                        return filtered.map((policy) => (
                                            <button
                                                key={policy.id}
                                                type="button"
                                                className="flex w-full items-center gap-3 border-b border-secondary px-5 py-3 text-left transition hover:bg-primary_hover last:border-b-0"
                                                onClick={() => {
                                                    updateStatus.mutate({
                                                        evidenceItemId: linkPolicyTarget,
                                                        status: "complete",
                                                        linkedPolicyId: policy.id,
                                                    });
                                                    setLinkPolicyTarget(null);
                                                }}
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
                                                    <File06 className="size-4 text-brand-primary" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-primary truncate">{policy.title}</p>
                                                    <p className="text-xs text-tertiary">
                                                        {policy.status === "PUBLISHED" ? "Published" : policy.status}
                                                        {policy.category && ` · ${policy.category}`}
                                                    </p>
                                                </div>
                                                <Link01 className="size-4 shrink-0 text-fg-quaternary" />
                                            </button>
                                        ));
                                    })()}
                                </div>

                                {/* Footer */}
                                <div className="border-t border-secondary px-5 py-3">
                                    <p className="text-xs text-tertiary">
                                        {"Don't see the policy you need? "}
                                        <button
                                            type="button"
                                            className="font-medium text-brand-primary hover:text-brand-primary_hover transition"
                                            onClick={() => { setLinkPolicyTarget(null); router.push(`/policies?domain=${domainSlug}`); }}
                                        >
                                            Create or generate one with AI
                                        </button>
                                        {" on the Policies page."}
                                    </p>
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            )}

            {/* Upload Evidence Modal */}
            {showUploadModal && (
                <ModalOverlay isOpen onOpenChange={(open) => { if (!open) resetUploadModal(); }}>
                    <Modal className="sm:max-w-xl">
                        <Dialog>
                            <div className="flex w-full flex-col overflow-hidden rounded-xl bg-primary shadow-xl ring-1 ring-secondary">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
                                    <div>
                                        <h3 className="text-base font-semibold text-primary">{uploadTargetItemId ? "Upload Requirement Evidence" : "Upload Evidence"}</h3>
                                        <p className="mt-0.5 text-sm text-tertiary">
                                            {uploadTargetItemId
                                                ? evidenceItems.find((i) => i.id === uploadTargetItemId)?.description ?? `Upload a file for ${uploadTargetItemId}`
                                                : `Upload a document and link it to ${kloeCode.toUpperCase()}.`}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="rounded-md p-1.5 text-fg-quaternary transition hover:bg-secondary hover:text-fg-quaternary_hover"
                                        onClick={resetUploadModal}
                                        aria-label="Close"
                                    >
                                        <XClose className="size-5" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-5 py-4">
                                    {/* Hidden file input */}
                                    <input
                                        ref={uploadFileInputRef}
                                        type="file"
                                        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp"
                                        className="hidden"
                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadFileSelect(f); }}
                                    />

                                    {/* Drop zone / file preview */}
                                    {uploadFile ? (
                                        <div className="flex items-center gap-4 rounded-xl border border-secondary bg-secondary p-4">
                                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
                                                <File06 className="size-5 text-fg-quaternary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate text-sm font-medium text-primary">{uploadFile.name}</p>
                                                <p className="text-xs text-tertiary">{formatFileSize(uploadFile.size)}</p>
                                            </div>
                                            <button
                                                type="button"
                                                className="rounded-md p-1 text-fg-quaternary transition hover:text-fg-quaternary_hover"
                                                onClick={() => { setUploadFile(null); if (uploadFileInputRef.current) uploadFileInputRef.current.value = ""; }}
                                            >
                                                <XClose className="size-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => uploadFileInputRef.current?.click()}
                                            onDragOver={(e) => { e.preventDefault(); setUploadDragOver(true); }}
                                            onDragLeave={() => setUploadDragOver(false)}
                                            onDrop={handleUploadDrop}
                                            className={cx(
                                                "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition duration-100 cursor-pointer",
                                                uploadDragOver ? "border-brand bg-secondary" : "border-secondary bg-secondary hover:border-brand",
                                            )}
                                        >
                                            <div className="flex size-10 items-center justify-center rounded-full bg-primary">
                                                <UploadCloud01 className="size-5 text-fg-quaternary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-primary">Click to upload or drag and drop</p>
                                                <p className="mt-0.5 text-xs text-tertiary">PDF, DOCX, XLSX, JPG, PNG up to 10 MB</p>
                                            </div>
                                        </button>
                                    )}

                                    {/* Error */}
                                    {uploadError && (
                                        <div className="rounded-lg border border-error px-4 py-3">
                                            <p className="text-sm text-error-primary">{uploadError}</p>
                                        </div>
                                    )}

                                    {/* Form fields — only show name/category for general uploads */}
                                    {!uploadTargetItemId && (
                                        <>
                                            <Input
                                                label="Document name"
                                                placeholder="Fire Safety Certificate 2026"
                                                isRequired
                                                value={uploadName}
                                                onChange={setUploadName}
                                            />
                                            <Select
                                                label="Document type"
                                                placeholder="Select type…"
                                                isRequired
                                                selectedKey={uploadCategory}
                                                onSelectionChange={(key) => setUploadCategory(key as string)}
                                                items={EVIDENCE_TYPES}
                                            >
                                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                            </Select>
                                        </>
                                    )}
                                    <DatePickerField
                                        label="Expiry date (if applicable)"
                                        value={uploadExpiry}
                                        onChange={setUploadExpiry}
                                    />

                                    {/* Pre-filled info */}
                                    <div className="flex items-center gap-4 rounded-lg bg-secondary px-4 py-3">
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-quaternary uppercase tracking-wide">Linked to</p>
                                            <p className="mt-0.5 text-sm font-medium text-primary">
                                                {domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)} · {kloeCode.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-end gap-3 border-t border-secondary px-5 py-3">
                                    <Button color="secondary" size="sm" onClick={resetUploadModal}>
                                        Cancel
                                    </Button>
                                    <Button
                                        color="primary"
                                        size="sm"
                                        iconLeading={uploadMutation.isSuccess ? CheckCircle : UploadCloud01}
                                        isLoading={uploadMutation.isPending}
                                        isDisabled={!canSubmitUpload}
                                        onClick={() => uploadMutation.mutate()}
                                    >
                                        Upload &amp; Save
                                    </Button>
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            )}

            {/* AI Verification Results Modal */}
            {verificationResultModal && (
                <ModalOverlay isOpen onOpenChange={(open) => { if (!open) setVerificationResultModal(null); }}>
                    <Modal className="sm:max-w-2xl">
                        <Dialog>
                            <div className="flex w-full flex-col overflow-hidden rounded-xl bg-primary shadow-xl ring-1 ring-secondary">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        {verificationResultModal.status === "verified" ? (
                                            <div className="flex size-10 items-center justify-center rounded-full bg-success-primary/10">
                                                <ShieldTick className="size-5 text-success-primary" />
                                            </div>
                                        ) : (
                                            <div className="flex size-10 items-center justify-center rounded-full bg-error-primary/10">
                                                <AlertTriangle className="size-5 text-error-primary" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-base font-semibold text-primary">
                                                {verificationResultModal.status === "verified" ? "Evidence Verified" : "Evidence Not Compliant"}
                                            </h3>
                                            <p className="mt-0.5 text-sm text-tertiary">
                                                AI Compliance Score: {verificationResultModal.result.complianceScore}% · Confidence: {verificationResultModal.result.confidenceScore}%
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="rounded-md p-1.5 text-fg-quaternary transition hover:bg-secondary hover:text-fg-quaternary_hover"
                                        onClick={() => setVerificationResultModal(null)}
                                        aria-label="Close"
                                    >
                                        <XClose className="size-5" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-5 py-4">
                                    {/* Summary */}
                                    <div className={cx(
                                        "rounded-lg border px-4 py-3",
                                        verificationResultModal.status === "verified" ? "border-success bg-success-primary/5" : "border-error bg-error-primary/5",
                                    )}>
                                        <p className="text-sm text-primary">{verificationResultModal.result.summary}</p>
                                    </div>

                                    {/* Compliance Score Bar */}
                                    <div>
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <span className="text-xs font-medium text-tertiary">Compliance Score</span>
                                            <span className="text-xs font-semibold text-primary">{verificationResultModal.result.complianceScore}%</span>
                                        </div>
                                        <ProgressBarBase
                                            value={verificationResultModal.result.complianceScore}
                                            max={100}
                                            progressClassName={
                                                verificationResultModal.result.complianceScore >= 70 ? "bg-success-primary"
                                                : verificationResultModal.result.complianceScore >= 50 ? "bg-warning-primary"
                                                : "bg-error-primary"
                                            }
                                        />
                                    </div>

                                    {/* Findings */}
                                    {verificationResultModal.result.findings.length > 0 && (
                                        <div>
                                            <h4 className="mb-2 text-sm font-semibold text-primary">Findings</h4>
                                            <div className="flex flex-col gap-2">
                                                {verificationResultModal.result.findings.map((finding, idx) => (
                                                    <div key={idx} className="flex items-start gap-2.5 rounded-lg border border-secondary bg-secondary px-3 py-2.5">
                                                        {finding.met ? (
                                                            <CheckCircle className="mt-0.5 size-4 shrink-0 text-success-primary" />
                                                        ) : (
                                                            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-error-primary" />
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-primary">{finding.criterion}</p>
                                                            <p className="mt-0.5 text-xs text-tertiary">{finding.detail}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Missing Elements */}
                                    {verificationResultModal.result.missingElements.length > 0 && (
                                        <div>
                                            <h4 className="mb-2 text-sm font-semibold text-primary">Missing Elements</h4>
                                            <ul className="flex flex-col gap-1 pl-4">
                                                {verificationResultModal.result.missingElements.map((el, idx) => (
                                                    <li key={idx} className="list-disc text-sm text-tertiary">{el}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Recommendations */}
                                    {verificationResultModal.result.recommendations.length > 0 && (
                                        <div>
                                            <h4 className="mb-2 text-sm font-semibold text-primary">Recommendations</h4>
                                            <ul className="flex flex-col gap-1 pl-4">
                                                {verificationResultModal.result.recommendations.map((rec, idx) => (
                                                    <li key={idx} className="list-disc text-sm text-tertiary">{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Meta info */}
                                    <div className="flex flex-wrap gap-2">
                                        <Badge size="sm" color="gray" type="pill-color">
                                            {verificationResultModal.result.documentType}
                                        </Badge>
                                        <Badge size="sm" color={
                                            verificationResultModal.result.dateRelevance === "current" ? "success"
                                            : verificationResultModal.result.dateRelevance === "outdated" ? "error"
                                            : "warning"
                                        } type="pill-color">
                                            {verificationResultModal.result.dateRelevance === "current" ? "Current"
                                            : verificationResultModal.result.dateRelevance === "outdated" ? "Outdated"
                                            : verificationResultModal.result.dateRelevance === "undated" ? "No date found"
                                            : "N/A"}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-end gap-3 border-t border-secondary px-5 py-3">
                                    <Button color="secondary" size="sm" onClick={() => setVerificationResultModal(null)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            )}
        </div>
    );
}
