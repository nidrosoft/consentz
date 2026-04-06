# CONSENTZ × CQC COMPLIANCE MODULE — CURSOR IMPLEMENTATION GUIDE

## MASTER CONTEXT

You are building the backend integration for a CQC (Care Quality Commission) Compliance Module that sits on top of the Consentz clinic management platform. The UI is already built in Next.js 15 with TypeScript, Tailwind CSS, and shadcn/ui. Your job is to wire it all up: database, API routes, Consentz API integration, CQC report data feeds, assessment engine, and AI-powered features.

**Stack:** Next.js 15 (App Router), TypeScript, Supabase PostgreSQL, Prisma ORM, Clerk Auth, shadcn/ui, Vercel deployment, Anthropic Claude API (for AI features)

**Two service types only:** Aesthetic Clinics and Care Homes. These use the same CQC framework (5 domains, KLOEs, Regulations) but with very different evidence requirements. NEVER mix care home content into clinics or vice versa.

---

## PHASE 1: DATABASE & CORE MODELS

### Priority: Set up Prisma schema and seed data

Create the database schema with these core models. All tables use UUID primary keys.

```prisma
// Organization — the clinic or care home
model Organization {
  id              String   @id @default(uuid())
  name            String
  serviceType     ServiceType // AESTHETIC_CLINIC or CARE_HOME
  consentzClinicId Int?    // maps to Consentz clinic.id
  cqcRegistrationNumber String?
  address         String?
  phone           String?
  email           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  members         OrganizationMember[]
  assessments     Assessment[]
  evidenceItems   EvidenceItem[]
  policies        Policy[]
  incidents       Incident[]
  tasks           Task[]
  complianceScores ComplianceScore[]
  consentzSyncLog  ConsentzSyncLog[]
}

enum ServiceType {
  AESTHETIC_CLINIC
  CARE_HOME
}

// Users within an organization
model OrganizationMember {
  id             String   @id @default(uuid())
  clerkUserId    String
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  role           UserRole
  fullName       String
  email          String
  jobTitle       String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

enum UserRole {
  SUPER_ADMIN
  COMPLIANCE_MANAGER
  DEPARTMENT_LEAD
  STAFF_MEMBER
  AUDITOR
}

// CQC Domain reference data
model CqcDomain {
  id          String @id @default(uuid())
  code        String @unique // "safe", "effective", "caring", "responsive", "well_led"
  name        String // "Safe", "Effective", "Caring", "Responsive", "Well-Led"
  description String
  icon        String // icon identifier for badges
  color       String // hex color for badges
  sortOrder   Int
  kloes       Kloe[]
}

// Key Lines of Enquiry
model Kloe {
  id            String   @id @default(uuid())
  code          String   @unique // "S1", "S2", "E1", etc.
  domainId      String
  domain        CqcDomain @relation(fields: [domainId], references: [id])
  question      String   // "How do systems keep people safe?"
  description   String?
  serviceTypes  ServiceType[] // which service types this KLOE applies to
  regulations   KloeRegulation[]
  evidenceRequirements EvidenceRequirement[]
  assessmentQuestions  AssessmentQuestion[]
  sortOrder     Int
}

// Regulations (Fundamental Standards)
model Regulation {
  id          String @id @default(uuid())
  code        String @unique // "reg_9", "reg_10", etc.
  number      Int    // 9, 10, 11...
  name        String // "Person-centred care"
  description String
  prosecutable Boolean @default(false)
  kloes       KloeRegulation[]
}

model KloeRegulation {
  id           String @id @default(uuid())
  kloeId       String
  kloe         Kloe @relation(fields: [kloeId], references: [id])
  regulationId String
  regulation   Regulation @relation(fields: [regulationId], references: [id])
  @@unique([kloeId, regulationId])
}

// Evidence requirements per KLOE per service type
model EvidenceRequirement {
  id          String @id @default(uuid())
  kloeId      String
  kloe        Kloe @relation(fields: [kloeId], references: [id])
  serviceType ServiceType
  title       String // "Safeguarding policy aligned with local authority protocols"
  description String?
  category    EvidenceCategory
  sortOrder   Int
}

enum EvidenceCategory {
  POLICY
  TRAINING_RECORD
  AUDIT_REPORT
  RISK_ASSESSMENT
  INCIDENT_LOG
  CERTIFICATE
  MEETING_MINUTES
  PATIENT_RECORD
  CHECKLIST
  OTHER
}

// Actual evidence uploaded by users
model EvidenceItem {
  id              String   @id @default(uuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  title           String
  description     String?
  fileUrl         String?
  fileName        String?
  fileType        String?
  status          EvidenceStatus @default(VALID)
  expiryDate      DateTime?
  domains         String[] // ["safe", "effective"] — can map to multiple domains
  kloeCode        String?  // primary KLOE this evidence supports
  category        EvidenceCategory
  uploadedBy      String   // clerkUserId
  reviewedBy      String?
  reviewedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum EvidenceStatus {
  VALID
  EXPIRING_SOON
  EXPIRED
  PENDING_REVIEW
  ARCHIVED
}

// Policies (subset of evidence with version control)
model Policy {
  id              String   @id @default(uuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  title           String
  content         String?  // rich text content if AI-generated
  fileUrl         String?
  version         String   @default("1.0")
  status          PolicyStatus @default(DRAFT)
  domains         String[] // CQC domain codes
  lastUpdated     DateTime @default(now())
  nextReviewDate  DateTime?
  createdBy       String
  approvedBy      String?
  approvedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  acknowledgements PolicyAcknowledgement[]
}

enum PolicyStatus {
  DRAFT
  ACTIVE
  UNDER_REVIEW
  ARCHIVED
}

model PolicyAcknowledgement {
  id        String   @id @default(uuid())
  policyId  String
  policy    Policy @relation(fields: [policyId], references: [id])
  userId    String   // clerkUserId
  userName  String
  signedAt  DateTime @default(now())
  @@unique([policyId, userId])
}

// Staff competency and credentials
model StaffCredential {
  id              String   @id @default(uuid())
  organizationId  String
  staffName       String
  staffEmail      String?
  consentzUserId  Int?     // maps to Consentz practitioner id
  credentialType  CredentialType
  credentialName  String   // "BLS", "Level 7 Diploma", "GMC Registration"
  issueDate       DateTime?
  expiryDate      DateTime?
  status          CredentialStatus @default(VALID)
  referenceNumber String?  // GMC number, DBS certificate number, etc.
  fileUrl         String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum CredentialType {
  DBS_CHECK
  GMC_REGISTRATION
  NMC_REGISTRATION
  LEVEL7_DIPLOMA
  AESTHETICS_CERT
  MANDATORY_TRAINING
  CPD
  OTHER
}

enum CredentialStatus {
  VALID
  EXPIRING_SOON
  EXPIRED
  PENDING_VERIFICATION
}

// Incidents and complications
model Incident {
  id              String   @id @default(uuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  incidentType    IncidentType
  title           String
  description     String
  severity        Severity
  status          IncidentStatus @default(OPEN)
  patientName     String?
  patientId       Int?     // Consentz patient ID
  reportedBy      String
  reportedAt      DateTime @default(now())
  resolvedAt      DateTime?
  resolvedBy      String?
  rootCause       String?
  actionsTaken    String?
  lessonsLearned  String?
  domains         String[] // affected CQC domains
  consentzIncidentId Int?  // if synced from Consentz
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum IncidentType {
  INFECTION
  COMPLICATION        // treatment-related adverse events
  PREMISES_INCIDENT   // falls, equipment failure, fire
  SAFEGUARDING
  MEDICATION_ERROR
  DATA_BREACH
  COMPLAINT
  NEAR_MISS
  OTHER
}

enum Severity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum IncidentStatus {
  OPEN
  INVESTIGATING
  ACTIONED
  CLOSED
}

// Tasks / remediation items
model Task {
  id              String   @id @default(uuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  title           String
  description     String?
  status          TaskStatus @default(TODO)
  priority        Priority @default(MEDIUM)
  domains         String[]  // CQC domain codes for badge display
  kloeCode        String?
  assignedTo      String?   // clerkUserId
  assignedToName  String?
  dueDate         DateTime?
  completedAt     DateTime?
  source          TaskSource @default(MANUAL)
  sourceId        String?   // e.g., incident ID or assessment ID
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  COMPLETED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum TaskSource {
  MANUAL
  ASSESSMENT
  INCIDENT
  AI_RECOMMENDATION
  CONSENTZ_SYNC
}

// Assessment engine — stores user responses to KLOE questions
model Assessment {
  id              String   @id @default(uuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  serviceType     ServiceType
  status          AssessmentStatus @default(IN_PROGRESS)
  startedBy       String
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  overallScore    Float?
  responses       AssessmentResponse[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum AssessmentStatus {
  IN_PROGRESS
  COMPLETED
  ARCHIVED
}

model AssessmentQuestion {
  id          String   @id @default(uuid())
  kloeId      String
  kloe        Kloe @relation(fields: [kloeId], references: [id])
  serviceType ServiceType
  question    String
  helpText    String?
  questionType QuestionType @default(YES_NO)
  weight      Float    @default(1.0)
  sortOrder   Int
  responses   AssessmentResponse[]
}

enum QuestionType {
  YES_NO
  SCALE
  MULTIPLE_CHOICE
  TEXT
}

model AssessmentResponse {
  id           String   @id @default(uuid())
  assessmentId String
  assessment   Assessment @relation(fields: [assessmentId], references: [id])
  questionId   String
  question     AssessmentQuestion @relation(fields: [questionId], references: [id])
  answer       String   // "yes", "no", "3", free text
  score        Float?
  notes        String?
  evidenceIds  String[] // linked evidence item IDs
  createdAt    DateTime @default(now())
}

// Compliance scores — computed and stored for dashboard
model ComplianceScore {
  id              String   @id @default(uuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  domainCode      String   // "safe", "effective", etc. or "overall"
  score           Float    // 0-100
  rating          CqcRating
  calculatedAt    DateTime @default(now())
  breakdown       Json?    // detailed score breakdown
}

enum CqcRating {
  OUTSTANDING    // 88-100
  GOOD           // 63-87
  REQUIRES_IMPROVEMENT // 39-62
  INADEQUATE     // 25-38
}

// Consentz data sync tracking
model ConsentzSyncLog {
  id              String   @id @default(uuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  endpoint        String   // which API was called
  syncedAt        DateTime @default(now())
  recordCount     Int?
  status          String   // "success" or "error"
  errorMessage    String?
  responseData    Json?
}
```

