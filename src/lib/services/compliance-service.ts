// =============================================================================
// Compliance Service — Score management and recalculation
// =============================================================================

import type { ComplianceScore, DomainSlug } from '@/types';
import { complianceScoreStore, gapStore } from '@/lib/mock-data/store';
import { CQC_DOMAINS, getRatingFromScore } from '@/lib/constants/cqc-framework';

/** Base score for each domain before gap deductions. */
const BASE_DOMAIN_SCORE = 100;

/** Penalty per open gap by severity. */
const SEVERITY_PENALTY: Record<string, number> = {
  CRITICAL: 15,
  HIGH: 10,
  MEDIUM: 5,
  LOW: 2,
};

export class ComplianceService {
  /**
   * Get the current compliance score snapshot.
   */
  static getCurrentScore(_organizationId: string): ComplianceScore {
    return complianceScoreStore.current;
  }

  /**
   * Recalculate compliance score from gap data.
   * For each domain, count open gaps and subtract severity-weighted penalties.
   */
  static recalculate(organizationId: string): ComplianceScore {
    const openGaps = gapStore.filter(
      (g) => g.status === 'OPEN' || g.status === 'IN_PROGRESS',
    );

    const domainScores = CQC_DOMAINS.map((domain) => {
      const domainGaps = openGaps.filter((g) => g.domain === domain.slug);

      // Calculate deductions
      const totalPenalty = domainGaps.reduce((sum, gap) => {
        return sum + (SEVERITY_PENALTY[gap.severity] ?? 0);
      }, 0);

      const score = Math.max(0, Math.min(100, BASE_DOMAIN_SCORE - totalPenalty));
      const rating = getRatingFromScore(score);

      // Count KLOEs for this domain (from the gaps that reference them)
      const uniqueKloes = new Set(domainGaps.map((g) => g.kloe));

      return {
        domainId: domain.id,
        domainName: domain.name,
        slug: domain.slug as DomainSlug,
        score,
        rating,
        gapCount: domainGaps.length,
        trend: 0, // Trend requires historical data; default to 0 for recalc
        kloeCount: uniqueKloes.size,
      };
    });

    // Overall = average of all domain scores, capped by lowest domain
    const average =
      domainScores.reduce((sum, d) => sum + d.score, 0) / domainScores.length;
    const lowestScore = Math.min(...domainScores.map((d) => d.score));
    const overall = Math.round(Math.min(average, lowestScore + 10));

    const updatedScore: ComplianceScore = {
      overall,
      domains: domainScores,
      predictedRating: getRatingFromScore(overall),
      lastUpdated: new Date().toISOString(),
    };

    complianceScoreStore.current = updatedScore;
    return updatedScore;
  }

  /**
   * Queue a recalculation. In mock mode this runs synchronously.
   */
  static queueRecalculation(organizationId: string): ComplianceScore {
    return ComplianceService.recalculate(organizationId);
  }
}
