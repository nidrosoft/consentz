"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { cx } from "@/utils/cx";
import {
  ShieldTick,
  Target02,
  Heart,
  Zap,
  Trophy01,
  ChevronLeft,
  ChevronRight,
} from "@untitledui/icons";
import {
  getQuestionsForServiceType,
  type AssessmentQuestion,
  type CqcDomainType,
  type ServiceType,
} from "@/lib/constants/assessment-questions";
import { apiGet, apiPost } from "@/lib/api-client";

const DOMAIN_ORDER: CqcDomainType[] = ["SAFE", "EFFECTIVE", "CARING", "RESPONSIVE", "WELL_LED"];

const DOMAIN_TO_SLUG: Record<CqcDomainType, "safe" | "effective" | "caring" | "responsive" | "well-led"> = {
  SAFE: "safe",
  EFFECTIVE: "effective",
  CARING: "caring",
  RESPONSIVE: "responsive",
  WELL_LED: "well-led",
};

const DOMAIN_META: Record<CqcDomainType, { label: string; icon: typeof ShieldTick }> = {
  SAFE: { label: "Safe", icon: ShieldTick },
  EFFECTIVE: { label: "Effective", icon: Target02 },
  CARING: { label: "Caring", icon: Heart },
  RESPONSIVE: { label: "Responsive", icon: Zap },
  WELL_LED: { label: "Well-Led", icon: Trophy01 },
};

const DEFAULT_OPTIONS: { value: string; label: string; points: number }[] = [
  { value: "yes", label: "Yes", points: 0 },
  { value: "partial", label: "Partially", points: 0 },
  { value: "no", label: "No", points: 0 },
  { value: "unsure", label: "Not sure", points: 0 },
];

const OPTION_COLORS: Record<string, string> = {
  yes: "border-success-600 bg-success-primary text-success-primary",
  partial: "border-warning-600 bg-warning-primary text-warning-primary",
  no: "border-error-600 bg-error-primary text-error-primary",
  unsure: "border-secondary bg-tertiary text-quaternary",
};

function saveAnswerTypeForQuestion(
  q: AssessmentQuestion,
): "yes_no" | "yes_no_partial" | "multi_select" | "scale" | "date" | "text" {
  switch (q.answerType) {
    case "yes_no":
      return "yes_no";
    case "yes_no_partial":
      return "yes_no_partial";
    case "multi_select":
      return "multi_select";
    case "scale":
      return "scale";
    case "date":
      return "date";
    case "text":
    case "number":
      return "text";
    default:
      return "yes_no_partial";
  }
}

function questionHasAnswer(q: AssessmentQuestion, answers: Record<string, unknown>): boolean {
  const v = answers[q.id];
  if (v === undefined || v === null) return false;
  if (q.answerType === "multi_select") return Array.isArray(v) && v.length > 0;
  if (q.answerType === "scale") return typeof v === "number" && !Number.isNaN(v);
  return typeof v === "string" && v.length > 0;
}

function getOptionsForQuestion(q: AssessmentQuestion) {
  if (q.answerType === "yes_no") {
    return [
      { value: "yes", label: "Yes", points: 0 },
      { value: "no", label: "No", points: 0 },
    ];
  }
  return q.options?.length ? q.options : DEFAULT_OPTIONS;
}

