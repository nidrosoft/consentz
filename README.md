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

### Core User Journey

```
Sign up → Select service type → Complete ~60 compliance questions
  → Get predicted CQC rating → See all gaps ranked by severity
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

### CQC Domain Management
- Drill-down into each domain (Safe, Effective, Caring, Responsive, Well-Led)
- Per-KLOE compliance status with evidence mapping
- Gap analysis with auto-generated remediation steps
- Regulation cross-referencing (14 Fundamental Standards)

### Evidence Library
- Grid and list view with domain-linked evidence
- Status tracking (Valid, Expiring Soon, Expired)
- CQC domain and KLOE linking for each document
- Automated expiry notifications

### Policy Management
- Policy library with versioning and approval workflow
- AI-powered policy generation (planned)
- Template library covering all required CQC policies
- Review date tracking and reminders

### Staff Directory & Credentials
- Staff profiles with role classification (Medical, Non-Medical, Administrative)
- DBS clearance tracking with expiry alerts
- GMC registration monitoring (medical staff)
- Aesthetic qualification tracking (non-medical practitioners)
- Training matrix with mandatory course tracking

### Incident Reporting
- Incident categorisation (Premises, Patient Complication)
- Severity classification (Critical, Major, Minor, Near Miss)
- Investigation workflow with root cause analysis
- CQC domain and regulation linking

### Task Management
- Kanban board and list views
- Auto-generated tasks from compliance gaps
- Domain-linked tasks with priority levels
- Assignment and due date tracking

### Audit Log
- Immutable activity trail for all platform actions
- 7-year retention per NHS Records Management Code
- Filterable by user, entity type, and action
- Expandable entries with full change details

### Reports & Export
- Compliance summary reports
- Domain breakdown reports
- Inspection preparation (AI-assisted, planned)
- PDF/CSV export capabilities

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
| React Hook Form + Zod | Latest | Form handling & validation |
| Recharts | 3.x | Data visualisation |
| Motion (Framer) | 12.x | Animations |

### Backend (Planned)

| Technology | Purpose |
|---|---|
| Next.js Route Handlers | API layer (`/app/api/`) |
| Prisma | ORM (type-safe database access) |
| Supabase PostgreSQL | Database (`eu-west-2` London, UK data residency) |
| Supabase Storage | File uploads (evidence, policies, certificates) |
| Clerk | Authentication (SSO, MFA, session management) |
| Anthropic Claude | AI services (policy generation, gap analysis) |
| Resend | Transactional email |
| Sentry | Error tracking & monitoring |

### Infrastructure

| Component | Service |
|---|---|
| Hosting | Vercel (`eu-west-2` London region) |
| Database | Supabase PostgreSQL (`eu-west-2`) |
| Storage | Supabase Storage (private buckets, encrypted at rest) |
| CI/CD | GitHub Actions |

---

## Getting Started

### Prerequisites

- Node.js 20+ or Bun
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/nidrosoft/consentz.git
cd consentz

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

To run on a custom port:

```bash
PORT=3008 npm run dev
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
│   │       ├── [step]/             # Dynamic step pages (1–4)
│   │       └── results/            # Score + gap summary
│   ├── (dashboard)/                # Main authenticated app
│   │   ├── page.tsx                # Dashboard home
│   │   ├── domains/                # CQC domain pages
│   │   │   ├── [domain]/           # Single domain detail
│   │   │   └── [domain]/[kloe]/    # Single KLOE detail
│   │   ├── evidence/               # Evidence library
│   │   ├── policies/               # Policy management
│   │   ├── staff/                  # Staff directory & training
│   │   ├── incidents/              # Incident reporting
│   │   ├── tasks/                  # Task board (kanban + list)
│   │   ├── audits/                 # Audit log
│   │   ├── reports/                # Reports hub
│   │   ├── notifications/          # Notification centre
│   │   └── settings/               # Organisation settings
│   └── api/                        # API route handlers
│       ├── assessment/
│       ├── compliance/
│       ├── evidence/
│       ├── policies/
│       ├── staff/
│       ├── incidents/
│       ├── tasks/
│       ├── reports/
│       ├── ai/
│       ├── cron/
│       └── webhooks/
├── components/
│   ├── base/                       # Core UI primitives (Button, Input, Select, etc.)
│   ├── application/                # Complex components (Table, Modal, DatePicker, etc.)
│   ├── foundations/                 # Design tokens, icons, logos
│   ├── marketing/                  # Marketing-specific components
│   ├── shared-assets/              # Illustrations, patterns
│   └── shared/                     # Cross-cutting components (DomainBadge, etc.)
├── hooks/                          # Custom React hooks
├── lib/
│   ├── constants/                  # CQC framework data, route constants
│   ├── mock-data/                  # Development mock data store
│   ├── services/                   # Business logic layer
│   └── validations/                # Zod validation schemas
├── providers/                      # React context providers
├── stores/                         # Zustand state stores
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
| `/sign-in` | Authentication (Clerk) |
| `/sign-up` | Registration |

