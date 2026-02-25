# CQC Compliance Platform — Database Schema & Data Layer

> **File 2 of 7** | Companion to `01-ARCHITECTURE.md`
> **Database:** Supabase PostgreSQL (`eu-west-2` London)
> **ORM:** Prisma 5.x | **Auth:** Clerk (not Supabase Auth)
> **Last Updated:** February 2026

---

## 1. Database Architecture Overview

### 1.1 Design Principles

1. **Organization-scoped** — every user-created record belongs to an `organizationId`
2. **Soft deletes** — critical entities use `deletedAt` timestamps (never hard delete compliance data)
3. **Audit everything** — every mutation writes to `ActivityLog` (7-year retention per NHS Records Management Code)
4. **Seed vs. user data** — CQC framework data (domains, KLOEs, regulations) is seeded; user data is created at runtime
5. **Prisma as source of truth** — all schema changes go through Prisma migrations, never raw SQL in production

### 1.2 Connection Architecture

```
┌─────────────────────────┐      ┌────────────────────────────────┐
│   Next.js Application   │      │   Supabase PostgreSQL          │
│                         │      │   eu-west-2 (London)           │
│  ┌───────────────────┐  │      │                                │
│  │   Prisma Client   │──┼──────┤►  PgBouncer (port 6543)       │
│  │   (pooled)        │  │      │   Transaction mode pooling     │
│  └───────────────────┘  │      │                                │
│  ┌───────────────────┐  │      │   Direct connection (port 5432)│
│  │   Prisma Migrate  │──┼──────┤►  Used only for migrations     │
│  │   (direct)        │  │      │                                │
│  └───────────────────┘  │      │   Supabase Storage             │
│  ┌───────────────────┐  │      │►  Evidence files               │
│  │   Supabase Client │──┼──────┤►  Policy document PDFs         │
│  │   (storage only)  │  │      │►  Report exports               │
│  └───────────────────┘  │      └────────────────────────────────┘
└─────────────────────────┘
```

### 1.3 Prisma Configuration

```prisma
// prisma/schema.prisma — header

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")        // PgBouncer pooled (port 6543)
  directUrl  = env("DIRECT_URL")          // Direct connection (port 5432, migrations only)
  extensions = [pgcrypto]
}
```

---

## 2. Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            ENTITY RELATIONSHIPS                              │
│                                                                              │
│                          ┌──────────────┐                                    │
│                          │ Organization │ ◄──── Root tenant entity           │
│                          └──────┬───────┘                                    │
│                                 │                                            │
│         ┌───────────┬───────────┼───────────┬───────────┬──────────┐        │
│         │           │           │           │           │          │        │
│         ▼           ▼           ▼           ▼           ▼          ▼        │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────┐    │
│  │   User   │ │Assessment│ │Evidence│ │ Policy │ │  Staff  │ │ Task │    │
│  └──────────┘ └──────────┘ └───┬────┘ └───┬────┘ │ Member  │ └──────┘    │
│       │            │           │           │      └────┬────┘              │
│       │       ┌────┴─────┐    │      ┌────┴─────┐     │                   │
│       │       │Assessment│    │      │  Policy  │     │                   │
│       │       │  Answer  │    │      │ Version  │  ┌──┴──────┐            │
│       │       └──────────┘    │      └──────────┘  │Training │            │
│       │                       │                    │ Record  │            │
│       ▼                       ▼                    └─────────┘            │
│  ┌──────────┐         ┌──────────────┐                                    │
│  │ Activity │         │  Compliance  │                                    │
│  │   Log    │         │    Gap       │                                    │
│  └──────────┘         └──────────────┘                                    │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│  │  Compliance  │  │   Domain     │  │  Incident    │                     │
│  │    Score     │──┤   Score      │  │              │                     │
│  └──────────────┘  └──────────────┘  └──────────────┘                     │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Notification │  │  CqcDomain   │  │   CqcKloe    │  │CqcRegulation │  │
│  │              │  │   (seed)     │──┤   (seed)     │──┤   (seed)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Enums

```prisma
// ─── SERVICE TYPE ───
enum ServiceType {
  AESTHETIC_CLINIC
  CARE_HOME
}

// ─── USER ROLES ───
enum UserRole {
  OWNER           // Full access, billing, can delete org
  ADMIN           // Full access except billing/delete
  MANAGER         // Read/write most areas, no user management
  STAFF           // Limited write (upload evidence, complete tasks)
  VIEWER          // Read-only access
}

// ─── CQC DOMAIN ───
enum CqcDomainType {
  SAFE
  EFFECTIVE
  CARING
  RESPONSIVE
  WELL_LED
}

// ─── CQC RATING ───
enum CqcRating {
  OUTSTANDING
  GOOD
  REQUIRES_IMPROVEMENT
  INADEQUATE
}

// ─── GAP SEVERITY ───
enum GapSeverity {
  CRITICAL        // Caps rating at RI — immediate action
  HIGH            // Significant risk, address within 7 days
  MEDIUM          // Moderate risk, address within 30 days
  LOW             // Minor issue, address within 90 days
}

// ─── GAP STATUS ───
enum GapStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  ACCEPTED_RISK   // Org acknowledges gap but accepts the risk
  NOT_APPLICABLE  // Marked as N/A for this service type
}

// ─── EVIDENCE CATEGORY ───
enum EvidenceCategory {
  POLICY
  PROCEDURE
  RECORD
  ASSESSMENT
  TRAINING
  AUDIT
  CERTIFICATE
  REPORT
  OTHER
}

// ─── EVIDENCE STATUS ───
enum EvidenceStatus {
  CURRENT         // Valid and up to date
  EXPIRING_SOON   // Within 30 days of expiry
  EXPIRED         // Past validUntil date
  UNDER_REVIEW    // Uploaded but pending approval
  ARCHIVED        // Superseded by newer version
}

// ─── POLICY STATUS ───
enum PolicyStatus {
  DRAFT
  UNDER_REVIEW
  APPROVED
  PUBLISHED
  EXPIRED
  ARCHIVED
}

// ─── STAFF ROLE (Healthcare) ───
enum StaffRole {
  REGISTERED_MANAGER
  DEPUTY_MANAGER
  REGISTERED_NURSE
  SENIOR_CARER
  CARE_ASSISTANT
  PRACTITIONER
  MEDICAL_DIRECTOR
  ADMIN
  DOMESTIC
  OTHER
}

// ─── REGISTRATION BODY ───
enum RegistrationBody {
  GMC             // General Medical Council
  NMC             // Nursing and Midwifery Council
  GPhC            // General Pharmaceutical Council
  GDC             // General Dental Council
  HCPC            // Health and Care Professions Council
  OTHER
}

// ─── INCIDENT CATEGORY ───
enum IncidentCategory {
  FALL
  MEDICATION_ERROR
  SAFEGUARDING
  INFECTION
  PRESSURE_ULCER
  INJURY
  NEAR_MISS
  COMPLAINT
  EQUIPMENT_FAILURE
  MISSING_PERSON
  DEATH
  OTHER
}

// ─── INCIDENT SEVERITY ───
enum IncidentSeverity {
  NEAR_MISS
  LOW
  MODERATE
  SEVERE
  CRITICAL
}

// ─── INCIDENT STATUS ───
enum IncidentStatus {
  REPORTED
  UNDER_INVESTIGATION
  ACTION_REQUIRED
  RESOLVED
  CLOSED
}

// ─── TASK STATUS ───
enum TaskStatus {
  TODO
  IN_PROGRESS
  OVERDUE
  COMPLETED
  CANCELLED
}

// ─── TASK PRIORITY ───
enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

// ─── TASK SOURCE ───
enum TaskSource {
  ASSESSMENT      // Auto-generated from assessment gaps
  MANUAL          // Created manually by user
  AI              // AI-recommended remediation action
  SYSTEM          // System-generated (expiry, cron)
}

// ─── NOTIFICATION TYPE ───
enum NotificationType {
  DOCUMENT_EXPIRING
  DOCUMENT_EXPIRED
  TRAINING_DUE
  TRAINING_EXPIRED
  TASK_ASSIGNED
  TASK_OVERDUE
  TASK_COMPLETED
  INCIDENT_REPORTED
  COMPLIANCE_SCORE_CHANGED
  GAP_IDENTIFIED
  POLICY_REVIEW_DUE
  REGISTRATION_EXPIRING
  INSPECTION_REMINDER
  SYSTEM_ALERT
}

// ─── NOTIFICATION PRIORITY ───
enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

// ─── ACTIVITY ACTION ───
enum ActivityAction {
  CREATE
  UPDATE
  DELETE
  UPLOAD
  DOWNLOAD
  EXPORT
  LOGIN
  APPROVE
  REJECT
  COMPLETE
  ARCHIVE
  RESTORE
  GENERATE       // AI generated content
  CALCULATE      // Score recalculation
}
```