### Seed data

Create a seed file that populates:

1. **5 CQC Domains** with codes, names, colors, and icons:
   - Safe (code: "safe", color: "#3B82F6", icon: "Shield")
   - Effective (code: "effective", color: "#10B981", icon: "Target")
   - Caring (code: "caring", color: "#EC4899", icon: "Heart")
   - Responsive (code: "responsive", color: "#F59E0B", icon: "Zap")
   - Well-Led (code: "well_led", color: "#8B5CF6", icon: "Crown")

2. **KLOEs** — see the full KLOE tables below. Each KLOE must specify which service types it applies to:
   - S1-S6, E1-E7, C1-C3, R1-R3, W1-W6
   - R3 for CARE_HOME = "End of life care"
   - R3 for AESTHETIC_CLINIC = "Timely access to care"
   - E3 for CARE_HOME = "Nutrition and hydration" (NOT applicable to most clinics)

3. **13 Regulations** (Reg 9 through Reg 20A) with prosecutable flags

4. **KLOE-to-Regulation mappings** (the system needs to know which regulations underpin each KLOE)

5. **Evidence Requirements** per KLOE per service type — these are the checklists that tell users what documents and evidence they need. Use the full tables from the CONSENTZ X CQC module spec (Tables 1 and 2).

6. **Assessment Questions** — approximately 120 questions mapped to KLOEs, differentiated by service type

