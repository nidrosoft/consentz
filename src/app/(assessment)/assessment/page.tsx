"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    ShieldTick,
    Target02,
    Heart,
    Zap,
    Trophy01,
    Building07,
    HeartHand,
    CheckCircle,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import {
    getQuestionsForServiceType,
    type ServiceType,
} from "@/lib/constants/assessment-questions";
import { apiPatch, apiPost } from "@/lib/api-client";

import Step1ServiceType from "./steps/step-1-service-type";
import Step2Organization from "./steps/step-2-organization";
import DomainStep, { groupByKloe } from "./steps/domain-step";

// ─── Step Definitions ────────────────────────────────────────────────────────

const STEPS = [
    {
        id: 1,
        title: "Service Type",
        description: "Tell us what type of service you provide",
        Icon: HeartHand,
    },
    {
        id: 2,
        title: "Organization",
        description: "Your organization details",
        Icon: Building07,
    },
    {
        id: 3,
        title: "Safe",
        description: "Safeguarding, risk & staffing",
        Icon: ShieldTick,
    },
    {
        id: 4,
        title: "Effective",
        description: "Care quality & staff competence",
        Icon: Target02,
    },
    {
        id: 5,
        title: "Caring",
        description: "Kindness, dignity & involvement",
        Icon: Heart,
    },
    {
        id: 6,
        title: "Responsive",
        description: "Personalised care & complaints",
        Icon: Zap,
    },
    {
        id: 7,
        title: "Well-Led",
        description: "Governance, culture & learning",
        Icon: Trophy01,
    },
];

const DOMAIN_MAP: Record<number, string> = {
    3: "SAFE",
    4: "EFFECTIVE",
    5: "CARING",
    6: "RESPONSIVE",
    7: "WELL_LED",
};

const DOMAIN_INFO: Record<string, { title: string; desc: string }> = {
    SAFE: {
        title: "Safe Domain — Protecting People from Abuse and Avoidable Harm",
        desc: "These questions assess whether your service protects people from abuse, neglect, and avoidable harm. CQC inspectors will look at safeguarding policies, risk assessments, staffing levels, medicines management, infection control, and incident learning.",
    },
    EFFECTIVE: {
        title: "Effective Domain — Evidence-Based Care and Positive Outcomes",
        desc: "These questions assess whether your care achieves good outcomes, is evidence-based, and supports quality of life. CQC will review needs assessments, staff training, nutrition, multidisciplinary working, and consent processes.",
    },
    CARING: {
        title: "Caring Domain — Compassion, Dignity and Respect",
        desc: "These questions assess whether staff treat people with kindness, dignity, and respect. CQC will look at how people are involved in decisions about their care and how privacy is maintained.",
    },
    RESPONSIVE: {
        title: "Responsive Domain — Person-Centred and Accessible Care",
        desc: "These questions assess whether services are organised to meet people's individual needs. CQC will review personalised care planning, complaints handling, and where relevant, end-of-life care.",
    },
    WELL_LED: {
        title: "Well-Led Domain — Leadership, Governance and Culture",
        desc: "These questions assess the quality of leadership, management, and governance. CQC will look at vision and strategy, quality assurance systems, organisational culture, accountability, and continuous improvement.",
    },
};

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface AssessmentData {
    serviceType: string;
    organizationName: string;
    cqcProviderId: string;
    cqcLocationId: string;
    registeredManager: string;
    postcode: string;
    bedCount: string;
    cqcRating: string;
    lastInspection: string;
    answers: Record<string, string>;
}