---

## 4. Complete Prisma Models

### 4.1 Organization

The multi-tenant root entity. Every data record links back here.

```prisma
model Organization {
  id                 String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name               String       @db.VarChar(255)
  serviceType        ServiceType
  
  // CQC Registration
  cqcProviderId      String?      @db.VarChar(50)   // CQC provider ID (e.g., "1-123456789")
  cqcLocationId      String?      @db.VarChar(50)   // CQC location ID
  cqcRegisteredName  String?      @db.VarChar(255)  // Name registered with CQC
  cqcCurrentRating   CqcRating?                     // Last official CQC rating
  cqcLastInspection  DateTime?                      // Date of last CQC inspection
  cqcNextInspection  DateTime?                      // Expected next inspection (estimated)

  // Contact & Address
  address            String?      @db.VarChar(500)
  city               String?      @db.VarChar(100)
  postcode           String?      @db.VarChar(20)
  county             String?      @db.VarChar(100)
  phone              String?      @db.VarChar(30)
  email              String?      @db.VarChar(255)
  website            String?      @db.VarChar(255)

  // Service Details
  registeredManager  String?      @db.VarChar(255)  // Name of CQC registered manager
  bedCount           Int?                           // Care homes: number of beds
  staffCount         Int?                           // Approximate staff count
  operatingHours     String?      @db.VarChar(255)  // E.g., "Mon-Fri 9am-6pm"

  // Subscription
  subscriptionTier   String       @default("free") @db.VarChar(50) // free | professional | premium | enterprise
  subscriptionStatus String       @default("active") @db.VarChar(50) // active | past_due | canceled
  stripeCustomerId   String?      @db.VarChar(255)
  trialEndsAt        DateTime?

  // Onboarding
  onboardingComplete Boolean      @default(false)

  // Timestamps
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
  deletedAt          DateTime?

  // Relations
  users              User[]
  assessments        Assessment[]
  evidence           Evidence[]
  policies           Policy[]
  staffMembers       StaffMember[]
  incidents          Incident[]
  tasks              Task[]
  gaps               ComplianceGap[]
  complianceScore    ComplianceScore?
  notifications      Notification[]
  activityLogs       ActivityLog[]

  @@map("organizations")
}
```

### 4.2 User

Synced from Clerk via webhook. This is the platform login user, NOT healthcare staff.

```prisma
model User {
  id               String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clerkId          String     @unique @db.VarChar(255)  // Clerk user ID
  email            String     @db.VarChar(255)
  firstName        String?    @db.VarChar(100)
  lastName         String?    @db.VarChar(100)
  avatarUrl        String?    @db.VarChar(500)
  role             UserRole   @default(STAFF)

  // Organization link
  organizationId   String?    @db.Uuid
  organization     Organization? @relation(fields: [organizationId], references: [id])

  // Preferences
  emailNotifications Boolean  @default(true)
  timezone           String   @default("Europe/London") @db.VarChar(50)

  // Timestamps
  lastLoginAt      DateTime?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  deletedAt        DateTime?

  // Relations
  uploadedEvidence Evidence[]         @relation("EvidenceUploader")
  reviewedEvidence Evidence[]         @relation("EvidenceReviewer")
  createdPolicies  Policy[]           @relation("PolicyCreator")
  approvedPolicies Policy[]           @relation("PolicyApprover")
  assignedTasks    Task[]             @relation("TaskAssignee")
  createdTasks     Task[]             @relation("TaskCreator")
  reportedIncidents Incident[]        @relation("IncidentReporter")
  investigatedIncidents Incident[]    @relation("IncidentInvestigator")
  notifications    Notification[]
  activityLogs     ActivityLog[]

  @@index([clerkId])
  @@index([organizationId])
  @@index([email])
  @@map("users")
}
```

### 4.3 Assessment

The onboarding assessment. An organization can have multiple assessments (initial + re-assessments).

```prisma
model Assessment {
  id               String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId   String         @db.Uuid
  organization     Organization   @relation(fields: [organizationId], references: [id])

  // Assessment metadata
  serviceType      ServiceType
  version          Int            @default(1)        // Schema version of questions used
  isInitial        Boolean        @default(true)     // First assessment or re-assessment?
  status           String         @default("in_progress") @db.VarChar(30) // in_progress | completed | abandoned
  currentStep      Int            @default(1)

  // Results (populated after calculation)
  overallScore     Float?                            // 0-100 percentage
  predictedRating  CqcRating?
  totalGaps        Int?
  criticalGaps     Int?
  highGaps         Int?
  mediumGaps       Int?
  lowGaps          Int?
  estimatedTimeToGood Int?                           // Estimated days to reach "Good"

  // Domain breakdown (JSON for flexibility across versions)
  domainResults    Json?                             // { safe: { score, gaps, ... }, effective: ... }

  // Timestamps
  startedAt        DateTime       @default(now())
  completedAt      DateTime?
  calculatedAt     DateTime?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  // Relations
  answers          AssessmentAnswer[]

  @@index([organizationId])
  @@index([organizationId, isInitial])
  @@map("assessments")
}
```

### 4.4 AssessmentAnswer

Individual answers within an assessment. Stored per question for granular gap mapping.

```prisma
model AssessmentAnswer {
  id               String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  assessmentId     String       @db.Uuid
  assessment       Assessment   @relation(fields: [assessmentId], references: [id], onDelete: Cascade)

  // Question reference
  questionId       String       @db.VarChar(50)     // Maps to constants/assessment-questions.ts
  questionText     String       @db.Text             // Snapshot of question at time of answer
  step             Int                               // Which wizard step (1-4)

  // Answer data
  domain           CqcDomainType                    // Which CQC domain this question belongs to
  kloeCode         String?      @db.VarChar(10)     // E.g., "S1", "E3", "W2"
  answerValue      Json                              // Flexible: boolean, string, string[], number
  answerType       String       @db.VarChar(30)     // yes_no | multiple_choice | multi_select | scale | text

  // Scoring
  score            Float?                            // Points awarded for this answer
  maxScore         Float?                            // Maximum possible points
  weight           Float        @default(1.0)        // Relative weight within domain
  createsGap       Boolean      @default(false)      // Did this answer create a compliance gap?
  gapSeverity      GapSeverity?                      // If gap created, what severity

  // Timestamps
  answeredAt       DateTime     @default(now())

  @@unique([assessmentId, questionId])
  @@index([assessmentId])
  @@index([domain])
  @@map("assessment_answers")
}
```

### 4.5 ComplianceScore

The live compliance score for an organization. One record per org, updated by recalculation.

```prisma
model ComplianceScore {
  id               String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId   String        @unique @db.Uuid
  organization     Organization  @relation(fields: [organizationId], references: [id])

  // Current scores
  overallScore     Float         @default(0)          // 0-100 percentage
  previousScore    Float?                             // Score before last recalculation
  scoreTrend       Float         @default(0)          // Difference from previous

  // Rating
  predictedRating  CqcRating     @default(INADEQUATE)
  ratingConfidence Float         @default(0)          // 0-1 confidence level
  hasCriticalGap   Boolean       @default(false)      // If true, capped at RI

  // Aggregates
  totalRequirements Int          @default(0)
  metRequirements   Int          @default(0)
  totalGaps         Int          @default(0)
  criticalGaps      Int          @default(0)

  // Timestamps
  calculatedAt     DateTime      @default(now())
  nextRecalcAt     DateTime?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  // Relations
  domainScores     DomainScore[]

  @@map("compliance_scores")
}
```

