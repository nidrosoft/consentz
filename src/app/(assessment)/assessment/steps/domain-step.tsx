"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { cx } from "@/utils/cx";
import type { AssessmentQuestion } from "@/lib/constants/assessment-questions";

// KLOE title map
const KLOE_TITLES: Record<string, string> = {
    S1: "Safeguarding",
    S2: "Risk Assessment",
    S3: "Staffing",
    S4: "Medicines Management",
    S5: "Infection Control",
    S6: "Learning from Incidents",
    E1: "Needs Assessment & Care",
    E2: "Staff Skills & Knowledge",
    E3: "Nutrition & Hydration",
    E4: "Multi-Disciplinary Working",
    E5: "Healthy Living",
    E6: "Premises & Equipment",
    E7: "Consent",
    C1: "Kindness & Compassion",
    C2: "Involvement in Decisions",
    C3: "Privacy & Dignity",
    R1: "Personalised Care",
    R2: "Complaints",
    R3: "End of Life Care",
    W1: "Vision & Strategy",
    W2: "Governance",
    W3: "Culture",
    W4: "Roles & Accountability",
    W5: "Continuous Improvement",
    W6: "Information Management",
};

// ─── Answer option definitions ───────────────────────────────────────────────

const YES_NO_PARTIAL_OPTIONS = [
    { id: "yes", label: "Yes, current", desc: "Policy or process is up to date and in active use" },
    { id: "partial", label: "Partially", desc: "Exists but may be incomplete or requires updating" },
    { id: "no", label: "No / Outdated", desc: "Not in place or significantly out of date", badge: "Risk" },
    { id: "unsure", label: "Not sure", desc: "Need to investigate the current status" },
];

const YES_NO_OPTIONS = [
    { id: "yes", label: "Yes", desc: "This is in place and current" },
    { id: "no", label: "No", desc: "This is not in place", badge: "Risk" },
];

