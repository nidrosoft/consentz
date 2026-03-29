// =============================================================================
// Task Service — CRUD, filtering, and gap resolution checks
// =============================================================================

import { getDb } from '@/lib/db';

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

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
    const client = await getDb();
    const skip = (params.pagination.page - 1) * params.pagination.limit;

    function applyFilters(query: any) {
      let q = query.eq('organization_id', params.organizationId);

      if (params.userRole === 'STAFF' && params.userId) {
        q = q.eq('assigned_to', params.userId);
      }
      if (params.filters?.status) {
        const statuses = Array.isArray(params.filters.status) ? params.filters.status : [params.filters.status];
        const mapped = statuses.map((s) => (s === 'DONE' ? 'COMPLETED' : s)).filter((s) => s !== 'OVERDUE');
        if (mapped.length > 0) q = q.in('status', mapped);
      }
      if (params.filters?.priority) {
        const priorities = Array.isArray(params.filters.priority) ? params.filters.priority : [params.filters.priority];
        const mapped = priorities.map((p) => (p === 'URGENT' ? 'CRITICAL' : p));
        if (mapped.length > 0) q = q.in('priority', mapped);
      }
      if (params.filters?.assignee) {
        q = q.ilike('assigned_to_name', `%${params.filters.assignee}%`);
      }
      if (params.filters?.domain) {
        const doms = Array.isArray(params.filters.domain) ? params.filters.domain : [params.filters.domain];
        q = q.overlaps('domains', doms);
      }
      if (params.pagination.search) {
        const s = params.pagination.search.replace(/%/g, '\\%');
        q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`);
      }
      return q;
    }

    const [{ data }, { count: total }] = await Promise.all([
      applyFilters(client.from('tasks').select('*'))
        .order('due_date', { ascending: true })
        .range(skip, skip + params.pagination.limit - 1),
      applyFilters(client.from('tasks').select('*', { count: 'exact', head: true })),
    ]);

    const safeTotal = total ?? 0;

    return {
      data: data ?? [],
      meta: {
        page: params.pagination.page,
        limit: params.pagination.limit,
        total: safeTotal,
        totalPages: Math.ceil(safeTotal / params.pagination.limit),
      },
    };
  }

  static async getById(id: string) {
    const client = await getDb();
    const { data } = await client.from('tasks')
      .select('*, compliance_gaps(*)')
      .eq('id', id)
      .maybeSingle();
    return data;
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
    const client = await getDb();
    const { data } = await client.from('tasks').insert({
      organization_id: params.organizationId,
      title: params.title,
      description: params.description,
      status: params.status || 'TODO',
      priority: params.priority,
      assigned_to: params.assignedTo,
      assigned_to_name: params.assignedToName,
      due_date: params.dueDate ? new Date(params.dueDate).toISOString() : null,
      domains: params.domains || [],
      kloe_code: params.kloeCode,
      gap_id: params.gapId,
      source: params.source || 'MANUAL',
      source_id: params.sourceId,
    }).select().single();
    return data;
  }

  static async update(id: string, data: Record<string, unknown>) {
    const snakeData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      snakeData[camelToSnake(key)] = value;
    }
    if (snakeData.due_date) snakeData.due_date = new Date(snakeData.due_date as string).toISOString();
    if (snakeData.status === 'COMPLETED' && !snakeData.completed_at) {
      snakeData.completed_at = new Date().toISOString();
    }
    const client = await getDb();
    const { data: updated } = await client.from('tasks')
      .update(snakeData)
      .eq('id', id)
      .select()
      .single();
    return updated;
  }

  static async delete(id: string) {
    const client = await getDb();
    await client.from('tasks').delete().eq('id', id);
    return true;
  }

  static async checkAndResolveGap(gapId: string) {
    const client = await getDb();
    const { data: relatedTasks } = await client.from('tasks')
      .select('*')
      .eq('gap_id', gapId);
    if (!relatedTasks || relatedTasks.length === 0) return false;
    const allDone = relatedTasks.every((t: any) => t.status === 'COMPLETED');
    if (allDone) {
      await client.from('compliance_gaps')
        .update({ status: 'RESOLVED', resolved_at: new Date().toISOString() })
        .eq('id', gapId);
      return true;
    }
    return false;
  }
}
