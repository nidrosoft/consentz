"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, ChevronLeft, FileCheck02, Loading01, Stars01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { useCreatePolicy, useGeneratePolicy, useUpdatePolicy } from "@/hooks/use-policies";
import { useAllPolicyTemplates } from "@/hooks/use-policy-templates";

const CATEGORIES = ["Health & Safety", "Clinical", "Governance", "HR", "Operations", "Safeguarding"];

const GENERATION_STEPS = [
    "Analyzing CQC regulations and requirements",
    "Mapping relevant KLOEs and quality statements",
    "Structuring policy sections and procedures",
    "Writing detailed compliance content",
    "Adding roles, responsibilities and training requirements",
    "Formatting, cross-referencing and final review",
] as const;

const STEP_DELAYS = [5000, 8000, 15000, 25000, 20000, 30000];

function useGenerationProgress(isGenerating: boolean) {
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        if (!isGenerating) {
            setStepIndex(0);
            return;
        }

        let timeout: ReturnType<typeof setTimeout>;
        let current = 0;

        function advance() {
            if (current < GENERATION_STEPS.length - 1) {
                current++;
                setStepIndex(current);
                timeout = setTimeout(advance, STEP_DELAYS[current] ?? 15000);
            }
        }

        timeout = setTimeout(advance, STEP_DELAYS[0] ?? 5000);
        return () => clearTimeout(timeout);
    }, [isGenerating]);

    return stepIndex;
}

