import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { parsePagination } from '@/lib/pagination';
import { TaskService } from '@/lib/services/task-service';
import { AuditService } from '@/lib/services/audit-service';
import { createTaskSchema, taskFilterSchema } from '@/lib/validations/task';

export const GET = withAuth(async (req, { params, auth }) => {
  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams);

  const rawFilters = taskFilterSchema.parse({
    status: searchParams.get('status') ?? undefined,
    priority: searchParams.get('priority') ?? undefined,
    assignedToId: searchParams.get('assignedToId') ?? undefined,
    domain: searchParams.get('domain') ?? undefined,
    overdue: searchParams.get('overdue') ?? undefined,
    source: searchParams.get('source') ?? undefined,
  });

  const result = TaskService.list({
    organizationId: auth.organizationId,
    pagination,
    userRole: auth.role,
    userId: auth.dbUserId,
    filters: rawFilters,
  });

  return apiSuccess(result.data, result.meta);
});

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const body = await req.json();
  const validated = createTaskSchema.parse(body);

  const task = TaskService.create({
    organizationId: auth.organizationId,
    title: validated.title,
    description: validated.description ?? '',
    priority: validated.priority,
    domain: validated.domain ?? 'safe',
    assignee: validated.assignedToId ?? '',
    dueDate: validated.dueDate ?? '',
    relatedGapId: validated.gapId,
  });

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TASK_CREATED',
    entityType: 'TASK',
    entityId: task.id,
    description: `Created task: ${validated.title}`,
  });

  return apiSuccess(task, undefined, 201);
});
