import { withPublic } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { CQC_DOMAINS } from '@/lib/constants/cqc-framework';

export const GET = withPublic(async (req, { params }) => {
  return apiSuccess(CQC_DOMAINS);
});
