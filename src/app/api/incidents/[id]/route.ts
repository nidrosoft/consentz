import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { IncidentService } from '@/lib/services/incident-service';
import { AuditService } from '@/lib/services/audit-service';
import { updateIncidentSchema } from '@/lib/validations/incident';

export const GET = withAuth(async (req, { params, auth }) => {
  const incident = IncidentService.getById(params.id);

  if (!incident) {
    return ApiErrors.notFound('Incident');
  }

  return apiSuccess(incident);
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const existing = await IncidentService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Incident');
  }

  const body = await req.json();
  const validated = updateIncidentSchema.parse(body);

  const updated = await IncidentService.update({
    id: params.id,
    title: validated.title,
    description: validated.description,
    status: validated.status,
    rootCause: validated.rootCause,
    actionsTaken: validated.actionsTaken,
    lessonsLearned: validated.lessonsLearned,
    severity: validated.severity,
  });

  if (!updated) {
    return ApiErrors.notFound('Incident');
  }

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'INCIDENT_UPDATED',
    entityType: 'INCIDENT',
    entityId: params.id,
    description: `Updated incident: ${existing.title}${validated.status ? ` — status: ${validated.status}` : ''}`,
  });

  return apiSuccess(updated);
});
