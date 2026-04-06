import type { CqcRating, DomainSlug } from '@/types';

export const CQC_DOMAINS = [
  { id: 'safe', name: 'Safe', slug: 'safe' as DomainSlug, code: 'S', description: 'Are people safe?', color: '#3B82F6', icon: 'Shield' },
  { id: 'effective', name: 'Effective', slug: 'effective' as DomainSlug, code: 'E', description: 'Is care effective?', color: '#8B5CF6', icon: 'Target' },
  { id: 'caring', name: 'Caring', slug: 'caring' as DomainSlug, code: 'C', description: 'Is care caring?', color: '#EC4899', icon: 'Heart' },
  { id: 'responsive', name: 'Responsive', slug: 'responsive' as DomainSlug, code: 'R', description: 'Is care responsive to people\'s needs?', color: '#F59E0B', icon: 'Zap' },
  { id: 'well-led', name: 'Well-Led', slug: 'well-led' as DomainSlug, code: 'W', description: 'Is care well-led?', color: '#10B981', icon: 'Crown' },
] as const;

export const RATING_THRESHOLDS = {
  OUTSTANDING: 88,
  GOOD: 63,
  REQUIRES_IMPROVEMENT: 39,
  INADEQUATE: 0,
} as const;

export const RATING_COLORS: Record<CqcRating, string> = {
  OUTSTANDING: '#10B981',
  GOOD: '#3B82F6',
  REQUIRES_IMPROVEMENT: '#F59E0B',
  INADEQUATE: '#EF4444',
  NOT_RATED: '#6B7280',
};

export const RATING_LABELS: Record<CqcRating, string> = {
  OUTSTANDING: 'Outstanding',
  GOOD: 'Good',
  REQUIRES_IMPROVEMENT: 'Requires Improvement',
  INADEQUATE: 'Inadequate',
  NOT_RATED: 'Not Yet Rated',
};

export const SEVERITY_COLORS = {
  CRITICAL: '#DC2626',
  HIGH: '#F97316',
  MEDIUM: '#EAB308',
  LOW: '#6B7280',
} as const;

export interface KloeBase {
  code: string;
  title: string;
  domain: DomainSlug;
  keyQuestion: string;
  regulations: string[];
}

