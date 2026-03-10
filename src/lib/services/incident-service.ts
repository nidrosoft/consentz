// =============================================================================
// Incident Service — CRUD and filtered listing for incidents
// =============================================================================

import { db } from '@/lib/db';
import type { Prisma, Severity, IncidentType, IncidentStatus } from '@prisma/client';
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
  data: Awaited<ReturnType<typeof db.incident.findMany>>;
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
    const where: Prisma.IncidentWhereInput = {
      organizationId: params.organizationId,
    };

    const incidentTypes = [
      ...(params.filters?.incidentType
        ? Array.isArray(params.filters.incidentType)
          ? params.filters.incidentType
          : [params.filters.incidentType]
        : []),
      ...(params.filters?.category
        ? Array.isArray(params.filters.category)
          ? params.filters.category
          : [params.filters.category]
        : []),
    ];
    if (incidentTypes.length > 0) {
      where.incidentType = { in: incidentTypes as IncidentType[] };
    }
    if (params.filters?.severity) {
      const sevs = Array.isArray(params.filters.severity)
        ? params.filters.severity
        : [params.filters.severity];
      where.severity = { in: sevs as Severity[] };
    }
    if (params.filters?.status) {
      const stats = Array.isArray(params.filters.status)
        ? params.filters.status
        : [params.filters.status];
      where.status = { in: stats as IncidentStatus[] };
    }
    if (params.filters?.domain) {
      const doms = Array.isArray(params.filters.domain)
        ? params.filters.domain
        : [params.filters.domain];
      where.domains = { hasSome: doms };
    }
    if (params.filters?.dateFrom || params.filters?.dateTo) {
      where.reportedAt = {};
      if (params.filters.dateFrom) {
        where.reportedAt.gte = new Date(params.filters.dateFrom);
      }
      if (params.filters.dateTo) {
        where.reportedAt.lte = new Date(params.filters.dateTo);
      }
    }
    if (params.pagination.search) {
      where.OR = [
        { title: { contains: params.pagination.search, mode: 'insensitive' } },
        {
          description: {
            contains: params.pagination.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const skip = (params.pagination.page - 1) * params.pagination.pageSize;
    const take = params.pagination.pageSize;

    const [data, total] = await Promise.all([
      db.incident.findMany({
        where,
        orderBy: { reportedAt: 'desc' },
        skip,
        take,
      }),
      db.incident.count({ where }),
    ]);

    const totalPages = Math.ceil(total / params.pagination.pageSize);

    return {
      data,
      meta: {
        page: params.pagination.page,
        pageSize: params.pagination.pageSize,
        total,
        totalPages,
        hasMore: params.pagination.page < totalPages,
      },
    };
  }

  static async getById(id: string) {
    return db.incident.findUnique({ where: { id } });
  }

  static async create(params: IncidentCreateParams) {
    return db.incident.create({
      data: {
        organizationId: params.organizationId,
        title: params.title,
        description: params.description,
        severity: params.severity as Severity,
        incidentType: params.incidentType as IncidentType,
        reportedBy: params.reportedBy,
        status: 'OPEN',
        patientName: params.patientName,
        domains: params.domains ?? [],
      },
    });
  }

  static async update(params: IncidentUpdateParams) {
    const { id, ...updates } = params;
    const data: Prisma.IncidentUpdateInput = {};

    if (updates.title !== undefined) data.title = updates.title;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.severity !== undefined)
      data.severity = updates.severity as Severity;
    if (updates.status !== undefined)
      data.status = updates.status as IncidentStatus;
    if (updates.incidentType !== undefined)
      data.incidentType = updates.incidentType as IncidentType;
    if (updates.domains !== undefined) data.domains = updates.domains;
    if (updates.patientName !== undefined) data.patientName = updates.patientName;
    if (updates.rootCause !== undefined) data.rootCause = updates.rootCause;
    if (updates.actionsTaken !== undefined)
      data.actionsTaken = updates.actionsTaken;
    if (updates.lessonsLearned !== undefined)
      data.lessonsLearned = updates.lessonsLearned;
    if (updates.resolvedAt !== undefined)
      data.resolvedAt = updates.resolvedAt ? new Date(updates.resolvedAt) : null;
    if (updates.resolvedBy !== undefined) data.resolvedBy = updates.resolvedBy;

    return db.incident.update({ where: { id }, data });
  }
}
