// =============================================================================
// Evidence Verification API — AI-powered CQC evidence validation
// POST /api/evidence/verify
//
// Thin handler that forwards to `verifyEvidenceFile` in
// `lib/services/evidence-verification-service.ts`, which is the shared core
// used by both this manual endpoint and the auto-verify hook in
// `/api/evidence-files` POST.
// =============================================================================

import { z } from 'zod';
import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import {
  verifyEvidenceFile,
  type VerificationResult,
} from '@/lib/services/evidence-verification-service';

export type { VerificationResult };

const requestSchema = z.object({
  evidenceItemId: z.string().optional(),
  fileVersionId: z.string().optional(),
  evidenceId: z.string().optional(),
  kloeCode: z.string().min(1),
  evidenceRequirementId: z.string().min(1),
  documentCategory: z.string().min(1),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileType: z.string().min(1),
});

export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'STAFF');

  const rateCheck = checkRateLimit(auth.userId, 'aiVerification');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.badRequest(parsed.error.issues.map((i) => i.message).join(', '));
  }

  try {
    const result = await verifyEvidenceFile({
      organizationId: auth.organizationId,
      ...parsed.data,
    });

    if (result.verificationStatus === 'error') {
      return ApiErrors.internal('AI verification failed. Please try again.');
    }

    return apiSuccess(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI verification failed.';
    return ApiErrors.badRequest(message);
  }
});
