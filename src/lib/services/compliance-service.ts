// =============================================================================
// Compliance Service — Score management and recalculation
// =============================================================================

import type { ComplianceScore, DomainSlug } from '@/types';
import { getDb } from '@/lib/db';
import { recalculateComplianceScores } from '@/lib/services/score-engine';

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

    // Auto-recalculate if data is stale (>1 hour old) to ensure scores
    // reflect latest evidence state and pick up any engine changes.
    const STALE_MS = 60 * 60 * 1000; // 1 hour
    const calculatedAt = score.calculated_at ? new Date(score.calculated_at).getTime() : 0;
    if (Date.now() - calculatedAt > STALE_MS) {
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
    // Delegate to the evidence-driven score engine (single source of truth).
    // This replaces the old gap-penalty model that started domains at 100%
    // and only subtracted points for open gaps — leading to inflated scores
    // for domains with no evidence or gaps.
    const result = await recalculateComplianceScores(organizationId);

    const dbDomainToSlug = (domain: string): DomainSlug => {
      if (domain === 'well_led') return 'well-led';
      return domain as DomainSlug;
    };
    const domainDisplayName = (domain: string): string => {
      if (domain === 'well_led') return 'Well-Led';
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    };

    return {
      overall: result.overallScore,
      predictedRating: result.predictedRating as ComplianceScore['predictedRating'],
      lastUpdated: new Date().toISOString(),
      domains: result.domainScores.map((d) => ({
        domainId: d.domain,
        domainName: domainDisplayName(d.domain),
        slug: dbDomainToSlug(d.domain),
        score: d.score,
        rating: d.rating,
        gapCount: 0,
        trend: 0,
        kloeCount: 0,
      })),
    };
  }

  static async queueRecalculation(organizationId: string): Promise<ComplianceScore> {
    return ComplianceService.recalculate(organizationId);
  }
}
