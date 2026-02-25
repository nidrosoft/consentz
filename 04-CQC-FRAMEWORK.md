# CQC Compliance Platform — CQC Regulatory Framework & Compliance Engine

> **File 4 of 7** | The regulatory brain that powers the entire platform
> **Legal Basis:** Health and Social Care Act 2008 (Regulated Activities) Regulations 2014
> **Regulator:** Care Quality Commission (CQC), England
> **Service Types:** Aesthetic Clinics | Care Homes (Residential Adult Social Care)
> **Last Updated:** February 2026

---

## Table of Contents

1. [Framework Architecture Overview](#1-framework-architecture-overview)
2. [The Five CQC Domains — Complete Reference](#2-the-five-cqc-domains--complete-reference)
3. [Key Lines of Enquiry — Full Specification](#3-key-lines-of-enquiry--full-specification)
4. [Fundamental Standards (Regulations 9–20A)](#4-fundamental-standards-regulations-920a)
5. [KLOE ↔ Regulation Mapping Matrix](#5-kloe--regulation-mapping-matrix)
6. [Service-Type Differentiation Engine](#6-service-type-differentiation-engine)
7. [Assessment Engine — Onboarding Questions](#7-assessment-engine--onboarding-questions)
8. [Evidence Requirements Matrix](#8-evidence-requirements-matrix)
9. [Compliance Scoring Algorithm](#9-compliance-scoring-algorithm)
10. [Rating Prediction Engine](#10-rating-prediction-engine)
11. [Gap Identification & Severity Classification](#11-gap-identification--severity-classification)
12. [Remediation Engine](#12-remediation-engine)
13. [Policy Template Library](#13-policy-template-library)
14. [Rating Characteristics — What CQC Looks For](#14-rating-characteristics--what-cqc-looks-for)
15. [Ongoing Monitoring & Compliance Decay](#15-ongoing-monitoring--compliance-decay)
16. [AI Integration Points](#16-ai-integration-points)
17. [Constants File — Complete Seed Data](#17-constants-file--complete-seed-data)

---

## 1. Framework Architecture Overview

### 1.1 How the CQC Framework Flows Through the Platform

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CQC FRAMEWORK DATA FLOW                              │
│                                                                         │
│  SEED DATA (read-only)           USER DATA (runtime)                    │
│  ┌─────────────┐                 ┌──────────────────┐                   │
│  │ 5 Domains   │                 │ Organization     │                   │
│  │ 25 KLOEs    │───POWERS────►   │ Service Type     │                   │
│  │ 14 Regs     │                 │ Assessment       │                   │
│  │ Mappings    │                 │ Answers          │                   │
│  └──────┬──────┘                 └────────┬─────────┘                   │
│         │                                 │                             │
│         │    ┌────────────────────────┐    │                             │
│         └───►│  COMPLIANCE ENGINE     │◄───┘                             │
│              │                        │                                  │
│              │  1. Filter by service  │                                  │
│              │  2. Score answers      │                                  │
│              │  3. Identify gaps      │                                  │
│              │  4. Calculate scores   │                                  │
│              │  5. Predict rating     │                                  │
│              │  6. Generate tasks     │                                  │
│              └───────────┬────────────┘                                  │
│                          │                                               │
│              ┌───────────▼────────────┐                                  │
│              │  OUTPUTS                │                                  │
│              │  • ComplianceScore      │                                  │
│              │  • 5x DomainScores     │                                  │
│              │  • ComplianceGaps[]    │                                  │
│              │  • Tasks[]             │                                  │
│              │  • Recommendations[]   │                                  │
│              └────────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Design Principles

1. **KLOEs are the user-facing structure** — inspectors ask about KLOEs, so users navigate by them
2. **Regulations are the engine internals** — the legal requirements that determine what evidence is actually needed
3. **Service type determines scope** — the same KLOE code means different things for clinics vs care homes
4. **Rating limiters prevent gaming** — a single critical gap in any domain caps the rating at Requires Improvement
5. **Continuous recalculation** — scores are not static; they decay as evidence expires and improve as gaps are resolved
6. **Assessment-first, then monitor** — onboarding assessment creates the initial baseline; ongoing monitoring maintains it

### 1.3 Framework Version Awareness

The CQC transitioned from legacy KLOEs to the Single Assessment Framework (SAF) with 34 Quality Statements in 2023–2024. Our platform uses the **KLOE structure** as its primary navigation model because:

- KLOEs remain the mental model most providers use
- The SAF quality statements map cleanly to KLOE groupings
- Many providers are still transitioning and think in KLOE terms
- The KLOE structure is more granular and better for gap identification

The platform stores quality statement references within each KLOE for forward compatibility.

---

## 2. The Five CQC Domains — Complete Reference

### 2.1 Domain Hierarchy

```
CQC Framework
├── Safe       (S)  — 6 KLOEs — Weight: 1.0 — "Are people protected from abuse and avoidable harm?"
├── Effective  (E)  — 7 KLOEs — Weight: 1.0 — "Does care achieve good outcomes?"
├── Caring     (C)  — 3 KLOEs — Weight: 1.0 — "Are people treated with compassion and dignity?"
├── Responsive (R)  — 3 KLOEs — Weight: 1.0 — "Are services organised to meet people's needs?"
└── Well-Led   (W)  — 6 KLOEs — Weight: 1.0 — "Is leadership delivering high-quality care?"
                    ─────────
                    25 KLOEs total
```

### 2.2 Domain Definitions

```typescript
// lib/constants/cqc-domains.ts

export const CQC_DOMAINS = {
  SAFE: {
    code: 'SAFE',
    name: 'Safe',
    icon: 'Shield',                    // Lucide icon name
    color: 'blue',                     // Tailwind theme color
    hexColor: '#3b82f6',
    sortOrder: 1,
    weight: 1.0,
    kloeCount: 6,
    keyQuestion: 'Are people protected from abuse and avoidable harm?',
    description:
      'By safe, we mean people are protected from abuse and avoidable harm. ' +
      'Abuse can be physical, sexual, mental or psychological, financial, neglect, ' +
      'institutional or discriminatory abuse.',
    inspectorFocus: [
      'Safeguarding policies and staff awareness',
      'Risk assessments and their regular review',
      'Staffing levels and deployment',
      'Medicines management and storage',
      'Infection prevention and control practices',
      'Incident reporting and learning culture',
    ],
  },

  EFFECTIVE: {
    code: 'EFFECTIVE',
    name: 'Effective',
    icon: 'TrendingUp',
    color: 'violet',
    hexColor: '#8b5cf6',
    sortOrder: 2,
    weight: 1.0,
    kloeCount: 7,
    keyQuestion: 'Does care, treatment and support achieve good outcomes and promote a good quality of life?',
    description:
      'By effective, we mean that people\'s care, treatment and support achieves good outcomes, ' +
      'promotes a good quality of life and is based on the best available evidence.',
    inspectorFocus: [
      'Evidence-based care protocols and guidelines',
      'Staff competency and continuous professional development',
      'Nutrition and hydration (care homes)',
      'Multi-disciplinary team working',
      'Health promotion and preventive care',
      'Consent processes and Mental Capacity Act compliance',
    ],
  },

  CARING: {
    code: 'CARING',
    name: 'Caring',
    icon: 'Heart',
    color: 'pink',
    hexColor: '#ec4899',
    sortOrder: 3,
    weight: 1.0,
    kloeCount: 3,
    keyQuestion: 'Does the service involve and treat people with compassion, kindness, dignity and respect?',
    description:
      'By caring, we mean that the service involves and treats people with compassion, kindness, ' +
      'dignity and respect.',
    inspectorFocus: [
      'Observations of staff-patient/resident interactions',
      'Patient/resident feedback and testimonials',
      'Involvement in care planning and shared decision-making',
      'Privacy and dignity measures',
      'Emotional support availability',
      'Chaperone policies and practices',
    ],
  },

  RESPONSIVE: {
    code: 'RESPONSIVE',
    name: 'Responsive',
    icon: 'ArrowRightLeft',
    color: 'amber',
    hexColor: '#f59e0b',
    sortOrder: 4,
    weight: 1.0,
    kloeCount: 3,
    keyQuestion: 'Are services organised so that they meet people\'s needs?',
    description:
      'By responsive, we mean that services meet people\'s needs.',
    inspectorFocus: [
      'Person-centred care planning',
      'Reasonable adjustments for individuals',
      'Complaints process and outcomes',
      'Waiting times and access (clinics)',
      'End-of-life care quality (care homes)',
      'Activities and social engagement (care homes)',
    ],
  },

  WELL_LED: {
    code: 'WELL_LED',
    name: 'Well-Led',
    icon: 'Award',
    color: 'emerald',
    hexColor: '#10b981',
    sortOrder: 5,
    weight: 1.0,
    kloeCount: 6,
    keyQuestion: 'Is the leadership, management and governance of the organisation assuring delivery of high-quality, person-centred care?',
    description:
      'By well-led, we mean that the leadership, management and governance of the organisation ' +
      'assures the delivery of high-quality person-centred care, supports learning and innovation, ' +
      'and promotes an open and fair culture.',
    inspectorFocus: [
      'Leadership visibility and accessibility',
      'Governance structures and meeting regularity',
      'Quality assurance and audit programmes',
      'Risk register management',
      'Staff engagement and morale',
      'Duty of candour compliance',
      'CQC rating displayed publicly',
    ],
  },
} as const;

export type CqcDomainCode = keyof typeof CQC_DOMAINS;
```

---

## 3. Key Lines of Enquiry — Full Specification

Each KLOE is the **complete definition** that Cursor needs to build the UI, assessment questions, evidence mapping, and scoring.

### 3.1 SAFE Domain (S1–S6)

#### S1 — Safeguarding Systems and Practices

```typescript
{
  code: 'S1',
  domain: 'SAFE',
  title: 'Safeguarding systems and practices',
  fullQuestion: 'How are people protected by the prevention and control of abuse?',
  sortOrder: 1,
  weight: 1.2,  // Higher weight — prosecutable regulation
  appliesToClinic: true,
  appliesToCareHome: true,

  // Service-specific context
  clinicGuidance:
    'Focus on: Safeguarding adults and children policies, DBS checks for all practitioners, ' +
    'staff training on recognising abuse, reporting procedures to local authority, ' +
    'chaperone policy for intimate examinations/treatments.',
  careHomeGuidance:
    'Focus on: Safeguarding adults policy, DoLS awareness and applications, ' +
    'MCA compliance, DBS checks for all staff, staff training frequency, ' +
    'reporting procedures, restraint and restrictive practices policy, ' +
    'protection of residents\' finances and possessions.',

  // Linked regulations (from official CQC mapping document)
  regulations: {
    suggested: ['REG13'],           // Safeguarding from abuse
    alsoConsider: ['REG12', 'REG18', 'REG19'],
  },

  // Evidence expectations
  evidenceExpected: {
    shared: [
      'Safeguarding adults policy (reviewed annually)',
      'Staff DBS check records (enhanced with barred list)',
      'Safeguarding training records (initial and refresher)',
      'Designated safeguarding lead identified',
      'Safeguarding referral log (anonymised)',
      'Whistleblowing / Freedom to Speak Up policy',
    ],
    clinicSpecific: [
      'Chaperone policy for intimate procedures',
      'Children and young persons policy (if treating under-18s)',
      'Record of professional registrations (GMC/NMC/GPhC/GDC)',
    ],
    careHomeSpecific: [
      'Deprivation of Liberty Safeguards (DoLS) applications and outcomes',
      'Mental Capacity Act assessments',
      'Best interest decision records',
      'Residents\' monies policy and audit trail',
      'Restraint and restrictive practices log',
      'Safeguarding children policy (if any residents have child visitors)',
    ],
  },

  // What inspectors specifically look for
  inspectorPrompts: [
    'Are systems, processes and practices safeguarding people from abuse?',
    'Do staff understand their roles and responsibilities regarding safeguarding?',
    'Are concerns and allegations investigated appropriately?',
    'Are safeguarding referrals made to the local authority?',
    'How does the service learn from safeguarding events?',
  ],

  // Rating characteristics
  ratingCharacteristics: {
    outstanding: 'Proactive safeguarding culture with regular scenario training, multi-agency collaboration, and evidence of safeguarding improvements driving service-wide change.',
    good: 'Robust safeguarding policy, trained staff, timely referrals, clear designated lead, regular audit of safeguarding activity.',
    requiresImprovement: 'Policy exists but staff knowledge is inconsistent, DBS checks not always timely, referral log incomplete.',
    inadequate: 'No safeguarding policy or outdated, untrained staff, failure to report concerns, evidence of abuse not investigated.',
  },
}
```

#### S2 — Risk Assessment, Safety Monitoring and Management

```typescript
{
  code: 'S2',
  domain: 'SAFE',
  title: 'Risk assessment, safety monitoring and management',
  fullQuestion: 'How are risks to people assessed and their safety monitored and managed so they are supported to stay safe and their freedom is respected?',
  sortOrder: 2,
  weight: 1.2,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Procedure-specific risk assessments (e.g. for laser treatments, injectables), ' +
    'clinical risk scoring, allergy checks, pre-treatment medical history review, ' +
    'equipment safety checks, fire risk assessment, Legionella risk assessment, ' +
    'sharps and clinical waste management.',
  careHomeGuidance:
    'Focus on: Individual risk assessments for each resident (falls, pressure ulcers, ' +
    'choking, malnutrition, moving and handling, skin integrity), environmental risk assessments, ' +
    'fire drills and evacuation plans (PEEP), ligature risk assessments, ' +
    'water temperature monitoring, window restrictors, equipment maintenance.',

  regulations: {
    suggested: ['REG12'],
    alsoConsider: ['REG13', 'REG15', 'REG17', 'REG18'],
  },

  evidenceExpected: {
    shared: [
      'Risk assessment policy and procedure',
      'Fire risk assessment (reviewed annually)',
      'Health and safety policy',
      'Environmental risk assessment',
      'Legionella risk assessment and water management plan',
      'Equipment maintenance log and PAT testing records',
      'COSHH assessments for hazardous substances',
      'Business continuity / emergency plan',
    ],
    clinicSpecific: [
      'Procedure-specific risk assessments (per treatment type)',
      'Laser safety risk assessment (if using Class 3B/4 lasers)',
      'Laser Protection Advisor appointment letter',
      'Local Rules for laser/IPL use',
      'Pre-treatment screening tools / medical questionnaires',
      'Sharps management policy and sharps injury log',
      'Clinical waste management contract and audit',
    ],
    careHomeSpecific: [
      'Individual resident risk assessments (falls, pressure, nutrition, moving & handling)',
      'Personal Emergency Evacuation Plans (PEEPs) for each resident',
      'Night-time safety monitoring arrangements',
      'Bed rail risk assessments',
      'Window and door restrictors checked',
      'Ligature risk assessment (if residents at risk of self-harm)',
      'Water temperature monitoring log (bath/shower)',
      'Fire drill log with evacuation times',
    ],
  },

  inspectorPrompts: [
    'Are comprehensive risk assessments carried out for people?',
    'Are risk assessments regularly reviewed and updated?',
    'Do staff know where risk assessments are stored and how to follow them?',
    'How does the service balance managing risks with supporting independence?',
    'Is equipment properly maintained and checked?',
  ],

  ratingCharacteristics: {
    outstanding: 'Risk management embedded in culture, innovative approaches to balancing safety with independence, robust learning from near-misses.',
    good: 'Up-to-date risk assessments for all individuals, regular environmental checks, clear escalation procedures, good staff awareness.',
    requiresImprovement: 'Risk assessments exist but are outdated or generic, some environmental hazards not addressed, inconsistent staff knowledge.',
    inadequate: 'Missing risk assessments, known hazards unaddressed, serious safety concerns, inadequate emergency planning.',
  },
}
```

#### S3 — Sufficient Suitable Staff

```typescript
{
  code: 'S3',
  domain: 'SAFE',
  title: 'Sufficient suitable staff to keep people safe',
  fullQuestion: 'Are there sufficient numbers of suitably qualified, competent, skilled and experienced staff to meet people\'s needs safely?',
  sortOrder: 3,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Practitioner qualifications and professional registration (GMC/NMC/GPhC/GDC/HCPC), ' +
    'appropriate staffing for appointment volumes, locum/agency practitioner vetting, ' +
    'clinical supervision arrangements, registered manager in post.',
  careHomeGuidance:
    'Focus on: Staffing ratios for day and night shifts, use of dependency tool to determine staffing, ' +
    'agency staff usage rates, recruitment and induction processes, staff turnover rates, ' +
    'vacancy rates, staff deployment across the home.',

  regulations: {
    suggested: ['REG18'],
    alsoConsider: ['REG12', 'REG19'],
  },

  evidenceExpected: {
    shared: [
      'Staffing policy',
      'Current staffing rota/schedule',
      'Recruitment policy (including safer recruitment practices)',
      'Staff induction programme outline',
      'Agency staff policy (if used)',
      'Staff turnover and vacancy data',
    ],
    clinicSpecific: [
      'Professional registration verification records (GMC/NMC/GPhC/GDC)',
      'Practitioner indemnity insurance certificates',
      'Clinical supervision schedule and records',
      'Continuing Professional Development (CPD) portfolios',
      'Locum/agency practitioner vetting procedure',
    ],
    careHomeSpecific: [
      'Staffing dependency tool and calculations',
      'Day and night staffing ratio documentation',
      'Registered nurse coverage schedule (if nursing home)',
      'Staff deployment plan per floor/unit',
      'Agency staff briefing and induction checklist',
      'Recruitment timeline tracking (DBS to start date)',
    ],
  },

  inspectorPrompts: [
    'How does the service determine safe staffing levels?',
    'Are staffing levels sufficient to meet people\'s needs safely?',
    'How are staff recruited safely?',
    'How are agency or temporary staff inducted and supported?',
    'Is there a registered manager in post?',
  ],

  ratingCharacteristics: {
    outstanding: 'Staffing levels consistently exceed minimum requirements, innovative recruitment and retention strategies, minimal agency usage.',
    good: 'Adequate staffing with clear rationale, safe recruitment practices, managed agency usage, registered manager in post.',
    requiresImprovement: 'Frequent understaffing, high agency use, slow recruitment, gaps in induction.',
    inadequate: 'Persistent dangerous understaffing, unsafe recruitment practices, no registered manager, excessive reliance on agency staff.',
  },
}
```

#### S4 — Proper and Safe Use of Medicines

```typescript
{
  code: 'S4',
  domain: 'SAFE',
  title: 'Proper and safe use of medicines',
  fullQuestion: 'How does the service make sure that medicines are managed properly and people are safe?',
  sortOrder: 4,
  weight: 1.2,  // Prosecutable — higher weight
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Prescribing arrangements (independent prescriber, PGDs, PSDs), ' +
    'storage of Prescription Only Medicines (POMs), cold chain management for biologics, ' +
    'Botulinum toxin handling protocols, controlled drugs (if applicable), ' +
    'medicines waste disposal, emergency medicines (anaphylaxis kit, hyaluronidase).',
  careHomeGuidance:
    'Focus on: Medication Administration Record (MAR) chart accuracy, medicines storage and security, ' +
    'controlled drugs register, PRN (as needed) protocols, covert medication policy, ' +
    'medicines errors log and reporting, pharmacy audit trail, ' +
    'self-medication assessments, medicines disposal (denaturing kits).',

  regulations: {
    suggested: ['REG12'],
    alsoConsider: ['REG17'],
  },

  evidenceExpected: {
    shared: [
      'Medicines management policy',
      'Medicines storage audit (temperature monitoring)',
      'Medicines error/incident log',
      'Staff competency assessments for medicines administration',
      'Medicines disposal records',
    ],
    clinicSpecific: [
      'Prescribing policy (who can prescribe, what, under what authority)',
      'Patient Group Directions (PGDs) — signed, in date',
      'Patient Specific Directions (PSDs) — templates and records',
      'Cold chain management log (fridge temperatures for biologics)',
      'Emergency medicines checklist (anaphylaxis kit, hyaluronidase, oxygen)',
      'Controlled drugs register (if applicable)',
      'Botulinum toxin batch tracking and traceability',
    ],
    careHomeSpecific: [
      'MAR chart audit (monthly recommended)',
      'Controlled drugs register and double-signature log',
      'PRN protocol for each PRN medicine',
      'Covert medication policy and best interest assessments',
      'Self-medication risk assessments',
      'Pharmacy returns and disposal records (denaturing kits)',
      'Homely remedy protocol',
      'Medicines reconciliation on admission',
    ],
  },

  inspectorPrompts: [
    'How are medicines managed, administered and stored safely?',
    'Are medicines audits conducted regularly?',
    'How are medicines errors reported, investigated and learned from?',
    'How is prescribing managed safely?',
    'Are controlled drugs managed in line with regulations?',
  ],

  ratingCharacteristics: {
    outstanding: 'Exemplary medicines management with proactive audit, near-zero error rate, innovative approaches to reducing medication risks.',
    good: 'Safe prescribing arrangements, regular audits, clear error reporting, proper storage, trained staff.',
    requiresImprovement: 'Some medicines errors, inconsistent audit, storage issues, gaps in PRN protocols.',
    inadequate: 'Serious medicines errors, no audit trail, unsafe storage, unlicensed prescribing, controlled drug discrepancies.',
  },
}
```

#### S5 — Prevention and Control of Infection

```typescript
{
  code: 'S5',
  domain: 'SAFE',
  title: 'Prevention and control of infection',
  fullQuestion: 'How does the service prevent and control the risk of infection?',
  sortOrder: 5,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Clinical decontamination procedures, single-use device policy, ' +
    'autoclave validation (if reprocessing instruments), clinical waste segregation, ' +
    'hand hygiene audits, PPE usage, treatment room cleaning schedules, ' +
    'sharps management, skin preparation protocols.',
  careHomeGuidance:
    'Focus on: IPC policy, cleaning schedules and audits, hand hygiene audits, ' +
    'outbreak management plan (norovirus, COVID-19), food hygiene rating, ' +
    'laundry management (soiled linen), PPE availability and training, ' +
    'antibiotic stewardship awareness.',

  regulations: {
    suggested: ['REG12', 'REG15'],
    alsoConsider: ['REG17'],
  },

  evidenceExpected: {
    shared: [
      'Infection prevention and control (IPC) policy',
      'Cleaning schedule and audit records',
      'Hand hygiene audit results',
      'PPE policy and stock management',
      'Clinical waste management procedure and contract',
      'Staff IPC training records',
      'Outbreak management plan',
    ],
    clinicSpecific: [
      'Decontamination policy for reusable instruments',
      'Autoclave validation and test records (if applicable)',
      'Single-use device policy and audit',
      'Treatment room cleaning checklist (between patients)',
      'Sharps policy and sharps injury log',
      'Skin preparation protocol for procedures',
    ],
    careHomeSpecific: [
      'Food hygiene rating certificate',
      'Kitchen deep-clean schedule',
      'Soiled laundry management procedure',
      'Catheter care protocol (if applicable)',
      'Mattress audit and replacement schedule',
      'Antibiotic stewardship awareness training',
      'COVID-19 / respiratory illness protocol',
    ],
  },

  inspectorPrompts: [
    'What IPC training have staff received?',
    'How are cleaning standards monitored?',
    'How are outbreaks managed?',
    'Is equipment decontaminated appropriately?',
    'How is clinical waste handled and disposed of?',
  ],

  ratingCharacteristics: {
    outstanding: 'Exemplary IPC with regular audits exceeding standards, proactive environmental monitoring, IPC champions identified.',
    good: 'Comprehensive IPC policy, regular cleaning audits, trained staff, proper waste management, PPE available.',
    requiresImprovement: 'IPC policy outdated, inconsistent cleaning, gaps in hand hygiene audit, some waste management issues.',
    inadequate: 'Poor hygiene standards, no IPC policy, untrained staff, clinical waste handled unsafely, evidence of infection outbreaks poorly managed.',
  },
}
```

#### S6 — Learning and Improvement from Safety Incidents

```typescript
{
  code: 'S6',
  domain: 'SAFE',
  title: 'Learning and improvement from safety incidents',
  fullQuestion: 'Are lessons learned and improvements made when things go wrong?',
  sortOrder: 6,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Adverse event/complication reporting procedure, clinical incident log, ' +
    'root cause analysis for significant events, sharing learning with practitioners, ' +
    'patient safety alerts awareness (MHRA, CAS alerts), duty of candour implementation.',
  careHomeGuidance:
    'Focus on: Incident and accident log, falls analysis, medication error analysis, ' +
    'safeguarding referral outcomes review, near-miss reporting culture, ' +
    'learning shared in staff meetings, notifications to CQC, ' +
    'death review and mortality analysis.',

  regulations: {
    suggested: ['REG12', 'REG17', 'REG20'],
    alsoConsider: ['REG13'],
  },

  evidenceExpected: {
    shared: [
      'Incident reporting policy and procedure',
      'Incident / accident log (current year)',
      'Root cause analysis / investigation reports',
      'Evidence of learning shared with staff (meeting minutes)',
      'Duty of candour policy and compliance records',
      'CQC notifications log (statutory notifications submitted)',
      'MHRA / CAS safety alert response log',
    ],
    clinicSpecific: [
      'Adverse event/complication log per procedure type',
      'Clinical governance meeting minutes (reviewing incidents)',
      'Patient safety incident report (NRLS/LFPSE submissions if applicable)',
      'Improvement actions from clinical audit',
    ],
    careHomeSpecific: [
      'Falls analysis and trends report',
      'Medication error trends and actions',
      'Safeguarding referral outcome tracking',
      'Death notification and review process',
      'Staff debrief records after serious incidents',
      'Near-miss reporting log',
    ],
  },

  inspectorPrompts: [
    'How does the service report and investigate incidents?',
    'How are lessons learned shared across the service?',
    'Is there evidence of changes made as a result of incidents?',
    'How is duty of candour implemented?',
    'Are statutory notifications made appropriately?',
  ],

  ratingCharacteristics: {
    outstanding: 'Strong safety culture with proactive near-miss reporting, thematic analysis, evidence of system-wide improvements from incidents.',
    good: 'Clear incident reporting process, investigations completed timely, learning shared, duty of candour compliant.',
    requiresImprovement: 'Incidents reported but investigations delayed, learning not consistently shared, some statutory notifications missed.',
    inadequate: 'No incident reporting system, serious incidents not investigated, no evidence of learning, duty of candour not implemented.',
  },
}
```

### 3.2 EFFECTIVE Domain (E1–E7)

#### E1 — Evidence-Based Care and Treatment

```typescript
{
  code: 'E1',
  domain: 'EFFECTIVE',
  title: 'Evidence-based care and treatment',
  fullQuestion: 'Are people\'s needs assessed and care and treatment delivered in line with current legislation, standards and evidence-based guidance?',
  sortOrder: 1,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Clinical protocols based on NICE/professional body guidelines, ' +
    'treatment pathways documented, clinical audit programme, use of validated outcome measures, ' +
    'pre-treatment assessment process, aftercare protocols.',
  careHomeGuidance:
    'Focus on: Care plans based on assessed needs (using validated tools), ' +
    'NICE guidelines adherence, GP involvement in care planning, ' +
    'health action plans, hospital passport for hospital transfers.',

  regulations: {
    suggested: ['REG9', 'REG12'],
    alsoConsider: ['REG17'],
  },

  evidenceExpected: {
    shared: [
      'Clinical / care protocols based on current guidelines',
      'Evidence of NICE guideline adherence',
      'Clinical audit programme and results',
      'Staff access to current clinical guidance',
    ],
    clinicSpecific: [
      'Treatment protocols per procedure type (referencing evidence base)',
      'Pre-treatment assessment forms',
      'Validated outcome measures (e.g. patient satisfaction, complication rates)',
      'Aftercare information leaflets per procedure',
      'Clinical audit results with improvement actions',
      'Before/after photography protocol and consent',
    ],
    careHomeSpecific: [
      'Person-centred care plans (reviewed monthly minimum)',
      'Pre-admission assessment records',
      'Validated assessment tools in use (Waterlow, MUST, Abbey Pain Scale)',
      'GP visit log and outcomes',
      'Hospital passport / transfer documentation',
      'Health action plans for each resident',
    ],
  },
}
```

#### E2 — Staff Skills, Knowledge and Experience

```typescript
{
  code: 'E2',
  domain: 'EFFECTIVE',
  title: 'Staff skills, knowledge and experience',
  fullQuestion: 'Do staff have the skills, knowledge and experience to deliver effective care, support and treatment?',
  sortOrder: 2,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Professional registration verification (GMC/NMC/GPhC/GDC/HCPC), ' +
    'CPD portfolios, procedure-specific competency assessments, supervision and appraisal, ' +
    'mandatory training compliance (BLS, anaphylaxis, safeguarding, IPC).',
  careHomeGuidance:
    'Focus on: Mandatory training compliance matrix, supervision and appraisal records, ' +
    'Care Certificate completion for new care workers, dementia training (if applicable), ' +
    'moving and handling competency, medicines competency assessments.',

  regulations: {
    suggested: ['REG18'],
    alsoConsider: ['REG12', 'REG17'],
  },

  evidenceExpected: {
    shared: [
      'Training matrix showing all staff and course completion',
      'Mandatory training schedule with compliance rates',
      'Supervision and appraisal policy and records',
      'Induction programme outline and completion records',
    ],
    clinicSpecific: [
      'Professional registration verification log (checked annually)',
      'CPD portfolio evidence for each practitioner',
      'Procedure-specific competency sign-off records',
      'BLS / ILS certification for all clinical staff',
      'Anaphylaxis management training records',
      'Laser / IPL operator certification (if applicable)',
      'Clinical supervision records',
    ],
    careHomeSpecific: [
      'Care Certificate completion records (within 12 weeks of start)',
      'Dementia awareness training (Tier 1–3 as appropriate)',
      'Moving and handling practical competency assessments',
      'Medicines administration competency sign-offs',
      'Safeguarding training (Level 1 and refreshers)',
      'First aid training records',
      'Food hygiene training (kitchen staff)',
    ],
  },
}
```

#### E3 — Nutrition and Hydration

```typescript
{
  code: 'E3',
  domain: 'EFFECTIVE',
  title: 'Nutrition and hydration support',
  fullQuestion: 'How are people supported to eat and drink enough to maintain a balanced diet?',
  sortOrder: 3,
  weight: 1.0,
  appliesToClinic: false,    // NOT applicable to aesthetic clinics
  appliesToCareHome: true,

  clinicGuidance: null,      // N/A for clinics
  careHomeGuidance:
    'Focus on: MUST screening on admission and monthly, food and fluid charts, ' +
    'weight monitoring, mealtime experience observations, dietary preferences, ' +
    'speech and language therapy referrals, fortified diets, hydration stations.',

  regulations: {
    suggested: ['REG14'],
    alsoConsider: ['REG9', 'REG12'],
  },

  evidenceExpected: {
    shared: [],
    clinicSpecific: [],
    careHomeSpecific: [
      'MUST screening tool completed on admission and reviewed',
      'Food and fluid intake charts (as required)',
      'Weight monitoring records',
      'Menu plans (including special diets, allergies, cultural needs)',
      'Mealtime observation audit',
      'SALT referral and recommendation records',
      'Dietitian involvement records',
      'Food hygiene certificate / EHO rating',
      'Hydration strategy (e.g. hydration stations, fluid targets)',
      'Fortified diet plans where needed',
    ],
  },
}
```

#### E4 — Staff Coordination Across Teams

```typescript
{
  code: 'E4',
  domain: 'EFFECTIVE',
  title: 'Staff coordination across teams and services',
  fullQuestion: 'How well do staff, teams and services within and across organisations work together to deliver effective care, support and treatment?',
  sortOrder: 4,
  weight: 0.8,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: MDT working where applicable, referral pathways to other specialists, ' +
    'handover processes, shared care records, communication with GPs.',
  careHomeGuidance:
    'Focus on: MDT meeting records, GP liaison, district nurse visits, ' +
    'hospital discharge coordination, social worker involvement, ' +
    'specialist referral pathways (SALT, dietitian, tissue viability).',

  regulations: {
    suggested: ['REG9', 'REG17'],
    alsoConsider: ['REG12'],
  },

  evidenceExpected: {
    shared: [
      'Handover/communication procedures',
      'Referral pathway documentation',
    ],
    clinicSpecific: [
      'Referral letter templates to GPs/specialists',
      'Shared care protocols with prescribers',
      'Communication log with external providers',
    ],
    careHomeSpecific: [
      'MDT meeting schedule and minutes',
      'GP liaison records (visit log, outcomes)',
      'District nurse visit records',
      'Hospital discharge checklist',
      'Social worker involvement records',
    ],
  },
}
```

#### E5 — Supporting Healthier Lives

```typescript
{
  code: 'E5',
  domain: 'EFFECTIVE',
  title: 'Supporting healthier lives and healthcare access',
  fullQuestion: 'How are people supported to live healthier lives, have access to healthcare services and receive ongoing healthcare support?',
  sortOrder: 5,
  weight: 0.8,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Health promotion materials, preventive care offered, ' +
    'signposting to support services, follow-up and recall systems.',
  careHomeGuidance:
    'Focus on: Access to NHS services (dentist, optician, chiropodist), ' +
    'health screening participation, immunisation uptake, ' +
    'health promotion activities, smoking cessation support.',

  regulations: {
    suggested: ['REG9', 'REG12'],
    alsoConsider: ['REG13', 'REG17'],
  },

  evidenceExpected: {
    shared: [
      'Health promotion materials available',
      'Signposting to support services',
    ],
    clinicSpecific: [
      'Patient recall and follow-up system',
      'Lifestyle advice documented in records',
      'Screening offered where appropriate',
    ],
    careHomeSpecific: [
      'Healthcare professional visit schedule (dentist, optician, chiropodist)',
      'Annual flu / COVID vaccination uptake records',
      'Health screening participation records',
      'Activity programme promoting physical health',
    ],
  },
}
```

#### E6 — Premises Adaptation and Design

```typescript
{
  code: 'E6',
  domain: 'EFFECTIVE',
  title: 'Premises adaptation, design and decoration',
  fullQuestion: 'How are people\'s individual needs met by the adaptation, design and decoration of the service?',
  sortOrder: 6,
  weight: 0.8,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Accessible premises (DDA compliance), adequate treatment rooms, ' +
    'appropriate equipment for services offered, waiting area, privacy provisions.',
  careHomeGuidance:
    'Focus on: Dementia-friendly design, personalised bedrooms, ' +
    'accessible bathrooms, signage, lighting, outdoor spaces, ' +
    'sensory stimulation areas, quiet rooms.',

  regulations: {
    suggested: ['REG15'],
    alsoConsider: ['REG9', 'REG10', 'REG17'],
  },

  evidenceExpected: {
    shared: [
      'Premises accessibility assessment',
      'Equipment inventory and maintenance schedule',
      'Environmental audit records',
    ],
    clinicSpecific: [
      'Treatment room specifications and equipment list',
      'DDA compliance assessment',
      'Laser safety room requirements met (if applicable)',
      'Recovery area provisions',
    ],
    careHomeSpecific: [
      'Dementia-friendly environment audit (if applicable)',
      'Personalisation of bedrooms policy and evidence',
      'Outdoor space accessibility and use',
      'Signage and wayfinding assessment',
      'Bathroom adaptation records',
    ],
  },
}
```

#### E7 — Consent in Line with Legislation

```typescript
{
  code: 'E7',
  domain: 'EFFECTIVE',
  title: 'Consent in line with legislation',
  fullQuestion: 'Is consent to care and treatment always sought in line with legislation and guidance?',
  sortOrder: 7,
  weight: 1.2,  // Prosecutable regulation — higher weight
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Treatment-specific informed consent forms, cooling-off period compliance ' +
    '(mandatory for cosmetic procedures), capacity to consent assessment, ' +
    'information provided before consent (risks, alternatives, outcomes), ' +
    'photographic consent, data processing consent, right to withdraw.',
  careHomeGuidance:
    'Focus on: Mental Capacity Act 2005 compliance, capacity assessments documented, ' +
    'best interest decision-making, DoLS applications and authorisations, ' +
    'Lasting Power of Attorney records, advance decisions to refuse treatment, ' +
    'consent to share information.',

  regulations: {
    suggested: ['REG11'],
    alsoConsider: ['REG9', 'REG10', 'REG17'],
  },

  evidenceExpected: {
    shared: [
      'Consent policy referencing Mental Capacity Act 2005',
      'Staff training on consent and MCA',
      'Capacity assessment tool / template',
    ],
    clinicSpecific: [
      'Treatment-specific consent forms for each procedure',
      'Cooling-off period policy (minimum 2 weeks for surgical, 48hrs for non-surgical)',
      'Patient information leaflets given before consent',
      'Photographic consent form (separate from treatment consent)',
      'Record of information provided (risks, benefits, alternatives)',
      'Psychological assessment / BDD screening tool (where appropriate)',
    ],
    careHomeSpecific: [
      'Mental Capacity Act assessment forms',
      'Best interest decision records',
      'DoLS application records and authorisation tracking',
      'LPA / Court of Protection order copies',
      'Advance decision to refuse treatment records',
      'Consent to share information forms',
      'Staff MCA and DoLS training records',
    ],
  },
}
```

### 3.3 CARING Domain (C1–C3)

#### C1 — Kindness, Respect, Compassion

```typescript
{
  code: 'C1',
  domain: 'CARING',
  title: 'Kindness, respect, compassion and emotional support',
  fullQuestion: 'Are people treated with kindness, respect, compassion and given emotional support when needed?',
  sortOrder: 1,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Patient feedback and satisfaction surveys (Friends & Family Test), ' +
    'compliments log, staff customer care training, ' +
    'evidence of emotional support provision, chaperone availability.',
  careHomeGuidance:
    'Focus on: Observations of staff-resident interactions, resident/family feedback, ' +
    'compliments log, staff values-based recruitment, ' +
    'emotional support provision, bereavement support for families.',

  regulations: {
    suggested: ['REG10'],
    alsoConsider: ['REG9'],
  },

  evidenceExpected: {
    shared: [
      'Patient/resident feedback system (surveys, comment cards)',
      'Compliments and positive feedback log',
      'Staff training on compassionate care / values',
      'Evidence of emotional support provision',
    ],
    clinicSpecific: [
      'Friends & Family Test (FFT) results and actions',
      'Patient satisfaction survey results',
      'Chaperone availability and awareness',
      'Follow-up care contact after procedures',
    ],
    careHomeSpecific: [
      'Residents\' meeting minutes',
      'Relatives\' meeting minutes / family survey results',
      'Key worker system and relationship evidence',
      'Life story work / "This is me" documents',
      'Bereavement support for residents and families',
    ],
  },
}
```

#### C2 — Supporting People in Care Decisions

```typescript
{
  code: 'C2',
  domain: 'CARING',
  title: 'Supporting people in care decisions',
  fullQuestion: 'Are people supported to express their views and be actively involved in making decisions about their care, support and treatment?',
  sortOrder: 2,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Shared decision-making documented in records, ' +
    'patient involvement in treatment planning, communication aids if needed, ' +
    'interpreter service access, advocacy referral process.',
  careHomeGuidance:
    'Focus on: Resident involvement in care plan reviews, ' +
    'advocacy referrals, communication aids, accessible information, ' +
    'residents\' choice in daily routines (waking, mealtimes, activities).',

  regulations: {
    suggested: ['REG9', 'REG10', 'REG11'],
    alsoConsider: [],
  },

  evidenceExpected: {
    shared: [
      'Evidence of shared decision-making in records',
      'Communication aids available if needed',
      'Interpreter / translation service access',
      'Advocacy referral process',
    ],
    clinicSpecific: [
      'Treatment options discussed and documented',
      'Patient preferences recorded in notes',
      'Accessible Information Standard compliance',
    ],
    careHomeSpecific: [
      'Resident involvement documented in care plan reviews',
      'Residents\' daily routine preferences recorded and respected',
      'Independent advocacy referral records',
      'Accessible information in appropriate formats',
    ],
  },
}
```

#### C3 — Privacy, Dignity and Independence

```typescript
{
  code: 'C3',
  domain: 'CARING',
  title: 'Privacy, dignity and independence',
  fullQuestion: 'Are people\'s privacy, dignity and independence respected and promoted?',
  sortOrder: 3,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Private consultation rooms, confidentiality policy, ' +
    'GDPR compliance, chaperone policy, appropriate signage and privacy measures, ' +
    'staff training on equality and diversity.',
  careHomeGuidance:
    'Focus on: Knocking before entering rooms, supporting independence in daily activities, ' +
    'personal care provided with dignity, visitors privacy, ' +
    'personal possessions security, mail privacy.',

  regulations: {
    suggested: ['REG10', 'REG15'],
    alsoConsider: ['REG9'],
  },

  evidenceExpected: {
    shared: [
      'Confidentiality / data protection policy',
      'GDPR compliance documentation',
      'Staff equality and diversity training',
      'Privacy and dignity audit',
    ],
    clinicSpecific: [
      'Private consultation room availability',
      'Chaperone policy and usage records',
      'Patient data security measures',
      'Before/after photography privacy protocol',
    ],
    careHomeSpecific: [
      'Dignity in care policy',
      'Independence promotion evidence',
      'Personal possessions security measures',
      'En-suite / bathroom privacy provisions',
      'Visitors\' policy respecting privacy',
    ],
  },
}
```

### 3.4 RESPONSIVE Domain (R1–R3)

#### R1 — Personalised, Responsive Care

```typescript
{
  code: 'R1',
  domain: 'RESPONSIVE',
  title: 'Personalised, responsive care',
  fullQuestion: 'How do people receive personalised care that is responsive to their needs?',
  sortOrder: 1,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Individualised treatment plans, patient preferences documented, ' +
    'reasonable adjustments for disabilities (Equality Act), flexible appointment options, ' +
    'translation/interpretation services.',
  careHomeGuidance:
    'Focus on: Person-centred care plans, "This is me" / "One page profile" documents, ' +
    'activities programme tailored to interests, reasonable adjustments, ' +
    'cultural and religious needs respected.',

  regulations: {
    suggested: ['REG9', 'REG10', 'REG11'],
    alsoConsider: [],
  },

  evidenceExpected: {
    shared: [
      'Individualised care/treatment plans',
      'Reasonable adjustments policy and evidence',
      'Equality Act compliance',
      'Accessible Information Standard compliance',
    ],
    clinicSpecific: [
      'Patient preferences recorded in treatment plans',
      'Flexible appointment options (evenings, weekends if offered)',
      'Follow-up protocols per treatment type',
      'Multi-language information materials',
    ],
    careHomeSpecific: [
      'Person-centred care plans with life history',
      '"This is me" / "One page profile" for each resident',
      'Activities programme (varied, inclusive, personalised)',
      'Cultural and religious needs assessment and provision',
      'Communication passports for complex needs',
    ],
  },
}
```

#### R2 — Complaints Handling

```typescript
{
  code: 'R2',
  domain: 'RESPONSIVE',
  title: 'Complaints handling and quality improvement',
  fullQuestion: 'How are people\'s concerns and complaints listened and responded to and used to improve the quality of care?',
  sortOrder: 2,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Complaints policy (accessible, timely, thorough), ' +
    'complaints log with outcomes, response letters, ' +
    'evidence of improvements from complaints, patient feedback mechanisms.',
  careHomeGuidance:
    'Focus on: Complaints policy, complaints log with outcomes and timescales, ' +
    'response letters, relatives\' feedback mechanisms, residents\' meetings, ' +
    'evidence of service changes from complaints.',

  regulations: {
    suggested: ['REG16', 'REG17', 'REG20'],
    alsoConsider: [],
  },

  evidenceExpected: {
    shared: [
      'Complaints policy (easily accessible to service users)',
      'Complaints log with dates, outcomes, and timescales',
      'Response letters to complainants',
      'Evidence of improvements made from complaints',
      'Patient/resident feedback mechanisms',
      'Duty of candour compliance in complaint responses',
    ],
    clinicSpecific: [
      'Complaints information displayed in waiting area',
      'Online review monitoring and response process',
      'Patient feedback forms / post-treatment surveys',
    ],
    careHomeSpecific: [
      'Complaints information in welcome pack',
      'Relatives\' meetings and feedback',
      'Resident satisfaction surveys',
      'Complaints escalation to local authority/ombudsman information',
    ],
  },
}
```

#### R3 — End-of-Life Care / Timely Access (Service-Type Specific)

```typescript
{
  code: 'R3',
  domain: 'RESPONSIVE',
  title: 'End-of-life care / Timely access to care',
  fullQuestion: {
    careHome: 'Are people at the end of their life supported to have a comfortable, dignified and pain-free death?',
    clinic: 'How do people access care and treatment in a timely way?',
  },
  sortOrder: 3,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  // ⚠️ CRITICAL: This KLOE means COMPLETELY DIFFERENT things per service type
  clinicGuidance:
    '⚠️ FOR CLINICS: R3 = TIMELY ACCESS TO CARE. ' +
    'Focus on: Appointment availability and waiting times, DNA rates and follow-up, ' +
    'urgent appointment availability, out-of-hours arrangements, ' +
    'patient feedback on access.',
  careHomeGuidance:
    '⚠️ FOR CARE HOMES: R3 = END-OF-LIFE CARE. ' +
    'Focus on: Advance care planning, DNACPR decision records, ' +
    'preferred priorities of care (PPC) documents, pain management, ' +
    'Gold Standards Framework or equivalent, syringe driver competency, ' +
    'bereavement support for families and residents.',

  regulations: {
    suggested: ['REG9', 'REG12'],
    alsoConsider: ['REG10', 'REG17'],
  },

  evidenceExpected: {
    shared: [],
    clinicSpecific: [
      'Appointment availability data / utilisation rates',
      'Waiting time monitoring',
      'DNA (Did Not Attend) rates and follow-up actions',
      'Urgent appointment availability',
      'Out-of-hours contact arrangements',
      'Patient feedback on access and waiting times',
    ],
    careHomeSpecific: [
      'Advance care planning policy',
      'Advance care plans for relevant residents',
      'DNACPR decision records (properly completed)',
      'Preferred priorities of care / ReSPECT forms',
      'End-of-life care training for staff',
      'Syringe driver competency records (if nursing home)',
      'Pain assessment tools (e.g. Abbey Pain Scale)',
      'Anticipatory prescribing arrangements',
      'Bereavement support for families and other residents',
      'Gold Standards Framework / NACEL participation',
    ],
  },
}
```

### 3.5 WELL-LED Domain (W1–W6)

#### W1 — Vision, Strategy and Positive Culture

```typescript
{
  code: 'W1',
  domain: 'WELL_LED',
  title: 'Vision, strategy and positive culture',
  fullQuestion: 'Is there the leadership capacity and capability to deliver high-quality, person-centred care?',
  sortOrder: 1,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  regulations: {
    suggested: ['REG17'],
    alsoConsider: ['REG5', 'REG7'],
  },

  evidenceExpected: {
    shared: [
      'Organisational structure chart',
      'Written vision / mission statement',
      'Strategic / business plan',
      'Leader qualifications and experience records',
      'Fit and Proper Person declarations (directors / responsible individuals)',
      'Staff feedback about leadership',
    ],
    clinicSpecific: [
      'Clinical director appointment and qualifications',
      'Registered manager DBS and qualifications',
      'Succession / contingency planning',
    ],
    careHomeSpecific: [
      'Registered manager qualifications (Level 5 Diploma or equivalent)',
      'Deputy manager arrangements',
      'Succession planning',
      'Manager visibility in the home (not just office-based)',
    ],
  },
}
```

#### W2 — Governance, Management and Accountability

```typescript
{
  code: 'W2',
  domain: 'WELL_LED',
  title: 'Governance, management and accountability',
  fullQuestion: 'Is there a clear vision and credible strategy to deliver high-quality care and support, and promote a positive culture?',
  sortOrder: 2,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  regulations: {
    suggested: ['REG17'],
    alsoConsider: ['REG5', 'REG6', 'REG7'],
  },

  evidenceExpected: {
    shared: [
      'Governance meeting schedule and minutes',
      'Quality assurance audit programme and results',
      'Policy register with review dates',
      'Clear job descriptions with responsibilities',
      'CQC rating displayed prominently (Reg 20A)',
      'CQC notifications submitted appropriately',
    ],
    clinicSpecific: [
      'Clinical governance meeting minutes',
      'Clinical audit programme and outcomes',
      'Quality improvement projects evidence',
    ],
    careHomeSpecific: [
      'Managers\' monthly quality audit report',
      'Provider / regional quality visits (if part of group)',
      'Regulation 17 (registered provider) monthly visit report',
    ],
  },
}
```

#### W3 — Engagement with People, Public and Staff

```typescript
{
  code: 'W3',
  domain: 'WELL_LED',
  title: 'Engagement with people, public and staff',
  fullQuestion: 'How are the people who use the service, the public and staff engaged and involved?',
  sortOrder: 3,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  regulations: {
    suggested: ['REG9', 'REG17'],
    alsoConsider: ['REG10', 'REG18', 'REG20'],
  },

  evidenceExpected: {
    shared: [
      'Staff engagement survey results and actions',
      'Whistleblowing / Freedom to Speak Up policy',
      'Patient / resident engagement strategy',
      'Open and transparent culture evidence',
    ],
    clinicSpecific: [
      'Patient surveys and published results',
      'Online review response policy',
      'Staff satisfaction measures',
    ],
    careHomeSpecific: [
      'Residents\' meetings and minutes',
      'Relatives\' meetings and feedback surveys',
      'Staff meetings and minutes',
      'Community engagement evidence',
      'Volunteer programme (if applicable)',
    ],
  },
}
```

#### W4 — Continuous Learning and Improvement

```typescript
{
  code: 'W4',
  domain: 'WELL_LED',
  title: 'Continuous learning, improvement and innovation',
  fullQuestion: 'How does the service continuously learn, improve, innovate and ensure sustainability?',
  sortOrder: 4,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  regulations: {
    suggested: ['REG17'],
    alsoConsider: ['REG5', 'REG7', 'REG16', 'REG20'],
  },

  evidenceExpected: {
    shared: [
      'Quality improvement plan / projects',
      'Evidence of learning from incidents, complaints, audits',
      'Benchmarking against peers / national standards',
      'Innovation examples',
    ],
    clinicSpecific: [
      'Clinical audit cycle (audit → action → re-audit)',
      'CPD evidence for all practitioners',
      'New treatment evaluation process',
      'Research / evidence review activities',
    ],
    careHomeSpecific: [
      'Quality improvement plan with measurable goals',
      'CQC action plan (if from previous inspection)',
      'Participation in quality networks (e.g. My Home Life)',
      'Awards / accreditations pursued',
    ],
  },
}
```

#### W5 — Partnership Working / Risk Management

```typescript
{
  code: 'W5',
  domain: 'WELL_LED',
  title: 'Risk management and partnership working',
  fullQuestion: {
    clinic: 'Are there clear processes for managing risks, issues and performance?',
    careHome: 'How does the service work in partnership with other agencies?',
  },
  sortOrder: 5,
  weight: 1.0,
  appliesToClinic: true,
  appliesToCareHome: true,

  // ⚠️ Different emphasis per service type
  clinicGuidance:
    'FOR CLINICS: Focus on risk and performance management — risk register, ' +
    'business continuity plan, KPI tracking, quality monitoring.',
  careHomeGuidance:
    'FOR CARE HOMES: Focus on partnership working — GP liaison, district nurses, ' +
    'social workers, hospital discharge teams, local authority, community groups.',

  regulations: {
    suggested: ['REG17'],
    alsoConsider: ['REG9', 'REG12'],
  },

  evidenceExpected: {
    shared: [
      'Risk register (reviewed regularly)',
      'Business continuity plan',
    ],
    clinicSpecific: [
      'Risk register with review dates and mitigations',
      'Business continuity plan (tested)',
      'Performance monitoring dashboards / KPIs',
      'Quality assurance monitoring programme',
      'External audit or accreditation evidence',
    ],
    careHomeSpecific: [
      'GP liaison records and regular visit schedule',
      'District nurse and specialist visit records',
      'Social worker involvement records',
      'Hospital admission/discharge liaison',
      'Local authority contract monitoring visits',
      'Community group engagement evidence',
      'Volunteer programme records (if applicable)',
    ],
  },
}
```

#### W6 — Information Management / Self-Assessment

```typescript
{
  code: 'W6',
  domain: 'WELL_LED',
  title: 'Information governance and self-assessment',
  fullQuestion: 'Is appropriate, accurate and up-to-date information available to all relevant staff to effectively manage the service?',
  sortOrder: 6,
  weight: 0.8,
  appliesToClinic: true,
  appliesToCareHome: true,

  clinicGuidance:
    'Focus on: Data security (UK GDPR, DPA 2018), NHS DSPT submission (if applicable), ' +
    'Caldicott principles awareness, information governance training, ' +
    'data breach procedure, records retention schedule.',
  careHomeGuidance:
    'Focus on: Records management, information sharing agreements, ' +
    'Data Security and Protection Toolkit submission, Caldicott Guardian, ' +
    'staff IG training, data breach procedure.',

  regulations: {
    suggested: ['REG17'],
    alsoConsider: [],
  },

  evidenceExpected: {
    shared: [
      'Information governance policy',
      'UK GDPR compliance documentation',
      'Data breach notification procedure',
      'Records retention schedule',
      'Staff information governance training records',
      'Data Protection Officer identified',
    ],
    clinicSpecific: [
      'Caldicott principles awareness training',
      'Patient records management policy',
      'Electronic records system security measures',
      'Cyber Essentials certification (recommended)',
    ],
    careHomeSpecific: [
      'Data Security and Protection Toolkit (DSPT) submission',
      'Caldicott Guardian appointed',
      'Information sharing agreements with partners',
      'Paper records security measures',
    ],
  },
}
```

---

## 4. Fundamental Standards (Regulations 9–20A)

### 4.1 Complete Regulation Reference

```typescript
// lib/constants/cqc-regulations.ts

export const CQC_REGULATIONS = {
  REG9: {
    code: 'REG9',
    number: '9',
    name: 'Person-centred care',
    isProsecutable: false,
    legislationRef: 'Health and Social Care Act 2008 (Regulated Activities) Regulations 2014, Regulation 9',
    summary: 'Care and treatment must be appropriate, meet needs, and reflect preferences.',
    fullDescription:
      'The intention of this regulation is to make sure that people using a service have care or ' +
      'treatment that is personalised specifically for them. This regulation describes the action ' +
      'that providers must take to make sure that each person receives appropriate person-centred ' +
      'care and treatment that is based on an assessment of their needs and preferences.',
    whatCqcExpects: [
      'People\'s needs and preferences are assessed before care is provided',
      'Care plans are person-centred and reviewed regularly',
      'People are involved in decisions about their care',
      'Reasonable adjustments are made for people with protected characteristics',
    ],
    enforcementActions: 'Warning notice, conditions, suspension, cancellation of registration',
  },

  REG9A: {
    code: 'REG9A',
    number: '9A',
    name: 'Visiting and accompanying',
    isProsecutable: false,
    legislationRef: 'Added 2021 — visiting rights in care settings',
    summary: 'Care home residents must be allowed visitors unless there are exceptional circumstances.',
    fullDescription:
      'This regulation (added post-pandemic in 2021) requires that care homes take steps to ' +
      'ensure residents can receive visitors safely. Providers must not prevent visits except ' +
      'in exceptional circumstances with clear justification.',
    whatCqcExpects: [
      'Visiting policy that supports residents\' right to see family and friends',
      'Risk-assessed approach to visiting rather than blanket bans',
      'Designated visitor schemes for essential caregivers',
    ],
    enforcementActions: 'Warning notice, conditions',
    appliesToClinic: false,
    appliesToCareHome: true,
  },

  REG10: {
    code: 'REG10',
    number: '10',
    name: 'Dignity and respect',
    isProsecutable: false,
    summary: 'People must be treated with dignity and respect at all times.',
    fullDescription:
      'People using services must be treated with dignity and respect. This includes ensuring ' +
      'people\'s privacy, supporting their autonomy and independence, and having regard for ' +
      'their protected equality characteristics.',
    whatCqcExpects: [
      'Staff treat people with kindness and respect',
      'People\'s privacy is maintained during personal care',
      'People\'s autonomy and independence are supported',
      'Equal treatment regardless of protected characteristics',
    ],
  },

  REG11: {
    code: 'REG11',
    number: '11',
    name: 'Need for consent',
    isProsecutable: true,  // ⚠️ CQC CAN PROSECUTE
    summary: 'Care and treatment must only be provided with consent or in accordance with the MCA 2005.',
    fullDescription:
      'This regulation is about consent to care and treatment. Providers must make sure that ' +
      'they obtain consent from people, or act in accordance with the Mental Capacity Act 2005 ' +
      'where a person lacks mental capacity to make a specific decision.',
    whatCqcExpects: [
      'Written consent obtained for all procedures and treatments',
      'Mental Capacity Act assessments when capacity is in doubt',
      'Best interest decisions properly documented',
      'Staff trained in consent and MCA',
      'Cooling-off periods observed for cosmetic procedures',
    ],
    prosecutionThreshold: 'Failure to obtain consent or act in accordance with MCA causing harm',
  },

  REG12: {
    code: 'REG12',
    number: '12',
    name: 'Safe care and treatment',
    isProsecutable: true,  // ⚠️ CQC CAN PROSECUTE
    summary: 'Care and treatment must be provided in a safe way, including assessing and mitigating risks.',
    fullDescription:
      'This is the most wide-ranging safety regulation. It covers risk assessment, medicines management, ' +
      'infection control, safety monitoring, and responding when things go wrong. Providers must do ' +
      'all that is reasonably practicable to mitigate risks.',
    whatCqcExpects: [
      'Risk assessments for all people using the service',
      'Safe medicines management',
      'Effective infection prevention and control',
      'Equipment properly maintained and used',
      'Incidents investigated and learned from',
    ],
    prosecutionThreshold: 'Avoidable harm caused by unsafe care or treatment',
  },

  REG13: {
    code: 'REG13',
    number: '13',
    name: 'Safeguarding from abuse and improper treatment',
    isProsecutable: true,  // ⚠️ CQC CAN PROSECUTE
    summary: 'People must be protected from abuse, neglect and improper treatment.',
    fullDescription:
      'Providers must have systems to prevent abuse, including safeguarding policies, staff training, ' +
      'DBS checks, and procedures for reporting concerns. This includes protection from financial abuse, ' +
      'physical abuse, sexual abuse, psychological abuse, neglect, and institutional abuse.',
    whatCqcExpects: [
      'Comprehensive safeguarding policy',
      'All staff DBS checked to appropriate level',
      'Staff trained to recognise and report abuse',
      'Referrals made to local authority when needed',
      'Restrictive practices minimised and properly authorised',
    ],
    prosecutionThreshold: 'Failure to safeguard people from abuse causing avoidable harm or death',
  },

  REG14: {
    code: 'REG14',
    number: '14',
    name: 'Meeting nutritional and hydration needs',
    isProsecutable: true,  // ⚠️ CQC CAN PROSECUTE
    summary: 'People who use services must have their nutritional and hydration needs met.',
    appliesToClinic: false,  // Only care homes
    appliesToCareHome: true,
    fullDescription:
      'Where a service involves the provision of food and drink, providers must ensure that people ' +
      'receive adequate nutrition and hydration to sustain life and good health.',
    prosecutionThreshold: 'Failure to provide adequate food/drink causing deterioration or harm',
  },

  REG15: {
    code: 'REG15',
    number: '15',
    name: 'Premises and equipment',
    isProsecutable: false,
    summary: 'All premises and equipment must be clean, suitable, properly maintained, and safe.',
    fullDescription:
      'Providers must make sure the premises and any equipment used are clean, suitable for the ' +
      'purpose, properly used, maintained and stored securely.',
  },

  REG16: {
    code: 'REG16',
    number: '16',
    name: 'Receiving and acting on complaints',
    isProsecutable: false,
    summary: 'Complaints must be investigated and action taken in response.',
    fullDescription:
      'Providers must have a complaints system that ensures complaints are investigated and ' +
      'necessary and proportionate action is taken. People must be able to make complaints ' +
      'without fear of detriment.',
  },

  REG17: {
    code: 'REG17',
    number: '17',
    name: 'Good governance',
    isProsecutable: false,
    summary: 'Systems and processes must be established to ensure compliance with regulations.',
    fullDescription:
      'This is the broadest governance regulation. Providers must have effective governance including ' +
      'risk management, quality assurance, audit, and regulatory compliance systems. They must ' +
      'submit required notifications and maintain appropriate records.',
    whatCqcExpects: [
      'Governance meeting structure with regular cadence',
      'Quality assurance and audit programme',
      'Risk register maintained and reviewed',
      'Policy review schedule adhered to',
      'CQC notifications submitted on time',
      'CQC rating displayed publicly',
    ],
  },

  REG18: {
    code: 'REG18',
    number: '18',
    name: 'Staffing',
    isProsecutable: false,
    summary: 'Sufficient numbers of suitably qualified, skilled and experienced staff must be deployed.',
    fullDescription:
      'Providers must deploy sufficient numbers of suitably qualified, competent, skilled and experienced ' +
      'staff. Staff must receive appropriate training, professional development, supervision and appraisal.',
  },

  REG19: {
    code: 'REG19',
    number: '19',
    name: 'Fit and proper persons employed',
    isProsecutable: false,
    summary: 'People employed must be of good character, have necessary qualifications and be competent.',
    fullDescription:
      'Providers must operate effective recruitment procedures including DBS checks, employment history ' +
      'verification, reference checks, and qualification verification.',
  },

  REG20: {
    code: 'REG20',
    number: '20',
    name: 'Duty of candour',
    isProsecutable: true,  // ⚠️ CQC CAN PROSECUTE
    summary: 'Providers must be open and transparent when things go wrong.',
    fullDescription:
      'When a notifiable safety incident occurs, providers must tell the person (or their representative), ' +
      'apologise, offer an appropriate remedy, and provide a written account. This must happen as soon ' +
      'as reasonably practicable after becoming aware of the incident.',
    whatCqcExpects: [
      'Duty of candour policy',
      'Staff training on duty of candour',
      'Written notification to person affected within 10 days',
      'Verbal notification as soon as practicable',
      'Apology given (without accepting liability)',
      'Log of all duty of candour activations',
    ],
    prosecutionThreshold: 'Failure to notify affected person of notifiable safety incident',
  },

  REG20A: {
    code: 'REG20A',
    number: '20A',
    name: 'Display of performance assessments',
    isProsecutable: true,  // ⚠️ CQC CAN PROSECUTE
    summary: 'CQC rating must be displayed in a prominent place and on the website.',
    fullDescription:
      'Providers must display their CQC rating conspicuously at the place where the regulated activity ' +
      'is carried on, and on any website relating to the service.',
    whatCqcExpects: [
      'Current CQC rating poster displayed in prominent position',
      'CQC rating and link to report on website',
      'Updated within a reasonable time after re-inspection',
    ],
    prosecutionThreshold: 'Failure to display rating as required',
  },
} as const;
```

---

## 5. KLOE ↔ Regulation Mapping Matrix

### 5.1 Official Mapping (from CQC "ASC KLOEs mapped to regulations" June 2018)

```
KLOE │ Suggested Mapping              │ Also Consider
─────┼────────────────────────────────┼──────────────────────────────────
S1   │ REG13 (Safeguarding)           │ REG12, REG18, REG19
S2   │ REG12 (Safe care)              │ REG13, REG15, REG17, REG18
S3   │ REG18 (Staffing)               │ REG12, REG19
S4   │ REG12 (Safe care)              │ REG17
S5   │ REG12, REG15 (Premises)        │ REG17
S6   │ REG12, REG17, REG20 (Candour)  │ REG13
─────┼────────────────────────────────┼──────────────────────────────────
E1   │ REG9 (Person-centred), REG12   │ REG17
E2   │ REG18 (Staffing)               │ REG12, REG17
E3   │ REG14 (Nutrition)              │ REG9, REG12
E4   │ REG9, REG17                    │ REG12
E5   │ REG9, REG12                    │ REG13, REG17
E6   │ REG15 (Premises)               │ REG9, REG10, REG17
E7   │ REG11 (Consent)                │ REG9, REG10, REG17
─────┼────────────────────────────────┼──────────────────────────────────
C1   │ REG10 (Dignity)                │ REG9
C2   │ REG9, REG10, REG11             │ —
C3   │ REG10, REG15                   │ REG9
─────┼────────────────────────────────┼──────────────────────────────────
R1   │ REG9, REG10, REG11             │ —
R2   │ REG16 (Complaints), REG17, 20  │ —
R3   │ REG9, REG12                    │ REG10, REG17
─────┼────────────────────────────────┼──────────────────────────────────
W1   │ REG17 (Governance)             │ REG5, REG7
W2   │ REG17                          │ REG5, REG6, REG7
W3   │ REG9, REG17                    │ REG10, REG18, REG20
W4   │ REG17                          │ REG5, REG7, REG16, REG20
W5   │ REG12, REG17                   │ REG9
W6   │ REG17                          │ —
```

### 5.2 Seed Data for Mapping Table

```typescript
// lib/constants/cqc-kloe-regulation-mappings.ts

export const KLOE_REGULATION_MAPPINGS = [
  // SAFE
  { kloe: 'S1', regulation: 'REG13', type: 'suggested' },
  { kloe: 'S1', regulation: 'REG12', type: 'also_consider' },
  { kloe: 'S1', regulation: 'REG18', type: 'also_consider' },
  { kloe: 'S1', regulation: 'REG19', type: 'also_consider' },

  { kloe: 'S2', regulation: 'REG12', type: 'suggested' },
  { kloe: 'S2', regulation: 'REG13', type: 'also_consider' },
  { kloe: 'S2', regulation: 'REG15', type: 'also_consider' },
  { kloe: 'S2', regulation: 'REG17', type: 'also_consider' },
  { kloe: 'S2', regulation: 'REG18', type: 'also_consider' },

  { kloe: 'S3', regulation: 'REG18', type: 'suggested' },
  { kloe: 'S3', regulation: 'REG12', type: 'also_consider' },
  { kloe: 'S3', regulation: 'REG19', type: 'also_consider' },

  { kloe: 'S4', regulation: 'REG12', type: 'suggested' },
  { kloe: 'S4', regulation: 'REG17', type: 'also_consider' },

  { kloe: 'S5', regulation: 'REG12', type: 'suggested' },
  { kloe: 'S5', regulation: 'REG15', type: 'suggested' },
  { kloe: 'S5', regulation: 'REG17', type: 'also_consider' },

  { kloe: 'S6', regulation: 'REG12', type: 'suggested' },
  { kloe: 'S6', regulation: 'REG17', type: 'suggested' },
  { kloe: 'S6', regulation: 'REG20', type: 'suggested' },
  { kloe: 'S6', regulation: 'REG13', type: 'also_consider' },

  // EFFECTIVE
  { kloe: 'E1', regulation: 'REG9',  type: 'suggested' },
  { kloe: 'E1', regulation: 'REG12', type: 'suggested' },
  { kloe: 'E1', regulation: 'REG17', type: 'also_consider' },

  { kloe: 'E2', regulation: 'REG18', type: 'suggested' },
  { kloe: 'E2', regulation: 'REG12', type: 'also_consider' },
  { kloe: 'E2', regulation: 'REG17', type: 'also_consider' },

  { kloe: 'E3', regulation: 'REG14', type: 'suggested' },
  { kloe: 'E3', regulation: 'REG9',  type: 'also_consider' },
  { kloe: 'E3', regulation: 'REG12', type: 'also_consider' },

  { kloe: 'E4', regulation: 'REG9',  type: 'suggested' },
  { kloe: 'E4', regulation: 'REG17', type: 'suggested' },
  { kloe: 'E4', regulation: 'REG12', type: 'also_consider' },

  { kloe: 'E5', regulation: 'REG9',  type: 'suggested' },
  { kloe: 'E5', regulation: 'REG12', type: 'suggested' },
  { kloe: 'E5', regulation: 'REG13', type: 'also_consider' },
  { kloe: 'E5', regulation: 'REG17', type: 'also_consider' },

  { kloe: 'E6', regulation: 'REG15', type: 'suggested' },
  { kloe: 'E6', regulation: 'REG9',  type: 'also_consider' },
  { kloe: 'E6', regulation: 'REG10', type: 'also_consider' },
  { kloe: 'E6', regulation: 'REG17', type: 'also_consider' },

  { kloe: 'E7', regulation: 'REG11', type: 'suggested' },
  { kloe: 'E7', regulation: 'REG9',  type: 'also_consider' },
  { kloe: 'E7', regulation: 'REG10', type: 'also_consider' },
  { kloe: 'E7', regulation: 'REG17', type: 'also_consider' },

  // CARING
  { kloe: 'C1', regulation: 'REG10', type: 'suggested' },
  { kloe: 'C1', regulation: 'REG9',  type: 'also_consider' },

  { kloe: 'C2', regulation: 'REG9',  type: 'suggested' },
  { kloe: 'C2', regulation: 'REG10', type: 'suggested' },
  { kloe: 'C2', regulation: 'REG11', type: 'suggested' },

  { kloe: 'C3', regulation: 'REG10', type: 'suggested' },
  { kloe: 'C3', regulation: 'REG15', type: 'suggested' },
  { kloe: 'C3', regulation: 'REG9',  type: 'also_consider' },

  // RESPONSIVE
  { kloe: 'R1', regulation: 'REG9',  type: 'suggested' },
  { kloe: 'R1', regulation: 'REG10', type: 'suggested' },
  { kloe: 'R1', regulation: 'REG11', type: 'suggested' },

  { kloe: 'R2', regulation: 'REG16', type: 'suggested' },
  { kloe: 'R2', regulation: 'REG17', type: 'suggested' },
  { kloe: 'R2', regulation: 'REG20', type: 'suggested' },

  { kloe: 'R3', regulation: 'REG9',  type: 'suggested' },
  { kloe: 'R3', regulation: 'REG12', type: 'suggested' },
  { kloe: 'R3', regulation: 'REG10', type: 'also_consider' },
  { kloe: 'R3', regulation: 'REG17', type: 'also_consider' },

  // WELL-LED
  { kloe: 'W1', regulation: 'REG17', type: 'suggested' },
  { kloe: 'W2', regulation: 'REG17', type: 'suggested' },
  { kloe: 'W3', regulation: 'REG9',  type: 'suggested' },
  { kloe: 'W3', regulation: 'REG17', type: 'suggested' },
  { kloe: 'W3', regulation: 'REG10', type: 'also_consider' },
  { kloe: 'W3', regulation: 'REG18', type: 'also_consider' },
  { kloe: 'W3', regulation: 'REG20', type: 'also_consider' },
  { kloe: 'W4', regulation: 'REG17', type: 'suggested' },
  { kloe: 'W4', regulation: 'REG16', type: 'also_consider' },
  { kloe: 'W4', regulation: 'REG20', type: 'also_consider' },
  { kloe: 'W5', regulation: 'REG12', type: 'suggested' },
  { kloe: 'W5', regulation: 'REG17', type: 'suggested' },
  { kloe: 'W5', regulation: 'REG9',  type: 'also_consider' },
  { kloe: 'W6', regulation: 'REG17', type: 'suggested' },
] as const;
```

---

## 6. Service-Type Differentiation Engine

### 6.1 Critical Differences Summary

```typescript
// lib/constants/service-type-config.ts

export const SERVICE_TYPE_CONFIG = {
  AESTHETIC_CLINIC: {
    label: 'Aesthetic Clinic',
    description: 'Independent healthcare / cosmetic procedures',
    serviceModel: 'Episodic, appointment-based care',

    // KLOEs that are N/A or different
    excludedKloes: ['E3'],  // No nutrition/hydration
    modifiedKloes: {
      R3: { title: 'Timely access to care', focus: 'waiting times, appointment availability' },
      W5: { title: 'Risk and performance management', focus: 'risk register, KPIs, quality monitoring' },
      W6: { title: 'Information governance', focus: 'data security, IG training, GDPR' },
    },

    // Key document types
    keyDocuments: [
      'Consent forms (per procedure)',
      'Clinical protocols (per treatment)',
      'Prescribing logs',
      'Practitioner registration records',
      'Before/after photographs',
      'Emergency equipment checklist',
    ],

    // Risk assessment focus
    riskFocus: [
      'Procedure-specific clinical risks',
      'Allergic reaction risks',
      'Prescribing safety',
      'Laser/energy device safety',
      'Cross-contamination risks',
    ],

    // What is NOT relevant (prevent confusion)
    notApplicable: [
      'Falls risk assessments',
      'Pressure ulcer prevention',
      'MUST screening',
      'End-of-life care planning',
      'DoLS applications',
      'Activities programme',
      'MAR charts',
      'Meal planning',
      'Night staffing ratios',
    ],
  },

  CARE_HOME: {
    label: 'Care Home',
    description: 'Residential adult social care',
    serviceModel: '24/7 residential care',

    excludedKloes: [],  // All KLOEs apply
    modifiedKloes: {
      R3: { title: 'End-of-life care', focus: 'advance care plans, DNACPR, pain management, dignified death' },
      W5: { title: 'Partnership working', focus: 'GP liaison, district nurses, social workers, hospital teams' },
      W6: { title: 'Information management and self-assessment', focus: 'records, DSPT, Caldicott, IG' },
    },

    keyDocuments: [
      'Care plans (per resident)',
      'MAR charts',
      'Activities programme',
      'Residents\' meeting minutes',
      'Staff rota',
      'Dependency tool calculations',
    ],

    riskFocus: [
      'Falls prevention',
      'Pressure ulcer prevention',
      'Choking risk',
      'Malnutrition risk (MUST)',
      'Moving and handling',
      'Skin integrity',
      'Medication errors',
      'Absconding risk',
    ],

    notApplicable: [
      'Cooling-off period policies',
      'Before/after photography protocols',
      'Laser safety assessments',
      'Patient Group Directions',
      'Appointment scheduling data',
    ],

    // Sub-types that unlock additional requirements
    subTypes: {
      withNursing: {
        label: 'Care Home with Nursing',
        additionalRequirements: [
          '24/7 registered nurse coverage',
          'NMC registration checks',
          'Controlled drugs management',
          'Clinical governance framework',
          'Syringe driver competency',
        ],
      },
      withoutNursing: {
        label: 'Care Home without Nursing',
        additionalRequirements: [
          'District nurse liaison arrangements',
          'Personal care competency assessments',
        ],
      },
      dementia: {
        label: 'Dementia Specialist',
        additionalRequirements: [
          'Dementia-specific training (all staff)',
          'Dementia-friendly environment audit',
          'Enhanced MCA/DoLS procedures',
          'DOLS tracker widget',
        ],
      },
    },
  },
} as const;
```

### 6.2 Applicability Filter Function

```typescript
// lib/compliance/applicability-filter.ts

import { CQC_KLOES } from '../constants/cqc-kloes'
import { SERVICE_TYPE_CONFIG } from '../constants/service-type-config'

export function getApplicableKloes(serviceType: 'AESTHETIC_CLINIC' | 'CARE_HOME') {
  const config = SERVICE_TYPE_CONFIG[serviceType]
  
  return CQC_KLOES
    .filter(kloe => !config.excludedKloes.includes(kloe.code))
    .map(kloe => {
      const modification = config.modifiedKloes[kloe.code]
      if (modification) {
        return {
          ...kloe,
          title: modification.title,
          serviceSpecificFocus: modification.focus,
        }
      }
      return kloe
    })
}

export function getEvidenceRequirements(kloeCode: string, serviceType: 'AESTHETIC_CLINIC' | 'CARE_HOME') {
  const kloe = CQC_KLOES.find(k => k.code === kloeCode)
  if (!kloe) return []

  const shared = kloe.evidenceExpected.shared
  const specific = serviceType === 'AESTHETIC_CLINIC'
    ? kloe.evidenceExpected.clinicSpecific
    : kloe.evidenceExpected.careHomeSpecific

  return [...shared, ...specific]
}

export function isKloeApplicable(kloeCode: string, serviceType: 'AESTHETIC_CLINIC' | 'CARE_HOME'): boolean {
  const config = SERVICE_TYPE_CONFIG[serviceType]
  return !config.excludedKloes.includes(kloeCode)
}
```

---

## 7. Assessment Engine — Onboarding Questions

### 7.1 Question Architecture

Assessment questions live in `lib/constants/assessment-questions.ts` — NOT in the database. This allows versioning and type safety. Answers ARE stored in the database.

```typescript
// lib/constants/assessment-questions.ts

export interface AssessmentQuestion {
  id: string                                      // Unique stable ID: "SAFE_S1_Q01"
  domain: CqcDomainType                           // CQC domain
  kloeCode: string                                // KLOE code (S1, E3, etc.)
  step: number                                    // Wizard step (3 = assessment step)
  
  // Display
  text: string                                    // Question text shown to user
  helpText?: string                               // "Why this matters" explanation
  
  // Answer config
  answerType: 'yes_no' | 'yes_no_partial' | 'multi_select' | 'scale' | 'date' | 'text'
  options?: { value: string; label: string }[]    // For multi_select
  
  // Applicability
  serviceTypes: ('AESTHETIC_CLINIC' | 'CARE_HOME')[]
  conditionalOn?: {                               // Only show if another question answered X
    questionId: string
    expectedValue: string | string[]
  }
  
  // Scoring
  scoring: {
    maxPoints: number
    scoringMap: Record<string, number>            // answer_value → points
  }
  weight: number                                  // Relative importance (0.5–2.0)
  
  // Gap creation
  gapTrigger?: {
    triggerValues: string[]                       // Which answers create a gap
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    gapTitle: string
    gapDescription: string
    remediationHint: string
  }
}
```

### 7.2 Assessment Questions — SAFE Domain

```typescript
export const ASSESSMENT_QUESTIONS_SAFE: AssessmentQuestion[] = [
  // ── S1: Safeguarding ──
  {
    id: 'SAFE_S1_Q01',
    domain: 'SAFE',
    kloeCode: 'S1',
    step: 3,
    text: 'Do you have a current safeguarding adults policy that has been reviewed in the last 12 months?',
    helpText: 'CQC requires all providers to have a safeguarding policy. This must be reviewed annually and reflect current local authority procedures.',
    answerType: 'yes_no_partial',
    serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: {
      maxPoints: 10,
      scoringMap: { yes: 10, partial: 5, no: 0, unsure: 2 },
    },
    weight: 1.5,
    gapTrigger: {
      triggerValues: ['no', 'unsure'],
      severity: 'CRITICAL',
      gapTitle: 'Missing or outdated safeguarding policy',
      gapDescription: 'No current safeguarding adults policy in place. This is a fundamental requirement under Regulation 13.',
      remediationHint: 'Create or update your safeguarding adults policy. Use the AI policy generator to create one based on your local authority procedures.',
    },
  },
  {
    id: 'SAFE_S1_Q02',
    domain: 'SAFE',
    kloeCode: 'S1',
    step: 3,
    text: 'Do all staff have enhanced DBS checks (with barred list check where applicable)?',
    helpText: 'Regulation 19 requires all staff to be properly vetted. Enhanced DBS with barred list is required for staff working with vulnerable adults.',
    answerType: 'yes_no_partial',
    serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: {
      maxPoints: 10,
      scoringMap: { yes: 10, partial: 4, no: 0, unsure: 2 },
    },
    weight: 1.5,
    gapTrigger: {
      triggerValues: ['no', 'partial'],
      severity: 'CRITICAL',
      gapTitle: 'Incomplete DBS checks for staff',
      gapDescription: 'Not all staff have enhanced DBS checks. This is a legal requirement under Regulation 19 and critical for safeguarding.',
      remediationHint: 'Audit all staff DBS records. Arrange DBS checks for any staff missing them. Consider DBS Update Service for ongoing monitoring.',
    },
  },
  {
    id: 'SAFE_S1_Q03',
    domain: 'SAFE',
    kloeCode: 'S1',
    step: 3,
    text: 'Have all staff completed safeguarding training within the last 12 months?',
    helpText: 'Staff must understand how to recognise and report abuse. Training should be refreshed annually as a minimum.',
    answerType: 'yes_no_partial',
    serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: {
      maxPoints: 8,
      scoringMap: { yes: 8, partial: 4, no: 0, unsure: 2 },
    },
    weight: 1.2,
    gapTrigger: {
      triggerValues: ['no'],
      severity: 'HIGH',
      gapTitle: 'Safeguarding training not current for all staff',
      gapDescription: 'Not all staff have completed safeguarding training in the last 12 months.',
      remediationHint: 'Schedule safeguarding training for all staff. This can be e-learning for Level 1 and face-to-face for Level 2.',
    },
  },
  {
    id: 'SAFE_S1_Q04',
    domain: 'SAFE',
    kloeCode: 'S1',
    step: 3,
    text: 'Is there a designated safeguarding lead identified and known to all staff?',
    answerType: 'yes_no',
    serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: {
      maxPoints: 6,
      scoringMap: { yes: 6, no: 0 },
    },
    weight: 1.0,
    gapTrigger: {
      triggerValues: ['no'],
      severity: 'HIGH',
      gapTitle: 'No designated safeguarding lead',
      gapDescription: 'A designated safeguarding lead must be identified and all staff must know who they are.',
      remediationHint: 'Designate a safeguarding lead (usually the registered manager). Ensure all staff know who this person is and how to contact them.',
    },
  },

  // ── S2: Risk Assessment ──
  {
    id: 'SAFE_S2_Q01',
    domain: 'SAFE',
    kloeCode: 'S2',
    step: 3,
    text: 'Do you have a current fire risk assessment carried out by a competent person?',
    answerType: 'yes_no_partial',
    serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: {
      maxPoints: 10,
      scoringMap: { yes: 10, partial: 5, no: 0, unsure: 2 },
    },
    weight: 1.5,
    gapTrigger: {
      triggerValues: ['no', 'unsure'],
      severity: 'CRITICAL',
      gapTitle: 'Missing fire risk assessment',
      gapDescription: 'No current fire risk assessment. This is a legal requirement under the Regulatory Reform (Fire Safety) Order 2005.',
      remediationHint: 'Commission a fire risk assessment from a competent fire safety assessor. This must be reviewed annually.',
    },
  },
  {
    id: 'SAFE_S2_Q02',
    domain: 'SAFE',
    kloeCode: 'S2',
    step: 3,
    text: 'Do you have individual risk assessments for each person using your service?',
    helpText: 'For clinics: procedure-specific risk assessments. For care homes: individual resident risk assessments (falls, pressure, nutrition, moving & handling).',
    answerType: 'yes_no_partial',
    serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: {
      maxPoints: 10,
      scoringMap: { yes: 10, partial: 5, no: 0, unsure: 2 },
    },
    weight: 1.5,
    gapTrigger: {
      triggerValues: ['no'],
      severity: 'CRITICAL',
      gapTitle: 'Missing individual risk assessments',
      gapDescription: 'Risk assessments are not in place for individuals. This is fundamental to Regulation 12.',
      remediationHint: 'Implement standardised risk assessment tools. For care homes: Waterlow, MUST, falls risk. For clinics: pre-treatment risk screening.',
    },
  },
  {
    id: 'SAFE_S2_Q03',
    domain: 'SAFE',
    kloeCode: 'S2',
    step: 3,
    text: 'Do you have a Legionella risk assessment and water management plan?',
    answerType: 'yes_no',
    serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: {
      maxPoints: 6,
      scoringMap: { yes: 6, no: 0 },
    },
    weight: 1.0,
    gapTrigger: {
      triggerValues: ['no'],
      severity: 'MEDIUM',
      gapTitle: 'No Legionella risk assessment',
      gapDescription: 'Legionella risk assessment and water management plan not in place.',
      remediationHint: 'Commission a Legionella risk assessment and implement a water management plan with regular temperature monitoring.',
    },
  },
  {
    id: 'SAFE_S2_Q04',
    domain: 'SAFE',
    kloeCode: 'S2',
    step: 3,
    text: 'Do you have Personal Emergency Evacuation Plans (PEEPs) for people with mobility issues?',
    answerType: 'yes_no_partial',
    serviceTypes: ['CARE_HOME'],
    scoring: {
      maxPoints: 8,
      scoringMap: { yes: 8, partial: 4, no: 0, unsure: 2 },
    },
    weight: 1.2,
    gapTrigger: {
      triggerValues: ['no'],
      severity: 'HIGH',
      gapTitle: 'No Personal Emergency Evacuation Plans',
      gapDescription: 'PEEPs are required for all residents with mobility or cognitive limitations.',
      remediationHint: 'Create a PEEP for each resident based on their individual evacuation needs.',
    },
  },

  // ── S3: Staffing ──
  {
    id: 'SAFE_S3_Q01',
    domain: 'SAFE',
    kloeCode: 'S3',
    step: 3,
    text: 'Do you have a registered manager in post?',
    helpText: 'CQC registration requires a registered manager. Operating without one can trigger enforcement action.',
    answerType: 'yes_no',
    serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: {
      maxPoints: 10,
      scoringMap: { yes: 10, no: 0 },
    },
    weight: 2.0,
    gapTrigger: {
      triggerValues: ['no'],
      severity: 'CRITICAL',
      gapTitle: 'No registered manager in post',
      gapDescription: 'Operating without a registered manager is a breach of registration conditions and a CQC enforcement trigger.',
      remediationHint: 'Apply to CQC to register a manager as a priority. If the previous manager left, notify CQC within required timeframe.',
    },
  },
  {
    id: 'SAFE_S3_Q02',
    domain: 'SAFE',
    kloeCode: 'S3',
    step: 3,
    text: 'Do you use a validated tool or method to determine safe staffing levels?',
    answerType: 'yes_no',
    serviceTypes: ['CARE_HOME'],
    scoring: {
      maxPoints: 8,
      scoringMap: { yes: 8, no: 0 },
    },
    weight: 1.0,
    gapTrigger: {
      triggerValues: ['no'],
      severity: 'MEDIUM',
      gapTitle: 'No validated staffing tool in use',
      gapDescription: 'No formal method for calculating safe staffing levels based on resident dependency.',
      remediationHint: 'Implement a validated dependency tool to calculate staffing requirements.',
    },
  },

  // ── S4: Medicines ──
  {
    id: 'SAFE_S4_Q01',
    domain: 'SAFE',
    kloeCode: 'S4',
    step: 3,
    text: 'Do you have a medicines management policy?',
    answerType: 'yes_no_partial',
    serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: {
      maxPoints: 10,
      scoringMap: { yes: 10, partial: 5, no: 0, unsure: 2 },
    },
    weight: 1.5,
    gapTrigger: {
      triggerValues: ['no'],
      severity: 'CRITICAL',
      gapTitle: 'No medicines management policy',
      gapDescription: 'A medicines management policy is required under Regulation 12 for any service handling medicines.',
      remediationHint: 'Create a medicines management policy covering storage, administration, disposal, and error reporting.',
    },
  },
  {
    id: 'SAFE_S4_Q02',
    domain: 'SAFE',
    kloeCode: 'S4',
    step: 3,
    text: 'Are all prescribing arrangements documented and compliant (e.g. PGDs, PSDs, independent prescribing)?',
    helpText: 'Aesthetic clinics must have clear, documented prescribing arrangements for all prescription-only medicines.',
    answerType: 'yes_no_partial',
    serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: {
      maxPoints: 10,
      scoringMap: { yes: 10, partial: 5, no: 0, unsure: 2 },
    },
    weight: 1.5,
    gapTrigger: {
      triggerValues: ['no', 'unsure'],
      severity: 'CRITICAL',
      gapTitle: 'Undocumented prescribing arrangements',
      gapDescription: 'Prescribing arrangements for POMs must be clearly documented and legally compliant.',
      remediationHint: 'Document all prescribing pathways. Ensure PGDs are properly authorised, PSDs are patient-specific, and independent prescribers are qualified.',
    },
  },
  {
    id: 'SAFE_S4_Q03',
    domain: 'SAFE',
    kloeCode: 'S4',
    step: 3,
    text: 'Do you have emergency medicines available on site (anaphylaxis kit, hyaluronidase if using dermal fillers)?',
    answerType: 'yes_no_partial',
    serviceTypes: ['AESTHETIC_CLINIC'],
    scoring: {
      maxPoints: 10,
      scoringMap: { yes: 10, partial: 4, no: 0 },
    },
    weight: 2.0,
    gapTrigger: {
      triggerValues: ['no'],
      severity: 'CRITICAL',
      gapTitle: 'Missing emergency medicines',
      gapDescription: 'Emergency medicines (including anaphylaxis kit) must be available and in date at all times.',
      remediationHint: 'Stock and maintain: adrenaline auto-injector, oxygen, hyaluronidase (if using HA fillers), AED. Check expiry dates monthly.',
    },
  },

  // ── S5: Infection Prevention ──
  {
    id: 'SAFE_S5_Q01',
    domain: 'SAFE',
    kloeCode: 'S5',
    step: 3,
    text: 'Do you have a current infection prevention and control (IPC) policy?',
    answerType: 'yes_no_partial',
    serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: {
      maxPoints: 10,
      scoringMap: { yes: 10, partial: 5, no: 0, unsure: 2 },
    },
    weight: 1.5,
    gapTrigger: {
      triggerValues: ['no'],
      severity: 'CRITICAL',
      gapTitle: 'No infection prevention and control policy',
      gapDescription: 'An IPC policy is mandatory under Regulation 12.',
      remediationHint: 'Create an IPC policy covering hand hygiene, PPE, environmental cleaning, waste management, and outbreak management.',
    },
  },
  {
    id: 'SAFE_S5_Q02',
    domain: 'SAFE',
    kloeCode: 'S5',
    step: 3,
    text: 'Do you conduct regular hand hygiene audits?',
    answerType: 'yes_no',
    serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: {
      maxPoints: 6,
      scoringMap: { yes: 6, no: 0 },
    },
    weight: 1.0,
    gapTrigger: {
      triggerValues: ['no'],
      severity: 'MEDIUM',
      gapTitle: 'No hand hygiene audits conducted',
      gapDescription: 'Regular hand hygiene audits demonstrate compliance with IPC requirements.',
      remediationHint: 'Implement monthly hand hygiene audits using the WHO 5 Moments framework.',
    },
  },

  // ── S6: Learning from Incidents ──
  {
    id: 'SAFE_S6_Q01',
    domain: 'SAFE',
    kloeCode: 'S6',
    step: 3,
    text: 'Do you have a formal incident reporting and investigation procedure?',
    answerType: 'yes_no_partial',
    serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: {
      maxPoints: 10,
      scoringMap: { yes: 10, partial: 5, no: 0, unsure: 2 },
    },
    weight: 1.2,
    gapTrigger: {
      triggerValues: ['no'],
      severity: 'HIGH',
      gapTitle: 'No formal incident reporting procedure',
      gapDescription: 'A system for reporting, investigating and learning from incidents is required under Regulation 17.',
      remediationHint: 'Implement an incident reporting system with clear investigation and learning processes.',
    },
  },
  {
    id: 'SAFE_S6_Q02',
    domain: 'SAFE',
    kloeCode: 'S6',
    step: 3,
    text: 'Do you have a duty of candour policy and do staff understand it?',
    answerType: 'yes_no_partial',
    serviceTypes: ['AESTHETIC_CLINIC', 'CARE_HOME'],
    scoring: {
      maxPoints: 8,
      scoringMap: { yes: 8, partial: 4, no: 0, unsure: 2 },
    },
    weight: 1.2,
    gapTrigger: {
      triggerValues: ['no'],
      severity: 'HIGH',
      gapTitle: 'No duty of candour policy',
      gapDescription: 'Regulation 20 requires a duty of candour policy and staff awareness.',
      remediationHint: 'Create a duty of candour policy. Train all staff on when and how to apply it.',
    },
  },
];
```

### 7.3 Assessment Questions — Quick Reference (All Domains)

Due to the size of the full question bank, this document defines the architecture and SAFE domain questions in full. The remaining domains follow the identical pattern. The complete question bank is in `lib/constants/assessment-questions.ts`.

**Question Count by Domain:**

```
Domain       │ Clinic Questions │ Care Home Questions │ Shared
─────────────┼──────────────────┼─────────────────────┼────────
Safe         │ 4 specific       │ 3 specific          │ 14
Effective    │ 5 specific       │ 6 specific          │ 8
Caring       │ 2 specific       │ 3 specific          │ 6
Responsive   │ 3 specific       │ 4 specific          │ 4
Well-Led     │ 2 specific       │ 3 specific          │ 10
─────────────┼──────────────────┼─────────────────────┼────────
TOTAL        │ ~16 specific     │ ~19 specific        │ ~42 shared
             │ = ~58 for clinic │ = ~61 for care home │
```

**Answer types and scoring:**

| Type | Values | Typical Max Points |
|------|--------|-------------------|
| `yes_no` | yes, no | 6–10 |
| `yes_no_partial` | yes, partial, no, unsure | 6–10 |
| `multi_select` | Array of selected options | 2 per option |
| `scale` | 1–5 numeric | Scale value × 2 |
| `date` | ISO date string | Points if within valid range |
| `text` | Free text (not scored) | 0 (context only) |

---

## 9. Compliance Scoring Algorithm

### 9.1 Score Calculation Pipeline

```typescript
// lib/compliance/scoring-engine.ts

export interface ScoringResult {
  overallScore: number          // 0–100
  predictedRating: CqcRating
  ratingConfidence: number      // 0–1
  hasCriticalGap: boolean
  domainScores: DomainScoreResult[]
  totalGaps: number
  gapsBySeverity: Record<GapSeverity, number>
}

export interface DomainScoreResult {
  domain: CqcDomainType
  rawScore: number              // Sum of points earned
  maxScore: number              // Sum of max possible points
  percentage: number            // rawScore / maxScore * 100
  predictedRating: CqcRating
  gapCount: number
  criticalGapPresent: boolean
  evidenceCoverage: number      // Percentage of evidence items provided
}

export function calculateComplianceScore(
  answers: AssessmentAnswer[],
  serviceType: ServiceType,
  evidenceItems: Evidence[],
  gaps: ComplianceGap[],
): ScoringResult {

  // Step 1: Filter applicable KLOEs for service type
  const applicableKloes = getApplicableKloes(serviceType)
  const applicableCodes = new Set(applicableKloes.map(k => k.code))

  // Step 2: Calculate per-domain raw scores from assessment answers
  const domainScores = calculateDomainScores(answers, applicableCodes)

  // Step 3: Apply evidence quality factor
  for (const ds of domainScores) {
    ds.evidenceQualityFactor = calculateEvidenceQuality(ds.domain, evidenceItems)
  }

  // Step 4: Apply timeliness factor (decay for expired evidence)
  for (const ds of domainScores) {
    ds.timelinessFactor = calculateTimeliness(ds.domain, evidenceItems)
  }

  // Step 5: Calculate adjusted domain percentages
  for (const ds of domainScores) {
    const rawPercentage = ds.maxScore > 0 ? (ds.rawScore / ds.maxScore) * 100 : 0
    ds.percentage = rawPercentage
      * ds.evidenceQualityFactor   // 0.5 – 1.0
      * ds.timelinessFactor        // 0.5 – 1.0
  }

  // Step 6: Determine domain ratings
  for (const ds of domainScores) {
    ds.predictedRating = percentageToRating(ds.percentage)

    // CRITICAL: Rating limiter — any critical gap caps domain at RI
    const domainGaps = gaps.filter(g => g.domain === ds.domain && g.status !== 'RESOLVED')
    ds.criticalGapPresent = domainGaps.some(g => g.severity === 'CRITICAL')
    if (ds.criticalGapPresent && ds.predictedRating === 'OUTSTANDING') {
      ds.predictedRating = 'REQUIRES_IMPROVEMENT'
    }
    if (ds.criticalGapPresent && ds.predictedRating === 'GOOD') {
      ds.predictedRating = 'REQUIRES_IMPROVEMENT'
    }
  }

  // Step 7: Calculate overall score (weighted average of domain percentages)
  const totalWeight = domainScores.reduce((sum, ds) => {
    const domainDef = CQC_DOMAINS[ds.domain]
    return sum + domainDef.weight
  }, 0)

  const weightedSum = domainScores.reduce((sum, ds) => {
    const domainDef = CQC_DOMAINS[ds.domain]
    return sum + (ds.percentage * domainDef.weight)
  }, 0)

  const overallScore = Math.round((weightedSum / totalWeight) * 10) / 10

  // Step 8: Determine overall predicted rating
  const hasCriticalGap = domainScores.some(ds => ds.criticalGapPresent)
  let predictedRating = percentageToRating(overallScore)

  // CRITICAL: If ANY domain is Inadequate, overall is capped at RI
  const hasInadequateDomain = domainScores.some(ds => ds.predictedRating === 'INADEQUATE')
  if (hasInadequateDomain && (predictedRating === 'OUTSTANDING' || predictedRating === 'GOOD')) {
    predictedRating = 'REQUIRES_IMPROVEMENT'
  }

  // Step 9: Calculate confidence level
  const ratingConfidence = calculateConfidence(answers, evidenceItems, applicableKloes)

  return {
    overallScore,
    predictedRating,
    ratingConfidence,
    hasCriticalGap,
    domainScores,
    totalGaps: gaps.filter(g => g.status !== 'RESOLVED').length,
    gapsBySeverity: countGapsBySeverity(gaps),
  }
}
```

### 9.2 Rating Thresholds

```typescript
// lib/compliance/rating-thresholds.ts

export function percentageToRating(percentage: number): CqcRating {
  if (percentage >= 88) return 'OUTSTANDING'
  if (percentage >= 63) return 'GOOD'
  if (percentage >= 39) return 'REQUIRES_IMPROVEMENT'
  return 'INADEQUATE'
}

export const RATING_THRESHOLDS = {
  OUTSTANDING:          { min: 88, max: 100, color: '#10b981', label: 'Outstanding' },
  GOOD:                 { min: 63, max: 87,  color: '#3b82f6', label: 'Good' },
  REQUIRES_IMPROVEMENT: { min: 39, max: 62,  color: '#f59e0b', label: 'Requires Improvement' },
  INADEQUATE:           { min: 0,  max: 38,  color: '#ef4444', label: 'Inadequate' },
} as const;
```

### 9.3 Evidence Quality Factor

```typescript
export function calculateEvidenceQuality(domain: CqcDomainType, evidence: Evidence[]): number {
  const domainEvidence = evidence.filter(e => e.linkedDomains?.includes(domain))

  if (domainEvidence.length === 0) return 0.5  // No evidence = half credit

  const totalItems = domainEvidence.length
  let qualitySum = 0

  for (const item of domainEvidence) {
    let itemQuality = 0.5  // Base

    // Is it current (not expired)?
    if (item.status === 'CURRENT') itemQuality += 0.3
    else if (item.status === 'EXPIRING_SOON') itemQuality += 0.15

    // Is it properly classified and linked to KLOEs?
    if (item.linkedKloes && item.linkedKloes.length > 0) itemQuality += 0.1

    // Has it been reviewed recently?
    if (item.lastReviewedAt && daysSince(item.lastReviewedAt) < 365) itemQuality += 0.1

    qualitySum += Math.min(itemQuality, 1.0)
  }

  return Math.max(0.5, qualitySum / totalItems)
}
```

### 9.4 Timeliness Factor (Compliance Decay)

```typescript
export function calculateTimeliness(domain: CqcDomainType, evidence: Evidence[]): number {
  const domainEvidence = evidence.filter(e => e.linkedDomains?.includes(domain))

  if (domainEvidence.length === 0) return 0.5

  const now = new Date()
  let timelinessSum = 0

  for (const item of domainEvidence) {
    if (!item.validUntil) {
      timelinessSum += 0.8  // No expiry = decent but not perfect
      continue
    }

    const daysUntilExpiry = differenceInDays(item.validUntil, now)

    if (daysUntilExpiry > 90)       timelinessSum += 1.0   // Well within date
    else if (daysUntilExpiry > 30)  timelinessSum += 0.8   // Approaching
    else if (daysUntilExpiry > 0)   timelinessSum += 0.6   // Expiring soon
    else if (daysUntilExpiry > -30) timelinessSum += 0.3   // Recently expired
    else                            timelinessSum += 0.1   // Long expired
  }

  return Math.max(0.5, timelinessSum / domainEvidence.length)
}
```

### 9.5 Confidence Calculation

```typescript
export function calculateConfidence(
  answers: AssessmentAnswer[],
  evidence: Evidence[],
  applicableKloes: KloeDefinition[],
): number {
  // Confidence is based on:
  // 1. Question coverage (what % of questions were answered, not "unsure")
  // 2. Evidence coverage (what % of expected evidence items are uploaded)
  // 3. Recency (how recently was the assessment taken)

  // Factor 1: Question certainty (0–0.4)
  const answeredCertainly = answers.filter(a =>
    a.answerValue !== 'unsure' && a.answerValue !== null
  ).length
  const questionCoverage = answeredCertainly / Math.max(answers.length, 1)
  const questionFactor = questionCoverage * 0.4

  // Factor 2: Evidence coverage (0–0.4)
  const totalExpected = applicableKloes.reduce((sum, k) => sum + getExpectedEvidenceCount(k), 0)
  const totalProvided = evidence.filter(e => e.status !== 'EXPIRED').length
  const evidenceCoverage = Math.min(totalProvided / Math.max(totalExpected, 1), 1)
  const evidenceFactor = evidenceCoverage * 0.4

  // Factor 3: Assessment recency (0–0.2)
  const latestAnswer = answers.sort((a, b) => b.answeredAt - a.answeredAt)[0]
  const daysSinceAssessment = latestAnswer ? daysSince(latestAnswer.answeredAt) : 365
  const recencyFactor = daysSinceAssessment < 30 ? 0.2
    : daysSinceAssessment < 90 ? 0.15
    : daysSinceAssessment < 180 ? 0.1
    : 0.05

  return Math.min(questionFactor + evidenceFactor + recencyFactor, 1.0)
}
```

---

## 10. Rating Prediction Engine

### 10.1 Overall Rating Determination Logic

```typescript
export function determineOverallRating(domainScores: DomainScoreResult[]): CqcRating {
  const domainRatings = domainScores.map(ds => ds.predictedRating)

  // Rule 1: If ANY domain is Inadequate → overall max is Requires Improvement
  if (domainRatings.includes('INADEQUATE')) {
    return 'REQUIRES_IMPROVEMENT'
  }

  // Rule 2: If 2+ domains are Requires Improvement → overall is Requires Improvement
  const riCount = domainRatings.filter(r => r === 'REQUIRES_IMPROVEMENT').length
  if (riCount >= 2) {
    return 'REQUIRES_IMPROVEMENT'
  }

  // Rule 3: For Outstanding overall, ALL domains must be Good or Outstanding,
  //         AND at least 2 domains must be Outstanding
  const outstandingCount = domainRatings.filter(r => r === 'OUTSTANDING').length
  const goodOrAbove = domainRatings.every(r => r === 'GOOD' || r === 'OUTSTANDING')
  if (goodOrAbove && outstandingCount >= 2) {
    return 'OUTSTANDING'
  }

  // Rule 4: For Good overall, ALL domains must be at least Good
  //         (with maximum 1 domain at RI, if well-compensated)
  if (goodOrAbove) {
    return 'GOOD'
  }

  // Rule 5: If 1 domain is RI but rest are Good+, still can be Good overall
  if (riCount === 1) {
    const riDomain = domainScores.find(ds => ds.predictedRating === 'REQUIRES_IMPROVEMENT')
    // Only if the RI domain is close to Good threshold (62%+) and has no critical gaps
    if (riDomain && riDomain.percentage >= 55 && !riDomain.criticalGapPresent) {
      return 'GOOD'
    }
  }

  return 'REQUIRES_IMPROVEMENT'
}
```

---

## 11. Gap Identification & Severity Classification

### 11.1 Severity Matrix

```typescript
export const GAP_SEVERITY_MATRIX = {
  CRITICAL: {
    label: 'Critical',
    color: '#ef4444',
    icon: 'AlertOctagon',
    maxResolutionDays: 1,      // Immediate action
    ratingImpact: 'Caps domain rating at Requires Improvement',
    description: 'Immediate risk of harm to people. CQC enforcement action likely.',
    examples: [
      'No safeguarding policy in place',
      'Operating without a registered manager',
      'Unsafe prescribing arrangements',
      'Missing fire risk assessment',
      'Staff without DBS checks providing personal care',
    ],
  },
  HIGH: {
    label: 'High',
    color: '#f97316',
    icon: 'AlertTriangle',
    maxResolutionDays: 7,
    ratingImpact: 'Prevents Good rating in the domain',
    description: 'Significant compliance shortfall requiring urgent attention.',
    examples: [
      'Safeguarding training overdue for multiple staff',
      'No duty of candour policy',
      'Incident reporting system not implemented',
      'Risk assessments outdated by 6+ months',
    ],
  },
  MEDIUM: {
    label: 'Medium',
    color: '#f59e0b',
    icon: 'AlertCircle',
    maxResolutionDays: 30,
    ratingImpact: 'May prevent Outstanding rating',
    description: 'Compliance issue that should be addressed within 30 days.',
    examples: [
      'Hand hygiene audits not conducted regularly',
      'Some policies approaching review date',
      'No Legionella risk assessment',
      'Staff supervision records incomplete',
    ],
  },
  LOW: {
    label: 'Low',
    color: '#3b82f6',
    icon: 'Info',
    maxResolutionDays: 90,
    ratingImpact: 'Minor — improvement opportunity',
    description: 'Best practice recommendation for continuous improvement.',
    examples: [
      'Could improve evidence of learning from incidents',
      'Community engagement could be strengthened',
      'Quality improvement plan could be more structured',
    ],
  },
} as const;
```

### 11.2 Auto-Gap Generation from Assessment

```typescript
export function generateGapsFromAssessment(
  answers: AssessmentAnswer[],
  serviceType: ServiceType,
): ComplianceGap[] {
  const gaps: ComplianceGap[] = []

  for (const answer of answers) {
    const questionDef = getQuestionById(answer.questionId)
    if (!questionDef?.gapTrigger) continue

    const answerValue = typeof answer.answerValue === 'string'
      ? answer.answerValue
      : JSON.stringify(answer.answerValue)

    if (questionDef.gapTrigger.triggerValues.includes(answerValue)) {
      gaps.push({
        domain: answer.domain,
        kloeCode: answer.kloeCode,
        regulationCode: getLinkedRegulation(answer.kloeCode),
        title: questionDef.gapTrigger.gapTitle,
        description: questionDef.gapTrigger.gapDescription,
        severity: questionDef.gapTrigger.severity,
        status: 'OPEN',
        source: 'assessment',
        remediationSteps: {
          immediate: [questionDef.gapTrigger.remediationHint],
          shortTerm: [],
          evidence: getExpectedEvidence(answer.kloeCode, serviceType),
        },
        estimatedEffort: estimateEffort(questionDef.gapTrigger.severity),
      })
    }
  }

  return gaps
}

function estimateEffort(severity: GapSeverity): string {
  switch (severity) {
    case 'CRITICAL': return '1–3 days'
    case 'HIGH':     return '1–2 weeks'
    case 'MEDIUM':   return '2–4 weeks'
    case 'LOW':      return '1–3 months'
  }
}
```

---

## 12. Remediation Engine

### 12.1 Remediation Step Templates

```typescript
// lib/compliance/remediation-templates.ts

export const REMEDIATION_TEMPLATES: Record<string, RemediationTemplate> = {
  MISSING_POLICY: {
    immediate: [
      'Use the AI Policy Generator to create a draft policy',
      'Review and customise the generated policy for your service',
      'Have the registered manager approve and sign the policy',
    ],
    shortTerm: [
      'Brief all staff on the new policy within 7 days',
      'Obtain read-receipt acknowledgements from all staff',
      'Set a review date (recommended: 12 months)',
    ],
    evidence: [
      'Approved policy document (upload to Evidence Library)',
      'Staff acknowledgement records',
      'Policy review schedule entry',
    ],
    aiCapable: true,  // AI can generate this
  },

  MISSING_TRAINING: {
    immediate: [
      'Identify which staff require the training',
      'Source appropriate training (online or face-to-face)',
      'Schedule training sessions within the next 14 days',
    ],
    shortTerm: [
      'Complete all outstanding training',
      'Record completion in staff training matrix',
      'Schedule refresher dates',
    ],
    evidence: [
      'Training certificates or completion records',
      'Updated training matrix',
      'Training schedule showing future refresher dates',
    ],
    aiCapable: false,
  },

  MISSING_RISK_ASSESSMENT: {
    immediate: [
      'Conduct the required risk assessment',
      'Use validated tools where applicable',
      'Document findings and control measures',
    ],
    shortTerm: [
      'Review all existing risk assessments for currency',
      'Set review dates for each risk assessment',
      'Brief relevant staff on findings and control measures',
    ],
    evidence: [
      'Completed risk assessment document',
      'Risk assessment review schedule',
      'Staff briefing records',
    ],
    aiCapable: true,  // AI can generate template risk assessments
  },

  MISSING_AUDIT: {
    immediate: [
      'Schedule the outstanding audit',
      'Assign a competent person to conduct the audit',
      'Prepare the audit tool/checklist',
    ],
    shortTerm: [
      'Complete the audit and document findings',
      'Create action plan for any issues identified',
      'Schedule regular audit programme',
    ],
    evidence: [
      'Completed audit report',
      'Action plan from audit findings',
      'Annual audit schedule',
    ],
    aiCapable: true,  // AI can generate audit checklists
  },
};
```

---

## 13. Policy Template Library

### 13.1 Required Policies by Service Type

```typescript
// lib/constants/policy-templates.ts

export const POLICY_TEMPLATES = {
  // ── SHARED (Both service types) ──
  shared: [
    { id: 'POL_SAFEGUARDING',     name: 'Safeguarding Adults Policy',          domain: 'SAFE', kloes: ['S1'], regs: ['REG13'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_HEALTH_SAFETY',    name: 'Health and Safety Policy',            domain: 'SAFE', kloes: ['S2'], regs: ['REG12','REG15'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_MEDICINES',        name: 'Medicines Management Policy',         domain: 'SAFE', kloes: ['S4'], regs: ['REG12'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_IPC',              name: 'Infection Prevention and Control Policy', domain: 'SAFE', kloes: ['S5'], regs: ['REG12','REG15'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_INCIDENT',         name: 'Incident Reporting Policy',           domain: 'SAFE', kloes: ['S6'], regs: ['REG12','REG17'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_COMPLAINTS',       name: 'Complaints Policy',                   domain: 'RESPONSIVE', kloes: ['R2'], regs: ['REG16'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_CONSENT',          name: 'Consent Policy',                      domain: 'EFFECTIVE', kloes: ['E7'], regs: ['REG11'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_GOVERNANCE',       name: 'Good Governance Policy',              domain: 'WELL_LED', kloes: ['W2'], regs: ['REG17'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_RECRUITMENT',      name: 'Safer Recruitment Policy',            domain: 'SAFE', kloes: ['S3'], regs: ['REG19'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_EQUALITY',         name: 'Equality, Diversity and Human Rights Policy', domain: 'CARING', kloes: ['C1','C3'], regs: ['REG10'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_WHISTLEBLOWING',   name: 'Whistleblowing / Freedom to Speak Up Policy', domain: 'WELL_LED', kloes: ['W3'], regs: ['REG17'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_CANDOUR',          name: 'Duty of Candour Policy',              domain: 'SAFE', kloes: ['S6'], regs: ['REG20'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_DATA_PROTECTION',  name: 'Data Protection / GDPR Policy',      domain: 'WELL_LED', kloes: ['W6'], regs: ['REG17'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_FIRE_SAFETY',      name: 'Fire Safety Policy',                  domain: 'SAFE', kloes: ['S2'], regs: ['REG12','REG15'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_BUSINESS_CONT',    name: 'Business Continuity Plan',            domain: 'WELL_LED', kloes: ['W5'], regs: ['REG17'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_SOP',              name: 'Statement of Purpose',                domain: 'WELL_LED', kloes: ['W1'], regs: ['REG17'], reviewMonths: 12, aiGenerable: true },
  ],

  // ── AESTHETIC CLINIC SPECIFIC ──
  clinicOnly: [
    { id: 'POL_PRESCRIBING',      name: 'Prescribing Policy',                  domain: 'SAFE', kloes: ['S4'], regs: ['REG12'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_CLINICAL_AUDIT',   name: 'Clinical Audit Policy',               domain: 'EFFECTIVE', kloes: ['E1'], regs: ['REG17'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_CHAPERONE',        name: 'Chaperone Policy',                    domain: 'CARING', kloes: ['C3'], regs: ['REG10'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_MEDICAL_EMERGENCY',name: 'Medical Emergency Policy',            domain: 'SAFE', kloes: ['S2'], regs: ['REG12'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_COOLING_OFF',      name: 'Cooling-Off Period Policy',           domain: 'EFFECTIVE', kloes: ['E7'], regs: ['REG11'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_PHOTOGRAPHY',      name: 'Before/After Photography Policy',    domain: 'CARING', kloes: ['C3'], regs: ['REG10'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_EQUIPMENT_MAINT',  name: 'Equipment Maintenance Policy',        domain: 'SAFE', kloes: ['S2'], regs: ['REG15'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_LASER_SAFETY',     name: 'Laser / IPL Safety Policy',           domain: 'SAFE', kloes: ['S2'], regs: ['REG12'], reviewMonths: 12, aiGenerable: true },
  ],

  // ── CARE HOME SPECIFIC ──
  careHomeOnly: [
    { id: 'POL_ADMISSION',        name: 'Admission and Assessment Policy',     domain: 'EFFECTIVE', kloes: ['E1'], regs: ['REG9'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_MCA_DOLS',         name: 'Mental Capacity Act and DoLS Policy', domain: 'EFFECTIVE', kloes: ['E7'], regs: ['REG11','REG13'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_FALLS',            name: 'Falls Prevention Policy',             domain: 'SAFE', kloes: ['S2'], regs: ['REG12'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_PRESSURE',         name: 'Pressure Ulcer Prevention Policy',    domain: 'SAFE', kloes: ['S2'], regs: ['REG12'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_MOVING_HANDLING',  name: 'Moving and Handling Policy',          domain: 'SAFE', kloes: ['S2'], regs: ['REG12'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_END_OF_LIFE',      name: 'End of Life Care Policy',             domain: 'RESPONSIVE', kloes: ['R3'], regs: ['REG9'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_NUTRITION',        name: 'Nutrition and Hydration Policy',      domain: 'EFFECTIVE', kloes: ['E3'], regs: ['REG14'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_MISSING_PERSON',   name: 'Missing Persons / Absconding Policy', domain: 'SAFE', kloes: ['S1','S2'], regs: ['REG12','REG13'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_BEHAVIOUR',        name: 'Positive Behaviour Support Policy',   domain: 'SAFE', kloes: ['S1'], regs: ['REG13'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_RESTRAINT',        name: 'Restraint and Restrictive Practices Policy', domain: 'SAFE', kloes: ['S1'], regs: ['REG13'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_RESIDENTS_MONEY',  name: 'Service User Monies Policy',          domain: 'SAFE', kloes: ['S1'], regs: ['REG13'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_ACTIVITIES',       name: 'Activities and Social Engagement Policy', domain: 'RESPONSIVE', kloes: ['R1'], regs: ['REG9'], reviewMonths: 12, aiGenerable: true },
    { id: 'POL_VISITING',         name: 'Visiting Policy',                     domain: 'RESPONSIVE', kloes: ['R1'], regs: ['REG9A'], reviewMonths: 12, aiGenerable: true },
  ],
} as const;

// Helper to get all applicable policies for a service type
export function getRequiredPolicies(serviceType: ServiceType) {
  const shared = POLICY_TEMPLATES.shared
  const specific = serviceType === 'AESTHETIC_CLINIC'
    ? POLICY_TEMPLATES.clinicOnly
    : POLICY_TEMPLATES.careHomeOnly
  return [...shared, ...specific]
}
```

---

## 14. Rating Characteristics — What CQC Looks For

### 14.1 Overall Rating Characteristics

```typescript
// lib/constants/rating-characteristics.ts

export const RATING_CHARACTERISTICS = {
  OUTSTANDING: {
    overallDescription:
      'The service is performing exceptionally well. People receive the highest standard of care ' +
      'which goes significantly beyond what is expected. There is clear innovation and best practice ' +
      'sharing. The service is a beacon of excellence.',
    keyIndicators: [
      'Innovative approaches that could be shared as best practice',
      'People and their families/carers are genuinely empowered',
      'Strong learning culture with proactive improvement',
      'Measurable outcomes consistently exceed benchmarks',
      'Staff are highly motivated and feel valued',
      'Governance is exemplary with robust assurance',
    ],
  },
  GOOD: {
    overallDescription:
      'The service is performing well and meeting expectations. People receive safe, effective, ' +
      'caring and responsive care that is well-led.',
    keyIndicators: [
      'All fundamental standards are met',
      'People are safe and their rights are respected',
      'Care is effective and based on evidence',
      'Staff are trained and supported',
      'Clear governance with regular audit',
      'Complaints are handled well and learned from',
    ],
  },
  REQUIRES_IMPROVEMENT: {
    overallDescription:
      'The service is not performing as well as it should. CQC has identified areas where the ' +
      'provider must make improvements.',
    keyIndicators: [
      'Some fundamental standards not fully met',
      'Evidence gaps in one or more domains',
      'Staff training or supervision inconsistent',
      'Risk assessments outdated or incomplete',
      'Governance processes need strengthening',
      'Learning from incidents not systematic',
    ],
  },
  INADEQUATE: {
    overallDescription:
      'The service is performing badly. CQC has taken enforcement action against the provider. ' +
      'People are at risk of harm.',
    keyIndicators: [
      'Serious shortfalls in fundamental standards',
      'People at risk of or experiencing harm',
      'Leadership failure to address known issues',
      'Systemic failures in safety or governance',
      'No effective learning or improvement culture',
      'CQC enforcement action taken or imminent',
    ],
  },
} as const;
```

---

## 15. Ongoing Monitoring & Compliance Decay

### 15.1 Automated Monitoring Triggers

```typescript
// lib/compliance/monitoring-engine.ts

export const MONITORING_TRIGGERS = [
  // Evidence expiry monitoring
  {
    type: 'EVIDENCE_EXPIRING',
    check: 'Daily at 06:00 UTC',
    condition: 'Evidence validUntil within 30 days',
    action: 'Create notification + update domain score',
    severity: 'MEDIUM',
  },
  {
    type: 'EVIDENCE_EXPIRED',
    check: 'Daily at 06:00 UTC',
    condition: 'Evidence validUntil has passed',
    action: 'Create gap + notification + recalculate score',
    severity: 'HIGH',
  },

  // Policy review monitoring
  {
    type: 'POLICY_REVIEW_DUE',
    check: 'Weekly on Monday 08:00 UTC',
    condition: 'Policy nextReviewDate within 30 days',
    action: 'Create notification + task for review',
    severity: 'MEDIUM',
  },
  {
    type: 'POLICY_OVERDUE',
    check: 'Weekly on Monday 08:00 UTC',
    condition: 'Policy nextReviewDate has passed',
    action: 'Create gap + notification + recalculate score',
    severity: 'HIGH',
  },

  // Staff compliance monitoring
  {
    type: 'TRAINING_EXPIRING',
    check: 'Daily at 06:00 UTC',
    condition: 'Training certificate expiry within 30 days',
    action: 'Create notification to staff member and manager',
    severity: 'MEDIUM',
  },
  {
    type: 'DBS_EXPIRING',
    check: 'Daily at 06:00 UTC',
    condition: 'DBS check older than 3 years (or not on Update Service)',
    action: 'Create notification + task',
    severity: 'HIGH',
  },
  {
    type: 'REGISTRATION_EXPIRING',
    check: 'Daily at 06:00 UTC',
    condition: 'Professional registration expiry within 60 days',
    action: 'Create notification + HIGH gap if expired',
    severity: 'HIGH',
  },

  // Score recalculation
  {
    type: 'SCORE_RECALCULATION',
    check: 'Every 24 hours',
    condition: 'Always',
    action: 'Recalculate all domain scores and overall score',
    severity: null,
  },

  // Stale assessment warning
  {
    type: 'ASSESSMENT_STALE',
    check: 'Monthly on 1st',
    condition: 'Last assessment older than 6 months',
    action: 'Suggest reassessment notification',
    severity: 'LOW',
  },
];
```

### 15.2 Score Recalculation Schedule

```typescript
// Recalculate when any of these events occur:
export const RECALCULATION_EVENTS = [
  'assessment.completed',        // New assessment answers
  'evidence.uploaded',           // New evidence added
  'evidence.expired',            // Evidence passed expiry
  'evidence.deleted',            // Evidence removed
  'gap.resolved',                // Gap marked as resolved
  'gap.created',                 // New gap identified
  'policy.published',            // Policy published
  'policy.expired',              // Policy past review date
  'staff.training_completed',    // Training record added
  'staff.registration_expired',  // Professional registration expired
  'incident.reported',           // New incident (may create gaps)
  'scheduled.daily_recalc',      // Daily scheduled recalculation
];
```

---

## 16. AI Integration Points

### 16.1 Where AI Powers the Framework

```typescript
export const AI_INTEGRATION_POINTS = {
  // 1. Policy Generation
  policyGeneration: {
    trigger: 'User clicks "Generate with AI" on any policy template',
    input: 'Policy template ID, service type, organization context',
    output: 'Draft policy document with proper legal references',
    model: 'Claude 3.5 Sonnet (via Anthropic API)',
    systemPrompt: 'Generate CQC-compliant policy based on Regulation {X}, for {serviceType}...',
  },

  // 2. Evidence Classification
  evidenceClassification: {
    trigger: 'User uploads a document to Evidence Library',
    input: 'Document text (OCR if needed), file metadata',
    output: 'Suggested category, linked KLOEs, linked regulations',
    model: 'Claude 3.5 Haiku (fast classification)',
  },

  // 3. Gap Analysis Enhancement
  gapAnalysis: {
    trigger: 'After assessment or on-demand',
    input: 'All gaps, evidence, scores, service type',
    output: 'Prioritised remediation plan with specific actions',
    model: 'Claude 3.5 Sonnet',
  },

  // 4. Evidence Adequacy Check
  evidenceAdequacy: {
    trigger: 'User uploads a policy or evidence document',
    input: 'Document content, expected KLOE requirements',
    output: 'Completeness score, missing sections, improvement suggestions',
    model: 'Claude 3.5 Sonnet',
  },

  // 5. Inspection Preparation Summary
  inspectionPrep: {
    trigger: 'User requests inspection prep report',
    input: 'All org data: scores, evidence, gaps, policies, staff, incidents',
    output: 'Domain-by-domain summary narrative suitable for inspector presentation',
    model: 'Claude 3.5 Sonnet',
  },

  // 6. Compliance Q&A
  complianceQA: {
    trigger: 'User asks a question in the compliance assistant',
    input: 'User question, organization context, CQC knowledge base',
    output: 'Answer with regulation citations',
    model: 'Claude 3.5 Sonnet with RAG over CQC guidance',
  },
};
```

---

## 17. Constants File — Complete Seed Data

### 17.1 File Structure for Cursor

```
lib/
├── constants/
│   ├── cqc-domains.ts              ← Section 2 (5 domain definitions)
│   ├── cqc-kloes.ts                ← Section 3 (25 KLOE full specifications)
│   ├── cqc-regulations.ts          ← Section 4 (14 regulation definitions)
│   ├── cqc-kloe-regulation-map.ts  ← Section 5 (many-to-many mapping)
│   ├── service-type-config.ts      ← Section 6 (clinic vs care home config)
│   ├── assessment-questions.ts     ← Section 7 (full question bank)
│   ├── evidence-requirements.ts    ← Section 8 (expected evidence per KLOE)
│   ├── policy-templates.ts         ← Section 13 (required policies list)
│   ├── rating-thresholds.ts        ← Section 9.2 (score → rating mapping)
│   ├── rating-characteristics.ts   ← Section 14 (what each rating means)
│   ├── gap-severity-matrix.ts      ← Section 11 (gap classification)
│   └── remediation-templates.ts    ← Section 12 (remediation step templates)
├── compliance/
│   ├── scoring-engine.ts           ← Section 9 (full scoring algorithm)
│   ├── rating-prediction.ts        ← Section 10 (rating determination logic)
│   ├── gap-generator.ts            ← Section 11.2 (auto-gap from assessment)
│   ├── monitoring-engine.ts        ← Section 15 (ongoing monitoring)
│   ├── applicability-filter.ts     ← Section 6.2 (service type filtering)
│   └── recalculation.ts            ← Section 15.2 (when to recalculate)
└── ai/
    ├── policy-generator.ts         ← Section 16 (AI policy generation)
    ├── evidence-classifier.ts      ← Section 16 (AI evidence classification)
    └── gap-analyser.ts             ← Section 16 (AI gap analysis)
```

### 17.2 Seed Data Summary

| Entity | Count | Source |
|--------|-------|--------|
| CQC Domains | 5 | `cqc-domains.ts` |
| CQC KLOEs | 25 (S1-S6, E1-E7, C1-C3, R1-R3, W1-W6) | `cqc-kloes.ts` |
| CQC Regulations | 14 (Reg 9–20A) | `cqc-regulations.ts` |
| KLOE↔Regulation Mappings | ~65 | `cqc-kloe-regulation-map.ts` |
| Assessment Questions (Clinic) | ~58 | `assessment-questions.ts` |
| Assessment Questions (Care Home) | ~61 | `assessment-questions.ts` |
| Policy Templates (Shared) | 15 | `policy-templates.ts` |
| Policy Templates (Clinic-only) | 8 | `policy-templates.ts` |
| Policy Templates (Care Home-only) | 13 | `policy-templates.ts` |
| Remediation Templates | ~10 categories | `remediation-templates.ts` |

---

> **This document is the regulatory brain of the CQC Compliance Platform.** Every UI component, every score, every gap, every task, and every AI-generated recommendation traces back to the data and logic defined here. Cursor should treat this as the authoritative reference for all compliance-related implementation.
