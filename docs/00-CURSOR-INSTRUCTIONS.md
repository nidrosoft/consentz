# CQC Compliance Platform — Master Build Instructions for Cursor AI

> **THIS IS THE ENTRY POINT. READ THIS FILE FIRST.**
> It tells you what we are building, how the 7 specification files connect, and the exact order to build everything.
> **Do not begin coding until you have read the relevant specification file for the feature you are implementing.**

---

## What We Are Building

A **CQC (Care Quality Commission) compliance management platform** for UK healthcare providers. Two service types only: **Aesthetic Clinics** and **Care Homes**. The platform takes users through a compliance assessment, identifies every gap against CQC regulations, predicts their CQC rating, and gives them tools (AI policy generation, task management, evidence tracking, staff training records) to achieve and maintain a **Good** or **Outstanding** CQC rating.

### The Core User Journey

```
Sign up → Select service type → Fill in org details → Answer ~60 compliance questions
    → Get predicted CQC rating → See all gaps ranked by severity
    → Resolve gaps (upload evidence, generate policies, complete training, manage tasks)
    → Score improves in real-time → Prepare for CQC inspection → Maintain compliance ongoing
```

### What This Is NOT

- This is NOT a patient management system, EHR, or appointment scheduler
- This is NOT connected to Consentz yet — build it as a **fully standalone product**
- This does NOT cover hospitals, GP practices, dentists, or domiciliary care
- This does NOT store patient PII — it tracks organizational compliance only

---

## The 7 Specification Files

Every feature, screen, endpoint, database model, question, scoring rule, and security control is fully defined across these 7 files. **Do not improvise or invent features.** If something isn't specified, ask — don't guess.

### File Map: What Lives Where

| File | Lines | What It Defines | When to Reference It |
|---|---|---|---|
| **`01-ARCHITECTURE.md`** | ~980 | Tech stack, project file structure, route map, environment variables, deployment config, development guidelines | **Always read first** when starting the project. Reference for any structural, routing, or configuration question. |
| **`02-DATABASE.md`** | ~1,830 | All 20 Prisma models, enums, entity relationships, RLS policies, indexes, seed data, common query patterns, GDPR data retention | **Before creating any model, migration, or database query.** Every model and its fields are defined here. |
| **`03-UI-UX.md`** | ~2,340 | Design system (colours, typography, spacing), 30+ page wireframes, component specifications, mobile adaptations, animations, accessibility | **Before building any page or component.** Every screen has a wireframe with exact layout, states, and interactions. |
| **`04-CQC-FRAMEWORK.md`** | ~3,500 | The 5 CQC domains, 25 KLOEs (Key Lines of Enquiry), 14 Fundamental Standards (Regulations), service-type differentiation, policy template library, rating characteristics, AI integration points, all constants/seed data | **Before implementing anything CQC-related.** This is the regulatory brain. All domain definitions, KLOE specs, regulation mappings, and scoring rules originate here. |
| **`05-API-SERVICES.md`** | ~4,950 | All 55 API route handlers, middleware chain, Zod validation schemas, service layer patterns, webhook handlers, cron jobs, AI service integration, dashboard aggregation | **Before building any API route or service function.** Every endpoint's request/response contract, auth requirements, and business logic are here. |
| **`06-AUTH-SECURITY.md`** | ~1,530 | Clerk authentication setup, session management, 5-tier RBAC system, multi-tenancy isolation, API security (rate limiting, CORS, CSP), UK GDPR compliance, NHS DSPT alignment, audit logging, incident response, security headers | **Before implementing auth, permissions, or any security feature.** The complete RBAC permission matrix and every security control are here. |
| **`07-ASSESSMENT-ENGINE.md`** | ~2,150 | All 121 assessment questions across 5 domains × 2 service types, scoring pipeline, evidence quality/timeliness factors, rating prediction engine, gap auto-generation, remediation task creation, re-assessment logic, worked scoring examples | **Before building the assessment wizard, scoring, gaps, or anything related to compliance calculation.** The complete question bank and every scoring algorithm are here. |

