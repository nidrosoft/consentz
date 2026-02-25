# CQC Compliance Platform — Architecture & Foundation

> **Codename:** Consentz Compliance Engine
> **Version:** 1.0.0 | **Target:** Cursor AI Development
> **Last Updated:** February 2026
> **Companion Files:** `02-DATABASE.md` · `03-UI-UX.md` · `04-CQC-FRAMEWORK.md` · `05-API-SERVICES.md` · `06-AUTH-SECURITY.md` · `07-ASSESSMENT-ENGINE.md`

---

## 1. What We Are Building

A CQC (Care Quality Commission) compliance management platform for UK healthcare providers. The platform guides users through a compliance assessment, identifies gaps against the CQC regulatory framework, and provides actionable tools to achieve and maintain **Good** or **Outstanding** CQC ratings.

### 1.1 Supported Service Types (Only Two)

| Service Type | Description | Typical User |
|---|---|---|
| **Aesthetic Clinics** | Independent healthcare services providing cosmetic/aesthetic procedures | Clinic owners, medical directors, practice managers |
| **Care Homes** | Residential adult social care facilities (with or without nursing) | Registered managers, compliance officers |

> **Important:** This platform does NOT cover hospitals, GP practices, dentists, mental health services, or domiciliary care. Only Aesthetic Clinics and Care Homes.

### 1.2 Core Value Proposition

```
Assessment-First → Gap Identification → Guided Remediation → Ongoing Compliance
```

1. **Assessment-First:** New users complete a service-type-specific assessment revealing their exact compliance position
2. **Gap Identification:** Automated mapping of gaps against CQC's 5 domains, KLOEs, and Fundamental Standards
3. **Guided Remediation:** AI-powered recommendations, policy generation, task management, and evidence tracking
4. **Ongoing Compliance:** Live scoring, document expiry alerts, training tracking, and inspection preparation

### 1.3 Relationship to Consentz

This platform is built as a **standalone product first**. It will later integrate into Consentz (consentz.com) — a UK clinic management system — via SDK, webhooks, and API. For now, do NOT build any merging logic. Build a fully independent compliance dashboard that authenticates users separately.

The future SDK integration will:
- Pull consent forms, appointment data, staff rotas, and stock usage from Consentz
- Transform that existing data into compliance evidence (approximately 70% of required CQC evidence already exists in Consentz)
- Create webhook triggers for real-time compliance monitoring

> **Build Rule:** Keep it separate. The merging is a UI exercise later. The hard part is the CQC compliance depth.

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 15.x | Framework (App Router, Server Components, Server Actions) |
| TypeScript | 5.x | Language (strict mode) |
| shadcn/ui | Latest | Component library (Geist-style) |
| Tailwind CSS | 3.4+ | Utility-first styling |
| Geist Sans/Mono | Latest | Typography (Vercel fonts) |
| Lucide React | Latest | Icon library |
| React Hook Form | Latest | Form state management |
| Zod | Latest | Schema validation (forms + API) |
| Zustand | Latest | Client-side state management |
| TanStack Query | v5 | Server state management, caching, mutations |
| Recharts | Latest | Charts and data visualization |
| Framer Motion | Latest | Animations and transitions |
| date-fns | Latest | Date manipulation |

### 2.2 Backend

| Technology | Purpose | Notes |
|---|---|---|
| Next.js API Routes | Route Handlers | Server-side logic via `app/api/` |
| Clerk | Authentication | SSO, MFA, webhook user sync |
| Supabase | Database + Storage | PostgreSQL `eu-west-2` (London) region |
| Prisma | ORM | Type-safe database access on top of Supabase PostgreSQL |
| AWS S3 | File storage (backup) | Evidence documents, generated reports (Supabase Storage primary) |
| Resend | Transactional email | Notifications, alerts, reports |
| OpenAI / Claude | AI services | Policy generation, gap remediation, inspection prep |
| Inngest | Background jobs | Scheduled compliance checks, score recalculation |

### 2.3 Infrastructure

| Component | Service | Region / Notes |
|---|---|---|
| App Hosting | AWS (Amplify or EC2/ECS) | `eu-west-2` (London) |
| Database | Supabase PostgreSQL | `eu-west-2` (London) — UK data residency |
| File Storage | Supabase Storage + AWS S3 | `eu-west-2` — encrypted at rest (AES-256) |
| CDN | CloudFront or Vercel Edge | Global edge caching for static assets |
| Cache | Vercel KV (Redis) or ElastiCache | Session data, compliance score caching |
| Monitoring | Sentry | Error tracking and performance |
| Email | Resend | Transactional emails |
| CI/CD | GitHub Actions | Automated testing, linting, deployment |
| DNS | AWS Route 53 | Domain management |

### 2.4 Why Supabase for Database