### 4.6 DomainScore

Per-domain breakdown within a compliance score. 5 records per ComplianceScore.

```prisma
model DomainScore {
  id                 String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  complianceScoreId  String          @db.Uuid
  complianceScore    ComplianceScore @relation(fields: [complianceScoreId], references: [id], onDelete: Cascade)

  domain             CqcDomainType
  score              Float           @default(0)     // Points earned
  maxScore           Float           @default(0)     // Total possible points
  percentage         Float           @default(0)     // score / maxScore * 100

  // Status
  status             CqcRating       @default(INADEQUATE) // Rating for this domain
  previousScore      Float?
  trend              Float           @default(0)

  // Gap counts for this domain
  totalGaps          Int             @default(0)
  criticalGaps       Int             @default(0)
  highGaps           Int             @default(0)
  mediumGaps         Int             @default(0)
  lowGaps            Int             @default(0)

  // Evidence coverage
  totalKloes         Int             @default(0)     // Total KLOEs in this domain
  coveredKloes       Int             @default(0)     // KLOEs with sufficient evidence

  calculatedAt       DateTime        @default(now())

  @@unique([complianceScoreId, domain])
  @@map("domain_scores")
}
```

### 4.7 ComplianceGap

Individual compliance gaps identified by the assessment engine or ongoing monitoring.

```prisma
model ComplianceGap {
  id               String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId   String        @db.Uuid
  organization     Organization  @relation(fields: [organizationId], references: [id])

  // CQC mapping
  domain           CqcDomainType
  kloeCode         String        @db.VarChar(10)     // E.g., "S1", "E3"
  regulationCode   String?       @db.VarChar(10)     // E.g., "REG12", "REG17"

  // Gap details
  title            String        @db.VarChar(255)
  description      String        @db.Text
  severity         GapSeverity
  status           GapStatus     @default(OPEN)

  // Source
  source           String        @db.VarChar(50)     // "assessment" | "monitoring" | "manual" | "ai"
  assessmentId     String?       @db.Uuid            // If identified during assessment

  // Remediation
  remediationSteps Json?                              // AI-generated steps: { immediate: [], shortTerm: [], evidence: [] }
  estimatedEffort  String?       @db.VarChar(50)     // "1 hour" | "1 day" | "1 week"
  dueDate          DateTime?
  resolvedAt       DateTime?
  resolvedById     String?       @db.Uuid
  resolutionNotes  String?       @db.Text

  // Timestamps
  identifiedAt     DateTime      @default(now())
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  // Relations
  linkedTasks      Task[]

  @@index([organizationId])
  @@index([organizationId, status])
  @@index([organizationId, domain])
  @@index([organizationId, severity])
  @@map("compliance_gaps")
}
```

### 4.8 Evidence

Uploaded compliance evidence documents, linked to KLOEs and regulations.

```prisma
model Evidence {
  id               String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId   String           @db.Uuid
  organization     Organization     @relation(fields: [organizationId], references: [id])

  // File details
  name             String           @db.VarChar(255)
  description      String?          @db.Text
  fileUrl          String           @db.VarChar(1000) // Supabase Storage URL
  fileName         String           @db.VarChar(255)  // Original filename
  fileType         String           @db.VarChar(50)   // MIME type
  fileSize         Int                                // Bytes
  storagePath      String           @db.VarChar(500)  // Path in Supabase bucket

  // Classification
  category         EvidenceCategory
  status           EvidenceStatus   @default(CURRENT)
  tags             String[]         @default([])

  // CQC linking (an evidence item can cover multiple KLOEs)
  linkedKloes      String[]         @default([])      // ["S1", "S3", "E2"]
  linkedRegulations String[]        @default([])      // ["REG12", "REG13"]

  // Validity period
  validFrom        DateTime?
  validUntil       DateTime?                          // Triggers expiry notifications
  isExpired        Boolean          @default(false)

  // Review & approval
  uploadedById     String           @db.Uuid
  uploadedBy       User             @relation("EvidenceUploader", fields: [uploadedById], references: [id])
  reviewedById     String?          @db.Uuid
  reviewedBy       User?            @relation("EvidenceReviewer", fields: [reviewedById], references: [id])
  reviewedAt       DateTime?
  reviewNotes      String?          @db.Text

  // Version control
  versionNumber    Int              @default(1)
  previousVersionId String?         @db.Uuid          // Self-referencing for version chain

  // Timestamps
  uploadedAt       DateTime         @default(now())
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  deletedAt        DateTime?

  @@index([organizationId])
  @@index([organizationId, category])
  @@index([organizationId, status])
  @@index([validUntil])
  @@map("evidence")
}
```

### 4.9 Policy

Compliance policies — manually written or AI-generated. Supports version control.

```prisma
model Policy {
  id               String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId   String        @db.Uuid
  organization     Organization  @relation(fields: [organizationId], references: [id])

  // Policy details
  title            String        @db.VarChar(255)
  description      String?       @db.Text
  content          String        @db.Text             // Rich text / markdown body
  category         String        @db.VarChar(100)     // "safeguarding" | "infection_control" | "complaints" | etc.
  status           PolicyStatus  @default(DRAFT)

  // CQC linking
  linkedKloes      String[]      @default([])
  linkedRegulations String[]     @default([])

  // Validity
  effectiveDate    DateTime?
  reviewDate       DateTime?                          // When this policy needs review
  expiryDate       DateTime?

  // Authoring
  isAiGenerated    Boolean       @default(false)
  aiPrompt         String?       @db.Text             // If AI generated, the prompt used
  createdById      String        @db.Uuid
  createdBy        User          @relation("PolicyCreator", fields: [createdById], references: [id])
  approvedById     String?       @db.Uuid
  approvedBy       User?         @relation("PolicyApprover", fields: [approvedById], references: [id])
  approvedAt       DateTime?

  // Version
  versionNumber    Int           @default(1)
  isLatestVersion  Boolean       @default(true)
  previousVersionId String?      @db.Uuid

  // File (if PDF export exists)
  fileUrl          String?       @db.VarChar(1000)

  // Timestamps
  publishedAt      DateTime?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  deletedAt        DateTime?

  // Relations
  versions         PolicyVersion[]

  @@index([organizationId])
  @@index([organizationId, status])
  @@index([reviewDate])
  @@map("policies")
}
```

### 4.10 PolicyVersion

Tracks every published version of a policy for audit trail.

```prisma
model PolicyVersion {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  policyId       String    @db.Uuid
  policy         Policy    @relation(fields: [policyId], references: [id], onDelete: Cascade)

  versionNumber  Int
  content        String    @db.Text           // Snapshot of content at this version
  changeNotes    String?   @db.Text           // What changed
  createdById    String    @db.Uuid           // Who published this version
  createdAt      DateTime  @default(now())

  @@unique([policyId, versionNumber])
  @@index([policyId])
  @@map("policy_versions")
}
```

### 4.11 StaffMember

Healthcare staff being tracked for compliance — NOT platform login users.