---

## Technology Stack (Quick Reference)

Full details in `01-ARCHITECTURE.md` Section 2.

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router) | Server components, API routes, middleware |
| Language | **TypeScript** (strict mode) | Type safety across full stack |
| UI | **shadcn/ui** + **Geist** design system | Consistent, accessible components |
| Styling | **Tailwind CSS 4** | Utility-first, responsive |
| Auth | **Clerk** | MFA, SSO, session management, webhooks |
| Database | **Supabase PostgreSQL** (eu-west-2, London) | Managed Postgres with RLS, UK data residency |
| ORM | **Prisma** | Type-safe queries, migrations |
| File Storage | **Supabase Storage** (private bucket) | Signed URLs, encrypted at rest |
| AI | **Anthropic Claude** (claude-sonnet-4-20250514) | Policy generation, compliance chat, gap analysis |
| Email | **Resend** | Transactional emails, invitations |
| Monitoring | **Sentry** | Error tracking with PII scrubbing |
| Deployment | **Vercel** | Edge network, serverless functions |
| Validation | **Zod** | Runtime schema validation on every mutation |

---

## Build Order — Phase by Phase

### Phase 1: Foundation (Do This First)

**Goal:** Empty app shell that authenticates users and has the basic layout.

| Step | What to Build | Reference File(s) |
|---|---|---|
| 1.1 | Initialize Next.js 15 project with TypeScript, Tailwind, shadcn/ui | `01-ARCHITECTURE.md` §2, §4 |
| 1.2 | Set up project file structure exactly as specified | `01-ARCHITECTURE.md` §4 (Project File Structure) |
| 1.3 | Configure environment variables | `01-ARCHITECTURE.md` §7, `06-AUTH-SECURITY.md` §14 |
| 1.4 | Set up Prisma with Supabase connection | `02-DATABASE.md` §1, §8 (Prisma Client Singleton) |
| 1.5 | Create all database models and run initial migration | `02-DATABASE.md` §3 (Enums), §4 (Complete Prisma Models) |
| 1.6 | Set up Clerk authentication (sign-in, sign-up pages) | `06-AUTH-SECURITY.md` §2, `03-UI-UX.md` §3 |
| 1.7 | Implement middleware (auth check, onboarding redirect) | `06-AUTH-SECURITY.md` §2, §4, `05-API-SERVICES.md` §2 |
| 1.8 | Build the authenticated layout shell (sidebar, header, mobile nav) | `03-UI-UX.md` §2, §5 (Dashboard Layout) |
| 1.9 | Seed CQC reference data (domains, KLOEs, regulations) | `02-DATABASE.md` §9, `04-CQC-FRAMEWORK.md` §17 |

### Phase 2: Onboarding & Assessment

**Goal:** New users can sign up, select service type, enter org details, answer all assessment questions, and see their results.

| Step | What to Build | Reference File(s) |
|---|---|---|
| 2.1 | Onboarding wizard shell (4-step progress sidebar) | `03-UI-UX.md` §4 (Onboarding Flow) |
| 2.2 | Step 1: Welcome + Service Type selection | `03-UI-UX.md` §4.2, `07-ASSESSMENT-ENGINE.md` §2.1 |
| 2.3 | Step 2: Organization details form | `03-UI-UX.md` §4.3, `05-API-SERVICES.md` §17 (Organization routes) |
| 2.4 | Step 3: Assessment question renderer | `03-UI-UX.md` §4.4, `07-ASSESSMENT-ENGINE.md` §3 (Question Architecture) |
| 2.5 | Load all assessment questions from constants file | `07-ASSESSMENT-ENGINE.md` §4–8 (Complete Question Bank) |
| 2.6 | Question filtering by service type + conditional logic | `07-ASSESSMENT-ENGINE.md` §9 |
| 2.7 | Answer save API (auto-save, debounced) | `05-API-SERVICES.md` §7, `07-ASSESSMENT-ENGINE.md` §10 |
| 2.8 | Assessment calculation API | `05-API-SERVICES.md` §7, `07-ASSESSMENT-ENGINE.md` §11 (Scoring Pipeline) |
| 2.9 | Gap auto-generation from assessment answers | `07-ASSESSMENT-ENGINE.md` §14 |
| 2.10 | Step 4: Results page (animated score reveal, domain cards, gap summary) | `03-UI-UX.md` §4.5, `07-ASSESSMENT-ENGINE.md` §18 (Worked Examples) |
| 2.11 | Mark onboarding complete → redirect to dashboard | `06-AUTH-SECURITY.md` §17 |

