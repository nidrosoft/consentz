# KLOE Evidence Mapping Correction — Complete Restructure

## Context & Problem

The CQC Compliance Module currently displays **generic checklist items** on each KLOE detail page:
- "Policy or procedure documented"
- "Evidence uploaded and linked"
- "No open compliance gaps"
- "Staff training completed"
- "Last audit within 12 months"

This is **wrong**. Each KLOE must display the **exact, specific evidence items** defined by the client, with the correct regulations and evidence type labels. The current generic checklist must be **completely replaced** with the structured evidence items below.

Additionally, the "Linked Regulations" section currently shows only a single regulation per KLOE (e.g., S1 shows only "Reg 13"). Each KLOE must show **all** linked regulations as specified below.

## What Needs to Change

### 1. KLOE Detail Page Structure

Each KLOE detail page (e.g., `/domains/safe/s1`) must display:

```
┌─────────────────────────────────────────────────────────┐
│  S1  Safeguarding                                       │
│  Domain: Safe                                           │
│                                                         │
│  KLOE DESCRIPTION (NEW — currently missing)             │
│  "[Full description text from mapping below]"           │
│                                                         │
│  ┌─── Score Bar ────────────────────── [Badge] ──┐     │
│  │  40%  ████████░░░░░░░░░░░░░░░░░  Compliant    │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  Linked Regulations                                     │
│  ┌──────────────────────────────────────────────┐      │
│  │ Reg 13  Safeguarding service users from...    │      │
│  │ Reg 12  Safe care and treatment               │      │
│  │ Reg 19  Fit and proper persons employed        │      │
│  │ Reg 10  Dignity and respect                    │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  Evidence Requirements (6)         ← NEW SECTION NAME   │
│  ┌──────────────────────────────────────────────┐      │
│  │ ○ Safeguarding policy aligned with local      │      │
│  │   authority safeguarding procedures    [POLICY]│      │
│  │                                        Upload ▸│      │
│  │──────────────────────────────────────────────│      │
│  │ ● Evidence showing all staff have completed   │      │
│  │   safeguarding training and training remains   │      │
│  │   in date                       [MANUAL UPLOAD]│      │
│  │                          Upload training record▸│      │
│  │──────────────────────────────────────────────│      │
│  │ ○ DBS check records for all relevant staff    │      │
│  │   members                       [MANUAL UPLOAD]│      │
│  │                                        Upload ▸│      │
│  │──────────────────────────────────────────────│      │
│  │ ...etc for each evidence item                  │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  Linked Evidence (N)                                    │
│  [Existing evidence upload section]                     │
│                                                         │
│  Compliance Gaps (N)                                    │
│  [Existing gaps section with remediation]               │
└─────────────────────────────────────────────────────────┘
```

### 2. Evidence Type Labels

Each evidence item must display a **badge/tag** indicating how it is fulfilled:

| Label | Badge Color | Meaning | Behavior |
|-------|-----------|---------|----------|
| `POLICY` | Blue | Generated in-app via the Policy module | Show "Create Policy" or "View Policy" action button. Links to the Policies section. When a matching policy exists and is PUBLISHED, mark this item as complete. |
| `MANUAL UPLOAD` | Amber/Orange | User must upload an external document | Show "Upload" action button. When evidence is uploaded and linked to this KLOE, mark as complete. |
| `CONSENTZ` | Green | Fully auto-populated from Consentz CRM data | Show "Auto-synced" badge. No upload button. Marked complete when the Consentz sync has populated the relevant data. Show last sync timestamp. |
| `CONSENTZ / MANUAL` | Teal | Auto-populated from Consentz + optional supplementary upload | Show "Auto-synced" badge AND an optional "Upload additional" button. Marked complete when Consentz data exists, but user can add supplementary documents. |

### 3. Evidence Item Completion Tracking

Each evidence item on the KLOE detail page must be **individually trackable**:
- Unchecked circle (○) = Not yet provided
- Checked circle (●) = Evidence provided / policy published / data synced
- The KLOE completion percentage = (completed evidence items / total evidence items) × 100
- This **replaces** the current generic checklist completion logic

### 4. Service Type Filtering

Evidence items differ between Aesthetic Clinics and Care Homes. The app must show **only** the evidence items for the organisation's service type. The mapping below specifies which items belong to which service type.

---

## DATA MODEL CHANGES

### Option A: Evidence Items as Code Constants (Recommended)

Define evidence items in code alongside the existing KLOE/question definitions:

```typescript
// lib/constants/kloe-evidence-requirements.ts

export interface KloeEvidenceItem {
  id: string                    // e.g., "S1_EV01"
  kloeCode: string              // S1, S2, E1, etc.
  domain: CqcDomainType
  description: string           // The evidence item description shown to user
  evidenceType: EvidenceType    // POLICY | MANUAL_UPLOAD | CONSENTZ | CONSENTZ_MANUAL
  serviceTypes: ServiceType[]   // AESTHETIC_CLINIC | CARE_HOME | both
  sortOrder: number             // Display order within the KLOE
}

export type EvidenceType = 'POLICY' | 'MANUAL_UPLOAD' | 'CONSENTZ' | 'CONSENTZ_MANUAL'

export interface KloeDefinition {
  code: string                  // S1, S2, E1, etc.
  domain: CqcDomainType
  keyQuestion: string           // "How do systems, processes and practices..."
  description: string           // Full KLOE description paragraph
  regulations: RegulationRef[]  // All linked regulations
  evidenceItems: KloeEvidenceItem[]
  serviceTypes: ServiceType[]   // Which service types this KLOE applies to
}

export interface RegulationRef {
  code: string                  // "Reg 13"
  title: string                 // "Safeguarding service users from abuse..."
}
```

### Option B: Database Table for Evidence Completion Tracking

Track which evidence items each organisation has fulfilled:

```sql
CREATE TABLE kloe_evidence_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID REFERENCES organisations(id) NOT NULL,
  kloe_code TEXT NOT NULL,           -- S1, S2, E1, etc.
  evidence_item_id TEXT NOT NULL,    -- S1_EV01, S1_EV02, etc.
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'complete')) DEFAULT 'not_started',
  evidence_type TEXT NOT NULL,       -- POLICY, MANUAL_UPLOAD, CONSENTZ, CONSENTZ_MANUAL
  linked_policy_id UUID REFERENCES policies(id),      -- If type is POLICY
  linked_evidence_id UUID REFERENCES evidence(id),    -- If type is MANUAL_UPLOAD
  consentz_synced_at TIMESTAMPTZ,                     -- If type is CONSENTZ or CONSENTZ_MANUAL
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organisation_id, evidence_item_id)
);

CREATE INDEX idx_kloe_evidence_org ON kloe_evidence_status(organisation_id);
CREATE INDEX idx_kloe_evidence_kloe ON kloe_evidence_status(kloe_code);
```

### Auto-Completion Logic

When certain events occur, automatically update `kloe_evidence_status`:

```typescript
// When a policy is published and linked to a KLOE domain:
// → Find all POLICY-type evidence items for that KLOE
// → Mark as 'complete' and link the policy_id

// When evidence is uploaded and linked to a KLOE:
// → Find matching MANUAL_UPLOAD evidence items
// → Mark as 'complete' and link the evidence_id

// When Consentz sync completes and populates relevant data:
// → Find all CONSENTZ and CONSENTZ_MANUAL evidence items
// → Mark as 'complete' and set consentz_synced_at
```

