import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { parsePagination } from '@/lib/pagination';
import { GapService } from '@/lib/services/gap-service';
import { gapFilterSchema } from '@/lib/validations/gap';
import type { DomainSlug, GapSeverity, GapStatus } from '@/types';

export const GET = withAuth(async (req, { params, auth }) => {
  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams);

  const rawFilters = gapFilterSchema.parse({
    status: searchParams.get('status') ?? undefined,
    severity: searchParams.get('severity') ?? undefined,
    domain: searchParams.get('domain') ?? undefined,
    source: searchParams.get('source') ?? undefined,
  });

  const filters: {
    status?: GapStatus;
    severity?: GapSeverity;
    domain?: DomainSlug;
  } = {};

  if (rawFilters.status) filters.status = rawFilters.status;
  if (rawFilters.severity) filters.severity = rawFilters.severity;
  if (rawFilters.domain) filters.domain = rawFilters.domain as DomainSlug;

  const result = await GapService.list({
    organizationId: auth.organizationId,
    pagination,
    filters,
  });

  return apiSuccess(result.data, result.meta);
});
