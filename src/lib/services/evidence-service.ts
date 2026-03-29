// =============================================================================
// Evidence Service — CRUD for compliance evidence documents
// =============================================================================

import { getDb } from '@/lib/db';
import type { PaginationInput } from '@/lib/pagination';

interface EvidenceListParams {
  organizationId: string;
  pagination: PaginationInput;
  filters?: {
    category?: string | string[];
    status?: string | string[];
    domain?: string | string[];
  };
}

export class EvidenceService {
  static async list(params: EvidenceListParams) {
    const client = await getDb();
    const skip = (params.pagination.page - 1) * params.pagination.pageSize;

    function applyFilters(query: any) {
      let q = query.eq('organization_id', params.organizationId);

      if (params.filters?.category) {
        const cats = Array.isArray(params.filters.category) ? params.filters.category : [params.filters.category];
        q = q.in('category', cats);
      }
      if (params.filters?.status) {
        const stats = Array.isArray(params.filters.status) ? params.filters.status : [params.filters.status];
        q = q.in('status', stats);
      }
      if (params.filters?.domain) {
        const doms = Array.isArray(params.filters.domain) ? params.filters.domain : [params.filters.domain];
        q = q.overlaps('domains', doms);
      }
      if (params.pagination.search) {
        const s = params.pagination.search.replace(/%/g, '\\%');
        q = q.or(`title.ilike.%${s}%,file_name.ilike.%${s}%`);
      }
      return q;
    }

    const [{ data }, { count: total }] = await Promise.all([
      applyFilters(client.from('evidence_items').select('*'))
        .order('created_at', { ascending: false })
        .range(skip, skip + params.pagination.pageSize - 1),
      applyFilters(client.from('evidence_items').select('*', { count: 'exact', head: true })),
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
    const { data } = await client.from('evidence_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return data;
  }

  static async create(params: {
    organizationId: string;
    title?: string;
    name?: string;
    category: string;
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
    uploadedBy: string;
    expiryDate?: string | null;
    expiresAt?: string | null;
    domains?: string[];
    linkedDomains?: string[];
    kloeCode?: string;
    linkedKloes?: string[];
    status?: string;
    description?: string;
  }) {
    const title = params.title ?? params.name ?? '';
    const domains = params.domains ?? params.linkedDomains ?? [];
    const kloeCode =
      params.kloeCode ??
      (params.linkedKloes?.length ? params.linkedKloes.join(',') : undefined);
    const expiryDate = params.expiryDate ?? params.expiresAt;

    const client = await getDb();
    const { data } = await client.from('evidence_items').insert({
      organization_id: params.organizationId,
      title,
      description: params.description,
      category: params.category,
      file_name: params.fileName,
      file_url: params.fileUrl,
      file_type: params.fileType,
      uploaded_by: params.uploadedBy,
      expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
      domains,
      kloe_code: kloeCode,
      status: params.status ?? 'VALID',
    }).select().single();
    return data;
  }

  static async update(
    id: string,
    data: Record<string, unknown> & {
      name?: string;
      title?: string;
      expiresAt?: string | null;
      expiryDate?: string | null;
      linkedDomains?: string[];
      domains?: string[];
      linkedKloes?: string[];
      kloeCode?: string;
    },
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.name !== undefined) updateData.title = data.name;
    if (data.expiryDate !== undefined)
      updateData.expiry_date = data.expiryDate
        ? new Date(data.expiryDate as string).toISOString()
        : null;
    if (data.expiresAt !== undefined)
      updateData.expiry_date = data.expiresAt
        ? new Date(data.expiresAt as string).toISOString()
        : null;
    if (data.domains !== undefined) updateData.domains = data.domains;
    if (data.linkedDomains !== undefined) updateData.domains = data.linkedDomains;
    if (data.kloeCode !== undefined) updateData.kloe_code = data.kloeCode;
    if (data.linkedKloes !== undefined)
      updateData.kloe_code = data.linkedKloes.join(',');

    const allowedMapping: Record<string, string> = {
      description: 'description',
      fileName: 'file_name',
      fileUrl: 'file_url',
      fileType: 'file_type',
      status: 'status',
      category: 'category',
    };
    for (const [key, col] of Object.entries(allowedMapping)) {
      if (data[key] !== undefined) updateData[col] = data[key];
    }

    const client = await getDb();
    const { data: updated } = await client.from('evidence_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    return updated;
  }

  static async softDelete(id: string) {
    const client = await getDb();
    await client.from('evidence_items')
      .update({ status: 'ARCHIVED' })
      .eq('id', id);
    return true;
  }
}
