"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UploadCloud01, ChevronLeft, File06, XClose, CheckCircle } from "@untitledui/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";
import { toast } from "@/lib/toast";
import { useMarkOnboardingStep } from "@/hooks/use-onboarding";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { DatePickerField } from "@/components/application/date-picker/date-picker-field";
import { cx } from "@/utils/cx";

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

const DOMAINS = [
    { id: "safe", label: "Safe" },
    { id: "effective", label: "Effective" },
    { id: "caring", label: "Caring" },
    { id: "responsive", label: "Responsive" },
    { id: "well-led", label: "Well-Led" },
];

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EvidenceUploadPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const markOnboardingStep = useMarkOnboardingStep();

    const prefillCategory = searchParams.get("category");
    const prefillDomain = searchParams.get("domain");
    const prefillKloe = searchParams.get("kloe");

    // Build return URL: go back to KLOE page if we came from one, otherwise /evidence
    const returnUrl = prefillDomain && prefillKloe
        ? `/domains/${prefillDomain}/${prefillKloe}`
        : "/evidence";

    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState("");
    const [category, setCategory] = useState<string | null>(
        prefillCategory && EVIDENCE_TYPES.some((t) => t.id === prefillCategory) ? prefillCategory : null,
    );
    const [domain, setDomain] = useState<string | null>(
        prefillDomain && DOMAINS.some((d) => d.id === prefillDomain) ? prefillDomain : null,
    );
    const [kloes, setKloes] = useState(prefillKloe ?? "");
    const [expiryDate, setExpiryDate] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const ALLOWED_EXTENSIONS = ["pdf", "docx", "doc", "xlsx", "xls", "csv", "jpg", "jpeg", "png", "webp"];
    const MAX_SIZE = 10 * 1024 * 1024;

    function validateFile(f: File): string | null {
        const ext = f.name.split(".").pop()?.toLowerCase();
        if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
            return `Unsupported file type (.${ext}). Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
        }
        if (f.size > MAX_SIZE) {
            return `File too large (${formatFileSize(f.size)}). Maximum is 10MB.`;
        }
        return null;
    }

    function handleFileSelect(f: File) {
        const err = validateFile(f);
        if (err) {
            setError(err);
            return;
        }
        setError(null);
        setFile(f);
        if (!name) {
            setName(f.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "));
        }
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (f) handleFileSelect(f);
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFileSelect(f);
    }, [name]);

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error("No file selected");
            if (!name.trim()) throw new Error("Document name is required");
            if (!category) throw new Error("Document type is required");

            const formData = new FormData();
            formData.append("file", file);
            formData.append("bucket", "evidence");

            const uploadRes = await fetch("/api/evidence/upload", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json().catch(() => null);
                throw new Error(errData?.error?.message ?? `Upload failed (${uploadRes.status})`);
            }

            const uploadData = await uploadRes.json();
            const fileInfo = uploadData.data;

            const kloeCodes = kloes
                .split(",")
                .map((k) => k.trim().toUpperCase())
                .filter(Boolean);

            const linkedDomains: string[] = [];
            if (domain) linkedDomains.push(domain);

            const evidence = await apiPost("/api/evidence", {
                name: name.trim(),
                category,
                fileUrl: fileInfo.fileUrl,
                fileName: fileInfo.fileName,
                fileType: fileInfo.fileType,
                fileSize: fileInfo.fileSize,
                storagePath: fileInfo.storagePath,
                linkedKloes: kloeCodes,
                linkedDomains,
                validUntil: expiryDate || undefined,
            });

            return evidence;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["evidence"] });
            markOnboardingStep("upload_evidence");
            toast.success("Evidence uploaded", "Your document has been saved successfully.");
            router.push(returnUrl);
        },
        onError: (err: Error) => {
            setError(err.message);
            toast.error("Upload failed", err.message);
        },
    });

    const canSubmit = !!file && !!name.trim() && !!category && !uploadMutation.isPending;

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push(returnUrl)}>
                {prefillKloe ? `Back to ${prefillKloe.toUpperCase()}` : "Back to Evidence"}
            </Button>

            <div>
                <h1 className="text-display-xs font-semibold text-primary">Upload Evidence</h1>
                <p className="mt-1 text-sm text-tertiary">Add a new document to your evidence library.</p>
            </div>

            {/* Drop zone */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleInputChange}
            />

            {file ? (
                <div className="flex items-center gap-4 rounded-xl border border-secondary bg-primary p-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                        <File06 className="size-5 text-fg-quaternary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-primary">{file.name}</p>
                        <p className="text-xs text-tertiary">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                        color="link-gray"
                        size="sm"
                        iconLeading={XClose}
                        onClick={() => {
                            setFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                    >
                        Remove
                    </Button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={cx(
                        "flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-6 sm:p-12 text-center transition duration-100 cursor-pointer",
                        dragOver ? "border-brand bg-secondary" : "border-secondary bg-secondary hover:border-brand",
                    )}
                >
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary">
                        <UploadCloud01 className="size-6 text-fg-quaternary" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-primary">Click to upload or drag and drop</p>
                        <p className="mt-1 text-xs text-tertiary">PDF, DOCX, XLSX, JPG, PNG up to 10MB</p>
                    </div>
                    <Button color="secondary" size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Choose File</Button>
                </button>
            )}

            {/* Error message */}
            {error && (
                <div className="rounded-lg border border-error px-4 py-3">
                    <p className="text-sm text-error-primary">{error}</p>
                </div>
            )}

            {/* Meta form */}
            <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-4 sm:p-6">
                <Input
                    label="Document name"
                    placeholder="Fire Safety Certificate 2026"
                    isRequired
                    value={name}
                    onChange={setName}
                />
                <Select
                    label="Document type"
                    placeholder="Select type..."
                    isRequired
                    selectedKey={category}
                    onSelectionChange={(key) => setCategory(key as string)}
                    items={EVIDENCE_TYPES}
                >
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                </Select>
                <Select
                    label="Linked domain"
                    placeholder="Select domain..."
                    selectedKey={domain}
                    onSelectionChange={(key) => setDomain(key as string)}
                    items={DOMAINS}
                >
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                </Select>
                <Input
                    label="Linked KLOE code"
                    placeholder="S1, S2, E3..."
                    hint="Comma-separated KLOE codes"
                    value={kloes}
                    onChange={setKloes}
                />
                <DatePickerField
                    label="Expiry date (if applicable)"
                    value={expiryDate}
                    onChange={setExpiryDate}
                />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button color="secondary" size="lg" onClick={() => router.push(returnUrl)}>Cancel</Button>
                <Button
                    color="primary"
                    size="lg"
                    iconLeading={uploadMutation.isSuccess ? CheckCircle : UploadCloud01}
                    isLoading={uploadMutation.isPending}
                    isDisabled={!canSubmit}
                    onClick={() => uploadMutation.mutate()}
                >
                    Upload &amp; Save
                </Button>
            </div>
        </div>
    );
}