---

## COMPLETE KLOE EVIDENCE MAPPING

**IMPORTANT:** Read this section carefully. Every single evidence item, regulation, and description must be implemented exactly as specified. This is the client's authoritative specification.

---

## SECTION 1: AESTHETIC CLINICS

### SAFE DOMAIN — Aesthetic Clinics

#### S1 — Safeguarding

**Key Question:** "How do systems, processes and practices keep people safe and safeguarded from abuse?"

**Description:** This KLOE is about whether the clinic has the right safeguarding systems, training, checks, and reporting processes in place to protect patients from abuse or improper treatment.

**Regulations:**
- Reg 13 — Safeguarding service users from abuse and improper treatment
- Reg 12 — Safe care and treatment
- Reg 19 — Fit and proper persons employed
- Reg 10 — Dignity and respect

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| S1_EV01 | A safeguarding policy that is current, clearly written, and aligned with local authority safeguarding procedures | POLICY |
| S1_EV02 | Evidence showing that all staff have completed safeguarding training and that training remains in date | MANUAL UPLOAD |
| S1_EV03 | DBS check records for all relevant staff members | MANUAL UPLOAD |
| S1_EV04 | A safeguarding incident and referral log showing concerns raised, actions taken, and referrals made where necessary | MANUAL UPLOAD |
| S1_EV05 | A whistleblowing policy that explains how staff can raise concerns safely | POLICY |
| S1_EV06 | A chaperone policy explaining when chaperones should be offered and records showing chaperone availability or use where relevant | POLICY |

---

#### S2 — Risk Assessment

**Key Question:** "How are risks assessed and managed so people stay safe?"

**Description:** This KLOE is about whether the clinic identifies risks properly, documents them clearly, and manages them in a way that protects patients and staff.

**Regulations:**
- Reg 12 — Safe care and treatment
- Reg 15 — Premises and equipment
- Reg 17 — Good governance
- Reg 20 — Duty of candour

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| S2_EV01 | Clinical risk assessments for each treatment or procedure offered by the clinic | MANUAL UPLOAD |
| S2_EV02 | Written treatment or procedure protocols showing how risks are controlled in practice | POLICY |
| S2_EV03 | Records of emergency equipment checks, including resuscitation kit checks and maintenance records where applicable | MANUAL UPLOAD |
| S2_EV04 | Incident and accident records showing what happened, how it was handled, and any immediate actions taken | CONSENTZ / MANUAL |
| S2_EV05 | Environmental and premises safety audit records | MANUAL UPLOAD |
| S2_EV06 | Fire safety certificates and records of completed fire drills | MANUAL UPLOAD |

---

#### S3 — Safe Information

**Key Question:** "Do staff have all the information they need to deliver safe care?"

**Description:** This KLOE is about whether staff can access accurate and complete patient information, so that care is delivered safely and with continuity.

**Regulations:**
- Reg 12 — Safe care and treatment
- Reg 17 — Good governance
- Reg 9 — Person-centred care

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| S3_EV01 | Complete patient records showing relevant consultation, treatment, and follow-up information for each patient | CONSENTZ |
| S3_EV02 | A handover process or handover procedure showing how important patient information is passed between staff members | POLICY |
| S3_EV03 | A system or record showing how test results are managed, reviewed, and followed up | MANUAL UPLOAD |
| S3_EV04 | Referral tracking records showing when referrals are made and whether they are followed through | MANUAL UPLOAD |
| S3_EV05 | Information-sharing protocols showing how patient information is shared appropriately and securely between staff | POLICY |
| S3_EV06 | Evidence that clinical notes are completed consistently and to the expected standard | CONSENTZ / MANUAL |

---

#### S4 — Medicines Management

**Key Question:** "How does the provider ensure proper and safe use of medicines?"

**Description:** This KLOE is about whether medicines are prescribed, stored, handled, and monitored safely and appropriately.

**Regulations:**
- Reg 12 — Safe care and treatment
- Reg 17 — Good governance

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| S4_EV01 | A medicines management policy covering prescribing, storage, administration, and monitoring | POLICY |
| S4_EV02 | Prescribing protocols that explain how prescribing decisions are made and documented safely | POLICY |
| S4_EV03 | Staff competency records showing who is trained and authorised to handle or administer medicines | MANUAL UPLOAD |
| S4_EV04 | A controlled drugs register where controlled drugs are used or stored | MANUAL UPLOAD |
| S4_EV05 | Fridge temperature logs or other storage temperature records for medicines requiring temperature control | MANUAL UPLOAD |
| S4_EV06 | Medication audit records showing regular checks of medicines handling and documentation | MANUAL UPLOAD |
| S4_EV07 | Records of adverse drug reaction reporting or escalation where this has occurred | MANUAL UPLOAD |

---

#### S5 — Infection Prevention & Control

**Key Question:** "How well are people protected by infection prevention and control?"

**Description:** This KLOE is about whether the clinic has proper systems to prevent infection, maintain cleanliness, and reduce cross-contamination risk.

**Regulations:**
- Reg 12 — Safe care and treatment
- Reg 15 — Premises and equipment

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| S5_EV01 | An infection prevention and control policy that is current and relevant to the clinic's services | POLICY |
| S5_EV02 | Cleaning schedules and cleaning completion records for clinical and non-clinical areas | MANUAL UPLOAD |
| S5_EV03 | Hand hygiene audit results or records of hand hygiene monitoring | MANUAL UPLOAD |
| S5_EV04 | Records showing PPE availability and stock management where applicable | MANUAL UPLOAD |
| S5_EV05 | Equipment decontamination logs or cleaning records for reusable equipment | MANUAL UPLOAD |
| S5_EV06 | Sharps disposal records and evidence of compliant sharps handling | MANUAL UPLOAD |
| S5_EV07 | Clinical waste management records | MANUAL UPLOAD |
| S5_EV08 | Records of infection-related incidents and actions taken in response | CONSENTZ / MANUAL |

---

#### S6 — Learning from Incidents

**Key Question:** "Are lessons learned when things go wrong?"

**Description:** This KLOE is about whether the clinic reviews incidents properly, learns from mistakes, and uses that learning to improve safety and quality.

**Regulations:**
- Reg 17 — Good governance
- Reg 20 — Duty of candour

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| S6_EV01 | An incident reporting system or incident log showing how safety events are recorded | CONSENTZ / MANUAL |
| S6_EV02 | Significant Event Analysis or equivalent incident review reports showing what happened and what was learned | MANUAL UPLOAD |
| S6_EV03 | Action plans showing what changes were introduced after incidents or errors | MANUAL UPLOAD |
| S6_EV04 | Trend analysis reports showing recurring themes or repeated issues over time | CONSENTZ / MANUAL |
| S6_EV05 | Staff meeting minutes showing that learning from incidents was discussed with the team | MANUAL UPLOAD |
| S6_EV06 | Duty of candour records or correspondence where relevant | MANUAL UPLOAD |
| S6_EV07 | Audit cycle records showing that changes were checked again to confirm improvement | MANUAL UPLOAD |

---

### EFFECTIVE DOMAIN — Aesthetic Clinics

#### E1 — Needs Assessment & Evidence-Based Care

**Key Question:** "Are needs assessed and care delivered in line with evidence-based guidance?"

**Description:** This KLOE is about whether patient needs are properly assessed and whether treatment is delivered in line with recognised clinical standards and guidance.