```prisma
model StaffMember {
  id               String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId   String           @db.Uuid
  organization     Organization     @relation(fields: [organizationId], references: [id])

  // Personal details
  firstName        String           @db.VarChar(100)
  lastName         String           @db.VarChar(100)
  email            String?          @db.VarChar(255)
  phone            String?          @db.VarChar(30)
  avatarUrl        String?          @db.VarChar(500)

  // Role & employment
  jobTitle         String           @db.VarChar(200)
  staffRole        StaffRole
  department       String?          @db.VarChar(100)
  startDate        DateTime
  endDate          DateTime?                          // null = currently employed
  isActive         Boolean          @default(true)
  contractType     String?          @db.VarChar(50)  // "full_time" | "part_time" | "bank" | "agency"

  // Professional Registration
  registrationBody RegistrationBody?
  registrationNumber String?        @db.VarChar(50)
  registrationExpiry DateTime?                        // Triggers expiry notification

  // DBS (Disclosure and Barring Service)
  dbsNumber        String?          @db.VarChar(20)
  dbsCertificateDate DateTime?                        // Date DBS was issued
  dbsUpdateService Boolean          @default(false)   // Enrolled in DBS Update Service?
  dbsLevel         String?          @db.VarChar(30)  // "basic" | "standard" | "enhanced" | "enhanced_barred"

  // Indemnity Insurance (aesthetic clinics primarily)
  hasIndemnityInsurance Boolean     @default(false)
  insuranceProvider String?         @db.VarChar(255)
  insurancePolicyNumber String?     @db.VarChar(100)
  insuranceExpiry  DateTime?                          // Triggers expiry notification

  // Right to Work
  rightToWorkChecked Boolean        @default(false)
  rightToWorkDate    DateTime?

  // Timestamps
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  deletedAt        DateTime?

  // Relations
  training         TrainingRecord[]
  incidents        Incident[]       @relation("IncidentStaffInvolved")

  @@index([organizationId])
  @@index([organizationId, isActive])
  @@index([registrationExpiry])
  @@index([insuranceExpiry])
  @@map("staff_members")
}
```

### 4.12 TrainingRecord

Training certificates and competency records for staff members.

```prisma
model TrainingRecord {
  id               String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  staffMemberId    String        @db.Uuid
  staffMember      StaffMember   @relation(fields: [staffMemberId], references: [id], onDelete: Cascade)

  // Training details
  courseName       String        @db.VarChar(255)
  provider         String?       @db.VarChar(255)    // Training provider name
  category         String        @db.VarChar(100)    // "mandatory" | "statutory" | "professional" | "optional"
  isMandatory      Boolean       @default(false)

  // CQC linking
  linkedKloes      String[]      @default([])
  linkedRegulations String[]     @default([])

  // Completion
  completedDate    DateTime
  expiryDate       DateTime?                         // Triggers renewal notification
  isExpired        Boolean       @default(false)
  certificateUrl   String?       @db.VarChar(1000)   // Supabase Storage URL

  // Score (if applicable)
  score            Float?                            // Percentage or grade
  passed           Boolean       @default(true)

  // Timestamps
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  @@index([staffMemberId])
  @@index([expiryDate])
  @@index([staffMemberId, category])
  @@map("training_records")
}
```

### 4.13 Incident

Incident reports for compliance tracking. Linked to CQC domains and regulations.

```prisma
model Incident {
  id                   String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId       String           @db.Uuid
  organization         Organization     @relation(fields: [organizationId], references: [id])

  // Incident details
  title                String           @db.VarChar(255)
  description          String           @db.Text
  category             IncidentCategory
  severity             IncidentSeverity
  status               IncidentStatus   @default(REPORTED)
  occurredAt           DateTime
  location             String?          @db.VarChar(200)

  // People involved
  reportedById         String           @db.Uuid
  reportedBy           User             @relation("IncidentReporter", fields: [reportedById], references: [id])
  staffInvolved        StaffMember[]    @relation("IncidentStaffInvolved")
  personsInvolved      String[]         @default([])    // Free text names of others

  // Investigation
  investigatorId       String?          @db.Uuid
  investigator         User?            @relation("IncidentInvestigator", fields: [investigatorId], references: [id])
  rootCause            String?          @db.Text
  actionsTaken         String?          @db.Text
  lessonsLearned       String?          @db.Text
  investigatedAt       DateTime?

  // External notifications
  requiresNotification Boolean          @default(false)
  notifiedBodies       String[]         @default([])    // ["CQC", "LOCAL_AUTHORITY", "POLICE", "HSE"]
  notifiedAt           DateTime?

  // Duty of candour
  dutyOfCandourApplies Boolean          @default(false)
  dutyOfCandourMet     Boolean          @default(false)
  candourNotificationDate DateTime?

  // CQC linking
  linkedKloes          String[]         @default([])
  linkedRegulations    String[]         @default([])

  // Timestamps
  reportedAt           DateTime         @default(now())
  resolvedAt           DateTime?
  closedAt             DateTime?
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  @@index([organizationId])
  @@index([organizationId, status])
  @@index([organizationId, severity])
  @@index([occurredAt])
  @@map("incidents")
}
```

### 4.14 Task

Compliance tasks — auto-generated from gaps, AI-recommended, or manually created.

```prisma
model Task {
  id               String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId   String        @db.Uuid
  organization     Organization  @relation(fields: [organizationId], references: [id])

  // Task details
  title            String        @db.VarChar(255)
  description      String?       @db.Text
  status           TaskStatus    @default(TODO)
  priority         TaskPriority  @default(MEDIUM)
  source           TaskSource    @default(MANUAL)

  // CQC linking
  domain           CqcDomainType?
  kloeCode         String?       @db.VarChar(10)
  gapId            String?       @db.Uuid
  gap              ComplianceGap? @relation(fields: [gapId], references: [id])

  // Assignment
  assignedToId     String?       @db.Uuid
  assignedTo       User?         @relation("TaskAssignee", fields: [assignedToId], references: [id])
  createdById      String        @db.Uuid
  createdBy        User          @relation("TaskCreator", fields: [createdById], references: [id])

  // Dates
  dueDate          DateTime?
  completedAt      DateTime?
  completionNotes  String?       @db.Text

  // Timestamps
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  @@index([organizationId])
  @@index([organizationId, status])
  @@index([assignedToId])
  @@index([dueDate])
  @@index([gapId])
  @@map("tasks")
}
```

### 4.15 Notification

In-app notifications. High-priority ones also trigger email via Resend.

```prisma
model Notification {
  id               String               @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId   String               @db.Uuid
  organization     Organization         @relation(fields: [organizationId], references: [id])

  // Target
  userId           String?              @db.Uuid     // Specific user, or null = org-wide
  user             User?                @relation(fields: [userId], references: [id])

  // Content
  type             NotificationType
  title            String               @db.VarChar(255)
  message          String               @db.Text
  priority         NotificationPriority @default(NORMAL)

  // Action
  actionUrl        String?              @db.VarChar(500)
  actionLabel      String?              @db.VarChar(100)

  // Status
  isRead           Boolean              @default(false)
  readAt           DateTime?
  emailSent        Boolean              @default(false)
  emailSentAt      DateTime?

  // Timestamps
  createdAt        DateTime             @default(now())
  expiresAt        DateTime?                         // Auto-dismiss after this date

  @@index([organizationId])
  @@index([userId, isRead])
  @@index([organizationId, isRead])
  @@index([createdAt])
  @@map("notifications")
}
```

### 4.16 ActivityLog

Immutable audit trail. 7-year retention per NHS Records Management Code.

```prisma
model ActivityLog {
  id               String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId   String         @db.Uuid
  organization     Organization   @relation(fields: [organizationId], references: [id])

  // Actor
  actorId          String?        @db.Uuid
  actor            User?          @relation(fields: [actorId], references: [id])
  actorName        String         @db.VarChar(255)   // Snapshot (user may be deleted later)
  actorRole        UserRole?

  // Action
  action           ActivityAction
  entityType       String         @db.VarChar(50)    // "Evidence" | "Policy" | "StaffMember" | etc.
  entityId         String?        @db.Uuid
  description      String         @db.Text

  // Change tracking
  previousValues   Json?                             // Snapshot of changed fields (before)
  newValues        Json?                             // Snapshot of changed fields (after)

  // Request context
  ipAddress        String?        @db.VarChar(50)
  userAgent        String?        @db.VarChar(500)

  // Outcome
  outcome          String         @default("SUCCESS") @db.VarChar(20) // SUCCESS | FAILURE | ERROR

  // Timestamp (immutable — no updatedAt)
  createdAt        DateTime       @default(now())

  @@index([organizationId])
  @@index([organizationId, entityType])
  @@index([organizationId, action])
  @@index([createdAt])
  @@index([actorId])
  @@map("activity_logs")
}
```

