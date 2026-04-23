// =============================================================================
// GET /api/policy-templates/:code/download
//
// Streams a personalised DOCX for the given Cura template code, with
// clinic-identity placeholders substituted from the caller's organisation.
// =============================================================================

import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/api-handler';
import { apiError } from '@/lib/api-response';
import { renderPolicyDocxForOrg } from '@/lib/services/policy-template-service';

export const GET = withAuth(async (_req, { params, auth }) => {
  const code = params.code;
  if (!code) return apiError('BAD_REQUEST', 'policy template code is required');

  const result = await renderPolicyDocxForOrg(code, auth.organizationId);
  if (!result) return apiError('NOT_FOUND', `Policy template ${code} not found`, 404);

  return new NextResponse(new Uint8Array(result.bytes), {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': String(result.bytes.length),
    },
  });
});