const initialData: AssessmentData = {
    serviceType: "",
    organizationName: "",
    cqcProviderId: "",
    cqcLocationId: "",
    registeredManager: "",
    postcode: "",
    bedCount: "",
    cqcRating: "",
    lastInspection: "",
    answers: {},
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssessmentPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [subStep, setSubStep] = useState(0);
    const [data, setData] = useState<AssessmentData>(initialData);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const updateData = useCallback(
        <K extends keyof AssessmentData>(field: K, value: AssessmentData[K]) => {
            setData((prev) => ({ ...prev, [field]: value }));
        },
        [],
    );

    const setAnswer = useCallback((questionId: string, value: string) => {
        setData((prev) => ({
            ...prev,
            answers: { ...prev.answers, [questionId]: value },
        }));
    }, []);

    const toggleArrayItem = useCallback((questionId: string, item: string) => {
        setData((prev) => {
            const current: string[] = prev.answers[questionId]
                ? JSON.parse(prev.answers[questionId])
                : [];
            const next = current.includes(item)
                ? current.filter((v) => v !== item)
                : [...current, item];
            return {
                ...prev,
                answers: {
                    ...prev.answers,
                    [questionId]: next.length > 0 ? JSON.stringify(next) : "",
                },
            };
        });
    }, []);

    // Get questions filtered by selected service type
    const questions = useMemo(
        () =>
            data.serviceType
                ? getQuestionsForServiceType(data.serviceType as ServiceType)
                : [],
        [data.serviceType],
    );

    // KLOE group counts per domain step (used for sub-step navigation)
    const kloeCountForStep = useCallback(
        (stepNum: number) => {
            const domainKey = DOMAIN_MAP[stepNum];
            if (!domainKey) return 0;
            const domainQs = questions.filter((q) => q.domain === domainKey);
            return groupByKloe(domainQs).length;
        },
        [questions],
    );

    // Compute which steps are complete
    const isStepComplete = useCallback(
        (stepIdx: number) => {
            if (stepIdx === 1) return !!data.serviceType;
            if (stepIdx === 2) return !!(data.organizationName && data.postcode && data.bedCount);
            const domainKey = DOMAIN_MAP[stepIdx];
            if (!domainKey) return false;
            const domainQs = questions.filter((q) => q.domain === domainKey);
            return domainQs.length > 0 && domainQs.every((q) => !!data.answers[q.id]);
        },
        [data, questions],
    );

    // Per-domain KLOE progress (completed / total + per-KLOE flags)
    const kloeProgressForStep = useCallback(
        (stepNum: number) => {
            const domainKey = DOMAIN_MAP[stepNum];
            if (!domainKey) return { completed: 0, total: 0, kloeCompleted: [] as boolean[] };
            const domainQs = questions.filter((q) => q.domain === domainKey);
            const groups = groupByKloe(domainQs);
            const kloeCompleted = groups.map((g) =>
                g.questions.every((q) => !!data.answers[q.id]),
            );
            const completed = kloeCompleted.filter(Boolean).length;
            return { completed, total: groups.length, kloeCompleted };
        },
        [questions, data.answers],
    );

    // Save step 1 (service type)
    async function saveStep1() {
        if (!data.serviceType) {
            setError("Please select a service type.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await apiPost("/api/onboarding/service-type", { serviceType: data.serviceType });
            sessionStorage.setItem("consentz_service_type", data.serviceType);
            setCurrentStep(2);
            setSubStep(0);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save. Try again.");
        } finally {
            setSaving(false);
        }
    }

    // Save step 2 (org)
    async function saveStep2() {
        if (!data.organizationName.trim() || !data.postcode.trim() || !data.bedCount.trim()) {
            setError("Please fill in organisation name, postcode, and number of beds.");
            return;
        }
        const beds = Number.parseInt(data.bedCount, 10);
        if (Number.isNaN(beds) || beds < 1) {
            setError("Enter a valid number of beds or rooms.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await apiPatch("/api/onboarding/organization", {
                name: data.organizationName.trim(),
                postcode: data.postcode.trim(),
                bedCount: beds,
                cqcProviderId: data.cqcProviderId.trim() || null,
                cqcLocationId: data.cqcLocationId.trim() || null,
                registeredManager: data.registeredManager.trim() || null,
                cqcCurrentRatingLabel: data.cqcRating || null,
                cqcLastInspection: data.lastInspection.trim() || null,
            });
            setCurrentStep(3);
            setSubStep(0);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save details.");
        } finally {
            setSaving(false);
        }
    }

    // Submit final assessment
    async function submitAssessment() {
        setSaving(true);
        setError("");
        try {
            const res = await apiPost<Record<string, unknown>>("/api/onboarding/assessment", {
                answers: data.answers,
            });
            sessionStorage.setItem("consentz_onboarding_results", JSON.stringify(res.data));
            router.push("/assessment/results");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save assessment.");
        } finally {
            setSaving(false);
        }
    }

    // Handle "Save and continue" — advances sub-step first, then rolls to next domain
    async function handleNext() {
        if (currentStep === 1) {
            await saveStep1();
            return;
        }
        if (currentStep === 2) {
            await saveStep2();
            return;
        }

        setError("");

        // Block advancement if current sub-step has unanswered questions
        if (!allCurrentQuestionsAnswered) {
            setShowIncompleteHint(true);
            return;
        }

        setShowIncompleteHint(false);

        const totalKloes = kloeCountForStep(currentStep);
        if (subStep < totalKloes - 1) {
            setSubStep((s) => s + 1);
            return;
        }

        if (currentStep === STEPS.length) {
            await submitAssessment();
        } else {
            setCurrentStep((s) => s + 1);
            setSubStep(0);
        }
    }

    // Handle "Back" — goes to previous sub-step first, then previous domain's last sub-step
    function handleBack() {
        setError("");
        setShowIncompleteHint(false);

        if (currentStep >= 3 && subStep > 0) {
            setSubStep((s) => s - 1);
            return;
        }

        const prevStep = currentStep - 1;
        if (prevStep < 1) return;

        setCurrentStep(prevStep);
        if (prevStep >= 3) {
            const prevKloeCount = kloeCountForStep(prevStep);
            setSubStep(Math.max(0, prevKloeCount - 1));
        } else {
            setSubStep(0);
        }
    }

    const step = STEPS[currentStep - 1];
    const isDomainStep = currentStep >= 3;
    const totalKloes = isDomainStep ? kloeCountForStep(currentStep) : 0;

    // Check whether every question in the current sub-step is answered
    const allCurrentQuestionsAnswered = useMemo(() => {
        if (!isDomainStep) return true;
        const domainKey = DOMAIN_MAP[currentStep];
        if (!domainKey) return true;
        const domainQs = questions.filter((q) => q.domain === domainKey);
        const groups = groupByKloe(domainQs);
        const currentGroup = groups[subStep];
        if (!currentGroup) return true;
        return currentGroup.questions.every((q) => !!data.answers[q.id]);
    }, [isDomainStep, currentStep, questions, subStep, data.answers]);

    const [showIncompleteHint, setShowIncompleteHint] = useState(false);

    return (
        <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)] lg:grid-cols-3">
            {/* ── LEFT PANEL — Progress Sidebar ─────────────────────── */}
            <aside className="hidden min-h-0 overflow-y-auto border-r border-secondary bg-secondary_subtle px-8 py-8 lg:flex lg:flex-col">
                {/* Header */}
                <div className="mb-6 shrink-0">
                    <h2 className="text-lg font-semibold text-primary">
                        CQC Compliance Assessment
                    </h2>
                    <p className="mt-3 text-md leading-relaxed text-tertiary">
                        Complete each section to establish your compliance baseline.
                        Your answers will generate a personalised action plan.
                    </p>
                    <p className="mt-2 text-sm text-quaternary">
                        Estimated time: 10–15 minutes
                    </p>
                </div>

                {/* Stepper */}
                <div className="flex flex-1 flex-col justify-between">
                    {STEPS.map((s, i) => {
                        const stepNum = i + 1;
                        const complete = isStepComplete(stepNum);
                        const isCurrent = stepNum === currentStep;
                        const isLast = i === STEPS.length - 1;
                        const StepIcon = s.Icon;

                        const hasDomain = stepNum >= 3;
                        const kloeProg = hasDomain ? kloeProgressForStep(stepNum) : null;

                        return (
                            <div key={s.id} className="relative flex-1">
                                {/* Connector line */}
                                {!isLast && (
                                    <div
                                        className={cx(
                                            "absolute left-[18px] top-[48px] bottom-0 w-0.5",
                                            complete
                                                ? "bg-brand-solid"
                                                : "bg-secondary",
                                        )}
                                    />
                                )}

                                {/* Step row */}
                                <div className="flex items-start gap-4 py-3">
                                    {/* Step icon */}
                                    <div
                                        className={cx(
                                            "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                            complete
                                                ? "bg-brand-primary"
                                                : isCurrent
                                                  ? "bg-brand-primary ring-2 ring-brand-solid ring-offset-2 ring-offset-secondary_subtle"
                                                  : "border border-secondary bg-primary",
                                        )}
                                    >
                                        {complete ? (
                                            <CheckCircle className="h-4 w-4 text-brand-solid" />
                                        ) : (
                                            <StepIcon
                                                className={cx(
                                                    "h-4 w-4",
                                                    isCurrent
                                                        ? "text-brand-solid"
                                                        : "text-quaternary",
                                                )}
                                            />
                                        )}
                                    </div>

                                    {/* Step text + KLOE progress */}
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={cx(
                                                "text-sm font-semibold",
                                                complete || isCurrent
                                                    ? "text-primary"
                                                    : "text-tertiary",
                                            )}
                                        >
                                            {s.title}
                                        </p>
                                        <p
                                            className={cx(
                                                "mt-1 text-xs leading-relaxed",
                                                isCurrent
                                                    ? "text-tertiary"
                                                    : "text-quaternary",
                                            )}
                                        >
                                            {s.description}
                                        </p>
                                        {kloeProg && kloeProg.total > 0 && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex flex-1 gap-1">
                                                    {Array.from({ length: kloeProg.total }).map((_, idx) => {
                                                        const kloeAnswered = kloeProg.kloeCompleted[idx];
                                                        const isVisited = isCurrent && idx < subStep;
                                                        const isActive = isCurrent && idx === subStep;

                                                        return (
                                                            <div
                                                                key={idx}
                                                                className={cx(
                                                                    "h-1 flex-1 rounded-full",
                                                                    kloeAnswered || isVisited
                                                                        ? "bg-brand-solid"
                                                                        : isActive
                                                                          ? "bg-brand-secondary"
                                                                          : "bg-quaternary",
                                                                )}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                                <span className="shrink-0 text-xs text-quaternary">
                                                    {kloeProg.completed}/{kloeProg.total}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* ── RIGHT PANEL — Step Content ─────────────────────────── */}
            <div className="flex min-h-0 flex-col overflow-clip lg:col-span-2">
                {/* Step Header */}
                <div className="shrink-0 border-b border-secondary px-4 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-6 lg:px-12 lg:pt-10">
                    {/* Mobile progress pills */}
                    <div className="mb-4 flex gap-1.5 lg:hidden">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={cx(
                                    "h-1.5 flex-1 rounded-full",
                                    i + 1 <= currentStep
                                        ? "bg-brand-solid"
                                        : "bg-quaternary",
                                )}
                            />
                        ))}
                    </div>

                    <p className="text-xs font-medium text-brand-secondary sm:text-sm">
                        STEP {currentStep} OF {STEPS.length}
                        {isDomainStep && totalKloes > 0 && (
                            <span className="text-quaternary"> — Section {subStep + 1} of {totalKloes}</span>
                        )}
                    </p>
                    <h1 className="mt-1 text-lg font-semibold text-primary sm:mt-2 sm:text-display-sm">
                        {step.title}
                    </h1>
                    <p className="mt-1 text-sm text-tertiary sm:mt-2 sm:text-base">
                        {step.description}
                    </p>
                </div>

                {/* Scrollable step content */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
                    {error && (
                        <div className="mb-6 rounded-xl border border-error-300 bg-error-primary p-4" role="alert">
                            <p className="text-sm font-medium text-error-primary">{error}</p>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <Step1ServiceType
                            data={data}
                            updateData={updateData}
                        />
                    )}
                    {currentStep === 2 && (
                        <Step2Organization
                            data={data}
                            updateData={updateData}
                        />
                    )}
                    {currentStep >= 3 && currentStep <= 7 && (
                        <DomainStep
                            domainKey={DOMAIN_MAP[currentStep]}
                            domainInfo={DOMAIN_INFO[DOMAIN_MAP[currentStep]]}
                            questions={questions.filter(
                                (q) => q.domain === DOMAIN_MAP[currentStep],
                            )}
                            answers={data.answers}
                            setAnswer={setAnswer}
                            toggleArrayItem={toggleArrayItem}
                            subStep={subStep}
                        />
                    )}
                </div>

                {/* Navigation Footer */}
                <div className="shrink-0 border-t border-secondary bg-primary px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
                    <div className="flex justify-between">
                        {(currentStep > 1 || subStep > 0) ? (
                            <Button
                                color="secondary"
                                size="lg"
                                onClick={handleBack}
                                isDisabled={saving}
                            >
                                ← Back
                            </Button>
                        ) : (
                            <div />
                        )}
                        <div className="flex items-center gap-3">
                            {showIncompleteHint && isDomainStep && (
                                <p className="text-sm text-warning-primary">
                                    Please answer all questions before continuing.
                                </p>
                            )}
                            <Button
                                color="primary"
                                size="lg"
                                isLoading={saving}
                                isDisabled={isDomainStep && !allCurrentQuestionsAnswered}
                                onClick={() => void handleNext()}
                            >
                                {currentStep === STEPS.length && subStep >= totalKloes - 1
                                    ? "See Results"
                                    : isDomainStep && subStep < totalKloes - 1
                                      ? "Next section"
                                      : "Save and continue"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