**Regulations:**
- Reg 9 — Person-centred care
- Reg 12 — Safe care and treatment
- Reg 10 — Dignity and respect

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| E1_EV01 | Initial consultation and assessment records showing that patient needs are properly documented | CONSENTZ |
| E1_EV02 | Treatment plans tailored to the patient's condition, preferences, and clinical needs | CONSENTZ |
| E1_EV03 | Evidence showing use of NICE guidance or relevant specialty guidance in treatment decisions | MANUAL UPLOAD |
| E1_EV04 | Outcome tracking records showing treatment progress or results over time | CONSENTZ |
| E1_EV05 | Review records showing that patients are reassessed as appropriate | CONSENTZ |
| E1_EV06 | Referral pathways showing when and how patients are escalated or referred elsewhere if needed | POLICY |

---

#### E2 — Staff Skills & Competence

**Key Question:** "Do staff have the skills, knowledge and experience to deliver effective care?"

**Description:** This KLOE is about whether staff are properly recruited, trained, supervised, and competent to deliver the services offered.

**Regulations:**
- Reg 18 — Staffing
- Reg 19 — Fit and proper persons employed
- Reg 12 — Safe care and treatment

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| E2_EV01 | Staff recruitment files showing qualifications, references, and employment checks | MANUAL UPLOAD |
| E2_EV02 | Induction records for new staff members | MANUAL UPLOAD |
| E2_EV03 | A training matrix showing mandatory and role-specific training completion | MANUAL UPLOAD |
| E2_EV04 | Competency assessment records for relevant clinical and operational tasks | MANUAL UPLOAD |
| E2_EV05 | Supervision and appraisal records | MANUAL UPLOAD |
| E2_EV06 | Professional registration verification such as GMC or NMC checks where applicable | MANUAL UPLOAD |

---

#### E3 — Nutrition (Aesthetic Clinic)

**Key Question:** "Nutrition and hydration support, if applicable"

**Description:** This KLOE is only relevant where the clinic provides services involving nutrition, hydration, or weight management support.

**Regulations:**
- Reg 14 — Meeting nutritional and hydration needs
- Reg 9 — Person-centred care

**Evidence Items (only if clinic offers nutrition/weight management services):**

| ID | Description | Type |
|---|---|---|
| E3_EV01 | Nutritional assessment records where relevant to the service offered | MANUAL UPLOAD |
| E3_EV02 | Dietary advice records or care documentation related to nutrition support | MANUAL UPLOAD |
| E3_EV03 | Outcome monitoring records such as weight or BMI tracking where applicable | MANUAL UPLOAD |
| E3_EV04 | Referral arrangements to dietitians or specialist services where needed | MANUAL UPLOAD |

**Note:** For most aesthetic clinics, E3 is marked as "Not Applicable". Show a toggle allowing the org to mark E3 as N/A, which excludes it from scoring. Only show the evidence items if the org indicates they provide nutrition/weight management services.

---

#### E4 — Multi-Disciplinary Working

**Key Question:** "How do staff, teams and services work together?"

**Description:** This KLOE is about whether the clinic communicates effectively with internal staff and external healthcare partners so that care is coordinated.

**Regulations:**
- Reg 9 — Person-centred care
- Reg 12 — Safe care and treatment

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| E4_EV01 | MDT meeting records where multidisciplinary meetings are used | MANUAL UPLOAD |
| E4_EV02 | Referral and discharge communication records | MANUAL UPLOAD |
| E4_EV03 | Shared care protocols with GPs or other specialists where relevant | POLICY |
| E4_EV04 | Information-sharing agreements with relevant third parties where needed | POLICY |
| E4_EV05 | Feedback or communication records from partner organisations where relevant | MANUAL UPLOAD |

---

#### E5 — Healthier Lives

**Key Question:** "How are people supported to live healthier lives?"

**Description:** This KLOE is about whether patients are given information, support, or signposting that helps them maintain or improve their health beyond the immediate treatment.

**Regulations:**
- Reg 9 — Person-centred care
- Reg 12 — Safe care and treatment

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| E5_EV01 | Health promotion materials or patient education resources available in the clinic | MANUAL UPLOAD |
| E5_EV02 | Records showing preventive care advice or related support where applicable | MANUAL UPLOAD |
| E5_EV03 | Lifestyle advice documented in patient notes where relevant | CONSENTZ |
| E5_EV04 | Signposting records or evidence of referrals to support services | MANUAL UPLOAD |
| E5_EV05 | Follow-up or recall systems used to support healthier outcomes | CONSENTZ |

---

#### E6 — Consent (Aesthetic Clinic)

**Key Question:** "Is consent sought in line with legislation and guidance?"

**Description:** This KLOE is about whether consent is obtained properly, whether patients are given sufficient information, and whether legal requirements around capacity and decision-making are followed.

**Regulations:**
- Reg 11 — Need for consent
- Reg 9 — Person-centred care
- Reg 10 — Dignity and respect

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| E6_EV01 | A consent policy that reflects the Mental Capacity Act and relevant clinical guidance | POLICY |
| E6_EV02 | Signed consent forms showing that consent was obtained before treatment | CONSENTZ |
| E6_EV03 | Capacity assessment records where capacity is in question or requires assessment | MANUAL UPLOAD |
| E6_EV04 | Staff training records relating to consent and the Mental Capacity Act | MANUAL UPLOAD |
| E6_EV05 | Documentation showing what information was given to the patient before consent was obtained | CONSENTZ |
| E6_EV06 | Evidence showing compliance with cooling-off periods for cosmetic procedures where required | CONSENTZ |

---

### CARING DOMAIN — Aesthetic Clinics

#### C1 — Kindness & Compassion

**Key Question:** "Are people treated with kindness, respect, compassion and given emotional support?"

**Description:** This KLOE is about whether patients are treated respectfully and compassionately, and whether the clinic demonstrates a caring approach in practice.

**Regulations:**
- Reg 10 — Dignity and respect
- Reg 9 — Person-centred care

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| C1_EV01 | Patient feedback or satisfaction survey results | CONSENTZ |
| C1_EV02 | A compliments log showing positive patient feedback received outside formal surveys | MANUAL UPLOAD |
| C1_EV03 | Customer care or values-based training records for staff | MANUAL UPLOAD |
| C1_EV04 | Evidence showing how emotional support is offered where appropriate | MANUAL UPLOAD |
| C1_EV05 | Chaperone availability arrangements and related information | POLICY |

---

#### C2 — Involvement in Decisions

**Key Question:** "Are people supported to express their views and be involved in decisions?"

**Description:** This KLOE is about whether patients are listened to, involved in decision-making, and supported to communicate their wishes and preferences.

**Regulations:**
- Reg 9 — Person-centred care
- Reg 10 — Dignity and respect
- Reg 11 — Need for consent

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| C2_EV01 | Records showing shared decision-making discussions in patient notes | CONSENTZ |
| C2_EV02 | Records showing patient involvement in care or treatment planning | CONSENTZ |
| C2_EV03 | Evidence of communication aids being available where needed | MANUAL UPLOAD |
| C2_EV04 | Interpreter or translation service arrangements where required | MANUAL UPLOAD |
| C2_EV05 | Advocacy referral processes or records where relevant | MANUAL UPLOAD |

---

#### C3 — Privacy & Dignity

**Key Question:** "How are privacy and dignity respected?"

**Description:** This KLOE is about whether the clinic protects confidentiality, offers privacy during care, and respects patients' dignity.

