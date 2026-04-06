import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit-service';
import { recalculateComplianceScores } from '@/lib/services/score-engine';
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
  if (validated.e3NutritionNaAesthetic !== undefined) {
    if (existing.service_type !== 'AESTHETIC_CLINIC' && validated.e3NutritionNaAesthetic) {
      return ApiErrors.badRequest('E3 not-applicable flag applies to aesthetic clinics only.');
    }
    dbUpdate.e3_nutrition_na_aesthetic = validated.e3NutritionNaAesthetic;
  }

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

  if (validated.e3NutritionNaAesthetic !== undefined) {
    try {
      await recalculateComplianceScores(auth.organizationId);
    } catch {
      // Settings are saved; scores will refresh on next recalculation run if this fails.
    }
  }

  return apiSuccess(updated);
});

export const DELETE = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'OWNER');

  const client = await getDb();

  const { data: org } = await client.from('organizations')
    .select('name')
    .eq('id', auth.organizationId)
    .single();

  if (!org) {
    return ApiErrors.notFound('Organization');
  }

  const body = await req.json().catch(() => ({}));
  const confirmName = (body as { confirmName?: string }).confirmName;
  if (!confirmName || confirmName !== org.name) {
    return ApiErrors.badRequest('Organisation name does not match. Deletion cancelled.');
  }

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'ORGANIZATION_DELETED',
    entityType: 'ORGANIZATION',
    entityId: auth.organizationId,
    description: `Organisation "${org.name}" permanently deleted`,
  });

  const orgId = auth.organizationId;

  await Promise.all([
    client.from('onboarding_progress').delete().eq('organization_id', orgId),
    client.from('walkthrough_progress').delete().eq('organization_id', orgId),
    client.from('notifications').delete().eq('organization_id', orgId),
    client.from('sdk_keys').delete().eq('organization_id', orgId),
    client.from('kloe_evidence_status').delete().eq('organization_id', orgId),
  ]);

  await Promise.all([
    client.from('training_records').delete().eq('organization_id', orgId),
    client.from('assessment_responses').delete().in(
      'assessment_id',
      (await client.from('assessments').select('id').eq('organization_id', orgId)).data?.map((a: { id: string }) => a.id) ?? [],
    ),
  ]);

  await Promise.all([
    client.from('tasks').delete().eq('organization_id', orgId),
    client.from('incidents').delete().eq('organization_id', orgId),
    client.from('evidence_items').delete().eq('organization_id', orgId),
    client.from('policy_versions').delete().in(
      'policy_id',
      (await client.from('policies').select('id').eq('organization_id', orgId)).data?.map((p: { id: string }) => p.id) ?? [],
    ),
  ]);

  await Promise.all([
    client.from('policies').delete().eq('organization_id', orgId),
    client.from('staff_members').delete().eq('organization_id', orgId),
    client.from('compliance_gaps').delete().eq('organization_id', orgId),
    client.from('assessments').delete().eq('organization_id', orgId),
  ]);

  await Promise.all([
    client.from('domain_scores').delete().in(
      'compliance_score_id',
      (await client.from('compliance_scores').select('id').eq('organization_id', orgId)).data?.map((c: { id: string }) => c.id) ?? [],
    ),
  ]);

  await Promise.all([
    client.from('compliance_scores').delete().eq('organization_id', orgId),
    client.from('audit_logs').delete().eq('organization_id', orgId),
    client.from('consentz_connections').delete().eq('organization_id', orgId),
  ]);

  await client.from('users').update({ organization_id: null }).eq('organization_id', orgId);
  await client.from('organizations').delete().eq('id', orgId);

  return apiSuccess({ deleted: true });
});
