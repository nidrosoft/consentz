import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { parsePagination } from '@/lib/pagination';
import { TrainingService } from '@/lib/services/training-service';
import { ComplianceService } from '@/lib/services/compliance-service';
import { AuditService } from '@/lib/services/audit-service';
import { createTrainingSchema, trainingFilterSchema } from '@/lib/validations/training';

export const GET = withAuth(async (req, { params, auth }) => {
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  if (view === 'matrix') {
    const matrix = await TrainingService.getMatrix(auth.organizationId);
    return apiSuccess(matrix);
  }

  const pagination = parsePagination(searchParams);

  const rawFilters = trainingFilterSchema.parse({
    staffMemberId: searchParams.get('staffMemberId') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    expiringSoon: searchParams.get('expiringSoon') ?? undefined,
  });

  const result = await TrainingService.listAll({
    organizationId: auth.organizationId,
    pagination,
    filters: {
      staffId: rawFilters.staffMemberId,
    },
  });

  return apiSuccess(result.data, result.meta);
});

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const body = await req.json();
  const validated = createTrainingSchema.parse(body);

  const record = await TrainingService.create({
    organizationId: auth.organizationId,
    staffId: validated.staffMemberId,
    courseName: validated.courseName,
    completedDate: validated.completedDate,
    expiryDate: validated.expiryDate ?? '',
    certificateUrl: validated.certificateUrl,
  });

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TRAINING_CREATED',
    entityType: 'TRAINING',
    entityId: record.id,
    description: `Added training record: ${validated.courseName} for ${validated.staffMemberId}`,
  });

  await ComplianceService.queueRecalculation(auth.organizationId);

  return apiSuccess(record, undefined, 201);
});