**Regulations:**
- Reg 10 — Dignity and respect
- Reg 15 — Premises and equipment

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| C3_EV01 | A confidentiality policy covering patient privacy and handling of confidential information | POLICY |
| C3_EV02 | GDPR compliance documentation or related privacy compliance records | MANUAL UPLOAD |
| C3_EV03 | Chaperone records where relevant to privacy and dignity during treatment | MANUAL UPLOAD |
| C3_EV04 | Equality and diversity training records supporting respectful care | MANUAL UPLOAD |
| C3_EV05 | Evidence that consultation and treatment spaces are arranged to protect privacy | MANUAL UPLOAD |

---

### RESPONSIVE DOMAIN — Aesthetic Clinics

#### R1 — Personalised Care

**Key Question:** "How do people receive personalised care that is responsive to their needs?"

**Description:** This KLOE is about whether the clinic adapts care to the individual, including preferences, accessibility needs, and practical requirements.

**Regulations:**
- Reg 9 — Person-centred care
- Reg 10 — Dignity and respect
- Reg 11 — Need for consent

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| R1_EV01 | Individual treatment plans tailored to the person's needs | CONSENTZ |
| R1_EV02 | Records showing patient preferences are documented and acted on where relevant | CONSENTZ |
| R1_EV03 | Records or arrangements showing reasonable adjustments for disabled patients | MANUAL UPLOAD |
| R1_EV04 | Appointment flexibility options recorded in practice or scheduling processes | CONSENTZ |
| R1_EV05 | Translation or interpretation service arrangements where relevant | MANUAL UPLOAD |

---

#### R2 — Complaints

**Key Question:** "How are concerns and complaints gathered and acted upon?"

**Description:** This KLOE is about whether patients can raise complaints easily and whether complaints are investigated, responded to, and used to improve the service.

**Regulations:**
- Reg 16 — Receiving and acting on complaints
- Reg 17 — Good governance
- Reg 20 — Duty of candour

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| R2_EV01 | A complaints policy explaining how complaints are raised, investigated, and responded to | POLICY |
| R2_EV02 | A complaints log showing complaints, outcomes, and response dates | CONSENTZ / MANUAL |
| R2_EV03 | Complaint response letters or formal response records | MANUAL UPLOAD |
| R2_EV04 | Records showing improvements made as a result of complaints | MANUAL UPLOAD |
| R2_EV05 | Patient feedback mechanisms or tools used to gather concerns and feedback | CONSENTZ |

---

#### R3 — Timely Access (Aesthetic Clinic specific)

**Key Question:** "How do people access care in a timely way?"

**Description:** This KLOE is about whether patients can access appointments in a timely way and whether the clinic monitors delays, availability, and missed appointments.

**Regulations:**
- Reg 12 — Safe care and treatment
- Reg 9 — Person-centred care
- Reg 17 — Good governance

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| R3_EV01 | Appointment availability data showing slots, booking volumes, or scheduling capacity | CONSENTZ |
| R3_EV02 | Waiting time data showing the time between booking and appointment or treatment | CONSENTZ |
| R3_EV03 | DNA rate data and follow-up actions for missed appointments | CONSENTZ |
| R3_EV04 | Evidence showing urgent appointment availability where relevant | CONSENTZ |
| R3_EV05 | Out-of-hours arrangements or related access information | POLICY |
| R3_EV06 | Patient feedback relating to access and responsiveness | CONSENTZ |

---

### WELL-LED DOMAIN — Aesthetic Clinics

#### W1 — Leadership

**Key Question:** "Is there leadership capacity and capability to deliver high-quality care?"

**Description:** This KLOE is about whether the clinic has competent leaders, appropriate oversight, and people in place who are fit to run the service.

**Regulations:**
- Reg 7 — Requirements relating to registered managers
- Reg 17 — Good governance
- Reg 5 — Fit and proper persons: directors

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| W1_EV01 | An organisational structure chart showing key roles and reporting lines | MANUAL UPLOAD |
| W1_EV02 | Records showing leader qualifications, experience, or relevant professional background | MANUAL UPLOAD |
| W1_EV03 | Fit and proper person checks for directors or senior leaders where applicable | MANUAL UPLOAD |
| W1_EV04 | Succession planning or contingency planning documentation for leadership continuity | MANUAL UPLOAD |
| W1_EV05 | Staff feedback relating to leadership quality or visibility | MANUAL UPLOAD |

---

#### W2 — Vision & Strategy

**Key Question:** "Is there a clear vision and strategy?"

**Description:** This KLOE is about whether the clinic has a defined direction, clear values, and a plan for maintaining or improving quality.

**Regulations:**
- Reg 17 — Good governance

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| W2_EV01 | A written vision or mission statement setting out the clinic's purpose and direction | POLICY |
| W2_EV02 | A business plan or strategic plan | MANUAL UPLOAD |
| W2_EV03 | Records showing stakeholder engagement in strategy where relevant | MANUAL UPLOAD |
| W2_EV04 | Evidence that the vision and strategy are communicated to staff | MANUAL UPLOAD |
| W2_EV05 | Progress review records showing how strategy is tracked over time | MANUAL UPLOAD |

---

#### W3 — Culture

**Key Question:** "Is there a culture of high-quality, person-centred care?"

**Description:** This KLOE is about whether the culture is open, honest, patient-focused, and supportive of speaking up and improvement.

**Regulations:**
- Reg 17 — Good governance
- Reg 20 — Duty of candour
- Reg 10 — Dignity and respect

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| W3_EV01 | Evidence that staff are aware of whistleblowing arrangements and how to raise concerns | MANUAL UPLOAD |
| W3_EV02 | Staff engagement surveys and related action records | MANUAL UPLOAD |
| W3_EV03 | Patient engagement or service-user feedback records | CONSENTZ |
| W3_EV04 | Evidence of openness and transparency in the culture of the clinic | MANUAL UPLOAD |
| W3_EV05 | Records showing recognition or support of staff contributions | MANUAL UPLOAD |

---

#### W4 — Accountability

**Key Question:** "Are there clear responsibilities and systems for accountability?"

**Description:** This KLOE is about whether governance responsibilities are clearly assigned and whether formal oversight systems are in place.

**Regulations:**
- Reg 17 — Good governance
- Reg 20A — Requirement as to display of performance assessments

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| W4_EV01 | Governance meeting minutes showing regular oversight of quality and compliance | MANUAL UPLOAD |
| W4_EV02 | Audit schedules and audit reports | MANUAL UPLOAD |
| W4_EV03 | A policy review schedule showing review dates and ownership | MANUAL UPLOAD |
| W4_EV04 | Job descriptions showing clear responsibilities and accountability | MANUAL UPLOAD |
| W4_EV05 | Evidence that CQC ratings are displayed where required | MANUAL UPLOAD |

---

#### W5 — Risk & Performance

**Key Question:** "Are there clear processes for managing risks and performance?"

**Description:** This KLOE is about whether the clinic monitors risk, performance, and improvement in a structured and ongoing way.

**Regulations:**
- Reg 17 — Good governance
- Reg 12 — Safe care and treatment
- Reg 20 — Duty of candour

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| W5_EV01 | A risk register showing identified risks, owners, controls, and mitigations | MANUAL UPLOAD |
| W5_EV02 | A business continuity plan covering disruption scenarios and recovery arrangements | MANUAL UPLOAD |
| W5_EV03 | Performance dashboards or KPI reporting showing how the clinic tracks operational performance | CONSENTZ |
| W5_EV04 | Records of regular compliance checks or monitoring activity | MANUAL UPLOAD |
| W5_EV05 | Evidence of continuous improvement work or tracked improvements over time | CONSENTZ / MANUAL |

