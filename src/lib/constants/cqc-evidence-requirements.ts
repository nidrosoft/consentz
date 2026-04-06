import type { ServiceType, DomainSlug } from '@/types';

export type EvidenceSourceLabel = 'POLICY' | 'MANUAL_UPLOAD' | 'CONSENTZ' | 'CONSENTZ_MANUAL';

export const SOURCE_LABEL_DISPLAY: Record<EvidenceSourceLabel, string> = {
  POLICY: 'Policy',
  MANUAL_UPLOAD: 'Manual Upload',
  CONSENTZ: 'Consentz',
  CONSENTZ_MANUAL: 'Consentz / Manual',
};

export interface KloeEvidenceItem {
  id: string;
  description: string;
  sourceLabel: EvidenceSourceLabel;
}

export interface KloeDefinition {
  code: string;
  title: string;
  keyQuestion: string;
  description: string;
  regulations: string[];
  evidenceItems: KloeEvidenceItem[];
}

export interface ServiceTypeKloeConfig {
  [kloeCode: string]: KloeDefinition;
}

// =============================================================================
// SAFE DOMAIN — Aesthetic Clinics
// =============================================================================

const SAFE_CLINIC: ServiceTypeKloeConfig = {
  S1: {
    code: 'S1',
    title: 'Safeguarding',
    keyQuestion: 'How do systems, processes and practices keep people safe and safeguarded from abuse?',
    description: 'This KLOE is about whether the clinic has the right safeguarding systems, training, checks, and reporting processes in place to protect patients from abuse or improper treatment.',
    regulations: ['REG13', 'REG12', 'REG19', 'REG10'],
    evidenceItems: [
      { id: 'S1_EV01', description: 'A safeguarding policy that is current, clearly written, and aligned with local authority safeguarding procedures', sourceLabel: 'POLICY' },
      { id: 'S1_EV02', description: 'Evidence showing that all staff have completed safeguarding training and that training remains in date', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S1_EV03', description: 'DBS check records for all relevant staff members', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S1_EV04', description: 'A safeguarding incident and referral log showing concerns raised, actions taken, and referrals made where necessary', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S1_EV05', description: 'A whistleblowing policy that explains how staff can raise concerns safely', sourceLabel: 'POLICY' },
      { id: 'S1_EV06', description: 'A chaperone policy explaining when chaperones should be offered and records showing chaperone availability or use where relevant', sourceLabel: 'POLICY' },
    ],
  },
  S2: {
    code: 'S2',
    title: 'Risk Assessment',
    keyQuestion: 'How are risks assessed and managed so people stay safe?',
    description: 'This KLOE is about whether the clinic identifies risks properly, documents them clearly, and manages them in a way that protects patients and staff.',
    regulations: ['REG12', 'REG15', 'REG17', 'REG20'],
    evidenceItems: [
      { id: 'S2_EV01', description: 'Clinical risk assessments for each treatment or procedure offered by the clinic', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S2_EV02', description: 'Written treatment or procedure protocols showing how risks are controlled in practice', sourceLabel: 'POLICY' },
      { id: 'S2_EV03', description: 'Records of emergency equipment checks, including resuscitation kit checks and maintenance records where applicable', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S2_EV04', description: 'Incident and accident records showing what happened, how it was handled, and any immediate actions taken', sourceLabel: 'CONSENTZ_MANUAL' },
      { id: 'S2_EV05', description: 'Environmental and premises safety audit records', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S2_EV06', description: 'Fire safety certificates and records of completed fire drills', sourceLabel: 'MANUAL_UPLOAD' },
    ],
  },
  S3: {
    code: 'S3',
    title: 'Safe Information',
    keyQuestion: 'Do staff have all the information they need to deliver safe care?',
    description: 'This KLOE is about whether staff can access accurate and complete patient information, so that care is delivered safely and with continuity.',
    regulations: ['REG12', 'REG17', 'REG9'],
    evidenceItems: [
      { id: 'S3_EV01', description: 'Complete patient records showing relevant consultation, treatment, and follow-up information for each patient', sourceLabel: 'CONSENTZ' },
      { id: 'S3_EV02', description: 'A handover process or handover procedure showing how important patient information is passed between staff members', sourceLabel: 'POLICY' },
      { id: 'S3_EV03', description: 'A system or record showing how test results are managed, reviewed, and followed up', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S3_EV04', description: 'Referral tracking records showing when referrals are made and whether they are followed through', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S3_EV05', description: 'Information-sharing protocols showing how patient information is shared appropriately and securely between staff', sourceLabel: 'POLICY' },
      { id: 'S3_EV06', description: 'Evidence that clinical notes are completed consistently and to the expected standard', sourceLabel: 'CONSENTZ_MANUAL' },
    ],
  },
  S4: {
    code: 'S4',
    title: 'Medicines Management',
    keyQuestion: 'How does the provider ensure proper and safe use of medicines?',
    description: 'This KLOE is about whether medicines are prescribed, stored, handled, and monitored safely and appropriately.',
    regulations: ['REG12', 'REG17'],
    evidenceItems: [
      { id: 'S4_EV01', description: 'A medicines management policy covering prescribing, storage, administration, and monitoring', sourceLabel: 'POLICY' },
      { id: 'S4_EV02', description: 'Prescribing protocols that explain how prescribing decisions are made and documented safely', sourceLabel: 'POLICY' },
      { id: 'S4_EV03', description: 'Staff competency records showing who is trained and authorised to handle or administer medicines', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S4_EV04', description: 'A controlled drugs register where controlled drugs are used or stored', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S4_EV05', description: 'Fridge temperature logs or other storage temperature records for medicines requiring temperature control', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S4_EV06', description: 'Medication audit records showing regular checks of medicines handling and documentation', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S4_EV07', description: 'Records of adverse drug reaction reporting or escalation where this has occurred', sourceLabel: 'MANUAL_UPLOAD' },
    ],
  },
  S5: {
    code: 'S5',
    title: 'Infection Prevention & Control',
    keyQuestion: 'How well are people protected by infection prevention and control?',
    description: 'This KLOE is about whether the clinic has proper systems to prevent infection, maintain cleanliness, and reduce cross-contamination risk.',
    regulations: ['REG12', 'REG15'],
    evidenceItems: [
      { id: 'S5_EV01', description: 'An infection prevention and control policy that is current and relevant to the clinic\'s services', sourceLabel: 'POLICY' },
      { id: 'S5_EV02', description: 'Cleaning schedules and cleaning completion records for clinical and non-clinical areas', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S5_EV03', description: 'Hand hygiene audit results or records of hand hygiene monitoring', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S5_EV04', description: 'Records showing PPE availability and stock management where applicable', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S5_EV05', description: 'Equipment decontamination logs or cleaning records for reusable equipment', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S5_EV06', description: 'Sharps disposal records and evidence of compliant sharps handling', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S5_EV07', description: 'Clinical waste management records', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S5_EV08', description: 'Records of infection-related incidents and actions taken in response', sourceLabel: 'CONSENTZ_MANUAL' },
    ],
  },
  S6: {
    code: 'S6',
    title: 'Learning from Incidents',
    keyQuestion: 'Are lessons learned when things go wrong?',
    description: 'This KLOE is about whether the clinic reviews incidents properly, learns from mistakes, and uses that learning to improve safety and quality.',
    regulations: ['REG17', 'REG20'],
    evidenceItems: [
      { id: 'S6_EV01', description: 'An incident reporting system or incident log showing how safety events are recorded', sourceLabel: 'CONSENTZ_MANUAL' },
      { id: 'S6_EV02', description: 'Significant Event Analysis or equivalent incident review reports showing what happened and what was learned', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S6_EV03', description: 'Action plans showing what changes were introduced after incidents or errors', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S6_EV04', description: 'Trend analysis reports showing recurring themes or repeated issues over time', sourceLabel: 'CONSENTZ_MANUAL' },
      { id: 'S6_EV05', description: 'Staff meeting minutes showing that learning from incidents was discussed with the team', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S6_EV06', description: 'Duty of candour records or correspondence where relevant', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S6_EV07', description: 'Audit cycle records showing that changes were checked again to confirm improvement', sourceLabel: 'MANUAL_UPLOAD' },
    ],
  },
};

// =============================================================================
// SAFE DOMAIN — Care Homes
// =============================================================================

const SAFE_CARE_HOME: ServiceTypeKloeConfig = {
  S1: {
    code: 'S1',
    title: 'Safeguarding',
    keyQuestion: 'How do systems, processes and practices safeguard people from abuse?',
    description: 'This KLOE is about whether the care home has proper safeguarding systems, trained staff, and clear processes to protect residents from abuse or neglect.',
    regulations: ['REG13', 'REG12', 'REG19', 'REG10'],
    evidenceItems: [
      { id: 'S1_CH_EV01', description: 'A safeguarding policy aligned with local Safeguarding Adults Board procedures', sourceLabel: 'POLICY' },
      { id: 'S1_CH_EV02', description: 'Evidence showing all staff have completed safeguarding training and remain in date', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S1_CH_EV03', description: 'DBS checks for all relevant staff members', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S1_CH_EV04', description: 'A safeguarding referral log showing concerns raised and referrals made', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S1_CH_EV05', description: 'Protection plans for residents identified as being at risk', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S1_CH_EV06', description: 'Staff recruitment files showing Schedule 3 or equivalent safer recruitment checks', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S1_CH_EV07', description: 'Evidence showing residents know how to raise concerns or report abuse', sourceLabel: 'MANUAL_UPLOAD' },
    ],
  },
  S2: {
    code: 'S2',
    title: 'Risk Assessment',
    keyQuestion: 'How are risks assessed and managed while respecting people\'s freedom?',
    description: 'This KLOE is about whether risks to residents are assessed properly and managed in a way that keeps them safe without unnecessarily restricting them.',
    regulations: ['REG12', 'REG13', 'REG15', 'REG17'],
    evidenceItems: [
      { id: 'S2_CH_EV01', description: 'Individual risk assessments covering falls, mobility, pressure ulcers, choking, nutrition, and moving and handling', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S2_CH_EV02', description: 'Care plans showing how risks are managed while still respecting resident choice and independence', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S2_CH_EV03', description: 'Accident and incident records showing what happened and what actions were taken', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S2_CH_EV04', description: 'DoLS applications and authorisations where applicable', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S2_CH_EV05', description: 'A restraint policy showing the use of least restrictive practice', sourceLabel: 'POLICY' },
      { id: 'S2_CH_EV06', description: 'Environmental risk assessments for the premises', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S2_CH_EV07', description: 'Fire risk assessments and records of fire drills', sourceLabel: 'MANUAL_UPLOAD' },
    ],
  },
  S3: {
    code: 'S3',
    title: 'Staffing',
    keyQuestion: 'Are there sufficient suitable staff to keep people safe?',
    description: 'This KLOE is about whether the home has enough competent staff on duty, with the right skills and support to care for residents safely.',
    regulations: ['REG18', 'REG12', 'REG19'],
    evidenceItems: [
      { id: 'S3_CH_EV01', description: 'Dependency or acuity assessments showing how staffing levels are determined based on resident needs', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S3_CH_EV02', description: 'Duty rotas showing planned staffing levels compared with actual staffing levels', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S3_CH_EV03', description: 'Agency staff induction records showing temporary staff are safely oriented before working', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S3_CH_EV04', description: 'A training matrix showing mandatory and role-specific training compliance', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S3_CH_EV05', description: 'Competency assessment records for key care tasks', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S3_CH_EV06', description: 'Staff feedback records relating to workload and staffing sufficiency', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S3_CH_EV07', description: 'Resident or family feedback on staff availability and responsiveness', sourceLabel: 'MANUAL_UPLOAD' },
    ],
  },
  S4: {
    code: 'S4',
    title: 'Medicines',
    keyQuestion: 'How is proper and safe use of medicines ensured?',
    description: 'This KLOE is about whether medicines are stored, recorded, administered, and reviewed safely within the home.',
    regulations: ['REG12', 'REG9'],
    evidenceItems: [
      { id: 'S4_CH_EV01', description: 'A medicines management policy aligned with relevant guidance for care homes', sourceLabel: 'POLICY' },
      { id: 'S4_CH_EV02', description: 'MAR charts showing medicines administered accurately and signed correctly', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S4_CH_EV03', description: 'Controlled drugs registers with evidence of required checks', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S4_CH_EV04', description: 'Room and fridge temperature logs for medicines storage', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S4_CH_EV05', description: 'Medication audit records showing regular review of medicines management', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S4_CH_EV06', description: 'Staff competency assessments for medicines administration', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S4_CH_EV07', description: 'Covert medication policy and related MCA assessments where relevant', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S4_CH_EV08', description: 'Self-administration risk assessments where residents manage their own medicines', sourceLabel: 'MANUAL_UPLOAD' },
    ],
  },
  S5: {
    code: 'S5',
    title: 'Infection Control',
    keyQuestion: 'How well are people protected by infection prevention and control?',
    description: 'This KLOE is about whether the home has effective infection control systems, including cleaning, outbreak management, hygiene, and safe environmental practices.',
    regulations: ['REG12', 'REG15'],
    evidenceItems: [
      { id: 'S5_CH_EV01', description: 'An infection prevention and control policy that includes outbreak management', sourceLabel: 'POLICY' },
      { id: 'S5_CH_EV02', description: 'Cleaning schedules and deep cleaning records', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S5_CH_EV03', description: 'Laundry and waste management procedures and records', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S5_CH_EV04', description: 'Hand hygiene audit results', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S5_CH_EV05', description: 'PPE availability and stock records', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S5_CH_EV06', description: 'Outbreak response logs where outbreaks or infection events have occurred', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S5_CH_EV07', description: 'Staff vaccination records where these are tracked as part of infection control practice', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S5_CH_EV08', description: 'Environmental infection control audit records', sourceLabel: 'MANUAL_UPLOAD' },
    ],
  },
  S6: {
    code: 'S6',
    title: 'Learning from Incidents',
    keyQuestion: 'Are lessons learned when things go wrong?',
    description: 'This KLOE is about whether the home reviews incidents, complaints, and errors properly and then uses that learning to improve care.',
    regulations: ['REG17', 'REG20'],
    evidenceItems: [
      { id: 'S6_CH_EV01', description: 'Incident analysis records showing how incidents are reviewed and understood', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S6_CH_EV02', description: 'Evidence showing changes or improvements made after incidents or errors', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S6_CH_EV03', description: 'Staff meeting records showing learning is shared across the team', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S6_CH_EV04', description: 'Quality improvement plans linked to issues identified through incidents or concerns', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S6_CH_EV05', description: 'Evidence showing that complaints are considered as part of the wider learning process', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S6_CH_EV06', description: 'Duty of candour letters or records where applicable', sourceLabel: 'MANUAL_UPLOAD' },
      { id: 'S6_CH_EV07', description: 'Re-audit records showing that changes were later reviewed to confirm improvement', sourceLabel: 'MANUAL_UPLOAD' },
    ],
  },
};

// =============================================================================
// EFFECTIVE DOMAIN — Aesthetic Clinics
// =============================================================================

const EFFECTIVE_CLINIC: ServiceTypeKloeConfig = {
  E1: { code: 'E1', title: 'Needs Assessment & Evidence-Based Care', keyQuestion: 'Are needs assessed and care delivered in line with evidence-based guidance?', description: 'This KLOE is about whether patient needs are properly assessed and whether treatment is delivered in line with recognised clinical standards and guidance.', regulations: ['REG9', 'REG12', 'REG10'], evidenceItems: [
    { id: 'E1_EV01', description: 'Initial consultation and assessment records showing that patient needs are properly documented', sourceLabel: 'CONSENTZ' },
    { id: 'E1_EV02', description: 'Treatment plans tailored to the patient\'s condition, preferences, and clinical needs', sourceLabel: 'CONSENTZ' },
    { id: 'E1_EV03', description: 'Evidence showing use of NICE guidance or relevant specialty guidance in treatment decisions', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E1_EV04', description: 'Outcome tracking records showing treatment progress or results over time', sourceLabel: 'CONSENTZ' },
    { id: 'E1_EV05', description: 'Review records showing that patients are reassessed as appropriate', sourceLabel: 'CONSENTZ' },
    { id: 'E1_EV06', description: 'Referral pathways showing when and how patients are escalated or referred elsewhere if needed', sourceLabel: 'POLICY' },
  ]},
  E2: { code: 'E2', title: 'Staff Skills & Competence', keyQuestion: 'Do staff have the skills, knowledge and experience to deliver effective care?', description: 'This KLOE is about whether staff are properly recruited, trained, supervised, and competent to deliver the services offered.', regulations: ['REG18', 'REG19', 'REG12'], evidenceItems: [
    { id: 'E2_EV01', description: 'Staff recruitment files showing qualifications, references, and employment checks', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E2_EV02', description: 'Induction records for new staff members', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E2_EV03', description: 'A training matrix showing mandatory and role-specific training completion', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E2_EV04', description: 'Competency assessment records for relevant clinical and operational tasks', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E2_EV05', description: 'Supervision and appraisal records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E2_EV06', description: 'Professional registration verification such as GMC or NMC checks where applicable', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  E3: { code: 'E3', title: 'Nutrition (Aesthetic Clinic)', keyQuestion: 'Nutrition and hydration support, if applicable', description: 'This KLOE is only relevant where the clinic provides services involving nutrition, hydration, or weight management support.', regulations: ['REG14', 'REG9'], evidenceItems: [
    { id: 'E3_EV01', description: 'Nutritional assessment records where relevant to the service offered', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E3_EV02', description: 'Dietary advice records or care documentation related to nutrition support', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E3_EV03', description: 'Outcome monitoring records such as weight or BMI tracking where applicable', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E3_EV04', description: 'Referral arrangements to dietitians or specialist services where needed', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  E4: { code: 'E4', title: 'Multi-Disciplinary Working', keyQuestion: 'How do staff, teams and services work together?', description: 'This KLOE is about whether the clinic communicates effectively with internal staff and external healthcare partners so that care is coordinated.', regulations: ['REG9', 'REG12'], evidenceItems: [
    { id: 'E4_EV01', description: 'MDT meeting records where multidisciplinary meetings are used', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E4_EV02', description: 'Referral and discharge communication records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E4_EV03', description: 'Shared care protocols with GPs or other specialists where relevant', sourceLabel: 'POLICY' },
    { id: 'E4_EV04', description: 'Information-sharing agreements with relevant third parties where needed', sourceLabel: 'POLICY' },
    { id: 'E4_EV05', description: 'Feedback or communication records from partner organisations where relevant', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  E5: { code: 'E5', title: 'Healthier Lives', keyQuestion: 'How are people supported to live healthier lives?', description: 'This KLOE is about whether patients are given information, support, or signposting that helps them maintain or improve their health beyond the immediate treatment.', regulations: ['REG9', 'REG12'], evidenceItems: [
    { id: 'E5_EV01', description: 'Health promotion materials or patient education resources available in the clinic', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E5_EV02', description: 'Records showing preventive care advice or related support where applicable', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E5_EV03', description: 'Lifestyle advice documented in patient notes where relevant', sourceLabel: 'CONSENTZ' },
    { id: 'E5_EV04', description: 'Signposting records or evidence of referrals to support services', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E5_EV05', description: 'Follow-up or recall systems used to support healthier outcomes', sourceLabel: 'CONSENTZ' },
  ]},
  E6: { code: 'E6', title: 'Consent (Aesthetic Clinic)', keyQuestion: 'Is consent sought in line with legislation and guidance?', description: 'This KLOE is about whether consent is obtained properly, whether patients are given sufficient information, and whether legal requirements around capacity and decision-making are followed.', regulations: ['REG11', 'REG9', 'REG10'], evidenceItems: [
    { id: 'E6_EV01', description: 'A consent policy that reflects the Mental Capacity Act and relevant clinical guidance', sourceLabel: 'POLICY' },
    { id: 'E6_EV02', description: 'Signed consent forms showing that consent was obtained before treatment', sourceLabel: 'CONSENTZ' },
    { id: 'E6_EV03', description: 'Capacity assessment records where capacity is in question or requires assessment', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E6_EV04', description: 'Staff training records relating to consent and the Mental Capacity Act', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E6_EV05', description: 'Documentation showing what information was given to the patient before consent was obtained', sourceLabel: 'CONSENTZ' },
    { id: 'E6_EV06', description: 'Evidence showing compliance with cooling-off periods for cosmetic procedures where required', sourceLabel: 'CONSENTZ' },
  ]},
};

// =============================================================================
// EFFECTIVE DOMAIN — Care Homes
// =============================================================================

const EFFECTIVE_CARE_HOME: ServiceTypeKloeConfig = {
  E1: { code: 'E1', title: 'Needs Assessment', keyQuestion: 'Are needs assessed and care delivered according to best practice?', description: 'This KLOE is about whether residents\' needs are assessed properly before and during care, and whether care is delivered according to good practice.', regulations: ['REG9', 'REG12', 'REG14'], evidenceItems: [
    { id: 'E1_CH_EV01', description: 'Pre-admission assessments showing that the home assessed needs before accepting the resident', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E1_CH_EV02', description: 'Person-centred care plans reflecting medical, emotional, and practical care needs', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E1_CH_EV03', description: 'Evidence showing use of NICE or other relevant care guidance', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E1_CH_EV04', description: 'Regular care plan review records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E1_CH_EV05', description: 'Outcome monitoring records showing how care effectiveness is reviewed', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E1_CH_EV06', description: 'MDT or other professional involvement records where relevant', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  E2: { code: 'E2', title: 'Staff Skills', keyQuestion: 'Do staff have the skills and knowledge to deliver effective care?', description: 'This KLOE is about whether staff are properly recruited, inducted, trained, supervised, and supported to provide effective care.', regulations: ['REG18', 'REG19'], evidenceItems: [
    { id: 'E2_CH_EV01', description: 'Staff recruitment files including qualifications and checks', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E2_CH_EV02', description: 'Induction records, including Care Certificate induction where applicable', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E2_CH_EV03', description: 'Training matrix covering mandatory and service-specific training', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E2_CH_EV04', description: 'Supervision records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E2_CH_EV05', description: 'Appraisal records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E2_CH_EV06', description: 'Professional registration checks where relevant', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  E3: { code: 'E3', title: 'Nutrition & Hydration', keyQuestion: 'How are people supported to eat and drink enough?', description: 'This KLOE is about whether residents\' nutrition and hydration needs are assessed, monitored, and supported properly.', regulations: ['REG14', 'REG12', 'REG9'], evidenceItems: [
    { id: 'E3_CH_EV01', description: 'MUST nutritional screening records completed on admission and reviewed as needed', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E3_CH_EV02', description: 'Dietary care plans showing preferences, risks, and support needs', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E3_CH_EV03', description: 'Food and fluid charts for residents who require monitoring', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E3_CH_EV04', description: 'Weight monitoring records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E3_CH_EV05', description: 'Menu planning records or evidence of varied and suitable meal provision', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E3_CH_EV06', description: 'SALT referral records for residents with swallowing difficulties where applicable', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E3_CH_EV07', description: 'Staff training records relating to nutrition, hydration, or dysphagia', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  E4: { code: 'E4', title: 'Working Together', keyQuestion: 'How do staff, teams and services work together?', description: 'This KLOE is about whether the home works effectively with internal teams and external health and care professionals.', regulations: ['REG9', 'REG17'], evidenceItems: [
    { id: 'E4_CH_EV01', description: 'GP visit records and communication records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E4_CH_EV02', description: 'District nurse liaison or specialist involvement records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E4_CH_EV03', description: 'Pharmacy review documentation', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E4_CH_EV04', description: 'Hospital discharge coordination records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E4_CH_EV05', description: 'MDT involvement records for residents with complex needs', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E4_CH_EV06', description: 'Information-sharing protocols where needed', sourceLabel: 'POLICY' },
    { id: 'E4_CH_EV07', description: 'Shift handover records', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  E5: { code: 'E5', title: 'Healthier Lives', keyQuestion: 'How are people supported to live healthier lives?', description: 'This KLOE is about whether the home supports residents\' broader health, wellbeing, mobility, and preventative care needs.', regulations: ['REG9'], evidenceItems: [
    { id: 'E5_CH_EV01', description: 'Records showing access to health screening such as dental, optical, or hearing support', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E5_CH_EV02', description: 'GP and specialist access records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E5_CH_EV03', description: 'Health promotion or wellbeing activity records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E5_CH_EV04', description: 'Exercise, mobility, or rehabilitation support records where relevant', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E5_CH_EV05', description: 'Mental health and emotional wellbeing support records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E5_CH_EV06', description: 'Social engagement or activity programme records', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  E6: { code: 'E6', title: 'Consent', keyQuestion: 'Is consent sought in line with legislation?', description: 'This KLOE is about whether residents\' decisions, mental capacity, best-interest decisions, and lawful authorisations are handled correctly.', regulations: ['REG11', 'REG9'], evidenceItems: [
    { id: 'E6_CH_EV01', description: 'A consent policy aligned with the Mental Capacity Act', sourceLabel: 'POLICY' },
    { id: 'E6_CH_EV02', description: 'Capacity assessment records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E6_CH_EV03', description: 'Best-interest decision records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E6_CH_EV04', description: 'DoLS applications and authorisations', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E6_CH_EV05', description: 'Advance decision documentation where relevant', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E6_CH_EV06', description: 'Lasting Power of Attorney records where relevant', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'E6_CH_EV07', description: 'Staff training records for MCA and DoLS', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
};

// =============================================================================
// CARING DOMAIN — Aesthetic Clinics
// =============================================================================

const CARING_CLINIC: ServiceTypeKloeConfig = {
  C1: { code: 'C1', title: 'Kindness & Compassion', keyQuestion: 'Are people treated with kindness, respect, compassion and given emotional support?', description: 'This KLOE is about whether patients are treated respectfully and compassionately, and whether the clinic demonstrates a caring approach in practice.', regulations: ['REG10', 'REG9'], evidenceItems: [
    { id: 'C1_EV01', description: 'Patient feedback or satisfaction survey results', sourceLabel: 'CONSENTZ' },
    { id: 'C1_EV02', description: 'A compliments log showing positive patient feedback received outside formal surveys', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C1_EV03', description: 'Customer care or values-based training records for staff', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C1_EV04', description: 'Evidence showing how emotional support is offered where appropriate', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C1_EV05', description: 'Chaperone availability arrangements and related information', sourceLabel: 'POLICY' },
  ]},
  C2: { code: 'C2', title: 'Involvement in Decisions', keyQuestion: 'Are people supported to express their views and be involved in decisions?', description: 'This KLOE is about whether patients are listened to, involved in decision-making, and supported to communicate their wishes and preferences.', regulations: ['REG9', 'REG10', 'REG11'], evidenceItems: [
    { id: 'C2_EV01', description: 'Records showing shared decision-making discussions in patient notes', sourceLabel: 'CONSENTZ' },
    { id: 'C2_EV02', description: 'Records showing patient involvement in care or treatment planning', sourceLabel: 'CONSENTZ' },
    { id: 'C2_EV03', description: 'Evidence of communication aids being available where needed', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C2_EV04', description: 'Interpreter or translation service arrangements where required', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C2_EV05', description: 'Advocacy referral processes or records where relevant', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  C3: { code: 'C3', title: 'Privacy & Dignity', keyQuestion: 'How are privacy and dignity respected?', description: 'This KLOE is about whether the clinic protects confidentiality, offers privacy during care, and respects patients\' dignity.', regulations: ['REG10', 'REG15'], evidenceItems: [
    { id: 'C3_EV01', description: 'A confidentiality policy covering patient privacy and handling of confidential information', sourceLabel: 'POLICY' },
    { id: 'C3_EV02', description: 'GDPR compliance documentation or related privacy compliance records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C3_EV03', description: 'Chaperone records where relevant to privacy and dignity during treatment', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C3_EV04', description: 'Equality and diversity training records supporting respectful care', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C3_EV05', description: 'Evidence that consultation and treatment spaces are arranged to protect privacy', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
};

// =============================================================================
// CARING DOMAIN — Care Homes
// =============================================================================

const CARING_CARE_HOME: ServiceTypeKloeConfig = {
  C1: { code: 'C1', title: 'Kindness & Compassion', keyQuestion: 'Are people treated with kindness, compassion and given emotional support?', description: 'This KLOE is about whether residents are treated respectfully, warmly, and with emotional support appropriate to their needs.', regulations: ['REG10', 'REG9'], evidenceItems: [
    { id: 'C1_CH_EV01', description: 'Resident and family feedback records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C1_CH_EV02', description: 'Compliments records or positive feedback logs', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C1_CH_EV03', description: 'Staff training relating to person-centred care or dignity', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C1_CH_EV04', description: 'Records or examples showing emotional support is provided appropriately', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C1_CH_EV05', description: 'Dementia-friendly care approach documentation where relevant', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C1_CH_EV06', description: 'Bereavement or emotional support records where relevant', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  C2: { code: 'C2', title: 'Involvement in Decisions', keyQuestion: 'Are people supported to express their views and be involved in decisions?', description: 'This KLOE is about whether residents and, where appropriate, families are involved in decisions about care and daily life.', regulations: ['REG9', 'REG10'], evidenceItems: [
    { id: 'C2_CH_EV01', description: 'Residents\' meeting minutes', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C2_CH_EV02', description: 'Care plan involvement records or signatures showing resident or family participation', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C2_CH_EV03', description: 'Communication aids used for residents with communication difficulties', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C2_CH_EV04', description: 'Advocacy referral records where relevant', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C2_CH_EV05', description: 'Family involvement records where appropriate', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C2_CH_EV06', description: 'Personal profile documents such as "This Is Me" or equivalent', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  C3: { code: 'C3', title: 'Privacy & Dignity', keyQuestion: 'How are privacy and dignity respected?', description: 'This KLOE is about whether residents\' personal privacy, dignity, and individual preferences are respected in everyday care.', regulations: ['REG10', 'REG15'], evidenceItems: [
    { id: 'C3_CH_EV01', description: 'A dignity and privacy policy', sourceLabel: 'POLICY' },
    { id: 'C3_CH_EV02', description: 'Records or evidence showing staff knock and wait before entering private rooms', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C3_CH_EV03', description: 'Records showing personal care is delivered privately and respectfully', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C3_CH_EV04', description: 'Confidentiality and secure records handling arrangements', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C3_CH_EV05', description: 'Evidence showing respect for personal belongings and private space', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'C3_CH_EV06', description: 'Records showing gender preferences or personal preferences are respected where relevant', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
};

// =============================================================================
// RESPONSIVE DOMAIN — Aesthetic Clinics
// =============================================================================

const RESPONSIVE_CLINIC: ServiceTypeKloeConfig = {
  R1: { code: 'R1', title: 'Personalised Care', keyQuestion: 'How do people receive personalised care that is responsive to their needs?', description: 'This KLOE is about whether the clinic adapts care to the individual, including preferences, accessibility needs, and practical requirements.', regulations: ['REG9', 'REG10', 'REG11'], evidenceItems: [
    { id: 'R1_EV01', description: 'Individual treatment plans tailored to the person\'s needs', sourceLabel: 'CONSENTZ' },
    { id: 'R1_EV02', description: 'Records showing patient preferences are documented and acted on where relevant', sourceLabel: 'CONSENTZ' },
    { id: 'R1_EV03', description: 'Records or arrangements showing reasonable adjustments for disabled patients', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R1_EV04', description: 'Appointment flexibility options recorded in practice or scheduling processes', sourceLabel: 'CONSENTZ' },
    { id: 'R1_EV05', description: 'Translation or interpretation service arrangements where relevant', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  R2: { code: 'R2', title: 'Complaints', keyQuestion: 'How are concerns and complaints gathered and acted upon?', description: 'This KLOE is about whether patients can raise complaints easily and whether complaints are investigated, responded to, and used to improve the service.', regulations: ['REG16', 'REG17', 'REG20'], evidenceItems: [
    { id: 'R2_EV01', description: 'A complaints policy explaining how complaints are raised, investigated, and responded to', sourceLabel: 'POLICY' },
    { id: 'R2_EV02', description: 'A complaints log showing complaints, outcomes, and response dates', sourceLabel: 'CONSENTZ_MANUAL' },
    { id: 'R2_EV03', description: 'Complaint response letters or formal response records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R2_EV04', description: 'Records showing improvements made as a result of complaints', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R2_EV05', description: 'Patient feedback mechanisms or tools used to gather concerns and feedback', sourceLabel: 'CONSENTZ' },
  ]},
  R3: { code: 'R3', title: 'Timely Access', keyQuestion: 'How do people access care in a timely way?', description: 'This KLOE is about whether patients can access appointments in a timely way and whether the clinic monitors delays, availability, and missed appointments.', regulations: ['REG12', 'REG9', 'REG17'], evidenceItems: [
    { id: 'R3_EV01', description: 'Appointment availability data showing slots, booking volumes, or scheduling capacity', sourceLabel: 'CONSENTZ' },
    { id: 'R3_EV02', description: 'Waiting time data showing the time between booking and appointment or treatment', sourceLabel: 'CONSENTZ' },
    { id: 'R3_EV03', description: 'DNA rate data and follow-up actions for missed appointments', sourceLabel: 'CONSENTZ' },
    { id: 'R3_EV04', description: 'Evidence showing urgent appointment availability where relevant', sourceLabel: 'CONSENTZ' },
    { id: 'R3_EV05', description: 'Out-of-hours arrangements or related access information', sourceLabel: 'POLICY' },
    { id: 'R3_EV06', description: 'Patient feedback relating to access and responsiveness', sourceLabel: 'CONSENTZ' },
  ]},
};

// =============================================================================
// RESPONSIVE DOMAIN — Care Homes
// =============================================================================

const RESPONSIVE_CARE_HOME: ServiceTypeKloeConfig = {
  R1: { code: 'R1', title: 'Personalised Care', keyQuestion: 'How do people receive personalised care responsive to their needs?', description: 'This KLOE is about whether care is adapted to the individual\'s preferences, routines, identity, and changing needs.', regulations: ['REG9', 'REG10'], evidenceItems: [
    { id: 'R1_CH_EV01', description: 'Detailed personal profiles or "All About Me" style documents', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R1_CH_EV02', description: 'Care plans reflecting individual preferences, routines, and needs', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R1_CH_EV03', description: 'Records showing flexible daily routines where appropriate', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R1_CH_EV04', description: 'Meaningful activities programme records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R1_CH_EV05', description: 'Records showing cultural, religious, or personal identity needs are supported', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R1_CH_EV06', description: 'Reasonable adjustment records where relevant', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  R2: { code: 'R2', title: 'Complaints', keyQuestion: 'How are concerns and complaints gathered and acted upon?', description: 'This KLOE is about whether residents and families can raise complaints easily and whether the home responds properly and improves as a result.', regulations: ['REG16', 'REG17'], evidenceItems: [
    { id: 'R2_CH_EV01', description: 'A complaints policy explaining how concerns and complaints are handled', sourceLabel: 'POLICY' },
    { id: 'R2_CH_EV02', description: 'A complaints log showing complaints raised, investigations, and outcomes', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R2_CH_EV03', description: 'Complaint response letters or equivalent response records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R2_CH_EV04', description: 'Evidence showing improvements made as a result of complaints', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R2_CH_EV05', description: 'Records of informal concerns or low-level issues where these are tracked', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R2_CH_EV06', description: '"You said, we did" or equivalent improvement communication records', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  R3: { code: 'R3', title: 'End of Life Care', keyQuestion: 'How are people supported at end of life?', description: 'This KLOE is about whether residents at end of life are supported with dignity, comfort, planning, and appropriate clinical coordination.', regulations: ['REG9', 'REG10', 'REG11'], evidenceItems: [
    { id: 'R3_CH_EV01', description: 'Advance care plans documenting wishes and preferences', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R3_CH_EV02', description: 'DNACPR forms completed appropriately where relevant', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R3_CH_EV03', description: 'Preferred place of death records where discussed and documented', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R3_CH_EV04', description: 'Pain assessment records such as Abbey Pain Scale or equivalent', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R3_CH_EV05', description: 'Symptom management protocols or records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R3_CH_EV06', description: 'Anticipatory medication arrangements where relevant', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R3_CH_EV07', description: 'Family involvement records and communication records during end-of-life care', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R3_CH_EV08', description: 'Records showing comfort and dignity measures taken', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R3_CH_EV09', description: 'Bereavement support records for families where relevant', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'R3_CH_EV10', description: 'Collaboration records with hospice or palliative care teams where relevant', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
};

// =============================================================================
// WELL-LED DOMAIN — Aesthetic Clinics
// =============================================================================

const WELL_LED_CLINIC: ServiceTypeKloeConfig = {
  W1: { code: 'W1', title: 'Leadership', keyQuestion: 'Is there leadership capacity and capability to deliver high-quality care?', description: 'This KLOE is about whether the clinic has competent leaders, appropriate oversight, and people in place who are fit to run the service.', regulations: ['REG7', 'REG17', 'REG5'], evidenceItems: [
    { id: 'W1_EV01', description: 'An organisational structure chart showing key roles and reporting lines', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W1_EV02', description: 'Records showing leader qualifications, experience, or relevant professional background', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W1_EV03', description: 'Fit and proper person checks for directors or senior leaders where applicable', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W1_EV04', description: 'Succession planning or contingency planning documentation for leadership continuity', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W1_EV05', description: 'Staff feedback relating to leadership quality or visibility', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  W2: { code: 'W2', title: 'Vision & Strategy', keyQuestion: 'Is there a clear vision and strategy?', description: 'This KLOE is about whether the clinic has a defined direction, clear values, and a plan for maintaining or improving quality.', regulations: ['REG17'], evidenceItems: [
    { id: 'W2_EV01', description: 'A written vision or mission statement setting out the clinic\'s purpose and direction', sourceLabel: 'POLICY' },
    { id: 'W2_EV02', description: 'A business plan or strategic plan', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W2_EV03', description: 'Records showing stakeholder engagement in strategy where relevant', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W2_EV04', description: 'Evidence that the vision and strategy are communicated to staff', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W2_EV05', description: 'Progress review records showing how strategy is tracked over time', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  W3: { code: 'W3', title: 'Culture', keyQuestion: 'Is there a culture of high-quality, person-centred care?', description: 'This KLOE is about whether the culture is open, honest, patient-focused, and supportive of speaking up and improvement.', regulations: ['REG17', 'REG20', 'REG10'], evidenceItems: [
    { id: 'W3_EV01', description: 'Evidence that staff are aware of whistleblowing arrangements and how to raise concerns', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W3_EV02', description: 'Staff engagement surveys and related action records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W3_EV03', description: 'Patient engagement or service-user feedback records', sourceLabel: 'CONSENTZ' },
    { id: 'W3_EV04', description: 'Evidence of openness and transparency in the culture of the clinic', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W3_EV05', description: 'Records showing recognition or support of staff contributions', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  W4: { code: 'W4', title: 'Accountability', keyQuestion: 'Are there clear responsibilities and systems for accountability?', description: 'This KLOE is about whether governance responsibilities are clearly assigned and whether formal oversight systems are in place.', regulations: ['REG17', 'REG20A'], evidenceItems: [
    { id: 'W4_EV01', description: 'Governance meeting minutes showing regular oversight of quality and compliance', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W4_EV02', description: 'Audit schedules and audit reports', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W4_EV03', description: 'A policy review schedule showing review dates and ownership', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W4_EV04', description: 'Job descriptions showing clear responsibilities and accountability', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W4_EV05', description: 'Evidence that CQC ratings are displayed where required', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  W5: { code: 'W5', title: 'Risk & Performance', keyQuestion: 'Are there clear processes for managing risks and performance?', description: 'This KLOE is about whether the clinic monitors risk, performance, and improvement in a structured and ongoing way.', regulations: ['REG17', 'REG12', 'REG20'], evidenceItems: [
    { id: 'W5_EV01', description: 'A risk register showing identified risks, owners, controls, and mitigations', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W5_EV02', description: 'A business continuity plan covering disruption scenarios and recovery arrangements', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W5_EV03', description: 'Performance dashboards or KPI reporting showing how the clinic tracks operational performance', sourceLabel: 'CONSENTZ' },
    { id: 'W5_EV04', description: 'Records of regular compliance checks or monitoring activity', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W5_EV05', description: 'Evidence of continuous improvement work or tracked improvements over time', sourceLabel: 'CONSENTZ_MANUAL' },
  ]},
  W6: { code: 'W6', title: 'Information Management', keyQuestion: 'Is information effectively managed?', description: 'This KLOE is about whether information governance, data protection, and use of data are managed properly and securely.', regulations: ['REG17'], evidenceItems: [
    { id: 'W6_EV01', description: 'ICO registration details where required', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W6_EV02', description: 'GDPR-related policies covering data protection and privacy', sourceLabel: 'POLICY' },
    { id: 'W6_EV03', description: 'Data security policies or records showing secure information handling and IT controls', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W6_EV04', description: 'Clinical audit results and records showing use of data for quality improvement', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W6_EV05', description: 'Records showing compliance with accessibility or information standards where relevant', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
};

// =============================================================================
// WELL-LED DOMAIN — Care Homes
// =============================================================================

const WELL_LED_CARE_HOME: ServiceTypeKloeConfig = {
  W1: { code: 'W1', title: 'Leadership', keyQuestion: 'Is there leadership capacity and capability?', description: 'This KLOE is about whether the home has capable management, visible leadership, and continuity of oversight.', regulations: ['REG7', 'REG17'], evidenceItems: [
    { id: 'W1_CH_EV01', description: 'Records showing a registered manager is in post where required', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W1_CH_EV02', description: 'Leadership training records for managers or senior staff', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W1_CH_EV03', description: 'Fit and proper person declarations or checks where relevant', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W1_CH_EV04', description: 'Succession planning or contingency arrangements for leadership continuity', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W1_CH_EV05', description: 'Staff feedback relating to management quality or support', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W1_CH_EV06', description: 'Evidence showing manager visibility and leadership presence within the home', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  W2: { code: 'W2', title: 'Vision & Strategy', keyQuestion: 'Is there a clear vision and strategy?', description: 'This KLOE is about whether the home has clear values, direction, and a strategy for maintaining and improving care quality.', regulations: ['REG17'], evidenceItems: [
    { id: 'W2_CH_EV01', description: 'A written vision and values statement', sourceLabel: 'POLICY' },
    { id: 'W2_CH_EV02', description: 'A business plan or strategic plan', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W2_CH_EV03', description: 'Records showing staff involvement in developing or understanding the vision', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W2_CH_EV04', description: 'Evidence showing the vision is communicated throughout the service', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W2_CH_EV05', description: 'Evidence showing values are reflected in practice or reviewed over time', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  W3: { code: 'W3', title: 'Culture', keyQuestion: 'Is there a culture of high-quality, person-centred care?', description: 'This KLOE is about whether the culture is open, respectful, resident-focused, and supportive of speaking up and continuous improvement.', regulations: ['REG17', 'REG20'], evidenceItems: [
    { id: 'W3_CH_EV01', description: 'Evidence of an open and honest culture, including how concerns are discussed', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W3_CH_EV02', description: 'A whistleblowing policy and evidence that staff know how to use it', sourceLabel: 'POLICY' },
    { id: 'W3_CH_EV03', description: 'Staff survey records and related actions', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W3_CH_EV04', description: 'Residents\' meeting records showing engagement and involvement', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W3_CH_EV05', description: 'Relatives\' meeting records where relevant', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W3_CH_EV06', description: 'Community involvement records where relevant', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  W4: { code: 'W4', title: 'Accountability', keyQuestion: 'Are there clear responsibilities and accountability?', description: 'This KLOE is about whether governance responsibilities are defined clearly and whether quality and compliance are reviewed formally.', regulations: ['REG17', 'REG20A'], evidenceItems: [
    { id: 'W4_CH_EV01', description: 'Governance meeting schedules and meeting minutes', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W4_CH_EV02', description: 'Audit programme records and audit results', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W4_CH_EV03', description: 'A policy register or policy review schedule showing review dates and ownership', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W4_CH_EV04', description: 'Job descriptions showing clear responsibilities', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W4_CH_EV05', description: 'Evidence that CQC ratings are displayed as required', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W4_CH_EV06', description: 'Notification submission records where required for statutory reporting', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  W5: { code: 'W5', title: 'Risk & Performance', keyQuestion: 'Are risks and performance managed effectively?', description: 'This KLOE is about whether the home tracks key risks, monitors quality, and follows through on improvement work.', regulations: ['REG17'], evidenceItems: [
    { id: 'W5_CH_EV01', description: 'A risk register showing service risks and mitigation actions', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W5_CH_EV02', description: 'A business continuity plan covering emergencies and service disruption', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W5_CH_EV03', description: 'Quality assurance monitoring records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W5_CH_EV04', description: 'KPI or performance tracking records where used', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W5_CH_EV05', description: 'Improvement project records showing active quality improvement work', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W5_CH_EV06', description: 'External audit or accreditation records where relevant', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
  W6: { code: 'W6', title: 'Partnership Working', keyQuestion: 'How does the service work in partnership with other agencies?', description: 'This KLOE is about whether the home works effectively with healthcare professionals, local authorities, and other relevant partners.', regulations: ['REG17', 'REG9'], evidenceItems: [
    { id: 'W6_CH_EV01', description: 'Regular GP liaison records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W6_CH_EV02', description: 'District nurse and specialist visit records', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W6_CH_EV03', description: 'Social worker involvement records where relevant', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W6_CH_EV04', description: 'Hospital liaison records for admissions and discharges', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W6_CH_EV05', description: 'Local authority monitoring or contract review records where relevant', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W6_CH_EV06', description: 'Community group engagement records where relevant', sourceLabel: 'MANUAL_UPLOAD' },
    { id: 'W6_CH_EV07', description: 'Volunteer programme records where relevant', sourceLabel: 'MANUAL_UPLOAD' },
  ]},
};

// =============================================================================
// Master lookup — indexed by service type → domain → KLOE config
// =============================================================================

const EVIDENCE_REQUIREMENTS: Record<ServiceType, Record<DomainSlug, ServiceTypeKloeConfig>> = {
  AESTHETIC_CLINIC: {
    safe: SAFE_CLINIC,
    effective: EFFECTIVE_CLINIC,
    caring: CARING_CLINIC,
    responsive: RESPONSIVE_CLINIC,
    'well-led': WELL_LED_CLINIC,
  },
  CARE_HOME: {
    safe: SAFE_CARE_HOME,
    effective: EFFECTIVE_CARE_HOME,
    caring: CARING_CARE_HOME,
    responsive: RESPONSIVE_CARE_HOME,
    'well-led': WELL_LED_CARE_HOME,
  },
};

export default EVIDENCE_REQUIREMENTS;

/** Get all KLOEs for a specific domain and service type. */
export function getKloesForDomain(serviceType: ServiceType, domain: DomainSlug): KloeDefinition[] {
  const config = EVIDENCE_REQUIREMENTS[serviceType]?.[domain];
  return config ? Object.values(config) : [];
}

/** Get a single KLOE definition by code and service type. */
export function getKloeDefinition(serviceType: ServiceType, kloeCode: string): KloeDefinition | undefined {
  const domainLetter = kloeCode.charAt(0);
  const domainMap: Record<string, DomainSlug> = { S: 'safe', E: 'effective', C: 'caring', R: 'responsive', W: 'well-led' };
  const domain = domainMap[domainLetter];
  if (!domain) return undefined;
  return EVIDENCE_REQUIREMENTS[serviceType]?.[domain]?.[kloeCode];
}

/** Get the evidence items for a specific KLOE and service type. */
export function getEvidenceItems(serviceType: ServiceType, kloeCode: string): KloeEvidenceItem[] {
  return getKloeDefinition(serviceType, kloeCode)?.evidenceItems ?? [];
}

/** Get all KLOE codes for a service type (respects service-type-specific content). */
export function getAllKloeCodes(serviceType: ServiceType): string[] {
  const codes: string[] = [];
  for (const domain of Object.values(EVIDENCE_REQUIREMENTS[serviceType] ?? {})) {
    codes.push(...Object.keys(domain));
  }
  return codes;
}

let knownEvidenceItemIds: ReadonlySet<string> | null = null;

function buildKnownEvidenceItemIdSet(): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const st of Object.keys(EVIDENCE_REQUIREMENTS) as ServiceType[]) {
    const byDomain = EVIDENCE_REQUIREMENTS[st];
    if (!byDomain) continue;
    for (const domain of Object.values(byDomain)) {
      for (const def of Object.values(domain)) {
        for (const item of def.evidenceItems) {
          ids.add(item.id);
        }
      }
    }
  }
  return ids;
}

/** All evidence item IDs defined across service types (for API validation). */
export function getKnownEvidenceItemIds(): ReadonlySet<string> {
  if (!knownEvidenceItemIds) {
    knownEvidenceItemIds = buildKnownEvidenceItemIdSet();
  }
  return knownEvidenceItemIds;
}

export function isKnownEvidenceItemId(id: string): boolean {
  return getKnownEvidenceItemIds().has(id);
}