Supabase provides a managed PostgreSQL database with:
- **UK data residency:** `eu-west-2` (London) region available — all data stays in the UK
- **GDPR compliance:** DPA available, explicitly covers UK GDPR and Data Protection Act 2018
- **SOC 2 Type II:** Annual third-party security audits
- **HIPAA-ready:** BAA available (future-proofing for potential NHS integrations)
- **Encryption:** AES-256 at rest, TLS 1.2+ in transit
- **Row Level Security (RLS):** Native PostgreSQL RLS for multi-tenant data isolation
- **Built-in Storage:** For evidence documents and file uploads
- **Real-time subscriptions:** For live dashboard updates (future use)

> **Architecture Note:** We use Prisma as the ORM layer on top of Supabase PostgreSQL. This gives us type-safe database access, clean migrations, and schema management. Supabase Storage handles file uploads. Clerk handles all authentication — we do NOT use Supabase Auth.

### 2.5 Development Tools

| Tool | Purpose |
|---|---|
| pnpm | Package manager |
| ESLint + Prettier | Code linting and formatting |
| Vitest | Unit and integration testing |
| Playwright | End-to-end testing |
| TypeScript (strict) | Type checking |
| Husky + lint-staged | Git hooks (pre-commit linting) |

---

## 3. Architecture Overview

### 3.1 System Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                  │
│  Next.js 15 App Router ─── shadcn/ui Components ─── Clerk UI    │
│  Server Components ─── Client Components ─── Zustand Stores      │
│  TanStack Query ─── React Hook Form + Zod ─── Recharts          │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│                                                                  │
│  Next.js Route Handlers (/app/api/)                              │
│  ├── Clerk Middleware (auth gate on every request)                │
│  ├── Zod Validation (input sanitization)                         │
│  ├── Rate Limiting (per-user throttling)                         │
│  └── Clerk Webhooks (user sync from Clerk → DB)                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                               │
│                                                                  │
│  AssessmentEngine ────── ComplianceCalculator ─── AIService      │
│  DocumentManager ─────── NotificationService ─── ReportGenerator │
│  (All business logic lives here, never in route handlers)        │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│                                                                  │
│  Prisma ORM ────────── Supabase PostgreSQL (eu-west-2)           │
│  Supabase Storage ──── Evidence files, policy documents          │
│  Vercel KV / Redis ─── Compliance score cache, session data      │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 User Flow

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────────┐
│  Landing    │────▶│  Sign Up    │────▶│  Onboarding          │
│  Page       │     │  (Clerk)    │     │  Assessment Wizard   │
│  (Public)   │     │  Email/SSO  │     │  (5 Steps)           │
└─────────────┘     └─────────────┘     └──────────┬───────────┘
                                                   │
                         ┌─────────────────────────┘
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                    ASSESSMENT FLOW                              │
│                                                                │
│  Step 1          Step 2          Step 3         Step 4         │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐  ┌──────────┐    │
│  │ Service  │──▶│ Business │──▶│ Current  │─▶│ Systems  │    │
│  │ Type     │   │ Details  │   │ CQC      │  │ & Staff  │    │
│  │ Select   │   │ Name,    │   │ Status   │  │ Policies │    │
│  │          │   │ Address, │   │ Rating,  │  │ Training │    │
│  │ Clinic   │   │ CQC ID,  │   │ Inspect  │  │ Software │    │
│  │ or Care  │   │ Size     │   │ Date     │  │ Count    │    │
│  │ Home     │   │          │   │          │  │          │    │
│  └──────────┘   └──────────┘   └──────────┘  └──────────┘    │
│                                                      │         │
│                              Step 5                  │         │
│                              ┌──────────┐            │         │
│                              │ Results  │◀───────────┘         │
│                              │ Summary  │                      │
│                              │ Score,   │                      │
│                              │ Gaps,    │                      │
│                              │ Rating   │                      │
│                              │ Predict  │                      │
│                              └────┬─────┘                      │
└───────────────────────────────────┼────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────┐
│                      MAIN DASHBOARD                            │
│                                                                │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────┐     │
│  │Overview │  │CQC      │  │Evidence  │  │Policies     │     │
│  │(Home)   │  │Domains  │  │Manager   │  │Library      │     │
│  └─────────┘  └─────────┘  └──────────┘  └─────────────┘     │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────┐     │
│  │Staff    │  │Training │  │Incidents │  │Tasks        │     │
│  │Mgmt     │  │Tracker  │  │& Risks   │  │Board        │     │
│  └─────────┘  └─────────┘  └──────────┘  └─────────────┘     │
│  ┌─────────┐  ┌─────────┐  ┌─────────────────────────────┐   │
│  │Reports  │  │Audit    │  │Settings                     │   │
│  │& Export │  │Log      │  │Org · Users · Billing · Notif│   │
│  └─────────┘  └─────────┘  └─────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 Data Flow for Compliance Scoring

```
  User completes         Assessment Engine        Database stores
  assessment or     ──▶  calculates scores   ──▶  scores + gaps
  uploads evidence       per KLOE & domain        per organization

       │                                               │
       │         Dashboard fetches via                  │
       └──────── TanStack Query  ◀─────────────────────┘
                 (cached, auto-invalidates)

  Cron jobs run            Notification             Email sent
  nightly/weekly    ──▶    Service checks     ──▶   via Resend
  (Inngest)                expiry dates             for HIGH priority
```