export const KLOES: readonly KloeBase[] = [
  { code: 'S1', title: 'Safeguarding', domain: 'safe', keyQuestion: 'How do systems, processes and practices keep people safe and safeguarded from abuse?', regulations: ['REG13', 'REG12', 'REG19', 'REG10'] },
  { code: 'S2', title: 'Risk assessment and management', domain: 'safe', keyQuestion: 'How are risks assessed and managed so people stay safe?', regulations: ['REG12', 'REG15', 'REG17', 'REG20'] },
  { code: 'S3', title: 'Staffing', domain: 'safe', keyQuestion: 'Are there sufficient suitable staff to keep people safe?', regulations: ['REG18', 'REG12', 'REG19'] },
  { code: 'S4', title: 'Medicines management', domain: 'safe', keyQuestion: 'How does the provider ensure proper and safe use of medicines?', regulations: ['REG12', 'REG17'] },
  { code: 'S5', title: 'Infection prevention and control', domain: 'safe', keyQuestion: 'How well are people protected by infection prevention and control?', regulations: ['REG12', 'REG15'] },
  { code: 'S6', title: 'Learning when things go wrong', domain: 'safe', keyQuestion: 'Are lessons learned when things go wrong?', regulations: ['REG17', 'REG20'] },
  { code: 'E1', title: 'Needs assessment and evidence-based care', domain: 'effective', keyQuestion: 'Are needs assessed and care delivered in line with evidence-based guidance?', regulations: ['REG9', 'REG12', 'REG10'] },
  { code: 'E2', title: 'Staff skills and experience', domain: 'effective', keyQuestion: 'Do staff have skills, knowledge and experience to deliver effective care?', regulations: ['REG18', 'REG19', 'REG12'] },
  { code: 'E3', title: 'Nutrition and hydration', domain: 'effective', keyQuestion: 'How are people supported with nutrition and hydration?', regulations: ['REG14', 'REG9'] },
  { code: 'E4', title: 'Working together', domain: 'effective', keyQuestion: 'How do staff, teams and services work together?', regulations: ['REG9', 'REG12'] },
  { code: 'E5', title: 'Healthier lives', domain: 'effective', keyQuestion: 'How are people supported to live healthier lives?', regulations: ['REG9', 'REG12'] },
  { code: 'E6', title: 'Consent', domain: 'effective', keyQuestion: 'Is consent sought in line with legislation and guidance?', regulations: ['REG11', 'REG9', 'REG10'] },
  { code: 'E7', title: 'Consent to care (additional)', domain: 'effective', keyQuestion: 'Is consent sought in line with legislation and guidance? (Extended assessment items)', regulations: ['REG11'] },
  { code: 'C1', title: 'Kindness, respect and compassion', domain: 'caring', keyQuestion: 'Are people treated with kindness, respect, compassion and given emotional support?', regulations: ['REG10', 'REG9'] },
  { code: 'C2', title: 'Involvement in decisions', domain: 'caring', keyQuestion: 'Are people supported to express views and be involved in decisions?', regulations: ['REG9', 'REG10', 'REG11'] },
  { code: 'C3', title: 'Privacy and dignity', domain: 'caring', keyQuestion: 'How are privacy and dignity respected?', regulations: ['REG10', 'REG15'] },
  { code: 'R1', title: 'Personalised responsive care', domain: 'responsive', keyQuestion: 'How do people receive personalised care responsive to their needs?', regulations: ['REG9', 'REG10', 'REG11'] },
  { code: 'R2', title: 'Concerns and complaints', domain: 'responsive', keyQuestion: 'How are concerns and complaints gathered and acted upon?', regulations: ['REG16', 'REG17', 'REG20'] },
  { code: 'R3', title: 'End of life care / Timely access', domain: 'responsive', keyQuestion: 'How are people supported at end of life? / How do people access care in a timely way?', regulations: ['REG9', 'REG10', 'REG11'] },
  { code: 'W1', title: 'Leadership capacity and capability', domain: 'well-led', keyQuestion: 'Is there leadership capacity and capability to deliver high-quality care?', regulations: ['REG7', 'REG17', 'REG5'] },
  { code: 'W2', title: 'Vision and strategy', domain: 'well-led', keyQuestion: 'Is there a clear vision and strategy?', regulations: ['REG17'] },
  { code: 'W3', title: 'Culture of person-centred care', domain: 'well-led', keyQuestion: 'Is there a culture of high-quality, person-centred care?', regulations: ['REG17', 'REG20', 'REG10'] },
  { code: 'W4', title: 'Responsibilities and accountability', domain: 'well-led', keyQuestion: 'Are there clear responsibilities and systems for accountability?', regulations: ['REG17', 'REG20A'] },
  { code: 'W5', title: 'Risks and performance', domain: 'well-led', keyQuestion: 'Are there clear processes for managing risks and performance?', regulations: ['REG17', 'REG12', 'REG20'] },
  { code: 'W6', title: 'Information management / Partnership working', domain: 'well-led', keyQuestion: 'Is information effectively managed? / Partnership working with other agencies', regulations: ['REG17'] },
];

export function getRatingFromScore(score: number): CqcRating {
  if (score >= RATING_THRESHOLDS.OUTSTANDING) return 'OUTSTANDING';
  if (score >= RATING_THRESHOLDS.GOOD) return 'GOOD';
  if (score >= RATING_THRESHOLDS.REQUIRES_IMPROVEMENT) return 'REQUIRES_IMPROVEMENT';
  return 'INADEQUATE';
}

// =============================================================================
// CQC Regulations (Health and Social Care Act 2008)
// =============================================================================

