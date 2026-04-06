import { withAuth } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';
import EVIDENCE_REQUIREMENTS, { getKloesForDomain, getKloeDefinition } from '@/lib/constants/cqc-evidence-requirements';
import type { ServiceType, DomainSlug } from '@/types';

const VALID_SERVICE_TYPES: ServiceType[] = ['AESTHETIC_CLINIC', 'CARE_HOME'];
const VALID_DOMAINS: DomainSlug[] = ['safe', 'effective', 'caring', 'responsive', 'well-led'];

export const GET = withAuth(async (req, { auth }) => {
  const { searchParams } = new URL(req.url);
  const serviceTypeParam = searchParams.get('serviceType') as ServiceType | null;
  const domain = searchParams.get('domain') as DomainSlug | null;
  const kloeCode = searchParams.get('kloe');

  const serviceType: ServiceType = serviceTypeParam && VALID_SERVICE_TYPES.includes(serviceTypeParam)
    ? serviceTypeParam
    : 'AESTHETIC_CLINIC';

  if (kloeCode) {
    const definition = getKloeDefinition(serviceType, kloeCode.toUpperCase());
    if (!definition) return apiError('BAD_REQUEST', `Unknown KLOE code: ${kloeCode}`);
    return apiSuccess(definition);
  }

  if (domain) {
    if (!VALID_DOMAINS.includes(domain)) return apiError('BAD_REQUEST', `Invalid domain: ${domain}`);
    return apiSuccess(getKloesForDomain(serviceType, domain));
  }

  return apiSuccess(EVIDENCE_REQUIREMENTS[serviceType]);
});
