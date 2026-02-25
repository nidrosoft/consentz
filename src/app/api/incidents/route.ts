import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { parsePagination } from '@/lib/pagination';
import { IncidentService } from '@/lib/services/incident-service';
import { NotificationService } from '@/lib/services/notification-service';
import { AuditService } from '@/lib/services/audit-service';
import { createIncidentSchema, incidentFilterSchema } from '@/lib/validations/incident';

export const GET = withAuth(async (req, { params, auth }) => {
  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams);

  const rawFilters = incidentFilterSchema.parse({
    category: searchParams.get('category') ?? undefined,
    severity: searchParams.get('severity') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  });

  const filters: Record<string, unknown> = {};
  if (rawFilters.category) filters.category = rawFilters.category;
  if (rawFilters.severity) filters.severity = rawFilters.severity;
  if (rawFilters.status) filters.status = rawFilters.status;
  if (rawFilters.from) filters.dateFrom = rawFilters.from;
  if (rawFilters.to) filters.dateTo = rawFilters.to;

  const result = IncidentService.list({
    organizationId: auth.organizationId,
    pagination,
    filters,
  });

  return apiSuccess(result.data, result.meta);
});

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'STAFF');

  const body = await req.json();
  const validated = createIncidentSchema.parse(body);

  const incident = IncidentService.create({
    organizationId: auth.organizationId,
    title: validated.title,
    description: validated.description,
    severity: validated.severity as 'CRITICAL' | 'MAJOR' | 'MINOR' | 'NEAR_MISS',
    reportedBy: auth.fullName,
    category: validated.category,
    domain: 'safe',
  });

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'INCIDENT_REPORTED',
    entityType: 'INCIDENT',
    entityId: incident.id,
    description: `Reported incident: ${validated.title}`,
  });

  // Create notification for severe incidents
  if (validated.severity === 'SEVERE' || validated.severity === 'CRITICAL') {
    NotificationService.create({
      organizationId: auth.organizationId,
      type: 'WARNING',
      title: 'Severe incident reported',
      message: `${validated.severity} incident: ${validated.title}`,
      priority: 'HIGH',
      entityType: 'INCIDENT',
      entityId: incident.id,
      actionUrl: `/incidents/${incident.id}`,
    });
  }

  return apiSuccess(incident, undefined, 201);
});