export default function ReAssessmentPage() {
  const router = useRouter();
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [loadError, setLoadError] = useState("");
  const [activeDomainIdx, setActiveDomainIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiGet<{ serviceType: ServiceType }>("/api/organization");
        if (!cancelled) setServiceType(data.serviceType);
      } catch {
        if (!cancelled) setLoadError("Could not load organisation.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bank = useMemo(
    () => (serviceType ? getQuestionsForServiceType(serviceType) : []),
    [serviceType],
  );

  const questionsByDomain = useMemo(() => {
    const grouped: Record<CqcDomainType, AssessmentQuestion[]> = {
      SAFE: [],
      EFFECTIVE: [],
      CARING: [],
      RESPONSIVE: [],
      WELL_LED: [],
    };
    for (const q of bank) {
      grouped[q.domain].push(q);
    }
    return grouped;
  }, [bank]);

  const activeDomains = useMemo(
    () => DOMAIN_ORDER.filter((d) => questionsByDomain[d].length > 0),
    [questionsByDomain],
  );

  const activeDomain = activeDomains[activeDomainIdx];
  const domainQuestions = activeDomain ? questionsByDomain[activeDomain] : [];
  const currentQuestion = domainQuestions[activeQuestionIdx];
  const totalQuestions = bank.length;
  const answeredCount = bank.filter((q) => questionHasAnswer(q, answers)).length;

  function handleScalarAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function goNextQuestion() {
    if (activeQuestionIdx < domainQuestions.length - 1) {
      setActiveQuestionIdx(activeQuestionIdx + 1);
    } else if (activeDomainIdx < activeDomains.length - 1) {
      setActiveDomainIdx(activeDomainIdx + 1);
      setActiveQuestionIdx(0);
    }
  }

  function goPrevQuestion() {
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx(activeQuestionIdx - 1);
    } else if (activeDomainIdx > 0) {
      const prevDomain = activeDomains[activeDomainIdx - 1]!;
      setActiveDomainIdx(activeDomainIdx - 1);
      setActiveQuestionIdx(questionsByDomain[prevDomain].length - 1);
    }
  }

  const isLastQuestion =
    activeDomainIdx === activeDomains.length - 1 && activeQuestionIdx === domainQuestions.length - 1;
  const isFirstQuestion = activeDomainIdx === 0 && activeQuestionIdx === 0;

  async function handleSubmit() {
    if (!serviceType) return;
    if (answeredCount < totalQuestions) {
      setError(`Please answer all ${totalQuestions} questions. ${totalQuestions - answeredCount} remaining.`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payloadAnswers = bank.map((q) => {
        const raw = answers[q.id];
        let answerValue: string | number | string[] | boolean;
        if (q.answerType === "multi_select") {
          answerValue = Array.isArray(raw) ? raw : [];
        } else if (q.answerType === "scale") {
          answerValue = typeof raw === "number" ? raw : Number(raw);
        } else {
          answerValue = typeof raw === "string" ? raw : String(raw);
        }
        return {
          questionId: q.id,
          questionText: q.text,
          step: 3,
          domain: DOMAIN_TO_SLUG[q.domain],
          kloeCode: q.kloeCode,
          answerValue,
          answerType: saveAnswerTypeForQuestion(q),
        };
      });

      const saved = await apiPost<{ id: string }>("/api/assessment", {
        serviceType,
        currentStep: 3,
        answers: payloadAnswers,
      });
      await apiPost("/api/assessment/calculate", { assessmentId: saved.data.id });
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit assessment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-error-primary">{loadError}</p>
        <Button className="mt-4" color="secondary" onClick={() => router.push("/")}>
          Back
        </Button>
      </div>
    );
  }

  if (!serviceType || !currentQuestion || activeDomains.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-tertiary text-sm">{!serviceType ? "Loading…" : "No questions for your service type."}</p>
      </div>
    );
  }

  const options = getOptionsForQuestion(currentQuestion);
  const DomainIcon = DOMAIN_META[activeDomain].icon;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-display-xs text-primary font-semibold">Full Compliance Assessment</h1>
          <p className="text-tertiary mt-1 text-sm">
            {answeredCount} of {totalQuestions} questions answered
          </p>
        </div>
        <Button color="secondary" size="sm" onClick={() => router.push("/")}>
          Cancel
        </Button>
      </div>

      <ProgressBarBase value={answeredCount} min={0} max={Math.max(totalQuestions, 1)} className="mb-6" />

      {error && (
        <p className="text-error-primary mb-4 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="border-secondary bg-secondary mb-4 flex flex-wrap gap-1 rounded-xl border p-1">
        {activeDomains.map((domain, i) => {
          const meta = DOMAIN_META[domain];
          const Icon = meta.icon;
          const doneCount = questionsByDomain[domain].filter((q) => questionHasAnswer(q, answers)).length;
          const totalInDomain = questionsByDomain[domain].length;
          return (
            <button
              key={domain}
              type="button"
              onClick={() => {
                setActiveDomainIdx(i);
                setActiveQuestionIdx(0);
              }}
              className={cx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition duration-100 whitespace-nowrap",
                i === activeDomainIdx ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
              )}
            >
              <Icon className="size-4" />
              {meta.label}
              <span className="text-tertiary text-xs">
                ({doneCount}/{totalInDomain})
              </span>
            </button>
          );
        })}
      </div>

      <div className="text-tertiary mb-2 text-sm">
        <DomainIcon className="text-fg-secondary mr-1 inline size-4" />
        {DOMAIN_META[activeDomain].label} — Question {activeQuestionIdx + 1} of {domainQuestions.length}
      </div>

      <div className="border-secondary bg-primary rounded-xl border p-6">
        <p className="text-brand-secondary mb-1 text-xs font-medium">
          {currentQuestion.kloeCode} · {currentQuestion.regulationCodes.join(", ")}
        </p>
        <p className="text-primary mb-6 text-base font-medium">{currentQuestion.text}</p>
        {currentQuestion.helpText && <p className="text-tertiary mb-4 text-sm">{currentQuestion.helpText}</p>}

        {currentQuestion.answerType === "multi_select" && currentQuestion.options ? (
          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((opt) => (
              <Checkbox
                key={opt.value}
                label={opt.label}
                isSelected={((answers[currentQuestion.id] as string[] | undefined) ?? []).includes(opt.value)}
                onChange={(selected) => {
                  const qid = currentQuestion.id;
                  setAnswers((prev) => {
                    const cur = (prev[qid] as string[] | undefined) ?? [];
                    if (selected) {
                      if (cur.includes(opt.value)) return prev;
                      return { ...prev, [qid]: [...cur, opt.value] };
                    }
                    return { ...prev, [qid]: cur.filter((x) => x !== opt.value) };
                  });
                }}
              />
            ))}
          </div>
        ) : currentQuestion.answerType === "scale" ? (
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {(["1", "2", "3", "4", "5"] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: Number.parseInt(n, 10) }))}
                className={cx(
                  "rounded-lg border-2 px-2 py-3 text-center text-sm font-medium transition duration-100 sm:px-4",
                  answers[currentQuestion.id] === Number.parseInt(n, 10)
                    ? "border-brand-600 bg-brand-primary text-brand-primary"
                    : "border-secondary bg-primary text-secondary hover:border-brand-300",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleScalarAnswer(currentQuestion.id, opt.value)}
                className={cx(
                  "rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition duration-100",
                  answers[currentQuestion.id] === opt.value
                    ? OPTION_COLORS[opt.value] ||
                      "border-brand-600 bg-brand-primary text-brand-primary"
                    : "border-secondary bg-primary text-secondary hover:border-brand-300",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <Button
          color="secondary"
          size="lg"
          iconLeading={ChevronLeft}
          isDisabled={isFirstQuestion}
          onClick={goPrevQuestion}
        >
          Previous
        </Button>
        {isLastQuestion ? (
          <Button color="primary" size="lg" isLoading={submitting} onClick={handleSubmit}>
            Submit Assessment
          </Button>
        ) : (
          <Button
            color="primary"
            size="lg"
            iconTrailing={ChevronRight}
            isDisabled={!questionHasAnswer(currentQuestion, answers)}
            onClick={goNextQuestion}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
