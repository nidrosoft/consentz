import { withPublic } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { REGULATIONS } from '@/lib/constants/cqc-framework';

const REGULATION_DESCRIPTIONS: Record<string, string> = {
  REG9: 'Care must be appropriate, meet needs, and reflect preferences.',
  REG10: 'Service users must be treated with dignity and respect.',
  REG11: 'Care must only be provided with consent (or in line with the Mental Capacity Act).',
  REG12: 'Care must be provided safely, including medicines management and infection control.',
  REG13: 'Service users must be protected from abuse and improper treatment.',
  REG14: 'Nutritional and hydration needs must be met.',
  REG15: 'Premises and equipment must be clean, secure, and fit for purpose.',
  REG16: 'There must be an accessible system for handling complaints.',
  REG17: 'Systems must ensure compliance, quality, and risk management.',
  REG18: 'Sufficient numbers of suitably qualified staff must be deployed.',
  REG19: 'Recruitment procedures must ensure staff are fit for their roles.',
  REG20: 'Providers must be open and transparent when things go wrong.',
  REG20A: 'CQC ratings must be displayed.',
};

export const GET = withPublic(async () => {
  const result = REGULATIONS.map((r) => ({
    code: r.code,
    title: r.title,
    description: REGULATION_DESCRIPTIONS[r.code] ?? '',
    domains: r.domains,
  }));

  return apiSuccess(result);
});
