// =============================================================================
// Policy Service — CRUD, approval workflow, and version history
// =============================================================================

import { getDb } from '@/lib/db';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';

interface PolicyListParams {
  organizationId: string;
  pagination: PaginationInput;
  filters?: {
    status?: string | string[];
    domain?: string | string[];
  };
}

interface PolicyListResult {
  data: any[];
  meta: PaginationMeta;
}

interface PolicyCreateParams {
  organizationId: string;
  title: string;
  createdBy: string;
  content?: string;
  category?: string;
  isAiGenerated?: boolean;
}

interface PolicyUpdateParams {
  id: string;
  title?: string;
  content?: string;
  status?: string;
}

export class PolicyService {
  static async list(params: PolicyListParams): Promise<PolicyListResult> {
    const client = await getDb();
    const skip = (params.pagination.page - 1) * params.pagination.pageSize;

    function applyFilters(query: any) {
      let q = query.eq('organization_id', params.organizationId);

      if (params.filters?.status) {
        const stats = Array.isArray(params.filters.status) ? params.filters.status : [params.filters.status];
        const mapped = stats.map((s) =>
          s === 'REVIEW' ? 'UNDER_REVIEW' : s === 'APPROVED' || s === 'PUBLISHED' ? 'ACTIVE' : s,
        );
        q = q.in('status', mapped);
      }
      if (params.filters?.domain) {
        const doms = Array.isArray(params.filters.domain) ? params.filters.domain : [params.filters.domain];
        q = q.overlaps('domains', doms);
      }
      if (params.pagination.search) {
        const s = params.pagination.search.replace(/%/g, '\\%');
        q = q.or(`title.ilike.%${s}%,content.ilike.%${s}%`);
      }
      return q;
    }

    const [{ data }, { count: total }] = await Promise.all([
      applyFilters(client.from('policies').select('*'))
        .order('updated_at', { ascending: false })
        .range(skip, skip + params.pagination.pageSize - 1),
      applyFilters(client.from('policies').select('*', { count: 'exact', head: true })),
    ]);

    const safeTotal = total ?? 0;
    const totalPages = Math.ceil(safeTotal / params.pagination.pageSize);

    return {
      data: data ?? [],
      meta: {
        page: params.pagination.page,
        pageSize: params.pagination.pageSize,
        total: safeTotal,
        totalPages,
        hasMore: params.pagination.page < totalPages,
      },
    };
  }

  static async getById(id: string) {
    const client = await getDb();
    const { data } = await client.from('policies')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return data;
  }

  static async create(params: PolicyCreateParams) {
    const client = await getDb();
    const insert: Record<string, unknown> = {
      organization_id: params.organizationId,
      title: params.title,
      content: params.content ?? '',
      created_by: params.createdBy,
      status: 'DRAFT',
      version: '1.0',
    };
    if (params.category) {
      insert.domains = [params.category];
    }

    if (params.isAiGenerated) {
      insert.is_ai_generated = true;
    }

    let { data, error } = await client.from('policies').insert(insert).select().single();

    if (error && params.isAiGenerated) {
      console.warn('[PolicyService.create] Insert failed with is_ai_generated, retrying without it:', error.message);
      delete insert.is_ai_generated;
      ({ data, error } = await client.from('policies').insert(insert).select().single());
    }

    if (error) {
      console.error('[PolicyService.create] Insert failed:', error.message);
      throw new Error(`Failed to create policy: ${error.message}`);
    }
    return data;
  }

  static async update(params: PolicyUpdateParams) {
    const client = await getDb();
    const { id, ...updates } = params;
    const updateData: Record<string, unknown> = {
      last_updated: new Date().toISOString(),
    };
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data } = await client.from('policies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    return data;
  }

  static async softDelete(id: string) {
    const client = await getDb();
    await client.from('policies')
      .update({ status: 'ARCHIVED' })
      .eq('id', id);
    return true;
  }

  static async approve(id: string, approvedBy: string) {
    const client = await getDb();
    const { data } = await client.from('policies')
      .update({
        status: 'ACTIVE',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    return data;
  }

  static async publish(id: string, changedBy: string) {
    const client = await getDb();
    const { data: policy } = await client.from('policies')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!policy) return null;

    const { count: versionCount } = await client.from('policy_versions')
      .select('*', { count: 'exact', head: true })
      .eq('policy_id', id);
    const nextVersionNumber = (versionCount ?? 0) + 1;

    const { data: updated } = await client.from('policies')
      .update({
        status: 'ACTIVE',
        last_updated: new Date().toISOString(),
        version: `${nextVersionNumber}.0`,
      })
      .eq('id', id)
      .select()
      .single();

    await client.from('policy_versions').insert({
      policy_id: id,
      version_number: nextVersionNumber,
      content: policy.content ?? '',
      created_by_id: changedBy,
    });

    return updated;
  }

  static async getVersionHistory(policyId: string) {
    const client = await getDb();
    const { data } = await client.from('policy_versions')
      .select('*')
      .eq('policy_id', policyId)
      .order('created_at', { ascending: false });
    return data ?? [];
  }

  static async recordAcknowledgement(
    policyId: string,
    userId: string,
    userName: string,
  ) {
    const client = await getDb();
    const { data } = await client.from('policy_acknowledgements')
      .upsert({
        policy_id: policyId,
        user_id: userId,
        user_name: userName,
        signed_at: new Date().toISOString(),
      }, { onConflict: 'policy_id,user_id' })
      .select()
      .single();
    return data;
  }
}
