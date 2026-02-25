import { z } from 'zod';

import type { PaginationMeta } from '@/lib/api-response';

// =============================================================================
// Pagination Utilities
// =============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export function parsePagination(searchParams: URLSearchParams): PaginationInput {
  return paginationSchema.parse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    sortBy: searchParams.get('sortBy') ?? undefined,
    sortOrder: searchParams.get('sortOrder') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  });
}

export function buildPagination(
  input: PaginationInput,
  total: number,
): { skip: number; take: number; meta: PaginationMeta } {
  const totalPages = Math.ceil(total / input.pageSize);
  return {
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    meta: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages,
      hasMore: input.page < totalPages,
    },
  };
}

/**
 * Apply pagination to an in-memory array.
 */
export function paginateArray<T>(
  items: T[],
  input: PaginationInput,
): { data: T[]; meta: PaginationMeta } {
  const total = items.length;
  const { skip, take, meta } = buildPagination(input, total);
  return { data: items.slice(skip, skip + take), meta };
}
