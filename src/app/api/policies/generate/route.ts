import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AIService } from '@/lib/services/ai-service';
import { PolicyService } from '@/lib/services/policy-service';
import { AuditService } from '@/lib/services/audit-service';
import { getTemplateByCode } from '@/lib/services/policy-template-service';
import { getDb } from '@/lib/db';
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

  // Load org for name + service type (used both as Claude context and for
  // filename personalisation).
  const db = await getDb();
  const { data: orgRow } = await db
    .from('organizations')
    .select('name, service_type')
    .eq('id', auth.organizationId)
    .maybeSingle();
  const orgName = (orgRow as { name?: string } | null)?.name ?? undefined;
  const serviceType = (orgRow as { service_type?: string } | null)?.service_type === 'CARE_HOME'
    ? 'CARE_HOME'
    : 'AESTHETIC_CLINIC';

  // When a Cura template code is supplied, load it and pass as RAG context.
  let referenceTemplate: Parameters<typeof AIService.generatePolicy>[0]['referenceTemplate'];
  if (validated.templateCode) {
    const tpl = await getTemplateByCode(validated.templateCode);
    if (!tpl) {
      return ApiErrors.notFound(`Cura template ${validated.templateCode}`);
    }
    referenceTemplate = {
      code: tpl.code,
      title: tpl.title,
      category: tpl.categoryLabel,
      contentText: tpl.contentText,
    };
  }

  const policyType = validated.templateCode ?? validated.templateId ?? 'Policy';

  let generated;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      generated = await AIService.generatePolicy({
        policyType,
        serviceType,
        organizationName: orgName,
        additionalContext: validated.customInstructions,
        referenceTemplate,
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

  const safeTitle = (generated.title || `${policyType} Policy`).slice(0, 250);

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