### Phase 3: Dashboard & Domain Pages

**Goal:** Fully functional dashboard with live compliance score and drill-down into each CQC domain.

| Step | What to Build | Reference File(s) |
|---|---|---|
| 3.1 | Dashboard page (score donut, domain cards, gap summary, tasks, timeline) | `03-UI-UX.md` §5, `05-API-SERVICES.md` §18 (Dashboard Aggregation) |
| 3.2 | Dashboard API (single aggregation endpoint) | `05-API-SERVICES.md` §18 |
| 3.3 | Domain detail pages (per-KLOE breakdown, evidence mapping, gaps) | `03-UI-UX.md` §6, `04-CQC-FRAMEWORK.md` §3 (KLOE specs) |
| 3.4 | Gap management UI (view, resolve, mark as accepted risk) | `03-UI-UX.md` §6, `05-API-SERVICES.md` §8 |

### Phase 4: Evidence & Policy Management

**Goal:** Users can upload evidence, generate AI policies, and manage their document library.

| Step | What to Build | Reference File(s) |
|---|---|---|
| 4.1 | Evidence library page (grid/list view, filters, upload) | `03-UI-UX.md` §7, `05-API-SERVICES.md` §9 |
| 4.2 | File upload with Supabase Storage (signed URLs, MIME validation) | `06-AUTH-SECURITY.md` §11, `05-API-SERVICES.md` §9 |
| 4.3 | Evidence linking to domains/KLOEs | `04-CQC-FRAMEWORK.md` §5 (KLOE-Regulation mapping) |
| 4.4 | Policy library page (list, create, AI generate, approve, publish) | `03-UI-UX.md` §8, `05-API-SERVICES.md` §10 |
| 4.5 | AI Policy Generator (Anthropic Claude integration) | `05-API-SERVICES.md` §19 (AI Service Layer), `04-CQC-FRAMEWORK.md` §13 (Policy Templates) |
| 4.6 | Policy approval workflow (draft → approved → published) | `05-API-SERVICES.md` §10 |

### Phase 5: Staff, Training & Incidents

**Goal:** Staff directory, training matrix, and incident reporting module.

| Step | What to Build | Reference File(s) |
|---|---|---|
| 5.1 | Staff management pages (list, add, edit, deactivate) | `03-UI-UX.md` §9, `05-API-SERVICES.md` §11 |
| 5.2 | Training records (add, track expiry, matrix view) | `03-UI-UX.md` §9, `05-API-SERVICES.md` §12 |
| 5.3 | Incident reporting (create, investigate, categorize, close) | `03-UI-UX.md` §10, `05-API-SERVICES.md` §13 |
| 5.4 | Training expiry alerts and gap creation | `07-ASSESSMENT-ENGINE.md` §14.3, §17 |

### Phase 6: Tasks, Notifications & Reports

**Goal:** Task board for remediation, notification centre, and exportable reports.

| Step | What to Build | Reference File(s) |
|---|---|---|
| 6.1 | Task board page (kanban or list, filters, assignment) | `03-UI-UX.md` §11, `05-API-SERVICES.md` §14 |
| 6.2 | Auto-task generation from gaps | `07-ASSESSMENT-ENGINE.md` §15 |
| 6.3 | Notification system (in-app + email via Resend) | `03-UI-UX.md` §14, `05-API-SERVICES.md` §15 |
| 6.4 | Reports page (compliance summary, domain breakdown, export PDF/CSV) | `03-UI-UX.md` §12, `05-API-SERVICES.md` §16 |
| 6.5 | Inspection preparation report | `05-API-SERVICES.md` §16, §19 (AI Service) |

