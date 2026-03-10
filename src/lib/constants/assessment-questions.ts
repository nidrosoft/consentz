// Assessment Question Bank — All questions defined in code for type safety and versioning.
// Based on 07-ASSESSMENT-ENGINE.md specification.

export type CqcDomainType = 'SAFE' | 'EFFECTIVE' | 'CARING' | 'RESPONSIVE' | 'WELL_LED';
export type ServiceType = 'AESTHETIC_CLINIC' | 'CARE_HOME';
export type AnswerType = 'yes_no' | 'yes_no_partial' | 'multi_select' | 'scale' | 'date' | 'text' | 'number';
export type GapSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface AnswerOption {
  value: string;
  label: string;
  points: number;
}

export interface ConditionalRule {
  questionId: string;
  operator: 'equals' | 'includes' | 'not_equals';
  value: string | string[];
}

export interface ScoringConfig {
  maxPoints: number;
  scoringMap: Record<string, number>;
}

export interface GapTriggerConfig {
  triggerValues: string[];
  severity: GapSeverity;
  gapTitle: string;
  gapDescription: string;
  remediationHint: string;
  linkedRegulations: string[];
}

export interface AssessmentQuestion {
  id: string;
  domain: CqcDomainType;
  kloeCode: string;
  regulationCodes: string[];
  step: 3;
  text: string;
  helpText?: string;
  answerType: AnswerType;
  options?: AnswerOption[];
  serviceTypes: ServiceType[];
  conditionalOn?: ConditionalRule;
  scoring: ScoringConfig;
  weight: number;
  gapTrigger?: GapTriggerConfig;
}

// ─── Scoring Map Helpers ────────────────────────────────────────────────────

function yesNoPartialMap(max: number): Record<string, number> {
  return { yes: max, partial: Math.round(max * 0.5), no: 0, unsure: Math.round(max * 0.2) };
}

function yesNoMap(max: number): Record<string, number> {
  return { yes: max, no: 0 };
}

// ─── SAFE Domain ────────────────────────────────────────────────────────────