---

#### W6 — Information Management

**Key Question:** "Is information effectively managed?"

**Description:** This KLOE is about whether information governance, data protection, and use of data are managed properly and securely.

**Regulations:**
- Reg 17 — Good governance

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| W6_EV01 | ICO registration details where required | MANUAL UPLOAD |
| W6_EV02 | GDPR-related policies covering data protection and privacy | POLICY |
| W6_EV03 | Data security policies or records showing secure information handling and IT controls | MANUAL UPLOAD |
| W6_EV04 | Clinical audit results and records showing use of data for quality improvement | MANUAL UPLOAD |
| W6_EV05 | Records showing compliance with accessibility or information standards where relevant | MANUAL UPLOAD |

---

## SECTION 2: CARE HOMES

### SAFE DOMAIN — Care Homes

#### S1 — Safeguarding

**Key Question:** "How do systems, processes and practices safeguard people from abuse?"

**Description:** This KLOE is about whether the care home has proper safeguarding systems, trained staff, and clear processes to protect residents from abuse or neglect.

**Regulations:**
- Reg 13 — Safeguarding service users from abuse and improper treatment
- Reg 12 — Safe care and treatment
- Reg 19 — Fit and proper persons employed
- Reg 10 — Dignity and respect

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| S1_CH_EV01 | A safeguarding policy aligned with local Safeguarding Adults Board procedures | POLICY |
| S1_CH_EV02 | Evidence showing all staff have completed safeguarding training and remain in date | MANUAL UPLOAD |
| S1_CH_EV03 | DBS checks for all relevant staff members | MANUAL UPLOAD |
| S1_CH_EV04 | A safeguarding referral log showing concerns raised and referrals made | MANUAL UPLOAD |
| S1_CH_EV05 | Protection plans for residents identified as being at risk | MANUAL UPLOAD |
| S1_CH_EV06 | Staff recruitment files showing Schedule 3 or equivalent safer recruitment checks | MANUAL UPLOAD |
| S1_CH_EV07 | Evidence showing residents know how to raise concerns or report abuse | MANUAL UPLOAD |

---

#### S2 — Risk Assessment (Care Home)

**Key Question:** "How are risks assessed and managed while respecting people's freedom?"

**Description:** This KLOE is about whether risks to residents are assessed properly and managed in a way that keeps them safe without unnecessarily restricting them.

**Regulations:**
- Reg 12 — Safe care and treatment
- Reg 13 — Safeguarding service users from abuse and improper treatment
- Reg 15 — Premises and equipment
- Reg 17 — Good governance

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| S2_CH_EV01 | Individual risk assessments covering falls, mobility, pressure ulcers, choking, nutrition, and moving and handling | MANUAL UPLOAD |
| S2_CH_EV02 | Care plans showing how risks are managed while still respecting resident choice and independence | MANUAL UPLOAD |
| S2_CH_EV03 | Accident and incident records showing what happened and what actions were taken | MANUAL UPLOAD |
| S2_CH_EV04 | DoLS applications and authorisations where applicable | MANUAL UPLOAD |
| S2_CH_EV05 | A restraint policy showing the use of least restrictive practice | POLICY |
| S2_CH_EV06 | Environmental risk assessments for the premises | MANUAL UPLOAD |
| S2_CH_EV07 | Fire risk assessments and records of fire drills | MANUAL UPLOAD |

---

#### S3 — Staffing (Care Home)

**Key Question:** "Are there sufficient suitable staff to keep people safe?"

**Description:** This KLOE is about whether the home has enough competent staff on duty, with the right skills and support to care for residents safely.

**Regulations:**
- Reg 18 — Staffing
- Reg 12 — Safe care and treatment
- Reg 19 — Fit and proper persons employed

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| S3_CH_EV01 | Dependency or acuity assessments showing how staffing levels are determined based on resident needs | MANUAL UPLOAD |
| S3_CH_EV02 | Duty rotas showing planned staffing levels compared with actual staffing levels | MANUAL UPLOAD |
| S3_CH_EV03 | Agency staff induction records showing temporary staff are safely oriented before working | MANUAL UPLOAD |
| S3_CH_EV04 | A training matrix showing mandatory and role-specific training compliance | MANUAL UPLOAD |
| S3_CH_EV05 | Competency assessment records for key care tasks | MANUAL UPLOAD |
| S3_CH_EV06 | Staff feedback records relating to workload and staffing sufficiency | MANUAL UPLOAD |
| S3_CH_EV07 | Resident or family feedback on staff availability and responsiveness | MANUAL UPLOAD |

---

#### S4 — Medicines (Care Home)

**Key Question:** "How is proper and safe use of medicines ensured?"

**Description:** This KLOE is about whether medicines are stored, recorded, administered, and reviewed safely within the home.

**Regulations:**
- Reg 12 — Safe care and treatment
- Reg 9 — Person-centred care

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| S4_CH_EV01 | A medicines management policy aligned with relevant guidance for care homes | POLICY |
| S4_CH_EV02 | MAR charts showing medicines administered accurately and signed correctly | MANUAL UPLOAD |
| S4_CH_EV03 | Controlled drugs registers with evidence of required checks | MANUAL UPLOAD |
| S4_CH_EV04 | Room and fridge temperature logs for medicines storage | MANUAL UPLOAD |
| S4_CH_EV05 | Medication audit records showing regular review of medicines management | MANUAL UPLOAD |
| S4_CH_EV06 | Staff competency assessments for medicines administration | MANUAL UPLOAD |
| S4_CH_EV07 | Covert medication policy and related MCA assessments where relevant | MANUAL UPLOAD |
| S4_CH_EV08 | Self-administration risk assessments where residents manage their own medicines | MANUAL UPLOAD |

---

#### S5 — Infection Control (Care Home)

**Key Question:** "How well are people protected by infection prevention and control?"

**Description:** This KLOE is about whether the home has effective infection control systems, including cleaning, outbreak management, hygiene, and safe environmental practices.

**Regulations:**
- Reg 12 — Safe care and treatment
- Reg 15 — Premises and equipment

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| S5_CH_EV01 | An infection prevention and control policy that includes outbreak management | POLICY |
| S5_CH_EV02 | Cleaning schedules and deep cleaning records | MANUAL UPLOAD |
| S5_CH_EV03 | Laundry and waste management procedures and records | MANUAL UPLOAD |
| S5_CH_EV04 | Hand hygiene audit results | MANUAL UPLOAD |
| S5_CH_EV05 | PPE availability and stock records | MANUAL UPLOAD |
| S5_CH_EV06 | Outbreak response logs where outbreaks or infection events have occurred | MANUAL UPLOAD |
| S5_CH_EV07 | Staff vaccination records where these are tracked as part of infection control practice | MANUAL UPLOAD |
| S5_CH_EV08 | Environmental infection control audit records | MANUAL UPLOAD |

---

#### S6 — Learning from Incidents (Care Home)

**Key Question:** "Are lessons learned when things go wrong?"

**Description:** This KLOE is about whether the home reviews incidents, complaints, and errors properly and then uses that learning to improve care.

