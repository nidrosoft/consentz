# Consentz — CQC Compliance Platform

A **CQC (Care Quality Commission) compliance management platform** for UK healthcare providers. Designed for **Aesthetic Clinics** and **Care Homes**, the platform assesses compliance against the CQC regulatory framework, identifies gaps, predicts CQC ratings, and provides actionable tools to achieve and maintain a **Good** or **Outstanding** rating.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [CQC Framework](#cqc-framework)
- [Pages & Routes](#pages--routes)
- [API Architecture](#api-architecture)
- [Database Schema](#database-schema)
- [Authentication & Security](#authentication--security)
- [Assessment Engine](#assessment-engine)
- [Consentz Integration](#consentz-integration)
- [Design System](#design-system)
- [Deployment](#deployment)
- [Specification Documents](#specification-documents)
- [License](#license)

---

## Overview

### The Problem

UK healthcare providers regulated by the CQC face complex, ongoing compliance requirements across 5 quality domains, 25 Key Lines of Enquiry (KLOEs), and 14 Fundamental Standards. Most providers manage this through spreadsheets, paper files, and disconnected processes — leaving them exposed during inspections.

### The Solution

Consentz provides a single platform that:

1. **Assesses** compliance through a structured, service-type-specific questionnaire
2. **Identifies** every gap against CQC regulations, ranked by severity
3. **Predicts** the organisation's CQC rating using the same methodology inspectors use
4. **Remediates** gaps with AI-generated policies, task management, evidence tracking, and staff training records
5. **Maintains** compliance with automated expiry alerts, periodic re-assessment, and live scoring
6. **Integrates** with Consentz CRM to auto-import consent forms, patient feedback, safety checklists, and treatment risk data

### Core User Journey

```
Sign up → Select service type → Complete ~60 compliance questions
  → Get predicted CQC rating → See all gaps ranked by severity
  → Complete onboarding checklist (profile, Consentz link, evidence, staff, domains)
  → Resolve gaps (upload evidence, generate policies, complete training)
  → Score improves in real-time → Prepare for CQC inspection
```

### Supported Service Types

| Service Type | Description |
|---|---|
| **Aesthetic Clinics** | Independent clinics providing cosmetic/aesthetic procedures |
| **Care Homes** | Residential adult social care facilities (with or without nursing) |

---

## Key Features

### Dashboard & Compliance Scoring
- Real-time compliance score with trend tracking
- Predicted CQC rating (Outstanding, Good, Requires Improvement, Inadequate)
- Domain-level breakdown across all 5 CQC domains
- KLOE sub-code visibility per domain card
- Priority gaps with severity indicators and remediation actions
- Upcoming deadlines with urgency tracking
- AI compliance chat assistant

### Onboarding & Account Setup
- Guided first-time user walkthrough with spotlight overlay
- 5-step sidebar checklist (org profile, Consentz link, evidence, staff, domains)
- Auto-completing steps when users perform real actions
- Service-type-specific initial assessment (~60 questions)
- Immediate gap generation and remediation task creation from results

### CQC Domain Management
- Drill-down into each domain (Safe, Effective, Caring, Responsive, Well-Led)
- Per-KLOE compliance scoring based on evidence, gaps, policies, and training
- Toggleable card/list views for KLOEs and gaps
- Gap analysis with auto-generated remediation steps and expandable details
- Regulation cross-referencing (14 Fundamental Standards per KLOE)
- Treatment risk heatmap with vibrant colour-coded severity
- Requirements checklist per KLOE with actionable links to evidence upload

### Evidence Library
- Grid and list view with domain-linked evidence
- Status tracking (Valid, Expiring Soon, Expired)
- CQC domain and KLOE linking for each document
- Pre-filled upload form when navigating from KLOE requirements
- Automated expiry notifications

### Policy Management
- Policy library with versioning and approval/publish workflow
- AI-powered policy generation via Anthropic Claude with comprehensive CQC system prompt
- Policy template library covering all required CQC policies
- Rate-limited AI generation (3 requests per 10 minutes) with server-side retry
- Review date tracking and reminders
- Category and domain filtering

### Staff Directory & Credentials
- Staff profiles with role classification (Medical, Non-Medical, Administrative)
- DBS clearance tracking with expiry alerts
- GMC registration monitoring (medical staff)
- Aesthetic qualification tracking (non-medical practitioners)
- Training matrix with mandatory course tracking
- Inline editing of contact and department details
- Consentz staff competency metrics integration

### Incident Reporting
- Incident categorisation (Premises, Patient Complication)
- Severity classification (Critical, Major, Minor, Near Miss)
- Investigation workflow with root cause analysis
- CQC domain and regulation linking

### Task Management
- Kanban board, list, and "My Tasks" views
- Auto-generated tasks from compliance gaps
- Domain-linked tasks with priority levels
- Real-time assignee management from live staff data
- Due date tracking with overdue detection

### Audit Log
- Immutable activity trail for all platform actions
- 7-year retention per NHS Records Management Code
- Filterable by user, entity type, and action
- Expandable entries with full change details

### Reports & Export
- Compliance summary reports
- Domain breakdown reports
- Inspection preparation (AI-assisted)
- PDF/CSV export capabilities

### Notifications
- In-app notification centre
- Email notifications via Resend (16 transactional templates)
- Weekly digest and monthly compliance reports
- Credential expiry and score change alerts

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.x | Framework (App Router, Turbopack) |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.1 | Utility-first styling |
| React Aria Components | 1.x | Accessible component primitives |
| Untitled UI React | Latest | Component library |
| Zustand | 5.x | Client-side state management |
| TanStack Query | 5.x | Server state & caching |
| Zod | Latest | Schema validation |
| Recharts | 3.x | Data visualisation |
| Motion (Framer) | 12.x | Animations |

### Backend

| Technology | Purpose |
|---|---|
| Next.js Route Handlers | API layer (`/app/api/` — 24 modules, 55+ endpoints) |
| Supabase PostgreSQL | Database (`eu-west-2` London, UK data residency) |
| Supabase Storage | File uploads (evidence, policies, certificates) |
| Supabase Auth | Authentication (email/password, SSO) |
| Anthropic Claude | AI policy generation with CQC-specific system prompt |
| Resend | Transactional email (16 templates) |
| Stripe | Subscription billing |
| Sentry | Error tracking & monitoring |

### Infrastructure

| Component | Service |
|---|---|
| Hosting | Vercel (London region) |
| Database | Supabase PostgreSQL (`eu-west-2`) |
| Storage | Supabase Storage (private buckets, encrypted at rest) |
| CI/CD | Vercel Git integration |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/daxconsentz/AIConsentzCQC.git
cd consentz

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI (Anthropic Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Email (Resend)
RESEND_API_KEY=re_...

# Billing (Stripe)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Monitoring (Sentry)
SENTRY_DSN=https://...@sentry.io/...

# Consentz CRM Integration
CONSENTZ_API_URL=https://api.consentz.com
```

### Available Scripts

```bash
npm run dev       # Start development server (Turbopack)
npm run build     # Production build
npm run start     # Start production server
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                     # Sign-in / sign-up pages
│   ├── (onboarding)/               # Welcome + assessment wizard
│   │   ├── welcome/
│   │   └── assessment/
│   ├── (assessment)/               # Assessment steps + results
│   ├── (dashboard)/                # Main authenticated app
│   │   ├── page.tsx                # Dashboard home
│   │   ├── domains/                # CQC domain pages
│   │   │   ├── [domain]/           # Single domain detail
│   │   │   └── [domain]/[kloe]/    # Single KLOE detail
│   │   ├── evidence/               # Evidence library + upload
│   │   ├── policies/               # Policy management + AI generation
│   │   ├── staff/                  # Staff directory + training
│   │   ├── incidents/              # Incident reporting + investigation
│   │   ├── tasks/                  # Task board (kanban + list + my tasks)
│   │   ├── audits/                 # Audit log
│   │   ├── reports/                # Reports hub
│   │   ├── notifications/          # Notification centre
│   │   ├── reassessment/           # Periodic re-assessment
│   │   └── settings/               # Organisation settings + integrations
│   ├── api/                        # API route handlers (24 modules)
│   │   ├── ai/                     # Chat, evidence summary, gap analysis
│   │   ├── assessment/             # Assessment CRUD + scoring
│   │   ├── auth/                   # User provisioning
│   │   ├── billing/                # Stripe checkout, subscription, portal
│   │   ├── compliance/             # Score retrieval, gap management
│   │   ├── consentz/               # CRM integration (7 metric endpoints)
│   │   ├── cqc/                    # Domains, KLOEs, regulations
│   │   ├── cron/                   # Scheduled jobs (expiry, sync, digest)
│   │   ├── dashboard/              # Aggregated overview + activity
│   │   ├── email/                  # Webhook receiver
│   │   ├── evidence/               # CRUD + file upload + download
│   │   ├── incidents/              # CRUD + investigation
│   │   ├── notifications/          # CRUD + mark-read
│   │   ├── onboarding/             # Progress, org setup, assessment
│   │   ├── organization/           # CRUD + user management
│   │   ├── policies/               # CRUD + AI generation + approval
│   │   ├── reports/                # Generation + export
│   │   ├── sdk/                    # API keys + external SDK endpoints
│   │   ├── staff/                  # CRUD + training + credentials
│   │   ├── tasks/                  # CRUD + auto-generation from gaps
│   │   ├── walkthrough/            # First-time walkthrough progress
│   │   └── webhooks/               # Stripe webhook handler
│   ├── sitemap.ts                  # Dynamic sitemap for SEO
│   ├── robots.ts                   # Crawler directives
│   └── manifest.ts                 # PWA manifest
├── components/
│   ├── base/                       # Core UI primitives (Button, Input, Select, etc.)
│   ├── application/                # Complex components (Table, Modal, DatePicker, etc.)
│   ├── foundations/                 # Design tokens, icons, logos
│   ├── walkthrough/                # Guided tour overlay system
│   └── shared-assets/              # Illustrations, patterns
├── hooks/                          # 17 custom React hooks
├── lib/
│   ├── ai/                         # AI chat system prompt
│   ├── consentz/                   # Consentz CRM client + sync service
│   ├── constants/                  # CQC framework data, routes, assessment questions
│   ├── email/                      # 16 Resend email templates
│   ├── services/                   # 18 business logic services
│   └── validations/                # Zod schemas for all API endpoints
├── providers/                      # React context providers
├── stores/                         # Zustand state stores (UI store)
├── styles/                         # Global CSS, theme, typography
├── types/                          # TypeScript type definitions
└── utils/                          # Utility functions
```

---

## CQC Framework

The platform is built around the CQC's inspection methodology:

### Five Domains

| Domain | KLOEs | Key Question |
|---|---|---|
| **Safe** | S1–S6 | Are people protected from abuse and avoidable harm? |
| **Effective** | E1–E7 | Does care achieve good outcomes and promote quality of life? |
| **Caring** | C1–C3 | Does the service treat people with compassion and respect? |
| **Responsive** | R1–R3 | Are services organised to meet people's needs? |
| **Well-Led** | W1–W6 | Does leadership assure high-quality, person-centred care? |

### Rating Bands

| Rating | Score Range | Description |
|---|---|---|
| Outstanding | 88–100% | Service is performing exceptionally |
| Good | 63–87% | Service is performing well |
| Requires Improvement | 39–62% | Service is not performing as well as it should |
| Inadequate | 0–38% | Service is performing badly |

### Critical Scoring Rule

A single **Critical** severity gap caps the domain rating at **Requires Improvement**, regardless of the percentage score. This mirrors real CQC methodology — a provider cannot be rated "Good" if they have a critical failure in any domain.

### 14 Fundamental Standards

The platform maps compliance against CQC Regulations 9–20A of the Health and Social Care Act 2008 (Regulated Activities) Regulations 2014, including:

- Regulation 9: Person-centred care
- Regulation 10: Dignity and respect
- Regulation 11: Need for consent
- Regulation 12: Safe care and treatment
- Regulation 13: Safeguarding from abuse
- Regulation 14: Meeting nutritional needs
- Regulation 15: Premises and equipment
- Regulation 16: Complaints handling
- Regulation 17: Good governance
- Regulation 18: Staffing
- Regulation 19: Fit and proper persons
- Regulation 20: Duty of candour
- Regulation 20A: Display of performance assessments

---

## Pages & Routes

### Public Routes

| Path | Purpose |
|---|---|
| `/sign-in` | Authentication |
| `/sign-up` | Registration |

### Onboarding Routes

| Path | Purpose |
|---|---|
| `/welcome` | Welcome screen after first login |
| `/assessment` | Assessment wizard (domain-by-domain) |
| `/assessment/results` | Results with score, rating, and gaps |

### Dashboard Routes

| Path | Purpose |
|---|---|
| `/` | Dashboard overview (score, gaps, tasks, activity, AI chat) |
| `/domains` | All 5 CQC domains overview with score rings |
| `/domains/[domain]` | Single domain detail (KLOEs, gaps, heatmap) |
| `/domains/[domain]/[kloe]` | Single KLOE detail with evidence + checklist |
| `/evidence` | Evidence library (grid/list) |
| `/evidence/upload` | Upload evidence (pre-fillable from KLOE links) |
| `/evidence/[id]` | Evidence detail |
| `/policies` | Policy library |
| `/policies/create` | Create manually or generate with AI |
| `/policies/[id]` | Policy detail/editor with version history |
| `/staff` | Staff directory |
| `/staff/add` | Add new staff member |
| `/staff/[id]` | Staff detail with inline editing |
| `/staff/training` | Training matrix |
| `/incidents` | Incident log |
| `/incidents/report` | Report new incident |
| `/incidents/[id]` | Incident detail + investigation |
| `/tasks` | Task board (kanban + list + my tasks) |
| `/audits` | Audit log |
| `/reports` | Reports hub |
| `/reports/compliance` | Compliance summary report |
| `/reports/inspection-prep` | Inspection preparation report |
| `/reports/export` | Data export |
| `/reassessment` | Periodic re-assessment |
| `/notifications` | Notification centre |
| `/settings` | Organisation profile, users, billing, integrations, notifications |

---

## API Architecture

The API follows a layered architecture:

```
Request → Supabase Auth → Zod Validation → Rate Limiting → Service Layer → Supabase → Database
```

### Key API Modules

| Module | Endpoints | Description |
|---|---|---|
| Assessment | `/api/assessment/*` | Save answers, run scoring engine |
| Compliance | `/api/compliance/*` | Score retrieval, gap management |
| Consentz | `/api/consentz/*` | CRM integration (7 metric endpoints + sync) |
| Evidence | `/api/evidence/*` | CRUD + file upload + download |
| Policies | `/api/policies/*` | CRUD + AI generation + approval + publish |
| Staff | `/api/staff/*` | Directory + training + credentials |
| Incidents | `/api/incidents/*` | Reporting + investigation |
| Tasks | `/api/tasks/*` | CRUD + auto-generation from gaps |
| Reports | `/api/reports/*` | Generation + PDF/CSV export |
| AI | `/api/ai/*` | Policy generation, compliance chat, gap analysis |
| Dashboard | `/api/dashboard/*` | Aggregated overview data + activity |
| Onboarding | `/api/onboarding/*` | Progress tracking, org setup, assessment |
| Billing | `/api/billing/*` | Stripe checkout, subscription, portal |
| SDK | `/api/sdk/*` | API key management + external SDK endpoints |
| Cron | `/api/cron/*` | Expiry checks, score recalculation, sync, digest |

### Response Contract

All API responses follow a standardised envelope:

```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

---

## Database Schema

### Core Models

| Category | Models |
|---|---|
| Core | Organisation, User |
| Assessment | Assessment, AssessmentResponse |
| Compliance | ComplianceScore, DomainScore, ComplianceGap |
| Documents | Evidence, Policy, PolicyVersion |
| Staff | StaffMember, TrainingRecord, StaffCredential |
| Operations | Incident, Task |
| System | Notification, AuditLog, OnboardingProgress, WalkthroughProgress |
| Integration | ConsentzConnection, SdkKey |
| CQC Reference | CqcDomain, CqcKloe, CqcRegulation, KloeRegulationMap |

### Key Design Principles

- **Organisation-scoped**: Every user-created record belongs to an `organization_id`
- **Soft deletes**: Critical entities use `deleted_at` timestamps
- **Audit everything**: Every mutation writes to the audit log (7-year retention)
- **Seed vs. user data**: CQC framework data is seeded; user data is runtime
- **UK data residency**: All data stored in `eu-west-2` (London)

---

## Authentication & Security

### Authentication

- **Provider**: Supabase Auth (email/password, magic link, SSO)
- **MFA**: Supported via Supabase
- **Session**: JWT-based with secure cookie management
- **Middleware**: Server-side session validation on all protected routes

### Authorisation — 5-Tier RBAC

| Role | Level | Capabilities |
|---|---|---|
| Owner | 5 | Full control, billing, delete organisation |
| Admin | 4 | Manage users, settings, all compliance features |
| Manager | 3 | Manage compliance, evidence, policies, staff, tasks |
| Staff | 2 | View + contribute (report incidents, complete tasks) |
| Viewer | 1 | Read-only access to dashboard and reports |

### Security Controls

| Control | Implementation |
|---|---|
| Data isolation | Organisation-scoped queries + Supabase RLS |
| Encryption at rest | AES-256 (Supabase + S3) |
| Encryption in transit | TLS 1.2+ on all connections |
| Input validation | Zod schemas on every mutation |
| SQL injection | Prevented by Supabase parameterised queries |
| XSS prevention | React auto-escaping + CSP headers |
| Rate limiting | Per-user API throttling (in-memory + AI-specific limits) |
| Audit trail | Immutable activity log, 7-year retention |
| UK GDPR | DPA with Supabase, DSAR handling, right to erasure |

---

## Assessment Engine

The assessment engine is the core intelligence of the platform:

- **121 unique questions** across 5 CQC domains
- **Service-type filtering**: ~61 questions for Aesthetic Clinics, ~65 for Care Homes
- **6 answer types**: yes/no, yes/no/partial, multi-select, scale, date, text
- **4 gap severities**: Critical, High, Medium, Low
- **Weighted scoring** with evidence quality and timeliness factors
- **Rating limiters**: Critical gap caps domain at Requires Improvement
- **Auto-gap generation**: Automatically creates compliance gaps from assessment answers
- **Auto-task creation**: Generates remediation tasks for each identified gap

### Scoring Pipeline

```
Answers → Per-KLOE scoring → Evidence quality factor → Domain aggregation
  → Rating prediction → Gap identification → Remediation task generation
```

### Rating Thresholds

| Rating | Threshold |
|---|---|
| Outstanding | ≥ 88% |
| Good | ≥ 63% |
| Requires Improvement | ≥ 39% |
| Inadequate | < 39% |

### Key Limiters

- Critical gap → domain capped at Requires Improvement
- Any Inadequate domain → overall capped at Requires Improvement
- 2+ domains at Requires Improvement → overall Requires Improvement

---

## Consentz Integration

The platform integrates with the [Consentz CRM](https://consentz.com) to automatically import compliance-relevant data:

### Imported Metrics

| Metric | Endpoint | Domain |
|---|---|---|
| Consent completion rate | `/api/consentz/consent-completion` | Safe |
| Consent decay tracking | `/api/consentz/consent-decay` | Safe |
| Safety checklist compliance | `/api/consentz/safety-checklist` | Safe |
| Treatment risk heatmap | `/api/consentz/treatment-risk-heatmap` | Safe |
| Staff competency scores | `/api/consentz/staff-competency` | Effective, Well-Led |
| Patient feedback / satisfaction | `/api/consentz/patient-feedback` | Caring, Responsive |
| Policy acknowledgement rates | `/api/consentz/policy-acknowledgement` | Well-Led |
| Incident data | `/api/consentz/incidents` | Safe |

### Integration Features

- Credential-based connection via Settings → Integrations
- Manual and automatic sync (cron-based)
- Last sync timestamp tracking
- Disconnect with confirmation

---

## Design System

### Component Library

Built on **Untitled UI React** with **React Aria Components** for accessibility:

- All components follow the compound component pattern
- React Aria imports prefixed with `Aria*` to avoid conflicts
- Consistent size variants: `sm`, `md`, `lg`, `xl`
- Semantic colour system with light/dark mode support

### Colour System

The platform uses semantic colour tokens (not raw values):

| Token | Usage |
|---|---|
| `text-primary` | Page headings, primary content |
| `text-secondary` | Labels, section headings |
| `text-tertiary` | Supporting text, descriptions |
| `bg-primary` | Main backgrounds |
| `bg-secondary` | Contrast sections |
| `border-primary` | Input fields, checkboxes |
| `border-secondary` | Cards, dividers |
| `fg-brand-primary` | Brand-coloured icons |

### CQC Domain Colours

| Domain | Colour | Icon |
|---|---|---|
| Safe | Blue (`#3B82F6`) | Shield |
| Effective | Violet (`#7C3AED`) | Target |
| Caring | Rose (`#F43F5E`) | Heart |
| Responsive | Amber (`#F59E0B`) | Zap |
| Well-Led | Emerald (`#10B981`) | Trophy |

---

## Deployment

### Hosting

The application is deployed on **Vercel** with UK data residency:

- **Region**: London
- **Database**: Supabase PostgreSQL (London)
- **Storage**: Supabase Storage (encrypted at rest)
- **SSL**: Automatic via Vercel
- **Build**: Turbopack (Next.js 16)

### Build & Deploy

```bash
npm run build     # TypeScript compilation + Next.js build
npm run start     # Start production server
```

Deploys automatically via Vercel Git integration on push to `main`.

---

## Specification Documents

The platform is defined across comprehensive specification documents:

| File | Contents |
|---|---|
| `00-CURSOR-INSTRUCTIONS.md` | Master build instructions, phase order, cross-references |
| `01-ARCHITECTURE.md` | Tech stack, file structure, route map, deployment config |
| `02-DATABASE.md` | Database models, enums, relationships, seed data, queries |
| `03-UI-UX.md` | Design system, 30+ page wireframes, component specs |
| `04-CQC-FRAMEWORK.md` | 5 domains, 25 KLOEs, 14 regulations, policy templates, scoring |
| `05-API-SERVICES.md` | 55 API routes, Zod schemas, service layer, AI integration |
| `06-AUTH-SECURITY.md` | Auth, RBAC, multi-tenancy, GDPR, security controls |
| `07-ASSESSMENT-ENGINE.md` | 121 questions, scoring pipeline, rating prediction, gap engine |
| `PRD_First_Time_User_Walkthrough_CQC.md` | First-time user walkthrough and onboarding flow |

---

## Current Status

The platform is **fully functional** with both frontend and backend wired end-to-end:

**Implemented:**
- Full dashboard with live compliance scoring, CQC domain overview, and AI chat
- Guided onboarding with spotlight walkthrough and 5-step account setup checklist
- Assessment engine with gap generation and auto-remediation task creation
- CQC domain management with per-KLOE scoring, evidence mapping, and regulation linking
- Evidence library with upload, KLOE linking, and expiry tracking
- Policy management with AI-powered generation (Anthropic Claude), versioning, and approval workflow
- Staff directory with DBS, GMC, training tracking, and inline editing
- Incident reporting with investigation workflow
- Task management (kanban board, list view, my tasks) with live staff data
- Audit log with 7-year retention
- Reports hub with compliance summary and inspection prep
- Notification centre with email alerts (16 Resend templates)
- Consentz CRM integration (8 metric endpoints + sync)
- Stripe billing integration
- Settings with org profile, user management, integrations, and notifications
- SEO metadata, sitemap, robots.txt, and PWA manifest
- Rate limiting and retry mechanisms for AI operations

---

## Relationship to Consentz

This platform is built as a **standalone product** that integrates with [Consentz](https://consentz.com) — a UK clinic management system — via API. The integration:

- Pulls consent forms, patient feedback, safety checklists, staff competency, and treatment risk data
- Transforms existing CRM data into CQC compliance evidence
- Displays Consentz metrics directly on relevant domain pages
- Supports credential-based connection with manual and automated sync

---

## License

This project is proprietary software developed for Consentz. The UI component library (Untitled UI React) open-source components are licensed under the MIT license.
