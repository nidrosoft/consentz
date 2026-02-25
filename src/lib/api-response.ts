import { NextResponse } from 'next/server';

// =============================================================================
// Standard API Response Contract
// =============================================================================

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | unknown;
  };
}

export function apiSuccess<T>(
  data: T,
  meta?: PaginationMeta | Record<string, unknown>,
  status = 200,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true as const, data, ...(meta && { meta }) }, { status });
}

export function apiError(
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      error: { code, message, ...(details ? { details } : {}) },
    },
    { status: statusCode },
  );
}

export const ApiErrors = {
  unauthorized: (msg = 'Authentication required') =>
    apiError('UNAUTHORIZED', msg, 401),

  forbidden: (msg = 'Insufficient permissions') =>
    apiError('FORBIDDEN', msg, 403),

  notFound: (entity = 'Resource') =>
    apiError('NOT_FOUND', `${entity} not found`, 404),

  badRequest: (msg: string, details?: unknown) =>
    apiError('BAD_REQUEST', msg, 400, details),

  validationError: (errors: ApiErrorDetail[]) =>
    apiError('VALIDATION_ERROR', 'Validation failed', 400, errors),

  conflict: (msg: string) =>
    apiError('CONFLICT', msg, 409),

  tooManyRequests: (msg = 'Rate limit exceeded') =>
    apiError('RATE_LIMITED', msg, 429),

  internal: (msg = 'An unexpected error occurred') =>
    apiError('INTERNAL_ERROR', msg, 500),

  serviceUnavailable: (msg = 'Service temporarily unavailable') =>
    apiError('SERVICE_UNAVAILABLE', msg, 503),

  fileTooLarge: (msg = 'File exceeds maximum size of 50MB') =>
    apiError('FILE_TOO_LARGE', msg, 413),

  unsupportedFileType: (type?: string) =>
    apiError('UNSUPPORTED_FILE_TYPE', type ? `File type "${type}" is not supported` : 'Unsupported file type', 415),

  assessmentIncomplete: (msg = 'Assessment must be completed before calculating') =>
    apiError('ASSESSMENT_INCOMPLETE', msg, 400),

  aiGenerationFailed: (msg = 'AI service returned an error') =>
    apiError('AI_GENERATION_FAILED', msg, 502),
};