const SAFE_QUESTIONS: AssessmentQuestion[] = [
  // S1 — Safeguarding
  {
    id: 'SAFE_S1_Q01', domain: 'SAFE', kloeCode: 'S1', regulationCodes: ['REG13'], step: 3,
    text: 'Do you have a current safeguarding adults policy that has been reviewed in the last 12 months?',
    helpText: 'Safeguarding is a fundamental standard (Reg 13). CQC inspectors will ask to see your policy and evidence of staff training.',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no', 'unsure'], severity: 'CRITICAL', gapTitle: 'Missing or outdated safeguarding policy', gapDescription: 'Fundamental requirement under Reg 13.', remediationHint: 'Create or update safeguarding adults policy.', linkedRegulations: ['REG13'] },
  },
  {
    id: 'SAFE_S1_Q02', domain: 'SAFE', kloeCode: 'S1', regulationCodes: ['REG19'], step: 3,
    text: 'Do all staff have enhanced DBS checks (with barred list check where applicable)?',
    helpText: 'Robust recruitment processes are required under Reg 19. DBS checks are a minimum requirement.',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no', 'partial'], severity: 'CRITICAL', gapTitle: 'Incomplete DBS checks', gapDescription: 'Legal requirement under Reg 19.', remediationHint: 'Complete DBS checks for all staff.', linkedRegulations: ['REG19'] },
  },
  {
    id: 'SAFE_S1_Q03', domain: 'SAFE', kloeCode: 'S1', regulationCodes: ['REG13'], step: 3,
    text: 'Have all staff completed safeguarding training within the last 12 months?',
    helpText: 'Safeguarding training must be current for all staff.',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Safeguarding training not current', gapDescription: 'All staff must complete safeguarding training annually.', remediationHint: 'Schedule safeguarding training for all staff.', linkedRegulations: ['REG13'] },
  },
  {
    id: 'SAFE_S1_Q04', domain: 'SAFE', kloeCode: 'S1', regulationCodes: ['REG13'], step: 3,
    text: 'Is there a designated safeguarding lead identified and known to all staff?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No designated safeguarding lead', gapDescription: 'A named safeguarding lead is essential.', remediationHint: 'Designate a safeguarding lead and communicate to all staff.', linkedRegulations: ['REG13'] },
  },
  {
    id: 'SAFE_S1_Q05', domain: 'SAFE', kloeCode: 'S1', regulationCodes: ['REG13'], step: 3,
    text: 'Do you have a clear referral pathway to the local authority safeguarding team?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No safeguarding referral pathway documented', gapDescription: 'Referral pathway to local authority must be documented.', remediationHint: 'Document referral pathway to local authority safeguarding team.', linkedRegulations: ['REG13'] },
  },
  {
    id: 'SAFE_S1_Q06', domain: 'SAFE', kloeCode: 'S1', regulationCodes: ['REG13'], step: 3,
    text: 'Do you maintain a log of safeguarding concerns, referrals, and outcomes?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No safeguarding referral log', gapDescription: 'A log of safeguarding concerns is needed for audit.', remediationHint: 'Create a safeguarding concerns log.', linkedRegulations: ['REG13'] },
  },
  // S2 — Risk Assessment
  {
    id: 'SAFE_S2_Q01', domain: 'SAFE', kloeCode: 'S2', regulationCodes: ['REG12', 'REG15'], step: 3,
    text: 'Do you have a current fire risk assessment carried out by a competent person?',
    helpText: 'Legal requirement under Fire Safety Order 2005.',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no', 'unsure'], severity: 'CRITICAL', gapTitle: 'Missing fire risk assessment', gapDescription: 'Legal requirement under Fire Safety Order 2005.', remediationHint: 'Commission a fire risk assessment from a competent person.', linkedRegulations: ['REG12', 'REG15'] },
  },
  {
    id: 'SAFE_S2_Q02', domain: 'SAFE', kloeCode: 'S2', regulationCodes: ['REG12'], step: 3,
    text: 'Do you conduct fire drills at least every 6 months and record the outcomes?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No regular fire drills documented', gapDescription: 'Fire drills should be conducted at least every 6 months.', remediationHint: 'Schedule and document fire drills.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S2_Q03', domain: 'SAFE', kloeCode: 'S2', regulationCodes: ['REG12'], step: 3,
    text: 'Do you have individual risk assessments for each person using your service?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'Missing individual risk assessments', gapDescription: 'Fundamental to Reg 12.', remediationHint: 'Implement individual risk assessment process.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S2_Q04', domain: 'SAFE', kloeCode: 'S2', regulationCodes: ['REG15'], step: 3,
    text: 'Do you have a Legionella risk assessment and water management plan?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No Legionella risk assessment', gapDescription: 'Legionella risk assessment is required.', remediationHint: 'Commission a Legionella risk assessment.', linkedRegulations: ['REG15'] },
  },
  {
    id: 'SAFE_S2_Q05', domain: 'SAFE', kloeCode: 'S2', regulationCodes: ['REG12'], step: 3,
    text: 'Do you have COSHH assessments for all hazardous substances used on the premises?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Missing COSHH assessments', gapDescription: 'COSHH assessments are required for hazardous substances.', remediationHint: 'Complete COSHH assessments for all hazardous substances.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S2_Q06', domain: 'SAFE', kloeCode: 'S2', regulationCodes: ['REG12'], step: 3,
    text: 'Do you have Personal Emergency Evacuation Plans (PEEPs) for people with mobility or cognitive limitations?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No PEEPs for vulnerable residents', gapDescription: 'PEEPs are required for residents with mobility or cognitive limitations.', remediationHint: 'Create PEEPs for all applicable residents.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S2_Q07', domain: 'SAFE', kloeCode: 'S2', regulationCodes: ['REG12'], step: 3,
    text: 'Do you have procedure-specific risk assessments for all treatments offered (e.g. laser, injectables, peels)?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'No procedure-specific risk assessments', gapDescription: 'All treatments must have risk assessments.', remediationHint: 'Create procedure-specific risk assessments for every treatment offered.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S2_Q08', domain: 'SAFE', kloeCode: 'S2', regulationCodes: ['REG15'], step: 3,
    text: 'Is all clinical equipment subject to a planned preventive maintenance schedule and PAT testing?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No equipment maintenance schedule', gapDescription: 'Equipment must be maintained and PAT tested.', remediationHint: 'Implement a planned preventive maintenance schedule.', linkedRegulations: ['REG15'] },
  },
  {
    id: 'SAFE_S2_Q09', domain: 'SAFE', kloeCode: 'S2', regulationCodes: ['REG15'], step: 3,
    text: 'Do you have a current environmental risk assessment covering the physical premises?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No environmental risk assessment', gapDescription: 'Environmental risk assessment is needed.', remediationHint: 'Conduct an environmental risk assessment.', linkedRegulations: ['REG15'] },
  },
  {
    id: 'SAFE_S2_Q10', domain: 'SAFE', kloeCode: 'S2', regulationCodes: ['REG12'], step: 3,
    text: 'Do you have ligature risk assessments for areas accessible to residents at risk of self-harm?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No ligature risk assessments', gapDescription: 'Required for mental health/dementia services.', remediationHint: 'Complete ligature risk assessments for all applicable areas.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S2_Q11', domain: 'SAFE', kloeCode: 'S2', regulationCodes: ['REG12'], step: 3,
    text: 'Are bed rail risk assessments completed for any residents using bed rails?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No bed rail risk assessments', gapDescription: 'Bed rail risk assessments are needed for safety.', remediationHint: 'Complete bed rail risk assessments for all residents using them.', linkedRegulations: ['REG12'] },
  },
  // S3 — Staffing
  {
    id: 'SAFE_S3_Q01', domain: 'SAFE', kloeCode: 'S3', regulationCodes: ['REG18', 'REG19'], step: 3,
    text: 'Do you have a registered manager in post?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoMap(10) }, weight: 2.0,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'No registered manager', gapDescription: 'Breach of registration conditions and CQC enforcement trigger.', remediationHint: 'Appoint and register a manager with CQC.', linkedRegulations: ['REG18', 'REG19'] },
  },
  {
    id: 'SAFE_S3_Q02', domain: 'SAFE', kloeCode: 'S3', regulationCodes: ['REG18'], step: 3,
    text: 'Do you use a validated tool or method to determine safe staffing levels?',
    answerType: 'yes_no', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoMap(8) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No validated staffing tool', gapDescription: 'Safe staffing levels should be determined by a validated method.', remediationHint: 'Implement a validated staffing dependency tool.', linkedRegulations: ['REG18'] },
  },
  {
    id: 'SAFE_S3_Q03', domain: 'SAFE', kloeCode: 'S3', regulationCodes: ['REG19'], step: 3,
    text: 'Do you maintain complete recruitment files including references, qualifications, right-to-work checks, and employment history with gap explanations?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Incomplete recruitment files', gapDescription: 'Reg 19 requirement.', remediationHint: 'Audit and complete all recruitment files.', linkedRegulations: ['REG19'] },
  },
  {
    id: 'SAFE_S3_Q04', domain: 'SAFE', kloeCode: 'S3', regulationCodes: ['REG19'], step: 3,
    text: 'Do all practitioners hold valid professional registration/indemnity insurance where applicable?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no', 'partial'], severity: 'CRITICAL', gapTitle: 'Staff without valid registration or indemnity', gapDescription: 'Professional registration must be current.', remediationHint: 'Verify all staff registration and insurance immediately.', linkedRegulations: ['REG19'] },
  },
  {
    id: 'SAFE_S3_Q05', domain: 'SAFE', kloeCode: 'S3', regulationCodes: ['REG18'], step: 3,
    text: 'Are agency or temporary staff given a local induction before they start work?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No agency staff induction process', gapDescription: 'Agency staff need local inductions.', remediationHint: 'Create an agency staff induction checklist.', linkedRegulations: ['REG18'] },
  },
  {
    id: 'SAFE_S3_Q06', domain: 'SAFE', kloeCode: 'S3', regulationCodes: ['REG19'], step: 3,
    text: 'Do all clinical practitioners hold specific qualifications for the procedures they perform (e.g. Level 7 for injectables, laser safety certification)?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no', 'partial'], severity: 'CRITICAL', gapTitle: 'Staff performing procedures without required qualifications', gapDescription: 'All practitioners must hold required qualifications.', remediationHint: 'Verify practitioner qualifications for all procedures offered.', linkedRegulations: ['REG19'] },
  },
  // S4 — Medicines Management
  {
    id: 'SAFE_S4_Q01', domain: 'SAFE', kloeCode: 'S4', regulationCodes: ['REG12'], step: 3,
    text: 'Do you have a medicines management policy?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'No medicines management policy', gapDescription: 'Reg 12 requirement.', remediationHint: 'Create a medicines management policy.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S4_Q02', domain: 'SAFE', kloeCode: 'S4', regulationCodes: ['REG12'], step: 3,
    text: 'Are all medicines stored securely with temperature monitoring where required?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Medicines not stored safely', gapDescription: 'Medicines must be stored securely with temperature monitoring.', remediationHint: 'Review and secure medicines storage.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S4_Q03', domain: 'SAFE', kloeCode: 'S4', regulationCodes: ['REG12'], step: 3,
    text: 'Are all prescribing arrangements documented and compliant (PGDs, PSDs, independent prescribing)?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no', 'unsure'], severity: 'CRITICAL', gapTitle: 'Undocumented prescribing arrangements', gapDescription: 'All prescribing must be documented and compliant.', remediationHint: 'Document all prescribing arrangements.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S4_Q04', domain: 'SAFE', kloeCode: 'S4', regulationCodes: ['REG12'], step: 3,
    text: 'Do you have emergency medicines available on site (anaphylaxis kit, hyaluronidase if using HA fillers)?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 2.0,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'Missing emergency medicines', gapDescription: 'Immediate patient safety risk.', remediationHint: 'Procure emergency medicines kit immediately.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S4_Q05', domain: 'SAFE', kloeCode: 'S4', regulationCodes: ['REG12'], step: 3,
    text: 'Are controlled drugs managed with a double-lock system and a controlled drug register?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'Controlled drugs not properly managed', gapDescription: 'Controlled drugs require a double-lock system.', remediationHint: 'Implement double-lock storage and controlled drug register.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S4_Q06', domain: 'SAFE', kloeCode: 'S4', regulationCodes: ['REG12'], step: 3,
    text: 'Do you have a system for reporting and learning from medicines errors?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No medicines error reporting system', gapDescription: 'A system to report and learn from medicine errors is needed.', remediationHint: 'Implement a medicines error reporting process.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S4_Q07', domain: 'SAFE', kloeCode: 'S4', regulationCodes: ['REG12'], step: 3,
    text: 'Are MAR (Medication Administration Record) charts completed accurately for each administration?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Incomplete MAR charts', gapDescription: 'MAR charts must be completed accurately.', remediationHint: 'Audit and improve MAR chart accuracy.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S4_Q08', domain: 'SAFE', kloeCode: 'S4', regulationCodes: ['REG12'], step: 3,
    text: 'Are staff who administer medicines assessed as competent to do so?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Staff not assessed as competent for medicines', gapDescription: 'Competency assessments are needed for medicines administration.', remediationHint: 'Conduct medicines competency assessments for all applicable staff.', linkedRegulations: ['REG12'] },
  },
  // S5 — Infection Prevention & Control
  {
    id: 'SAFE_S5_Q01', domain: 'SAFE', kloeCode: 'S5', regulationCodes: ['REG12'], step: 3,
    text: 'Do you have a current infection prevention and control (IPC) policy?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'No IPC policy', gapDescription: 'Mandatory under Reg 12.', remediationHint: 'Create an infection prevention and control policy.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S5_Q02', domain: 'SAFE', kloeCode: 'S5', regulationCodes: ['REG12'], step: 3,
    text: 'Do you conduct regular hand hygiene audits?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No hand hygiene audits', gapDescription: 'Hand hygiene audits are needed.', remediationHint: 'Implement regular hand hygiene audits.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S5_Q03', domain: 'SAFE', kloeCode: 'S5', regulationCodes: ['REG12'], step: 3,
    text: 'Do you have clinical waste management procedures and a licensed waste contractor?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No clinical waste management', gapDescription: 'Legal requirement for clinical waste disposal.', remediationHint: 'Contract a licensed clinical waste contractor.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S5_Q04', domain: 'SAFE', kloeCode: 'S5', regulationCodes: ['REG12'], step: 3,
    text: 'Do you have an outbreak management plan (e.g. norovirus, COVID-19)?',
    answerType: 'yes_no', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No outbreak management plan', gapDescription: 'An outbreak management plan is needed.', remediationHint: 'Create an outbreak management plan.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S5_Q05', domain: 'SAFE', kloeCode: 'S5', regulationCodes: ['REG12'], step: 3,
    text: 'Are cleaning schedules in place with documented frequency and responsibilities?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No documented cleaning schedules', gapDescription: 'Cleaning schedules must be documented.', remediationHint: 'Implement documented cleaning schedules.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'SAFE_S5_Q06', domain: 'SAFE', kloeCode: 'S5', regulationCodes: ['REG12', 'REG15'], step: 3,
    text: 'Do you have an autoclave or validated instrument decontamination process for reusable clinical equipment?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No validated decontamination process', gapDescription: 'Reusable instruments must be decontaminated properly.', remediationHint: 'Implement a validated decontamination process.', linkedRegulations: ['REG12', 'REG15'] },
  },
  // S6 — Learning from Safety Incidents
  {
    id: 'SAFE_S6_Q01', domain: 'SAFE', kloeCode: 'S6', regulationCodes: ['REG17'], step: 3,
    text: 'Do you have a formal incident reporting and investigation procedure?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No formal incident reporting procedure', gapDescription: 'Reg 17 requirement.', remediationHint: 'Create a formal incident reporting and investigation procedure.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'SAFE_S6_Q02', domain: 'SAFE', kloeCode: 'S6', regulationCodes: ['REG20'], step: 3,
    text: 'Do you have a duty of candour policy and do staff understand when to apply it?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No duty of candour policy', gapDescription: 'Reg 20 requirement.', remediationHint: 'Create a duty of candour policy and train all staff.', linkedRegulations: ['REG20'] },
  },
  {
    id: 'SAFE_S6_Q03', domain: 'SAFE', kloeCode: 'S6', regulationCodes: ['REG17'], step: 3,
    text: 'Can you demonstrate that lessons from incidents have led to changes in practice?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No evidence of learning from incidents', gapDescription: 'Learning from incidents is key to improvement.', remediationHint: 'Document changes made as a result of incident investigations.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'SAFE_S6_Q04', domain: 'SAFE', kloeCode: 'S6', regulationCodes: ['REG17', 'REG20'], step: 3,
    text: 'Are notifications submitted to CQC, local authority, and other bodies when required?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Failure to submit required notifications', gapDescription: 'Legal requirement.', remediationHint: 'Review notification requirements and implement a checklist.', linkedRegulations: ['REG17', 'REG20'] },
  },
];

