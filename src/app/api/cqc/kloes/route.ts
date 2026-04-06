import { withPublic } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { KLOES } from '@/lib/constants/cqc-framework';
import { getKloeDefinition, getAllKloeCodes } from '@/lib/constants/cqc-evidence-requirements';
import type { ServiceType, DomainSlug } from '@/types';

const VALID_SERVICE_TYPES: ServiceType[] = ['AESTHETIC_CLINIC', 'CARE_HOME'];

export const GET = withPublic(async (req) => {
  const { searchParams } = new URL(req.url);
  const domainFilter = searchParams.get('domain') as DomainSlug | null;
  const serviceTypeParam = searchParams.get('serviceType') as ServiceType | null;

  let filtered = domainFilter
    ? KLOES.filter((kloe) => kloe.domain === domainFilter.toLowerCase())
    : [...KLOES];

  if (serviceTypeParam && VALID_SERVICE_TYPES.includes(serviceTypeParam)) {
    const validCodes = new Set(getAllKloeCodes(serviceTypeParam));
    filtered = filtered
      .filter((kloe) => validCodes.has(kloe.code))
      .map((kloe) => {
        const def = getKloeDefinition(serviceTypeParam, kloe.code);
        if (!def) return kloe;
        return { ...kloe, title: def.title, keyQuestion: def.keyQuestion, regulations: def.regulations };
      });
  }

  return apiSuccess(filtered);
});
