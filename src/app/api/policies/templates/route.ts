import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';

const POLICY_TEMPLATES = [
  {
    id: 'safeguarding',
    name: 'Safeguarding Adults Policy',
    category: 'Health & Safety',
    description: 'Comprehensive safeguarding adults policy covering recognition, reporting, and prevention of abuse.',
    linkedKloes: ['S1'],
    linkedRegulations: ['REG13'],
  },
  {
    id: 'infection-control',
    name: 'Infection Prevention & Control',
    category: 'Clinical',
    description: 'Policy covering hand hygiene, PPE, waste management, and outbreak procedures.',
    linkedKloes: ['S5'],
    linkedRegulations: ['REG12'],
  },
  {
    id: 'medicines-management',
    name: 'Medicines Management Policy',
    category: 'Clinical',
    description: 'Policy for safe administration, storage, and disposal of medications.',
    linkedKloes: ['S4'],
    linkedRegulations: ['REG12'],
  },
  {
    id: 'complaints',
    name: 'Complaints Handling Procedure',
    category: 'Governance',
    description: 'Formal complaints procedure for service users, families, and stakeholders.',
    linkedKloes: ['R2'],
    linkedRegulations: ['REG16'],
  },
  {
    id: 'whistleblowing',
    name: 'Whistleblowing Policy',
    category: 'Governance',
    description: 'Policy for reporting concerns about malpractice, safety, or misconduct.',
    linkedKloes: ['W2', 'W6'],
    linkedRegulations: ['REG17'],
  },
  {
    id: 'mental-capacity',
    name: 'Mental Capacity Act & DoLS Policy',
    category: 'Clinical',
    description: 'Policy covering the Mental Capacity Act 2005 and Deprivation of Liberty Safeguards.',
    linkedKloes: ['E7'],
    linkedRegulations: ['REG11'],
  },
  {
    id: 'fire-safety',
    name: 'Fire Safety Policy',
    category: 'Health & Safety',
    description: 'Fire safety policy covering prevention, detection, evacuation, and training.',
    linkedKloes: ['S6'],
    linkedRegulations: ['REG15'],
  },
  {
    id: 'moving-handling',
    name: 'Moving & Handling Policy',
    category: 'Health & Safety',
    description: 'Safe moving and handling procedures to prevent injury to staff and service users.',
    linkedKloes: ['S2'],
    linkedRegulations: ['REG12'],
  },
  {
    id: 'data-protection',
    name: 'Data Protection & GDPR Policy',
    category: 'Governance',
    description: 'Policy covering data protection, confidentiality, and GDPR compliance.',
    linkedKloes: ['W2'],
    linkedRegulations: ['REG17'],
  },
  {
    id: 'end-of-life',
    name: 'End of Life Care Policy',
    category: 'Clinical',
    description: 'Policy for compassionate and dignified end of life care.',
    linkedKloes: ['R3', 'C1', 'C3'],
    linkedRegulations: ['REG9'],
  },
  {
    id: 'recruitment',
    name: 'Safer Recruitment Policy',
    category: 'Staff Management',
    description: 'Policy covering DBS checks, references, and fit and proper person requirements.',
    linkedKloes: ['S3'],
    linkedRegulations: ['REG19'],
  },
  {
    id: 'duty-of-candour',
    name: 'Duty of Candour Policy',
    category: 'Governance',
    description: 'Policy for meeting the statutory duty of candour when things go wrong.',
    linkedKloes: ['W6'],
    linkedRegulations: ['REG20'],
  },
];

export const GET = withAuth(async (req, { params, auth }) => {
  return apiSuccess(POLICY_TEMPLATES);
});
