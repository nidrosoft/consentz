// =============================================================================
// Task Service — CRUD, filtering, and gap resolution checks
// =============================================================================

import { db } from '@/lib/db';
import type { Prisma, TaskStatus, Priority, TaskSource } from '@prisma/client';

interface TaskListParams {
  organizationId: string;
  pagination: { page: number; limit: number; search?: string };
  userRole?: string;
  userId?: string;
  filters?: {
    status?: string | string[];
    priority?: string | string[];
    assignee?: string;
    domain?: string | string[];
  };
}

export class TaskService {
  static async list(params: TaskListParams) {
    const where: Prisma.TaskWhereInput = {
      organizationId: params.organizationId,
    };

    if (params.userRole === 'STAFF' && params.userId) {
      where.assignedTo = params.userId;
    }

    if (params.filters?.status) {
      const statuses = Array.isArray(params.filters.status) ? params.filters.status : [params.filters.status];
      const mapped = statuses.map((s) => (s === 'DONE' ? 'COMPLETED' : s)).filter((s) => s !== 'OVERDUE');
      if (mapped.length > 0) where.status = { in: mapped as TaskStatus[] };
    }
    if (params.filters?.priority) {
      const priorities = Array.isArray(params.filters.priority) ? params.filters.priority : [params.filters.priority];
      const mapped = priorities.map((p) => (p === 'URGENT' ? 'CRITICAL' : p));
      if (mapped.length > 0) where.priority = { in: mapped as Priority[] };
    }
    if (params.filters?.assignee) {
      where.assignedToName = { contains: params.filters.assignee, mode: 'insensitive' };
    }
    if (params.filters?.domain) {
      const doms = Array.isArray(params.filters.domain) ? params.filters.domain : [params.filters.domain];
      where.domains = { hasSome: doms };
    }
    if (params.pagination.search) {
      where.OR = [
        { title: { contains: params.pagination.search, mode: 'insensitive' } },
        { description: { contains: params.pagination.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      db.task.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        skip: (params.pagination.page - 1) * params.pagination.limit,
        take: params.pagination.limit,
      }),
      db.task.count({ where }),
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
    return db.task.findUnique({ where: { id }, include: { complianceGap: true } });
  }

  static async create(params: {
    organizationId: string;
    title: string;
    description?: string;
    status?: string;
    priority: string;
    assignedTo?: string;
    assignedToName?: string;
    dueDate?: string;
    domains?: string[];
    kloeCode?: string;
    gapId?: string;
    source?: string;
    sourceId?: string;
  }) {
    return db.task.create({
      data: {
        organizationId: params.organizationId,
        title: params.title,
        description: params.description,
        status: (params.status as TaskStatus) || 'TODO',
        priority: params.priority as Priority,
        assignedTo: params.assignedTo,
        assignedToName: params.assignedToName,
        dueDate: params.dueDate ? new Date(params.dueDate) : null,
        domains: params.domains || [],
        kloeCode: params.kloeCode,
        gapId: params.gapId,
        source: (params.source as TaskSource) || 'MANUAL',
        sourceId: params.sourceId,
      },
    });
  }

  static async update(id: string, data: Record<string, unknown>) {
    const updateData = { ...data };
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate as string);
    if (updateData.status === 'COMPLETED' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }
    return db.task.update({ where: { id }, data: updateData as Prisma.TaskUpdateInput });
  }

  static async delete(id: string) {
    await db.task.delete({ where: { id } });
    return true;
  }

  static async checkAndResolveGap(gapId: string) {
    const relatedTasks = await db.task.findMany({ where: { gapId } });
    if (relatedTasks.length === 0) return false;
    const allDone = relatedTasks.every((t) => t.status === 'COMPLETED');
    if (allDone) {
      await db.complianceGap.update({ where: { id: gapId }, data: { status: 'RESOLVED', resolvedAt: new Date() } });
      return true;
    }
    return false;
  }
}
