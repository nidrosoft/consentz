// =============================================================================
// KLOE Score Formula — pure, isomorphic helpers shared by client and server.
//
// This module must NOT import anything server-only (no getDb, no fs).
// Both the KLOE detail page and the backend score engine import from here to
// guarantee the tile score, domain aggregate score, and persisted compliance
// score all agree.
// =============================================================================

import { CRITICALITY_WEIGHT, type KloeEvidenceItem } from '@/lib/constants/cqc-evidence-requirements';

export interface EvidenceStatusLike {
  evidence_item_id?: string;
  evidenceItemId?: string;
  status: string;
  expiry_status?: string | null;
  expiryStatus?: string | null;
  evidence_type?: string | null;
  evidenceType?: string | null;
  consentz_synced_at?: string | null;
  consentzSyncedAt?: string | null;
}

export interface VerificationInfo {
  status: string;                    // verified | rejected | pending | unverified | error
  complianceScore: number | null;    // 0-100 from AI, null if not yet evaluated
}

const SYNC_OVERDUE_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Evidence multiplier — the single source of truth for how much weight a
// piece of evidence contributes to its KLOE score.
//
// Ordering of rules is important:
//   1. No verification info at all → 0.7 (legacy / never scanned baseline)
//   2. AI produced a numeric complianceScore → use it (graduated 0-1)
//   3. Explicit 'rejected' without score → 0.0
//   4. Explicit 'verified' without score → 1.0 (legacy path)
//   5. Anything else → 0.7
// ---------------------------------------------------------------------------
export function evidenceMultiplier(v: VerificationInfo | undefined | null): number {
  if (!v) return 0.7;
  if (v.complianceScore != null && Number.isFinite(v.complianceScore)) {
    return Math.max(0, Math.min(1, v.complianceScore / 100));
  }
  if (v.status === 'rejected') return 0.0;
  if (v.status === 'verified') return 1.0;
  return 0.7;
}

// ---------------------------------------------------------------------------
// Read helpers that tolerate either camelCase or snake_case field names.
// ---------------------------------------------------------------------------
function rowItemId(r: EvidenceStatusLike): string {
  return (r.evidence_item_id ?? r.evidenceItemId ?? '') as string;
}
function rowExpiryStatus(r: EvidenceStatusLike): string | null {
  return (r.expiry_status ?? r.expiryStatus ?? null) as string | null;
}
function rowEvidenceType(r: EvidenceStatusLike): string | null {
  return (r.evidence_type ?? r.evidenceType ?? null) as string | null;
}
function rowConsentzSyncedAt(r: EvidenceStatusLike): string | null {
  return (r.consentz_synced_at ?? r.consentzSyncedAt ?? null) as string | null;
}

// ---------------------------------------------------------------------------
// Core KLOE score calculation — used by both server-side `calculateKloeScore`
// and the client-side KLOE detail page `kloeScore` useMemo.
//
// Returns score (0-100), gap counts, and verified/rejected tallies.
// ---------------------------------------------------------------------------
export interface ComputeKloeScoreParams {
  items: KloeEvidenceItem[];
  statusRows: EvidenceStatusLike[];
  verificationByItemId: Map<string, VerificationInfo>;
  consentzConnected: boolean;
  nowMs?: number;
}

export interface KloeScoreComputation {
  score: number;
  criticalGapCount: number;
  highGapCount: number;
  verifiedCount: number;
  rejectedCount: number;
  hasCriticalExpired: boolean;
  totalWeight: number;
  weightedSum: number;
}

export function computeKloeScore(params: ComputeKloeScoreParams): KloeScoreComputation {
  const { items, statusRows, verificationByItemId, consentzConnected, nowMs = Date.now() } = params;

  const statusMap = new Map<string, EvidenceStatusLike>();
  for (const r of statusRows) statusMap.set(rowItemId(r), r);

  let weightedSum = 0;
  let totalWeight = 0;
  let criticalGapCount = 0;
  let highGapCount = 0;
  let hasCriticalExpired = false;
  let verifiedCount = 0;
  let rejectedCount = 0;

  for (const item of items) {
    const weight = CRITICALITY_WEIGHT[item.criticality];
    totalWeight += weight;

    const row = statusMap.get(item.id);
    const expiryStatus = row ? rowExpiryStatus(row) : null;
    const evidenceType = row ? rowEvidenceType(row) : null;
    const syncedAt = row ? rowConsentzSyncedAt(row) : null;

    const isConsentzType = evidenceType === 'CONSENTZ' || evidenceType === 'CONSENTZ_MANUAL';
    const consentzDisconnected = isConsentzType && !consentzConnected;
    const consentzMissing = isConsentzType && consentzConnected && !syncedAt;
    const consentzOverdue = isConsentzType && consentzConnected && syncedAt
      ? nowMs - new Date(syncedAt).getTime() > SYNC_OVERDUE_MS
      : false;

    const isPresent = row?.status === 'complete'
      && expiryStatus !== 'expired'
      && !consentzDisconnected
      && !consentzMissing
      && !consentzOverdue;

    if (isPresent) {
      const v = verificationByItemId.get(item.id);
      const multiplier = evidenceMultiplier(v);
      if (v?.status === 'verified') verifiedCount++;
      if (v?.status === 'rejected') rejectedCount++;
      weightedSum += weight * multiplier;
    } else {
      if (item.criticality === 'critical') {
        criticalGapCount++;
        if (expiryStatus === 'expired') hasCriticalExpired = true;
      } else if (item.criticality === 'high') {
        highGapCount++;
      }
    }
  }

  let score = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  if (criticalGapCount > 0) score = Math.min(score, hasCriticalExpired ? 40 : 50);
  if (highGapCount >= 2) score = Math.min(score, 60);
  else if (highGapCount > 0) score = Math.min(score, 70);

  return {
    score: Math.round(score),
    criticalGapCount,
    highGapCount,
    verifiedCount,
    rejectedCount,
    hasCriticalExpired,
    totalWeight,
    weightedSum,
  };
}