// ─── EFFECTIVE Domain ───────────────────────────────────────────────────────

const EFFECTIVE_QUESTIONS: AssessmentQuestion[] = [
  // E1 — Needs Assessment & Care Delivery
  {
    id: 'EFF_E1_Q01', domain: 'EFFECTIVE', kloeCode: 'E1', regulationCodes: ['REG9', 'REG12'], step: 3,
    text: 'Are care plans / treatment plans in place for every person using the service, based on a comprehensive assessment of their needs?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'No care/treatment plans', gapDescription: 'Fundamental to Reg 9.', remediationHint: 'Implement care/treatment plans for all service users.', linkedRegulations: ['REG9', 'REG12'] },
  },
  {
    id: 'EFF_E1_Q02', domain: 'EFFECTIVE', kloeCode: 'E1', regulationCodes: ['REG9'], step: 3,
    text: 'Are care plans reviewed and updated at the frequency required (at least every 3 months for care homes, after every treatment for clinics)?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Care plans not reviewed regularly', gapDescription: 'Regular review is essential.', remediationHint: 'Implement a care plan review schedule.', linkedRegulations: ['REG9'] },
  },
  {
    id: 'EFF_E1_Q03', domain: 'EFFECTIVE', kloeCode: 'E1', regulationCodes: ['REG12'], step: 3,
    text: 'Do you use validated clinical assessment tools? (e.g. Waterlow, MUST, Abbey Pain Scale for care homes; Fitzpatrick skin typing, BDD screening for clinics)',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No validated assessment tools in use', gapDescription: 'Validated tools improve care quality.', remediationHint: 'Adopt validated clinical assessment tools.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'EFF_E1_Q04', domain: 'EFFECTIVE', kloeCode: 'E1', regulationCodes: ['REG12'], step: 3,
    text: 'Do you have a pre-treatment assessment process that includes medical history, allergies, contraindications, and expectations?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'No pre-treatment assessment', gapDescription: 'Patient safety risk.', remediationHint: 'Implement a comprehensive pre-treatment assessment form.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'EFF_E1_Q05', domain: 'EFFECTIVE', kloeCode: 'E1', regulationCodes: ['REG12'], step: 3,
    text: 'Do you follow evidence-based clinical guidelines or protocols for all treatments/procedures offered?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No evidence-based clinical protocols', gapDescription: 'Evidence-based protocols are essential.', remediationHint: 'Develop clinical protocols based on current guidelines.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'EFF_E1_Q06', domain: 'EFFECTIVE', kloeCode: 'E1', regulationCodes: ['REG9'], step: 3,
    text: 'Do you have a comprehensive pre-admission assessment process that considers medical, social, psychological, and cultural needs?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No pre-admission assessment process', gapDescription: 'Comprehensive pre-admission assessments are needed.', remediationHint: 'Create a pre-admission assessment process.', linkedRegulations: ['REG9'] },
  },
  {
    id: 'EFF_E1_Q07', domain: 'EFFECTIVE', kloeCode: 'E1', regulationCodes: ['REG17'], step: 3,
    text: 'Are clinical audits conducted regularly (at least annually) to measure outcomes and identify improvements?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No clinical audit programme', gapDescription: 'Regular audits improve quality.', remediationHint: 'Establish a clinical audit programme.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'EFF_E1_Q08', domain: 'EFFECTIVE', kloeCode: 'E1', regulationCodes: ['REG12'], step: 3,
    text: 'Do you have documented aftercare protocols provided to patients following treatment?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 8, scoringMap: yesNoMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No aftercare protocols', gapDescription: 'Aftercare is essential for patient safety.', remediationHint: 'Develop aftercare protocols for all treatments.', linkedRegulations: ['REG12'] },
  },
  // E2 — Staff Skills
  {
    id: 'EFF_E2_Q01', domain: 'EFFECTIVE', kloeCode: 'E2', regulationCodes: ['REG18'], step: 3,
    text: 'Do all staff have a documented induction programme that is completed within the first 3 months?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No formal induction programme', gapDescription: 'Induction is needed for new staff.', remediationHint: 'Create a documented induction programme.', linkedRegulations: ['REG18'] },
  },
  {
    id: 'EFF_E2_Q02', domain: 'EFFECTIVE', kloeCode: 'E2', regulationCodes: ['REG18'], step: 3,
    text: 'Is there a training matrix showing all mandatory and role-specific training with completion status?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No training matrix', gapDescription: 'Essential for Reg 18 evidence.', remediationHint: 'Create a training matrix for all staff.', linkedRegulations: ['REG18'] },
  },
  {
    id: 'EFF_E2_Q03', domain: 'EFFECTIVE', kloeCode: 'E2', regulationCodes: ['REG18'], step: 3,
    text: 'Do all staff receive regular supervision (at least every 2 months) and an annual appraisal?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Supervision and appraisals not current', gapDescription: 'Regular supervision is needed.', remediationHint: 'Implement a supervision and appraisal schedule.', linkedRegulations: ['REG18'] },
  },
  {
    id: 'EFF_E2_Q04', domain: 'EFFECTIVE', kloeCode: 'E2', regulationCodes: ['REG18'], step: 3,
    text: 'Which of the following mandatory training topics are covered for all staff?',
    answerType: 'multi_select', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    options: [
      { value: 'safeguarding_adults', label: 'Safeguarding adults', points: 2 },
      { value: 'fire_safety', label: 'Fire safety', points: 2 },
      { value: 'health_safety', label: 'Health & safety', points: 2 },
      { value: 'basic_life_support', label: 'Basic life support (BLS/ILS)', points: 2 },
      { value: 'ipc', label: 'Infection prevention & control', points: 2 },
      { value: 'manual_handling', label: 'Manual handling / moving & handling', points: 2 },
      { value: 'data_protection', label: 'Data protection / GDPR', points: 1 },
      { value: 'equality_diversity', label: 'Equality & diversity', points: 1 },
    ],
    scoring: { maxPoints: 12, scoringMap: {} }, weight: 1.2,
    gapTrigger: { triggerValues: [], severity: 'HIGH', gapTitle: 'Significant gaps in mandatory training', gapDescription: 'Mandatory training coverage is insufficient.', remediationHint: 'Review and address mandatory training gaps.', linkedRegulations: ['REG18'] },
  },
  {
    id: 'EFF_E2_Q05', domain: 'EFFECTIVE', kloeCode: 'E2', regulationCodes: ['REG19'], step: 3,
    text: 'Are procedure-specific competency assessments completed and documented for all practitioners?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'No competency assessments for clinical procedures', gapDescription: 'Competency assessments are essential.', remediationHint: 'Implement competency assessments for all practitioners.', linkedRegulations: ['REG19'] },
  },
  {
    id: 'EFF_E2_Q06', domain: 'EFFECTIVE', kloeCode: 'E2', regulationCodes: ['REG18'], step: 3,
    text: 'Do all care staff complete the Care Certificate (or equivalent) within 12 weeks of starting?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Care Certificate not completed for all new staff', gapDescription: 'The Care Certificate is expected for new care staff.', remediationHint: 'Ensure all new care staff complete the Care Certificate within 12 weeks.', linkedRegulations: ['REG18'] },
  },
  {
    id: 'EFF_E2_Q07', domain: 'EFFECTIVE', kloeCode: 'E2', regulationCodes: ['REG18'], step: 3,
    text: 'Do staff have access to continuing professional development (CPD) opportunities?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 4, scoringMap: yesNoMap(4) }, weight: 0.8,
    gapTrigger: { triggerValues: ['no'], severity: 'LOW', gapTitle: 'No CPD opportunities available', gapDescription: 'CPD supports professional growth.', remediationHint: 'Provide CPD opportunities for staff.', linkedRegulations: ['REG18'] },
  },
  // E3 — Nutrition & Hydration (Care Home only)
  {
    id: 'EFF_E3_Q01', domain: 'EFFECTIVE', kloeCode: 'E3', regulationCodes: ['REG14'], step: 3,
    text: 'Do all residents have a nutritional assessment on admission and at regular intervals?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No nutritional assessments', gapDescription: 'Reg 14 requirement.', remediationHint: 'Implement nutritional assessment on admission.', linkedRegulations: ['REG14'] },
  },
  {
    id: 'EFF_E3_Q02', domain: 'EFFECTIVE', kloeCode: 'E3', regulationCodes: ['REG14'], step: 3,
    text: 'Are fluid and food intake charts used for residents at risk of dehydration or malnutrition?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No food/fluid monitoring for at-risk residents', gapDescription: 'Monitoring is needed for at-risk residents.', remediationHint: 'Implement food and fluid intake charts.', linkedRegulations: ['REG14'] },
  },
  {
    id: 'EFF_E3_Q03', domain: 'EFFECTIVE', kloeCode: 'E3', regulationCodes: ['REG14'], step: 3,
    text: 'Do menus offer choice, reflect cultural and dietary preferences, and are they reviewed by a nutritionist or dietitian?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Menu choice and dietary provision limited', gapDescription: 'Menus should reflect preferences and be nutritionally reviewed.', remediationHint: 'Review menu options with a dietitian.', linkedRegulations: ['REG14'] },
  },
  {
    id: 'EFF_E3_Q04', domain: 'EFFECTIVE', kloeCode: 'E3', regulationCodes: ['REG14'], step: 3,
    text: 'Do you have a current food hygiene rating of 3 or above?',
    answerType: 'yes_no', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Food hygiene rating below 3', gapDescription: 'A food hygiene rating of 3+ is expected.', remediationHint: 'Address food hygiene issues and request re-inspection.', linkedRegulations: ['REG14'] },
  },
  {
    id: 'EFF_E3_Q05', domain: 'EFFECTIVE', kloeCode: 'E3', regulationCodes: ['REG14'], step: 3,
    text: 'Are special dietary needs (e.g. modified texture, diabetic, religious requirements) accommodated?',
    answerType: 'yes_no', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Special dietary needs not accommodated', gapDescription: 'Special dietary needs must be met.', remediationHint: 'Review dietary provision for special needs.', linkedRegulations: ['REG14'] },
  },
  // E4 — Multi-Disciplinary Working
  {
    id: 'EFF_E4_Q01', domain: 'EFFECTIVE', kloeCode: 'E4', regulationCodes: ['REG12'], step: 3,
    text: 'Do you have documented processes for communicating with GPs, hospitals, and other healthcare providers about people using your service?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No multi-disciplinary communication processes', gapDescription: 'Communication with other providers is essential.', remediationHint: 'Document communication processes with external healthcare providers.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'EFF_E4_Q02', domain: 'EFFECTIVE', kloeCode: 'E4', regulationCodes: ['REG12'], step: 3,
    text: 'Are handover procedures documented and followed at shift changes?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No documented handover procedures', gapDescription: 'Handover procedures must be documented.', remediationHint: 'Implement documented shift handover procedures.', linkedRegulations: ['REG12'] },
  },
  {
    id: 'EFF_E4_Q03', domain: 'EFFECTIVE', kloeCode: 'E4', regulationCodes: ['REG12'], step: 3,
    text: 'Do patient treatment records include a clear referral pathway if complications arise post-treatment?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No complication referral pathway', gapDescription: 'A complication referral pathway is needed.', remediationHint: 'Document a complication referral pathway.', linkedRegulations: ['REG12'] },
  },
  // E5 — Supporting Healthy Living
  {
    id: 'EFF_E5_Q01', domain: 'EFFECTIVE', kloeCode: 'E5', regulationCodes: ['REG9'], step: 3,
    text: 'Do residents have access to healthcare professionals (GP, dentist, optician, chiropodist) as needed?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Residents lack access to healthcare professionals', gapDescription: 'Access to healthcare professionals is required.', remediationHint: 'Ensure access to GP, dentist, optician, and other professionals.', linkedRegulations: ['REG9'] },
  },
  {
    id: 'EFF_E5_Q02', domain: 'EFFECTIVE', kloeCode: 'E5', regulationCodes: ['REG9'], step: 3,
    text: 'Are health promotion activities or information provided? (e.g. immunisation, screening, healthy lifestyle)',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 4, scoringMap: yesNoMap(4) }, weight: 0.8,
    gapTrigger: { triggerValues: ['no'], severity: 'LOW', gapTitle: 'No health promotion activities', gapDescription: 'Health promotion is best practice.', remediationHint: 'Introduce health promotion information.', linkedRegulations: ['REG9'] },
  },
  // E6 — Premises & Environment
  {
    id: 'EFF_E6_Q01', domain: 'EFFECTIVE', kloeCode: 'E6', regulationCodes: ['REG15'], step: 3,
    text: 'Are the premises accessible for people with disabilities and compliant with the Equality Act 2010?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Premises accessibility issues', gapDescription: 'Equality Act compliance is required.', remediationHint: 'Conduct an accessibility assessment.', linkedRegulations: ['REG15'] },
  },
  {
    id: 'EFF_E6_Q02', domain: 'EFFECTIVE', kloeCode: 'E6', regulationCodes: ['REG15'], step: 3,
    text: 'Is the clinical environment suitably designed for the treatments provided (e.g. ventilation, lighting, flooring, privacy)?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Clinical environment not fit for purpose', gapDescription: 'The environment must be suitable for treatments.', remediationHint: 'Review clinical environment suitability.', linkedRegulations: ['REG15'] },
  },
  {
    id: 'EFF_E6_Q03', domain: 'EFFECTIVE', kloeCode: 'E6', regulationCodes: ['REG15'], step: 3,
    text: 'Is the environment dementia-friendly with appropriate signage, lighting, and orientation aids?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Environment not dementia-friendly', gapDescription: 'Dementia-friendly environment is best practice.', remediationHint: 'Implement dementia-friendly environmental improvements.', linkedRegulations: ['REG15'] },
  },
  // E7 — Consent
  {
    id: 'EFF_E7_Q01', domain: 'EFFECTIVE', kloeCode: 'E7', regulationCodes: ['REG11'], step: 3,
    text: 'Do you have a consent policy that complies with current legislation?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No consent policy', gapDescription: 'Reg 11 requirement.', remediationHint: 'Create a consent policy.', linkedRegulations: ['REG11'] },
  },
  {
    id: 'EFF_E7_Q02', domain: 'EFFECTIVE', kloeCode: 'E7', regulationCodes: ['REG11'], step: 3,
    text: 'Is informed consent obtained and documented before every treatment or procedure?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'Consent not consistently documented', gapDescription: 'Informed consent is mandatory.', remediationHint: 'Implement consent documentation for all procedures.', linkedRegulations: ['REG11'] },
  },
  {
    id: 'EFF_E7_Q03', domain: 'EFFECTIVE', kloeCode: 'E7', regulationCodes: ['REG11'], step: 3,
    text: 'Do you enforce a mandatory cooling-off period of at least 14 days for cosmetic procedures (as recommended by JCCP/RCS)?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No cooling-off period enforced', gapDescription: 'Best practice for aesthetic procedures.', remediationHint: 'Implement 14-day cooling-off period for cosmetic procedures.', linkedRegulations: ['REG11'] },
  },
  {
    id: 'EFF_E7_Q04', domain: 'EFFECTIVE', kloeCode: 'E7', regulationCodes: ['REG11'], step: 3,
    text: 'Are Mental Capacity Act assessments carried out and documented when a person\'s capacity to consent is in doubt?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'No MCA assessments', gapDescription: 'Legal requirement under MCA 2005.', remediationHint: 'Implement MCA assessment procedures.', linkedRegulations: ['REG11'] },
  },
  {
    id: 'EFF_E7_Q05', domain: 'EFFECTIVE', kloeCode: 'E7', regulationCodes: ['REG11'], step: 3,
    text: 'Are DoLS (Deprivation of Liberty Safeguards) applications made when necessary and are authorisations tracked?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'DoLS not applied when required', gapDescription: 'Legal requirement.', remediationHint: 'Review and implement DoLS application procedures.', linkedRegulations: ['REG11'] },
  },
  {
    id: 'EFF_E7_Q06', domain: 'EFFECTIVE', kloeCode: 'E7', regulationCodes: ['REG11'], step: 3,
    text: 'Do patients receive clear written information about treatment risks, alternatives, expected outcomes, and costs before consenting?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Inadequate pre-treatment information provision', gapDescription: 'Patients must receive clear information before consent.', remediationHint: 'Create patient information sheets for all treatments.', linkedRegulations: ['REG11'] },
  },
];