### Phase 7: Settings, Audit & Polish

**Goal:** Org settings, user management, audit log, and final polish.

| Step | What to Build | Reference File(s) |
|---|---|---|
| 7.1 | Settings pages (org details, user management, billing placeholder) | `03-UI-UX.md` §15, `05-API-SERVICES.md` §17 |
| 7.2 | User invitation flow (invite by email, role assignment) | `06-AUTH-SECURITY.md` §17, `05-API-SERVICES.md` §17 |
| 7.3 | Audit log page | `03-UI-UX.md` §13, `06-AUTH-SECURITY.md` §13 |
| 7.4 | Clerk webhook handler (user.created, user.updated, user.deleted) | `06-AUTH-SECURITY.md` §12, `05-API-SERVICES.md` §2 |
| 7.5 | Cron jobs (weekly compliance recalc, daily expiry check, notification digest) | `05-API-SERVICES.md` §7, §15, `07-ASSESSMENT-ENGINE.md` §17 |
| 7.6 | Re-assessment flow | `07-ASSESSMENT-ENGINE.md` §16 |
| 7.7 | Security headers, CORS, CSP | `06-AUTH-SECURITY.md` §6, §15 |
| 7.8 | Pre-launch security checklist verification | `06-AUTH-SECURITY.md` §19 |

---

## Critical Rules for Cursor AI

### 1. Always Scope Queries by `organizationId`

Multi-tenancy is non-negotiable. **EVERY** database query that touches user data MUST include `WHERE organizationId = ctx.organizationId`. The `organizationId` comes from the authenticated user context, NEVER from the URL or request body.

> **Reference:** `06-AUTH-SECURITY.md` §5 (Multi-Tenancy Isolation)

### 2. Always Check RBAC Permissions

Every API route must verify the user has the required role. Use the `requireMinRole()` or `requireRole()` helpers from the middleware chain. The 5 roles are: OWNER (5) > ADMIN (4) > MANAGER (3) > STAFF (2) > VIEWER (1).

> **Reference:** `06-AUTH-SECURITY.md` §4 (full 40-row permission matrix)

### 3. Always Validate Input with Zod

Every mutation endpoint (POST, PATCH, DELETE) must validate the request body with a Zod schema before processing. The complete schema library is pre-defined.

> **Reference:** `05-API-SERVICES.md` §6 (Complete Zod Schema Library)

### 4. Assessment Questions Live in Code, Not the Database

Questions are TypeScript constants in `lib/constants/assessment-questions.ts`. Only the ANSWERS are stored in the database. This is intentional for versioning and type safety.

> **Reference:** `07-ASSESSMENT-ENGINE.md` §3 (Question Architecture)

### 5. Rating Limiters Cannot Be Bypassed

A single unresolved CRITICAL gap caps that domain at "Requires Improvement", regardless of the percentage score. This is the most important scoring rule and mirrors real CQC methodology.

> **Reference:** `07-ASSESSMENT-ENGINE.md` §13.3 (Rating Limiters)

### 6. Use Server Components by Default

Next.js App Router — use Server Components for everything except interactive elements. Only add `'use client'` when the component needs browser APIs, event handlers, or React state.

> **Reference:** `01-ARCHITECTURE.md` §9 (Development Guidelines)

### 7. Fire-and-Forget Audit Logging

Log all significant actions to the `ActivityLog` table, but NEVER let logging failures block the primary operation. Wrap logging in try/catch and don't await it on the critical path.

> **Reference:** `06-AUTH-SECURITY.md` §13 (28 logged action types)

### 8. UK Data Residency

All data must be stored in `eu-west-2` (London). Supabase project, storage buckets, and backups must all be in this region.

> **Reference:** `06-AUTH-SECURITY.md` §7, §8

### 9. No Patient PII

