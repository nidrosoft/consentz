import { getDb } from '@/lib/db';
import { getEvidenceItems, getAllKloeCodes, getKloeDefinition } from '@/lib/constants/cqc-evidence-requirements';
import type { ServiceType, DomainSlug, KloeEvidenceStatusValue } from '@/types';

const DOMAIN_FROM_PREFIX: Record<string, DomainSlug> = {
  S: 'safe', E: 'effective', C: 'caring', R: 'responsive', W: 'well-led',
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * MS_PER_DAY;
const SEVEN_DAYS_MS = 7 * MS_PER_DAY;

/** Date-based expiry takes precedence when `expires_at` is set; otherwise activity-based rules use `last_activity_at`. */
function computeExpiryStatus(
  expiresAt: string | null | undefined,
  lastActivityAt: string | null | undefined,
): 'valid' | 'expiring_soon' | 'expired' | null {
  const now = Date.now();

  if (expiresAt) {
    const exp = new Date(expiresAt).getTime();
    if (!Number.isNaN(exp)) {
      if (exp <= now) return 'expired';
      if (exp - now <= THIRTY_DAYS_MS) return 'expiring_soon';
      return 'valid';
    }
  }

  if (lastActivityAt) {
    const act = new Date(lastActivityAt).getTime();
    if (!Number.isNaN(act)) {
      if (now - act > SEVEN_DAYS_MS) return 'expired';
      return 'valid';
    }
  }

  return null;
}

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    kloeCode: row.kloe_code as string,
    evidenceItemId: row.evidence_item_id as string,
    status: row.status as KloeEvidenceStatusValue,
    evidenceType: row.evidence_type as string,
    linkedPolicyId: (row.linked_policy_id as string) ?? null,
    linkedEvidenceId: (row.linked_evidence_id as string) ?? null,
    consentzSyncedAt: (row.consentz_synced_at as string) ?? null,
    expiresAt: (row.expires_at as string) ?? null,
    lastActivityAt: (row.last_activity_at as string) ?? null,
    expiryStatus: (row.expiry_status as string) ?? null,
    notes: (row.notes as string) ?? null,
    updatedAt: row.updated_at as string,
    createdAt: row.created_at as string,
  };
}

export class EvidenceStatusService {
  static async getForKloe(organizationId: string, kloeCode: string) {
    const client = await getDb();
    const { data } = await client
      .from('kloe_evidence_status')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('kloe_code', kloeCode)
      .order('evidence_item_id');
    return (data ?? []).map(mapRow);
  }

  static async getForOrganization(organizationId: string) {
    const client = await getDb();
    const { data } = await client
      .from('kloe_evidence_status')
      .select('*')
      .eq('organization_id', organizationId)
      .order('kloe_code')
      .order('evidence_item_id');
    return (data ?? []).map(mapRow);
  }