// ─── CARING Domain ──────────────────────────────────────────────────────────

const CARING_QUESTIONS: AssessmentQuestion[] = [
  // C1 — Kindness & Compassion
  {
    id: 'CAR_C1_Q01', domain: 'CARING', kloeCode: 'C1', regulationCodes: ['REG10'], step: 3,
    text: 'Do you gather and act on feedback from people using your service about how they are treated? (e.g. satisfaction surveys, comments/compliments log)',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No system for gathering patient/resident feedback', gapDescription: 'Feedback systems are important for quality.', remediationHint: 'Implement a feedback collection system.', linkedRegulations: ['REG10'] },
  },
  {
    id: 'CAR_C1_Q02', domain: 'CARING', kloeCode: 'C1', regulationCodes: ['REG10'], step: 3,
    text: 'Do you have a system for recognising and addressing staff behaviours that do not meet the expected standards of kindness and respect?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No system for addressing unkind behaviour', gapDescription: 'A system to address unkind behaviour is needed.', remediationHint: 'Create a behavioural standards policy.', linkedRegulations: ['REG10'] },
  },
  {
    id: 'CAR_C1_Q03', domain: 'CARING', kloeCode: 'C1', regulationCodes: ['REG10'], step: 3,
    text: 'Are staff trained in communication skills, including communicating with people with sensory impairments, cognitive limitations, or those for whom English is not their first language?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Staff not trained in inclusive communication', gapDescription: 'Inclusive communication training is needed.', remediationHint: 'Provide communication skills training.', linkedRegulations: ['REG10'] },
  },
  {
    id: 'CAR_C1_Q04', domain: 'CARING', kloeCode: 'C1', regulationCodes: ['REG10'], step: 3,
    text: 'Do you have a chaperone policy and is a chaperone offered for all intimate examinations and procedures?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No chaperone policy', gapDescription: 'Best practice requirement.', remediationHint: 'Create a chaperone policy.', linkedRegulations: ['REG10'] },
  },
  {
    id: 'CAR_C1_Q05', domain: 'CARING', kloeCode: 'C1', regulationCodes: ['REG10'], step: 3,
    text: 'Are residents supported to maintain relationships with family and friends, including flexible visiting arrangements?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Visiting arrangements not flexible or welcoming', gapDescription: 'Flexible visiting is important for wellbeing.', remediationHint: 'Review visiting policy for flexibility.', linkedRegulations: ['REG10'] },
  },
  {
    id: 'CAR_C1_Q06', domain: 'CARING', kloeCode: 'C1', regulationCodes: ['REG10'], step: 3,
    text: 'Are end-of-life care wishes discussed and documented sensitively, and is palliative care support accessible?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'End-of-life care planning not in place', gapDescription: 'Sensitive end-of-life planning is essential.', remediationHint: 'Implement end-of-life care planning processes.', linkedRegulations: ['REG10'] },
  },
  // C2 — Involvement in Decisions
  {
    id: 'CAR_C2_Q01', domain: 'CARING', kloeCode: 'C2', regulationCodes: ['REG9', 'REG10'], step: 3,
    text: 'Are people (and their families/carers where appropriate) actively involved in planning and reviewing their care or treatment?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'People not involved in their own care planning', gapDescription: 'Involvement in care planning is essential.', remediationHint: 'Involve service users in care plan reviews.', linkedRegulations: ['REG9', 'REG10'] },
  },
  {
    id: 'CAR_C2_Q02', domain: 'CARING', kloeCode: 'C2', regulationCodes: ['REG9'], step: 3,
    text: 'Are people given accessible information about their care, treatment options, and any associated risks?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Information not provided in accessible format', gapDescription: 'Information must be accessible.', remediationHint: 'Review information provision for accessibility.', linkedRegulations: ['REG9'] },
  },
  {
    id: 'CAR_C2_Q03', domain: 'CARING', kloeCode: 'C2', regulationCodes: ['REG10'], step: 3,
    text: 'Do you actively seek feedback from patients about their treatment outcomes (including follow-up satisfaction)?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No post-treatment outcome feedback mechanism', gapDescription: 'Post-treatment feedback is important.', remediationHint: 'Implement post-treatment outcome surveys.', linkedRegulations: ['REG10'] },
  },
  // C3 — Privacy & Dignity
  {
    id: 'CAR_C3_Q01', domain: 'CARING', kloeCode: 'C3', regulationCodes: ['REG10'], step: 3,
    text: 'Is personal care always provided in private, with doors closed and curtains drawn?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Privacy not maintained during personal care', gapDescription: 'Privacy during care is mandatory.', remediationHint: 'Review and enforce privacy during all care activities.', linkedRegulations: ['REG10'] },
  },
  {
    id: 'CAR_C3_Q02', domain: 'CARING', kloeCode: 'C3', regulationCodes: ['REG10', 'REG13'], step: 3,
    text: 'Are before/after photographs taken only with explicit consent and stored securely with restricted access?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Photography consent and storage not compliant', gapDescription: 'Photography consent must be explicit and storage must be secure.', remediationHint: 'Create a photography consent form and secure storage.', linkedRegulations: ['REG10', 'REG13'] },
  },
  {
    id: 'CAR_C3_Q03', domain: 'CARING', kloeCode: 'C3', regulationCodes: ['REG10'], step: 3,
    text: 'Are residents encouraged and supported to maintain independence in daily activities?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Independence not actively promoted', gapDescription: 'Independence should be encouraged.', remediationHint: 'Promote independence in daily care routines.', linkedRegulations: ['REG10'] },
  },
  {
    id: 'CAR_C3_Q04', domain: 'CARING', kloeCode: 'C3', regulationCodes: ['REG17'], step: 3,
    text: 'Are personal records stored securely and only accessible to authorised personnel?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Personal records not stored securely', gapDescription: 'Reg 17/GDPR requirement.', remediationHint: 'Review record storage security.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'CAR_C3_Q05', domain: 'CARING', kloeCode: 'C3', regulationCodes: ['REG10'], step: 3,
    text: 'Do residents have their own personal space that they can personalise?',
    answerType: 'yes_no', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Residents cannot personalise their living space', gapDescription: 'Personalisation of living space is important.', remediationHint: 'Enable residents to personalise their rooms.', linkedRegulations: ['REG10'] },
  },
];

