// =============================================================================
// Evidence Service — CRUD for compliance evidence documents
// =============================================================================

import { db } from '@/lib/db';
import type { Prisma, EvidenceCategory, EvidenceStatus } from '@prisma/client';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';

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
    const where: Prisma.EvidenceItemWhereInput = {
      organizationId: params.organizationId,
    };

    if (params.filters?.category) {
      const cats = Array.isArray(params.filters.category)
        ? params.filters.category
        : [params.filters.category];
      where.category = { in: cats as EvidenceCategory[] };
    }
    if (params.filters?.status) {
      const stats = Array.isArray(params.filters.status)
        ? params.filters.status
        : [params.filters.status];
      where.status = { in: stats as EvidenceStatus[] };
    }
    if (params.filters?.domain) {
      const doms = Array.isArray(params.filters.domain)
        ? params.filters.domain
        : [params.filters.domain];
      where.domains = { hasSome: doms };
    }
    if (params.pagination.search) {
      where.OR = [
        { title: { contains: params.pagination.search, mode: 'insensitive' } },
        { fileName: { contains: params.pagination.search, mode: 'insensitive' } },
      ];
    }

    const skip = (params.pagination.page - 1) * params.pagination.pageSize;
    const take = params.pagination.pageSize;

    const [data, total] = await Promise.all([
      db.evidenceItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      db.evidenceItem.count({ where }),
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
    return db.evidenceItem.findUnique({ where: { id } });
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

    return db.evidenceItem.create({
      data: {
        organizationId: params.organizationId,
        title,
        description: params.description,
        category: params.category as EvidenceCategory,
        fileName: params.fileName,
        fileUrl: params.fileUrl,
        fileType: params.fileType,
        uploadedBy: params.uploadedBy,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        domains,
        kloeCode,
        status: (params.status as EvidenceStatus) ?? 'VALID',
      },
    });
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
      updateData.expiryDate = new Date(data.expiryDate as string);
    if (data.expiresAt !== undefined)
      updateData.expiryDate = data.expiresAt
        ? new Date(data.expiresAt as string)
        : null;
    if (data.domains !== undefined) updateData.domains = data.domains;
    if (data.linkedDomains !== undefined) updateData.domains = data.linkedDomains;
    if (data.kloeCode !== undefined) updateData.kloeCode = data.kloeCode;
    if (data.linkedKloes !== undefined)
      updateData.kloeCode = data.linkedKloes.join(',');
    // Copy other allowed fields
    const allowed = ['description', 'fileName', 'fileUrl', 'fileType', 'status', 'category'];
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    return db.evidenceItem.update({ where: { id }, data: updateData });
  }

  static async softDelete(id: string) {
    await db.evidenceItem.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    return true;
  }
}
