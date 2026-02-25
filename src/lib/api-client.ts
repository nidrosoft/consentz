// =============================================================================
// API Client — Typed fetch wrapper for calling API routes
// =============================================================================

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Typed fetch wrapper that enforces the standard API envelope.
 * Automatically parses JSON and throws ApiError on failure responses.
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<ApiSuccessResponse<T>> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new ApiError(
      res.status,
      json.error.code,
      json.error.message,
      json.error.details,
    );
  }

  return json;
}

// =============================================================================
// Convenience helpers
// =============================================================================

export function apiGet<T>(url: string) {
  return apiFetch<T>(url, { method: 'GET' });
}

export function apiPost<T>(url: string, body?: unknown) {
  return apiFetch<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(url: string, body: unknown) {
  return apiFetch<T>(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function apiDelete<T = void>(url: string) {
  return apiFetch<T>(url, { method: 'DELETE' });
}

/**
 * Build a query string from an object, omitting undefined/null values.
 */
export function buildQueryString<T extends object>(params: T): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => [k, String(v)]);
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries).toString();
}
