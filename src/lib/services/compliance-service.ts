// =============================================================================
// Compliance Service — Score management and recalculation
// =============================================================================

import type { ComplianceScore, DomainSlug } from '@/types';
import { getDb } from '@/lib/db';
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
    const client = await getDb();
    const { data: score } = await client.from('compliance_scores')
      .select('*, domain_scores(*)')
      .eq('organization_id', organizationId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!score) {
      return ComplianceService.recalculate(organizationId);
    }

    const dbDomainToSlug = (domain: string): DomainSlug => {
      if (domain === 'well_led') return 'well-led';
      return domain as DomainSlug;
    };
    const domainDisplayName = (domain: string): string => {
      if (domain === 'well_led') return 'Well-Led';
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    };

    return {
      overall: score.score,
      predictedRating: score.predicted_rating as ComplianceScore['predictedRating'],
      lastUpdated: score.calculated_at,
      domains: (score.domain_scores ?? []).map((d: any) => ({
        domainId: d.domain,
        domainName: domainDisplayName(d.domain),
        slug: dbDomainToSlug(d.domain),
        score: d.score,
        rating: d.status as ComplianceScore['predictedRating'],
        gapCount: d.total_gaps,
        trend: d.trend,
        kloeCount: d.covered_kloes ?? 0,
      })),
    };
  }

  static async recalculate(organizationId: string): Promise<ComplianceScore> {
    const client = await getDb();
    const { data: openGaps } = await client.from('compliance_gaps')
      .select('*')
      .eq('organization_id', organizationId)
      .in('status', ['OPEN', 'IN_PROGRESS']);

    const gaps = openGaps ?? [];

    const domainScores = CQC_DOMAINS.map((domain) => {
      const domainGaps = gaps.filter((g: any) => g.domain === domain.slug);

      const totalPenalty = domainGaps.reduce((sum: number, gap: any) => {
        return sum + (SEVERITY_PENALTY[gap.severity] ?? 0);
      }, 0);

      const score = Math.max(0, Math.min(100, BASE_DOMAIN_SCORE - totalPenalty));
      const rating = getRatingFromScore(score);
      const uniqueKloes = new Set(domainGaps.map((g: any) => g.kloe_code).filter(Boolean));

      return {
        domainId: domain.id,
        domainName: domain.name,
        slug: domain.slug as DomainSlug,
        score,
        rating,
        gapCount: domainGaps.length,
        criticalGaps: domainGaps.filter((g: any) => g.severity === 'CRITICAL').length,
        highGaps: domainGaps.filter((g: any) => g.severity === 'HIGH').length,
        mediumGaps: domainGaps.filter((g: any) => g.severity === 'MEDIUM').length,
        lowGaps: domainGaps.filter((g: any) => g.severity === 'LOW').length,
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

    const { data: existing } = await client.from('compliance_scores')
      .select('*')
      .eq('organization_id', organizationId)
      .limit(1)
      .maybeSingle();

    const domainScoreRows = domainScores.map((d) => ({
      domain: d.slug,
      score: d.score,
      max_score: BASE_DOMAIN_SCORE,
      percentage: d.score,
      status: d.rating === 'NOT_RATED' ? 'INADEQUATE' : d.rating,
      total_gaps: d.gapCount,
      critical_gaps: d.criticalGaps,
      high_gaps: d.highGaps,
      medium_gaps: d.mediumGaps,
      low_gaps: d.lowGaps,
      trend: d.trend,
      total_kloes: d.kloeCount,
      covered_kloes: d.kloeCount,
    }));

    let complianceScore: any;

    if (existing) {
      const { data: updated } = await client.from('compliance_scores')
        .update({
          score: overall,
          predicted_rating: predictedRating === 'NOT_RATED' ? 'INADEQUATE' : predictedRating,
          total_gaps: totalGaps,
          critical_gaps: criticalGaps,
          has_critical_gap: criticalGaps > 0,
          calculated_at: new Date().toISOString(),
          previous_score: existing.score,
        })
        .eq('id', existing.id)
        .select()
        .single();

      complianceScore = updated;

      await client.from('domain_scores').delete().eq('compliance_score_id', existing.id);
      await client.from('domain_scores').insert(
        domainScoreRows.map((d) => ({ ...d, compliance_score_id: existing.id })),
      );
    } else {
      const { data: created } = await client.from('compliance_scores').insert({
        organization_id: organizationId,
        domain_code: 'overall',
        score: overall,
        rating: predictedRating === 'NOT_RATED' ? 'INADEQUATE' : predictedRating,
        predicted_rating: predictedRating === 'NOT_RATED' ? 'INADEQUATE' : predictedRating,
        total_gaps: totalGaps,
        critical_gaps: criticalGaps,
        has_critical_gap: criticalGaps > 0,
      }).select().single();

      complianceScore = created;

      await client.from('domain_scores').insert(
        domainScoreRows.map((d) => ({ ...d, compliance_score_id: created.id })),
      );
    }

    return {
      overall: complianceScore.score,
      predictedRating: complianceScore.predicted_rating as ComplianceScore['predictedRating'],
      lastUpdated: complianceScore.calculated_at,
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