// ─── RESPONSIVE Domain ──────────────────────────────────────────────────────

const RESPONSIVE_QUESTIONS: AssessmentQuestion[] = [
  // R1 — Personalised Care
  {
    id: 'RES_R1_Q01', domain: 'RESPONSIVE', kloeCode: 'R1', regulationCodes: ['REG9'], step: 3,
    text: 'Do care plans / treatment plans reflect the individual preferences, needs, and circumstances of each person?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Care/treatment plans not personalised', gapDescription: 'Plans must reflect individual needs.', remediationHint: 'Review and personalise all care/treatment plans.', linkedRegulations: ['REG9'] },
  },
  {
    id: 'RES_R1_Q02', domain: 'RESPONSIVE', kloeCode: 'R1', regulationCodes: ['REG9'], step: 3,
    text: 'Can people access the service at times that suit their needs? (e.g. flexible appointments, choice of treatment times)',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'LOW', gapTitle: 'Service access not flexible', gapDescription: 'Flexible access improves quality.', remediationHint: 'Review service access times.', linkedRegulations: ['REG9'] },
  },
  {
    id: 'RES_R1_Q03', domain: 'RESPONSIVE', kloeCode: 'R1', regulationCodes: ['REG9'], step: 3,
    text: 'Are cultural, religious, and spiritual needs assessed and accommodated?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Cultural/religious needs not assessed', gapDescription: 'Cultural needs should be accommodated.', remediationHint: 'Include cultural/religious needs in assessments.', linkedRegulations: ['REG9'] },
  },
  {
    id: 'RES_R1_Q04', domain: 'RESPONSIVE', kloeCode: 'R1', regulationCodes: ['REG9'], step: 3,
    text: "Are people's communication needs identified and met (e.g. sensory aids, large print, interpreters, Accessible Information Standard)?",
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Communication needs not fully met', gapDescription: 'AIS requirement.', remediationHint: 'Review communication needs provision.', linkedRegulations: ['REG9'] },
  },
  {
    id: 'RES_R1_Q05', domain: 'RESPONSIVE', kloeCode: 'R1', regulationCodes: ['REG9'], step: 3,
    text: "Is there a meaningful activities programme that reflects residents' interests and abilities?",
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No meaningful activities programme', gapDescription: 'Meaningful activities are important for wellbeing.', remediationHint: 'Develop a person-centred activities programme.', linkedRegulations: ['REG9'] },
  },
  {
    id: 'RES_R1_Q06', domain: 'RESPONSIVE', kloeCode: 'R1', regulationCodes: ['REG9'], step: 3,
    text: 'Do you provide treatment-specific patient information leaflets for all procedures?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No patient information leaflets', gapDescription: 'Patient information leaflets are best practice.', remediationHint: 'Create treatment-specific information leaflets.', linkedRegulations: ['REG9'] },
  },
  {
    id: 'RES_R1_Q07', domain: 'RESPONSIVE', kloeCode: 'R1', regulationCodes: ['REG9'], step: 3,
    text: 'Do you accommodate walk-in emergencies and provide clear after-hours advice/contact details?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 4, scoringMap: yesNoMap(4) }, weight: 0.8,
    gapTrigger: { triggerValues: ['no'], severity: 'LOW', gapTitle: 'No after-hours contact provision', gapDescription: 'After-hours contact is best practice.', remediationHint: 'Provide after-hours contact details.', linkedRegulations: ['REG9'] },
  },
  // R2 — Complaints
  {
    id: 'RES_R2_Q01', domain: 'RESPONSIVE', kloeCode: 'R2', regulationCodes: ['REG16'], step: 3,
    text: 'Do you have a written complaints policy that is accessible to all people using the service?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No complaints policy', gapDescription: 'Reg 16 requirement.', remediationHint: 'Create and publish a complaints policy.', linkedRegulations: ['REG16'] },
  },
  {
    id: 'RES_R2_Q02', domain: 'RESPONSIVE', kloeCode: 'R2', regulationCodes: ['REG16'], step: 3,
    text: 'Are complaints acknowledged within 3 working days and responded to within 20 working days?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Complaints not responded to within expected timeframes', gapDescription: 'Timely responses to complaints are expected.', remediationHint: 'Improve complaints response times.', linkedRegulations: ['REG16'] },
  },
  {
    id: 'RES_R2_Q03', domain: 'RESPONSIVE', kloeCode: 'R2', regulationCodes: ['REG16'], step: 3,
    text: 'Can you demonstrate that complaints have led to improvements in the service?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'LOW', gapTitle: 'No evidence of learning from complaints', gapDescription: 'Learning from complaints is best practice.', remediationHint: 'Document improvements from complaints.', linkedRegulations: ['REG16'] },
  },
  {
    id: 'RES_R2_Q04', domain: 'RESPONSIVE', kloeCode: 'R2', regulationCodes: ['REG16'], step: 3,
    text: 'Are people informed of the right to escalate complaints to the Parliamentary and Health Service Ombudsman (or LGO for social care)?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 4, scoringMap: yesNoMap(4) }, weight: 0.8,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Escalation route not communicated', gapDescription: 'Escalation rights should be communicated.', remediationHint: 'Include escalation information in complaints policy.', linkedRegulations: ['REG16'] },
  },
  // R3 — End of Life Care (Care Home only)
  {
    id: 'RES_R3_Q01', domain: 'RESPONSIVE', kloeCode: 'R3', regulationCodes: ['REG9'], step: 3,
    text: 'Do you have an end-of-life care policy and do staff receive end-of-life training?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No end-of-life policy or training', gapDescription: 'End-of-life care policy is needed.', remediationHint: 'Create end-of-life care policy and provide training.', linkedRegulations: ['REG9'] },
  },
  {
    id: 'RES_R3_Q02', domain: 'RESPONSIVE', kloeCode: 'R3', regulationCodes: ['REG9'], step: 3,
    text: 'Are advance care plans / advance decisions / DNACPR forms in place where appropriate, and are they regularly reviewed?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Advance care planning not in place', gapDescription: 'Advance care planning is important.', remediationHint: 'Implement advance care planning processes.', linkedRegulations: ['REG9'] },
  },
  {
    id: 'RES_R3_Q03', domain: 'RESPONSIVE', kloeCode: 'R3', regulationCodes: ['REG9'], step: 3,
    text: 'Are pain assessment tools used for residents who cannot verbalise pain (e.g. Abbey Pain Scale)?',
    answerType: 'yes_no', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No pain assessment tools for non-verbal residents', gapDescription: 'Pain assessment tools are needed.', remediationHint: 'Adopt validated pain assessment tools.', linkedRegulations: ['REG9'] },
  },
  {
    id: 'RES_R3_Q04', domain: 'RESPONSIVE', kloeCode: 'R3', regulationCodes: ['REG9'], step: 3,
    text: 'Are families supported and involved during end-of-life care, including access to the home at any time?',
    answerType: 'yes_no', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'Families not supported during end-of-life', gapDescription: 'Family involvement in end-of-life care is important.', remediationHint: 'Ensure families have open access during end-of-life care.', linkedRegulations: ['REG9'] },
  },
];

