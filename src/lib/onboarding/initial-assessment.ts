/** Initial onboarding self-assessment: one question per CQC domain (DB keys use `well_led`). */

export const ONBOARDING_DOMAIN_DB_KEYS = ["safe", "effective", "caring", "responsive", "well_led"] as const;
export type OnboardingDomainDb = (typeof ONBOARDING_DOMAIN_DB_KEYS)[number];

export type OnboardingAnswerId = "yes" | "no" | "partial" | "unsure";

/** Maps answers to 0–100 scores for the domain (used in `domain_results` for score-engine). */
export const ANSWER_SCORE: Record<OnboardingAnswerId, number> = {
    yes: 92,
    partial: 62,
    unsure: 48,
    no: 18,
};

export const ONBOARDING_QUESTIONS: Array<{
    domain: OnboardingDomainDb;
    id: string;
    text: string;
    info: string;
}> = [
    {
        domain: "safe",
        id: "onb_safe",
        text: "Do you have a written safeguarding policy that is reviewed at least annually?",
        info: "Safeguarding is a fundamental standard (Reg 13). CQC inspectors will ask to see your policy and evidence of staff training.",
    },
    {
        domain: "effective",
        id: "onb_effective",
        text: "Do you assess needs and deliver care that is evidence-based and regularly reviewed?",
        info: "Effective care requires clear assessment, care planning, and monitoring (Regulation 9).",
    },
    {
        domain: "caring",
        id: "onb_caring",
        text: "Do staff treat people with kindness, dignity, and respect day to day?",
        info: "The Caring domain focuses on compassion, privacy, and involvement (Regulation 10).",
    },
    {
        domain: "responsive",
        id: "onb_responsive",
        text: "Are complaints and concerns handled promptly, fairly, and learned from?",
        info: "Responsive services adapt to individual needs and manage complaints openly (Regulation 16).",
    },
    {
        domain: "well_led",
        id: "onb_well_led",
        text: "Is there visible leadership, governance, and a culture of safety and learning?",
        info: "Well-led providers have clear accountability, oversight, and improvement cycles (Regulation 17).",
    },
];

/** UI label order (slug uses hyphen for Well-Led). */
export const ONBOARDING_DOMAIN_UI = [
    { db: "safe" as const, slug: "safe", label: "Safe" },
    { db: "effective" as const, slug: "effective", label: "Effective" },
    { db: "caring" as const, slug: "caring", label: "Caring" },
    { db: "responsive" as const, slug: "responsive", label: "Responsive" },
    { db: "well_led" as const, slug: "well-led", label: "Well-Led" },
];

export function normalizeOnboardingAnswer(v: string | undefined): OnboardingAnswerId | null {
    if (v === "yes" || v === "no" || v === "partial" || v === "unsure") return v;
    return null;
}

/** Per-domain score 0–100 and implied gap counts for assessment summary. */
export function scoreOnboardingAnswers(answers: Record<string, string>): {
    domainResults: Record<string, { score: number; answer: string }>;
    rawAverage: number;
    gapSummary: { critical: number; high: number; medium: number; low: number };
} {
    const domainResults: Record<string, { score: number; answer: string }> = {};
    let sum = 0;
    let n = 0;
    const gapSummary = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const q of ONBOARDING_QUESTIONS) {
        const raw = answers[q.id];
        const a = normalizeOnboardingAnswer(raw) ?? "unsure";
        const score = ANSWER_SCORE[a];
        domainResults[q.domain] = { score, answer: a };
        sum += score;
        n += 1;
        if (a === "no") {
            gapSummary.critical += 1;
            gapSummary.high += 1;
        } else if (a === "partial") {
            gapSummary.high += 1;
            gapSummary.medium += 1;
        } else if (a === "unsure") {
            gapSummary.medium += 1;
            gapSummary.low += 1;
        }
    }

    return {
        domainResults,
        rawAverage: n === 0 ? 0 : Math.round(sum / n),
        gapSummary,
    };
}