**Regulations:**
- Reg 17 — Good governance
- Reg 20 — Duty of candour

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| S6_CH_EV01 | Incident analysis records showing how incidents are reviewed and understood | MANUAL UPLOAD |
| S6_CH_EV02 | Evidence showing changes or improvements made after incidents or errors | MANUAL UPLOAD |
| S6_CH_EV03 | Staff meeting records showing learning is shared across the team | MANUAL UPLOAD |
| S6_CH_EV04 | Quality improvement plans linked to issues identified through incidents or concerns | MANUAL UPLOAD |
| S6_CH_EV05 | Evidence showing that complaints are considered as part of the wider learning process | MANUAL UPLOAD |
| S6_CH_EV06 | Duty of candour letters or records where applicable | MANUAL UPLOAD |
| S6_CH_EV07 | Re-audit records showing that changes were later reviewed to confirm improvement | MANUAL UPLOAD |

---

### EFFECTIVE DOMAIN — Care Homes

#### E1 — Needs Assessment (Care Home)

**Key Question:** "Are needs assessed and care delivered according to best practice?"

**Description:** This KLOE is about whether residents' needs are assessed properly before and during care, and whether care is delivered according to good practice.

**Regulations:**
- Reg 9 — Person-centred care
- Reg 12 — Safe care and treatment
- Reg 14 — Meeting nutritional and hydration needs

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| E1_CH_EV01 | Pre-admission assessments showing that the home assessed needs before accepting the resident | MANUAL UPLOAD |
| E1_CH_EV02 | Person-centred care plans reflecting medical, emotional, and practical care needs | MANUAL UPLOAD |
| E1_CH_EV03 | Evidence showing use of NICE or other relevant care guidance | MANUAL UPLOAD |
| E1_CH_EV04 | Regular care plan review records | MANUAL UPLOAD |
| E1_CH_EV05 | Outcome monitoring records showing how care effectiveness is reviewed | MANUAL UPLOAD |
| E1_CH_EV06 | MDT or other professional involvement records where relevant | MANUAL UPLOAD |

---

#### E2 — Staff Skills (Care Home)

**Key Question:** "Do staff have the skills and knowledge to deliver effective care?"

**Description:** This KLOE is about whether staff are properly recruited, inducted, trained, supervised, and supported to provide effective care.

**Regulations:**
- Reg 18 — Staffing
- Reg 19 — Fit and proper persons employed

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| E2_CH_EV01 | Staff recruitment files including qualifications and checks | MANUAL UPLOAD |
| E2_CH_EV02 | Induction records, including Care Certificate induction where applicable | MANUAL UPLOAD |
| E2_CH_EV03 | Training matrix covering mandatory and service-specific training | MANUAL UPLOAD |
| E2_CH_EV04 | Supervision records | MANUAL UPLOAD |
| E2_CH_EV05 | Appraisal records | MANUAL UPLOAD |
| E2_CH_EV06 | Professional registration checks where relevant | MANUAL UPLOAD |

---

#### E3 — Nutrition & Hydration (Care Home)

**Key Question:** "How are people supported to eat and drink enough?"

**Description:** This KLOE is about whether residents' nutrition and hydration needs are assessed, monitored, and supported properly.

**Regulations:**
- Reg 14 — Meeting nutritional and hydration needs
- Reg 12 — Safe care and treatment
- Reg 9 — Person-centred care

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| E3_CH_EV01 | MUST nutritional screening records completed on admission and reviewed as needed | MANUAL UPLOAD |
| E3_CH_EV02 | Dietary care plans showing preferences, risks, and support needs | MANUAL UPLOAD |
| E3_CH_EV03 | Food and fluid charts for residents who require monitoring | MANUAL UPLOAD |
| E3_CH_EV04 | Weight monitoring records | MANUAL UPLOAD |
| E3_CH_EV05 | Menu planning records or evidence of varied and suitable meal provision | MANUAL UPLOAD |
| E3_CH_EV06 | SALT referral records for residents with swallowing difficulties where applicable | MANUAL UPLOAD |
| E3_CH_EV07 | Staff training records relating to nutrition, hydration, or dysphagia | MANUAL UPLOAD |

---

#### E4 — Working Together (Care Home)

**Key Question:** "How do staff, teams and services work together?"

**Description:** This KLOE is about whether the home works effectively with internal teams and external health and care professionals.

**Regulations:**
- Reg 9 — Person-centred care
- Reg 17 — Good governance

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| E4_CH_EV01 | GP visit records and communication records | MANUAL UPLOAD |
| E4_CH_EV02 | District nurse liaison or specialist involvement records | MANUAL UPLOAD |
| E4_CH_EV03 | Pharmacy review documentation | MANUAL UPLOAD |
| E4_CH_EV04 | Hospital discharge coordination records | MANUAL UPLOAD |
| E4_CH_EV05 | MDT involvement records for residents with complex needs | MANUAL UPLOAD |
| E4_CH_EV06 | Information-sharing protocols where needed | POLICY |
| E4_CH_EV07 | Shift handover records | MANUAL UPLOAD |

---

#### E5 — Healthier Lives (Care Home)

**Key Question:** "How are people supported to live healthier lives?"

**Description:** This KLOE is about whether the home supports residents' broader health, wellbeing, mobility, and preventative care needs.

**Regulations:**
- Reg 9 — Person-centred care

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| E5_CH_EV01 | Records showing access to health screening such as dental, optical, or hearing support | MANUAL UPLOAD |
| E5_CH_EV02 | GP and specialist access records | MANUAL UPLOAD |
| E5_CH_EV03 | Health promotion or wellbeing activity records | MANUAL UPLOAD |
| E5_CH_EV04 | Exercise, mobility, or rehabilitation support records where relevant | MANUAL UPLOAD |
| E5_CH_EV05 | Mental health and emotional wellbeing support records | MANUAL UPLOAD |
| E5_CH_EV06 | Social engagement or activity programme records | MANUAL UPLOAD |

---

#### E6 — Consent (Care Home)

**Key Question:** "Is consent sought in line with legislation?"

**Description:** This KLOE is about whether residents' decisions, mental capacity, best-interest decisions, and lawful authorisations are handled correctly.

**Regulations:**
- Reg 11 — Need for consent
- Reg 9 — Person-centred care

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| E6_CH_EV01 | A consent policy aligned with the Mental Capacity Act | POLICY |
| E6_CH_EV02 | Capacity assessment records | MANUAL UPLOAD |
| E6_CH_EV03 | Best-interest decision records | MANUAL UPLOAD |
| E6_CH_EV04 | DoLS applications and authorisations | MANUAL UPLOAD |
| E6_CH_EV05 | Advance decision documentation where relevant | MANUAL UPLOAD |
| E6_CH_EV06 | Lasting Power of Attorney records where relevant | MANUAL UPLOAD |
| E6_CH_EV07 | Staff training records for MCA and DoLS | MANUAL UPLOAD |

---

### CARING DOMAIN — Care Homes

#### C1 — Kindness & Compassion (Care Home)

**Key Question:** "Are people treated with kindness, compassion and given emotional support?"

**Description:** This KLOE is about whether residents are treated respectfully, warmly, and with emotional support appropriate to their needs.