### 4.17 CQC Reference Data (Seed Tables)

These are read-only reference tables seeded at deployment. Users never write to them.

```prisma
// ─── CQC DOMAIN (5 records) ───
model CqcDomain {
  id               String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code             CqcDomainType @unique
  name             String        @db.VarChar(50)     // "Safe", "Effective", etc.
  description      String        @db.Text             // Full CQC description
  keyQuestion      String        @db.Text             // "Are people protected from abuse..."
  sortOrder        Int                                // Display order (1-5)
  weight           Float         @default(1.0)        // Scoring weight (all equal by default)

  // Relations
  kloes            CqcKloe[]

  @@map("cqc_domains")
}

// ─── CQC KEY LINES OF ENQUIRY (25 records: S1-S6, E1-E7, C1-C3, R1-R3, W1-W6) ───
model CqcKloe {
  id                  String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code                String        @unique @db.VarChar(10) // "S1", "E3", "W6"
  domainId            String        @db.Uuid
  domain              CqcDomain     @relation(fields: [domainId], references: [id])
  domainType          CqcDomainType

  // Content
  title               String        @db.VarChar(500)  // Short title
  description         String        @db.Text           // Full KLOE text / question
  sortOrder           Int                              // Display order within domain

  // Applicability
  appliesToClinic     Boolean       @default(true)     // Relevant for aesthetic clinics?
  appliesToCareHome   Boolean       @default(true)     // Relevant for care homes?
  clinicGuidance      String?       @db.Text           // Service-specific guidance for clinics
  careHomeGuidance    String?       @db.Text           // Service-specific guidance for care homes

  // Scoring
  weight              Float         @default(1.0)      // Weight within domain

  // Relations
  regulations         CqcKloeRegulation[]

  @@index([domainType])
  @@map("cqc_kloes")
}

// ─── CQC REGULATIONS / FUNDAMENTAL STANDARDS (14 records: Reg 9 through 20A) ───
model CqcRegulation {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code             String    @unique @db.VarChar(10)  // "REG9", "REG12", "REG20A"
  number           String    @db.VarChar(10)          // "9", "12", "20A"
  name             String    @db.VarChar(255)          // "Person-centred care"
  description      String    @db.Text                  // Full regulation text
  isProsecutable   Boolean   @default(false)           // Can CQC prosecute for breach?
  legislation      String    @db.VarChar(255)          // "Health and Social Care Act 2008..."
  sortOrder        Int

  // Relations
  kloes            CqcKloeRegulation[]

  @@map("cqc_regulations")
}

// ─── KLOE ↔ REGULATION MAPPING (many-to-many with strength indicator) ───
model CqcKloeRegulation {
  id               String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  kloeId           String         @db.Uuid
  kloe             CqcKloe        @relation(fields: [kloeId], references: [id])
  regulationId     String         @db.Uuid
  regulation       CqcRegulation  @relation(fields: [regulationId], references: [id])

  // Mapping strength (from official CQC document)
  mappingType      String         @db.VarChar(30)     // "suggested" | "also_consider"

  @@unique([kloeId, regulationId])
  @@map("cqc_kloe_regulations")
}
```

---

## 5. Supabase Storage Buckets

Supabase Storage handles file uploads. Do NOT store files in the database.

### 5.1 Bucket Configuration

| Bucket Name | Purpose | Access | Max File Size |
|---|---|---|---|
| `evidence` | Evidence documents (PDFs, images, scans) | Private (RLS) | 50 MB |
| `policies` | Generated policy PDFs | Private (RLS) | 20 MB |
| `training` | Training certificates | Private (RLS) | 20 MB |
| `reports` | Generated compliance reports | Private (RLS) | 50 MB |
| `avatars` | User and staff profile photos | Private (RLS) | 5 MB |

### 5.2 File Path Convention

```
{bucket}/{organizationId}/{entity}/{year}/{filename}

Examples:
evidence/abc-123/evidence/2026/fire-drill-log-jan-2026.pdf
evidence/abc-123/policies/2026/safeguarding-policy-v3.pdf
evidence/abc-123/training/2026/john-smith-fire-safety-cert.pdf
evidence/abc-123/reports/2026/compliance-report-q1.pdf
```

### 5.3 Supabase Client Setup

```typescript
// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js'

// Server-side client (for API routes) — uses service role key
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Client-side client (for browser uploads) — uses anon key + RLS
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

## 6. Row Level Security (RLS)

RLS provides a database-level safety net. Even if application code has a bug, Supabase RLS prevents cross-tenant data access. Since we use Prisma (not the Supabase client) for data queries, RLS is a secondary defense layer.

### 6.1 RLS Policies (Applied via SQL Migration)

```sql
-- Enable RLS on all user-data tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Seed tables are public read (no write)
ALTER TABLE cqc_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE cqc_kloes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cqc_regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cqc_kloe_regulations ENABLE ROW LEVEL SECURITY;

-- Allow service role (Prisma) to bypass RLS
-- (Prisma uses the service role connection, so this is critical)
CREATE POLICY "Service role bypass" ON organizations
  FOR ALL USING (true) WITH CHECK (true);

-- Public read on CQC reference data
CREATE POLICY "Public read CQC domains" ON cqc_domains
  FOR SELECT USING (true);
CREATE POLICY "Public read CQC KLOEs" ON cqc_kloes
  FOR SELECT USING (true);
CREATE POLICY "Public read CQC regulations" ON cqc_regulations
  FOR SELECT USING (true);
CREATE POLICY "Public read CQC KLOE regulations" ON cqc_kloe_regulations
  FOR SELECT USING (true);
```

> **Note:** Since our Prisma client connects using the Supabase service role key (which bypasses RLS), the policies above primarily protect against direct Supabase client access. Organization-level data isolation is enforced primarily in the application layer through Prisma `where` clauses filtering by `organizationId`.

---

## 7. Indexing Strategy

All indexes are declared inline in the Prisma models above using `@@index`. Here is a summary of the index strategy by query pattern:

### 7.1 Index Summary

| Table | Index | Query Pattern |
|---|---|---|
| `users` | `clerkId` (unique) | Clerk webhook user lookup |
| `users` | `organizationId` | All user queries filter by org |
| `users` | `email` | User lookup by email |
| `assessments` | `organizationId` | Fetch assessments for org |
| `assessments` | `[organizationId, isInitial]` | Find initial vs. re-assessments |
| `assessment_answers` | `[assessmentId, questionId]` (unique) | One answer per question |
| `assessment_answers` | `domain` | Filter answers by CQC domain |
| `compliance_gaps` | `[organizationId, status]` | Dashboard: open gaps |
| `compliance_gaps` | `[organizationId, domain]` | Domain detail page |
| `compliance_gaps` | `[organizationId, severity]` | Priority gap list |
| `evidence` | `[organizationId, category]` | Filtered evidence library |
| `evidence` | `[organizationId, status]` | Expiring evidence alerts |
| `evidence` | `validUntil` | Cron: expiry check |
| `policies` | `[organizationId, status]` | Policy library filters |
| `policies` | `reviewDate` | Cron: policy review reminders |
| `staff_members` | `[organizationId, isActive]` | Active staff directory |
| `staff_members` | `registrationExpiry` | Cron: registration expiry |
| `staff_members` | `insuranceExpiry` | Cron: insurance expiry |
| `training_records` | `staffMemberId` | Staff profile training tab |
| `training_records` | `expiryDate` | Cron: training expiry |
| `incidents` | `[organizationId, status]` | Incident log filters |
| `incidents` | `[organizationId, severity]` | Severity-based filtering |
| `tasks` | `[organizationId, status]` | Task board filters |
| `tasks` | `assignedToId` | My tasks list |
| `tasks` | `dueDate` | Overdue task detection |
| `notifications` | `[userId, isRead]` | Unread notification count |
| `activity_logs` | `[organizationId, entityType]` | Audit trail by entity |
| `activity_logs` | `[organizationId, action]` | Audit trail by action |
| `activity_logs` | `createdAt` | Chronological audit log |

---

## 8. Prisma Client Singleton

```typescript
// src/lib/db.ts

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

