import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { TrainingService } from '@/lib/services/training-service';
import { AuditService } from '@/lib/services/audit-service';
import { updateTrainingSchema } from '@/lib/validations/training';

export const GET = withAuth(async (req, { params, auth }) => {
  const record = TrainingService.getById(params.id);

  if (!record) {
    return ApiErrors.notFound('Training record');
  }

  return apiSuccess(record);
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const existing = TrainingService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Training record');
  }

  const body = await req.json();
  const validated = updateTrainingSchema.parse(body);

  const updated = TrainingService.update({
    id: params.id,
    courseName: validated.courseName,
    completedDate: validated.completedDate,
    expiryDate: validated.expiryDate,
    certificateUrl: validated.certificateUrl,
  });

  if (!updated) {
    return ApiErrors.notFound('Training record');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TRAINING_UPDATED',
    entityType: 'TRAINING',
    entityId: params.id,
    description: `Updated training record: ${existing.courseName}`,
  });

  return apiSuccess(updated);
});

export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const existing = TrainingService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Training record');
  }

  const deleted = TrainingService.delete(params.id);
  if (!deleted) {
    return ApiErrors.notFound('Training record');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TRAINING_DELETED',
    entityType: 'TRAINING',
    entityId: params.id,
    description: `Deleted training record: ${existing.courseName}`,
  });

  return apiSuccess({ deleted: true });
});
