// =============================================================================
// Gap Service — Compliance gap CRUD and filtering
// =============================================================================

import type { ComplianceGap, DomainSlug, GapSeverity, GapStatus } from '@/types';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';
import { getDb } from '@/lib/db';
import { buildPagination } from '@/lib/pagination';

interface GapListParams {
  organizationId: string;
  pagination: PaginationInput;
  filters?: {
    status?: GapStatus | GapStatus[];
    severity?: GapSeverity | GapSeverity[];
    domain?: DomainSlug | DomainSlug[];
  };
}

interface GapListResult {
  data: ComplianceGap[];
  meta: PaginationMeta;
}

interface GapUpdateParams {
  gapId: string;
  organizationId: string;
  status?: GapStatus;
  resolutionNotes?: string;
  dueDate?: string;
}

function mapRowToComplianceGap(row: any): ComplianceGap {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    domain: row.domain as DomainSlug,
    kloe: row.kloe_code ?? '',
    regulation: row.regulation_code ?? '',
    createdAt: row.created_at,
  };
}

export class GapService {
  /**
   * List gaps with optional filters and pagination.
   */
  static async list(params: GapListParams): Promise<GapListResult> {
    const client = await getDb();
    const skip = (params.pagination.page - 1) * params.pagination.pageSize;

    function applyFilters(query: any) {
      let q = query.eq('organization_id', params.organizationId);

      if (params.filters) {
        const { status, severity, domain } = params.filters;
        if (status) {
          const statuses = Array.isArray(status) ? status : [status];
          q = q.in('status', statuses);
        }
        if (severity) {
          const severities = Array.isArray(severity) ? severity : [severity];
          q = q.in('severity', severities);
        }
        if (domain) {
          const domains = Array.isArray(domain) ? domain : [domain];
          q = q.in('domain', domains);
        }
      }

      if (params.pagination.search) {
        const s = params.pagination.search.toLowerCase().replace(/%/g, '\\%');
        q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`);
      }
      return q;
    }

    const [{ data: items }, { count: total }] = await Promise.all([
      applyFilters(client.from('compliance_gaps').select('*'))
        .order('created_at', { ascending: false })
        .range(skip, skip + params.pagination.pageSize - 1),
      applyFilters(client.from('compliance_gaps').select('*', { count: 'exact', head: true })),
    ]);

    const { meta } = buildPagination(params.pagination, total ?? 0);

    return {
      data: (items ?? []).map((row: any) => mapRowToComplianceGap(row)),
      meta,
    };
  }

  /**
   * Get a single gap by ID.
   */
  static async getById(id: string, organizationId: string): Promise<ComplianceGap | null> {
    const client = await getDb();
    const { data: gap } = await client.from('compliance_gaps')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    return gap ? mapRowToComplianceGap(gap) : null;
  }

  /**
   * Update a gap's status and optional fields.
   */
  static async update(params: GapUpdateParams): Promise<ComplianceGap | null> {
    const client = await getDb();
    const updateData: Record<string, unknown> = {};

    if (params.status !== undefined) {
      updateData.status = params.status;
    }
    if (params.resolutionNotes !== undefined) {
      updateData.resolution_notes = params.resolutionNotes;
    }
    if (params.dueDate !== undefined) {
      updateData.due_date = params.dueDate ? new Date(params.dueDate).toISOString() : null;
    }

    const { data: updated } = await client.from('compliance_gaps')
      .update(updateData)
      .eq('id', params.gapId)
      .eq('organization_id', params.organizationId)
      .select();

    if (!updated || updated.length === 0) {
      return null;
    }

    return GapService.getById(params.gapId, params.organizationId);
  }
}