// ─── WELL-LED Domain ────────────────────────────────────────────────────────

const WELL_LED_QUESTIONS: AssessmentQuestion[] = [
  // W1 — Vision & Strategy
  {
    id: 'WEL_W1_Q01', domain: 'WELL_LED', kloeCode: 'W1', regulationCodes: ['REG17'], step: 3,
    text: 'Do you have a current Statement of Purpose registered with CQC?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'No Statement of Purpose', gapDescription: 'Registration requirement.', remediationHint: 'Create and register Statement of Purpose with CQC.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'WEL_W1_Q02', domain: 'WELL_LED', kloeCode: 'W1', regulationCodes: ['REG17'], step: 3,
    text: 'Is there a clear vision, mission, or set of values that is known to staff and reflected in daily practice?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'LOW', gapTitle: 'No documented vision or values', gapDescription: 'A clear vision helps guide practice.', remediationHint: 'Develop and communicate a vision statement.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'WEL_W1_Q03', domain: 'WELL_LED', kloeCode: 'W1', regulationCodes: ['REG17'], step: 3,
    text: 'Do you have a service development plan or quality improvement plan for the next 12 months?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No quality improvement plan', gapDescription: 'A QI plan shows commitment to improvement.', remediationHint: 'Create a 12-month quality improvement plan.', linkedRegulations: ['REG17'] },
  },
  // W2 — Governance
  {
    id: 'WEL_W2_Q01', domain: 'WELL_LED', kloeCode: 'W2', regulationCodes: ['REG17'], step: 3,
    text: 'Do you have a governance framework that includes regular management meetings, clinical governance reviews, and documented minutes?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No governance framework', gapDescription: 'Reg 17 requirement.', remediationHint: 'Establish a governance framework with regular meetings.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'WEL_W2_Q02', domain: 'WELL_LED', kloeCode: 'W2', regulationCodes: ['REG17'], step: 3,
    text: 'Do you maintain a risk register that is reviewed and updated regularly?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No risk register', gapDescription: 'A risk register helps manage threats.', remediationHint: 'Create a risk register.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'WEL_W2_Q03', domain: 'WELL_LED', kloeCode: 'W2', regulationCodes: ['REG17'], step: 3,
    text: 'Are key performance indicators (KPIs) or quality metrics tracked and reviewed regularly?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No KPI tracking', gapDescription: 'KPIs help measure quality.', remediationHint: 'Identify and track key quality metrics.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'WEL_W2_Q04', domain: 'WELL_LED', kloeCode: 'W2', regulationCodes: ['REG17'], step: 3,
    text: 'Are there systems to ensure CQC registration conditions are maintained (e.g. notifications submitted, registered manager in place, Statement of Purpose up to date)?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'CQC registration conditions not actively monitored', gapDescription: 'Registration conditions must be maintained.', remediationHint: 'Create a checklist for CQC registration conditions.', linkedRegulations: ['REG17'] },
  },
  // W3 — Culture
  {
    id: 'WEL_W3_Q01', domain: 'WELL_LED', kloeCode: 'W3', regulationCodes: ['REG17', 'REG20'], step: 3,
    text: 'Do you have a whistleblowing / freedom to speak up policy and is it promoted to all staff?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No whistleblowing policy', gapDescription: 'Whistleblowing policy is essential.', remediationHint: 'Create and promote a whistleblowing policy.', linkedRegulations: ['REG17', 'REG20'] },
  },
  {
    id: 'WEL_W3_Q02', domain: 'WELL_LED', kloeCode: 'W3', regulationCodes: ['REG17'], step: 3,
    text: 'Are staff surveys or regular feedback mechanisms used to assess staff satisfaction and wellbeing?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 4, scoringMap: yesNoMap(4) }, weight: 0.8,
    gapTrigger: { triggerValues: ['no'], severity: 'LOW', gapTitle: 'No staff feedback mechanism', gapDescription: 'Staff feedback is best practice.', remediationHint: 'Implement staff satisfaction surveys.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'WEL_W3_Q03', domain: 'WELL_LED', kloeCode: 'W3', regulationCodes: ['REG17'], step: 3,
    text: 'Do staff feel confident to raise concerns without fear of reprisal?',
    answerType: 'scale', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: { '1': 2, '2': 4, '3': 6, '4': 8, '5': 10 } }, weight: 1.0,
    gapTrigger: { triggerValues: ['1', '2'], severity: 'HIGH', gapTitle: 'Staff do not feel safe to raise concerns', gapDescription: 'A psychologically safe culture is essential.', remediationHint: 'Review culture and implement freedom to speak up initiatives.', linkedRegulations: ['REG17'] },
  },
  // W4 — Roles & Accountability
  {
    id: 'WEL_W4_Q01', domain: 'WELL_LED', kloeCode: 'W4', regulationCodes: ['REG17', 'REG5'], step: 3,
    text: 'Is the registered manager (or nominated individual) fit and proper under Regulation 5 with documented DBS, qualifications, and character references?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 10, scoringMap: yesNoPartialMap(10) }, weight: 1.5,
    gapTrigger: { triggerValues: ['no'], severity: 'CRITICAL', gapTitle: 'Registered manager / nominated individual not assessed as fit and proper', gapDescription: 'Reg 5 requirement.', remediationHint: 'Document fit and proper persons assessment for registered manager.', linkedRegulations: ['REG17', 'REG5'] },
  },
  {
    id: 'WEL_W4_Q02', domain: 'WELL_LED', kloeCode: 'W4', regulationCodes: ['REG17'], step: 3,
    text: 'Are roles and responsibilities clearly defined in job descriptions for all positions?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'LOW', gapTitle: 'Roles not clearly defined', gapDescription: 'Clear job descriptions are needed.', remediationHint: 'Review and update all job descriptions.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'WEL_W4_Q03', domain: 'WELL_LED', kloeCode: 'W4', regulationCodes: ['REG17'], step: 3,
    text: 'Do you have a medical director or clinical lead responsible for clinical governance?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: { maxPoints: 8, scoringMap: yesNoMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No clinical lead responsible for clinical governance', gapDescription: 'A clinical lead is essential.', remediationHint: 'Appoint a medical director or clinical lead.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'WEL_W4_Q04', domain: 'WELL_LED', kloeCode: 'W4', regulationCodes: ['REG17'], step: 3,
    text: "Is there a clear management structure with deputies who can act in the manager's absence?",
    answerType: 'yes_no', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No deputy arrangements', gapDescription: 'Deputy arrangements ensure continuity.', remediationHint: 'Designate deputies for management absence.', linkedRegulations: ['REG17'] },
  },
  // W5 — Continuous Improvement
  {
    id: 'WEL_W5_Q01', domain: 'WELL_LED', kloeCode: 'W5', regulationCodes: ['REG17'], step: 3,
    text: 'Can you demonstrate actions taken in response to CQC inspection feedback, complaints, incidents, or audit findings?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'MEDIUM', gapTitle: 'No evidence of continuous improvement actions', gapDescription: 'Continuous improvement should be demonstrable.', remediationHint: 'Document improvement actions from feedback.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'WEL_W5_Q02', domain: 'WELL_LED', kloeCode: 'W5', regulationCodes: ['REG17'], step: 3,
    text: 'Do you benchmark your service against others or use external quality frameworks?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 4, scoringMap: yesNoMap(4) }, weight: 0.8,
    gapTrigger: { triggerValues: ['no'], severity: 'LOW', gapTitle: 'No benchmarking or external quality frameworks', gapDescription: 'Benchmarking is best practice.', remediationHint: 'Explore external quality frameworks.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'WEL_W5_Q03', domain: 'WELL_LED', kloeCode: 'W5', regulationCodes: ['REG17'], step: 3,
    text: 'Do you engage with people who use the service, their families, and community organisations to improve the service?',
    answerType: 'yes_no_partial', serviceTypes: ['CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'LOW', gapTitle: 'No community engagement for improvement', gapDescription: 'Community engagement is best practice.', remediationHint: 'Engage with families and community organisations.', linkedRegulations: ['REG17'] },
  },
  // W6 — Information Management
  {
    id: 'WEL_W6_Q01', domain: 'WELL_LED', kloeCode: 'W6', regulationCodes: ['REG17'], step: 3,
    text: 'Are you registered with the ICO (Information Commissioner\'s Office)?',
    answerType: 'yes_no', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Not registered with ICO', gapDescription: 'Legal requirement.', remediationHint: 'Register with the ICO.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'WEL_W6_Q02', domain: 'WELL_LED', kloeCode: 'W6', regulationCodes: ['REG17'], step: 3,
    text: 'Do you have a data protection / GDPR policy and has a Data Protection Officer or Lead been designated?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'No data protection policy or DPO', gapDescription: 'GDPR compliance requires a policy and designated lead.', remediationHint: 'Create a GDPR policy and designate a DPO.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'WEL_W6_Q03', domain: 'WELL_LED', kloeCode: 'W6', regulationCodes: ['REG17'], step: 3,
    text: 'Do you submit the NHS Data Security and Protection Toolkit (DSPT) annually (if applicable to your service)?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 6, scoringMap: yesNoPartialMap(6) }, weight: 1.0,
    gapTrigger: { triggerValues: ['no', 'unsure'], severity: 'MEDIUM', gapTitle: 'DSPT not submitted', gapDescription: 'Required for NHS work.', remediationHint: 'Complete and submit DSPT assessment.', linkedRegulations: ['REG17'] },
  },
  {
    id: 'WEL_W6_Q04', domain: 'WELL_LED', kloeCode: 'W6', regulationCodes: ['REG17'], step: 3,
    text: 'Are clinical records complete, accurate, legible, and stored securely (physical and digital)?',
    answerType: 'yes_no_partial', serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: { maxPoints: 8, scoringMap: yesNoPartialMap(8) }, weight: 1.2,
    gapTrigger: { triggerValues: ['no'], severity: 'HIGH', gapTitle: 'Clinical records not maintained to required standard', gapDescription: 'Clinical records must be complete and secure.', remediationHint: 'Audit clinical records for completeness and security.', linkedRegulations: ['REG17'] },
  },
];

// ─── Combined Exports ───────────────────────────────────────────────────────

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  ...SAFE_QUESTIONS,
  ...EFFECTIVE_QUESTIONS,
  ...CARING_QUESTIONS,
  ...RESPONSIVE_QUESTIONS,
  ...WELL_LED_QUESTIONS,
];

