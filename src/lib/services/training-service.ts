// =============================================================================
// Training Service — CRUD and training matrix generation
// =============================================================================

import { db } from '@/lib/db';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';
import type { Prisma } from '@prisma/client';

function deriveTrainingStatus(expiryDate: Date | null, isExpired: boolean): string {
  if (isExpired) return 'EXPIRED';
  if (!expiryDate) return 'VALID';
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (expiryDate <= thirtyDays) return 'EXPIRING_SOON';
  return 'VALID';
}

interface TrainingListParams {
  organizationId: string;
  pagination: PaginationInput;
  filters?: {
    staffId?: string;
    status?: string | string[];
    courseName?: string;
  };
}

interface TrainingCreateParams {
  organizationId: string;
  staffId: string;
  courseName: string;
  completedDate: string;
  expiryDate: string;
  certificateUrl?: string | null;
  status?: string;
}

interface TrainingUpdateParams {
  id: string;
  courseName?: string;
  completedDate?: string;
  expiryDate?: string;
  certificateUrl?: string | null;
  status?: string;
}

export class TrainingService {
  static async listAll(params: TrainingListParams) {
    const where: Prisma.TrainingRecordWhereInput = {
      staffMember: { organizationId: params.organizationId },
    };

    if (params.filters?.staffId) {
      where.staffMemberId = params.filters.staffId;
    }
    if (params.filters?.courseName) {
      where.courseName = { contains: params.filters.courseName, mode: 'insensitive' };
    }
    if (params.pagination.search) {
      where.courseName = { contains: params.pagination.search, mode: 'insensitive' };
    }

    const skip = (params.pagination.page - 1) * params.pagination.pageSize;
    const take = params.pagination.pageSize;

    const [rawData, total] = await Promise.all([
      db.trainingRecord.findMany({
        where,
        orderBy: { completedDate: 'desc' },
        skip,
        take,
        include: { staffMember: { select: { firstName: true, lastName: true } } },
      }),
      db.trainingRecord.count({ where }),
    ]);

    const data = rawData.map((r) => ({
      ...r,
      status: deriveTrainingStatus(r.expiryDate, r.isExpired),
      staffName: `${r.staffMember.firstName} ${r.staffMember.lastName}`,
    }));

    if (params.filters?.status) {
      const statuses = Array.isArray(params.filters.status) ? params.filters.status : [params.filters.status];
      const filtered = data.filter((d) => statuses.includes(d.status));
      const totalPages = Math.ceil(filtered.length / params.pagination.pageSize);
      return {
        data: filtered,
        meta: { page: params.pagination.page, pageSize: params.pagination.pageSize, total: filtered.length, totalPages, hasMore: params.pagination.page < totalPages } as PaginationMeta,
      };
    }

    const totalPages = Math.ceil(total / params.pagination.pageSize);
    return {
      data,
      meta: { page: params.pagination.page, pageSize: params.pagination.pageSize, total, totalPages, hasMore: params.pagination.page < totalPages } as PaginationMeta,
    };
  }

  static async getById(id: string) {
    const record = await db.trainingRecord.findUnique({ where: { id } });
    if (!record) return null;
    return { ...record, status: deriveTrainingStatus(record.expiryDate, record.isExpired) };
  }

  static async create(params: TrainingCreateParams) {
    const expiryDate = params.expiryDate ? new Date(params.expiryDate) : null;
    return db.trainingRecord.create({
      data: {
        staffMemberId: params.staffId,
        courseName: params.courseName,
        completedDate: new Date(params.completedDate),
        expiryDate,
        certificateUrl: params.certificateUrl ?? null,
        isExpired: params.status === 'EXPIRED',
      },
    });
  }

  static async update(params: TrainingUpdateParams) {
    const data: Prisma.TrainingRecordUpdateInput = {};
    if (params.courseName !== undefined) data.courseName = params.courseName;
    if (params.completedDate !== undefined) data.completedDate = new Date(params.completedDate);
    if (params.expiryDate !== undefined) data.expiryDate = new Date(params.expiryDate);
    if (params.certificateUrl !== undefined) data.certificateUrl = params.certificateUrl;
    if (params.status === 'EXPIRED') data.isExpired = true;
    if (params.status === 'VALID') data.isExpired = false;

    return db.trainingRecord.update({ where: { id: params.id }, data });
  }

  static async delete(id: string) {
    await db.trainingRecord.delete({ where: { id } });
    return true;
  }

  static async getMatrix(organizationId: string) {
    const activeStaff = await db.staffMember.findMany({
      where: { organizationId, isActive: true },
      include: {
        trainingRecords: {
          select: { courseName: true, expiryDate: true, isExpired: true },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    const staffRows = activeStaff.map((member) => ({
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      trainings: member.trainingRecords.map((t) => ({
        courseName: t.courseName,
        status: deriveTrainingStatus(t.expiryDate, t.isExpired),
        expiryDate: t.expiryDate?.toISOString() ?? '',
      })),
    }));

    return { staff: staffRows };
  }
}
