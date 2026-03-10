// =============================================================================
// Compliance Service — Score management and recalculation
// =============================================================================

import type { ComplianceScore, DomainSlug } from '@/types';
import { db } from '@/lib/db';
import { CQC_DOMAINS, getRatingFromScore } from '@/lib/constants/cqc-framework';

const BASE_DOMAIN_SCORE = 100;

const SEVERITY_PENALTY: Record<string, number> = {
  CRITICAL: 15,
  HIGH: 10,
  MEDIUM: 5,
  LOW: 2,
};

export class ComplianceService {
  static async getCurrentScore(organizationId: string): Promise<ComplianceScore> {
    const score = await db.complianceScore.findFirst({
      where: { organizationId },
      orderBy: { calculatedAt: 'desc' },
      include: { domainScores: true },
    });

    if (!score) {
      return ComplianceService.recalculate(organizationId);
    }

    return {
      overall: score.score,
      predictedRating: score.predictedRating as ComplianceScore['predictedRating'],
      lastUpdated: score.calculatedAt.toISOString(),
      domains: score.domainScores.map((d) => ({
        domainId: d.domain,
        domainName: d.domain.charAt(0).toUpperCase() + d.domain.slice(1).replace('-', '-'),
        slug: d.domain as DomainSlug,
        score: d.score,
        rating: d.status as ComplianceScore['predictedRating'],
        gapCount: d.totalGaps,
        trend: d.trend,
        kloeCount: d.coveredKloes ?? 0,
      })),
    };
  }

  static async recalculate(organizationId: string): Promise<ComplianceScore> {
    const openGaps = await db.complianceGap.findMany({
      where: {
        organizationId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });

    const domainScores = CQC_DOMAINS.map((domain) => {
      const domainGaps = openGaps.filter((g) => g.domain === domain.slug);

      const totalPenalty = domainGaps.reduce((sum, gap) => {
        return sum + (SEVERITY_PENALTY[gap.severity] ?? 0);
      }, 0);

      const score = Math.max(0, Math.min(100, BASE_DOMAIN_SCORE - totalPenalty));
      const rating = getRatingFromScore(score);
      const uniqueKloes = new Set(domainGaps.map((g) => g.kloeCode).filter(Boolean));

      return {
        domainId: domain.id,
        domainName: domain.name,
        slug: domain.slug as DomainSlug,
        score,
        rating,
        gapCount: domainGaps.length,
        criticalGaps: domainGaps.filter((g) => g.severity === 'CRITICAL').length,
        highGaps: domainGaps.filter((g) => g.severity === 'HIGH').length,
        mediumGaps: domainGaps.filter((g) => g.severity === 'MEDIUM').length,
        lowGaps: domainGaps.filter((g) => g.severity === 'LOW').length,
        trend: 0,
        kloeCount: uniqueKloes.size,
      };
    });

    const average = domainScores.reduce((sum, d) => sum + d.score, 0) / domainScores.length;
    const lowestScore = Math.min(...domainScores.map((d) => d.score));
    const overall = Math.round(Math.min(average, lowestScore + 10));

    const predictedRating = getRatingFromScore(overall);
    const totalGaps = domainScores.reduce((s, d) => s + d.gapCount, 0);
    const criticalGaps = domainScores.reduce((s, d) => s + d.criticalGaps, 0);

    const existing = await db.complianceScore.findFirst({
      where: { organizationId },
    });

    let complianceScore;
    if (existing) {
      complianceScore = await db.complianceScore.update({
        where: { id: existing.id },
        data: {
          score: overall,
          predictedRating: predictedRating === 'NOT_RATED' ? 'INADEQUATE' : predictedRating,
          totalGaps,
          criticalGaps,
          hasCriticalGap: criticalGaps > 0,
          calculatedAt: new Date(),
          previousScore: existing.score,
          domainScores: {
            deleteMany: {},
            create: domainScores.map((d) => ({
              domain: d.slug,
              score: d.score,
              maxScore: BASE_DOMAIN_SCORE,
              percentage: d.score,
              status: d.rating === 'NOT_RATED' ? 'INADEQUATE' : d.rating,
              totalGaps: d.gapCount,
              criticalGaps: d.criticalGaps,
              highGaps: d.highGaps,
              mediumGaps: d.mediumGaps,
              lowGaps: d.lowGaps,
              trend: d.trend,
              totalKloes: d.kloeCount,
              coveredKloes: d.kloeCount,
            })),
          },
        },
      });
    } else {
      complianceScore = await db.complianceScore.create({
        data: {
          organizationId,
          domainCode: 'overall',
          score: overall,
          rating: predictedRating === 'NOT_RATED' ? 'INADEQUATE' : predictedRating,
          predictedRating: predictedRating === 'NOT_RATED' ? 'INADEQUATE' : predictedRating,
          totalGaps,
          criticalGaps,
          hasCriticalGap: criticalGaps > 0,
          domainScores: {
            create: domainScores.map((d) => ({
              domain: d.slug,
              score: d.score,
              maxScore: BASE_DOMAIN_SCORE,
              percentage: d.score,
              status: d.rating === 'NOT_RATED' ? 'INADEQUATE' : d.rating,
              totalGaps: d.gapCount,
              criticalGaps: d.criticalGaps,
              highGaps: d.highGaps,
              mediumGaps: d.mediumGaps,
              lowGaps: d.lowGaps,
              trend: d.trend,
              totalKloes: d.kloeCount,
              coveredKloes: d.kloeCount,
            })),
          },
        },
      });
    }

    return {
      overall: complianceScore.score,
      predictedRating: complianceScore.predictedRating as ComplianceScore['predictedRating'],
      lastUpdated: complianceScore.calculatedAt.toISOString(),
      domains: domainScores.map((d) => ({
        domainId: d.domainId,
        domainName: d.domainName,
        slug: d.slug,
        score: d.score,
        rating: d.rating,
        gapCount: d.gapCount,
        trend: d.trend,
        kloeCount: d.kloeCount,
      })),
    };
  }

  static async queueRecalculation(organizationId: string): Promise<ComplianceScore> {
    return ComplianceService.recalculate(organizationId);
  }
}
