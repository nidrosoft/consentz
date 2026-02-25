import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { parsePagination } from '@/lib/pagination';
import { PolicyService } from '@/lib/services/policy-service';
import { AuditService } from '@/lib/services/audit-service';
import { createPolicySchema, policyFilterSchema } from '@/lib/validations/policy';

export const GET = withAuth(async (req, { params, auth }) => {
  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams);

  const rawFilters = policyFilterSchema.parse({
    status: searchParams.get('status') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    isAiGenerated: searchParams.get('isAiGenerated') ?? undefined,
    reviewDueSoon: searchParams.get('reviewDueSoon') ?? undefined,
  });

  const result = PolicyService.list({
    organizationId: auth.organizationId,
    pagination,
    filters: rawFilters,
  });

  return apiSuccess(result.data, result.meta);
});

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const body = await req.json();
  const validated = createPolicySchema.parse(body);

  const policy = PolicyService.create({
    organizationId: auth.organizationId,
    title: validated.title,
    category: validated.category,
    content: validated.content,
    createdBy: auth.fullName,
  });

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'POLICY_CREATED',
    entityType: 'POLICY',
    entityId: policy.id,
    description: `Created policy: ${validated.title}`,
  });

  return apiSuccess(policy, undefined, 201);
});