---

## PHASE 2: CONSENTZ API INTEGRATION (SDK SERVICE LAYER)

### Architecture

Create a service layer at `lib/consentz/` that wraps all Consentz API calls.

```
lib/consentz/
├── client.ts          // HTTP client with auth headers
├── types.ts           // TypeScript types for all Consentz responses
├── sync-service.ts    // Orchestrates data sync
├── endpoints/
│   ├── auth.ts        // Login, token management
│   ├── patients.ts    // Patient CRUD
│   ├── clinic.ts      // Clinic data, practitioners, treatments
│   ├── appointments.ts // Appointment data
│   ├── staff.ts       // Practitioners and staff
│   └── cqc-reports.ts // All 7 CQC report endpoints
└── mappers/
    ├── consent-mapper.ts
    ├── staff-mapper.ts
    ├── incident-mapper.ts
    └── feedback-mapper.ts
```

### Consentz HTTP Client

```typescript
// lib/consentz/client.ts
const CONSENTZ_BASE_URL = process.env.CONSENTZ_API_URL; // staging.consentz.com or control.consentz.com

interface ConsentzClientConfig {
  sessionToken: string;
  clinicId: number;
}

class ConsentzClient {
  private baseUrl: string;
  private sessionToken: string;
  private clinicId: number;

  constructor(config: ConsentzClientConfig) {
    this.baseUrl = CONSENTZ_BASE_URL;
    this.sessionToken = config.sessionToken;
    this.clinicId = config.clinicId;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'X-SESSION-TOKEN': this.sessionToken,
        'X-APPLICATION-ID': 'laptop',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!response.ok) throw new Error(`Consentz API error: ${response.status}`);
    return response.json();
  }

  // V1 API methods
  async getPatients() { return this.request('/api/v1/patients'); }
  async getPatient(id: number) { return this.request(`/api/v1/patients/${id}`); }
  async getClinic() { return this.request('/api/v1/clinic'); }
  async getPractitioners() { return this.request('/api/v1/clinic/practitioners'); }
  async getTreatments() { return this.request('/api/v1/clinic/treatments'); }
  async getAppointments(practitionerId: number, startDate: string, endDate: string) {
    return this.request(`/api/v1/appointments?practitionerId=${practitionerId}&startDate=${startDate}&endDate=${endDate}`);
  }

  // CQC Report API methods
  async getConsentCompletion(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/consent-completion?${params}`);
  }

  async getConsentDecay(startDate: string, endDate: string, expiringWithinDays = 30, showOnlyExpired = 0) {
    return this.request(
      `/api/v1/clinic/${this.clinicId}/cqc-reports/consent-decay?startDate=${startDate}&endDate=${endDate}&expiringWithinDays=${expiringWithinDays}&showOnlyExpired=${showOnlyExpired}`
    );
  }

  async getStaffCompetency() {
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports`);
  }

  async getIncidentFeed(status?: string, severity?: string) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (severity) params.set('severity', severity);
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/infection-incidents?${params}`);
  }

  async getSafetyChecklist() {
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/safety-checklist`);
  }

  async getPatientFeedback(from: string, to: string) {
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/patient-feedback?from=${from}&to=${to}`);
  }

  async getPolicyAcknowledgement() {
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/policy-acknowledgement`);
  }
}
```

### Polling / Sync Service

Since webhooks are not available, implement a polling-based sync. Create a cron-compatible function that runs periodically (suggested: every 15 minutes for active data, hourly for reports).

```typescript
// lib/consentz/sync-service.ts
export async function syncConsentzData(organizationId: string) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org?.consentzClinicId) return;

  const client = new ConsentzClient({
    sessionToken: await getStoredSessionToken(organizationId),
    clinicId: org.consentzClinicId,
  });

  // Sync in order of priority
  await syncConsentData(client, organizationId);
  await syncStaffCompetency(client, organizationId);
  await syncIncidents(client, organizationId);
  await syncSafetyChecklist(client, organizationId);
  await syncPatientFeedback(client, organizationId);
  await syncPolicyAcknowledgements(client, organizationId);
  await recalculateComplianceScores(organizationId);
}
```

---

## PHASE 3: API ROUTES (Next.js App Router)

### Route structure

```
app/api/
├── auth/
│   └── consentz-login/route.ts     // POST: authenticate with Consentz
├── organizations/
│   └── [orgId]/
│       ├── route.ts                // GET org details
│       ├── members/route.ts        // GET/POST members
│       └── sync/route.ts           // POST: trigger Consentz sync
├── dashboard/
│   └── [orgId]/
│       ├── route.ts                // GET: dashboard summary data
│       ├── compliance-score/route.ts
│       └── domain-scores/route.ts
├── domains/
│   └── [orgId]/
│       └── [domainCode]/
│           ├── route.ts            // GET: domain detail with KLOEs
│           └── kloes/
│               └── [kloeCode]/route.ts  // GET: KLOE detail with evidence
├── evidence/
│   └── [orgId]/
│       ├── route.ts                // GET list / POST new
│       └── [evidenceId]/route.ts   // GET/PUT/DELETE
├── policies/
│   └── [orgId]/
│       ├── route.ts                // GET list / POST new
│       ├── [policyId]/route.ts     // GET/PUT/DELETE
│       ├── [policyId]/acknowledge/route.ts  // POST
│       └── generate/route.ts       // POST: AI generate policy
├── staff/
│   └── [orgId]/
│       ├── route.ts                // GET all staff with credentials
│       ├── credentials/route.ts    // POST new credential
│       └── competency-clock/route.ts // GET: synced from Consentz
├── incidents/
│   └── [orgId]/
│       ├── route.ts                // GET list / POST new
│       └── [incidentId]/route.ts   // GET/PUT (resolve, add root cause)
├── tasks/
│   └── [orgId]/
│       ├── route.ts                // GET list / POST new
│       └── [taskId]/route.ts       // GET/PUT/DELETE
├── assessments/
│   └── [orgId]/
│       ├── route.ts                // GET list / POST start new
│       ├── [assessmentId]/route.ts // GET assessment detail
│       └── [assessmentId]/respond/route.ts // POST answer
├── reports/
│   └── [orgId]/
│       ├── compliance/route.ts     // GET: full compliance report
│       ├── inspection-prep/route.ts // GET: inspection readiness
│       └── export/route.ts         // POST: CSV/PDF export
├── consentz/
│   └── [orgId]/
│       ├── consent-completion/route.ts
│       ├── consent-decay/route.ts
│       ├── staff-competency/route.ts
│       ├── incidents/route.ts
│       ├── safety-checklist/route.ts
│       ├── patient-feedback/route.ts
│       └── policy-acknowledgement/route.ts
└── ai/
    └── [orgId]/
        ├── generate-policy/route.ts    // POST: AI policy generation
        ├── gap-analysis/route.ts       // POST: AI gap analysis
        └── evidence-summary/route.ts   // POST: AI evidence summarizer
```

---

## PHASE 4: DASHBOARD & COMPLIANCE SCORE ENGINE

### Score calculation logic

The dashboard shows an overall compliance score and per-domain scores. Scores are calculated from multiple inputs:

```typescript
// lib/compliance/score-engine.ts

interface ScoreInputs {
  assessmentScore: number;      // from assessment responses (0-100)
  evidenceCoverage: number;     // % of required evidence uploaded and valid
  consentzMetrics: {
    consentCompletionRate: number;   // from Consent Completion API
    staffCompetencyRate: number;     // from Staff Competency Clock
    incidentResolutionRate: number;  // from Incident Feed
    safetyChecklistScore: number;    // from Safety Checklist
    patientFeedbackAvg: number;      // from Patient Feedback
    policyAckRate: number;           // from Policy Acknowledgement
  };
  taskCompletionRate: number;    // % of tasks completed on time
  overdueCriticalItems: number;  // count of overdue critical tasks/evidence
}

function calculateDomainScore(domain: string, inputs: ScoreInputs): number {
  // Weighted formula:
  // 30% assessment answers
  // 25% evidence coverage for this domain
  // 25% Consentz live data metrics (mapped to domain)
  // 15% task completion
  // 5% penalty for overdue critical items

  // Map Consentz metrics to domains:
  // Safe: consent completion + incidents + safety checklist
  // Effective: staff competency + consent decay
  // Caring: patient feedback
  // Responsive: patient feedback + consent completion (timeliness)
  // Well-Led: policy acknowledgement + task completion + all metrics

  let score = (
    inputs.assessmentScore * 0.30 +
    inputs.evidenceCoverage * 0.25 +
    getConsentzMetricForDomain(domain, inputs.consentzMetrics) * 0.25 +
    inputs.taskCompletionRate * 0.15
  );

  // Penalty: each overdue critical item reduces score by 3 points
  score -= inputs.overdueCriticalItems * 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreToRating(score: number): CqcRating {
  if (score >= 88) return 'OUTSTANDING';
  if (score >= 63) return 'GOOD';
  if (score >= 39) return 'REQUIRES_IMPROVEMENT';
  return 'INADEQUATE';
}
```

### Dashboard API response shape

```typescript
// GET /api/dashboard/[orgId]
{
  overallScore: 72,
  predictedRating: "GOOD",       // CQC terminology badge
  complianceQuarter: "Q1 2026",
  openGaps: 8,
  overdueTasks: 3,
  domains: [
    {
      code: "safe",
      name: "Safe",
      score: 78,
      rating: "GOOD",
      icon: "Shield",
      color: "#3B82F6",
      kloeCount: 6,
      completedKloes: 4,
      topGap: "Infection control audit overdue"
    },
    // ... all 5 domains
  ],
  priorityGaps: [
    {
      id: "...",
      title: "DBS checks expiring for 2 staff members",
      domain: "safe",
      kloeCode: "S1",
      severity: "HIGH",
      dueDate: "2026-03-15"
    }
  ],
  upcomingDeadlines: [...],
  recentActivity: [...],
  consentzDataFreshness: "2026-03-07T10:30:00Z" // last sync timestamp
}
```

---

## PHASE 5: CONSENTZ CQC REPORT INTEGRATION

### Mapping Consentz report data to the compliance dashboard

Each CQC report endpoint feeds specific parts of the UI:

**1. Consent Completion → Dashboard "Safe" domain + Consent widget**
- Endpoint: `GET /api/v1/clinic/{clinicId}/cqc-reports/consent-completion`
- Maps to: KLOE E7 (consent), S1 (safeguarding)
- Display: Completion rate chart, breakdown by same-day/existing/partial/none
- Auto-create tasks when completionRate < 90%

**2. Consent Decay → Evidence expiry alerts + Effective domain**
- Endpoint: `GET /api/v1/clinic/{clinicId}/cqc-reports/consent-decay`
- Maps to: KLOE E7 (consent legislation)
- Display: List of patients with expiring/expired consents
- Alert logic: Create task when daysRemaining < 30

**3. Staff Competency Clock → Staff page + Safe/Effective domains**
- Endpoint: `GET /api/v1/clinic/{clinicId}/cqc-reports` (the staff competency endpoint)
- Maps to: KLOE S3 (information for safe care), E2 (staff skills)
- Display: Certificate status buckets (overdue, 30/60/90 day expiry)
- Sync to: StaffCredential model — merge with local credential data
- Auto-create tasks for expiring/overdue certificates

**4. Infection/Incident Feed → Incidents page + Safe domain**
- Endpoint: `GET /api/v1/clinic/{clinicId}/cqc-reports/infection-incidents`
- Maps to: KLOE S5 (infection control), S6 (lessons learned)
- Display: Incident list with severity/status filters, repeat patient flags
- Sync to: Incident model — merge Consentz incidents with locally created ones
- IMPORTANT: incidentType "Infection" is a subset. "Complication" = treatment-related (requires a treatment to have occurred). Other premises incidents are separate.

**5. Emergency Drill/Safety Checklist → Safety page + Safe domain**
- Endpoint: `GET /api/v1/clinic/{clinicId}/cqc-reports/safety-checklist`
- Maps to: KLOE S2 (risk management), Reg 15 (premises)
- Display: Fire drill log, emergency kit status, blockers list
- Auto-create tasks for overdue drills/blocked items

**6. Patient Feedback Pulse → Caring/Responsive domains**
- Endpoint: `GET /api/v1/clinic/{clinicId}/cqc-reports/patient-feedback`
- Maps to: KLOE C1 (compassion), R2 (complaints)
- Display: Score distribution chart, rolling average, feedback list with themes
- Alert logic: Flag negative feedback for review

**7. Policy Acknowledgement → Policies page + Well-Led domain**
- Endpoint: `GET /api/v1/clinic/{clinicId}/cqc-reports/policy-acknowledgement`
- Maps to: KLOE W2 (governance), W3 (culture)
- Display: Per-policy completion rates, signed/unsigned staff lists
- Sync to: Policy model and PolicyAcknowledgement records

**NOT YET AVAILABLE (build UI shell, wire up later):**
- Treatment Risk Heatmap (Report #3) → Maps to Safe domain, KLOE S2

---

## PHASE 6: DOMAIN BADGE SYSTEM

The client specifically requested CQC domain badges throughout the UI. Implement this as a reusable system.

### Domain badge mapping (hardcoded — confirmed by client)

```typescript
// lib/compliance/domain-mapping.ts

// Maps common evidence/task/policy types to their CQC domains
// Items CAN belong to multiple domains
export const DOMAIN_MAPPINGS: Record<string, string[]> = {
  // Safe domain items
  'infection_control': ['safe'],
  'safeguarding': ['safe'],
  'risk_assessment': ['safe'],
  'medication_management': ['safe'],
  'incident_report': ['safe', 'well_led'],
  'fire_safety': ['safe'],
  'dbs_check': ['safe'],
  'emergency_procedures': ['safe'],

  // Effective domain items
  'consent_form': ['effective'],
  'treatment_protocol': ['effective'],
  'staff_training': ['effective', 'safe'],
  'care_plan': ['effective', 'caring'],
  'gmc_registration': ['effective'],
  'competency_assessment': ['effective'],

  // Caring domain items
  'patient_feedback': ['caring', 'responsive'],
  'dignity_policy': ['caring'],
  'privacy_policy': ['caring'],
  'communication_aids': ['caring'],

  // Responsive domain items
  'complaints_procedure': ['responsive'],
  'waiting_times': ['responsive'],
  'accessibility': ['responsive'],
  'end_of_life_care': ['responsive'],  // care homes only

  // Well-Led domain items
  'governance_policy': ['well_led'],
  'meeting_minutes': ['well_led'],
  'audit_report': ['well_led', 'safe'],
  'improvement_plan': ['well_led'],
  'staff_survey': ['well_led'],
  'duty_of_candour': ['well_led', 'safe'],
  'business_continuity': ['well_led'],
};
```

### Badge component usage

Every list item in Evidence, Tasks, Policies, and Incidents should display domain badges. The badge shows the domain icon + color. When a task or evidence item is created, the system auto-suggests domains based on the mapping above, and users can override.

---

## PHASE 7: ASSESSMENT ENGINE

### Flow

1. User selects service type (Aesthetic Clinic or Care Home) during onboarding
2. System loads the appropriate assessment questions (filtered by serviceType)
3. Questions are grouped by KLOE, which are grouped by Domain
4. User progresses through domains: Safe → Effective → Caring → Responsive → Well-Led
5. Each question is Yes/No, Scale (1-5), or Text
6. "Yes" answers score points; "No" flags a gap
7. After completion, the system generates:
   - Per-domain scores
   - Overall compliance score with CQC rating prediction
   - Gap analysis (list of "No" answers mapped to required actions)
   - Auto-generated remediation tasks
   - Linked evidence requirements for each gap

### Scoring

- Each question has a weight (default 1.0, critical questions weighted 1.5-2.0)
- Domain score = (weighted sum of positive answers / maximum possible weighted score) × 100
- Overall score = weighted average of domain scores (equal weight per domain)
- Rating thresholds: Outstanding ≥88, Good ≥63, Requires Improvement ≥39, Inadequate <39

---

## PHASE 8: AI-POWERED FEATURES

### Policy Generation

Use the Anthropic Claude API to generate compliance policies.

```typescript
// app/api/ai/[orgId]/generate-policy/route.ts
// POST body: { policyType: "infection_control", serviceType: "AESTHETIC_CLINIC" }

const systemPrompt = `You are a UK healthcare compliance expert specializing in CQC regulations.
Generate a professional, CQC-inspection-ready policy document for a ${serviceType}.
The policy must reference specific CQC regulations and KLOEs.
Include: Purpose, Scope, Responsibilities, Procedures, Monitoring, Review Date.
Use formal but accessible language. Do NOT include patient names or specific identifiers.`;

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  system: systemPrompt,
  messages: [{ role: 'user', content: `Generate a ${policyType} policy for our ${serviceType}.` }],
});
```

### Gap Analysis AI

After assessment completion or on-demand, use AI to analyze gaps and generate actionable recommendations.

### Evidence Summary

AI-powered summarization of uploaded evidence for inspection preparation. When a user clicks "Prepare for Inspection" on a domain, the system:
1. Gathers all evidence items for that domain
2. Summarizes key findings
3. Identifies remaining gaps
4. Generates a "talking points" brief for the inspector conversation

---

## PHASE 9: USER NAVIGATION & PAGES

### Sidebar Navigation

```
📊 Dashboard
📋 Domains
  ├─ 🛡️ Safe
  ├─ 🎯 Effective
  ├─ 💗 Caring
  ├─ ⚡ Responsive
  └─ 👑 Well-Led
📁 Evidence Library
📜 Policies
👥 Staff & Credentials
⚠️ Incidents
✅ Tasks
📊 Reports
  ├─ Compliance Report
  ├─ Inspection Preparation
  └─ Data Export
⚙️ Settings
  ├─ Organization
  ├─ Team Members
  ├─ Integrations (Consentz SDK)
  └─ Notifications
```

### Page-by-page data flow

**Dashboard (`/dashboard`)**
- Calls: `GET /api/dashboard/[orgId]`
- Shows: Overall score + rating badge, 5 domain cards, priority gaps, upcoming deadlines
- Each domain card is clickable → navigates to `/domains/[code]`

**Domain Detail (`/domains/[code]`)**
- Calls: `GET /api/domains/[orgId]/[code]`
- Shows: Domain score, all KLOEs for this domain with individual status
- Each KLOE row shows: question, compliance status (green/amber/red), evidence count, gap count
- Click KLOE → expands to show evidence checklist, uploaded items, gaps

**Evidence Library (`/evidence`)**
- Calls: `GET /api/evidence/[orgId]`
- Shows: Filterable table of all evidence (by domain badge, status, category, search)
- Upload button → file upload + metadata form (title, category, domains, expiry date)
- Status badges: Valid (green), Expiring Soon (amber), Expired (red), Pending Review (grey)

**Policies (`/policies`)**
- Calls: `GET /api/policies/[orgId]` + `GET /api/consentz/[orgId]/policy-acknowledgement`
- Shows: Policy list with version, status, acknowledgement rate, domain badges
- "Generate with AI" button → modal with policy type selector → AI generates draft
- Each policy shows signed/unsigned staff breakdown (from Consentz API)

**Staff & Credentials (`/staff`)**
- Calls: `GET /api/staff/[orgId]` merged with `GET /api/consentz/[orgId]/staff-competency`
- Shows: Staff cards with credential status (DBS, GMC if medical, Level 7 if non-medical)
- Competency clock visualization: overdue (red), expiring 30/60/90 (amber buckets), valid (green)
- For AESTHETIC_CLINIC: show GMC Registration column + Level 7 Diploma column
- For CARE_HOME: show DBS Check column (mandatory), hide GMC/Level 7

**Incidents (`/incidents`)**
- Calls: `GET /api/incidents/[orgId]` merged with Consentz incident feed
- Shows: Incident list with filters (type, severity, status)
- Two categories clearly separated:
  - **Patient Complications** (incidentType = COMPLICATION) — requires treatment context
  - **Premises/Other Incidents** (all other types)
- Kanban view: Open → Investigating → Actioned → Closed
- Domain badges on each incident

**Tasks (`/tasks`)**
- Calls: `GET /api/tasks/[orgId]`
- Shows: Kanban board (To Do → In Progress → Review → Completed)
- Domain badges on each task card
- Tasks can be auto-generated from: assessments, incidents, AI recommendations, Consentz sync alerts
- Filter by domain, assignee, priority, due date

**Reports**
- Compliance Report: Full breakdown by domain with scores, evidence status, gaps
- Inspection Preparation: AI-generated brief per domain, evidence summary, talking points
- Data Export: CSV export of all compliance data

**Settings → Integrations**
- Consentz Connection: Enter clinic ID, authenticate, test connection
- Sync status: Last sync time, record counts, any errors
- Manual sync trigger button
- Auto-sync toggle + frequency setting

---

## PHASE 10: TESTING STRATEGY

### Unit tests for critical paths

1. **Score calculation**: Test that domain scores and ratings calculate correctly
2. **Service type filtering**: Verify care home questions never appear for aesthetic clinics
3. **Consentz API mapper**: Test that API responses correctly map to local models
4. **Domain badge assignment**: Test auto-mapping logic

### Integration tests

1. **Full assessment flow**: Start assessment → answer questions → verify score calculation → verify tasks created
2. **Consentz sync**: Mock API responses → verify data saved to DB → verify compliance scores updated
3. **Evidence upload**: Upload file → verify metadata saved → verify domain coverage updated

### E2E smoke tests

1. Login → Dashboard loads with scores
2. Navigate to each domain → KLOEs display correctly
3. Upload evidence → appears in library with correct badges
4. Complete assessment → tasks auto-generated
5. Trigger Consentz sync → data refreshes

---

## IMPLEMENTATION ORDER

**Start here and work sequentially:**

1. **Phase 1**: Prisma schema + seed data + migrations
2. **Phase 2**: Consentz client + types (can test against staging.consentz.com)
3. **Phase 3**: Core API routes (dashboard, domains, evidence, tasks)
4. **Phase 4**: Score engine + dashboard wiring
5. **Phase 5**: Consentz CQC report integration (connect all 7 endpoints)
6. **Phase 6**: Domain badge system throughout UI
7. **Phase 7**: Assessment engine
8. **Phase 8**: AI features (policy generation, gap analysis)
9. **Phase 9**: Wire up all remaining pages
10. **Phase 10**: Testing

---

## ENVIRONMENT VARIABLES

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# Consentz API
CONSENTZ_API_URL="https://staging.consentz.com"
CONSENTZ_SESSION_TOKEN=""  # stored per-org in DB after auth

# Anthropic AI
ANTHROPIC_API_KEY="sk-ant-..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## CRITICAL RULES

1. **NEVER mix service types.** Aesthetic clinic users must NEVER see care home content (falls risk, MUST screening, end-of-life care plans). Care home users must NEVER see aesthetics-specific content (GMC registration, Level 7 diplomas, treatment protocols for Botox/fillers).

2. **Use CQC terminology.** Ratings are Outstanding/Good/Requires Improvement/Inadequate. Always show the CQC rating badge alongside any percentage score.

3. **Domain badges everywhere.** Every evidence item, task, policy, and incident must display which CQC domain(s) it relates to using colored badge icons.

4. **Consentz data is read-only.** We pull data FROM Consentz. We never write back to Consentz. Our platform adds a compliance layer on top.

5. **The Treatment Risk Heatmap API is not yet available.** Build the UI shell but mark the data integration as TODO. Wire it up when the endpoint is provided.

6. **SSO is deferred.** For now, use Clerk auth standalone. The embedded Consentz integration (where users click "Compliance" in the Consentz sidebar and it opens our module) will be handled later.

7. **Poll, don't push.** There are no webhooks. Use scheduled polling (cron jobs via Vercel Cron or similar) to sync Consentz data periodically.

8. **R3 KLOE differs by service type.** For Care Homes: R3 = End of Life Care. For Aesthetic Clinics: R3 = Timely Access to Care. This is a critical differentiation.
