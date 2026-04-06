# CQC Compliance Platform — Assessment Engine Specification

> **File 7 of 7** | The brain that evaluates every compliance dimension and tells users exactly where they stand
> **Question Bank:** 120+ questions across 5 domains × 2 service types
> **Scoring Model:** Weighted percentage with evidence quality & timeliness factors
> **Rating Prediction:** Mirrors CQC aggregation methodology with domain-level limiters
> **Last Updated:** February 2026
> **Companion Files:** `01-ARCHITECTURE.md` · `02-DATABASE.md` · `03-UI-UX.md` · `04-CQC-FRAMEWORK.md` · `05-API-SERVICES.md` · `06-AUTH-SECURITY.md`

---

## Table of Contents

1. [Assessment Engine Overview](#1-assessment-engine-overview)
2. [Onboarding Wizard Flow](#2-onboarding-wizard-flow)
3. [Question Architecture](#3-question-architecture)
4. [Complete Question Bank — SAFE Domain](#4-complete-question-bank--safe-domain)
5. [Complete Question Bank — EFFECTIVE Domain](#5-complete-question-bank--effective-domain)
6. [Complete Question Bank — CARING Domain](#6-complete-question-bank--caring-domain)
7. [Complete Question Bank — RESPONSIVE Domain](#7-complete-question-bank--responsive-domain)
8. [Complete Question Bank — WELL-LED Domain](#8-complete-question-bank--well-led-domain)
9. [Question Filtering & Conditional Logic](#9-question-filtering--conditional-logic)
10. [Answer Processing & Persistence](#10-answer-processing--persistence)
11. [Scoring Engine — Step-by-Step Pipeline](#11-scoring-engine--step-by-step-pipeline)
12. [Evidence Quality & Timeliness Factors](#12-evidence-quality--timeliness-factors)
13. [Rating Prediction Engine](#13-rating-prediction-engine)
14. [Gap Identification & Auto-Generation](#14-gap-identification--auto-generation)
15. [Remediation Task Generation](#15-remediation-task-generation)
16. [Re-Assessment Logic](#16-re-assessment-logic)
17. [Ongoing Compliance Monitoring](#17-ongoing-compliance-monitoring)
18. [Worked Examples — Full Scoring Walkthroughs](#18-worked-examples--full-scoring-walkthroughs)
19. [Question Versioning & Migration](#19-question-versioning--migration)

---

## 1. Assessment Engine Overview

### 1.1 What the Assessment Engine Does

The assessment engine is the core intelligence of the platform. It takes user responses about their current compliance posture, calculates a predicted CQC rating, identifies every gap, and generates a prioritised remediation plan.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ASSESSMENT ENGINE PIPELINE                           │
│                                                                         │
│  INPUT                                                                  │
│  ├── Service type (Aesthetic Clinic or Care Home)                       │
│  ├── Organization metadata (size, specialties, current rating)          │
│  ├── 58–65 assessment answers (filtered by service type)               │
│  ├── Evidence library (uploaded documents, certificates)               │
│  └── Existing compliance data (staff records, training, policies)      │
│                                                                         │
│  PROCESSING                                                             │
│  ├── Step 1: Filter applicable questions by service type               │
│  ├── Step 2: Score each answer (points × weight)                       │
│  ├── Step 3: Aggregate per-KLOE scores                                 │
│  ├── Step 4: Aggregate per-domain scores                               │
│  ├── Step 5: Apply evidence quality factor (0.5–1.0)                   │
│  ├── Step 6: Apply timeliness factor (0.5–1.0)                         │
│  ├── Step 7: Calculate domain percentages                              │
│  ├── Step 8: Determine domain ratings with limiters                    │
│  ├── Step 9: Determine overall rating (CQC aggregation rules)          │
│  ├── Step 10: Identify and classify all gaps                           │
│  ├── Step 11: Generate remediation tasks from gaps                     │
│  └── Step 12: Calculate confidence score                               │
│                                                                         │
│  OUTPUT                                                                 │
│  ├── Overall score (0–100%)                                            │
│  ├── Predicted CQC rating (Outstanding/Good/RI/Inadequate)             │
│  ├── 5 domain scores with individual ratings                           │
│  ├── Complete gap list with severity classifications                   │
│  ├── Prioritised remediation tasks with effort estimates               │
│  ├── Evidence coverage report                                          │
│  └── Confidence score (0–1.0)                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 When the Assessment Runs

| Trigger | Type | Description |
|---|---|---|
| First sign-up | Initial onboarding | Mandatory 4-step wizard before dashboard access |
| Manual re-assessment | User-initiated | ADMIN+ triggers from Settings; creates new assessment |
| Weekly compliance recalc | Automated cron | Recalculates score using latest evidence/staff/training data (no new questions) |
| Evidence change | Event-triggered | Upload, delete, or expiry triggers debounced recalculation |
| Policy change | Event-triggered | Publish or revoke triggers debounced recalculation |
| Staff/training change | Event-triggered | Training completion or expiry triggers debounced recalculation |
| Gap resolution | Event-triggered | Resolving a gap triggers debounced recalculation |

### 1.3 Assessment vs. Recalculation

| Aspect | Full Assessment | Recalculation |
|---|---|---|
| Requires user input | Yes (answer 58–65 questions) | No (uses existing data) |
| Creates new Assessment record | Yes | No (updates ComplianceScore) |
| Updates question answers | Yes | No |
| Evaluates evidence library | Yes | Yes |
| Evaluates staff/training records | No (separate module) | Yes |
| Evaluates policy library | No (separate module) | Yes |
| Generates new gaps | Yes | Yes (from evidence/training expiry) |
| Takes ~10 minutes | Yes | Runs in <5 seconds |

---

## 2. Onboarding Wizard Flow

### 2.1 Four-Step Wizard

```
STEP 1: Welcome + Service Type Selection
  ├── Select: Aesthetic Clinic or Care Home
  ├── This choice filters ALL subsequent questions
  └── Cannot be changed after assessment (determines entire compliance profile)

STEP 2: Organization Details
  ├── Organization name (required)
  ├── CQC Provider ID (optional)
  ├── CQC Location ID (optional)
  ├── Registered Manager name (optional)
  ├── Postcode (required)
  ├── Number of beds/treatment rooms (required)
  ├── Specialties — multi-select (optional)
  │   ├── Clinic: Botox, Fillers, Laser, Chemical Peels, PRP, Body Contouring, etc.
  │   └── Care Home: Dementia, Nursing, Residential, Learning Disabilities, etc.
  ├── Current CQC rating (optional: Outstanding/Good/RI/Inadequate/Not yet rated)
  └── Last CQC inspection date (optional)

STEP 3: Compliance Assessment
  ├── Questions grouped by CQC domain tab (Safe, Effective, Caring, Responsive, Well-Led)
  ├── Each domain shows as a collapsible section or horizontal tab
  ├── Within each domain, questions organized by KLOE (S1, S2, S3...)
  ├── Progress bar shows completion across all domains
  ├── "Unsure" is a valid answer (scores low but does not block completion)
  ├── Answers auto-save on change (debounced 500ms)
  └── Can navigate between domains freely; no enforced domain order

STEP 4: Results
  ├── Animated score reveal (count-up from 0 to final score)
  ├── Overall predicted CQC rating with colour badge
  ├── 5 domain score cards (score, rating, gap count)
  ├── Gap summary: Critical (X), High (X), Medium (X), Low (X)
  ├── Top 5 priority actions (linked to remediation tasks)
  └── "Go to Dashboard" button → marks onboarding complete
```

### 2.2 Assessment Step Persistence

Answers save per-step via `POST /api/assessment` with `{ assessmentId, step, answers[] }`. This allows:

- Resume after browser close (assessment record tracks `currentStep`)
- Navigate back without losing data (answers already persisted)
- Partial save on domain completion (don't need to finish all domains in one sitting)

### 2.3 Organization Profile Creation

Step 2 creates the Organization record in the database and assigns the current user as OWNER:

```typescript
// What happens on Step 2 submission:
// 1. Create Organization record
// 2. Update User.organizationId
// 3. Create Assessment record (status: in_progress, isInitial: true)
// 4. Return assessmentId for subsequent answer saves
```

---

## 3. Question Architecture

### 3.1 Question Data Model

Questions are defined in code (`lib/constants/assessment-questions.ts`), NOT in the database. This enables type safety, versioning, and deployment-time updates without migrations.

```typescript
export interface AssessmentQuestion {
  id: string                    // Stable unique ID: "{DOMAIN}_{KLOE}_{SEQ}" e.g. "SAFE_S1_Q01"
  domain: CqcDomainType         // SAFE | EFFECTIVE | CARING | RESPONSIVE | WELL_LED
  kloeCode: string              // S1, S2, E1, C1, R1, W1 etc.
  regulationCodes: string[]     // REG12, REG13, REG17 etc. — which regulations this maps to
  step: 3                       // Always step 3 (assessment step of wizard)

  // Display
  text: string                  // The question shown to the user
  helpText?: string             // Expandable "Why this matters" explanation
  helpLink?: string             // Optional link to CQC guidance

  // Answer configuration
  answerType: AnswerType
  options?: AnswerOption[]      // For multi_select type
  placeholder?: string          // For text/date types

  // Applicability
  serviceTypes: ServiceType[]   // Which service types see this question
  conditionalOn?: ConditionalRule  // Only show if another answer matches

  // Scoring
  scoring: ScoringConfig
  weight: number                // 0.5 – 2.0 (relative importance within domain)

  // Gap trigger
  gapTrigger?: GapTriggerConfig
}

type AnswerType = 'yes_no' | 'yes_no_partial' | 'multi_select' | 'scale' | 'date' | 'text' | 'number'

interface AnswerOption {
  value: string
  label: string
  points: number               // Points if this option is selected
}

interface ConditionalRule {
  questionId: string
  operator: 'equals' | 'includes' | 'not_equals'
  value: string | string[]
}

interface ScoringConfig {
  maxPoints: number
  scoringMap: Record<string, number>  // answer_value → points
}

interface GapTriggerConfig {
  triggerValues: string[]       // Which answer values create a gap
  severity: GapSeverity         // CRITICAL | HIGH | MEDIUM | LOW
  gapTitle: string              // Short title for the gap
  gapDescription: string        // Full description
  remediationHint: string       // First remediation step
  linkedRegulations: string[]   // Which CQC regulations this gap violates
  remediationTemplate?: string  // Key into REMEDIATION_TEMPLATES
}
```

### 3.2 Answer Types Reference

| Type | UI Component | Values | Scoring | When Used |
|---|---|---|---|---|
| `yes_no` | Two toggle buttons | `yes`, `no` | Binary (0 or max) | Clear-cut compliance items |
| `yes_no_partial` | Three/four toggle buttons | `yes`, `partial`, `no`, `unsure` | Graduated (0 to max) | Items with degrees of compliance |
| `multi_select` | Checkbox group | Array of selected values | Points per selection | Multi-faceted items (e.g. training topics) |
| `scale` | Slider or 1–5 buttons | `1` through `5` | Linear scale | Self-assessment questions |
| `date` | Date picker | ISO date string | Points based on recency | Expiry / review dates |
| `number` | Number input | Numeric value | Threshold-based | Counts (e.g. number of staff trained) |
| `text` | Textarea | Free text | 0 points (context only) | Notes, additional information |

### 3.3 Question Counts Summary

```
Domain       │ Both │ Clinic Only │ Care Home Only │ Clinic Total │ Care Home Total
─────────────┼──────┼─────────────┼────────────────┼──────────────┼────────────────
SAFE         │  14  │     5       │      5         │     19       │     19
EFFECTIVE    │   8  │     6       │      7         │     14       │     15
CARING       │   6  │     2       │      3         │      8       │      9
RESPONSIVE   │   5  │     3       │      4         │      8       │      9
WELL-LED     │  10  │     2       │      3         │     12       │     13
─────────────┼──────┼─────────────┼────────────────┼──────────────┼────────────────
TOTAL        │  43  │    18       │     22         │     61       │     65
```

---

## 4. Complete Question Bank — SAFE Domain

> **6 KLOEs** | S1: Safeguarding · S2: Risk Assessment · S3: Staffing · S4: Medicines · S5: Infection Control · S6: Learning from Incidents

### 4.1 S1 — Safeguarding (Protection from Abuse)

**Regulation 13: Safeguarding service users from abuse and improper treatment**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `SAFE_S1_Q01` | Do you have a current safeguarding adults policy that has been reviewed in the last 12 months? | Both | yes_no_partial | 10 | 1.5 | `no`/`unsure` → **CRITICAL**: Missing or outdated safeguarding policy. Fundamental requirement under Reg 13. |
| `SAFE_S1_Q02` | Do all staff have enhanced DBS checks (with barred list check where applicable)? | Both | yes_no_partial | 10 | 1.5 | `no`/`partial` → **CRITICAL**: Incomplete DBS checks. Legal requirement under Reg 19. |
| `SAFE_S1_Q03` | Have all staff completed safeguarding training within the last 12 months? | Both | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: Safeguarding training not current. |
| `SAFE_S1_Q04` | Is there a designated safeguarding lead identified and known to all staff? | Both | yes_no | 6 | 1.0 | `no` → **HIGH**: No designated safeguarding lead. |
| `SAFE_S1_Q05` | Do you have a clear referral pathway to the local authority safeguarding team? | Both | yes_no | 6 | 1.0 | `no` → **HIGH**: No safeguarding referral pathway documented. |
| `SAFE_S1_Q06` | Do you maintain a log of safeguarding concerns, referrals, and outcomes? | Both | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: No safeguarding referral log. |

**Scoring Map (yes_no_partial):** `yes: maxPts`, `partial: maxPts×0.5`, `no: 0`, `unsure: maxPts×0.2`
**Scoring Map (yes_no):** `yes: maxPts`, `no: 0`

### 4.2 S2 — Risk Assessment, Safety Monitoring & Management

**Regulation 12: Safe care and treatment · Regulation 15: Premises and equipment**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `SAFE_S2_Q01` | Do you have a current fire risk assessment carried out by a competent person? | Both | yes_no_partial | 10 | 1.5 | `no`/`unsure` → **CRITICAL**: Missing fire risk assessment. Legal requirement under Fire Safety Order 2005. |
| `SAFE_S2_Q02` | Do you conduct fire drills at least every 6 months and record the outcomes? | Both | yes_no_partial | 6 | 1.0 | `no` → **HIGH**: No regular fire drills documented. |
| `SAFE_S2_Q03` | Do you have individual risk assessments for each person using your service? | Both | yes_no_partial | 10 | 1.5 | `no` → **CRITICAL**: Missing individual risk assessments. Fundamental to Reg 12. |
| `SAFE_S2_Q04` | Do you have a Legionella risk assessment and water management plan? | Both | yes_no | 6 | 1.0 | `no` → **MEDIUM**: No Legionella risk assessment. |
| `SAFE_S2_Q05` | Do you have COSHH assessments for all hazardous substances used on the premises? | Both | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: Missing COSHH assessments. |
| `SAFE_S2_Q06` | Do you have Personal Emergency Evacuation Plans (PEEPs) for people with mobility or cognitive limitations? | Care Home | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: No PEEPs for vulnerable residents. |
| `SAFE_S2_Q07` | Do you have procedure-specific risk assessments for all treatments offered (e.g. laser, injectables, peels)? | Aesthetic Clinic | yes_no_partial | 10 | 1.5 | `no` → **CRITICAL**: No procedure-specific risk assessments. |
| `SAFE_S2_Q08` | Is all clinical equipment subject to a planned preventive maintenance schedule and PAT testing? | Both | yes_no_partial | 6 | 1.0 | `no` → **HIGH**: No equipment maintenance schedule. |
| `SAFE_S2_Q09` | Do you have a current environmental risk assessment covering the physical premises? | Both | yes_no | 6 | 1.0 | `no` → **MEDIUM**: No environmental risk assessment. |
| `SAFE_S2_Q10` | Do you have ligature risk assessments for areas accessible to residents at risk of self-harm? | Care Home | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: No ligature risk assessments. Conditional: only shows if care home indicates mental health/dementia speciality. |
| `SAFE_S2_Q11` | Are bed rail risk assessments completed for any residents using bed rails? | Care Home | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: No bed rail risk assessments. Conditional: only shows if care home. |

### 4.3 S3 — Staffing

**Regulation 18: Staffing · Regulation 19: Fit and proper persons employed**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `SAFE_S3_Q01` | Do you have a registered manager in post? | Both | yes_no | 10 | 2.0 | `no` → **CRITICAL**: No registered manager. Breach of registration conditions and CQC enforcement trigger. |
| `SAFE_S3_Q02` | Do you use a validated tool or method to determine safe staffing levels? | Care Home | yes_no | 8 | 1.0 | `no` → **MEDIUM**: No validated staffing tool. |
| `SAFE_S3_Q03` | Do you maintain complete recruitment files including references, qualifications, right-to-work checks, and employment history with gap explanations? | Both | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: Incomplete recruitment files. Reg 19 requirement. |
| `SAFE_S3_Q04` | Do all practitioners hold valid professional registration/indemnity insurance where applicable? | Both | yes_no_partial | 10 | 1.5 | `no`/`partial` → **CRITICAL**: Staff without valid registration or indemnity. |
| `SAFE_S3_Q05` | Are agency or temporary staff given a local induction before they start work? | Care Home | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: No agency staff induction process. |
| `SAFE_S3_Q06` | Do all clinical practitioners hold specific qualifications for the procedures they perform (e.g. Level 7 for injectables, laser safety certification)? | Aesthetic Clinic | yes_no_partial | 10 | 1.5 | `no`/`partial` → **CRITICAL**: Staff performing procedures without required qualifications. |

### 4.4 S4 — Medicines Management

**Regulation 12: Safe care and treatment (medicines)**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `SAFE_S4_Q01` | Do you have a medicines management policy? | Both | yes_no_partial | 10 | 1.5 | `no` → **CRITICAL**: No medicines management policy. Reg 12 requirement. |
| `SAFE_S4_Q02` | Are all medicines stored securely with temperature monitoring where required? | Both | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: Medicines not stored safely. |
| `SAFE_S4_Q03` | Are all prescribing arrangements documented and compliant (PGDs, PSDs, independent prescribing)? | Aesthetic Clinic | yes_no_partial | 10 | 1.5 | `no`/`unsure` → **CRITICAL**: Undocumented prescribing arrangements. |
| `SAFE_S4_Q04` | Do you have emergency medicines available on site (anaphylaxis kit, hyaluronidase if using HA fillers)? | Aesthetic Clinic | yes_no_partial | 10 | 2.0 | `no` → **CRITICAL**: Missing emergency medicines. Immediate patient safety risk. |
| `SAFE_S4_Q05` | Are controlled drugs managed with a double-lock system and a controlled drug register? | Care Home | yes_no_partial | 10 | 1.5 | `no` → **CRITICAL**: Controlled drugs not properly managed. |
| `SAFE_S4_Q06` | Do you have a system for reporting and learning from medicines errors? | Both | yes_no | 6 | 1.0 | `no` → **MEDIUM**: No medicines error reporting system. |
| `SAFE_S4_Q07` | Are MAR (Medication Administration Record) charts completed accurately for each administration? | Care Home | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: Incomplete MAR charts. |
| `SAFE_S4_Q08` | Are staff who administer medicines assessed as competent to do so? | Both | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: Staff not assessed as competent for medicines. |

### 4.5 S5 — Infection Prevention & Control

**Regulation 12: Safe care and treatment (infection) · Regulation 15: Premises and equipment**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `SAFE_S5_Q01` | Do you have a current infection prevention and control (IPC) policy? | Both | yes_no_partial | 10 | 1.5 | `no` → **CRITICAL**: No IPC policy. Mandatory under Reg 12. |
| `SAFE_S5_Q02` | Do you conduct regular hand hygiene audits? | Both | yes_no | 6 | 1.0 | `no` → **MEDIUM**: No hand hygiene audits. |
| `SAFE_S5_Q03` | Do you have clinical waste management procedures and a licensed waste contractor? | Both | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: No clinical waste management. Legal requirement. |
| `SAFE_S5_Q04` | Do you have an outbreak management plan (e.g. norovirus, COVID-19)? | Care Home | yes_no | 6 | 1.0 | `no` → **MEDIUM**: No outbreak management plan. |
| `SAFE_S5_Q05` | Are cleaning schedules in place with documented frequency and responsibilities? | Both | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: No documented cleaning schedules. |
| `SAFE_S5_Q06` | Do you have an autoclave or validated instrument decontamination process for reusable clinical equipment? | Aesthetic Clinic | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: No validated decontamination process. Conditional: only if clinic uses reusable instruments. |

### 4.6 S6 — Learning from Safety Incidents

**Regulation 17: Good governance · Regulation 20: Duty of candour**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `SAFE_S6_Q01` | Do you have a formal incident reporting and investigation procedure? | Both | yes_no_partial | 10 | 1.2 | `no` → **HIGH**: No formal incident reporting procedure. Reg 17 requirement. |
| `SAFE_S6_Q02` | Do you have a duty of candour policy and do staff understand when to apply it? | Both | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: No duty of candour policy. Reg 20 requirement. |
| `SAFE_S6_Q03` | Can you demonstrate that lessons from incidents have led to changes in practice? | Both | yes_no_partial | 8 | 1.0 | `no` → **MEDIUM**: No evidence of learning from incidents. |
| `SAFE_S6_Q04` | Are notifications submitted to CQC, local authority, and other bodies when required? | Both | yes_no_partial | 6 | 1.0 | `no` → **HIGH**: Failure to submit required notifications. Legal requirement. |

**SAFE Domain Totals:**
- Aesthetic Clinic: 19 questions, max ~160 weighted points
- Care Home: 19 questions, max ~162 weighted points

---

## 5. Complete Question Bank — EFFECTIVE Domain

> **7 KLOEs** | E1: Needs Assessment · E2: Staff Skills · E3: Nutrition · E4: Multi-Disciplinary Working · E5: Healthy Living · E6: Premises & Environment · E7: Consent

### 5.1 E1 — Needs Assessment & Care Delivery

**Regulation 9: Person-centred care · Regulation 12: Safe care and treatment**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `EFF_E1_Q01` | Are care plans / treatment plans in place for every person using the service, based on a comprehensive assessment of their needs? | Both | yes_no_partial | 10 | 1.5 | `no` → **CRITICAL**: No care/treatment plans. Fundamental to Reg 9. |
| `EFF_E1_Q02` | Are care plans reviewed and updated at the frequency required (at least every 3 months for care homes, after every treatment for clinics)? | Both | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: Care plans not reviewed regularly. |
| `EFF_E1_Q03` | Do you use validated clinical assessment tools? (e.g. Waterlow, MUST, Abbey Pain Scale for care homes; Fitzpatrick skin typing, BDD screening for clinics) | Both | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: No validated assessment tools in use. |
| `EFF_E1_Q04` | Do you have a pre-treatment assessment process that includes medical history, allergies, contraindications, and expectations? | Aesthetic Clinic | yes_no_partial | 10 | 1.5 | `no` → **CRITICAL**: No pre-treatment assessment. Patient safety risk. |
| `EFF_E1_Q05` | Do you follow evidence-based clinical guidelines or protocols for all treatments/procedures offered? | Aesthetic Clinic | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: No evidence-based clinical protocols. |
| `EFF_E1_Q06` | Do you have a comprehensive pre-admission assessment process that considers medical, social, psychological, and cultural needs? | Care Home | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: No pre-admission assessment process. |
| `EFF_E1_Q07` | Are clinical audits conducted regularly (at least annually) to measure outcomes and identify improvements? | Both | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: No clinical audit programme. |
| `EFF_E1_Q08` | Do you have documented aftercare protocols provided to patients following treatment? | Aesthetic Clinic | yes_no | 8 | 1.2 | `no` → **HIGH**: No aftercare protocols. |

### 5.2 E2 — Staff Skills, Knowledge & Experience

**Regulation 18: Staffing (training) · Regulation 19: Fit and proper persons**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `EFF_E2_Q01` | Do all staff have a documented induction programme that is completed within the first 3 months? | Both | yes_no_partial | 8 | 1.0 | `no` → **MEDIUM**: No formal induction programme. |
| `EFF_E2_Q02` | Is there a training matrix showing all mandatory and role-specific training with completion status? | Both | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: No training matrix. Essential for Reg 18 evidence. |
| `EFF_E2_Q03` | Do all staff receive regular supervision (at least every 2 months) and an annual appraisal? | Both | yes_no_partial | 8 | 1.0 | `no` → **MEDIUM**: Supervision and appraisals not current. |
| `EFF_E2_Q04` | Which of the following mandatory training topics are covered for all staff? | Both | multi_select | 12 | 1.2 | Score <6 → **HIGH**: Significant gaps in mandatory training. |
| `EFF_E2_Q05` | Are procedure-specific competency assessments completed and documented for all practitioners? | Aesthetic Clinic | yes_no_partial | 10 | 1.5 | `no` → **CRITICAL**: No competency assessments for clinical procedures. |
| `EFF_E2_Q06` | Do all care staff complete the Care Certificate (or equivalent) within 12 weeks of starting? | Care Home | yes_no_partial | 8 | 1.0 | `no` → **MEDIUM**: Care Certificate not completed for all new staff. |
| `EFF_E2_Q07` | Do staff have access to continuing professional development (CPD) opportunities? | Both | yes_no | 4 | 0.8 | `no` → **LOW**: No CPD opportunities available. |

**Multi-select options for E2_Q04 (mandatory training topics):**

| Option | Points | Applicable To |
|---|---|---|
| Safeguarding adults | 2 | Both |
| Fire safety | 2 | Both |
| Health & safety | 2 | Both |
| Basic life support (BLS/ILS) | 2 | Both |
| Infection prevention & control | 2 | Both |
| Manual handling / moving & handling | 2 | Both |
| Data protection / GDPR | 1 | Both |
| Mental Capacity Act / DoLS | 2 | Care Home |
| Equality & diversity | 1 | Both |
| Food hygiene | 1 | Care Home |
| Anaphylaxis management | 2 | Aesthetic Clinic |
| Medication administration | 2 | Care Home |

### 5.3 E3 — Nutrition & Hydration

**Regulation 14: Meeting nutritional and hydration needs**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `EFF_E3_Q01` | Do all residents have a nutritional assessment on admission and at regular intervals? | Care Home | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: No nutritional assessments. Reg 14 requirement. |
| `EFF_E3_Q02` | Are fluid and food intake charts used for residents at risk of dehydration or malnutrition? | Care Home | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: No food/fluid monitoring for at-risk residents. |
| `EFF_E3_Q03` | Do menus offer choice, reflect cultural and dietary preferences, and are they reviewed by a nutritionist or dietitian? | Care Home | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: Menu choice and dietary provision limited. |
| `EFF_E3_Q04` | Do you have a current food hygiene rating of 3 or above? | Care Home | yes_no | 6 | 1.0 | `no` → **HIGH**: Food hygiene rating below 3. |
| `EFF_E3_Q05` | Are special dietary needs (e.g. modified texture, diabetic, religious requirements) accommodated? | Care Home | yes_no | 6 | 1.0 | `no` → **MEDIUM**: Special dietary needs not accommodated. |

### 5.4 E4 — Multi-Disciplinary Working

**Regulation 12: Safe care and treatment (coordination)**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `EFF_E4_Q01` | Do you have documented processes for communicating with GPs, hospitals, and other healthcare providers about people using your service? | Both | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: No multi-disciplinary communication processes. |
| `EFF_E4_Q02` | Are handover procedures documented and followed at shift changes? | Care Home | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: No documented handover procedures. |
| `EFF_E4_Q03` | Do patient treatment records include a clear referral pathway if complications arise post-treatment? | Aesthetic Clinic | yes_no | 6 | 1.0 | `no` → **HIGH**: No complication referral pathway. |

### 5.5 E5 — Supporting Healthy Living

**Regulation 9: Person-centred care**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `EFF_E5_Q01` | Do residents have access to healthcare professionals (GP, dentist, optician, chiropodist) as needed? | Care Home | yes_no_partial | 6 | 1.0 | `no` → **HIGH**: Residents lack access to healthcare professionals. |
| `EFF_E5_Q02` | Are health promotion activities or information provided? (e.g. immunisation, screening, healthy lifestyle) | Both | yes_no | 4 | 0.8 | `no` → **LOW**: No health promotion activities. |

### 5.6 E6 — Premises, Environment & Equipment

**Regulation 15: Premises and equipment**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `EFF_E6_Q01` | Are the premises accessible for people with disabilities and compliant with the Equality Act 2010? | Both | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: Premises accessibility issues. |
| `EFF_E6_Q02` | Is the clinical environment suitably designed for the treatments provided (e.g. ventilation, lighting, flooring, privacy)? | Aesthetic Clinic | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: Clinical environment not fit for purpose. |
| `EFF_E6_Q03` | Is the environment dementia-friendly with appropriate signage, lighting, and orientation aids? | Care Home | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: Environment not dementia-friendly. Conditional: only if dementia specialism selected. |

### 5.7 E7 — Consent

**Regulation 11: Need for consent**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `EFF_E7_Q01` | Do you have a consent policy that complies with current legislation? | Both | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: No consent policy. Reg 11 requirement. |
| `EFF_E7_Q02` | Is informed consent obtained and documented before every treatment or procedure? | Both | yes_no_partial | 10 | 1.5 | `no` → **CRITICAL**: Consent not consistently documented. |
| `EFF_E7_Q03` | Do you enforce a mandatory cooling-off period of at least 14 days for cosmetic procedures (as recommended by JCCP/RCS)? | Aesthetic Clinic | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: No cooling-off period enforced. Best practice for aesthetic procedures. |
| `EFF_E7_Q04` | Are Mental Capacity Act assessments carried out and documented when a person's capacity to consent is in doubt? | Care Home | yes_no_partial | 10 | 1.5 | `no` → **CRITICAL**: No MCA assessments. Legal requirement under MCA 2005. |
| `EFF_E7_Q05` | Are DoLS (Deprivation of Liberty Safeguards) applications made when necessary and are authorisations tracked? | Care Home | yes_no_partial | 10 | 1.5 | `no` → **CRITICAL**: DoLS not applied when required. Legal requirement. |
| `EFF_E7_Q06` | Do patients receive clear written information about treatment risks, alternatives, expected outcomes, and costs before consenting? | Aesthetic Clinic | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: Inadequate pre-treatment information provision. |

**EFFECTIVE Domain Totals:**
- Aesthetic Clinic: 14 questions, max ~128 weighted points
- Care Home: 15 questions, max ~130 weighted points

---

## 6. Complete Question Bank — CARING Domain

> **3 KLOEs** | C1: Kindness & Compassion · C2: Involvement in Decisions · C3: Privacy & Dignity

### 6.1 C1 — Kindness, Respect, Compassion & Emotional Support

**Regulation 10: Dignity and respect**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `CAR_C1_Q01` | Do you gather and act on feedback from people using your service about how they are treated? (e.g. satisfaction surveys, comments/compliments log) | Both | yes_no_partial | 8 | 1.2 | `no` → **MEDIUM**: No system for gathering patient/resident feedback. |
| `CAR_C1_Q02` | Do you have a system for recognising and addressing staff behaviours that do not meet the expected standards of kindness and respect? | Both | yes_no | 6 | 1.0 | `no` → **MEDIUM**: No system for addressing unkind behaviour. |
| `CAR_C1_Q03` | Are staff trained in communication skills, including communicating with people with sensory impairments, cognitive limitations, or those for whom English is not their first language? | Both | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: Staff not trained in inclusive communication. |
| `CAR_C1_Q04` | Do you have a chaperone policy and is a chaperone offered for all intimate examinations and procedures? | Aesthetic Clinic | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: No chaperone policy. Best practice requirement. |
| `CAR_C1_Q05` | Are residents supported to maintain relationships with family and friends, including flexible visiting arrangements? | Care Home | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: Visiting arrangements not flexible or welcoming. |
| `CAR_C1_Q06` | Are end-of-life care wishes discussed and documented sensitively, and is palliative care support accessible? | Care Home | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: End-of-life care planning not in place. |

### 6.2 C2 — Involvement in Care Decisions

**Regulation 9: Person-centred care · Regulation 10: Dignity and respect**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `CAR_C2_Q01` | Are people (and their families/carers where appropriate) actively involved in planning and reviewing their care or treatment? | Both | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: People not involved in their own care planning. |
| `CAR_C2_Q02` | Are people given accessible information about their care, treatment options, and any associated risks? | Both | yes_no_partial | 8 | 1.0 | `no` → **MEDIUM**: Information not provided in accessible format. |
| `CAR_C2_Q03` | Do you actively seek feedback from patients about their treatment outcomes (including follow-up satisfaction)? | Aesthetic Clinic | yes_no | 6 | 1.0 | `no` → **MEDIUM**: No post-treatment outcome feedback mechanism. |

### 6.3 C3 — Privacy, Dignity & Independence

**Regulation 10: Dignity and respect · Regulation 13: Safeguarding**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `CAR_C3_Q01` | Is personal care always provided in private, with doors closed and curtains drawn? | Both | yes_no | 8 | 1.2 | `no` → **HIGH**: Privacy not maintained during personal care. |
| `CAR_C3_Q02` | Are before/after photographs taken only with explicit consent and stored securely with restricted access? | Aesthetic Clinic | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: Photography consent and storage not compliant. |
| `CAR_C3_Q03` | Are residents encouraged and supported to maintain independence in daily activities? | Care Home | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: Independence not actively promoted. |
| `CAR_C3_Q04` | Are personal records stored securely and only accessible to authorised personnel? | Both | yes_no_partial | 6 | 1.0 | `no` → **HIGH**: Personal records not stored securely. Reg 17/GDPR requirement. |
| `CAR_C3_Q05` | Do residents have their own personal space that they can personalise? | Care Home | yes_no | 6 | 1.0 | `no` → **MEDIUM**: Residents cannot personalise their living space. |

**CARING Domain Totals:**
- Aesthetic Clinic: 8 questions, max ~72 weighted points
- Care Home: 9 questions, max ~72 weighted points

---

## 7. Complete Question Bank — RESPONSIVE Domain

> **3 KLOEs** | R1: Personalised Care · R2: Complaints · R3: End of Life (Care Home specific R3 replaces W-Led mapping)

### 7.1 R1 — Personalised Care & Meeting Individual Needs

**Regulation 9: Person-centred care**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `RES_R1_Q01` | Do care plans / treatment plans reflect the individual preferences, needs, and circumstances of each person? | Both | yes_no_partial | 10 | 1.5 | `no` → **HIGH**: Care/treatment plans not personalised. |
| `RES_R1_Q02` | Can people access the service at times that suit their needs? (e.g. flexible appointments, choice of treatment times) | Both | yes_no_partial | 6 | 1.0 | `no` → **LOW**: Service access not flexible. |
| `RES_R1_Q03` | Are cultural, religious, and spiritual needs assessed and accommodated? | Both | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: Cultural/religious needs not assessed. |
| `RES_R1_Q04` | Are people's communication needs identified and met (e.g. sensory aids, large print, interpreters, Accessible Information Standard)? | Both | yes_no_partial | 6 | 1.0 | `no` → **MEDIUM**: Communication needs not fully met. AIS requirement. |
| `RES_R1_Q05` | Is there a meaningful activities programme that reflects residents' interests and abilities? | Care Home | yes_no_partial | 8 | 1.2 | `no` → **MEDIUM**: No meaningful activities programme. |
| `RES_R1_Q06` | Do you provide treatment-specific patient information leaflets for all procedures? | Aesthetic Clinic | yes_no | 6 | 1.0 | `no` → **MEDIUM**: No patient information leaflets. |
| `RES_R1_Q07` | Do you accommodate walk-in emergencies and provide clear after-hours advice/contact details? | Aesthetic Clinic | yes_no | 4 | 0.8 | `no` → **LOW**: No after-hours contact provision. |

### 7.2 R2 — Complaints

**Regulation 16: Receiving and acting on complaints**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `RES_R2_Q01` | Do you have a written complaints policy that is accessible to all people using the service? | Both | yes_no_partial | 10 | 1.5 | `no` → **HIGH**: No complaints policy. Reg 16 requirement. |
| `RES_R2_Q02` | Are complaints acknowledged within 3 working days and responded to within 20 working days? | Both | yes_no_partial | 8 | 1.2 | `no` → **MEDIUM**: Complaints not responded to within expected timeframes. |
| `RES_R2_Q03` | Can you demonstrate that complaints have led to improvements in the service? | Both | yes_no_partial | 6 | 1.0 | `no` → **LOW**: No evidence of learning from complaints. |
| `RES_R2_Q04` | Are people informed of the right to escalate complaints to the Parliamentary and Health Service Ombudsman (or LGO for social care)? | Both | yes_no | 4 | 0.8 | `no` → **MEDIUM**: Escalation route not communicated. |

### 7.3 R3 — End of Life Care

**Regulation 9: Person-centred care**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `RES_R3_Q01` | Do you have an end-of-life care policy and do staff receive end-of-life training? | Care Home | yes_no_partial | 10 | 1.5 | `no` → **HIGH**: No end-of-life policy or training. |
| `RES_R3_Q02` | Are advance care plans / advance decisions / DNACPR forms in place where appropriate, and are they regularly reviewed? | Care Home | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: Advance care planning not in place. |
| `RES_R3_Q03` | Are pain assessment tools used for residents who cannot verbalise pain (e.g. Abbey Pain Scale)? | Care Home | yes_no | 6 | 1.0 | `no` → **MEDIUM**: No pain assessment tools for non-verbal residents. |
| `RES_R3_Q04` | Are families supported and involved during end-of-life care, including access to the home at any time? | Care Home | yes_no | 6 | 1.0 | `no` → **MEDIUM**: Families not supported during end-of-life. |

**RESPONSIVE Domain Totals:**
- Aesthetic Clinic: 8 questions, max ~66 weighted points
- Care Home: 12 questions, max ~104 weighted points

---

## 8. Complete Question Bank — WELL-LED Domain

> **6 KLOEs** | W1: Vision & Strategy · W2: Governance · W3: Culture · W4: Roles & Accountability · W5: Continuous Improvement · W6: Information Management

### 8.1 W1 — Vision, Strategy & Culture

**Regulation 17: Good governance**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `WEL_W1_Q01` | Do you have a current Statement of Purpose registered with CQC? | Both | yes_no | 10 | 1.5 | `no` → **CRITICAL**: No Statement of Purpose. Registration requirement. |
| `WEL_W1_Q02` | Is there a clear vision, mission, or set of values that is known to staff and reflected in daily practice? | Both | yes_no_partial | 6 | 1.0 | `no` → **LOW**: No documented vision or values. |
| `WEL_W1_Q03` | Do you have a service development plan or quality improvement plan for the next 12 months? | Both | yes_no | 6 | 1.0 | `no` → **MEDIUM**: No quality improvement plan. |

### 8.2 W2 — Governance, Risk Management & Quality Assurance

**Regulation 17: Good governance**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `WEL_W2_Q01` | Do you have a governance framework that includes regular management meetings, clinical governance reviews, and documented minutes? | Both | yes_no_partial | 10 | 1.5 | `no` → **HIGH**: No governance framework. Reg 17 requirement. |
| `WEL_W2_Q02` | Do you maintain a risk register that is reviewed and updated regularly? | Both | yes_no_partial | 8 | 1.2 | `no` → **MEDIUM**: No risk register. |
| `WEL_W2_Q03` | Are key performance indicators (KPIs) or quality metrics tracked and reviewed regularly? | Both | yes_no | 6 | 1.0 | `no` → **MEDIUM**: No KPI tracking. |
| `WEL_W2_Q04` | Are there systems to ensure CQC registration conditions are maintained (e.g. notifications submitted, registered manager in place, Statement of Purpose up to date)? | Both | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: CQC registration conditions not actively monitored. |

### 8.3 W3 — Open & Transparent Culture

**Regulation 17: Good governance · Regulation 20: Duty of candour**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `WEL_W3_Q01` | Do you have a whistleblowing / freedom to speak up policy and is it promoted to all staff? | Both | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: No whistleblowing policy. |
| `WEL_W3_Q02` | Are staff surveys or regular feedback mechanisms used to assess staff satisfaction and wellbeing? | Both | yes_no | 4 | 0.8 | `no` → **LOW**: No staff feedback mechanism. |
| `WEL_W3_Q03` | Do staff feel confident to raise concerns without fear of reprisal? | Both | scale (1-5) | 10 | 1.0 | Score ≤2 → **HIGH**: Staff do not feel safe to raise concerns. |

### 8.4 W4 — Roles, Responsibilities & Accountability

**Regulation 17: Good governance · Regulation 5: Fit and proper persons — directors**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `WEL_W4_Q01` | Is the registered manager (or nominated individual) fit and proper under Regulation 5 with documented DBS, qualifications, and character references? | Both | yes_no_partial | 10 | 1.5 | `no` → **CRITICAL**: Registered manager / nominated individual not assessed as fit and proper. |
| `WEL_W4_Q02` | Are roles and responsibilities clearly defined in job descriptions for all positions? | Both | yes_no_partial | 6 | 1.0 | `no` → **LOW**: Roles not clearly defined. |
| `WEL_W4_Q03` | Do you have a medical director or clinical lead responsible for clinical governance? | Aesthetic Clinic | yes_no | 8 | 1.2 | `no` → **HIGH**: No clinical lead responsible for clinical governance. |
| `WEL_W4_Q04` | Is there a clear management structure with deputies who can act in the manager's absence? | Care Home | yes_no | 6 | 1.0 | `no` → **MEDIUM**: No deputy arrangements. |

### 8.5 W5 — Continuous Improvement & Innovation

**Regulation 17: Good governance**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `WEL_W5_Q01` | Can you demonstrate actions taken in response to CQC inspection feedback, complaints, incidents, or audit findings? | Both | yes_no_partial | 8 | 1.2 | `no` → **MEDIUM**: No evidence of continuous improvement actions. |
| `WEL_W5_Q02` | Do you benchmark your service against others or use external quality frameworks? | Both | yes_no | 4 | 0.8 | `no` → **LOW**: No benchmarking or external quality frameworks. |
| `WEL_W5_Q03` | Do you engage with people who use the service, their families, and community organisations to improve the service? | Care Home | yes_no_partial | 6 | 1.0 | `no` → **LOW**: No community engagement for improvement. |

### 8.6 W6 — Information Management

**Regulation 17: Good governance (records)**

| ID | Question | Service Types | Answer Type | Max Pts | Weight | Gap Trigger |
|---|---|---|---|---|---|---|
| `WEL_W6_Q01` | Are you registered with the ICO (Information Commissioner's Office)? | Both | yes_no | 6 | 1.0 | `no` → **HIGH**: Not registered with ICO. Legal requirement. |
| `WEL_W6_Q02` | Do you have a data protection / GDPR policy and has a Data Protection Officer or Lead been designated? | Both | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: No data protection policy or DPO. |
| `WEL_W6_Q03` | Do you submit the NHS Data Security and Protection Toolkit (DSPT) annually (if applicable to your service)? | Both | yes_no_partial | 6 | 1.0 | `no`/`unsure` → **MEDIUM**: DSPT not submitted. Required for NHS work. |
| `WEL_W6_Q04` | Are clinical records complete, accurate, legible, and stored securely (physical and digital)? | Both | yes_no_partial | 8 | 1.2 | `no` → **HIGH**: Clinical records not maintained to required standard. |

**WELL-LED Domain Totals:**
- Aesthetic Clinic: 12 questions, max ~142 weighted points
- Care Home: 13 questions, max ~144 weighted points

---

## Complete Question Bank Summary

### All Questions by Domain — ID Quick Reference

```
SAFE (19/19)
├── S1: SAFE_S1_Q01–Q06  (6 questions — safeguarding)
├── S2: SAFE_S2_Q01–Q11  (9–11 questions — risk assessment)
├── S3: SAFE_S3_Q01–Q06  (4–6 questions — staffing)
├── S4: SAFE_S4_Q01–Q08  (5–8 questions — medicines)
├── S5: SAFE_S5_Q01–Q06  (4–6 questions — IPC)
└── S6: SAFE_S6_Q01–Q04  (4 questions — learning from incidents)

EFFECTIVE (14/15)
├── E1: EFF_E1_Q01–Q08   (5–8 questions — needs assessment)
├── E2: EFF_E2_Q01–Q07   (6–7 questions — staff skills)
├── E3: EFF_E3_Q01–Q05   (0–5 questions — nutrition, care home only)
├── E4: EFF_E4_Q01–Q03   (2–3 questions — MDT working)
├── E5: EFF_E5_Q01–Q02   (1–2 questions — healthy living)
├── E6: EFF_E6_Q01–Q03   (2–3 questions — premises)
└── E7: EFF_E7_Q01–Q06   (3–6 questions — consent)

CARING (8/9)
├── C1: CAR_C1_Q01–Q06   (3–6 questions — kindness & compassion)
├── C2: CAR_C2_Q01–Q03   (2–3 questions — involvement in decisions)
└── C3: CAR_C3_Q01–Q05   (3–5 questions — privacy & dignity)

RESPONSIVE (8/12)
├── R1: RES_R1_Q01–Q07   (5–7 questions — personalised care)
├── R2: RES_R2_Q01–Q04   (4 questions — complaints)
└── R3: RES_R3_Q01–Q04   (0–4 questions — end of life, care home only)

WELL-LED (12/13)
├── W1: WEL_W1_Q01–Q03   (3 questions — vision & strategy)
├── W2: WEL_W2_Q01–Q04   (4 questions — governance)
├── W3: WEL_W3_Q01–Q03   (3 questions — culture)
├── W4: WEL_W4_Q01–Q04   (3–4 questions — roles & accountability)
├── W5: WEL_W5_Q01–Q03   (2–3 questions — continuous improvement)
└── W6: WEL_W6_Q01–Q04   (4 questions — information management)
```

### Gap Severity Distribution Across All Questions

| Severity | Count | % of Questions | Description |
|---|---|---|---|
| CRITICAL | 16 | ~13% | Immediate enforcement risk. Caps domain at RI. |
| HIGH | 29 | ~24% | Significant shortfall. Prevents Good rating. |
| MEDIUM | 25 | ~20% | Should address within 30 days. May prevent Outstanding. |
| LOW | 7 | ~6% | Improvement opportunity. Best practice. |
| No gap trigger | 44 | ~36% | Positive answers only (e.g. text fields, lower-weight items) |

---

## 9. Question Filtering & Conditional Logic

### 9.1 Service Type Filtering

The primary filter. When a user selects their service type in Step 1, only applicable questions are shown.

```typescript
// lib/assessment/question-filter.ts

export function getQuestionsForServiceType(
  allQuestions: AssessmentQuestion[],
  serviceType: ServiceType,
): AssessmentQuestion[] {
  return allQuestions.filter(q => q.serviceTypes.includes(serviceType))
}

// Example:
// Service type: AESTHETIC_CLINIC
// SAFE_S2_Q06 (PEEPs — Care Home only) → EXCLUDED
// SAFE_S4_Q03 (Prescribing arrangements — Clinic only) → INCLUDED
// SAFE_S1_Q01 (Safeguarding policy — Both) → INCLUDED
```

### 9.2 Conditional Questions

Some questions only appear based on previous answers. This prevents asking irrelevant questions.

```typescript
// Conditional rules defined per question:
conditionalOn?: {
  questionId: string
  operator: 'equals' | 'includes' | 'not_equals'
  value: string | string[]
}
```

**Active Conditional Rules:**

| Question | Condition | Logic |
|---|---|---|
| `SAFE_S2_Q10` (Ligature risk) | Care Home AND specialities include `dementia` or `mental_health` | Only show if org specialities array includes relevant values |
| `SAFE_S2_Q11` (Bed rail risk) | Care Home | Always show for care homes (filtered by serviceType) |
| `SAFE_S5_Q06` (Autoclave) | Aesthetic Clinic AND uses reusable instruments | Conditional on Step 2 specialism indicating invasive procedures |
| `EFF_E3_Q01`–`Q05` (Nutrition) | Care Home only | Entire section excluded for clinics (filtered by serviceType) |
| `EFF_E6_Q03` (Dementia-friendly) | Care Home AND specialities include `dementia` | Conditional on specialism |
| `RES_R3_Q01`–`Q04` (End of life) | Care Home only | Entire section excluded for clinics |

### 9.3 Conditional Evaluation

```typescript
export function shouldShowQuestion(
  question: AssessmentQuestion,
  existingAnswers: Map<string, AssessmentAnswer>,
  organization: { serviceType: ServiceType; specialties: string[] },
): boolean {
  // 1. Service type filter
  if (!question.serviceTypes.includes(organization.serviceType)) return false

  // 2. Conditional on another question's answer
  if (question.conditionalOn) {
    const { questionId, operator, value } = question.conditionalOn
    const answer = existingAnswers.get(questionId)

    if (!answer) return false  // Dependent question not yet answered — hide

    switch (operator) {
      case 'equals':
        return answer.answerValue === value
      case 'not_equals':
        return answer.answerValue !== value
      case 'includes':
        const answerArray = Array.isArray(answer.answerValue)
          ? answer.answerValue
          : [answer.answerValue]
        const checkValues = Array.isArray(value) ? value : [value]
        return checkValues.some(v => answerArray.includes(v))
    }
  }

  return true  // No conditions — always show
}
```

---

## 10. Answer Processing & Persistence

### 10.1 Answer Save Flow

```
USER CHANGES AN ANSWER
    │
    ▼  (debounce 500ms)
CLIENT: Batch answers for current domain
    │
    ▼
POST /api/assessment { assessmentId, step: 3, answers: [...] }
    │
    ▼
SERVER: Validate answers against question definitions
    │
    ├── For each answer:
    │   ├── Resolve question definition from ASSESSMENT_QUESTIONS
    │   ├── Validate answerValue matches expected answerType
    │   ├── Calculate score: scoring.scoringMap[answerValue] × weight
    │   ├── Determine if gap is triggered
    │   └── Upsert AssessmentAnswer record (@@unique [assessmentId, questionId])
    │
    ├── Update Assessment.currentStep = max(currentStep, step)
    └── Return { saved: true, answersProcessed: N }
```

### 10.2 Answer Scoring Logic

```typescript
// lib/assessment/answer-scorer.ts

export function scoreAnswer(
  question: AssessmentQuestion,
  answerValue: unknown,
): { score: number; maxScore: number; createsGap: boolean; gapSeverity: GapSeverity | null } {

  const { scoring, weight, gapTrigger } = question
  let rawScore = 0

  switch (question.answerType) {
    case 'yes_no':
    case 'yes_no_partial':
      const strValue = String(answerValue)
      rawScore = scoring.scoringMap[strValue] ?? 0
      break

    case 'multi_select':
      // Sum points for each selected option
      const selected = Array.isArray(answerValue) ? answerValue : []
      const options = question.options || []
      rawScore = selected.reduce((sum, val) => {
        const opt = options.find(o => o.value === val)
        return sum + (opt?.points ?? 0)
      }, 0)
      break

    case 'scale':
      const numValue = Number(answerValue)
      rawScore = numValue * 2  // Scale 1-5 → 2-10 points
      break

    case 'date':
      // Score based on how recent the date is
      rawScore = scoreDateRecency(answerValue as string, scoring.maxPoints)
      break

    case 'number':
      // Score based on thresholds defined in scoringMap
      rawScore = scoreNumberThreshold(Number(answerValue), scoring.scoringMap)
      break

    case 'text':
      rawScore = 0  // Text answers are context only, never scored
      break
  }

  const weightedMax = scoring.maxPoints * weight
  const weightedScore = rawScore * weight

  // Check gap trigger
  let createsGap = false
  let gapSeverity: GapSeverity | null = null

  if (gapTrigger) {
    const checkValue = String(answerValue)
    if (gapTrigger.triggerValues.includes(checkValue)) {
      createsGap = true
      gapSeverity = gapTrigger.severity
    }
    // Special: multi_select gap trigger based on total score
    if (question.answerType === 'multi_select' && rawScore < (scoring.maxPoints / 2)) {
      createsGap = true
      gapSeverity = gapTrigger.severity
    }
  }

  return { score: weightedScore, maxScore: weightedMax, createsGap, gapSeverity }
}

function scoreDateRecency(dateStr: string, maxPoints: number): number {
  if (!dateStr) return 0
  const date = new Date(dateStr)
  const daysSince = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (daysSince < 365) return maxPoints
  if (daysSince < 730) return maxPoints * 0.5
  return 0
}

function scoreNumberThreshold(value: number, scoringMap: Record<string, number>): number {
  // scoringMap keys are threshold strings: ">=10": 10, ">=5": 6, "<5": 2
  const entries = Object.entries(scoringMap).sort((a, b) => b[1] - a[1])
  for (const [threshold, points] of entries) {
    if (threshold.startsWith('>=') && value >= parseInt(threshold.slice(2))) return points
    if (threshold.startsWith('<') && value < parseInt(threshold.slice(1))) return points
  }
  return 0
}
```

### 10.3 Answer Persistence (Database)

```typescript
// In AssessmentService.saveAnswers()

for (const answer of answers) {
  const question = getQuestionById(answer.questionId)
  if (!question) continue

  const { score, maxScore, createsGap, gapSeverity } = scoreAnswer(question, answer.value)

  await db.assessmentAnswer.upsert({
    where: {
      assessmentId_questionId: {
        assessmentId,
        questionId: answer.questionId,
      },
    },
    create: {
      assessmentId,
      questionId: answer.questionId,
      questionText: question.text,
      step: question.step,
      domain: question.domain,
      kloeCode: question.kloeCode,
      answerValue: answer.value,
      answerType: question.answerType,
      score,
      maxScore,
      weight: question.weight,
      createsGap,
      gapSeverity,
    },
    update: {
      answerValue: answer.value,
      score,
      maxScore,
      createsGap,
      gapSeverity,
      answeredAt: new Date(),
    },
  })
}
```

---

## 11. Scoring Engine — Step-by-Step Pipeline

### 11.1 Score Calculation Pipeline

The scoring engine runs when:
- User clicks "Calculate" on Step 4 of onboarding (`POST /api/assessment/calculate`)
- Recalculation triggered by evidence/policy/training changes
- Weekly cron job

```typescript
// lib/compliance/scoring-engine.ts

export interface ScoringResult {
  overallScore: number                   // 0–100
  predictedRating: CqcRating            // OUTSTANDING | GOOD | REQUIRES_IMPROVEMENT | INADEQUATE
  ratingConfidence: number              // 0.0–1.0
  hasCriticalGap: boolean
  domainScores: DomainScoreResult[]
  totalGaps: number
  gapsBySeverity: Record<GapSeverity, number>
  estimatedTimeToGood: number | null    // Days estimate, null if already Good+
}

export interface DomainScoreResult {
  domain: CqcDomainType
  rawScore: number                      // Sum of weighted points earned
  maxScore: number                      // Sum of weighted max possible points
  percentage: number                    // Adjusted percentage (0–100)
  predictedRating: CqcRating
  gapCount: number
  criticalGapPresent: boolean
  evidenceQualityFactor: number         // 0.5–1.0
  timelinessFactor: number              // 0.5–1.0
  kloeBreakdown: KloeScoreResult[]      // Per-KLOE detail
}

export interface KloeScoreResult {
  kloeCode: string
  title: string
  rawScore: number
  maxScore: number
  percentage: number
  gapCount: number
  questionCount: number
  answeredCount: number
}
```

### 11.2 Step-by-Step Pipeline

```typescript
export function calculateComplianceScore(
  assessment: Assessment,
  answers: AssessmentAnswer[],
  serviceType: ServiceType,
  evidenceItems: Evidence[],
  policies: Policy[],
  staffMembers: StaffMember[],
  trainingRecords: TrainingRecord[],
  existingGaps: ComplianceGap[],
): ScoringResult {

  // ─── STEP 1: Get applicable questions for service type ───
  const applicableQuestions = getQuestionsForServiceType(ALL_QUESTIONS, serviceType)
  const answerMap = new Map(answers.map(a => [a.questionId, a]))

  // ─── STEP 2: Calculate per-KLOE scores ───
  const kloeScores = new Map<string, KloeScoreResult>()

  for (const question of applicableQuestions) {
    const kloe = question.kloeCode
    if (!kloeScores.has(kloe)) {
      kloeScores.set(kloe, {
        kloeCode: kloe,
        title: getKloeTitle(kloe),
        rawScore: 0, maxScore: 0, percentage: 0,
        gapCount: 0, questionCount: 0, answeredCount: 0,
      })
    }

    const kloeResult = kloeScores.get(kloe)!
    kloeResult.questionCount++
    kloeResult.maxScore += question.scoring.maxPoints * question.weight

    const answer = answerMap.get(question.id)
    if (answer) {
      kloeResult.answeredCount++
      kloeResult.rawScore += answer.score ?? 0
      if (answer.createsGap) kloeResult.gapCount++
    }
    // Unanswered questions score 0 — they drag down the percentage
  }

  // Calculate KLOE percentages
  for (const ksr of kloeScores.values()) {
    ksr.percentage = ksr.maxScore > 0 ? (ksr.rawScore / ksr.maxScore) * 100 : 0
  }

  // ─── STEP 3: Aggregate per-domain scores ───
  const domains: CqcDomainType[] = ['SAFE', 'EFFECTIVE', 'CARING', 'RESPONSIVE', 'WELL_LED']
  const domainScores: DomainScoreResult[] = []

  for (const domain of domains) {
    const domainKloes = [...kloeScores.values()].filter(k =>
      getKloeDomain(k.kloeCode) === domain
    )

    const rawScore = domainKloes.reduce((sum, k) => sum + k.rawScore, 0)
    const maxScore = domainKloes.reduce((sum, k) => sum + k.maxScore, 0)
    const rawPercentage = maxScore > 0 ? (rawScore / maxScore) * 100 : 0

    domainScores.push({
      domain,
      rawScore,
      maxScore,
      percentage: rawPercentage,    // Will be adjusted in Steps 4-5
      predictedRating: 'INADEQUATE', // Will be set in Step 6
      gapCount: domainKloes.reduce((sum, k) => sum + k.gapCount, 0),
      criticalGapPresent: false,    // Will be set in Step 6
      evidenceQualityFactor: 1.0,   // Will be calculated in Step 4
      timelinessFactor: 1.0,        // Will be calculated in Step 5
      kloeBreakdown: domainKloes,
    })
  }

  // ─── STEP 4: Apply evidence quality factor ───
  for (const ds of domainScores) {
    ds.evidenceQualityFactor = calculateEvidenceQuality(ds.domain, evidenceItems, policies)
  }

  // ─── STEP 5: Apply timeliness factor ───
  for (const ds of domainScores) {
    ds.timelinessFactor = calculateTimeliness(ds.domain, evidenceItems, trainingRecords, staffMembers)
  }

  // ─── STEP 6: Calculate adjusted percentages and domain ratings ───
  for (const ds of domainScores) {
    // Adjusted percentage = raw × evidence quality × timeliness
    ds.percentage = Math.round(
      (ds.percentage * ds.evidenceQualityFactor * ds.timelinessFactor) * 10
    ) / 10

    // Clamp to 0–100
    ds.percentage = Math.max(0, Math.min(100, ds.percentage))

    // Convert percentage to rating
    ds.predictedRating = percentageToRating(ds.percentage)

    // CRITICAL LIMITER: Any unresolved critical gap caps domain at RI
    const domainGaps = existingGaps.filter(g =>
      g.domain === ds.domain && g.status !== 'RESOLVED' && g.status !== 'NOT_APPLICABLE'
    )
    ds.criticalGapPresent = domainGaps.some(g => g.severity === 'CRITICAL')

    if (ds.criticalGapPresent) {
      if (ds.predictedRating === 'OUTSTANDING' || ds.predictedRating === 'GOOD') {
        ds.predictedRating = 'REQUIRES_IMPROVEMENT'
      }
    }
  }

  // ─── STEP 7: Calculate overall score (weighted average) ───
  const DOMAIN_WEIGHTS: Record<CqcDomainType, number> = {
    SAFE: 1.0,
    EFFECTIVE: 1.0,
    CARING: 1.0,
    RESPONSIVE: 1.0,
    WELL_LED: 1.0,
  }
  // NOTE: CQC weights all domains equally. We keep this configurable for future tuning.

  const totalWeight = Object.values(DOMAIN_WEIGHTS).reduce((a, b) => a + b, 0)
  const weightedSum = domainScores.reduce((sum, ds) => {
    return sum + (ds.percentage * DOMAIN_WEIGHTS[ds.domain])
  }, 0)

  const overallScore = Math.round((weightedSum / totalWeight) * 10) / 10

  // ─── STEP 8: Determine overall predicted rating ───
  const hasCriticalGap = domainScores.some(ds => ds.criticalGapPresent)
  const predictedRating = determineOverallRating(domainScores)

  // ─── STEP 9: Calculate confidence ───
  const ratingConfidence = calculateConfidence(answers, evidenceItems, applicableQuestions)

  // ─── STEP 10: Calculate time-to-Good estimate ───
  const estimatedTimeToGood = calculateTimeToGood(domainScores, existingGaps)

  // ─── STEP 11: Aggregate gap counts ───
  const allGaps = existingGaps.filter(g => g.status !== 'RESOLVED' && g.status !== 'NOT_APPLICABLE')
  const gapsBySeverity = {
    CRITICAL: allGaps.filter(g => g.severity === 'CRITICAL').length,
    HIGH: allGaps.filter(g => g.severity === 'HIGH').length,
    MEDIUM: allGaps.filter(g => g.severity === 'MEDIUM').length,
    LOW: allGaps.filter(g => g.severity === 'LOW').length,
  }

  return {
    overallScore,
    predictedRating,
    ratingConfidence,
    hasCriticalGap,
    domainScores,
    totalGaps: allGaps.length,
    gapsBySeverity,
    estimatedTimeToGood,
  }
}
```

### 11.3 Rating Thresholds

```typescript
export function percentageToRating(percentage: number): CqcRating {
  if (percentage >= 88) return 'OUTSTANDING'
  if (percentage >= 63) return 'GOOD'
  if (percentage >= 39) return 'REQUIRES_IMPROVEMENT'
  return 'INADEQUATE'
}

export const RATING_THRESHOLDS = {
  OUTSTANDING:          { min: 88, max: 100, color: '#10b981', label: 'Outstanding',          icon: 'Star' },
  GOOD:                 { min: 63, max: 87,  color: '#3b82f6', label: 'Good',                 icon: 'CheckCircle' },
  REQUIRES_IMPROVEMENT: { min: 39, max: 62,  color: '#f59e0b', label: 'Requires Improvement', icon: 'AlertTriangle' },
  INADEQUATE:           { min: 0,  max: 38,  color: '#ef4444', label: 'Inadequate',           icon: 'XCircle' },
} as const
```

---

## 12. Evidence Quality & Timeliness Factors

### 12.1 Evidence Quality Factor (0.5–1.0)

This factor adjusts domain scores based on how well the evidence library supports the self-assessment answers. A domain with strong self-assessment answers but no uploaded evidence gets penalised.

```typescript
export function calculateEvidenceQuality(
  domain: CqcDomainType,
  evidence: Evidence[],
  policies: Policy[],
): number {
  // Get domain-linked evidence (CURRENT or EXPIRING_SOON, not deleted)
  const domainEvidence = evidence.filter(e =>
    e.linkedDomains?.includes(domain) && e.deletedAt === null
  )
  const domainPolicies = policies.filter(p =>
    p.linkedDomains?.includes(domain) && p.status === 'PUBLISHED' && p.deletedAt === null
  )

  const totalItems = domainEvidence.length + domainPolicies.length

  if (totalItems === 0) return 0.5  // No evidence = 50% credit (penalises empty libraries)

  let qualitySum = 0

  for (const item of domainEvidence) {
    let itemQuality = 0.5  // Base score

    if (item.status === 'CURRENT') itemQuality += 0.3
    else if (item.status === 'EXPIRING_SOON') itemQuality += 0.15
    // EXPIRED = 0 bonus

    if (item.linkedKloes && item.linkedKloes.length > 0) itemQuality += 0.1
    if (item.lastReviewedAt && daysSince(item.lastReviewedAt) < 365) itemQuality += 0.1

    qualitySum += Math.min(itemQuality, 1.0)
  }

  for (const policy of domainPolicies) {
    let policyQuality = 0.7  // Published policies start higher
    if (policy.reviewDate && new Date(policy.reviewDate) > new Date()) policyQuality += 0.2
    if (policy.linkedKloes && policy.linkedKloes.length > 0) policyQuality += 0.1
    qualitySum += Math.min(policyQuality, 1.0)
  }

  return Math.max(0.5, Math.min(1.0, qualitySum / totalItems))
}
```

### 12.2 Timeliness Factor (0.5–1.0)

Penalises domains where evidence is expired or staff training/registrations are overdue.

```typescript
export function calculateTimeliness(
  domain: CqcDomainType,
  evidence: Evidence[],
  trainingRecords: TrainingRecord[],
  staffMembers: StaffMember[],
): number {
  let factors: number[] = []

  // Evidence timeliness
  const domainEvidence = evidence.filter(e => e.linkedDomains?.includes(domain))
  for (const item of domainEvidence) {
    if (!item.validUntil) { factors.push(0.8); continue }
    const daysUntil = differenceInDays(item.validUntil, new Date())
    if (daysUntil > 90)       factors.push(1.0)
    else if (daysUntil > 30)  factors.push(0.8)
    else if (daysUntil > 0)   factors.push(0.6)
    else if (daysUntil > -30) factors.push(0.3)
    else                      factors.push(0.1)
  }

  // Staff registration timeliness (relevant for SAFE and EFFECTIVE)
  if (domain === 'SAFE' || domain === 'EFFECTIVE') {
    for (const staff of staffMembers.filter(s => s.isActive)) {
      if (!staff.registrationExpiry) continue
      const daysUntil = differenceInDays(staff.registrationExpiry, new Date())
      if (daysUntil > 90)       factors.push(1.0)
      else if (daysUntil > 30)  factors.push(0.7)
      else if (daysUntil > 0)   factors.push(0.4)
      else                      factors.push(0.1)  // Expired registration = severe penalty
    }
  }

  // Training timeliness (relevant for SAFE and EFFECTIVE)
  if (domain === 'SAFE' || domain === 'EFFECTIVE') {
    for (const record of trainingRecords) {
      if (!record.expiryDate) continue
      const daysUntil = differenceInDays(record.expiryDate, new Date())
      if (daysUntil > 90)       factors.push(1.0)
      else if (daysUntil > 30)  factors.push(0.8)
      else if (daysUntil > 0)   factors.push(0.5)
      else                      factors.push(0.2)
    }
  }

  if (factors.length === 0) return 0.7  // No time-bound items = neutral-ish
  const avg = factors.reduce((a, b) => a + b, 0) / factors.length
  return Math.max(0.5, Math.min(1.0, avg))
}
```

### 12.3 Confidence Calculation

```typescript
export function calculateConfidence(
  answers: AssessmentAnswer[],
  evidence: Evidence[],
  applicableQuestions: AssessmentQuestion[],
): number {
  // Factor 1: Question coverage (0–0.4)
  const answeredCertainly = answers.filter(a =>
    a.answerValue !== 'unsure' && a.answerValue !== null && a.answerValue !== ''
  ).length
  const questionCoverage = answeredCertainly / Math.max(applicableQuestions.length, 1)
  const questionFactor = Math.min(questionCoverage, 1.0) * 0.4

  // Factor 2: Evidence coverage (0–0.4)
  const expectedEvidenceCount = applicableQuestions.length * 0.6  // Expect ~60% questions to have evidence
  const currentEvidence = evidence.filter(e => e.status === 'CURRENT').length
  const evidenceCoverage = Math.min(currentEvidence / Math.max(expectedEvidenceCount, 1), 1.0)
  const evidenceFactor = evidenceCoverage * 0.4

  // Factor 3: Assessment recency (0–0.2)
  const latestAnswer = answers.sort((a, b) =>
    new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime()
  )[0]
  const daysSinceAssessment = latestAnswer
    ? Math.floor((Date.now() - new Date(latestAnswer.answeredAt).getTime()) / 86400000)
    : 365
  const recencyFactor =
    daysSinceAssessment < 30 ? 0.2 :
    daysSinceAssessment < 90 ? 0.15 :
    daysSinceAssessment < 180 ? 0.1 : 0.05

  return Math.min(questionFactor + evidenceFactor + recencyFactor, 1.0)
}
```

### 12.4 Time-to-Good Estimate

```typescript
export function calculateTimeToGood(
  domainScores: DomainScoreResult[],
  gaps: ComplianceGap[],
): number | null {
  // Already Good or above
  if (domainScores.every(ds =>
    ds.predictedRating === 'GOOD' || ds.predictedRating === 'OUTSTANDING'
  )) return null

  let totalDays = 0

  const openGaps = gaps.filter(g => g.status !== 'RESOLVED' && g.status !== 'NOT_APPLICABLE')

  for (const gap of openGaps) {
    switch (gap.severity) {
      case 'CRITICAL': totalDays += 3; break    // Immediate action, resolve within days
      case 'HIGH':     totalDays += 14; break   // 1-2 weeks
      case 'MEDIUM':   totalDays += 30; break   // 2-4 weeks
      case 'LOW':      totalDays += 0; break    // Not blocking Good rating
    }
  }

  // Add buffer for evidence gathering and implementation
  return Math.max(totalDays, 14)  // Minimum 2 weeks even for a single gap
}
```

---

## 13. Rating Prediction Engine

### 13.1 Overall Rating Determination

This mirrors how CQC actually aggregates domain ratings into an overall rating. The rules are based on CQC's published aggregation methodology.

```typescript
export function determineOverallRating(domainScores: DomainScoreResult[]): CqcRating {
  const ratings = domainScores.map(ds => ds.predictedRating)

  const count = (rating: CqcRating) => ratings.filter(r => r === rating).length

  const inadequateCount = count('INADEQUATE')
  const riCount = count('REQUIRES_IMPROVEMENT')
  const goodCount = count('GOOD')
  const outstandingCount = count('OUTSTANDING')

  // ─── RULE 1: Any Inadequate domain ───
  // If ANY domain is Inadequate, overall cannot be better than RI
  if (inadequateCount > 0) {
    // If 2+ domains Inadequate, overall is Inadequate
    if (inadequateCount >= 2) return 'INADEQUATE'
    // If only 1 domain Inadequate, overall is RI (with Inadequate domain noted)
    return 'REQUIRES_IMPROVEMENT'
  }

  // ─── RULE 2: Multiple RI domains ───
  // If 2+ domains are RI, overall is RI
  if (riCount >= 2) {
    return 'REQUIRES_IMPROVEMENT'
  }

  // ─── RULE 3: Outstanding requires excellence ───
  // All domains must be Good+, AND at least 2 must be Outstanding
  if (outstandingCount >= 2 && (goodCount + outstandingCount) === 5) {
    return 'OUTSTANDING'
  }

  // ─── RULE 4: Good requires broad competence ───
  // All domains at least Good (with max 1 RI domain compensated)
  if ((goodCount + outstandingCount) === 5) {
    return 'GOOD'
  }

  // ─── RULE 5: Single RI domain can still allow Good overall ───
  if (riCount === 1) {
    const riDomain = domainScores.find(ds => ds.predictedRating === 'REQUIRES_IMPROVEMENT')
    // If the RI domain is close to Good threshold (55%+) and has no critical gaps
    if (riDomain && riDomain.percentage >= 55 && !riDomain.criticalGapPresent) {
      return 'GOOD'
    }
  }

  // ─── DEFAULT: Requires Improvement ───
  return 'REQUIRES_IMPROVEMENT'
}
```

### 13.2 Rating Determination Decision Tree

```
START
  │
  ├── Any domain INADEQUATE?
  │   ├── YES → 2+ domains INADEQUATE?
  │   │         ├── YES → Overall: INADEQUATE
  │   │         └── NO  → Overall: REQUIRES IMPROVEMENT
  │   │
  │   └── NO → Continue
  │
  ├── 2+ domains REQUIRES IMPROVEMENT?
  │   ├── YES → Overall: REQUIRES IMPROVEMENT
  │   └── NO  → Continue
  │
  ├── All domains GOOD or OUTSTANDING?
  │   ├── YES → 2+ domains OUTSTANDING?
  │   │         ├── YES → Overall: OUTSTANDING
  │   │         └── NO  → Overall: GOOD
  │   │
  │   └── NO → Continue (must have exactly 1 RI domain)
  │
  ├── Exactly 1 domain RI?
  │   ├── RI domain ≥55% AND no critical gaps?
  │   │   ├── YES → Overall: GOOD (borderline, flag to user)
  │   │   └── NO  → Overall: REQUIRES IMPROVEMENT
  │   │
  │   └── Should not reach here (covered above)
  │
  └── DEFAULT → Overall: REQUIRES IMPROVEMENT
```

### 13.3 Rating Limiters (Critical Rules)

| Limiter | Rule | Rationale |
|---|---|---|
| Critical gap limiter | Any unresolved CRITICAL gap caps its domain at RI | CQC would not rate a domain as Good if a critical safety issue exists |
| Inadequate domain limiter | Any Inadequate domain caps overall at RI | CQC overall rating cannot exceed RI if any domain is Inadequate |
| Double RI limiter | 2+ RI domains caps overall at RI | Broad compliance weakness prevents Good overall |
| Outstanding threshold | Need 2+ Outstanding domains for Outstanding overall | Outstanding requires demonstrated excellence, not just adequacy |
| Compensation rule | 1 RI domain (≥55%, no critical gaps) can be compensated by 4 Good+ domains | Reflects CQC practice of considering borderline cases |

---

## 14. Gap Identification & Auto-Generation

### 14.1 Gap Sources

Gaps are identified from three sources:

| Source | When | How |
|---|---|---|
| **Assessment answers** | During initial assessment or re-assessment | Answers matching `gapTrigger.triggerValues` auto-create gaps |
| **Evidence monitoring** | Ongoing (daily cron + event-triggered) | Expired evidence, expired training, expired staff registrations |
| **Manual identification** | User-created | MANAGER+ can manually create gaps from inspection feedback or audits |

### 14.2 Assessment-Driven Gap Generation

```typescript
export function generateGapsFromAssessment(
  answers: AssessmentAnswer[],
  serviceType: ServiceType,
  organizationId: string,
): NewGap[] {
  const gaps: NewGap[] = []

  for (const answer of answers) {
    if (!answer.createsGap || !answer.gapSeverity) continue

    const question = getQuestionById(answer.questionId)
    if (!question?.gapTrigger) continue

    const gt = question.gapTrigger

    gaps.push({
      organizationId,
      domain: question.domain,
      kloeCode: question.kloeCode,
      regulationCode: gt.linkedRegulations[0] || null,
      title: gt.gapTitle,
      description: gt.gapDescription,
      severity: gt.severity,
      status: 'OPEN',
      source: 'ASSESSMENT',
      sourceQuestionId: question.id,
      remediationSteps: buildRemediationSteps(gt),
      estimatedEffort: estimateEffort(gt.severity),
      dueDate: calculateDueDate(gt.severity),
    })
  }

  return gaps
}

function calculateDueDate(severity: GapSeverity): Date {
  const now = new Date()
  switch (severity) {
    case 'CRITICAL': return addDays(now, 1)    // Immediate — due tomorrow
    case 'HIGH':     return addDays(now, 7)    // Due within 1 week
    case 'MEDIUM':   return addDays(now, 30)   // Due within 1 month
    case 'LOW':      return addDays(now, 90)   // Due within 3 months
  }
}

function estimateEffort(severity: GapSeverity): string {
  switch (severity) {
    case 'CRITICAL': return '1–3 days'
    case 'HIGH':     return '1–2 weeks'
    case 'MEDIUM':   return '2–4 weeks'
    case 'LOW':      return '1–3 months'
  }
}

function buildRemediationSteps(trigger: GapTriggerConfig): RemediationSteps {
  // If a remediation template is specified, use it
  if (trigger.remediationTemplate && REMEDIATION_TEMPLATES[trigger.remediationTemplate]) {
    return REMEDIATION_TEMPLATES[trigger.remediationTemplate]
  }

  // Otherwise, use the hint as the first immediate step
  return {
    immediate: [trigger.remediationHint],
    shortTerm: [],
    evidence: [],
  }
}
```

### 14.3 Evidence-Driven Gap Detection (Cron)

The daily cron job at 6 AM UTC scans for compliance deterioration:

```typescript
export function detectEvidenceGaps(
  evidence: Evidence[],
  policies: Policy[],
  staffMembers: StaffMember[],
  trainingRecords: TrainingRecord[],
  existingGaps: ComplianceGap[],
  organizationId: string,
): NewGap[] {
  const newGaps: NewGap[] = []
  const existingGapKeys = new Set(existingGaps.map(g => `${g.source}_${g.sourceQuestionId}`))

  // 1. Expired evidence
  for (const item of evidence) {
    if (item.status !== 'EXPIRED' || item.deletedAt) continue
    const key = `EVIDENCE_EXPIRY_${item.id}`
    if (existingGapKeys.has(key)) continue  // Already flagged

    newGaps.push({
      organizationId,
      domain: item.linkedDomains?.[0] || 'WELL_LED',
      title: `Expired evidence: ${item.title}`,
      description: `Evidence item "${item.title}" expired on ${item.validUntil}. This may affect compliance in the ${item.linkedDomains?.join(', ')} domain(s).`,
      severity: item.category === 'CERTIFICATE' ? 'HIGH' : 'MEDIUM',
      status: 'OPEN',
      source: 'EVIDENCE_EXPIRY',
      sourceQuestionId: item.id,
    })
  }

  // 2. Expired staff registrations
  for (const staff of staffMembers) {
    if (!staff.isActive || !staff.registrationExpiry) continue
    if (new Date(staff.registrationExpiry) > new Date()) continue
    const key = `STAFF_REG_EXPIRY_${staff.id}`
    if (existingGapKeys.has(key)) continue

    newGaps.push({
      organizationId,
      domain: 'SAFE',
      kloeCode: 'S3',
      title: `Expired registration: ${staff.firstName} ${staff.lastName}`,
      description: `${staff.firstName} ${staff.lastName}'s professional registration expired on ${staff.registrationExpiry}. Staff must not practice without valid registration.`,
      severity: 'CRITICAL',
      status: 'OPEN',
      source: 'STAFF_REG_EXPIRY',
      sourceQuestionId: staff.id,
    })
  }

  // 3. Expired mandatory training
  for (const record of trainingRecords) {
    if (!record.expiryDate) continue
    if (new Date(record.expiryDate) > new Date()) continue
    const key = `TRAINING_EXPIRY_${record.id}`
    if (existingGapKeys.has(key)) continue

    const isMandatory = ['SAFEGUARDING', 'FIRE_SAFETY', 'BLS_ILS', 'MANUAL_HANDLING', 'IPC']
      .includes(record.category)

    newGaps.push({
      organizationId,
      domain: record.category === 'SAFEGUARDING' ? 'SAFE' : 'EFFECTIVE',
      kloeCode: record.category === 'SAFEGUARDING' ? 'S1' : 'E2',
      title: `Expired training: ${record.courseName} — ${record.staffMember?.firstName} ${record.staffMember?.lastName}`,
      description: `Training "${record.courseName}" for ${record.staffMember?.firstName} expired on ${record.expiryDate}.`,
      severity: isMandatory ? 'HIGH' : 'MEDIUM',
      status: 'OPEN',
      source: 'TRAINING_EXPIRY',
      sourceQuestionId: record.id,
    })
  }

  // 4. Policies overdue for review
  for (const policy of policies) {
    if (!policy.reviewDate || policy.deletedAt) continue
    if (new Date(policy.reviewDate) > new Date()) continue
    if (policy.status !== 'PUBLISHED') continue
    const key = `POLICY_REVIEW_${policy.id}`
    if (existingGapKeys.has(key)) continue

    newGaps.push({
      organizationId,
      domain: policy.linkedDomains?.[0] || 'WELL_LED',
      title: `Policy overdue for review: ${policy.title}`,
      description: `Policy "${policy.title}" was due for review on ${policy.reviewDate}. Policies must be reviewed at least annually.`,
      severity: 'MEDIUM',
      status: 'OPEN',
      source: 'POLICY_REVIEW',
      sourceQuestionId: policy.id,
    })
  }

  return newGaps
}
```

### 14.4 Gap Severity Matrix — Full Reference

| Severity | Max Resolution | Rating Impact | Colour | Auto-Task Priority | Examples |
|---|---|---|---|---|---|
| **CRITICAL** | 1 day | Caps domain at RI; if 2+ domains → overall Inadequate | `#ef4444` | URGENT | No registered manager, missing DBS checks, no safeguarding policy, no fire risk assessment, expired staff registration, no emergency medicines |
| **HIGH** | 7 days | Prevents Good rating in domain | `#f97316` | HIGH | No training matrix, incomplete recruitment files, no IPC policy, no complaints policy, no MCA assessments, no whistleblowing policy |
| **MEDIUM** | 30 days | May prevent Outstanding | `#f59e0b` | MEDIUM | No hand hygiene audits, policies approaching review date, no Legionella assessment, no risk register, supervision records incomplete |
| **LOW** | 90 days | Improvement opportunity | `#3b82f6` | LOW | No CPD programme, no benchmarking, no health promotion, service development plan absent |

---

## 15. Remediation Task Generation

### 15.1 From Gaps to Tasks

Every gap generates one or more remediation tasks. Tasks are created automatically after assessment calculation and can be managed by MANAGER+ users.

```typescript
export function generateTasksFromGaps(
  gaps: ComplianceGap[],
  organizationId: string,
): NewTask[] {
  const tasks: NewTask[] = []

  for (const gap of gaps) {
    const question = gap.sourceQuestionId ? getQuestionById(gap.sourceQuestionId) : null
    const template = question?.gapTrigger?.remediationTemplate
      ? REMEDIATION_TEMPLATES[question.gapTrigger.remediationTemplate]
      : null

    // Primary task: Resolve the gap
    tasks.push({
      organizationId,
      title: `Resolve: ${gap.title}`,
      description: gap.description + (gap.remediationSteps?.immediate?.[0]
        ? `\n\nFirst step: ${gap.remediationSteps.immediate[0]}` : ''),
      priority: severityToPriority(gap.severity),
      status: 'TODO',
      source: 'ASSESSMENT_GAP',
      linkedGapId: gap.id,
      linkedDomain: gap.domain,
      linkedKloeCode: gap.kloeCode,
      dueDate: gap.dueDate,
    })

    // If template has additional steps, create sub-tasks
    if (template?.shortTerm) {
      for (const step of template.shortTerm) {
        tasks.push({
          organizationId,
          title: step,
          description: `Follow-up action for: ${gap.title}`,
          priority: 'MEDIUM',
          status: 'TODO',
          source: 'ASSESSMENT_GAP',
          linkedGapId: gap.id,
          linkedDomain: gap.domain,
          linkedKloeCode: gap.kloeCode,
          dueDate: addDays(gap.dueDate, 14),  // Short-term actions due 2 weeks after primary
        })
      }
    }

    // AI policy generation task (if applicable)
    if (template?.aiCapable && gap.title.toLowerCase().includes('policy')) {
      tasks.push({
        organizationId,
        title: `Generate AI draft: ${gap.title.replace('Missing or outdated ', '').replace('No ', '')}`,
        description: 'Use the AI Policy Generator to create a compliant draft policy based on your service type and CQC requirements.',
        priority: severityToPriority(gap.severity),
        status: 'TODO',
        source: 'AI_SUGGESTION',
        linkedGapId: gap.id,
        linkedDomain: gap.domain,
        dueDate: gap.dueDate,
      })
    }
  }

  return tasks
}

function severityToPriority(severity: GapSeverity): TaskPriority {
  switch (severity) {
    case 'CRITICAL': return 'URGENT'
    case 'HIGH':     return 'HIGH'
    case 'MEDIUM':   return 'MEDIUM'
    case 'LOW':      return 'LOW'
  }
}
```

### 15.2 Remediation Templates

| Template Key | Trigger | Immediate Actions | Short-Term Actions | Evidence Required | AI Capable |
|---|---|---|---|---|---|
| `MISSING_POLICY` | Any missing or outdated policy | Use AI Policy Generator; review and customise; have RM approve and sign | Brief all staff within 7 days; obtain read-receipts; set 12-month review date | Approved policy document; staff acknowledgements; review schedule | ✅ Yes |
| `MISSING_TRAINING` | Training gaps or expired training | Identify staff requiring training; source appropriate training; schedule within 14 days | Complete all outstanding training; record in training matrix; schedule refreshers | Training certificates; updated training matrix; refresher schedule | ❌ No |
| `MISSING_RISK_ASSESSMENT` | No risk assessment in place | Conduct the risk assessment; use validated tools; document findings | Review all existing risk assessments; set review dates; brief staff on findings | Completed risk assessment; review schedule; staff briefing records | ✅ Yes |
| `MISSING_AUDIT` | No audit programme or overdue audit | Schedule the outstanding audit; assign competent person; prepare checklist | Complete audit and document findings; create action plan; schedule programme | Completed audit report; action plan; annual audit schedule | ✅ Yes |
| `EXPIRED_REGISTRATION` | Staff registration expired | Immediately assess if staff should stop practising; verify renewal application status | Ensure registration renewed; update records; set monitoring for future expiry | Updated registration evidence; monitoring schedule | ❌ No |
| `MISSING_GOVERNANCE` | No governance framework | Establish regular management meetings; create agenda template; begin documenting minutes | Implement clinical governance reviews; create risk register; define KPIs | Meeting minutes; risk register; KPI dashboard | ✅ Yes |

---

## 16. Re-Assessment Logic

### 16.1 When to Re-Assess

| Scenario | Trigger | What Happens |
|---|---|---|
| User requests re-assessment | ADMIN+ clicks "Run New Assessment" in Settings | New Assessment record created (`isInitial: false`); user answers all questions again; old assessment preserved for comparison |
| Pre-inspection preparation | ADMIN+ triggers from inspection prep | Recommendation only — user decides whether to run |
| Score drops significantly | Weekly cron detects >10% drop | Notification sent to ADMIN+ suggesting re-assessment |
| After major changes | Multiple gaps resolved, many policies published | Notification sent suggesting re-assessment for updated baseline |
| 12-month anniversary | Annual re-assessment reminder | Notification sent; not mandatory but strongly recommended |

### 16.2 Re-Assessment vs. Initial Assessment

| Aspect | Initial Assessment | Re-Assessment |
|---|---|---|
| Triggered by | Onboarding wizard (mandatory) | User choice (optional) |
| Creates Organization record | Yes | No (org already exists) |
| Question set | Full 61–65 questions | Same full question set |
| Pre-populated answers | None (blank) | Yes — previous answers pre-filled for review |
| Shows previous answers | No | Yes — displays "Previous: [answer]" alongside each question |
| Results comparison | No baseline to compare | Side-by-side: "Previous score → New score" with delta |
| Gap handling | Creates all gaps fresh | Marks resolved gaps if answers improved; creates new gaps if answers worsened |
| Assessment record | `isInitial: true` | `isInitial: false`, linked to previous via org |

### 16.3 Re-Assessment Score Comparison

```typescript
export function compareAssessments(
  previous: ScoringResult,
  current: ScoringResult,
): AssessmentComparison {
  return {
    overallDelta: current.overallScore - previous.overallScore,
    ratingChanged: current.predictedRating !== previous.predictedRating,
    previousRating: previous.predictedRating,
    currentRating: current.predictedRating,

    domainDeltas: current.domainScores.map(ds => {
      const prevDomain = previous.domainScores.find(p => p.domain === ds.domain)
      return {
        domain: ds.domain,
        previousScore: prevDomain?.percentage ?? 0,
        currentScore: ds.percentage,
        delta: ds.percentage - (prevDomain?.percentage ?? 0),
        ratingChanged: ds.predictedRating !== prevDomain?.predictedRating,
        previousRating: prevDomain?.predictedRating ?? 'INADEQUATE',
        currentRating: ds.predictedRating,
      }
    }),

    gapsResolved: previous.totalGaps - current.totalGaps,
    newGapsCreated: Math.max(0, current.totalGaps - previous.totalGaps),

    confidenceDelta: current.ratingConfidence - previous.ratingConfidence,
  }
}
```

### 16.4 Pre-Populating Re-Assessment Answers

```typescript
// When loading re-assessment form, pre-fill from last completed assessment
export function getPrePopulatedAnswers(
  previousAssessmentId: string,
): Map<string, PrePopulatedAnswer> {
  const previousAnswers = db.assessmentAnswer.findMany({
    where: { assessmentId: previousAssessmentId },
  })

  return new Map(previousAnswers.map(a => [
    a.questionId,
    {
      previousValue: a.answerValue,
      previousScore: a.score,
      previousGapCreated: a.createsGap,
    },
  ]))
}
```

---

## 17. Ongoing Compliance Monitoring

### 17.1 Recalculation Triggers

The compliance score is a living number that changes as the organization's compliance posture evolves. Recalculations happen without requiring a full re-assessment.

```
EVENT-TRIGGERED RECALCULATIONS (debounced, max 1 per 30 seconds per org):

  Evidence uploaded             → recalculate (evidence quality factor improves)
  Evidence deleted              → recalculate (evidence quality factor drops)
  Evidence expired (cron)       → recalculate + create gap
  Policy published              → recalculate (evidence quality factor improves)
  Policy revoked                → recalculate
  Policy review overdue (cron)  → create gap + notify
  Training recorded             → recalculate
  Training expired (cron)       → recalculate + create gap
  Staff registration expired    → recalculate + create CRITICAL gap
  DBS check older than 3 years  → create MEDIUM gap + notify
  Gap resolved                  → recalculate (score improves)
  Gap accepted as risk          → recalculate (gap excluded from scoring)
  Incident reported (SEVERE+)   → recalculate (timeliness factor adjusts)
```

### 17.2 What Changes During Recalculation

| Data Source | Initial Assessment | Recalculation |
|---|---|---|
| Assessment answers | Used (primary input) | Used (unchanged from last assessment) |
| Evidence library | Used | Updated — new uploads, deletions, expiries |
| Policy library | Not directly | Updated — new published policies, review status |
| Staff records | Not directly | Updated — registration status, DBS currency |
| Training records | Not directly | Updated — new completions, expiries |
| Incident reports | Not directly | Updated — recent incidents affect timeliness |
| Gap statuses | Generated fresh | Updated — resolved gaps excluded, new gaps added |

### 17.3 Score Trend Tracking

```typescript
// After each recalculation, update ComplianceScore with trend data

await db.complianceScore.update({
  where: { organizationId },
  data: {
    previousScore: currentScore.overallScore,
    overallScore: newResult.overallScore,
    scoreTrend: newResult.overallScore - currentScore.overallScore,
    predictedRating: newResult.predictedRating,
    lastCalculatedAt: new Date(),
  },
})

// Also update DomainScore records for each domain
for (const ds of newResult.domainScores) {
  await db.domainScore.upsert({
    where: { complianceScoreId_domain: { complianceScoreId: score.id, domain: ds.domain } },
    update: {
      score: ds.percentage,
      previousScore: existingDomainScore?.score ?? null,
      predictedRating: ds.predictedRating,
      gapCount: ds.gapCount,
      evidenceCount: countDomainEvidence(ds.domain),
    },
    create: { ... },
  })
}
```

### 17.4 Compliance Decay Model

Compliance doesn't stay static — it naturally decays if not maintained. The timeliness factor enforces this:

```
TIME SINCE LAST EVIDENCE/TRAINING ACTION → IMPACT ON SCORE:

  < 30 days     No decay (factor = 1.0)
  30–90 days    Slight decay (factor = 0.95)
  90–180 days   Moderate decay (factor = 0.85)
  180–365 days  Significant decay (factor = 0.70)
  > 365 days    Severe decay (factor = 0.50)
```

This ensures organizations must continually maintain their compliance posture. Simply answering the assessment well and then doing nothing will see scores gradually decline as evidence ages, training expires, and policy review dates pass.

### 17.5 Notification Triggers from Monitoring

| Event | Notification | Priority | Recipients |
|---|---|---|---|
| Score drops below Good threshold (63%) | "Compliance score dropped below Good" | HIGH | ADMIN, OWNER |
| New CRITICAL gap detected | "Critical compliance gap identified" | URGENT | ADMIN, OWNER, MANAGER |
| Evidence expires | "Evidence expired: [title]" | MEDIUM | ADMIN, MANAGER |
| Evidence expiring in 30 days | "Evidence expiring soon: [title]" | LOW | ADMIN, MANAGER |
| Staff registration expired | "Staff registration expired: [name]" | HIGH | ADMIN, MANAGER |
| Training expired | "Training overdue: [course] for [name]" | MEDIUM | ADMIN, MANAGER |
| Policy review overdue | "Policy review overdue: [title]" | MEDIUM | ADMIN, MANAGER |
| Weekly score summary | "Weekly compliance summary" | LOW | ADMIN, OWNER |

---

## 18. Worked Examples — Full Scoring Walkthroughs

### 18.1 Example 1: Small Aesthetic Clinic — Initial Assessment

**Organization Profile:**
- Service type: Aesthetic Clinic
- 3 treatment rooms, 5 staff (1 doctor, 2 nurses, 1 admin, 1 manager)
- Specialities: Botox, Fillers, Laser
- Not yet CQC-rated (new clinic)

**Assessment Answers (selected key questions):**

| Question | Answer | Score | Max | Gap? |
|---|---|---|---|---|
| SAFE_S1_Q01 (Safeguarding policy) | `yes` | 15.0 | 15.0 | No |
| SAFE_S1_Q02 (DBS checks) | `partial` | 6.0 | 15.0 | CRITICAL |
| SAFE_S2_Q01 (Fire risk assessment) | `yes` | 15.0 | 15.0 | No |
| SAFE_S2_Q07 (Procedure risk assessments) | `no` | 0 | 15.0 | CRITICAL |
| SAFE_S3_Q01 (Registered manager) | `yes` | 20.0 | 20.0 | No |
| SAFE_S3_Q06 (Practitioner qualifications) | `yes` | 15.0 | 15.0 | No |
| SAFE_S4_Q03 (Prescribing arrangements) | `partial` | 7.5 | 15.0 | No |
| SAFE_S4_Q04 (Emergency medicines) | `yes` | 20.0 | 20.0 | No |
| SAFE_S5_Q01 (IPC policy) | `no` | 0 | 15.0 | CRITICAL |
| SAFE_S6_Q01 (Incident reporting) | `partial` | 6.0 | 12.0 | No |
| EFF_E7_Q02 (Informed consent) | `yes` | 15.0 | 15.0 | No |
| EFF_E7_Q03 (Cooling-off period) | `no` | 0 | 9.6 | HIGH |

**SAFE Domain Calculation:**
- Raw score: 118 / 185 weighted points = 63.8%
- Evidence quality factor: 0.7 (some policies uploaded, limited evidence)
- Timeliness factor: 0.9 (new clinic, no expired items)
- Adjusted percentage: 63.8% × 0.7 × 0.9 = **40.2%**
- Rating before limiter: **Requires Improvement** (40.2% is in 39–62 range)
- CRITICAL gaps present (DBS, procedure risk, IPC): Rating stays at **RI** (capped anyway)
- SAFE domain rating: **Requires Improvement**

**Other Domain Scores (hypothetical):**
- EFFECTIVE: 58.0% → Requires Improvement
- CARING: 75.2% → Good
- RESPONSIVE: 71.0% → Good
- WELL-LED: 52.3% → Requires Improvement

**Overall Rating Determination:**
- 3 domains at RI → Rule 2 applies (2+ RI) → **Overall: Requires Improvement**
- Overall score: (40.2 + 58.0 + 75.2 + 71.0 + 52.3) / 5 = **59.3%**
- Total gaps: 4 CRITICAL, 3 HIGH, 5 MEDIUM, 2 LOW = 14 total
- Confidence: 0.42 (low — no evidence, no staff records uploaded yet)
- Estimated time to Good: ~45 days

### 18.2 Example 2: Established Care Home — Re-Assessment (Improved)

**Organization Profile:**
- Service type: Care Home
- 35 beds, 28 staff
- Previously rated: Requires Improvement
- Has been using platform for 6 months, resolved most gaps

**Domain Scores After Re-Assessment:**
- SAFE: 78.5% → **Good** (all critical gaps resolved, strong evidence library)
- EFFECTIVE: 82.1% → **Good** (training matrix complete, policies published)
- CARING: 89.3% → **Outstanding** (excellent feedback, strong person-centred care)
- RESPONSIVE: 74.8% → **Good** (complaints process improved, activities programme in place)
- WELL-LED: 90.1% → **Outstanding** (governance framework established, risk register maintained)

**Overall Rating Determination:**
- 0 domains Inadequate → Rule 1 does not apply
- 0 domains RI → Rule 2 does not apply
- All domains Good+ → Continue to Rule 3
- 2 domains Outstanding (CARING + WELL-LED) → Rule 3 applies
- **Overall: Outstanding** ✨
- Overall score: (78.5 + 82.1 + 89.3 + 74.8 + 90.1) / 5 = **82.96%**
- Note: Overall percentage (82.96%) is in the "Good" range (63–87), but the rating determination uses domain-level aggregation, not the percentage directly. The domain ratings matter more than the aggregate number.

**Score Comparison vs. Previous:**
- Previous overall: 47.2% (RI) → Current: 82.96% (+35.8 points)
- Rating changed: RI → Outstanding
- Gaps resolved: 18 of 22 original gaps
- Confidence: 0.78 (strong evidence library, recent assessment)

### 18.3 Example 3: Care Home with Critical Gap — Rating Limiter in Action

**Domain Scores:**
- SAFE: 72.0% → would be Good, BUT has 1 CRITICAL gap (staff member with expired NMC registration)
- EFFECTIVE: 80.0% → Good
- CARING: 85.0% → Good
- RESPONSIVE: 75.0% → Good
- WELL-LED: 78.0% → Good

**Rating Limiter Applied:**
- SAFE has CRITICAL gap → Rating capped at **Requires Improvement** (despite 72% score)
- 1 domain at RI → Rule 5 (compensation): RI domain at 72% (>55%) with critical gap → compensation BLOCKED (critical gap present)
- **Overall: Requires Improvement** (despite 4 out of 5 domains being Good)

**Key Insight:** This demonstrates why resolving CRITICAL gaps is the single most impactful action. One unresolved critical gap can drag the entire rating down from what would otherwise be Good or Outstanding.

---

## 19. Question Versioning & Migration

### 19.1 Version Control Strategy

Assessment questions are defined in code and versioned alongside the application. This allows:

| Feature | How |
|---|---|
| New questions added | Increment `QUESTION_SCHEMA_VERSION`; new assessments use new questions |
| Questions modified | Update text/scoring; mark version change; existing answers are NOT retroactively rescored |
| Questions removed | Mark as `deprecated: true`; excluded from new assessments; old answers preserved |
| Answer compatibility | Each AssessmentAnswer stores `questionText` snapshot at time of answering |

### 19.2 Version Schema

```typescript
// lib/constants/assessment-questions.ts

export const QUESTION_SCHEMA_VERSION = 1  // Increment when questions change

export interface QuestionVersionMetadata {
  version: number
  effectiveFrom: string      // ISO date
  changelog: string          // Description of what changed
  backwardsCompatible: boolean
}

export const QUESTION_CHANGELOG: QuestionVersionMetadata[] = [
  {
    version: 1,
    effectiveFrom: '2026-02-01',
    changelog: 'Initial question bank: 121 questions across 5 domains for Aesthetic Clinics and Care Homes',
    backwardsCompatible: true,
  },
  // Future versions would be added here:
  // {
  //   version: 2,
  //   effectiveFrom: '2026-08-01',
  //   changelog: 'Added 3 questions for Learning Disability service type; updated S4 prescribing questions',
  //   backwardsCompatible: true,
  // },
]
```

### 19.3 Assessment Version Tracking

Each Assessment record stores the question schema version used:

```prisma
model Assessment {
  // ...existing fields...
  version  Int  @default(1)  // QUESTION_SCHEMA_VERSION at time of creation
}
```

When displaying historical assessments, the platform uses the question definitions that were active at the time of that assessment's version, ensuring historical accuracy.

### 19.4 Future Service Type Expansion

The question architecture supports adding new service types without restructuring:

| Future Service Type | What Changes |
|---|---|
| GP Surgery | New `serviceTypes` value; new service-specific questions added; existing shared questions apply |
| Dental Practice | New questions for dental-specific KLOEs (e.g. X-ray safety, amalgam disposal) |
| Domiciliary Care | Different risk profile; new questions for lone working, travel between clients, remote supervision |
| Learning Disability | Additional questions for PBS, capacity, communication, community integration |

Each new service type adds questions to the same flat array with the appropriate `serviceTypes` filter. The scoring engine, gap identification, and rating prediction all work identically — they don't know or care about the service type, only which questions were applicable and how they were answered.

---

## Appendix A: Complete Regulation Mapping

Every assessment question maps to one or more CQC Fundamental Standards (Regulations). This table shows which regulations are covered by the assessment and which questions reference them.

| Regulation | Title | Questions Referencing | Domain(s) |
|---|---|---|---|
| **Reg 5** | Fit and proper persons — directors | WEL_W4_Q01 | Well-Led |
| **Reg 9** | Person-centred care | EFF_E1_Q01, EFF_E1_Q06, RES_R1_Q01–Q05, RES_R3_Q01–Q04, CAR_C2_Q01 | Effective, Responsive, Caring |
| **Reg 10** | Dignity and respect | CAR_C1_Q01–Q06, CAR_C3_Q01–Q05 | Caring |
| **Reg 11** | Need for consent | EFF_E7_Q01–Q06 | Effective |
| **Reg 12** | Safe care and treatment | SAFE_S2_Q01–Q11, SAFE_S4_Q01–Q08, SAFE_S5_Q01–Q06, EFF_E1_Q01–Q08 | Safe, Effective |
| **Reg 13** | Safeguarding | SAFE_S1_Q01–Q06 | Safe |
| **Reg 14** | Meeting nutritional needs | EFF_E3_Q01–Q05 | Effective |
| **Reg 15** | Premises and equipment | SAFE_S2_Q01–Q11, EFF_E6_Q01–Q03 | Safe, Effective |
| **Reg 16** | Complaints | RES_R2_Q01–Q04 | Responsive |
| **Reg 17** | Good governance | SAFE_S6_Q01–Q04, WEL_W1_Q01–Q03, WEL_W2_Q01–Q04, WEL_W3_Q01–Q03, WEL_W5_Q01–Q03, WEL_W6_Q01–Q04 | Safe, Well-Led |
| **Reg 18** | Staffing | SAFE_S3_Q01–Q06, EFF_E2_Q01–Q07 | Safe, Effective |
| **Reg 19** | Fit and proper persons employed | SAFE_S1_Q02, SAFE_S3_Q03–Q06 | Safe |
| **Reg 20** | Duty of candour | SAFE_S6_Q02, WEL_W3_Q01 | Safe, Well-Led |

---

## Appendix B: KLOE-to-Question Mapping

| KLOE | Code | Domain | Question IDs | Question Count (Clinic/Home) |
|---|---|---|---|---|
| Safeguarding | S1 | SAFE | SAFE_S1_Q01–Q06 | 6 / 6 |
| Risk Assessment | S2 | SAFE | SAFE_S2_Q01–Q11 | 7 / 8 |
| Staffing | S3 | SAFE | SAFE_S3_Q01–Q06 | 4 / 4 |
| Medicines | S4 | SAFE | SAFE_S4_Q01–Q08 | 5 / 5 |
| Infection Control | S5 | SAFE | SAFE_S5_Q01–Q06 | 5 / 4 |
| Learning from Incidents | S6 | SAFE | SAFE_S6_Q01–Q04 | 4 / 4 |
| Needs Assessment | E1 | EFFECTIVE | EFF_E1_Q01–Q08 | 6 / 5 |
| Staff Skills | E2 | EFFECTIVE | EFF_E2_Q01–Q07 | 6 / 7 |
| Nutrition | E3 | EFFECTIVE | EFF_E3_Q01–Q05 | 0 / 5 |
| MDT Working | E4 | EFFECTIVE | EFF_E4_Q01–Q03 | 2 / 2 |
| Healthy Living | E5 | EFFECTIVE | EFF_E5_Q01–Q02 | 1 / 2 |
| Premises | E6 | EFFECTIVE | EFF_E6_Q01–Q03 | 2 / 2 |
| Consent | E7 | EFFECTIVE | EFF_E7_Q01–Q06 | 4 / 4 |
| Kindness & Compassion | C1 | CARING | CAR_C1_Q01–Q06 | 4 / 4 |
| Involvement in Decisions | C2 | CARING | CAR_C2_Q01–Q03 | 3 / 2 |
| Privacy & Dignity | C3 | CARING | CAR_C3_Q01–Q05 | 3 / 4 |
| Personalised Care | R1 | RESPONSIVE | RES_R1_Q01–Q07 | 6 / 5 |
| Complaints | R2 | RESPONSIVE | RES_R2_Q01–Q04 | 4 / 4 |
| End of Life | R3 | RESPONSIVE | RES_R3_Q01–Q04 | 0 / 4 |
| Vision & Strategy | W1 | WELL-LED | WEL_W1_Q01–Q03 | 3 / 3 |
| Governance | W2 | WELL-LED | WEL_W2_Q01–Q04 | 4 / 4 |
| Culture | W3 | WELL-LED | WEL_W3_Q01–Q03 | 3 / 3 |
| Roles & Accountability | W4 | WELL-LED | WEL_W4_Q01–Q04 | 3 / 3 |
| Continuous Improvement | W5 | WELL-LED | WEL_W5_Q01–Q03 | 2 / 3 |
| Information Management | W6 | WELL-LED | WEL_W6_Q01–Q04 | 4 / 4 |

---

> **End of 07-ASSESSMENT-ENGINE.md** — This is the final specification file. Together with the companion files, these 7 documents form the complete development blueprint for the CQC Compliance Platform. Every question, every scoring rule, every gap trigger, and every rating limiter is defined here for implementation by Cursor AI.
>
> **File Suite Summary:**
> | File | Purpose | Lines |
> |---|---|---|
> | `01-ARCHITECTURE.md` | Tech stack, file structure, development guidelines | ~980 |
> | `02-DATABASE.md` | 20 Prisma models, RLS, indexing, seed data | ~1,830 |
> | `03-UI-UX.md` | 30+ screens, wireframes, component specs | ~2,340 |
> | `04-CQC-FRAMEWORK.md` | 5 domains, 25 KLOEs, 14 regulations, scoring, gaps | ~3,500 |
> | `05-API-SERVICES.md` | 55 endpoints, service layer, webhooks, cron, AI | ~4,950 |
> | `06-AUTH-SECURITY.md` | Auth flows, RBAC, GDPR, NHS DSPT, security headers | ~1,530 |
> | `07-ASSESSMENT-ENGINE.md` | 121 questions, scoring pipeline, rating prediction, gaps | This file |
