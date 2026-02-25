// =============================================================================
// Task Service — CRUD, filtering, and gap resolution checks
// =============================================================================

import type { Task, TaskStatus, TaskPriority, DomainSlug } from '@/types';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';
import { taskStore, gapStore, generateId } from '@/lib/mock-data/store';
import { paginateArray } from '@/lib/pagination';

interface TaskListParams {
  organizationId: string;
  pagination: PaginationInput;
  userRole?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER';
  userId?: string;
  filters?: {
    status?: TaskStatus | TaskStatus[];
    priority?: TaskPriority | TaskPriority[];
    assignee?: string;
    domain?: DomainSlug | DomainSlug[];
  };
}

interface TaskListResult {
  data: Task[];
  meta: PaginationMeta;
}

interface TaskCreateParams {
  organizationId: string;
  title: string;
  description: string;
  status?: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  relatedGapId?: string | null;
  domain: DomainSlug;
}

interface TaskUpdateParams {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  dueDate?: string;
  domain?: DomainSlug;
}

export class TaskService {
  /**
   * List tasks with optional filters and pagination.
   * For STAFF role, automatically filters by assignee.
   */
  static list(params: TaskListParams): TaskListResult {
    let items = taskStore.getAll();

    // For STAFF role, restrict to their own tasks
    if (params.userRole === 'STAFF' && params.userId) {
      items = items.filter((t) => t.assignee === params.userId);
    }

    // Apply filters
    if (params.filters) {
      const { status, priority, assignee, domain } = params.filters;

      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        items = items.filter((t) => statuses.includes(t.status));
      }

      if (priority) {
        const priorities = Array.isArray(priority) ? priority : [priority];
        items = items.filter((t) => priorities.includes(t.priority));
      }

      if (assignee) {
        items = items.filter(
          (t) => t.assignee.toLowerCase().includes(assignee.toLowerCase()),
        );
      }

      if (domain) {
        const domains = Array.isArray(domain) ? domain : [domain];
        items = items.filter((t) => domains.includes(t.domain));
      }
    }

    // Apply search
    if (params.pagination.search) {
      const query = params.pagination.search.toLowerCase();
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query),
      );
    }

    // Sort by dueDate ascending by default (most urgent first)
    items.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

    return paginateArray(items, params.pagination);
  }

  /**
   * Get a single task by ID.
   */
  static getById(id: string): Task | undefined {
    return taskStore.getById(id);
  }

  /**
   * Create a new task.
   */
  static create(params: TaskCreateParams): Task {
    const task: Task = {
      id: generateId('task'),
      title: params.title,
      description: params.description,
      status: params.status ?? 'TODO',
      priority: params.priority,
      assignee: params.assignee,
      dueDate: params.dueDate,
      relatedGapId: params.relatedGapId ?? null,
      domain: params.domain,
    };

    return taskStore.create(task);
  }

  /**
   * Update an existing task.
   */
  static update(params: TaskUpdateParams): Task | undefined {
    const existing = taskStore.getById(params.id);
    if (!existing) return undefined;

    const updates: Partial<Task> = {};

    if (params.title !== undefined) updates.title = params.title;
    if (params.description !== undefined) updates.description = params.description;
    if (params.status !== undefined) updates.status = params.status;
    if (params.priority !== undefined) updates.priority = params.priority;
    if (params.assignee !== undefined) updates.assignee = params.assignee;
    if (params.dueDate !== undefined) updates.dueDate = params.dueDate;
    if (params.domain !== undefined) updates.domain = params.domain;

    return taskStore.update(params.id, updates);
  }

  /**
   * Delete a task permanently.
   */
  static delete(id: string): boolean {
    return taskStore.remove(id);
  }

  /**
   * Check if all tasks related to a gap are DONE.
   * If so, resolve the gap automatically.
   */
  static checkAndResolveGap(gapId: string): boolean {
    const relatedTasks = taskStore.filter((t) => t.relatedGapId === gapId);

    // No related tasks means we cannot auto-resolve
    if (relatedTasks.length === 0) return false;

    const allDone = relatedTasks.every((t) => t.status === 'DONE');

    if (allDone) {
      gapStore.update(gapId, { status: 'RESOLVED' });
      return true;
    }

    return false;
  }
}