export function getQuestionsForServiceType(
  serviceType: ServiceType,
): AssessmentQuestion[] {
  return ASSESSMENT_QUESTIONS.filter((q) => q.serviceTypes.includes(serviceType));
}

export function getQuestionById(id: string): AssessmentQuestion | undefined {
  return ASSESSMENT_QUESTIONS.find((q) => q.id === id);
}

export function getQuestionsByDomain(
  domain: CqcDomainType,
  serviceType?: ServiceType,
): AssessmentQuestion[] {
  return ASSESSMENT_QUESTIONS.filter(
    (q) => q.domain === domain && (!serviceType || q.serviceTypes.includes(serviceType)),
  );
}

export function getQuestionsByKloe(
  kloeCode: string,
  serviceType?: ServiceType,
): AssessmentQuestion[] {
  return ASSESSMENT_QUESTIONS.filter(
    (q) => q.kloeCode === kloeCode && (!serviceType || q.serviceTypes.includes(serviceType)),
  );
}

export const DOMAIN_META: Record<CqcDomainType, { label: string; kloes: string[] }> = {
  SAFE: { label: 'Safe', kloes: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
  EFFECTIVE: { label: 'Effective', kloes: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'] },
  CARING: { label: 'Caring', kloes: ['C1', 'C2', 'C3'] },
  RESPONSIVE: { label: 'Responsive', kloes: ['R1', 'R2', 'R3'] },
  WELL_LED: { label: 'Well-Led', kloes: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'] },
};