export const REGULATIONS = [
  { code: 'REG5', title: 'Fit and proper persons: directors', domains: ['well-led'] as DomainSlug[] },
  { code: 'REG7', title: 'Requirements relating to registered managers', domains: ['well-led'] as DomainSlug[] },
  { code: 'REG9', title: 'Person-centred care', domains: ['responsive'] as DomainSlug[] },
  { code: 'REG10', title: 'Dignity and respect', domains: ['caring'] as DomainSlug[] },
  { code: 'REG11', title: 'Need for consent', domains: ['effective'] as DomainSlug[] },
  { code: 'REG12', title: 'Safe care and treatment', domains: ['safe'] as DomainSlug[] },
  { code: 'REG13', title: 'Safeguarding service users from abuse and improper treatment', domains: ['safe'] as DomainSlug[] },
  { code: 'REG14', title: 'Meeting nutritional and hydration needs', domains: ['effective'] as DomainSlug[] },
  { code: 'REG15', title: 'Premises and equipment', domains: ['safe'] as DomainSlug[] },
  { code: 'REG16', title: 'Receiving and acting on complaints', domains: ['responsive'] as DomainSlug[] },
  { code: 'REG17', title: 'Good governance', domains: ['well-led'] as DomainSlug[] },
  { code: 'REG18', title: 'Staffing', domains: ['safe', 'effective'] as DomainSlug[] },
  { code: 'REG19', title: 'Fit and proper persons employed', domains: ['safe'] as DomainSlug[] },
  { code: 'REG20', title: 'Duty of candour', domains: ['well-led'] as DomainSlug[] },
  { code: 'REG20A', title: 'Requirement as to display of performance assessments', domains: ['well-led'] as DomainSlug[] },
] as const;

// =============================================================================
// Policy Templates — common policy categories for CQC compliance
// =============================================================================

