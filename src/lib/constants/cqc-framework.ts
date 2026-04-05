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

export const KLOES = [
  { code: 'S1', title: 'Safeguarding', domain: 'safe' as DomainSlug },
  { code: 'S2', title: 'Risk Assessment & Management', domain: 'safe' as DomainSlug },
  { code: 'S3', title: 'Staffing Levels & Recruitment', domain: 'safe' as DomainSlug },
  { code: 'S4', title: 'Medicines Management', domain: 'safe' as DomainSlug },
  { code: 'S5', title: 'Infection Prevention & Control', domain: 'safe' as DomainSlug },
  { code: 'S6', title: 'Safety of Premises & Equipment', domain: 'safe' as DomainSlug },
  { code: 'E1', title: 'Assessment of Needs', domain: 'effective' as DomainSlug },
  { code: 'E2', title: 'Delivery of Evidence-Based Care', domain: 'effective' as DomainSlug },
  { code: 'E3', title: 'Nutrition & Hydration', domain: 'effective' as DomainSlug },
  { code: 'E4', title: 'Pain Management', domain: 'effective' as DomainSlug },
  { code: 'E5', title: 'Staff Training & Competence', domain: 'effective' as DomainSlug },
  { code: 'E6', title: 'Multi-Disciplinary Working', domain: 'effective' as DomainSlug },
  { code: 'E7', title: 'Consent to Care', domain: 'effective' as DomainSlug },
  { code: 'C1', title: 'Kindness, Respect & Compassion', domain: 'caring' as DomainSlug },
  { code: 'C2', title: 'Involvement in Care Planning', domain: 'caring' as DomainSlug },
  { code: 'C3', title: 'Privacy & Dignity', domain: 'caring' as DomainSlug },
  { code: 'R1', title: 'Person-Centred Care', domain: 'responsive' as DomainSlug },
  { code: 'R2', title: 'Complaints Handling', domain: 'responsive' as DomainSlug },
  { code: 'R3', title: 'End of Life Care', domain: 'responsive' as DomainSlug },
  { code: 'W1', title: 'Vision & Strategy', domain: 'well-led' as DomainSlug },
  { code: 'W2', title: 'Governance & Management', domain: 'well-led' as DomainSlug },
  { code: 'W3', title: 'Engagement & Involvement', domain: 'well-led' as DomainSlug },
  { code: 'W4', title: 'Continuous Improvement', domain: 'well-led' as DomainSlug },
  { code: 'W5', title: 'Partnerships & Communities', domain: 'well-led' as DomainSlug },
  { code: 'W6', title: 'Duty of Candour', domain: 'well-led' as DomainSlug },
] as const;

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