---

## 9. Seed Data

### 9.1 Seed File Structure

```typescript
// prisma/seed.ts

import { PrismaClient, CqcDomainType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding CQC reference data...')

  // 1. Seed CQC Domains
  await seedDomains()

  // 2. Seed CQC Regulations
  await seedRegulations()

  // 3. Seed CQC KLOEs
  await seedKloes()

  // 4. Seed KLOE ↔ Regulation mappings
  await seedKloeRegulationMappings()

  console.log('✅ Seed complete')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### 9.2 Domain Seed Data

```typescript
async function seedDomains() {
  const domains = [
    {
      code: 'SAFE' as CqcDomainType,
      name: 'Safe',
      keyQuestion: 'Are people protected from abuse and avoidable harm?',
      description: 'By safe, we mean people are protected from abuse and avoidable harm. Abuse can be physical, sexual, mental or psychological, financial, neglect, institutional or discriminatory abuse.',
      sortOrder: 1,
      weight: 1.0,
    },
    {
      code: 'EFFECTIVE' as CqcDomainType,
      name: 'Effective',
      keyQuestion: 'Does care, treatment and support achieve good outcomes and promote a good quality of life?',
      description: 'By effective, we mean that people\'s care, treatment and support achieves good outcomes, promotes a good quality of life and is based on the best available evidence.',
      sortOrder: 2,
      weight: 1.0,
    },
    {
      code: 'CARING' as CqcDomainType,
      name: 'Caring',
      keyQuestion: 'Does the service involve and treat people with compassion, kindness, dignity and respect?',
      description: 'By caring, we mean that the service involves and treats people with compassion, kindness, dignity and respect.',
      sortOrder: 3,
      weight: 1.0,
    },
    {
      code: 'RESPONSIVE' as CqcDomainType,
      name: 'Responsive',
      keyQuestion: 'Are services organised so that they meet people\'s needs?',
      description: 'By responsive, we mean that services meet people\'s needs.',
      sortOrder: 4,
      weight: 1.0,
    },
    {
      code: 'WELL_LED' as CqcDomainType,
      name: 'Well-Led',
      keyQuestion: 'Is the leadership, management and governance of the organisation assuring delivery of high-quality, person-centred care?',
      description: 'By well-led, we mean that the leadership, management and governance of the organisation assures the delivery of high-quality person-centred care, supports learning and innovation, and promotes an open and fair culture.',
      sortOrder: 5,
      weight: 1.0,
    },
  ]

  for (const domain of domains) {
    await prisma.cqcDomain.upsert({
      where: { code: domain.code },
      update: domain,
      create: domain,
    })
  }

  console.log(`  ✓ ${domains.length} CQC domains seeded`)
}
```

### 9.3 Regulations Seed Data

```typescript
async function seedRegulations() {
  const regulations = [
    { code: 'REG9',   number: '9',   name: 'Person-centred care',                           isProsecutable: false, sortOrder: 1 },
    { code: 'REG9A',  number: '9A',  name: 'Visiting and accompanying',                     isProsecutable: false, sortOrder: 2 },
    { code: 'REG10',  number: '10',  name: 'Dignity and respect',                            isProsecutable: false, sortOrder: 3 },
    { code: 'REG11',  number: '11',  name: 'Need for consent',                               isProsecutable: true,  sortOrder: 4 },
    { code: 'REG12',  number: '12',  name: 'Safe care and treatment',                        isProsecutable: true,  sortOrder: 5 },
    { code: 'REG13',  number: '13',  name: 'Safeguarding from abuse and improper treatment', isProsecutable: true,  sortOrder: 6 },
    { code: 'REG14',  number: '14',  name: 'Meeting nutritional and hydration needs',        isProsecutable: true,  sortOrder: 7 },
    { code: 'REG15',  number: '15',  name: 'Premises and equipment',                         isProsecutable: false, sortOrder: 8 },
    { code: 'REG16',  number: '16',  name: 'Receiving and acting on complaints',             isProsecutable: false, sortOrder: 9 },
    { code: 'REG17',  number: '17',  name: 'Good governance',                                isProsecutable: false, sortOrder: 10 },
    { code: 'REG18',  number: '18',  name: 'Staffing',                                       isProsecutable: false, sortOrder: 11 },
    { code: 'REG19',  number: '19',  name: 'Fit and proper persons employed',                isProsecutable: false, sortOrder: 12 },
    { code: 'REG20',  number: '20',  name: 'Duty of candour',                                isProsecutable: true,  sortOrder: 13 },
    { code: 'REG20A', number: '20A', name: 'Display of performance assessments',             isProsecutable: true,  sortOrder: 14 },
  ]

  for (const reg of regulations) {
    await prisma.cqcRegulation.upsert({
      where: { code: reg.code },
      update: { ...reg, description: `Regulation ${reg.number}: ${reg.name}`, legislation: 'Health and Social Care Act 2008 (Regulated Activities) Regulations 2014' },
      create: { ...reg, description: `Regulation ${reg.number}: ${reg.name}`, legislation: 'Health and Social Care Act 2008 (Regulated Activities) Regulations 2014' },
    })
  }

  console.log(`  ✓ ${regulations.length} CQC regulations seeded`)
}
```

### 9.4 KLOEs Seed Data (Summary — Full Data in `04-CQC-FRAMEWORK.md`)

```typescript
async function seedKloes() {
  // Get domain IDs
  const domains = await prisma.cqcDomain.findMany()
  const domainMap = Object.fromEntries(domains.map(d => [d.code, d.id]))

  const kloes = [
    // ── SAFE (S1-S6) ──
    { code: 'S1', domainType: 'SAFE', title: 'Safeguarding systems and practices', sortOrder: 1, appliesToClinic: true, appliesToCareHome: true },
    { code: 'S2', domainType: 'SAFE', title: 'Risk assessment, safety monitoring and management', sortOrder: 2, appliesToClinic: true, appliesToCareHome: true },
    { code: 'S3', domainType: 'SAFE', title: 'Sufficient suitable staff to keep people safe', sortOrder: 3, appliesToClinic: true, appliesToCareHome: true },
    { code: 'S4', domainType: 'SAFE', title: 'Proper and safe use of medicines', sortOrder: 4, appliesToClinic: true, appliesToCareHome: true },
    { code: 'S5', domainType: 'SAFE', title: 'Prevention and control of infection', sortOrder: 5, appliesToClinic: true, appliesToCareHome: true },
    { code: 'S6', domainType: 'SAFE', title: 'Learning and improvement from safety incidents', sortOrder: 6, appliesToClinic: true, appliesToCareHome: true },

    // ── EFFECTIVE (E1-E7) ──
    { code: 'E1', domainType: 'EFFECTIVE', title: 'Evidence-based care and treatment', sortOrder: 1, appliesToClinic: true, appliesToCareHome: true },
    { code: 'E2', domainType: 'EFFECTIVE', title: 'Staff skills, knowledge and experience', sortOrder: 2, appliesToClinic: true, appliesToCareHome: true },
    { code: 'E3', domainType: 'EFFECTIVE', title: 'Nutrition and hydration support', sortOrder: 3, appliesToClinic: false, appliesToCareHome: true },
    { code: 'E4', domainType: 'EFFECTIVE', title: 'Staff coordination across teams and services', sortOrder: 4, appliesToClinic: true, appliesToCareHome: true },
    { code: 'E5', domainType: 'EFFECTIVE', title: 'Supporting healthier lives and healthcare access', sortOrder: 5, appliesToClinic: true, appliesToCareHome: true },
    { code: 'E6', domainType: 'EFFECTIVE', title: 'Premises adaptation, design and decoration', sortOrder: 6, appliesToClinic: true, appliesToCareHome: true },
    { code: 'E7', domainType: 'EFFECTIVE', title: 'Consent in line with legislation', sortOrder: 7, appliesToClinic: true, appliesToCareHome: true },

    // ── CARING (C1-C3) ──
    { code: 'C1', domainType: 'CARING', title: 'Kindness, respect, compassion and emotional support', sortOrder: 1, appliesToClinic: true, appliesToCareHome: true },
    { code: 'C2', domainType: 'CARING', title: 'Supporting people in care decisions', sortOrder: 2, appliesToClinic: true, appliesToCareHome: true },
    { code: 'C3', domainType: 'CARING', title: 'Privacy, dignity and independence', sortOrder: 3, appliesToClinic: true, appliesToCareHome: true },

    // ── RESPONSIVE (R1-R3) ──
    { code: 'R1', domainType: 'RESPONSIVE', title: 'Personalised, responsive care', sortOrder: 1, appliesToClinic: true, appliesToCareHome: true },
    { code: 'R2', domainType: 'RESPONSIVE', title: 'Complaints handling and quality improvement', sortOrder: 2, appliesToClinic: true, appliesToCareHome: true },
    { code: 'R3', domainType: 'RESPONSIVE', title: 'End-of-life care / timely access to care', sortOrder: 3, appliesToClinic: true, appliesToCareHome: true },

    // ── WELL-LED (W1-W6) ──
    { code: 'W1', domainType: 'WELL_LED', title: 'Vision, strategy and positive culture', sortOrder: 1, appliesToClinic: true, appliesToCareHome: true },
    { code: 'W2', domainType: 'WELL_LED', title: 'Governance, management and accountability', sortOrder: 2, appliesToClinic: true, appliesToCareHome: true },
    { code: 'W3', domainType: 'WELL_LED', title: 'Engagement with people, public and staff', sortOrder: 3, appliesToClinic: true, appliesToCareHome: true },
    { code: 'W4', domainType: 'WELL_LED', title: 'Continuous learning, improvement and innovation', sortOrder: 4, appliesToClinic: true, appliesToCareHome: true },
    { code: 'W5', domainType: 'WELL_LED', title: 'Partnership working with other agencies', sortOrder: 5, appliesToClinic: true, appliesToCareHome: true },
    { code: 'W6', domainType: 'WELL_LED', title: 'Self-assessment and continuous improvement culture', sortOrder: 6, appliesToClinic: true, appliesToCareHome: true },
  ]

  for (const kloe of kloes) {
    const domainId = domainMap[kloe.domainType]
    await prisma.cqcKloe.upsert({
      where: { code: kloe.code },
      update: { ...kloe, domainId, domainType: kloe.domainType as any, description: kloe.title },
      create: { ...kloe, domainId, domainType: kloe.domainType as any, description: kloe.title },
    })
  }

  console.log(`  ✓ ${kloes.length} CQC KLOEs seeded`)
}
```

> **Note on E3 and R3:** E3 (Nutrition and hydration) is marked `appliesToClinic: false` as aesthetic clinics don't provide meals or residential care. R3 means different things per service type — "End-of-life care" for care homes vs. "Timely access to care" for clinics. This is handled via `clinicGuidance` and `careHomeGuidance` fields.

### 9.5 KLOE ↔ Regulation Mappings

Sourced directly from the official CQC document "ASC KLOEs mapped to regulations (June 2018)".

```typescript
async function seedKloeRegulationMappings() {
  const kloes = await prisma.cqcKloe.findMany()
  const regs = await prisma.cqcRegulation.findMany()
  const kloeMap = Object.fromEntries(kloes.map(k => [k.code, k.id]))
  const regMap = Object.fromEntries(regs.map(r => [r.code, r.id]))

  // Format: [kloeCode, regCode, mappingType]
  const mappings: [string, string, string][] = [
    // S1 — Safeguarding
    ['S1', 'REG12', 'suggested'], ['S1', 'REG13', 'suggested'], ['S1', 'REG19', 'suggested'],
    ['S1', 'REG10', 'also_consider'], ['S1', 'REG14', 'also_consider'], ['S1', 'REG17', 'also_consider'],
    // S2 — Risk assessment
    ['S2', 'REG12', 'suggested'], ['S2', 'REG13', 'suggested'], ['S2', 'REG15', 'suggested'],
    ['S2', 'REG17', 'also_consider'], ['S2', 'REG20', 'also_consider'],
    // S3 — Staffing
    ['S3', 'REG12', 'suggested'], ['S3', 'REG18', 'suggested'], ['S3', 'REG19', 'suggested'],
    ['S3', 'REG17', 'also_consider'],
    // S4 — Medicines
    ['S4', 'REG12', 'suggested'], ['S4', 'REG9', 'also_consider'], ['S4', 'REG17', 'also_consider'],
    // S5 — Infection control
    ['S5', 'REG12', 'suggested'], ['S5', 'REG15', 'also_consider'], ['S5', 'REG17', 'also_consider'],
    // S6 — Learning from incidents
    ['S6', 'REG17', 'suggested'], ['S6', 'REG20', 'suggested'],
    // E1 — Evidence-based care
    ['E1', 'REG9', 'suggested'], ['E1', 'REG12', 'suggested'], ['E1', 'REG14', 'suggested'],
    ['E1', 'REG10', 'also_consider'], ['E1', 'REG13', 'also_consider'], ['E1', 'REG17', 'also_consider'],
    // E2 — Staff skills
    ['E2', 'REG18', 'suggested'], ['E2', 'REG19', 'suggested'],
    ['E2', 'REG12', 'also_consider'], ['E2', 'REG9', 'also_consider'], ['E2', 'REG17', 'also_consider'],
    // E3 — Nutrition
    ['E3', 'REG14', 'suggested'], ['E3', 'REG12', 'also_consider'], ['E3', 'REG9', 'also_consider'],
    ['E3', 'REG11', 'also_consider'], ['E3', 'REG17', 'also_consider'], ['E3', 'REG18', 'also_consider'],
    // E4 — Staff coordination
    ['E4', 'REG9', 'suggested'], ['E4', 'REG12', 'also_consider'], ['E4', 'REG17', 'also_consider'],
    // E5 — Healthier lives
    ['E5', 'REG9', 'suggested'], ['E5', 'REG12', 'suggested'],
    ['E5', 'REG13', 'also_consider'], ['E5', 'REG17', 'also_consider'],
    // E6 — Premises
    ['E6', 'REG15', 'suggested'], ['E6', 'REG9', 'also_consider'],
    ['E6', 'REG10', 'also_consider'], ['E6', 'REG17', 'also_consider'],
    // E7 — Consent
    ['E7', 'REG11', 'suggested'], ['E7', 'REG9', 'also_consider'],
    ['E7', 'REG10', 'also_consider'], ['E7', 'REG17', 'also_consider'],
    // C1 — Kindness
    ['C1', 'REG10', 'suggested'], ['C1', 'REG9', 'also_consider'],
    ['C1', 'REG17', 'also_consider'], ['C1', 'REG19', 'also_consider'],
    // C2 — Care decisions
    ['C2', 'REG9', 'suggested'], ['C2', 'REG10', 'also_consider'],
    ['C2', 'REG17', 'also_consider'], ['C2', 'REG20', 'also_consider'],
    // C3 — Privacy & dignity
    ['C3', 'REG10', 'suggested'], ['C3', 'REG9', 'also_consider'],
    ['C3', 'REG15', 'also_consider'], ['C3', 'REG17', 'also_consider'],
    // R1 — Personalised care
    ['R1', 'REG9', 'suggested'], ['R1', 'REG12', 'suggested'],
    ['R1', 'REG10', 'also_consider'], ['R1', 'REG11', 'also_consider'],
    ['R1', 'REG13', 'also_consider'], ['R1', 'REG15', 'also_consider'], ['R1', 'REG17', 'also_consider'],
    // R2 — Complaints
    ['R2', 'REG16', 'suggested'], ['R2', 'REG12', 'also_consider'],
    ['R2', 'REG17', 'also_consider'], ['R2', 'REG20', 'also_consider'],
    // R3 — End of life / timely access
    ['R3', 'REG9', 'suggested'], ['R3', 'REG10', 'also_consider'],
    ['R3', 'REG11', 'also_consider'], ['R3', 'REG14', 'also_consider'], ['R3', 'REG17', 'also_consider'],
    // W1 — Vision & culture
    ['W1', 'REG17', 'suggested'], ['W1', 'REG19', 'also_consider'],
    // W2 — Governance
    ['W2', 'REG17', 'suggested'], ['W2', 'REG18', 'also_consider'], ['W2', 'REG19', 'also_consider'],
    // W3 — Engagement
    ['W3', 'REG9', 'suggested'], ['W3', 'REG17', 'suggested'],
    ['W3', 'REG10', 'also_consider'], ['W3', 'REG18', 'also_consider'], ['W3', 'REG20', 'also_consider'],
    // W4 — Learning & innovation
    ['W4', 'REG17', 'suggested'], ['W4', 'REG16', 'also_consider'], ['W4', 'REG20', 'also_consider'],
    // W5 — Partnerships
    ['W5', 'REG12', 'suggested'], ['W5', 'REG17', 'suggested'], ['W5', 'REG9', 'also_consider'],
    // W6 — Self-assessment
    ['W6', 'REG17', 'suggested'],
  ]

  for (const [kloeCode, regCode, mappingType] of mappings) {
    const kloeId = kloeMap[kloeCode]
    const regulationId = regMap[regCode]
    if (!kloeId || !regulationId) continue

    await prisma.cqcKloeRegulation.upsert({
      where: { kloeId_regulationId: { kloeId, regulationId } },
      update: { mappingType },
      create: { kloeId, regulationId, mappingType },
    })
  }

  console.log(`  ✓ ${mappings.length} KLOE-Regulation mappings seeded`)
}
```

### 9.6 Running the Seed

```json
// package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