### Onboarding Routes

| Path | Purpose |
|---|---|
| `/welcome` | Welcome screen after first login |
| `/assessment/[step]` | Assessment wizard (steps 1–4) |
| `/assessment/results` | Results with score and gaps |

### Dashboard Routes

| Path | Purpose |
|---|---|
| `/` | Dashboard overview (score, gaps, tasks, activity) |
| `/domains` | All 5 CQC domains overview |
| `/domains/[domain]` | Single domain detail (Safe, Effective, etc.) |
| `/domains/[domain]/[kloe]` | Single KLOE detail with evidence |
| `/evidence` | Evidence library (grid/list) |
| `/evidence/upload` | Upload evidence |
| `/policies` | Policy library |
| `/policies/create` | Create or generate policy |
| `/staff` | Staff directory |
| `/staff/training` | Training matrix |
| `/incidents` | Incident log |
| `/incidents/report` | Report new incident |
| `/tasks` | Task board |
| `/audits` | Audit log |
| `/reports` | Reports hub |
| `/settings` | Organisation settings |

---

## API Architecture

The API follows a layered architecture:

```
Request → Clerk Auth → Zod Validation → Rate Limiting → Service Layer → Prisma → Database
```

### Key API Modules

| Module | Endpoints | Description |
|---|---|---|
| Assessment | `/api/assessment/*` | Save answers, run scoring engine |
| Compliance | `/api/compliance/*` | Score retrieval, gap management |
| Evidence | `/api/evidence/*` | CRUD + file upload |
| Policies | `/api/policies/*` | CRUD + AI generation + approval workflow |
| Staff | `/api/staff/*` | Directory + training records |
| Incidents | `/api/incidents/*` | Reporting + investigation |
| Tasks | `/api/tasks/*` | CRUD + auto-generation from gaps |
| Reports | `/api/reports/*` | Generation + PDF/CSV export |
| AI | `/api/ai/*` | Policy generation, compliance chat |
| Dashboard | `/api/dashboard/*` | Aggregated overview data |
| Cron | `/api/cron/*` | Expiry checks, score recalculation |

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

### 20 Prisma Models

| Category | Models |
|---|---|
| Core | Organisation, User |
| Assessment | Assessment, AssessmentAnswer |
| Compliance | ComplianceScore, DomainScore, ComplianceGap |
| Documents | Evidence, Policy, PolicyVersion |
| Staff | StaffMember, TrainingRecord |
| Operations | Incident, Task |
| System | Notification, ActivityLog |
| CQC Reference (seed) | CqcDomain, CqcKloe, CqcRegulation, KloeRegulationMap |

### Key Design Principles

- **Organisation-scoped**: Every user-created record belongs to an `organizationId`
- **Soft deletes**: Critical entities use `deletedAt` timestamps
- **Audit everything**: Every mutation writes to `ActivityLog` (7-year retention)
- **Seed vs. user data**: CQC framework data is seeded; user data is runtime
- **UK data residency**: All data stored in `eu-west-2` (London)

---

## Authentication & Security

### Authentication

