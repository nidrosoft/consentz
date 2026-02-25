import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole, hasMinRole } from '@/lib/auth';
import { TaskService } from '@/lib/services/task-service';
import { AuditService } from '@/lib/services/audit-service';
import { updateTaskSchema } from '@/lib/validations/task';

export const GET = withAuth(async (req, { params, auth }) => {
  const task = TaskService.getById(params.id);

  if (!task) {
    return ApiErrors.notFound('Task');
  }

  // STAFF can only view their own tasks
  if (auth.role === 'STAFF' && task.assignee !== auth.dbUserId) {
    return ApiErrors.forbidden('You can only view your own tasks');
  }

  return apiSuccess(task);
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  const existing = TaskService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Task');
  }

  const body = await req.json();
  const validated = updateTaskSchema.parse(body);

  // STAFF can only update status and completionNotes on their own tasks
  if (auth.role === 'STAFF') {
    if (existing.assignee !== auth.dbUserId) {
      return ApiErrors.forbidden('You can only update your own tasks');
    }

    // STAFF is restricted to status and completionNotes only
    const allowedFields = new Set(['status', 'completionNotes']);
    const attemptedFields = Object.keys(validated).filter(
      (k) => validated[k as keyof typeof validated] !== undefined,
    );
    const disallowed = attemptedFields.filter((f) => !allowedFields.has(f));

    if (disallowed.length > 0) {
      return ApiErrors.forbidden(
        `Staff can only update status and completionNotes. Disallowed fields: ${disallowed.join(', ')}`,
      );
    }
  } else {
    // MANAGER+ required for general task updates
    requireMinRole(auth, 'MANAGER');
  }

  const updated = TaskService.update({
    id: params.id,
    title: validated.title,
    description: validated.description,
    status: validated.status,
    priority: validated.priority,
    assignee: validated.assignedToId ?? undefined,
    dueDate: validated.dueDate ?? undefined,
  });

  if (!updated) {
    return ApiErrors.notFound('Task');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TASK_UPDATED',
    entityType: 'TASK',
    entityId: params.id,
    description: `Updated task: ${existing.title}${validated.status ? ` — status: ${validated.status}` : ''}`,
  });

  // Check if completing this task resolves the related gap
  if (validated.status === 'DONE' && existing.relatedGapId) {
    TaskService.checkAndResolveGap(existing.relatedGapId);
  }

  return apiSuccess(updated);
});

export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const existing = TaskService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Task');
  }

  const deleted = TaskService.delete(params.id);
  if (!deleted) {
    return ApiErrors.notFound('Task');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TASK_DELETED',
    entityType: 'TASK',
    entityId: params.id,
    description: `Deleted task: ${existing.title}`,
  });

  return apiSuccess({ deleted: true });
});
