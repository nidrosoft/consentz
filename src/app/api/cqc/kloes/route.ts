import { withPublic } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { KLOES } from '@/lib/constants/cqc-framework';

export const GET = withPublic(async (req, { params }) => {
  const { searchParams } = new URL(req.url);
  const domainFilter = searchParams.get('domain');

  if (domainFilter) {
    const filtered = KLOES.filter(
      (kloe) => kloe.domain === domainFilter.toLowerCase(),
    );
    return apiSuccess(filtered);
  }

  return apiSuccess(KLOES);
});