---

## 4. Project File Structure

```
cqc-compliance-platform/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                          # Lint, typecheck, test on PR
│       └── deploy.yml                      # Deploy to AWS on merge to main
│
├── .husky/
│   ├── pre-commit                          # lint-staged
│   └── pre-push                            # typecheck
│
├── prisma/
│   ├── schema.prisma                       # Database schema (→ Supabase PostgreSQL)
│   ├── seed.ts                             # CQC framework seed data
│   └── migrations/                         # Prisma migration files
│
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── logo-dark.svg
│   │   └── og-image.png
│   ├── fonts/
│   │   ├── GeistVF.woff2
│   │   └── GeistMonoVF.woff2
│   └── favicon.ico
│
├── src/
│   ├── app/
│   │   │
│   │   ├── (auth)/                         # ─── AUTH GROUP (public) ───
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   │   └── layout.tsx                  # Centered auth layout
│   │   │
│   │   ├── (onboarding)/                   # ─── ONBOARDING GROUP ───
│   │   │   ├── welcome/page.tsx            # Welcome screen after first sign-up
│   │   │   ├── assessment/
│   │   │   │   ├── page.tsx                # Assessment entry (redirects to step 1)
│   │   │   │   ├── [step]/page.tsx         # Dynamic step pages (1-4)
│   │   │   │   └── results/page.tsx        # Results summary after calculation
│   │   │   └── layout.tsx                  # Clean onboarding layout (no sidebar)
│   │   │
│   │   ├── (dashboard)/                    # ─── MAIN APP GROUP ───
│   │   │   ├── layout.tsx                  # Dashboard layout (sidebar + header)
│   │   │   ├── page.tsx                    # Dashboard home / overview
│   │   │   │
│   │   │   ├── domains/
│   │   │   │   ├── page.tsx                # All 5 domains overview grid
│   │   │   │   ├── [domain]/
│   │   │   │   │   ├── page.tsx            # Single domain (Safe/Effective/etc)
│   │   │   │   │   └── [kloe]/page.tsx     # Single KLOE detail page
│   │   │   │
│   │   │   ├── evidence/
│   │   │   │   ├── page.tsx                # Evidence library (grid/table)
│   │   │   │   ├── upload/page.tsx         # Upload evidence form
│   │   │   │   └── [id]/page.tsx           # Single evidence detail
│   │   │   │
│   │   │   ├── policies/
│   │   │   │   ├── page.tsx                # Policy library
│   │   │   │   ├── create/page.tsx         # Create / generate policy
│   │   │   │   ├── templates/page.tsx      # Policy template picker
│   │   │   │   └── [id]/page.tsx           # Single policy detail + editor
│   │   │   │
│   │   │   ├── staff/
│   │   │   │   ├── page.tsx                # Staff directory
│   │   │   │   ├── add/page.tsx            # Add staff member form
│   │   │   │   ├── [id]/page.tsx           # Staff profile + credentials
│   │   │   │   └── training/page.tsx       # Training matrix overview
│   │   │   │
│   │   │   ├── incidents/
│   │   │   │   ├── page.tsx                # Incident log (table)
│   │   │   │   ├── report/page.tsx         # Report new incident form
│   │   │   │   └── [id]/page.tsx           # Incident detail + investigation
│   │   │   │
│   │   │   ├── tasks/page.tsx              # Task board (list or kanban)
│   │   │   ├── audits/page.tsx             # Audit log / timeline
│   │   │   ├── notifications/page.tsx      # Notification center
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx                # Reports hub
│   │   │   │   ├── compliance/page.tsx     # Full compliance report
│   │   │   │   ├── inspection-prep/page.tsx # AI inspection preparation
│   │   │   │   └── export/page.tsx         # Export / download reports
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── page.tsx                # Settings landing (redirects)
│   │   │       ├── organization/page.tsx   # Org name, address, CQC details
│   │   │       ├── users/page.tsx          # Team members, roles, invites
│   │   │       ├── billing/page.tsx        # Subscription and plan
│   │   │       ├── integrations/page.tsx   # SDK settings (future Consentz)
│   │   │       └── notifications/page.tsx  # Email notification preferences
│   │   │
│   │   ├── api/
│   │   │   ├── webhooks/clerk/route.ts     # Clerk user sync webhook
│   │   │   ├── assessment/
│   │   │   │   ├── route.ts                # POST save, GET retrieve
│   │   │   │   ├── calculate/route.ts      # POST run scoring engine
│   │   │   │   └── [id]/route.ts           # GET single assessment
│   │   │   ├── compliance/
│   │   │   │   ├── score/route.ts          # GET current, POST recalculate
│   │   │   │   └── gaps/
│   │   │   │       ├── route.ts            # GET list gaps
│   │   │   │       └── [id]/route.ts       # PATCH update gap status
│   │   │   ├── evidence/
│   │   │   │   ├── route.ts                # GET list, POST create
│   │   │   │   ├── upload/route.ts         # POST file upload to storage
│   │   │   │   └── [id]/route.ts           # GET, PATCH, DELETE single
│   │   │   ├── policies/
│   │   │   │   ├── route.ts                # GET list, POST create
│   │   │   │   ├── generate/route.ts       # POST AI policy generation
│   │   │   │   └── [id]/route.ts           # GET, PATCH, DELETE single
│   │   │   ├── staff/
│   │   │   │   ├── route.ts                # GET list, POST create
│   │   │   │   └── [id]/route.ts           # GET, PATCH, DELETE single
│   │   │   ├── incidents/
│   │   │   │   ├── route.ts                # GET list, POST create
│   │   │   │   └── [id]/route.ts           # GET, PATCH single
│   │   │   ├── tasks/
│   │   │   │   ├── route.ts                # GET list, POST create
│   │   │   │   └── [id]/route.ts           # GET, PATCH, DELETE single
│   │   │   ├── reports/
│   │   │   │   ├── generate/route.ts       # POST generate report
│   │   │   │   └── export/route.ts         # POST export as PDF
│   │   │   ├── ai/
│   │   │   │   ├── suggestions/route.ts    # POST AI recommendations
│   │   │   │   └── chat/route.ts           # POST compliance assistant
│   │   │   ├── notifications/route.ts      # GET list, PATCH mark read
│   │   │   └── cron/
│   │   │       ├── expiry-check/route.ts   # Daily: docs, training, certs
│   │   │       └── compliance-recalc/route.ts  # Weekly: recalculate scores
│   │   │
│   │   ├── layout.tsx                      # Root layout (fonts, providers)
│   │   ├── page.tsx                        # Landing page (public)
│   │   ├── loading.tsx                     # Global loading state
│   │   ├── error.tsx                       # Global error boundary
│   │   ├── not-found.tsx                   # 404 page
│   │   └── globals.css                     # Tailwind base + CSS variables
│   │
│   ├── components/
│   │   ├── ui/                             # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── table.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── command.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── label.tsx
│   │   │   └── scroll-area.tsx
│   │   │
│   │   ├── layout/                         # App shell components
│   │   │   ├── header.tsx                  # Top bar (org name, bell, avatar)
│   │   │   ├── sidebar.tsx                 # Navigation sidebar
│   │   │   ├── sidebar-nav-item.tsx        # Individual nav link
│   │   │   ├── mobile-nav.tsx              # Mobile responsive nav (Sheet)
│   │   │   ├── breadcrumbs.tsx             # Dynamic breadcrumb trail
│   │   │   └── footer.tsx                  # Minimal footer
│   │   │
│   │   ├── dashboard/                      # Dashboard-specific components
│   │   │   ├── compliance-score-card.tsx    # Main score with ring visualization
│   │   │   ├── domain-card.tsx             # Single domain summary card
│   │   │   ├── domain-progress.tsx         # 5-domain progress bar group
│   │   │   ├── gap-list.tsx                # Priority gaps list
│   │   │   ├── task-list.tsx               # Upcoming/overdue tasks
│   │   │   ├── recent-activity.tsx         # Activity feed
│   │   │   ├── inspection-countdown.tsx    # Days until next inspection
│   │   │   ├── rating-prediction.tsx       # Predicted CQC rating badge
│   │   │   └── quick-actions.tsx           # Quick action buttons
│   │   │
│   │   ├── assessment/                     # Onboarding assessment components
│   │   │   ├── assessment-wizard.tsx       # Multi-step wizard container
│   │   │   ├── step-indicator.tsx          # Progress stepper
│   │   │   ├── question-renderer.tsx       # Dynamic question type renderer
│   │   │   ├── service-type-selector.tsx   # Clinic vs Care Home cards
│   │   │   ├── results-summary.tsx         # Score + gaps overview
│   │   │   └── gap-analysis-chart.tsx      # Spider/radar chart for domains
│   │   │
│   │   ├── compliance/                     # CQC domain & KLOE components
│   │   │   ├── kloe-card.tsx               # KLOE summary with status
│   │   │   ├── requirement-checklist.tsx   # Checklist within a KLOE
│   │   │   ├── regulation-link.tsx         # Linked regulation badge
│   │   │   ├── compliance-timeline.tsx     # Score trend over time
│   │   │   └── ai-recommendation.tsx       # AI suggestion card
│   │   │
│   │   ├── evidence/                       # Evidence management components
│   │   │   ├── evidence-uploader.tsx       # Drag-drop upload with progress
│   │   │   ├── evidence-card.tsx           # Evidence thumbnail card
│   │   │   ├── evidence-grid.tsx           # Filterable grid layout
│   │   │   ├── evidence-viewer.tsx         # Document viewer/preview
│   │   │   ├── expiry-badge.tsx            # Days-until-expiry indicator
│   │   │   └── linked-requirements.tsx     # Which KLOEs this evidence covers
│   │   │
│   │   ├── policies/                       # Policy management components
│   │   │   ├── policy-editor.tsx           # Rich text policy editor
│   │   │   ├── policy-card.tsx             # Policy summary card
│   │   │   ├── policy-template-picker.tsx  # Template selection grid
│   │   │   ├── version-history.tsx         # Policy version timeline
│   │   │   └── approval-workflow.tsx       # Review/approve flow
│   │   │
│   │   ├── staff/                          # Staff management components
│   │   │   ├── staff-card.tsx              # Staff member card
│   │   │   ├── staff-form.tsx              # Add/edit staff form
│   │   │   ├── training-matrix.tsx         # Staff × courses matrix grid
│   │   │   ├── credential-tracker.tsx      # DBS, registration, insurance
│   │   │   └── competency-badge.tsx        # Training status badge
│   │   │
│   │   ├── incidents/                      # Incident reporting components
│   │   │   ├── incident-form.tsx           # Report incident form
│   │   │   ├── incident-card.tsx           # Incident summary row
│   │   │   └── severity-badge.tsx          # Color-coded severity
│   │   │
│   │   ├── reports/                        # Report generation components
│   │   │   ├── report-builder.tsx          # Report configuration UI
│   │   │   ├── chart-widgets.tsx           # Reusable chart components
│   │   │   ├── export-options.tsx          # PDF/CSV export selector
│   │   │   └── pdf-preview.tsx             # In-browser PDF preview
│   │   │
│   │   ├── notifications/                  # Notification components
│   │   │   ├── notification-bell.tsx       # Header bell with badge count
│   │   │   ├── notification-item.tsx       # Single notification row
│   │   │   └── notification-preferences.tsx # Email toggle settings
│   │   │
│   │   └── shared/                         # Reusable across all pages
│   │       ├── data-table.tsx              # Sortable, filterable, paginated table
│   │       ├── file-upload.tsx             # Generic drag-drop uploader
│   │       ├── search-input.tsx            # Debounced search field
│   │       ├── filter-bar.tsx              # Multi-filter toolbar
│   │       ├── empty-state.tsx             # Empty state with illustration + CTA
│   │       ├── loading-spinner.tsx         # Spinner component
│   │       ├── confirmation-dialog.tsx     # "Are you sure?" dialog
│   │       ├── date-picker.tsx             # Calendar date picker
│   │       └── status-badge.tsx            # Generic color-coded status
│   │
│   ├── lib/
│   │   ├── db.ts                           # Prisma client singleton
│   │   ├── supabase.ts                     # Supabase client (for storage)
│   │   ├── auth.ts                         # Clerk helper utilities
│   │   ├── utils.ts                        # Generic utilities (cn, formatDate, etc)
│   │   │
│   │   ├── validations/                    # Zod schemas for all forms + API
│   │   │   ├── assessment.ts
│   │   │   ├── evidence.ts
│   │   │   ├── policy.ts
│   │   │   ├── staff.ts
│   │   │   ├── incident.ts
│   │   │   ├── organization.ts
│   │   │   └── task.ts
│   │   │
│   │   ├── services/                       # Business logic (server-side only)
│   │   │   ├── assessment-engine.ts        # Scoring algorithm
│   │   │   ├── compliance-calculator.ts    # Ongoing compliance scoring
│   │   │   ├── document-manager.ts         # Supabase Storage operations
│   │   │   ├── notification-service.ts     # In-app + email notifications
│   │   │   ├── report-generator.ts         # PDF report generation
│   │   │   └── ai-service.ts              # OpenAI/Claude integration
│   │   │
│   │   ├── hooks/                          # Custom React hooks
│   │   │   ├── use-assessment.ts           # Assessment state + mutations
│   │   │   ├── use-compliance.ts           # Compliance data fetching
│   │   │   ├── use-evidence.ts             # Evidence CRUD operations
│   │   │   ├── use-notifications.ts        # Notification polling
│   │   │   └── use-debounce.ts             # Input debouncing
│   │   │
│   │   └── constants/                      # Static configuration data
│   │       ├── cqc-framework.ts            # All domains, KLOEs, regulations
│   │       ├── service-types.ts            # Aesthetic clinic vs care home config
│   │       ├── assessment-questions.ts     # Full question banks per service type
│   │       └── routes.ts                   # Route path constants
│   │
│   ├── stores/                             # Zustand client stores
│   │   ├── assessment-store.ts             # Assessment wizard state (persisted)
│   │   ├── compliance-store.ts             # Dashboard compliance data
│   │   └── ui-store.ts                     # Sidebar state, modals, preferences
│   │
│   ├── types/                              # TypeScript type definitions
│   │   ├── assessment.ts
│   │   ├── compliance.ts
│   │   ├── evidence.ts
│   │   ├── policy.ts
│   │   ├── staff.ts
│   │   ├── incident.ts
│   │   ├── notification.ts
│   │   └── api.ts                          # API response/request types
│   │
│   └── middleware.ts                       # Clerk auth middleware + route protection
│
├── .env.example                            # Environment variable template
├── .env.local                              # Local dev env vars (git-ignored)
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── components.json                         # shadcn/ui configuration
├── next.config.js
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## 5. Route Map

### 5.1 Public Routes (No Auth Required)

| Path | Purpose |
|---|---|
| `/` | Landing page with features, pricing, CTA |
| `/sign-in` | Clerk sign-in (email, Google, Microsoft) |
| `/sign-up` | Clerk sign-up |
| `/api/webhooks/clerk` | Clerk webhook endpoint |

### 5.2 Onboarding Routes (Auth Required, Onboarding NOT Complete)

| Path | Purpose |
|---|---|
| `/welcome` | Welcome screen after first login |
| `/assessment` | Assessment entry point |
| `/assessment/[step]` | Steps 1-4 of assessment wizard |
| `/assessment/results` | Results summary with score and gaps |

### 5.3 Dashboard Routes (Auth Required, Onboarding Complete)

| Path | Purpose | Sidebar Section |
|---|---|---|
| `/` (dashboard) | Overview with score, gaps, tasks, activity | Home |
| `/domains` | 5-domain grid overview | Compliance |
| `/domains/[domain]` | Single domain (safe, effective, caring, responsive, well-led) | Compliance |
| `/domains/[domain]/[kloe]` | Single KLOE detail with evidence + requirements | Compliance |
| `/evidence` | Evidence library with filters | Evidence |
| `/evidence/upload` | Upload new evidence | Evidence |
| `/evidence/[id]` | Single evidence detail | Evidence |
| `/policies` | Policy library | Policies |
| `/policies/create` | Create or AI-generate policy | Policies |
| `/policies/templates` | Template picker | Policies |
| `/policies/[id]` | Single policy detail + editor | Policies |
| `/staff` | Staff directory | Staff |
| `/staff/add` | Add staff member | Staff |
| `/staff/[id]` | Staff profile + credentials | Staff |
| `/staff/training` | Training matrix | Staff |
| `/incidents` | Incident log | Incidents |
| `/incidents/report` | Report new incident | Incidents |
| `/incidents/[id]` | Incident detail + investigation | Incidents |
| `/tasks` | Task board | Tasks |
| `/audits` | Audit log | Audits |
| `/reports` | Reports hub | Reports |
| `/reports/compliance` | Full compliance report | Reports |
| `/reports/inspection-prep` | AI inspection preparation | Reports |
| `/reports/export` | Export reports | Reports |
| `/notifications` | Notification center | — |
| `/settings` | Settings landing | Settings |
| `/settings/organization` | Organization details | Settings |
| `/settings/users` | Team management | Settings |
| `/settings/billing` | Subscription | Settings |
| `/settings/integrations` | SDK / Consentz (future) | Settings |
| `/settings/notifications` | Email preferences | Settings |

### 5.4 API Routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/webhooks/clerk` | User sync from Clerk |
| POST | `/api/assessment` | Save assessment answers |
| POST | `/api/assessment/calculate` | Run scoring engine |
| GET | `/api/assessment/[id]` | Get assessment by ID |
| GET | `/api/compliance/score` | Get current compliance score |
| POST | `/api/compliance/score` | Recalculate compliance score |
| GET | `/api/compliance/gaps` | List compliance gaps |
| PATCH | `/api/compliance/gaps/[id]` | Update gap status |
| GET/POST | `/api/evidence` | List / create evidence |
| POST | `/api/evidence/upload` | Upload file to storage |
| GET/PATCH/DELETE | `/api/evidence/[id]` | Single evidence operations |
| GET/POST | `/api/policies` | List / create policies |
| POST | `/api/policies/generate` | AI policy generation |
| GET/PATCH/DELETE | `/api/policies/[id]` | Single policy operations |
| GET/POST | `/api/staff` | List / create staff |
| GET/PATCH/DELETE | `/api/staff/[id]` | Single staff operations |
| GET/POST | `/api/incidents` | List / create incidents |
| GET/PATCH | `/api/incidents/[id]` | Single incident operations |
| GET/POST | `/api/tasks` | List / create tasks |
| GET/PATCH/DELETE | `/api/tasks/[id]` | Single task operations |
| POST | `/api/reports/generate` | Generate compliance report |
| POST | `/api/reports/export` | Export as PDF |
| POST | `/api/ai/suggestions` | AI recommendations |
| POST | `/api/ai/chat` | Compliance assistant |
| GET/PATCH | `/api/notifications` | List / mark read |
| GET | `/api/cron/expiry-check` | Daily expiry checking |
| GET | `/api/cron/compliance-recalc` | Weekly score recalculation |