This platform tracks organizational compliance, NOT individual patient data. Never store patient names, NHS numbers, or health records. The only personal data is about staff members (name, email, role, DBS status, training records).

### 10. Follow the API Response Contract

Every API route returns the standardised response envelope: `{ success: boolean, data?: T, error?: { code, message, details? } }`.

> **Reference:** `05-API-SERVICES.md` §3 (Standard API Response Contract)

---

## Quick Lookup: "Where Do I Find...?"

| If You Need To Know About... | Go To |
|---|---|
| Project folder structure | `01-ARCHITECTURE.md` §4 |
| Which routes exist | `01-ARCHITECTURE.md` §5 |
| Environment variables | `01-ARCHITECTURE.md` §7 |
| A specific database model or its fields | `02-DATABASE.md` §4 |
| How two models relate | `02-DATABASE.md` §2 (ERD) |
| Database indexes | `02-DATABASE.md` §7 |
| Seed data for CQC reference tables | `02-DATABASE.md` §9 |
| How a page should look | `03-UI-UX.md` (find the page section) |
| Design tokens (colours, fonts, spacing) | `03-UI-UX.md` §1 |
| Mobile layout | `03-UI-UX.md` §17 |
| What a CQC domain/KLOE/regulation means | `04-CQC-FRAMEWORK.md` §2, §3, §4 |
| Which KLOE maps to which regulation | `04-CQC-FRAMEWORK.md` §5 |
| Differences between clinic and care home | `04-CQC-FRAMEWORK.md` §6 |
| What policies are needed per service type | `04-CQC-FRAMEWORK.md` §13 |
| An API endpoint's contract | `05-API-SERVICES.md` (find the route section) |
| Zod schema for a specific entity | `05-API-SERVICES.md` §6 |
| AI prompt templates | `05-API-SERVICES.md` §19 |
| Clerk setup and configuration | `06-AUTH-SECURITY.md` §2 |
| RBAC permission for a specific action | `06-AUTH-SECURITY.md` §4 |
| Rate limit tiers | `06-AUTH-SECURITY.md` §6 |
| GDPR requirements | `06-AUTH-SECURITY.md` §8 |
| A specific assessment question | `07-ASSESSMENT-ENGINE.md` §4–8 |
| How scoring works | `07-ASSESSMENT-ENGINE.md` §11 |
| How rating prediction works | `07-ASSESSMENT-ENGINE.md` §13 |
| How gaps are created | `07-ASSESSMENT-ENGINE.md` §14 |
| What triggers a recalculation | `07-ASSESSMENT-ENGINE.md` §17 |
| A full scoring walkthrough example | `07-ASSESSMENT-ENGINE.md` §18 |

---

## Feature Cross-Reference Matrix

This shows which files you need to read for each major feature. **Read ALL listed files before implementing.**

