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

  const result = await IncidentService.list({
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

  const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
    CRITICAL: 'CRITICAL',
    SEVERE: 'HIGH',
    MODERATE: 'MEDIUM',
    LOW: 'LOW',
    NEAR_MISS: 'LOW',
  };
  const categoryToIncidentType: Record<string, string> = {
    FALL: 'OTHER',
    MEDICATION_ERROR: 'MEDICATION_ERROR',
    SAFEGUARDING: 'SAFEGUARDING',
    INFECTION: 'INFECTION',
    PRESSURE_ULCER: 'COMPLICATION',
    INJURY: 'COMPLICATION',
    NEAR_MISS: 'NEAR_MISS',
    COMPLAINT: 'COMPLAINT',
    EQUIPMENT_FAILURE: 'PREMISES_INCIDENT',
    MISSING_PERSON: 'SAFEGUARDING',
    DEATH: 'OTHER',
    OTHER: 'OTHER',
  };
  const incidentType = categoryToIncidentType[validated.category] ?? 'OTHER';

  const incident = await IncidentService.create({
    organizationId: auth.organizationId,
    title: validated.title,
    description: validated.description,
    severity: severityMap[validated.severity] ?? 'MEDIUM',
    reportedBy: auth.fullName,
    incidentType,
    domains: ['safe'],
  });

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'INCIDENT_REPORTED',
    entityType: 'INCIDENT',
    entityId: incident.id,
    description: `Reported incident: ${validated.title}`,
  });

  // Create notification for severe incidents
  if (validated.severity === 'SEVERE' || validated.severity === 'CRITICAL') {
    await NotificationService.create({
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