---

## 6. CQC Framework Quick Reference

> **Full detail in `04-CQC-FRAMEWORK.md`** — this is an architectural summary only.

### 6.1 The Five Domains

```
┌──────────────────────────────────────────────────────────────┐
│                    CQC 5 KEY QUESTIONS                        │
│                                                              │
│  ┌──────────┐  Each domain has multiple KLOEs                │
│  │  SAFE    │  (Key Lines of Enquiry) that                   │
│  │  S1-S6   │  inspectors assess against.                    │
│  └──────────┘                                                │
│  ┌──────────┐  Each KLOE maps to one or more                 │
│  │EFFECTIVE │  Fundamental Standards (Regulations 9-20A).    │
│  │  E1-E7   │                                                │
│  └──────────┘  Evidence required differs by                  │
│  ┌──────────┐  service type (Aesthetic Clinic                │
│  │ CARING   │  vs Care Home).                                │
│  │  C1-C3   │                                                │
│  └──────────┘  Platform must track compliance                │
│  ┌──────────┐  against ALL KLOEs, map evidence               │
│  │RESPONSIVE│  to specific KLOEs, and calculate              │
│  │  R1-R3   │  a per-domain and overall score.               │
│  └──────────┘                                                │
│  ┌──────────┐                                                │
│  │ WELL-LED │                                                │
│  │  W1-W6   │                                                │
│  └──────────┘                                                │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Rating Bands (Used in Scoring Engine)

| Rating | Score Range | Color Code | Hex |
|---|---|---|---|
| Outstanding | 88–100% | Green | `#16a34a` |
| Good | 63–87% | Blue | `#2563eb` |
| Requires Improvement | 39–62% | Amber | `#ca8a04` |
| Inadequate | 0–38% | Red | `#dc2626` |

