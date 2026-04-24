// =============================================================================
// useAllKloeScores — compute KLOE scores for every KLOE in the framework,
// reusing the canonical `computeKloeScore` formula so the numbers match
// the KLOE detail page, domain tiles, and server-persisted scores.
// =============================================================================

import { useMemo } from 'react';
import { useAllCurrentEvidenceFiles } from '@/hooks/use-evidence-files';
import { useAllEvidenceStatus } from '@/hooks/use-evidence-status';
import { useOrganization } from '@/hooks/use-organization';
import { KLOES } from '@/lib/constants/cqc-framework';
import { getKloeDefinition } from '@/lib/constants/cqc-evidence-requirements';
import { computeKloeScore, type VerificationInfo } from '@/lib/services/kloe-score-formula';
import type { KloeEvidenceStatus, ServiceType } from '@/types';

export interface KloeScoresState {
  /** Map of KLOE code (e.g. "S1") → score 0-100. Empty while data is loading. */
  scoresByKloe: Record<string, number>;
  isLoading: boolean;
}

export function useAllKloeScores(): KloeScoresState {
  const { data: org } = useOrganization();
  const { data: statusRecords, isLoading: statusLoading } = useAllEvidenceStatus();
  const { data: currentFiles, isLoading: filesLoading } = useAllCurrentEvidenceFiles();

  const scoresByKloe = useMemo(() => {
    const out: Record<string, number> = {};
    if (!org) return out;

    const serviceType: ServiceType =
      org.service_type === 'CARE_HOME' || org.serviceType === 'CARE_HOME'
        ? 'CARE_HOME'
        : 'AESTHETIC_CLINIC';
    const consentzConnected = !!org.consentz_clinic_id;

    // Group statuses by kloe.
    const statusByKloe = new Map<string, KloeEvidenceStatus[]>();
    for (const row of statusRecords ?? []) {
      const code = (row as KloeEvidenceStatus).kloeCode ?? (row as unknown as { kloe_code?: string }).kloe_code;
      if (!code) continue;
      const list = statusByKloe.get(code) ?? [];
      list.push(row);
      statusByKloe.set(code, list);
    }

    // Build a verification map from the latest file per evidence item.
    const verificationByItemId = new Map<string, VerificationInfo>();
    for (const f of currentFiles ?? []) {
      if (!f.evidenceItemId) continue;
      const result = (f.verificationResult ?? null) as { complianceScore?: number | null } | null;
      verificationByItemId.set(f.evidenceItemId, {
        status: f.verificationStatus ?? 'unverified',
        complianceScore: result?.complianceScore ?? null,
      });
    }

    for (const kloe of KLOES) {
      const def = getKloeDefinition(serviceType, kloe.code);
      const items = def?.evidenceItems ?? [];
      if (items.length === 0) {
        out[kloe.code] = 0;
        continue;
      }
      const rows = statusByKloe.get(kloe.code) ?? [];
      const { score } = computeKloeScore({
        items,
        statusRows: rows,
        verificationByItemId,
        consentzConnected,
      });
      out[kloe.code] = score;
    }
    return out;
  }, [org, statusRecords, currentFiles]);

  return { scoresByKloe, isLoading: statusLoading || filesLoading };
}
