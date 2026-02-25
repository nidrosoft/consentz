"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { cx } from "@/utils/cx";
import { ShieldTick, Target02, Heart, Zap, Trophy01 } from "@untitledui/icons";

// ─── Step 2: Organization Details ────────────────────────────────────────────
function OrganizationStep() {
    const router = useRouter();
    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-display-xs font-semibold text-primary">Tell us about your organization</h1>
                <p className="text-md text-tertiary">We&apos;ll use this to personalise your compliance requirements.</p>
            </div>
            <div className="flex flex-col gap-5">
                <Input label="Organization name" placeholder="Brightwood Care Home" isRequired />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="CQC Provider ID" placeholder="1-123456789" hint="Optional — found on CQC website" />
                    <Input label="CQC Location ID" placeholder="1-987654321" hint="Optional" />
                </div>
                <Input label="Registered Manager name" placeholder="Jane Smith" />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Postcode" placeholder="SW1A 1AA" isRequired />
                    <Input label="Number of beds / rooms" placeholder="35" type="number" isRequired />
                </div>
                <Select label="Current CQC rating (if known)" placeholder="Select...">
                    {["Not yet rated", "Outstanding", "Good", "Requires Improvement", "Inadequate"].map((r) => (
                        <Select.Item key={r} id={r}>{r}</Select.Item>
                    ))}
                </Select>
                <Input label="Last inspection date (if known)" type="date" />
            </div>
            <div className="flex justify-between">
                <Button color="secondary" size="lg" onClick={() => router.push("/welcome")}>&larr; Back</Button>
                <Button color="primary" size="lg" onClick={() => router.push("/assessment/3")}>Continue &rarr;</Button>
            </div>
        </div>
    );
}

// ─── Step 3: Assessment Questions ────────────────────────────────────────────
const DOMAINS = [
    { id: "safe", label: "Safe", Icon: ShieldTick, color: "text-blue-500" },
    { id: "effective", label: "Effective", Icon: Target02, color: "text-violet-500" },
    { id: "caring", label: "Caring", Icon: Heart, color: "text-pink-500" },
    { id: "responsive", label: "Responsive", Icon: Zap, color: "text-amber-500" },
    { id: "well-led", label: "Well-Led", Icon: Trophy01, color: "text-emerald-500" },
];

const MOCK_QUESTIONS = [
    { id: "S1", text: "Do you have a written safeguarding policy that is reviewed at least annually?", info: "Safeguarding is a fundamental standard (Reg 13). CQC inspectors will ask to see your policy and evidence of staff training." },
    { id: "S2", text: "Do you carry out individual risk assessments for all service users?", info: "Risk assessments must be person-centred and regularly reviewed (Reg 12)." },
    { id: "S3", text: "Are DBS checks completed and current for all staff before they start?", info: "Robust recruitment processes are required under Reg 19. DBS checks are a minimum requirement." },
    { id: "S4", text: "Do you have a medicines management policy with regular audits?", info: "Medicines must be managed safely. Regular audits demonstrate ongoing compliance (Reg 12)." },
    { id: "S5", text: "Is there an up-to-date infection prevention and control policy in place?", info: "Infection control is critical. CQC will review your IPC procedures and training records (Reg 12)." },
];

const ANSWER_OPTIONS = [
    { id: "yes", label: "Yes, current", color: "border-success-600 bg-success-primary text-success-primary" },
    { id: "no", label: "No / Outdated", color: "border-error-600 bg-error-primary text-error-primary" },
    { id: "partial", label: "Partially", color: "border-warning-600 bg-warning-primary text-warning-primary" },
    { id: "unsure", label: "Not sure", color: "border-secondary bg-tertiary text-quaternary" },
];

function AssessmentStep() {
    const router = useRouter();
    const [activeDomain, setActiveDomain] = useState(0);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const question = MOCK_QUESTIONS[currentQ];
    const selectedAnswer = answers[question.id];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-display-xs font-semibold text-primary">Compliance Assessment</h1>
                <p className="text-md text-tertiary">Answer honestly — this determines your starting position.</p>
            </div>

            {/* Domain tabs */}
            <div className="flex gap-1 overflow-x-auto rounded-xl border border-secondary bg-secondary p-1">
                {DOMAINS.map((d, i) => (
                    <button
                        key={d.id}
                        onClick={() => { setActiveDomain(i); setCurrentQ(0); }}
                        className={cx(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition duration-100 whitespace-nowrap",
                            i === activeDomain ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
                        )}
                    >
                        <d.Icon className={cx("size-4", d.color)} />
                        {d.label}
                        {i < activeDomain && <span className="text-success-primary">✓</span>}
                    </button>
                ))}
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-secondary">
                    {DOMAINS[activeDomain].label} — Question {currentQ + 1} of {MOCK_QUESTIONS.length}
                </span>
                <ProgressBarBase value={currentQ + 1} min={0} max={MOCK_QUESTIONS.length} className="flex-1" />
            </div>

            {/* Question card */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <p className="mb-6 text-lg font-medium text-primary">{question.text}</p>
                <div className="grid grid-cols-2 gap-3">
                    {ANSWER_OPTIONS.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setAnswers({ ...answers, [question.id]: opt.id })}
                            className={cx(
                                "rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition duration-100",
                                selectedAnswer === opt.id ? opt.color : "border-secondary bg-primary text-secondary hover:border-brand-300",
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Why this matters */}
            <div className="rounded-xl border border-brand-200 bg-brand-primary p-4">
                <p className="text-sm font-medium text-brand-secondary">Why this matters</p>
                <p className="mt-1 text-sm text-tertiary">{question.info}</p>
            </div>

            {/* Nav */}
            <div className="flex justify-between">
                <Button
                    color="secondary"
                    size="lg"
                    onClick={() => {
                        if (currentQ > 0) setCurrentQ(currentQ - 1);
                        else router.push("/assessment/2");
                    }}
                >
                    &larr; Previous
                </Button>
                <Button
                    color="primary"
                    size="lg"
                    isDisabled={!selectedAnswer}
                    onClick={() => {
                        if (currentQ < MOCK_QUESTIONS.length - 1) setCurrentQ(currentQ + 1);
                        else router.push("/assessment/results");
                    }}
                >
                    {currentQ < MOCK_QUESTIONS.length - 1 ? "Next Question →" : "See Results →"}
                </Button>
            </div>
        </div>
    );
}

// ─── Page Router ─────────────────────────────────────────────────────────────
export default function AssessmentStepPage() {
    const params = useParams();
    const step = params.step as string;

    if (step === "2") return <OrganizationStep />;
    if (step === "3") return <AssessmentStep />;

    return <OrganizationStep />;
}