- **Provider**: Clerk (email, Google, Microsoft SSO)
- **MFA**: Supported and recommended
- **Session**: JWT-based with secure cookie management
- **Webhook sync**: User data synced from Clerk to database

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
| SQL injection | Prevented by Prisma parameterised queries |
| XSS prevention | React auto-escaping + CSP headers |
| Rate limiting | Per-user API throttling |
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
| Effective | Violet (`#8B5CF6`) | Target |
| Caring | Pink (`#EC4899`) | Heart |
| Responsive | Amber (`#F59E0B`) | Zap |
| Well-Led | Emerald (`#10B981`) | Trophy |

### Filter Pattern

All list pages use a consistent filter UX:

1. Search input (full width, left)
2. "Filters" button with active count badge (right)
3. Collapsible panel with labelled `Select` dropdowns in a responsive grid
4. Active filter chips with category labels and dismiss buttons
5. Sort toggle (where applicable) and "Clear all" link

---

## Deployment

### Hosting

The application is designed to deploy on **Vercel** with UK data residency:

- **Region**: `eu-west-2` (London)
- **Database**: Supabase PostgreSQL (London)
- **Storage**: Supabase Storage (encrypted at rest)
- **SSL**: Automatic via Vercel

### Environment Variables

```bash
# App
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (Prisma → Supabase PostgreSQL)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# AI
OPENAI_API_KEY=sk_...

# Email
RESEND_API_KEY=re_...

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

### Build & Deploy

```bash
npm run build     # TypeScript compilation + Next.js build
npm run start     # Start production server
```

---

## Specification Documents

The platform is defined across 7 comprehensive specification documents totalling ~17,300 lines:

| File | Lines | Contents |
|---|---|---|
| `00-CURSOR-INSTRUCTIONS.md` | ~390 | Master build instructions, phase order, cross-references |
| `01-ARCHITECTURE.md` | ~980 | Tech stack, file structure, route map, deployment config |
| `02-DATABASE.md` | ~1,830 | 20 Prisma models, enums, relationships, seed data, queries |
| `03-UI-UX.md` | ~2,340 | Design system, 30+ page wireframes, component specs |
| `04-CQC-FRAMEWORK.md` | ~3,500 | 5 domains, 25 KLOEs, 14 regulations, policy templates, scoring |
| `05-API-SERVICES.md` | ~4,950 | 55 API routes, Zod schemas, service layer, AI integration |
| `06-AUTH-SECURITY.md` | ~1,530 | Clerk auth, RBAC, multi-tenancy, GDPR, security controls |
| `07-ASSESSMENT-ENGINE.md` | ~2,150 | 121 questions, scoring pipeline, rating prediction, gap engine |

---

## Current Status

The platform is currently in **active development** with a functional frontend:

**Implemented:**
- Full dashboard with compliance scoring and CQC domain overview
- Staff directory with DBS, GMC, and aesthetic qualification tracking
- Evidence library with grid/list views and domain linking
- Policy management with category filtering
- Incident reporting with premises/patient complication types
- Task management (kanban board + list view)
- Audit log with expandable entries
- CQC domain detail pages with gap analysis
- Assessment wizard (onboarding flow)
- Consistent filter UI across all pages
- Mock data layer for development

**Pending:**
- Backend API integration (Prisma + Supabase)
- Clerk authentication integration
- AI policy generation (Anthropic Claude)
- Real-time compliance recalculation
- Email notifications (Resend)
- SSO/session sharing with Consentz CRM
- Branding alignment with Consentz CRM (fonts, logos, button styles)

---

## Relationship to Consentz

This platform is built as a **standalone product**. It will later integrate into [Consentz](https://consentz.com) — a UK clinic management system — via SDK, webhooks, and API. The future integration will:

- Pull consent forms, appointment data, staff rotas, and stock usage from Consentz
- Transform existing CRM data into CQC compliance evidence (~70% of required evidence already exists)
- Enable SSO/session sharing between the platforms

---

## License

This project is proprietary software developed for Consentz. The UI component library (Untitled UI React) open-source components are licensed under the MIT license.