export default function CreatePolicyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefillTemplateCode = searchParams.get("templateCode");

    // AI generation state — selectedTemplateCode is a Cura code (e.g. "CPS-14").
    const [aiExpanded, setAiExpanded] = useState(!!prefillTemplateCode);
    const [selectedTemplateCode, setSelectedTemplateCode] = useState<string | null>(prefillTemplateCode);
    const [customInstructions, setCustomInstructions] = useState("");

    // Manual form state
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<string | null>(null);
    const [content, setContent] = useState("");
    const [version, setVersion] = useState("");

    // Hooks
    const { data: templates, isLoading: templatesLoading } = useAllPolicyTemplates();
    const generatePolicy = useGeneratePolicy();
    const createPolicy = useCreatePolicy();
    const updatePolicy = useUpdatePolicy();

    const isGenerating = generatePolicy.isPending;
    const stepIndex = useGenerationProgress(isGenerating);

    // Flatten Cura templates into Select items; the label is "CPS-14 — <title>"
    // and supportingText is the category so users can skim to the right section.
    const templateItems = useMemo(() => {
        if (!templates) return [];
        // Sort by category then by code so related templates group together.
        const sorted = [...templates].sort((a, b) =>
            a.category === b.category ? a.code.localeCompare(b.code) : a.category.localeCompare(b.category)
        );
        return sorted.map((t) => ({
            id: t.code,
            label: `${t.code} — ${t.title}`,
            supportingText: t.categoryLabel,
        }));
    }, [templates]);

    const manualFormValid = title.trim().length > 0 && category !== null && content.trim().length > 0;

    const handleGenerate = useCallback(() => {
        if (!selectedTemplateCode) return;
        generatePolicy.mutate(
            { templateCode: selectedTemplateCode, customInstructions: customInstructions || undefined },
            {
                onSuccess: (data) => {
                    router.push(`/policies/${data.policy.id}`);
                },
            },
        );
    }, [selectedTemplateCode, customInstructions, generatePolicy, router]);

    const handleSaveDraft = useCallback(() => {
        if (!title.trim() || !category) return;
        createPolicy.mutate(
            { title: title.trim(), content: content.trim() || undefined, category },
            {
                onSuccess: (data) => {
                    if (data?.id) router.push(`/policies/${data.id}`);
                },
            },
        );
    }, [title, category, content, createPolicy, router]);

    const handleSubmitForReview = useCallback(() => {
        if (!manualFormValid) return;
        createPolicy.mutate(
            { title: title.trim(), content: content.trim(), category: category! },
            {
                onSuccess: (data) => {
                    if (!data?.id) return;
                    updatePolicy.mutate(
                        { id: data.id, status: "UNDER_REVIEW" },
                        { onSuccess: () => router.push(`/policies/${data.id}`) },
                    );
                },
            },
        );
    }, [manualFormValid, title, content, category, createPolicy, updatePolicy, router]);

    const isSaving = createPolicy.isPending || updatePolicy.isPending;

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/policies")}>
                Back to Policies
            </Button>

            <div>
                <h1 className="text-display-xs font-semibold text-primary">Create New Policy</h1>
                <p className="mt-1 text-sm text-tertiary">Write a new policy document or generate one with AI.</p>
            </div>

            {/* AI generate card */}
            <div className="rounded-xl border border-brand-200 bg-brand-primary p-4 sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-solid">
                        <Stars01 className="size-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-primary">AI-Generated Policy</h3>
                        <p className="mt-1 text-sm text-tertiary">
                            Generate a CQC-compliant policy draft using AI. The generator uses the relevant Cura template as its structural and compliance baseline, then personalises it for your clinic. You can review and edit before publishing.
                        </p>

                        {!aiExpanded && !isGenerating && (
                            <Button color="primary" size="sm" className="mt-3" onClick={() => setAiExpanded(true)}>
                                Generate with AI
                            </Button>
                        )}

                        <AnimatePresence>
                            {(aiExpanded || isGenerating) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden"
                                >
                                    {isGenerating ? (
                                        <div className="mt-5 flex flex-col gap-3">
                                            {GENERATION_STEPS.map((step, i) => (
                                                <div key={step} className="flex items-center gap-3">
                                                    {i < stepIndex ? (
                                                        <CheckCircle className="size-5 text-fg-success-secondary" />
                                                    ) : i === stepIndex ? (
                                                        <Loading01 className="size-5 animate-spin text-fg-brand-primary" />
                                                    ) : (
                                                        <div className="size-5 rounded-full border-2 border-tertiary" />
                                                    )}
                                                    <span
                                                        className={
                                                            i <= stepIndex ? "text-sm font-medium text-primary" : "text-sm text-quaternary"
                                                        }
                                                    >
                                                        {step}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-5 flex flex-col gap-4">
                                            <Select
                                                label="Cura policy template"
                                                placeholder={templatesLoading ? "Loading Cura templates…" : "Select a Cura template"}
                                                isRequired
                                                isDisabled={templatesLoading}
                                                items={templateItems}
                                                selectedKey={selectedTemplateCode}
                                                onSelectionChange={(key) => setSelectedTemplateCode(key as string)}
                                            >
                                                {(item) => (
                                                    <Select.Item key={item.id} id={item.id} supportingText={item.supportingText}>
                                                        {item.label}
                                                    </Select.Item>
                                                )}
                                            </Select>

                                            <TextArea
                                                label="Additional instructions"
                                                placeholder="e.g. Focus on domiciliary care settings, include specific medication administration procedures…"
                                                rows={3}
                                                value={customInstructions}
                                                onChange={setCustomInstructions}
                                            />

                                            <div className="flex gap-3">
                                                <Button
                                                    color="primary"
                                                    size="sm"
                                                    iconLeading={Stars01}
                                                    isDisabled={!selectedTemplateCode}
                                                    onClick={handleGenerate}
                                                >
                                                    Generate
                                                </Button>
                                                <Button color="tertiary" size="sm" onClick={() => setAiExpanded(false)}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Manual form */}
            <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-primary">Or write manually</h2>

                <Input
                    label="Policy title"
                    placeholder="Safeguarding Adults Policy"
                    isRequired
                    value={title}
                    onChange={setTitle}
                />

                <Select
                    label="Category"
                    placeholder="Select category..."
                    isRequired
                    selectedKey={category}
                    onSelectionChange={(key) => setCategory(key as string)}
                >
                    {CATEGORIES.map((c) => (
                        <Select.Item key={c} id={c}>
                            {c}
                        </Select.Item>
                    ))}
                </Select>

                <Input label="Version" placeholder="v1.0" value={version} onChange={setVersion} />

                <TextArea
                    label="Policy content"
                    placeholder="Start typing your policy content here..."
                    isRequired
                    rows={12}
                    value={content}
                    onChange={setContent}
                />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button color="secondary" size="lg" onClick={() => router.push("/policies")}>
                    Cancel
                </Button>
                <Button
                    color="tertiary"
                    size="lg"
                    iconLeading={FileCheck02}
                    isDisabled={!title.trim() || !category}
                    isLoading={isSaving}
                    onClick={handleSaveDraft}
                >
                    Save as Draft
                </Button>
                <Button
                    color="primary"
                    size="lg"
                    isDisabled={!manualFormValid}
                    isLoading={isSaving}
                    onClick={handleSubmitForReview}
                >
                    Submit for Review
                </Button>
            </div>
        </div>
    );
}
