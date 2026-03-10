// =============================================================================
// Gap Service — Compliance gap CRUD and filtering
// =============================================================================

import type { ComplianceGap, DomainSlug, GapSeverity, GapStatus } from '@/types';
import type { Prisma } from '@prisma/client';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';
import { db } from '@/lib/db';
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

function mapPrismaGapToComplianceGap(row: {
  id: string;
  title: string;
  description: string;
  severity: GapSeverity;
  status: GapStatus;
  domain: string;
  kloeCode: string | null;
  regulationCode: string | null;
  createdAt: Date;
}): ComplianceGap {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    domain: row.domain as DomainSlug,
    kloe: row.kloeCode ?? '',
    regulation: row.regulationCode ?? '',
    createdAt: row.createdAt.toISOString(),
  };
}

export class GapService {
  /**
   * List gaps with optional filters and pagination.
   */
  static async list(params: GapListParams): Promise<GapListResult> {
    const where: Prisma.ComplianceGapWhereInput = {
      organizationId: params.organizationId,
    };

    if (params.filters) {
      const { status, severity, domain } = params.filters;

      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        where.status = { in: statuses };
      }

      if (severity) {
        const severities = Array.isArray(severity) ? severity : [severity];
        where.severity = { in: severities };
      }

      if (domain) {
        const domains = Array.isArray(domain) ? domain : [domain];
        where.domain = { in: domains };
      }
    }

    if (params.pagination.search) {
      const query = params.pagination.search.toLowerCase();
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      db.complianceGap.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.pagination.page - 1) * params.pagination.pageSize,
        take: params.pagination.pageSize,
      }),
      db.complianceGap.count({ where }),
    ]);

    const { meta } = buildPagination(params.pagination, total);

    return {
      data: items.map((row) => mapPrismaGapToComplianceGap(row)),
      meta,
    };
  }

  /**
   * Get a single gap by ID.
   */
  static async getById(id: string, organizationId: string): Promise<ComplianceGap | null> {
    const gap = await db.complianceGap.findFirst({
      where: { id, organizationId },
    });

    return gap ? mapPrismaGapToComplianceGap(gap) : null;
  }

  /**
   * Update a gap's status and optional fields.
   */
  static async update(params: GapUpdateParams): Promise<ComplianceGap | null> {
    const data: Parameters<typeof db.complianceGap.update>[0]['data'] = {};

    if (params.status !== undefined) {
      data.status = params.status;
    }
    if (params.resolutionNotes !== undefined) {
      data.resolutionNotes = params.resolutionNotes;
    }
    if (params.dueDate !== undefined) {
      data.dueDate = params.dueDate ? new Date(params.dueDate) : null;
    }

    const updated = await db.complianceGap.updateMany({
      where: { id: params.gapId, organizationId: params.organizationId },
      data,
    });

    if (updated.count === 0) {
      return null;
    }

    return GapService.getById(params.gapId, params.organizationId);
  }
}