```bash
pnpm db:seed          # Run seed
pnpm db:push          # Push schema (dev only)
pnpm db:migrate       # Create + run migrations (production)
```

---

## 10. Migration Strategy

### 10.1 Development Workflow

```bash
# 1. Make changes to prisma/schema.prisma

# 2. Push directly to dev database (fast iteration, no migration files)
npx prisma db push

# 3. When ready to commit, create a proper migration
npx prisma migrate dev --name describe_the_change

# 4. Generate updated Prisma client
npx prisma generate
```

### 10.2 Production Deployment

```bash
# In CI/CD pipeline (GitHub Actions)
npx prisma migrate deploy     # Applies pending migrations
npx prisma db seed             # Re-runs seed (upserts are safe)
```

### 10.3 Migration Naming Convention

```
YYYYMMDDHHMMSS_description

Examples:
20260210120000_initial_schema
20260215090000_add_policy_versions
20260301140000_add_duty_of_candour_fields_to_incidents
```

---

## 11. Common Query Patterns

### 11.1 Dashboard: Fetch Compliance Overview

```typescript
const dashboard = await db.complianceScore.findUnique({
  where: { organizationId },
  include: {
    domainScores: { orderBy: { domain: 'asc' } },
  },
})
```

### 11.2 Gaps: Priority List for Dashboard