const SCALE_OPTIONS = [
    { id: "1", label: "1 — Not at all", desc: "No evidence of this being in place" },
    { id: "2", label: "2 — Slightly", desc: "Minimal evidence or very early stages" },
    { id: "3", label: "3 — Moderately", desc: "Some progress but significant gaps remain" },
    { id: "4", label: "4 — Mostly", desc: "Largely in place with minor improvements needed" },
    { id: "5", label: "5 — Completely", desc: "Fully embedded and demonstrable" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KloeGroup {
    kloe: string;
    title: string;
    questions: AssessmentQuestion[];
}

export function groupByKloe(questions: AssessmentQuestion[]): KloeGroup[] {
    const groups: KloeGroup[] = [];
    let currentKloe = "";
    for (const q of questions) {
        if (q.kloeCode !== currentKloe) {
            currentKloe = q.kloeCode;
            groups.push({
                kloe: currentKloe,
                title: KLOE_TITLES[currentKloe] || currentKloe,
                questions: [],
            });
        }
        groups[groups.length - 1].questions.push(q);
    }
    return groups;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface DomainStepProps {
    domainKey: string;
    domainInfo: { title: string; desc: string };
    questions: AssessmentQuestion[];
    answers: Record<string, string>;
    setAnswer: (questionId: string, value: string) => void;
    toggleArrayItem: (questionId: string, item: string) => void;
    subStep: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DomainStep({
    domainInfo,
    questions,
    answers,
    setAnswer,
    toggleArrayItem,
    subStep,
}: DomainStepProps) {
    const kloeGroups = useMemo(() => groupByKloe(questions), [questions]);

    const group = kloeGroups[subStep];
    if (!group) return null;

    const answeredCount = group.questions.filter((q) => !!answers[q.id]).length;

    return (
        <div className="space-y-8">
            {/* Domain info box — only shown on first sub-step */}
            {subStep === 0 && (
                <div className="rounded-xl border border-brand-200 bg-brand-primary p-4">
                    <p className="text-sm font-medium text-brand-secondary">{domainInfo.title}</p>
                    <p className="mt-1 text-sm text-brand-secondary">{domainInfo.desc}</p>
                </div>
            )}

            {/* Section progress pills */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-tertiary">
                        Section {subStep + 1} of {kloeGroups.length}
                    </p>
                    <p className="text-sm text-tertiary">
                        {answeredCount} of {group.questions.length} answered
                    </p>
                </div>
                <div className="flex gap-1.5">
                    {kloeGroups.map((g, i) => {
                        const allAnswered = g.questions.every((q) => !!answers[q.id]);
                        const isVisited = i < subStep;
                        const isActive = i === subStep;
                        return (
                            <div
                                key={g.kloe}
                                className={cx(
                                    "h-1.5 flex-1 rounded-full transition-colors",
                                    allAnswered || isVisited
                                        ? "bg-brand-solid"
                                        : isActive
                                          ? "bg-brand-secondary"
                                          : "bg-quaternary",
                                )}
                            />
                        );
                    })}
                </div>
            </div>

            {/* KLOE section header */}
            <div>
                <p className="text-md font-semibold text-primary">
                    {group.kloe}: {group.title}
                </p>
            </div>

            {/* Questions for this KLOE only */}
            <div className="space-y-6">
                {group.questions.map((q) => (
                    <QuestionBlock
                        key={q.id}
                        question={q}
                        answer={answers[q.id] || ""}
                        setAnswer={setAnswer}
                        toggleArrayItem={toggleArrayItem}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Individual question block ───────────────────────────────────────────────

function QuestionBlock({
    question,
    answer,
    setAnswer,
    toggleArrayItem,
}: {
    question: AssessmentQuestion;
    answer: string;
    setAnswer: (questionId: string, value: string) => void;
    toggleArrayItem: (questionId: string, item: string) => void;
}) {
    return (
        <div className="space-y-3">
            {/* Question label */}
            <div>
                <p className="text-md font-semibold text-primary">{question.text}</p>
                {question.helpText && (
                    <p className="mt-1 text-sm text-tertiary">{question.helpText}</p>
                )}
            </div>

            {/* Answer cards */}
            {question.answerType === "yes_no_partial" && (
                <SingleSelectCards
                    options={YES_NO_PARTIAL_OPTIONS}
                    selected={answer}
                    onSelect={(v) => setAnswer(question.id, v)}
                />
            )}
            {question.answerType === "yes_no" && (
                <SingleSelectCards
                    options={YES_NO_OPTIONS}
                    selected={answer}
                    onSelect={(v) => setAnswer(question.id, v)}
                />
            )}
            {question.answerType === "scale" && (
                <SingleSelectCards
                    options={SCALE_OPTIONS}
                    selected={answer}
                    onSelect={(v) => setAnswer(question.id, v)}
                />
            )}
            {question.answerType === "multi_select" && question.options && (
                <MultiSelectCards
                    options={question.options.map((o) => ({
                        id: o.value,
                        label: o.label,
                        desc: "",
                    }))}
                    selected={answer ? JSON.parse(answer) : []}
                    onToggle={(item) => toggleArrayItem(question.id, item)}
                />
            )}
        </div>
    );
}

// ─── Pattern 3: Selectable Card (Single Select) ─────────────────────────────

function SingleSelectCards({
    options,
    selected,
    onSelect,
}: {
    options: { id: string; label: string; desc: string; badge?: string }[];
    selected: string;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {options.map((opt) => {
                const isSelected = selected === opt.id;
                return (
                    <label
                        key={opt.id}
                        className={cx(
                            "flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors",
                            isSelected
                                ? "border-brand-solid bg-brand-primary"
                                : "border-secondary bg-primary hover:bg-secondary",
                        )}
                    >
                        <Checkbox
                            isSelected={isSelected}
                            onChange={() => onSelect(opt.id)}
                        />
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <p
                                    className={cx(
                                        "font-semibold",
                                        isSelected ? "text-primary_on-brand" : "text-primary",
                                    )}
                                >
                                    {opt.label}
                                </p>
                                {opt.badge && (
                                    <span className="rounded-full bg-error-100 px-2 py-0.5 text-xs font-medium text-error-700">
                                        {opt.badge}
                                    </span>
                                )}
                            </div>
                            <p
                                className={cx(
                                    "mt-1 text-sm",
                                    isSelected ? "text-secondary_on-brand" : "text-tertiary",
                                )}
                            >
                                {opt.desc}
                            </p>
                        </div>
                    </label>
                );
            })}
        </div>
    );
}

// ─── Pattern 3: Selectable Card (Multi-Select) ──────────────────────────────

function MultiSelectCards({
    options,
    selected,
    onToggle,
}: {
    options: { id: string; label: string; desc: string }[];
    selected: string[];
    onToggle: (id: string) => void;
}) {
    return (
        <div className="space-y-3">
            {options.map((opt) => {
                const isSelected = selected.includes(opt.id);
                return (
                    <label
                        key={opt.id}
                        className={cx(
                            "flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors",
                            isSelected
                                ? "border-brand-solid bg-brand-primary"
                                : "border-secondary bg-primary hover:bg-secondary",
                        )}
                    >
                        <Checkbox
                            isSelected={isSelected}
                            onChange={() => onToggle(opt.id)}
                        />
                        <div>
                            <p
                                className={cx(
                                    "font-semibold",
                                    isSelected ? "text-primary_on-brand" : "text-primary",
                                )}
                            >
                                {opt.label}
                            </p>
                            {opt.desc && (
                                <p
                                    className={cx(
                                        "mt-1 text-sm",
                                        isSelected ? "text-secondary_on-brand" : "text-tertiary",
                                    )}
                                >
                                    {opt.desc}
                                </p>
                            )}
                        </div>
                    </label>
                );
            })}
        </div>
    );
}