### 6.3 Critical Scoring Rule

A single **Critical** severity gap caps the predicted rating at **Requires Improvement** regardless of overall score. This mirrors how CQC actually operates — a provider cannot be rated "Good" if they have a critical failure in any domain.

---

## 7. Environment Variables

```bash
# ─── APP ───
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ─── CLERK AUTH ───
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# ─── SUPABASE ───
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ─── DATABASE (Prisma connects to Supabase PostgreSQL) ───
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-eu-west-2.pooler.supabase.com:5432/postgres

# ─── AWS S3 (backup storage) ───
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-west-2
AWS_S3_BUCKET=cqc-compliance-evidence

# ─── EMAIL ───
RESEND_API_KEY=re_...

# ─── AI ───
OPENAI_API_KEY=sk-...

# ─── CACHE (optional) ───
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=

# ─── MONITORING ───
SENTRY_DSN=https://...@sentry.io/...
```

---

## 8. Key Architectural Decisions

### 8.1 Prisma + Supabase PostgreSQL (Not Supabase Client for Data)

We use Prisma as the ORM to interact with the Supabase PostgreSQL database. This gives us:
- **Type-safe queries** generated from `schema.prisma`
- **Migration management** via `prisma migrate`
- **Clean data access patterns** with includes, selects, and transactions
- **Compatibility** — if we ever move off Supabase, the Prisma layer stays the same

