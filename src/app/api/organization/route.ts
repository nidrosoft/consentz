import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit-service';
import { updateOrganizationSchema } from '@/lib/validations/organization';
import { getDb } from '@/lib/db';

export const GET = withAuth(async (req, { params, auth }) => {
  const client = await getDb();

  const { data: org } = await client.from('organizations')
    .select('*')
    .eq('id', auth.organizationId)
    .single();

  if (!org) {
    return ApiErrors.notFound('Organization');
  }

  const [
    { count: userCount },
    { count: staffCount },
    { count: policyCount },
    { count: evidenceCount },
  ] = await Promise.all([
    client.from('users').select('*', { count: 'exact', head: true }).eq('organization_id', auth.organizationId),
    client.from('staff_members').select('*', { count: 'exact', head: true }).eq('organization_id', auth.organizationId).eq('is_active', true),
    client.from('policies').select('*', { count: 'exact', head: true }).eq('organization_id', auth.organizationId).neq('status', 'ARCHIVED'),
    client.from('evidence_items').select('*', { count: 'exact', head: true }).eq('organization_id', auth.organizationId).neq('status', 'ARCHIVED'),
  ]);

  return apiSuccess({
    ...org,
    counts: { users: userCount ?? 0, activeStaff: staffCount ?? 0, policies: policyCount ?? 0, evidence: evidenceCount ?? 0 },
  });
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const client = await getDb();

  const { data: existing } = await client.from('organizations')
    .select('*')
    .eq('id', auth.organizationId)
    .single();

  if (!existing) {
    return ApiErrors.notFound('Organization');
  }

  const body = await req.json();
  const validated = updateOrganizationSchema.parse(body);

  const dbUpdate: Record<string, unknown> = {};
  if (validated.name !== undefined) dbUpdate.name = validated.name;
  if (validated.cqcProviderId !== undefined) dbUpdate.cqc_provider_id = validated.cqcProviderId;
  if (validated.cqcLocationId !== undefined) dbUpdate.cqc_location_id = validated.cqcLocationId;
  if (validated.cqcRegisteredName !== undefined) dbUpdate.cqc_registered_name = validated.cqcRegisteredName;
  if (validated.cqcCurrentRating !== undefined) dbUpdate.cqc_current_rating = validated.cqcCurrentRating;
  if (validated.cqcLastInspection !== undefined) dbUpdate.cqc_last_inspection = validated.cqcLastInspection;
  if (validated.cqcNextInspection !== undefined) dbUpdate.cqc_next_inspection = validated.cqcNextInspection;
  if (validated.address !== undefined) dbUpdate.address = validated.address;
  if (validated.city !== undefined) dbUpdate.city = validated.city;
  if (validated.postcode !== undefined) dbUpdate.postcode = validated.postcode;
  if (validated.phone !== undefined) dbUpdate.phone = validated.phone;
  if (validated.email !== undefined) dbUpdate.email = validated.email;
  if (validated.registeredManager !== undefined) dbUpdate.registered_manager = validated.registeredManager;
  if (validated.bedCount !== undefined) dbUpdate.bed_count = validated.bedCount;
  if (validated.staffCount !== undefined) dbUpdate.staff_count = validated.staffCount;

  const { data: updated } = await client.from('organizations')
    .update(dbUpdate)
    .eq('id', auth.organizationId)
    .select()
    .single();

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'ORGANIZATION_UPDATED',
    entityType: 'ORGANIZATION',
    entityId: auth.organizationId,
    description: 'Updated organization settings',
  });

  return apiSuccess(updated);
});