  static async updateStatus(
    organizationId: string,
    evidenceItemId: string,
    updates: {
      status?: KloeEvidenceStatusValue;
      linkedPolicyId?: string | null;
      linkedEvidenceId?: string | null;
      consentzSyncedAt?: string | null;
      notes?: string | null;
    },
  ) {
    const client = await getDb();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.linkedPolicyId !== undefined) payload.linked_policy_id = updates.linkedPolicyId;
    if (updates.linkedEvidenceId !== undefined) payload.linked_evidence_id = updates.linkedEvidenceId;
    if (updates.consentzSyncedAt !== undefined) payload.consentz_synced_at = updates.consentzSyncedAt;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { data } = await client
      .from('kloe_evidence_status')
      .update(payload)
      .eq('organization_id', organizationId)
      .eq('evidence_item_id', evidenceItemId)
      .select()
      .single();
    return data ? mapRow(data) : null;
  }

  static async seedForOrganization(organizationId: string, serviceType: ServiceType) {
    const client = await getDb();
    const allCodes = getAllKloeCodes(serviceType);
    const rows: Record<string, unknown>[] = [];

    for (const code of allCodes) {
      const items = getEvidenceItems(serviceType, code);
      for (const item of items) {
        rows.push({
          organization_id: organizationId,
          kloe_code: code,
          evidence_item_id: item.id,
          status: 'not_started',
          evidence_type: item.sourceLabel,
        });
      }
    }

    if (rows.length === 0) return [];

    const { data } = await client
      .from('kloe_evidence_status')
      .upsert(rows, { onConflict: 'organization_id,evidence_item_id', ignoreDuplicates: true })
      .select();
    return (data ?? []).map(mapRow);
  }

  static async markPolicyItemsComplete(organizationId: string, policyId: string, domains: string[]) {
    const client = await getDb();
    const domainSlugs = domains as DomainSlug[];

    const { data: policyItems } = await client
      .from('kloe_evidence_status')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('evidence_type', 'POLICY')
      .neq('status', 'complete');

    if (!policyItems?.length) return;

    const matchingItems = policyItems.filter((item) => {
      const prefix = (item.evidence_item_id as string).charAt(0);
      const domain = DOMAIN_FROM_PREFIX[prefix];
      return domain && domainSlugs.includes(domain);
    });

    for (const item of matchingItems) {
      await client
        .from('kloe_evidence_status')
        .update({
          status: 'complete',
          linked_policy_id: policyId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);
    }
  }

  static async markEvidenceItemComplete(
    organizationId: string,
    evidenceId: string,
    kloeCodes: string[],
    expiresAt: string | null = null,
  ) {
    const client = await getDb();

    for (const code of kloeCodes) {
      const { data: items } = await client
        .from('kloe_evidence_status')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('kloe_code', code)
        .eq('evidence_type', 'MANUAL_UPLOAD')
        .neq('status', 'complete');

      if (items?.length) {
        const now = new Date().toISOString();
        const expiryStatus = expiresAt
          ? computeExpiryStatus(expiresAt, now)
          : null;

        await client
          .from('kloe_evidence_status')
          .update({
            status: 'complete',
            linked_evidence_id: evidenceId,
            expires_at: expiresAt,
            expiry_status: expiryStatus,
            last_activity_at: now,
            updated_at: now,
          })
          .eq('id', items[0].id);
      }
    }
  }

  static async markConsentzItemsSynced(organizationId: string, serviceType: ServiceType) {
    const client = await getDb();
    const now = new Date().toISOString();

    // Mark incomplete Consentz items as complete
    await client
      .from('kloe_evidence_status')
      .update({
        status: 'complete',
        consentz_synced_at: now,
        updated_at: now,
      })
      .eq('organization_id', organizationId)
      .in('evidence_type', ['CONSENTZ', 'CONSENTZ_MANUAL'])
      .neq('status', 'complete');

    // Refresh consentz_synced_at on ALL Consentz items (including already-complete)
    // so sync timestamps stay consistent across every row.
    await client
      .from('kloe_evidence_status')
      .update({
        consentz_synced_at: now,
        updated_at: now,
      })
      .eq('organization_id', organizationId)
      .in('evidence_type', ['CONSENTZ', 'CONSENTZ_MANUAL'])
      .eq('status', 'complete');
  }

  static async refreshExpiryStatuses(organizationId: string) {
    const client = await getDb();
    const { data: rows } = await client
      .from('kloe_evidence_status')
      .select('id, expires_at, last_activity_at, expiry_status')
      .eq('organization_id', organizationId)
      .eq('status', 'complete');

    if (!rows?.length) return;

    const groups = new Map<'valid' | 'expiring_soon' | 'expired' | null, string[]>();
    const push = (status: 'valid' | 'expiring_soon' | 'expired' | null, id: string) => {
      const list = groups.get(status) ?? [];
      list.push(id);
      groups.set(status, list);
    };

    for (const row of rows) {
      const next = computeExpiryStatus(
        row.expires_at as string | null,
        row.last_activity_at as string | null,
      );
      const current = (row.expiry_status as string | null) ?? null;
      if (next === current) continue;
      push(next, row.id as string);
    }

    if (groups.size === 0) return;

    const now = new Date().toISOString();
    const chunkSize = 500;

    for (const [expiryStatus, ids] of groups) {
      if (ids.length === 0) continue;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        await client
          .from('kloe_evidence_status')
          .update({ expiry_status: expiryStatus, updated_at: now })
          .eq('organization_id', organizationId)
          .in('id', chunk);
      }
    }
  }

  static async setExpiryDate(organizationId: string, evidenceItemId: string, expiresAt: string | null) {
    const client = await getDb();
    const { data: row } = await client
      .from('kloe_evidence_status')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('evidence_item_id', evidenceItemId)
      .maybeSingle();

    if (!row) return null;

    const expiryStatus =
      row.status === 'complete'
        ? computeExpiryStatus(expiresAt, row.last_activity_at as string | null)
        : null;

    const { data } = await client
      .from('kloe_evidence_status')
      .update({
        expires_at: expiresAt,
        expiry_status: expiryStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .eq('evidence_item_id', evidenceItemId)
      .select()
      .single();

    return data ? mapRow(data) : null;
  }

  static async setLastActivity(organizationId: string, evidenceItemId: string) {
    const client = await getDb();
    const now = new Date().toISOString();

    const { data: row } = await client
      .from('kloe_evidence_status')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('evidence_item_id', evidenceItemId)
      .maybeSingle();

    if (!row) return null;

    const expiryStatus =
      row.status === 'complete'
        ? computeExpiryStatus(row.expires_at as string | null, now)
        : null;

    const { data } = await client
      .from('kloe_evidence_status')
      .update({
        last_activity_at: now,
        expiry_status: expiryStatus,
        updated_at: now,
      })
      .eq('organization_id', organizationId)
      .eq('evidence_item_id', evidenceItemId)
      .select()
      .single();

    return data ? mapRow(data) : null;
  }

  static async getCompletionStats(organizationId: string, kloeCode: string) {
    const client = await getDb();
    const { data } = await client
      .from('kloe_evidence_status')
      .select('status')
      .eq('organization_id', organizationId)
      .eq('kloe_code', kloeCode);

    const items = data ?? [];
    const total = items.length;
    const complete = items.filter((i) => i.status === 'complete').length;
    return { total, complete, percentage: total > 0 ? Math.round((complete / total) * 100) : 0 };
  }
}