Supabase Client is used ONLY for:
- **File storage** (Supabase Storage buckets for evidence uploads)
- **Real-time subscriptions** (future: live dashboard updates)

Clerk handles ALL authentication. We do not use Supabase Auth.

### 8.2 Server Components by Default

Next.js 15 App Router defaults to Server Components. Our rule:
- **Server Components** for data-fetching pages (dashboard, lists, detail pages)
- **Client Components** (`'use client'`) only when needed for interactivity (forms, charts, wizards, dropdowns)
- Mark client components with the `'use client'` directive at the top of the file

### 8.3 Multi-Tenancy via Organization

Every data record is scoped to an `organizationId`. Every API route:
1. Authenticates the user via Clerk
2. Looks up the user's `organizationId`
3. Filters ALL queries by that `organizationId`

This is enforced at both the application layer (Prisma queries) and the database layer (Supabase RLS policies as a safety net).

### 8.4 Assessment-First Onboarding

Users MUST complete the onboarding assessment before accessing the dashboard. The middleware checks for `onboardingComplete` in Clerk metadata and redirects to `/welcome` if not set. This ensures every organization has baseline compliance data from day one.

### 8.5 Background Jobs

Scheduled tasks run via Inngest (or Vercel Cron as fallback):
- **Daily at 9:00 AM GMT:** Check for expiring documents, training certificates, and staff registrations. Generate notifications for items expiring within 30 days (NORMAL priority) or 7 days (HIGH priority).
- **Weekly on Sunday at midnight:** Recalculate compliance scores for all organizations. Update domain scores and predicted ratings.