| Feature | Primary File | Also Read |
|---|---|---|
| **Authentication (sign-in/sign-up)** | `06-AUTH-SECURITY.md` §2 | `03-UI-UX.md` §3, `01-ARCHITECTURE.md` §5 |
| **Onboarding wizard** | `03-UI-UX.md` §4 | `07-ASSESSMENT-ENGINE.md` §2, `06-AUTH-SECURITY.md` §17 |
| **Assessment questions** | `07-ASSESSMENT-ENGINE.md` §4–8 | `04-CQC-FRAMEWORK.md` §3, §6 |
| **Assessment save/calculate API** | `05-API-SERVICES.md` §7 | `07-ASSESSMENT-ENGINE.md` §10, §11, `02-DATABASE.md` §4.4 |
| **Compliance scoring** | `07-ASSESSMENT-ENGINE.md` §11, §12 | `04-CQC-FRAMEWORK.md` §9 |
| **Rating prediction** | `07-ASSESSMENT-ENGINE.md` §13 | `04-CQC-FRAMEWORK.md` §10 |
| **Gap identification** | `07-ASSESSMENT-ENGINE.md` §14 | `04-CQC-FRAMEWORK.md` §11, `05-API-SERVICES.md` §8 |
| **Dashboard** | `03-UI-UX.md` §5 | `05-API-SERVICES.md` §18 |
| **Domain detail pages** | `03-UI-UX.md` §6 | `04-CQC-FRAMEWORK.md` §3, `05-API-SERVICES.md` §8 |
| **Evidence library** | `03-UI-UX.md` §7 | `05-API-SERVICES.md` §9, `06-AUTH-SECURITY.md` §11 |
| **Policy management** | `03-UI-UX.md` §8 | `05-API-SERVICES.md` §10, `04-CQC-FRAMEWORK.md` §13 |
| **AI policy generation** | `05-API-SERVICES.md` §19 | `04-CQC-FRAMEWORK.md` §13, §16 |
| **Staff management** | `03-UI-UX.md` §9 | `05-API-SERVICES.md` §11, `02-DATABASE.md` §4 |
| **Training records** | `03-UI-UX.md` §9 | `05-API-SERVICES.md` §12, `07-ASSESSMENT-ENGINE.md` §14.3 |
| **Incident reporting** | `03-UI-UX.md` §10 | `05-API-SERVICES.md` §13 |
| **Task board** | `03-UI-UX.md` §11 | `05-API-SERVICES.md` §14, `07-ASSESSMENT-ENGINE.md` §15 |
| **Notifications** | `03-UI-UX.md` §14 | `05-API-SERVICES.md` §15, `07-ASSESSMENT-ENGINE.md` §17.5 |
| **Reports & export** | `03-UI-UX.md` §12 | `05-API-SERVICES.md` §16 |
| **Settings & user management** | `03-UI-UX.md` §15 | `05-API-SERVICES.md` §17, `06-AUTH-SECURITY.md` §17 |
| **Audit log** | `03-UI-UX.md` §13 | `06-AUTH-SECURITY.md` §13 |
| **Webhook handler** | `06-AUTH-SECURITY.md` §12 | `05-API-SERVICES.md` §2 |
| **Cron jobs** | `05-API-SERVICES.md` §7, §15 | `07-ASSESSMENT-ENGINE.md` §17 |
| **Re-assessment** | `07-ASSESSMENT-ENGINE.md` §16 | `05-API-SERVICES.md` §7 |
| **RBAC enforcement** | `06-AUTH-SECURITY.md` §4 | `05-API-SERVICES.md` §2 |
| **File upload** | `06-AUTH-SECURITY.md` §11 | `05-API-SERVICES.md` §9, `02-DATABASE.md` §5 |
| **Compliance recalculation** | `07-ASSESSMENT-ENGINE.md` §17 | `07-ASSESSMENT-ENGINE.md` §11, `05-API-SERVICES.md` §8 |

---

## Database Quick Reference

20 Prisma models defined in `02-DATABASE.md` §4:

| Model | Purpose | Key Relations |
|---|---|---|
| `User` | Platform user (synced from Clerk) | → Organization, → ActivityLog |
| `Organization` | Tenant (clinic or care home) | → all user-data models |
| `Assessment` | Onboarding/re-assessment session | → AssessmentAnswer[] |
| `AssessmentAnswer` | Single question answer with score | → Assessment |
| `ComplianceScore` | Live org-wide compliance score | → DomainScore[] |
| `DomainScore` | Per-domain score breakdown | → ComplianceScore |
| `ComplianceGap` | Identified compliance gap | → Task[] |
| `Evidence` | Uploaded compliance document | → Organization |
| `Policy` | Compliance policy (draft/published) | → Organization |
| `StaffMember` | Staff directory entry | → TrainingRecord[] |
| `TrainingRecord` | Training completion record | → StaffMember |
| `Incident` | Reported incident | → Organization |
| `Task` | Remediation task | → ComplianceGap?, → User? |
| `Notification` | In-app notification | → User |
| `ActivityLog` | Audit trail entry | → User |
| `CqcDomain` | Reference: 5 CQC domains | Seeded, read-only |
| `CqcKloe` | Reference: 25 KLOEs | Seeded, read-only |
| `CqcRegulation` | Reference: 14 regulations | Seeded, read-only |
| `KloeRegulationMap` | Reference: KLOE↔Regulation links | Seeded, read-only |
| `PolicyTemplate` | Reference: policy template definitions | Seeded, read-only |

