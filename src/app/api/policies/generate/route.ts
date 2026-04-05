import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AIService } from '@/lib/services/ai-service';
import { PolicyService } from '@/lib/services/policy-service';
import { AuditService } from '@/lib/services/audit-service';
import { generatePolicySchema } from '@/lib/validations/policy';
import { checkRateLimit } from '@/lib/rate-limiter';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const rateCheck = checkRateLimit(auth.userId, 'aiGeneration');
  if (!rateCheck.allowed) {
    const retryAfter = Math.ceil((rateCheck.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: `Rate limit exceeded. Try again in ${retryAfter} seconds.` } },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  const body = await req.json();
  const validated = generatePolicySchema.parse(body);

  let generated;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      generated = await AIService.generatePolicy({
        policyType: validated.templateId,
        serviceType: 'CARE_HOME',
        additionalContext: validated.customInstructions,
      });
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[PolicyGenerate] AI attempt ${attempt + 1} failed:`, lastError.message);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  if (!generated) {
    console.error('[PolicyGenerate] All AI attempts exhausted:', lastError?.message);
    return ApiErrors.internal('AI generation failed after multiple attempts. Please try again later.');
  }

  const safeTitle = (generated.title || `${validated.templateId} Policy`).slice(0, 250);

  const policy = await PolicyService.create({
    organizationId: auth.organizationId,
    title: safeTitle,
    content: generated.content,
    createdBy: auth.fullName,
    category: generated.category,
    isAiGenerated: true,
  });

  if (!policy) {
    return ApiErrors.internal('Failed to save the generated policy. Please try again.');
  }

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'POLICY_AI_GENERATED',
    entityType: 'POLICY',
    entityId: policy.id,
    description: `AI-generated policy: ${safeTitle}`,
  });

  return apiSuccess(
    { policy, linkedKloes: generated.linkedKloes },
    undefined,
    201,
  );
});
