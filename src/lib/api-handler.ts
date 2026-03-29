import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { ApiErrors } from '@/lib/api-response';
import { AuthContext, AuthError, getAuthContext, resolveSessionAuth, type SessionAuth } from '@/lib/auth';

// =============================================================================
// API Route Handler Wrappers
// =============================================================================

type RouteContext = {
  params: Promise<Record<string, string>>;
};

type AuthenticatedHandler = (
  req: NextRequest,
  context: { params: Record<string, string>; auth: AuthContext },
) => Promise<NextResponse>;

type SessionHandler = (
  req: NextRequest,
  context: { params: Record<string, string>; auth: SessionAuth },
) => Promise<NextResponse>;

type PublicHandler = (
  req: NextRequest,
  context: { params: Record<string, string> },
) => Promise<NextResponse>;

/**
 * Wraps an authenticated route handler with auth + error handling.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, context: RouteContext) => {
    try {
      const auth = await getAuthContext();
      const params = await context.params;
      return await handler(req, { params, auth });
    } catch (error) {
      return handleError(error);
    }
  };
}

/** Authenticated user; organisation may be null (e.g. first onboarding step). */
export function withSession(handler: SessionHandler) {
  return async (req: NextRequest, context: RouteContext) => {
    try {
      const auth = await resolveSessionAuth();
      const params = await context.params;
      return await handler(req, { params, auth });
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Wraps a public route handler with error handling only.
 */
export function withPublic(handler: PublicHandler) {
  return async (req: NextRequest, context: RouteContext) => {
    try {
      const params = await context.params;
      return await handler(req, { params });
    } catch (error) {
      return handleError(error);
    }
  };
}

function handleError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return error.code === 'FORBIDDEN'
      ? ApiErrors.forbidden(error.message)
      : ApiErrors.unauthorized(error.message);
  }

  if (error instanceof z.ZodError) {
    return ApiErrors.validationError(
      error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    );
  }

  console.error('[API_ERROR]', error);
  return ApiErrors.internal();
}