**Regulations:**
- Reg 10 — Dignity and respect
- Reg 9 — Person-centred care

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| C1_CH_EV01 | Resident and family feedback records | MANUAL UPLOAD |
| C1_CH_EV02 | Compliments records or positive feedback logs | MANUAL UPLOAD |
| C1_CH_EV03 | Staff training relating to person-centred care or dignity | MANUAL UPLOAD |
| C1_CH_EV04 | Records or examples showing emotional support is provided appropriately | MANUAL UPLOAD |
| C1_CH_EV05 | Dementia-friendly care approach documentation where relevant | MANUAL UPLOAD |
| C1_CH_EV06 | Bereavement or emotional support records where relevant | MANUAL UPLOAD |

---

#### C2 — Involvement in Decisions (Care Home)

**Key Question:** "Are people supported to express their views and be involved in decisions?"

**Description:** This KLOE is about whether residents and, where appropriate, families are involved in decisions about care and daily life.

**Regulations:**
- Reg 9 — Person-centred care
- Reg 10 — Dignity and respect

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| C2_CH_EV01 | Residents' meeting minutes | MANUAL UPLOAD |
| C2_CH_EV02 | Care plan involvement records or signatures showing resident or family participation | MANUAL UPLOAD |
| C2_CH_EV03 | Communication aids used for residents with communication difficulties | MANUAL UPLOAD |
| C2_CH_EV04 | Advocacy referral records where relevant | MANUAL UPLOAD |
| C2_CH_EV05 | Family involvement records where appropriate | MANUAL UPLOAD |
| C2_CH_EV06 | Personal profile documents such as "This Is Me" or equivalent | MANUAL UPLOAD |

---

#### C3 — Privacy & Dignity (Care Home)

**Key Question:** "How are privacy and dignity respected?"

**Description:** This KLOE is about whether residents' personal privacy, dignity, and individual preferences are respected in everyday care.

**Regulations:**
- Reg 10 — Dignity and respect
- Reg 15 — Premises and equipment

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| C3_CH_EV01 | A dignity and privacy policy | POLICY |
| C3_CH_EV02 | Records or evidence showing staff knock and wait before entering private rooms | MANUAL UPLOAD |
| C3_CH_EV03 | Records showing personal care is delivered privately and respectfully | MANUAL UPLOAD |
| C3_CH_EV04 | Confidentiality and secure records handling arrangements | MANUAL UPLOAD |
| C3_CH_EV05 | Evidence showing respect for personal belongings and private space | MANUAL UPLOAD |
| C3_CH_EV06 | Records showing gender preferences or personal preferences are respected where relevant | MANUAL UPLOAD |

---

### RESPONSIVE DOMAIN — Care Homes

#### R1 — Personalised Care (Care Home)

**Key Question:** "How do people receive personalised care responsive to their needs?"

**Description:** This KLOE is about whether care is adapted to the individual's preferences, routines, identity, and changing needs.

**Regulations:**
- Reg 9 — Person-centred care
- Reg 10 — Dignity and respect

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| R1_CH_EV01 | Detailed personal profiles or "All About Me" style documents | MANUAL UPLOAD |
| R1_CH_EV02 | Care plans reflecting individual preferences, routines, and needs | MANUAL UPLOAD |
| R1_CH_EV03 | Records showing flexible daily routines where appropriate | MANUAL UPLOAD |
| R1_CH_EV04 | Meaningful activities programme records | MANUAL UPLOAD |
| R1_CH_EV05 | Records showing cultural, religious, or personal identity needs are supported | MANUAL UPLOAD |
| R1_CH_EV06 | Reasonable adjustment records where relevant | MANUAL UPLOAD |

---

#### R2 — Complaints (Care Home)

**Key Question:** "How are concerns and complaints gathered and acted upon?"

**Description:** This KLOE is about whether residents and families can raise complaints easily and whether the home responds properly and improves as a result.

**Regulations:**
- Reg 16 — Receiving and acting on complaints
- Reg 17 — Good governance

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| R2_CH_EV01 | A complaints policy explaining how concerns and complaints are handled | POLICY |
| R2_CH_EV02 | A complaints log showing complaints raised, investigations, and outcomes | MANUAL UPLOAD |
| R2_CH_EV03 | Complaint response letters or equivalent response records | MANUAL UPLOAD |
| R2_CH_EV04 | Evidence showing improvements made as a result of complaints | MANUAL UPLOAD |
| R2_CH_EV05 | Records of informal concerns or low-level issues where these are tracked | MANUAL UPLOAD |
| R2_CH_EV06 | "You said, we did" or equivalent improvement communication records | MANUAL UPLOAD |

---

#### R3 — End of Life Care (Care Home specific)

**Key Question:** "How are people supported at end of life?"

**Description:** This KLOE is about whether residents at end of life are supported with dignity, comfort, planning, and appropriate clinical coordination.

**Regulations:**
- Reg 9 — Person-centred care
- Reg 10 — Dignity and respect
- Reg 11 — Need for consent

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| R3_CH_EV01 | Advance care plans documenting wishes and preferences | MANUAL UPLOAD |
| R3_CH_EV02 | DNACPR forms completed appropriately where relevant | MANUAL UPLOAD |
| R3_CH_EV03 | Preferred place of death records where discussed and documented | MANUAL UPLOAD |
| R3_CH_EV04 | Pain assessment records such as Abbey Pain Scale or equivalent | MANUAL UPLOAD |
| R3_CH_EV05 | Symptom management protocols or records | MANUAL UPLOAD |
| R3_CH_EV06 | Anticipatory medication arrangements where relevant | MANUAL UPLOAD |
| R3_CH_EV07 | Family involvement records and communication records during end-of-life care | MANUAL UPLOAD |
| R3_CH_EV08 | Records showing comfort and dignity measures taken | MANUAL UPLOAD |
| R3_CH_EV09 | Bereavement support records for families where relevant | MANUAL UPLOAD |
| R3_CH_EV10 | Collaboration records with hospice or palliative care teams where relevant | MANUAL UPLOAD |

---

### WELL-LED DOMAIN — Care Homes

#### W1 — Leadership (Care Home)

**Key Question:** "Is there leadership capacity and capability?"

**Description:** This KLOE is about whether the home has capable management, visible leadership, and continuity of oversight.

**Regulations:**
- Reg 7 — Requirements relating to registered managers
- Reg 17 — Good governance

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| W1_CH_EV01 | Records showing a registered manager is in post where required | MANUAL UPLOAD |
| W1_CH_EV02 | Leadership training records for managers or senior staff | MANUAL UPLOAD |
| W1_CH_EV03 | Fit and proper person declarations or checks where relevant | MANUAL UPLOAD |
| W1_CH_EV04 | Succession planning or contingency arrangements for leadership continuity | MANUAL UPLOAD |
| W1_CH_EV05 | Staff feedback relating to management quality or support | MANUAL UPLOAD |
| W1_CH_EV06 | Evidence showing manager visibility and leadership presence within the home | MANUAL UPLOAD |

---

#### W2 — Vision & Strategy (Care Home)

**Key Question:** "Is there a clear vision and strategy?"

**Description:** This KLOE is about whether the home has clear values, direction, and a strategy for maintaining and improving care quality.

**Regulations:**
- Reg 17 — Good governance

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| W2_CH_EV01 | A written vision and values statement | POLICY |
| W2_CH_EV02 | A business plan or strategic plan | MANUAL UPLOAD |
| W2_CH_EV03 | Records showing staff involvement in developing or understanding the vision | MANUAL UPLOAD |
| W2_CH_EV04 | Evidence showing the vision is communicated throughout the service | MANUAL UPLOAD |
| W2_CH_EV05 | Evidence showing values are reflected in practice or reviewed over time | MANUAL UPLOAD |