export const POLICY_TEMPLATES = [
  { id: 'pt-1', title: 'Safeguarding Adults Policy', category: 'Safeguarding', description: 'Policy for protecting adults from abuse and neglect.', linkedKloes: ['S1'], linkedRegulations: ['REG13'] },
  { id: 'pt-2', title: 'Safeguarding Children Policy', category: 'Safeguarding', description: 'Policy for protecting children from abuse and neglect.', linkedKloes: ['S1'], linkedRegulations: ['REG13'] },
  { id: 'pt-3', title: 'Medicines Management Policy', category: 'Clinical', description: 'Safe handling, administration and storage of medicines.', linkedKloes: ['S4'], linkedRegulations: ['REG12'] },
  { id: 'pt-4', title: 'Infection Prevention & Control Policy', category: 'Clinical', description: 'Preventing and controlling the spread of infections.', linkedKloes: ['S5'], linkedRegulations: ['REG12'] },
  { id: 'pt-5', title: 'Risk Assessment Policy', category: 'Safety', description: 'Identifying, assessing and managing risks to service users.', linkedKloes: ['S2'], linkedRegulations: ['REG12'] },
  { id: 'pt-6', title: 'Health & Safety Policy', category: 'Safety', description: 'Ensuring a safe environment for staff and service users.', linkedKloes: ['S6'], linkedRegulations: ['REG15'] },
  { id: 'pt-7', title: 'Fire Safety Policy', category: 'Safety', description: 'Fire prevention, detection and evacuation procedures.', linkedKloes: ['S6'], linkedRegulations: ['REG15'] },
  { id: 'pt-8', title: 'Recruitment & Selection Policy', category: 'Staffing', description: 'Ensuring fit and proper persons are employed.', linkedKloes: ['S3'], linkedRegulations: ['REG19'] },
  { id: 'pt-9', title: 'Staff Training & Development Policy', category: 'Staffing', description: 'Ensuring staff competence through training.', linkedKloes: ['E5'], linkedRegulations: ['REG18'] },
  { id: 'pt-10', title: 'Complaints Policy', category: 'Governance', description: 'Receiving, investigating and responding to complaints.', linkedKloes: ['R2'], linkedRegulations: ['REG16', 'REG17', 'REG20'] },
  { id: 'pt-11', title: 'Consent Policy', category: 'Clinical', description: 'Obtaining and recording valid consent to care.', linkedKloes: ['E7'], linkedRegulations: ['REG11'] },
  { id: 'pt-12', title: 'Mental Capacity Act & DoLS Policy', category: 'Clinical', description: 'Compliance with the Mental Capacity Act 2005.', linkedKloes: ['E7'], linkedRegulations: ['REG11'] },
  { id: 'pt-13', title: 'Data Protection & GDPR Policy', category: 'Governance', description: 'Protecting personal data of service users and staff.', linkedKloes: ['W2'], linkedRegulations: ['REG17'] },
  { id: 'pt-14', title: 'Duty of Candour Policy', category: 'Governance', description: 'Open and transparent communication about safety incidents.', linkedKloes: ['W6'], linkedRegulations: ['REG17', 'REG20'] },
  { id: 'pt-15', title: 'Whistleblowing Policy', category: 'Governance', description: 'Supporting staff to raise concerns safely.', linkedKloes: ['W2'], linkedRegulations: ['REG17'] },
  { id: 'pt-16', title: 'Equality, Diversity & Inclusion Policy', category: 'Governance', description: 'Ensuring equitable treatment for all.', linkedKloes: ['C1', 'C3'], linkedRegulations: ['REG10', 'REG15'] },
  { id: 'pt-17', title: 'End of Life Care Policy', category: 'Clinical', description: 'Compassionate and dignified end of life care.', linkedKloes: ['R3'], linkedRegulations: ['REG9', 'REG12'] },
  { id: 'pt-18', title: 'Moving & Handling Policy', category: 'Safety', description: 'Safe manual handling of service users.', linkedKloes: ['S2'], linkedRegulations: ['REG12'] },
  { id: 'pt-19', title: 'Nutrition & Hydration Policy', category: 'Clinical', description: 'Meeting nutritional and hydration needs.', linkedKloes: ['E3'], linkedRegulations: ['REG14'] },
  { id: 'pt-20', title: 'Person-Centred Care Policy', category: 'Clinical', description: 'Delivering care tailored to individual needs.', linkedKloes: ['R1'], linkedRegulations: ['REG9', 'REG10', 'REG11'] },
  { id: 'pt-21', title: 'Service User Involvement in Care Planning Policy', category: 'Clinical', description: 'Ensuring service users and families are involved in care planning, reviews and shared decision-making.', linkedKloes: ['C2'], linkedRegulations: ['REG9', 'REG10', 'REG11'] },
  { id: 'pt-22', title: 'Assessment of Needs Policy', category: 'Clinical', description: 'Comprehensive assessment of individual care needs on admission and ongoing.', linkedKloes: ['E1'], linkedRegulations: ['REG9', 'REG12'] },
  { id: 'pt-23', title: 'Clinical Governance & Evidence-Based Care Policy', category: 'Clinical', description: 'Ensuring care delivery follows current evidence, NICE guidelines and best practice.', linkedKloes: ['E2'], linkedRegulations: ['REG12', 'REG18'] },
  { id: 'pt-24', title: 'Pain Management Policy', category: 'Clinical', description: 'Assessment, monitoring and management of pain for service users.', linkedKloes: ['E4'], linkedRegulations: ['REG9', 'REG12'] },
  { id: 'pt-25', title: 'Multi-Disciplinary Working Policy', category: 'Clinical', description: 'Coordination and collaboration across teams, services and external partners.', linkedKloes: ['E6'], linkedRegulations: ['REG9', 'REG17'] },
  { id: 'pt-26', title: 'Statement of Purpose & Vision Policy', category: 'Governance', description: 'Setting out the service vision, values and strategic direction.', linkedKloes: ['W1'], linkedRegulations: ['REG17'] },
  { id: 'pt-27', title: 'Staff Engagement & Involvement Policy', category: 'Governance', description: 'Engaging service users, families and staff in developing and improving services.', linkedKloes: ['W3'], linkedRegulations: ['REG9', 'REG17'] },
  { id: 'pt-28', title: 'Quality Improvement & Learning Policy', category: 'Governance', description: 'Driving continuous improvement through audits, learning from incidents and benchmarking.', linkedKloes: ['W4'], linkedRegulations: ['REG17'] },
  { id: 'pt-29', title: 'Partnership Working & Community Engagement Policy', category: 'Governance', description: 'Collaboration with external partners, commissioners and community organisations.', linkedKloes: ['W5'], linkedRegulations: ['REG12', 'REG17'] },
] as const;