---

## 9. Development Guidelines

### 9.1 Code Style

```
Component files:    kebab-case          (compliance-score-card.tsx)
Component names:    PascalCase          (ComplianceScoreCard)
Hook files:         kebab-case          (use-compliance.ts)
Hook names:         camelCase use-      (useCompliance)
Constants:          SCREAMING_SNAKE     (CQC_DOMAINS)
Types/Interfaces:   PascalCase          (ComplianceScore)
Enum values:        SCREAMING_SNAKE     (SAFE, EFFECTIVE, CARING)
Database fields:    camelCase           (organizationId, createdAt)
API routes:         kebab-case folders  (/api/compliance/score)
```

### 9.2 Component Rules

1. **Single responsibility** — one component does one thing
2. **Props typed** with TypeScript interfaces (never `any`)
3. **Default exports** for page components (`page.tsx`)
4. **Named exports** for reusable components
5. **Use shadcn/ui primitives** before building custom — check if a shadcn component exists first
6. **Composition over configuration** — prefer composable small components
7. **No inline styles** — use Tailwind classes only

### 9.3 Import Order

```typescript
// 1. React / Next.js
import { useState } from 'react'
import Link from 'next/link'

// 2. External libraries
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'

// 3. Internal — components
import { Button } from '@/components/ui/button'
import { ComplianceScoreCard } from '@/components/dashboard/compliance-score-card'

// 4. Internal — lib, hooks, stores
import { useCompliance } from '@/lib/hooks/use-compliance'
import { cn } from '@/lib/utils'

// 5. Types
import type { ComplianceScore } from '@/types/compliance'
```

