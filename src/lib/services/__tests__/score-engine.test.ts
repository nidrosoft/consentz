import { describe, it, expect } from "vitest";

import {
  calculateDomainScore,
  scoreToRating,
  calculateOverallScore,
  determineOverallRating,
  calculateTimeToGood,
  scoreAnswer,
  type CqcRatingType,
} from "../score-engine";

describe("scoreToRating", () => {
  it("returns OUTSTANDING for score >= 88", () => {
    expect(scoreToRating(88)).toBe("OUTSTANDING");
    expect(scoreToRating(100)).toBe("OUTSTANDING");
  });

  it("returns GOOD for score >= 63 and < 88", () => {
    expect(scoreToRating(63)).toBe("GOOD");
    expect(scoreToRating(87)).toBe("GOOD");
  });

  it("returns REQUIRES_IMPROVEMENT for score >= 39 and < 63", () => {
    expect(scoreToRating(39)).toBe("REQUIRES_IMPROVEMENT");
    expect(scoreToRating(62)).toBe("REQUIRES_IMPROVEMENT");
  });

  it("returns INADEQUATE for score < 39", () => {
    expect(scoreToRating(38)).toBe("INADEQUATE");
    expect(scoreToRating(0)).toBe("INADEQUATE");
  });
});

describe("calculateDomainScore", () => {
  const baseInputs = {
    assessmentScore: 80,
    evidenceCoverage: 70,
    consentzMetrics: {
      consentCompletionRate: 85,
      staffCompetencyRate: 80,
      incidentResolutionRate: 75,
      safetyChecklistScore: 70,
      patientFeedbackAvg: 80,
      policyAckRate: 90,
    },
    taskCompletionRate: 75,
    overdueCriticalItems: 0,
  };

  it("returns a score between 0 and 100", () => {
    const score = calculateDomainScore("safe", baseInputs);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("deducts 3 points per overdue critical item", () => {
    const noOverdue = calculateDomainScore("safe", baseInputs);
    const twoOverdue = calculateDomainScore("safe", { ...baseInputs, overdueCriticalItems: 2 });
    expect(noOverdue - twoOverdue).toBe(6);
  });

  it("clamps score to 0 minimum", () => {
    const score = calculateDomainScore("safe", { ...baseInputs, overdueCriticalItems: 50 });
    expect(score).toBe(0);
  });
});

describe("calculateOverallScore", () => {
  it("returns average of domain scores", () => {
    const result = calculateOverallScore([{ score: 80 }, { score: 60 }, { score: 70 }]);
    expect(result).toBe(70);
  });

  it("returns 0 for empty array", () => {
    expect(calculateOverallScore([])).toBe(0);
  });
});

describe("determineOverallRating", () => {
  function domains(ratings: CqcRatingType[]) {
    return ratings.map((r, i) => ({ domain: `d${i}`, score: 80, rating: r }));
  }

  it("returns OUTSTANDING when 2+ domains are Outstanding and rest are Good", () => {
    expect(determineOverallRating(
      domains(["OUTSTANDING", "OUTSTANDING", "GOOD", "GOOD", "GOOD"]),
      false,
    )).toBe("OUTSTANDING");
  });

  it("returns GOOD when all domains are Good", () => {
    expect(determineOverallRating(
      domains(["GOOD", "GOOD", "GOOD", "GOOD", "GOOD"]),
      false,
    )).toBe("GOOD");
  });

  it("returns RI when 2+ domains are RI", () => {
    expect(determineOverallRating(
      domains(["REQUIRES_IMPROVEMENT", "REQUIRES_IMPROVEMENT", "GOOD", "GOOD", "GOOD"]),
      false,
    )).toBe("REQUIRES_IMPROVEMENT");
  });

  it("returns INADEQUATE when 2+ domains are Inadequate", () => {
    expect(determineOverallRating(
      domains(["INADEQUATE", "INADEQUATE", "GOOD", "GOOD", "GOOD"]),
      false,
    )).toBe("INADEQUATE");
  });

  it("returns RI when any domain is Inadequate but fewer than 2", () => {
    expect(determineOverallRating(
      domains(["INADEQUATE", "GOOD", "GOOD", "GOOD", "GOOD"]),
      false,
    )).toBe("REQUIRES_IMPROVEMENT");
  });

  it("returns RI when hasCriticalGap even if all Good", () => {
    expect(determineOverallRating(
      domains(["GOOD", "GOOD", "GOOD", "GOOD", "GOOD"]),
      true,
    )).toBe("REQUIRES_IMPROVEMENT");
  });

  it("allows compensation for single RI domain at >=55%", () => {
    const d = [
      { domain: "safe", score: 56, rating: "REQUIRES_IMPROVEMENT" as CqcRatingType },
      { domain: "effective", score: 80, rating: "GOOD" as CqcRatingType },
      { domain: "caring", score: 80, rating: "GOOD" as CqcRatingType },
      { domain: "responsive", score: 80, rating: "GOOD" as CqcRatingType },
      { domain: "well_led", score: 80, rating: "GOOD" as CqcRatingType },
    ];
    expect(determineOverallRating(d, false)).toBe("GOOD");
  });

  it("does not compensate single RI domain below 55%", () => {
    const d = [
      { domain: "safe", score: 40, rating: "REQUIRES_IMPROVEMENT" as CqcRatingType },
      { domain: "effective", score: 80, rating: "GOOD" as CqcRatingType },
      { domain: "caring", score: 80, rating: "GOOD" as CqcRatingType },
      { domain: "responsive", score: 80, rating: "GOOD" as CqcRatingType },
      { domain: "well_led", score: 80, rating: "GOOD" as CqcRatingType },
    ];
    expect(determineOverallRating(d, false)).toBe("REQUIRES_IMPROVEMENT");
  });
});

describe("calculateTimeToGood", () => {
  it("returns null when all domains are Good+", () => {
    const d = [{ rating: "GOOD" as CqcRatingType }, { rating: "OUTSTANDING" as CqcRatingType }];
    expect(calculateTimeToGood(d, [])).toBeNull();
  });

  it("returns at least 14 days even for a single gap", () => {
    const d = [{ rating: "REQUIRES_IMPROVEMENT" as CqcRatingType }];
    expect(calculateTimeToGood(d, [{ severity: "LOW" }])).toBe(14);
  });

  it("sums days by severity", () => {
    const d = [{ rating: "REQUIRES_IMPROVEMENT" as CqcRatingType }];
    const gaps = [
      { severity: "CRITICAL" },
      { severity: "HIGH" },
      { severity: "MEDIUM" },
    ];
    expect(calculateTimeToGood(d, gaps)).toBe(3 + 14 + 30);
  });
});

describe("scoreAnswer", () => {
  it("scores yes_no_partial correctly", () => {
    const question = {
      id: "TEST_Q1", domain: "SAFE" as const, kloeCode: "S1",
      regulationCodes: ["REG13"], step: 3 as const,
      text: "Test?", answerType: "yes_no_partial" as const,
      serviceTypes: ["AESTHETIC_CLINIC" as const],
      scoring: { maxPoints: 10, scoringMap: { yes: 10, partial: 5, no: 0, unsure: 2 } },
      weight: 1.5,
      gapTrigger: {
        triggerValues: ["no", "unsure"],
        severity: "CRITICAL" as const,
        gapTitle: "Test gap",
        gapDescription: "Test",
        remediationHint: "Fix it",
        linkedRegulations: ["REG13"],
      },
    };

    const yes = scoreAnswer(question, "yes");
    expect(yes.score).toBe(15);
    expect(yes.maxScore).toBe(15);
    expect(yes.createsGap).toBe(false);

    const no = scoreAnswer(question, "no");
    expect(no.score).toBe(0);
    expect(no.createsGap).toBe(true);
    expect(no.gapSeverity).toBe("CRITICAL");
  });
});
