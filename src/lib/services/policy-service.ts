// =============================================================================
// Policy Service — CRUD, approval workflow, and version history
// =============================================================================

import { db } from '@/lib/db';
import type { Prisma, PolicyStatus } from '@prisma/client';
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
  data: Awaited<ReturnType<typeof db.policy.findMany>>;
  meta: PaginationMeta;
}

interface PolicyCreateParams {
  organizationId: string;
  title: string;
  createdBy: string;
  content?: string;
  category?: string;
}

interface PolicyUpdateParams {
  id: string;
  title?: string;
  content?: string;
  status?: string;
}

export class PolicyService {
  static async list(params: PolicyListParams): Promise<PolicyListResult> {
    const where: Prisma.PolicyWhereInput = {
      organizationId: params.organizationId,
    };

    if (params.filters?.status) {
      const stats = Array.isArray(params.filters.status)
        ? params.filters.status
        : [params.filters.status];
      const mapped = stats.map((s) =>
        s === 'REVIEW' ? 'UNDER_REVIEW' : s === 'APPROVED' || s === 'PUBLISHED' ? 'ACTIVE' : s,
      );
      where.status = { in: mapped as PolicyStatus[] };
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
        { content: { contains: params.pagination.search, mode: 'insensitive' } },
      ];
    }

    const skip = (params.pagination.page - 1) * params.pagination.pageSize;
    const take = params.pagination.pageSize;

    const [data, total] = await Promise.all([
      db.policy.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      db.policy.count({ where }),
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
    return db.policy.findUnique({ where: { id } });
  }

  static async create(params: PolicyCreateParams) {
    return db.policy.create({
      data: {
        organizationId: params.organizationId,
        title: params.title,
        content: params.content ?? '',
        createdBy: params.createdBy,
        status: 'DRAFT',
        version: '1.0',
      },
    });
  }

  static async update(params: PolicyUpdateParams) {
    const { id, ...updates } = params;
    const data: Prisma.PolicyUpdateInput = {};
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.content !== undefined) data.content = updates.content;
    if (updates.status !== undefined)
      data.status = updates.status as PolicyStatus;
    data.lastUpdated = new Date();

    return db.policy.update({ where: { id }, data });
  }

  static async softDelete(id: string) {
    await db.policy.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    return true;
  }

  static async approve(id: string, approvedBy: string) {
    return db.policy.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        approvedBy,
        approvedAt: new Date(),
        lastUpdated: new Date(),
      },
    });
  }

  static async publish(id: string, changedBy: string) {
    const policy = await db.policy.findUnique({ where: { id } });
    if (!policy) return null;

    const versionCount = await db.policyVersion.count({ where: { policyId: id } });
    const nextVersionNumber = versionCount + 1;

    const [updated] = await db.$transaction([
      db.policy.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          lastUpdated: new Date(),
          version: `${nextVersionNumber}.0`,
        },
      }),
      db.policyVersion.create({
        data: {
          policyId: id,
          versionNumber: nextVersionNumber,
          content: policy.content ?? '',
          createdById: changedBy,
        },
      }),
    ]);

    return updated;
  }

  static async getVersionHistory(policyId: string) {
    return db.policyVersion.findMany({
      where: { policyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async recordAcknowledgement(
    policyId: string,
    userId: string,
    userName: string,
  ) {
    return db.policyAcknowledgement.upsert({
      where: {
        policyId_userId: { policyId, userId },
      },
      create: {
        policyId,
        userId,
        userName,
      },
      update: {
        userName,
        signedAt: new Date(),
      },
    });
  }
}