```typescript
const priorityGaps = await db.complianceGap.findMany({
  where: {
    organizationId,
    status: { in: ['OPEN', 'IN_PROGRESS'] },
    severity: { in: ['CRITICAL', 'HIGH'] },
  },
  orderBy: [
    { severity: 'asc' },      // CRITICAL first
    { identifiedAt: 'asc' },  // Oldest first
  ],
  take: 5,
})
```

### 11.3 Evidence: Filtered Library with Pagination

```typescript
const [evidence, total] = await Promise.all([
  db.evidence.findMany({
    where: {
      organizationId,
      category: filter.category || undefined,
      status: filter.status || undefined,
      deletedAt: null,
    },
    include: {
      uploadedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { uploadedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  }),
  db.evidence.count({ where: { organizationId, deletedAt: null } }),
])
```

### 11.4 Cron: Expiring Documents (30-day window)

```typescript
const thirtyDaysFromNow = new Date()
thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

const expiringDocs = await db.evidence.findMany({
  where: {
    validUntil: { lte: thirtyDaysFromNow, gte: new Date() },
    isExpired: false,
    deletedAt: null,
  },
  include: { organization: { select: { id: true, name: true } } },
})
```

### 11.5 Activity Log: Audit Trail for Entity

```typescript
const auditTrail = await db.activityLog.findMany({
  where: {
    organizationId,
    entityType: 'Evidence',
    entityId: evidenceId,
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
})
```

---

## 12. Data Retention & GDPR

### 12.1 Retention Periods

| Data Type | Retention | Reason |
|---|---|---|
| Activity logs | 7 years | NHS Records Management Code |
| Compliance scores | Indefinite | Trend analysis |
| Evidence | Until org deletes + 30 days grace | GDPR right to erasure |
| Policies | Until org deletes + 30 days grace | GDPR right to erasure |
| Staff records | 6 years after employment ends | Limitation Act 1980 |
| Training records | 6 years after employment ends | Employment law |
| Incident records | 10 years (or 25 if minor involved) | NHS retention schedule |
| User accounts | Until deletion request | GDPR |

### 12.2 GDPR Data Subject Access Request (DSAR)

When a user requests their data, export from:
1. `users` — their profile record
2. `activity_logs` — entries where `actorId` matches
3. `evidence` — entries where `uploadedById` matches
4. `tasks` — entries where `assignedToId` or `createdById` matches
5. `notifications` — entries where `userId` matches

### 12.3 Right to Erasure

Soft delete the user record (`deletedAt` timestamp). After 30 days, a background job permanently removes personally identifiable data while preserving anonymized audit entries.

---

## 13. Performance Considerations

### 13.1 Expected Table Sizes (Per Organization)

| Table | Expected Rows | Growth Rate |
|---|---|---|
| Assessment answers | 50-200 | Per assessment (infrequent) |
| Compliance gaps | 10-50 | Identified then resolved |
| Evidence | 50-500 | ~5-20 per month |
| Policies | 20-50 | Low churn |
| Staff members | 5-500 | Slow growth |
| Training records | 50-5,000 | Staff × courses |
| Incidents | 5-100/year | Varies by service |
| Tasks | 20-200 | Ongoing creation/completion |
| Notifications | 100-2,000/year | System-generated |
| Activity logs | 1,000-50,000/year | Every action logged |

### 13.2 Query Optimization Notes

1. **Activity logs** will grow fastest — use time-based partitioning if a single org exceeds 100K rows
2. **Notifications** should be periodically archived (delete read notifications older than 90 days)
3. **Compliance score** is a single row per org — always fast
4. **Evidence filtering** by `linkedKloes` uses PostgreSQL array contains (`@>`) — add GIN index if slow:
   ```sql
   CREATE INDEX idx_evidence_linked_kloes ON evidence USING GIN (linked_kloes);
   ```

---

## Quick Reference: Model Count

| Category | Models | Count |
|---|---|---|
| Core entities | Organization, User | 2 |
| Assessment | Assessment, AssessmentAnswer | 2 |
| Compliance | ComplianceScore, DomainScore, ComplianceGap | 3 |
| Evidence & Policies | Evidence, Policy, PolicyVersion | 3 |
| Staff | StaffMember, TrainingRecord | 2 |
| Operations | Incident, Task | 2 |
| System | Notification, ActivityLog | 2 |
| CQC Reference (seed) | CqcDomain, CqcKloe, CqcRegulation, CqcKloeRegulation | 4 |
| **Total** | | **20 models** |
| **Enums** | | **20 enums** |
