// =============================================================================
// Staff Service — CRUD for staff members with training records
// =============================================================================

import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

interface StaffListParams {
  organizationId: string;
  pagination: { page: number; limit: number; search?: string };
  filters?: {
    isActive?: boolean;
    department?: string | string[];
    staffRole?: string | string[];
  };
}

export class StaffService {
  static async list(params: StaffListParams) {
    const where: Prisma.StaffMemberWhereInput = {
      organizationId: params.organizationId,
      deletedAt: null,
    };

    if (params.filters?.isActive !== undefined) {
      where.isActive = params.filters.isActive;
    }
    if (params.filters?.department) {
      const depts = Array.isArray(params.filters.department) ? params.filters.department : [params.filters.department];
      where.department = { in: depts };
    }
    if (params.filters?.staffRole) {
      const roles = Array.isArray(params.filters.staffRole) ? params.filters.staffRole : [params.filters.staffRole];
      where.staffRole = { in: roles };
    }
    if (params.pagination.search) {
      where.OR = [
        { firstName: { contains: params.pagination.search, mode: 'insensitive' } },
        { lastName: { contains: params.pagination.search, mode: 'insensitive' } },
        { email: { contains: params.pagination.search, mode: 'insensitive' } },
        { jobTitle: { contains: params.pagination.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      db.staffMember.findMany({
        where,
        include: { trainingRecords: true },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: (params.pagination.page - 1) * params.pagination.limit,
        take: params.pagination.limit,
      }),
      db.staffMember.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: params.pagination.page,
        limit: params.pagination.limit,
        total,
        totalPages: Math.ceil(total / params.pagination.limit),
      },
    };
  }

  static async getById(id: string) {
    return db.staffMember.findUnique({
      where: { id },
      include: { trainingRecords: { orderBy: { completedDate: 'desc' } } },
    });
  }

  static async create(params: {
    organizationId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    jobTitle: string;
    staffRole?: string;
    department?: string;
    startDate?: string;
    registrationBody?: string;
    registrationNumber?: string;
    registrationExpiry?: string;
    dbsNumber?: string;
    dbsCertificateDate?: string;
    dbsLevel?: string;
  }) {
    return db.staffMember.create({
      data: {
        organizationId: params.organizationId,
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        phone: params.phone,
        jobTitle: params.jobTitle,
        staffRole: params.staffRole || 'OTHER',
        department: params.department,
        startDate: params.startDate ? new Date(params.startDate) : new Date(),
        registrationBody: params.registrationBody,
        registrationNumber: params.registrationNumber,
        registrationExpiry: params.registrationExpiry ? new Date(params.registrationExpiry) : null,
        dbsNumber: params.dbsNumber,
        dbsCertificateDate: params.dbsCertificateDate ? new Date(params.dbsCertificateDate) : null,
        dbsLevel: params.dbsLevel,
      },
    });
  }

  static async update(id: string, data: Record<string, unknown>) {
    const dateFields = ['startDate', 'endDate', 'registrationExpiry', 'dbsCertificateDate', 'insuranceExpiry', 'rightToWorkDate'];
    const updateData = { ...data };
    for (const field of dateFields) {
      if (updateData[field]) updateData[field] = new Date(updateData[field] as string);
    }
    return db.staffMember.update({ where: { id }, data: updateData as Prisma.StaffMemberUpdateInput });
  }

  static async softDelete(id: string) {
    await db.staffMember.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
    return true;
  }
}
