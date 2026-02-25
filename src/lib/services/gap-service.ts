// =============================================================================
// Gap Service — Compliance gap CRUD and filtering
// =============================================================================

import type { ComplianceGap, DomainSlug, GapSeverity, GapStatus } from '@/types';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';
import { gapStore } from '@/lib/mock-data/store';
import { paginateArray } from '@/lib/pagination';

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
  status?: GapStatus;
  resolutionNotes?: string;
  dueDate?: string;
}

export class GapService {
  /**
   * List gaps with optional filters and pagination.
   */
  static list(params: GapListParams): GapListResult {
    let items = gapStore.getAll();

    // Apply filters
    if (params.filters) {
      const { status, severity, domain } = params.filters;

      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        items = items.filter((g) => statuses.includes(g.status));
      }

      if (severity) {
        const severities = Array.isArray(severity) ? severity : [severity];
        items = items.filter((g) => severities.includes(g.severity));
      }

      if (domain) {
        const domains = Array.isArray(domain) ? domain : [domain];
        items = items.filter((g) => domains.includes(g.domain));
      }
    }

    // Apply search
    if (params.pagination.search) {
      const query = params.pagination.search.toLowerCase();
      items = items.filter(
        (g) =>
          g.title.toLowerCase().includes(query) ||
          g.description.toLowerCase().includes(query),
      );
    }

    // Sort by createdAt descending by default
    items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return paginateArray(items, params.pagination);
  }

  /**
   * Get a single gap by ID.
   */
  static getById(id: string): ComplianceGap | undefined {
    return gapStore.getById(id);
  }

  /**
   * Update a gap's status and optional fields.
   */
  static update(params: GapUpdateParams): ComplianceGap | undefined {
    const updates: Partial<ComplianceGap> = {};

    if (params.status !== undefined) {
      updates.status = params.status;
    }

    return gapStore.update(params.gapId, updates);
  }
}