---

## API Quick Reference

55 endpoints defined in `05-API-SERVICES.md` §7–18:

| Module | Routes | Methods |
|---|---|---|
| Assessment | `/api/assessment`, `/api/assessment/calculate` | GET, POST |
| Compliance | `/api/compliance/score`, `/api/compliance/gaps`, `/api/compliance/gaps/[id]` | GET, POST, PATCH |
| Evidence | `/api/evidence`, `/api/evidence/[id]`, `/api/evidence/upload-url` | GET, POST, PATCH, DELETE |
| Policies | `/api/policies`, `/api/policies/[id]`, `/api/policies/[id]/approve`, `/api/policies/[id]/publish`, `/api/policies/generate` | GET, POST, PATCH, DELETE |
| Staff | `/api/staff`, `/api/staff/[id]` | GET, POST, PATCH |
| Training | `/api/staff/[id]/training`, `/api/staff/[id]/training/[trainingId]` | GET, POST, PATCH, DELETE |
| Incidents | `/api/incidents`, `/api/incidents/[id]` | GET, POST, PATCH |
| Tasks | `/api/tasks`, `/api/tasks/[id]` | GET, POST, PATCH, DELETE |
| Notifications | `/api/notifications`, `/api/notifications/read-all` | GET, PATCH |
| Reports | `/api/reports/compliance`, `/api/reports/export`, `/api/reports/inspection-prep` | GET, POST |
| Organization | `/api/organization`, `/api/organization/users`, `/api/organization/users/invite` | GET, PATCH, POST, DELETE |
| Dashboard | `/api/dashboard` | GET |
| Webhooks | `/api/webhooks/clerk` | POST |
| Cron | `/api/cron/compliance-recalc`, `/api/cron/expiry-check`, `/api/cron/notification-digest` | GET |
| AI | `/api/ai/chat`, `/api/ai/policy-generate`, `/api/ai/gap-analysis` | POST |

---

## Auth & Permissions Quick Reference

5-tier RBAC defined in `06-AUTH-SECURITY.md` §4:

```
OWNER (5) → Full control, billing, delete org. One per org. Cannot be changed.
ADMIN (4) → Manage users, settings, all compliance features. Cannot delete org.
MANAGER (3) → Manage compliance, evidence, policies, staff, tasks. Cannot manage users.
STAFF (2) → View + contribute. Can report incidents, complete own tasks, record training.
VIEWER (1) → Read-only access. Can view dashboard, reports, policies. Cannot edit anything.
```

---

## Assessment Engine Quick Reference

Defined in `07-ASSESSMENT-ENGINE.md`:

- **121 unique questions** across 5 CQC domains
- **61 questions** shown to Aesthetic Clinics, **65** to Care Homes
- **6 answer types:** yes_no, yes_no_partial, multi_select, scale, date, text
- **4 gap severities:** CRITICAL (caps at RI), HIGH (prevents Good), MEDIUM (prevents Outstanding), LOW (improvement)
- **Rating thresholds:** Outstanding ≥88%, Good ≥63%, RI ≥39%, Inadequate <39%
- **Key limiters:** Critical gap → domain capped at RI; Any Inadequate domain → overall capped at RI; 2+ RI → overall RI

---

## One Final Note

This specification suite is the **complete development blueprint**. Every decision has been made. Every screen is wireframed. Every endpoint is contracted. Every question is written. Every scoring rule is defined. Every security control is documented.

Build exactly what is specified. When you encounter ambiguity, check the relevant file section before asking. The answer is almost certainly already written down.

**Total specification:** ~17,300 lines across 7 files + this orchestration document.

Good luck. Build something that helps healthcare providers keep people safe. 🏥
