import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole, hasMinRole } from '@/lib/auth';
import { TaskService } from '@/lib/services/task-service';
import { AuditService } from '@/lib/services/audit-service';
import { updateTaskSchema } from '@/lib/validations/task';

export const GET = withAuth(async (req, { params, auth }) => {
  const task = await TaskService.getById(params.id);

  if (!task) {
    return ApiErrors.notFound('Task');
  }

  // STAFF can only view their own tasks
  if (auth.role === 'STAFF' && task.assignedTo !== auth.dbUserId) {
    return ApiErrors.forbidden('You can only view your own tasks');
  }

  return apiSuccess(task);
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  const existing = await TaskService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Task');
  }

  const body = await req.json();
  const validated = updateTaskSchema.parse(body);

  // STAFF can only update status and completionNotes on their own tasks
  if (auth.role === 'STAFF') {
    if (existing.assignedTo !== auth.dbUserId) {
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

  const updateData: Record<string, unknown> = {};
  if (validated.title !== undefined) updateData.title = validated.title;
  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.status !== undefined) updateData.status = validated.status === 'DONE' ? 'COMPLETED' : validated.status;
  if (validated.priority !== undefined) updateData.priority = validated.priority === 'URGENT' ? 'CRITICAL' : validated.priority;
  if (validated.assignedToId !== undefined) updateData.assignedTo = validated.assignedToId;
  if (validated.dueDate !== undefined) updateData.dueDate = validated.dueDate;

  const updated = await TaskService.update(params.id, updateData);

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TASK_UPDATED',
    entityType: 'TASK',
    entityId: params.id,
    description: `Updated task: ${existing.title}${validated.status ? ` — status: ${validated.status}` : ''}`,
  });

  // Check if completing this task resolves the related gap
  if (validated.status === 'DONE' && existing.gapId) {
    await TaskService.checkAndResolveGap(existing.gapId);
  }

  return apiSuccess(updated);
});

export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const existing = await TaskService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Task');
  }

  await TaskService.delete(params.id);

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TASK_DELETED',
    entityType: 'TASK',
    entityId: params.id,
    description: `Deleted task: ${existing.title}`,
  });

  return apiSuccess({ deleted: true });
});