---

#### W3 — Culture (Care Home)

**Key Question:** "Is there a culture of high-quality, person-centred care?"

**Description:** This KLOE is about whether the culture is open, respectful, resident-focused, and supportive of speaking up and continuous improvement.

**Regulations:**
- Reg 17 — Good governance
- Reg 20 — Duty of candour

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| W3_CH_EV01 | Evidence of an open and honest culture, including how concerns are discussed | MANUAL UPLOAD |
| W3_CH_EV02 | A whistleblowing policy and evidence that staff know how to use it | POLICY |
| W3_CH_EV03 | Staff survey records and related actions | MANUAL UPLOAD |
| W3_CH_EV04 | Residents' meeting records showing engagement and involvement | MANUAL UPLOAD |
| W3_CH_EV05 | Relatives' meeting records where relevant | MANUAL UPLOAD |
| W3_CH_EV06 | Community involvement records where relevant | MANUAL UPLOAD |

---

#### W4 — Accountability (Care Home)

**Key Question:** "Are there clear responsibilities and accountability?"

**Description:** This KLOE is about whether governance responsibilities are defined clearly and whether quality and compliance are reviewed formally.

**Regulations:**
- Reg 17 — Good governance
- Reg 20A — Requirement as to display of performance assessments

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| W4_CH_EV01 | Governance meeting schedules and meeting minutes | MANUAL UPLOAD |
| W4_CH_EV02 | Audit programme records and audit results | MANUAL UPLOAD |
| W4_CH_EV03 | A policy register or policy review schedule showing review dates and ownership | MANUAL UPLOAD |
| W4_CH_EV04 | Job descriptions showing clear responsibilities | MANUAL UPLOAD |
| W4_CH_EV05 | Evidence that CQC ratings are displayed as required | MANUAL UPLOAD |
| W4_CH_EV06 | Notification submission records where required for statutory reporting | MANUAL UPLOAD |

---

#### W5 — Risk & Performance (Care Home)

**Key Question:** "Are risks and performance managed effectively?"

**Description:** This KLOE is about whether the home tracks key risks, monitors quality, and follows through on improvement work.

**Regulations:**
- Reg 17 — Good governance

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| W5_CH_EV01 | A risk register showing service risks and mitigation actions | MANUAL UPLOAD |
| W5_CH_EV02 | A business continuity plan covering emergencies and service disruption | MANUAL UPLOAD |
| W5_CH_EV03 | Quality assurance monitoring records | MANUAL UPLOAD |
| W5_CH_EV04 | KPI or performance tracking records where used | MANUAL UPLOAD |
| W5_CH_EV05 | Improvement project records showing active quality improvement work | MANUAL UPLOAD |
| W5_CH_EV06 | External audit or accreditation records where relevant | MANUAL UPLOAD |

---

#### W6 — Partnership Working (Care Home specific)

**Key Question:** "How does the service work in partnership with other agencies?"

**Description:** This KLOE is about whether the home works effectively with healthcare professionals, local authorities, and other relevant partners.

**Regulations:**
- Reg 17 — Good governance
- Reg 9 — Person-centred care

**Evidence Items:**

| ID | Description | Type |
|---|---|---|
| W6_CH_EV01 | Regular GP liaison records | MANUAL UPLOAD |
| W6_CH_EV02 | District nurse and specialist visit records | MANUAL UPLOAD |
| W6_CH_EV03 | Social worker involvement records where relevant | MANUAL UPLOAD |
| W6_CH_EV04 | Hospital liaison records for admissions and discharges | MANUAL UPLOAD |
| W6_CH_EV05 | Local authority monitoring or contract review records where relevant | MANUAL UPLOAD |
| W6_CH_EV06 | Community group engagement records where relevant | MANUAL UPLOAD |
| W6_CH_EV07 | Volunteer programme records where relevant | MANUAL UPLOAD |

---

## KEY DIFFERENCES BETWEEN SERVICE TYPES — SUMMARY

| Aspect | Aesthetic Clinics | Care Homes |
|---|---|---|
| S3 Focus | Safe information access for staff | Sufficient staffing levels and dependency tools |
| E3 | Usually N/A (toggle to exclude from scoring) | Central requirement — MUST screening, food/fluid charts, mealtimes |
| E6 Consent | Cooling-off periods, procedure consent | DoLS, LPA, MCA, best interests, capacity assessments |
| R3 | Timely access — waiting times, appointment availability, DNAs | End of life — advance care plans, DNACPR, Abbey Pain Scale, bereavement |
| W6 | Information governance — ICO, GDPR, data security | Partnership working — GP liaison, social workers, hospital discharge |
| CONSENTZ items | Many E1, E5, E6, R1, R3 items auto-populate from CRM | Minimal CONSENTZ auto-population (mostly MANUAL UPLOAD) |

---

## IMPACT ON ASSESSMENT ENGINE

The assessment engine's question bank (07-ASSESSMENT-ENGINE.md) is **separate** from this evidence mapping and does NOT need to change. The assessment questions ask about compliance posture ("Do you have X?"), while the evidence items are the **proof** that backs up those answers.

However, the **KLOE completion percentage** on the KLOE detail page should now be calculated as:

```
KLOE Completion % = (completed evidence items / total evidence items) × 100
```

This REPLACES the old generic checklist completion. The assessment score (from the assessment engine) and the evidence completion percentage are both shown on the KLOE detail page but are **distinct metrics**:

- **Assessment Score** = Based on question answers + evidence quality + timeliness factors (as per 07-ASSESSMENT-ENGINE.md)
- **Evidence Completion %** = Based on how many of the specific evidence items for this KLOE have been provided

The evidence quality factor in the scoring engine should now use the `kloe_evidence_status` table to calculate a more accurate quality factor per domain, replacing the current generic evidence count approach.

---

## IMPLEMENTATION CHECKLIST

1. **Create `lib/constants/kloe-evidence-requirements.ts`** — Define all KLOE definitions with evidence items, descriptions, regulations, and evidence types for both service types exactly as specified above
2. **Create `kloe_evidence_status` database table** — Track per-org evidence item completion
3. **Update KLOE detail page component** — Replace generic checklist with specific evidence items, add KLOE description, show all regulations, display evidence type badges
4. **Add evidence type badge component** — POLICY (blue), MANUAL UPLOAD (amber), CONSENTZ (green), CONSENTZ/MANUAL (teal)
5. **Wire auto-completion logic** — Policy published → mark POLICY items complete; Evidence uploaded → mark MANUAL UPLOAD items; Consentz sync → mark CONSENTZ items
6. **Update KLOE completion percentage calculation** — Use evidence item completion instead of generic checklist
7. **Update evidence quality factor in scoring engine** — Use `kloe_evidence_status` for more accurate scoring
8. **Filter evidence items by service type** — Only show items matching the organisation's service type
9. **Handle E3 N/A toggle for aesthetic clinics** — Allow clinics to mark E3 as not applicable
10. **Handle R3 difference** — Aesthetic clinics see "Timely Access" R3; Care homes see "End of Life" R3
11. **Handle W6 difference** — Aesthetic clinics see "Information Management" W6; Care homes see "Partnership Working" W6
12. **Seed initial `kloe_evidence_status` records** — When an org is created, generate all applicable evidence item records with `not_started` status