### 9.4 Git Workflow

**Branch naming:**
- `feature/assessment-wizard`
- `fix/compliance-score-calculation`
- `refactor/evidence-upload`

**Commit messages (Conventional Commits):**
- `feat: add compliance score card to dashboard`
- `fix: correct rating prediction for critical gaps`
- `docs: update API route documentation`

### 9.5 Error Handling Pattern

```typescript
// API Route pattern — consistent error responses
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // ... business logic ...

    return NextResponse.json(data)
  } catch (error) {
    console.error('[ROUTE_NAME]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## 10. Deployment Configuration

### 10.1 AWS Deployment (Primary)

The application deploys to AWS `eu-west-2` (London):
- **Compute:** AWS Amplify (managed Next.js hosting) or ECS Fargate
- **Database:** Supabase PostgreSQL `eu-west-2` (managed externally)
- **Storage:** Supabase Storage + AWS S3 `eu-west-2` for backup
- **CDN:** CloudFront for static assets
- **DNS:** Route 53
- **SSL:** ACM (AWS Certificate Manager) for HTTPS

### 10.2 Cron Jobs

```json
{
  "crons": [
    {
      "path": "/api/cron/expiry-check",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/compliance-recalc",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

### 10.3 Required Setup Steps

1. Create Supabase project in `eu-west-2` (London) region
2. Configure Clerk application with webhook endpoint
3. Set up AWS S3 bucket with encryption and CORS for `eu-west-2`
4. Configure Resend domain for transactional emails
5. Set up Sentry project for error monitoring
6. Configure GitHub Actions for CI/CD pipeline
7. Run `prisma migrate deploy` against Supabase PostgreSQL
8. Run `prisma db seed` to populate CQC framework reference data

---

## 11. Security Summary

> **Full detail in `06-AUTH-SECURITY.md`**

| Requirement | Implementation |
|---|---|
| Authentication | Clerk (MFA, SSO, session management) |
| Authorization | Role-based (Owner, Admin, Manager, Staff, Viewer) |
| Data isolation | Organization-scoped queries + Supabase RLS |
| Encryption at rest | Supabase AES-256, S3 server-side encryption |
| Encryption in transit | TLS 1.2+ on all connections |
| UK GDPR | DPA with Supabase, data in `eu-west-2`, DSAR handling |
| Input validation | Zod schemas on all forms and API inputs |
| SQL injection | Prevented by Prisma parameterized queries |
| XSS prevention | React auto-escaping + CSP headers |
| Audit trail | Activity log table with 7-year retention |
| File upload security | Type checking, 50MB limit, virus scanning (future) |
| Rate limiting | Per-user API throttling |
| Security headers | CSP, X-Frame-Options, HSTS, X-Content-Type-Options |

---

## 12. Companion File Reference

This architecture document is File 1 of 7. Here is what each companion file contains and when to reference it:

| File | When to Reference |
|---|---|
| `02-DATABASE.md` | Building any database table, writing any Prisma query, creating migrations, configuring Supabase Storage buckets, or setting up RLS policies |
| `03-UI-UX.md` | Building any page, component, form, or user interface. Contains the complete user journey, page-by-page specifications, sidebar structure, and component behavior |
| `04-CQC-FRAMEWORK.md` | Implementing any CQC-related logic — domains, KLOEs, regulations, evidence requirements, assessment questions, scoring weights, policy templates |
| `05-API-SERVICES.md` | Building any API route, service class, or business logic function. Contains full route specs, service layer patterns, and Zod validation schemas |
| `06-AUTH-SECURITY.md` | Implementing authentication, authorization, RBAC, middleware, RLS policies, security headers, or GDPR compliance features |
| `07-ASSESSMENT-ENGINE.md` | Building the assessment wizard, scoring algorithm, gap identification engine, or results calculation |

---

## Quick Commands

```bash
# Development
pnpm dev                    # Start dev server (localhost:3000)
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm lint                   # ESLint
pnpm typecheck              # TypeScript strict check
pnpm test                   # Vitest unit tests
pnpm test:e2e               # Playwright E2E tests

# Database
pnpm db:push                # Push schema to Supabase (dev only)
pnpm db:migrate             # Run migrations
pnpm db:seed                # Seed CQC framework data
pnpm db:studio              # Open Prisma Studio

# Components
pnpm dlx shadcn@latest add [component]  # Add shadcn/ui component
```
