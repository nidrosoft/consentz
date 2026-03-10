import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { TrainingService } from '@/lib/services/training-service';
import { AuditService } from '@/lib/services/audit-service';
import { updateTrainingSchema } from '@/lib/validations/training';

export const GET = withAuth(async (req, { params, auth }) => {
  const resolvedParams = await params;
  const record = await TrainingService.getById(resolvedParams.id);

  if (!record) {
    return ApiErrors.notFound('Training record');
  }

  return apiSuccess(record);
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const resolvedParams = await params;
  const existing = await TrainingService.getById(resolvedParams.id);
  if (!existing) {
    return ApiErrors.notFound('Training record');
  }

  const body = await req.json();
  const validated = updateTrainingSchema.parse(body);

  const updated = await TrainingService.update({
    id: resolvedParams.id,
    courseName: validated.courseName,
    completedDate: validated.completedDate,
    expiryDate: validated.expiryDate,
    certificateUrl: validated.certificateUrl,
  });

  if (!updated) {
    return ApiErrors.notFound('Training record');
  }

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TRAINING_UPDATED',
    entityType: 'TRAINING',
    entityId: resolvedParams.id,
    description: `Updated training record: ${existing.courseName}`,
  });

  return apiSuccess(updated);
});

export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const resolvedParams = await params;
  const existing = await TrainingService.getById(resolvedParams.id);
  if (!existing) {
    return ApiErrors.notFound('Training record');
  }

  await TrainingService.delete(resolvedParams.id);

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TRAINING_DELETED',
    entityType: 'TRAINING',
    entityId: resolvedParams.id,
    description: `Deleted training record: ${existing.courseName}`,
  });

  return apiSuccess({ deleted: true });
});
