// =============================================================================
// Incident Service — CRUD and filtered listing for incidents
// =============================================================================

import { getDb } from '@/lib/db';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';

interface IncidentListParams {
  organizationId: string;
  pagination: PaginationInput;
  filters?: {
    incidentType?: string | string[];
    category?: string | string[];
    severity?: string | string[];
    status?: string | string[];
    domain?: string | string[];
    dateFrom?: string;
    dateTo?: string;
  };
}

interface IncidentListResult {
  data: any[];
  meta: PaginationMeta;
}

interface IncidentCreateParams {
  organizationId: string;
  title: string;
  description: string;
  severity: string;
  reportedBy: string;
  incidentType: string;
  domains?: string[];
  patientName?: string;
}

interface IncidentUpdateParams {
  id: string;
  title?: string;
  description?: string;
  severity?: string;
  status?: string;
  incidentType?: string;
  domains?: string[];
  patientName?: string;
  rootCause?: string;
  actionsTaken?: string;
  lessonsLearned?: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

export class IncidentService {
  static async list(params: IncidentListParams): Promise<IncidentListResult> {
    const client = await getDb();
    const skip = (params.pagination.page - 1) * params.pagination.pageSize;

    function applyFilters(query: any) {
      let q = query.eq('organization_id', params.organizationId);

      const incidentTypes = [
        ...(params.filters?.incidentType
          ? Array.isArray(params.filters.incidentType) ? params.filters.incidentType : [params.filters.incidentType]
          : []),
        ...(params.filters?.category
          ? Array.isArray(params.filters.category) ? params.filters.category : [params.filters.category]
          : []),
      ];
      if (incidentTypes.length > 0) {
        q = q.in('incident_type', incidentTypes);
      }
      if (params.filters?.severity) {
        const sevs = Array.isArray(params.filters.severity) ? params.filters.severity : [params.filters.severity];
        q = q.in('severity', sevs);
      }
      if (params.filters?.status) {
        const stats = Array.isArray(params.filters.status) ? params.filters.status : [params.filters.status];
        q = q.in('status', stats);
      }
      if (params.filters?.domain) {
        const doms = Array.isArray(params.filters.domain) ? params.filters.domain : [params.filters.domain];
        q = q.overlaps('domains', doms);
      }
      if (params.filters?.dateFrom) {
        q = q.gte('reported_at', new Date(params.filters.dateFrom).toISOString());
      }
      if (params.filters?.dateTo) {
        q = q.lte('reported_at', new Date(params.filters.dateTo).toISOString());
      }
      if (params.pagination.search) {
        const s = params.pagination.search.replace(/%/g, '\\%');
        q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`);
      }
      return q;
    }

    const [{ data }, { count: total }] = await Promise.all([
      applyFilters(client.from('incidents').select('*'))
        .order('reported_at', { ascending: false })
        .range(skip, skip + params.pagination.pageSize - 1),
      applyFilters(client.from('incidents').select('*', { count: 'exact', head: true })),
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
    const { data } = await client.from('incidents')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return data;
  }

  static async create(params: IncidentCreateParams) {
    const client = await getDb();
    const { data } = await client.from('incidents').insert({
      organization_id: params.organizationId,
      title: params.title,
      description: params.description,
      severity: params.severity,
      incident_type: params.incidentType,
      reported_by: params.reportedBy,
      status: 'OPEN',
      patient_name: params.patientName,
      domains: params.domains ?? [],
    }).select().single();
    return data;
  }

  static async update(params: IncidentUpdateParams) {
    const { id, ...updates } = params;
    const updateData: Record<string, unknown> = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.severity !== undefined) updateData.severity = updates.severity;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.incidentType !== undefined) updateData.incident_type = updates.incidentType;
    if (updates.domains !== undefined) updateData.domains = updates.domains;
    if (updates.patientName !== undefined) updateData.patient_name = updates.patientName;
    if (updates.rootCause !== undefined) updateData.root_cause = updates.rootCause;
    if (updates.actionsTaken !== undefined) updateData.actions_taken = updates.actionsTaken;
    if (updates.lessonsLearned !== undefined) updateData.lessons_learned = updates.lessonsLearned;
    if (updates.resolvedAt !== undefined)
      updateData.resolved_at = updates.resolvedAt ? new Date(updates.resolvedAt).toISOString() : null;
    if (updates.resolvedBy !== undefined) updateData.resolved_by = updates.resolvedBy;

    const client = await getDb();
    const { data } = await client.from('incidents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    return data;
  }
}
