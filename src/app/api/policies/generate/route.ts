import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AIService } from '@/lib/services/ai-service';
import { PolicyService } from '@/lib/services/policy-service';
import { AuditService } from '@/lib/services/audit-service';
import { generatePolicySchema } from '@/lib/validations/policy';
import { checkRateLimit } from '@/lib/rate-limiter';

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const rateCheck = checkRateLimit(auth.userId, 'aiGeneration');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const body = await req.json();
  const validated = generatePolicySchema.parse(body);

  const generated = await AIService.generatePolicy({
    organizationId: auth.organizationId,
    title: validated.templateId,
    category: 'General',
    serviceType: 'CARE_HOME',
    additionalContext: validated.customInstructions,
  });

  // Save as a DRAFT policy
  const policy = PolicyService.create({
    organizationId: auth.organizationId,
    title: generated.title,
    category: generated.category,
    content: generated.content,
    createdBy: auth.fullName,
    isAiGenerated: true,
  });

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'POLICY_AI_GENERATED',
    entityType: 'POLICY',
    entityId: policy.id,
    description: `AI-generated policy: ${generated.title}`,
  });

  return apiSuccess(
    { policy, linkedKloes: generated.linkedKloes },
    undefined,
    201,
  );
});
