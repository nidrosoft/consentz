import { withPublic } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';

const CQC_REGULATIONS = [
  { code: 'REG9', title: 'Person-centred care', description: 'Care must be appropriate, meet needs, and reflect preferences.' },
  { code: 'REG10', title: 'Dignity and respect', description: 'Service users must be treated with dignity and respect.' },
  { code: 'REG11', title: 'Need for consent', description: 'Care must only be provided with consent (or in line with the Mental Capacity Act).' },
  { code: 'REG12', title: 'Safe care and treatment', description: 'Care must be provided safely, including medicines management and infection control.' },
  { code: 'REG13', title: 'Safeguarding service users', description: 'Service users must be protected from abuse and improper treatment.' },
  { code: 'REG14', title: 'Meeting nutritional needs', description: 'Nutritional and hydration needs must be met.' },
  { code: 'REG15', title: 'Premises and equipment', description: 'Premises and equipment must be clean, secure, and fit for purpose.' },
  { code: 'REG16', title: 'Receiving and acting on complaints', description: 'There must be an accessible system for handling complaints.' },
  { code: 'REG17', title: 'Good governance', description: 'Systems must ensure compliance, quality, and risk management.' },
  { code: 'REG18', title: 'Staffing', description: 'Sufficient numbers of suitably qualified staff must be deployed.' },
  { code: 'REG19', title: 'Fit and proper persons employed', description: 'Recruitment procedures must ensure staff are fit for their roles.' },
  { code: 'REG20', title: 'Duty of candour', description: 'Providers must be open and transparent when things go wrong.' },
  { code: 'REG20A', title: 'Requirement as to display of performance assessments', description: 'CQC ratings must be displayed.' },
];

export const GET = withPublic(async (req, { params }) => {
  return apiSuccess(CQC_REGULATIONS);
});
