# CQC COMPLIANCE MODULE — FINAL IMPLEMENTATION PLAN

> **Status**: Definitive implementation checklist combining the analysis from the previous session, the live Consentz API testing, the CQC Final Run Through meeting notes, the CQC_FINAL_INTEGRATION_CURSOR_PROMPT.md document, and the current state of the codebase and Supabase database.
>
> **Database**: Supabase project `cqfodxddsmdjjwqmyyin` (accessible via MCP)
>
> **Rule**: NO Prisma. Everything is Supabase-native. Do NOT install or reference Prisma anywhere.

---

## CURRENT STATE SUMMARY

### What's Built & Working (90%)
- Full UI: Dashboard, Evidence, Policies, Staff, Incidents, Tasks, CQC Domains, Reports, Audit Log, Settings (all pages functional)
- Assessment engine: 100+ questions, KLOE sub-step navigation, scoring, gap identification
- 67 API routes covering all CRUD operations
- ConsentzClient class (`src/lib/consentz/client.ts`) with methods for all 8 CQC endpoints
- Sync service (`src/lib/consentz/sync-service.ts`) — pulls data and creates tasks
- Score engine (`src/lib/services/score-engine.ts`) — blends assessment + evidence + Consentz + tasks
- 4 cron routes (compliance-recalc, consentz-sync, expiry-check, notification-digest)
- SDK API key management (generate, rotate, revoke — fully wired)
- SDK compliance endpoint (`/api/sdk/v1/compliance`)
- SDK booking validation endpoint (`/api/sdk/v1/validate-booking`)
- Supabase auth + 32 database tables

### What's Broken or Missing (the 10%)
See the 15 tasks below, organized in execution order.

---

## DATABASE CURRENT STATE

### Tables That Exist (32 total)
| Table | Rows | Notes |
|---|---|---|
| organizations | 14 | All have `consentz_clinic_id = null` |
| users | 16 | |
| assessments | 10 | |
| compliance_scores | 10 | |
| domain_scores | 50 | |
| compliance_gaps | 20 | |
| tasks | 15 | Has `source` and `source_id` columns for CONSENTZ_SYNC |
| activity_logs | 90 | |
| sdk_api_keys | 3 | |
| consentz_sync_logs | 0 | Exists but never populated — has `response_data` jsonb column |
| evidence_items | 0 | |
| policies | 0 | |
| staff_members | 0 | |
| staff_credentials | 0 | |
| training_records | 0 | |
| incidents | 0 | |
| notifications | 0 | |

### Tables That Need to Be Created
| Table | Purpose |
|---|---|
| `consentz_snapshots` | Raw API response storage per sync cycle |
| `subscription_plans` | Stripe pricing tier definitions |
| `subscriptions` | Organization subscription records |
| `onboarding_progress` | First-time user walkthrough tracking |
| `chat_messages` | AI chat conversation history |

---

## CONSENTZ STAGING API — VERIFIED RESPONSE SHAPES

All 8 endpoints tested live against `https://staging.consentz.com/api/v1` with clinicId=3.

### Login
- **POST** `/login` with `{ username: "demo", password: "password", confirmLogin: true }` + header `X-APPLICATION-ID: admin`
- Returns: `{ user: { id, sessionToken: "r:...", clinic: { id: 3, name: "Beautify Clinic", ... } } }`
- **Session token path**: `response.user.sessionToken`

### 1. Staff Competency — `GET /clinic/3/cqc-reports`
```json
{
  "status": "success",
  "all": [{ "id", "staffId", "staffName", "certName", "issuedDate", "expiryDate", "daysToExpiry", "lifespanDays", "statusLabel", "statusColour", "notes" }],
  "overdue": [],
  "expiring30": [],
  "expiring60": [],
  "expiring90": [],
  "chartData": [{ "name", "avgLifespan", "count" }],
  "summary": { "totalCerts", "overdueCount", "expiring30", "expiring60", "expiring90" }
}
```

### 2. Consent Completion — `GET /clinic/3/cqc-reports/consent-completion?startDate=...&period=month`
```json
{
  "status": "success",
  "data": [{
    "period": "April 2026",
    "data": [{ "patientId", "patientName", "appointmentDate", "treatment", "practitioner", "consentStatus", "completionRate", "totalForms", "signedForms" }],
    "statistics": { "total", "sameDayCount", "noConsentCount", "completionRate", ... }
  }]
}
```
- **Key metric**: `data[0].statistics.completionRate` (for most recent period)

### 3. Consent Decay — `GET /clinic/3/cqc-reports/consent-decay?startDate=...&period=month`
```json
{
  "status": "success",
  "data": [],
  "summary": { "total": 0, "expired": 0, "expiring": 0 }
}
```

### 4. Infection Incidents — `GET /clinic/3/cqc-reports/infection-incidents?startDate=...&period=month`
```json
{
  "status": "success",
  "incidents": [{ "id", "patientId", "patientName", "incidentType", "severity", "status", "isResolved", "notes", "followUpAction", "reportedAt" }],
  "repeatPatients": [],
  "summary": { "total", "resolved", "unresolved", "repeatPatients" }
}
```
- **Key metric**: `summary.resolved / summary.total * 100` = resolution rate

### 5. Policy Acknowledgement — `GET /clinic/3/cqc-reports/policy-acknowledgement?startDate=...&period=month`
```json
{
  "status": "success",
  "policies": [{ "policyId", "policyName", "expiryDate", "daysToExpiry", "signedCount", "notSignedCount", "completionPercentage", "signedUsers": [], "notSignedUsers": [{ "staffId", "staffName" }] }],
  "summary": { "totalPolicies", "totalAssignmentSlots", "totalSigned", "totalNotSigned", "completionPercentage" }
}
```
- **Key metric**: `summary.completionPercentage`

### 6. Safety Checklist — `GET /clinic/3/cqc-reports/safety-checklist?startDate=...&period=month`
```json
{
  "status": "success",
  "config": { "fireDrillEnabled", "fireDrillFirstDate", "fireDrillIntervalWeeks", "emergencyKitFirstDate", "emergencyKitIntervalWeeks" },
  "fireDrills": [{ "id", "type", "start", "end", "isPast" }],
  "emergencyKits": [{ "id", "type", "start", "end", "isPast" }]
}
```
- **Key metric**: Calculate from `fireDrills.filter(d => d.isPast).length` vs total — are drills being done on schedule?

### 7. Treatment Risk Heatmap — `GET /clinic/3/cqc-reports/treatment-risk-heatmap?from=...&period=month`
```json
{
  "status": "success",
  "from": "2022-01-01",
  "to": "2026-04-01",
  "totalRows": 0,
  "heatmapData": { "categories": { "x": [], "y": [] }, "data": [] },
  "outcomeBreakdown": { "green": 0, "yellow": 0, "red": 0 }
}
```
- **Key metric**: `outcomeBreakdown.green / totalRows * 100` — percentage of treatments with good outcomes

### 8. Patient Feedback — `GET /clinic/3/cqc-reports/patient-feedback?from=...&period=month`
```json
{
  "status": "success",
  "from": "2022-01-01",
  "to": "2026-04-01",
  "rollingAvg": 10,
  "distribution": { "1": 0, ..., "10": 1 },
  "feedback": [{ "id", "patientId", "patientName", "rating", "comments", "lowRatingFlagged", "sentAt", "completedAt" }],
  "lowRated": [],
  "summary": { "totalResponses", "lowRatedCount", "rollingAvg30Days" }
}
```
- **IMPORTANT**: Rating is 1-10 scale, NOT 1-5. Our code currently divides by 5.
- **Key metric**: `summary.rollingAvg30Days` (out of 10, normalize to 0-100 as `value * 10`)

---

## IMPLEMENTATION TASKS — EXECUTION ORDER

### PHASE 1: Fix Critical Integration Bugs (Must Do First)

#### TASK 1: Fix TypeScript types to match actual API responses
**File**: `src/lib/consentz/types.ts`
**Problem**: Every interface is wrong — shapes don't match actual API responses documented above.
**Action**:
- Rewrite all interfaces based on the verified response shapes above
- StaffCompetencyReport: `{ status, all: [...], overdue, expiring30, expiring60, expiring90, chartData, summary }`
- ConsentCompletionReport: `{ status, data: [{ period, data: [...], statistics }] }`
- IncidentFeedReport: `{ status, incidents: [...], repeatPatients, summary: { total, resolved, unresolved } }`
- PatientFeedbackReport: `{ status, rollingAvg, distribution, feedback: [...], lowRated, summary }`
- SafetyChecklistReport: `{ status, config, fireDrills: [...], emergencyKits: [...] }`
- PolicyAcknowledgementReport: `{ status, policies: [...], summary: { completionPercentage } }`
- ConsentDecayReport: `{ status, data: [...], summary: { total, expired, expiring } }`
- TreatmentRiskHeatmapReport: `{ status, totalRows, heatmapData, outcomeBreakdown }`

#### TASK 2: Fix ConsentzClient to match actual API auth
**File**: `src/lib/consentz/client.ts`
**Problem**: Client uses `X-APPLICATION-ID: laptop` but Postman uses `admin`. Login response token is at `user.sessionToken`, not top-level.
**Action**:
- Change `X-APPLICATION-ID` to `admin`
- Fix token extraction: `data.user.sessionToken`
- Add username/password-based auth with auto-refresh (as described in your document Section 4.1)
- Support both env-based singleton and per-org credential construction

#### TASK 3: Store `response_data` in sync logs
**File**: `src/lib/consentz/sync-service.ts`
**Problem**: Sync inserts logs with only `record_count` and `status`. The score engine reads `response_data` but it's never written. All Consentz metrics default to 50.
**Action**: After each endpoint call, compute a normalized metrics summary and store it in `response_data`:
```typescript
// Example for consent-completion:
const summary = report.data?.[0]?.statistics;
await dbClient.from('consentz_sync_logs').insert({
  organization_id: organizationId,
  endpoint: 'consent-completion',
  status: 'success',
  record_count: summary?.total ?? 0,
  response_data: { completionRate: summary?.completionRate ?? 0 },
});
```
Do the same for all 6 sync functions with the correct field mappings:
- consent-completion → `{ completionRate }` from `data[0].statistics.completionRate`
- staff-competency → `{ overallCompetencyRate }` computed as `(totalCerts - overdueCount) / totalCerts * 100`
- incidents → `{ resolutionRate }` computed as `summary.resolved / summary.total * 100`
- safety-checklist → `{ overallScore }` computed from drill/kit completion rates
- patient-feedback → `{ averageRating }` from `summary.rollingAvg30Days` (1-10 scale)
- policy-acknowledgement → `{ acknowledgementRate }` from `summary.completionPercentage`

#### TASK 4: Fix patient feedback rating scale
**File**: `src/lib/services/score-engine.ts`
**Problem**: `getConsentzMetrics` does `averageRating / 5 * 100` but the API uses a 1-10 scale.
**Action**: Change to `averageRating * 10` (since rollingAvg is already 1-10).

#### TASK 5: Fix sync service field mapping to actual response shapes
**File**: `src/lib/consentz/sync-service.ts`
**Problem**: Each sync function accesses fields that don't exist on the real response (e.g., `report.staff` doesn't exist — it's `report.all`; `report.completionRate` doesn't exist — it's `report.data[0].statistics.completionRate`).
**Action**: Rewrite each sync function to correctly traverse the actual response structures:
- `syncStaffCompetency`: iterate `report.all` not `report.staff`; access `item.staffId`, `item.certName`, `item.expiryDate`, `item.statusLabel`
- `syncConsentData`: access `report.data[0].statistics.completionRate` not `report.completionRate`
- `syncIncidents`: access `report.incidents[].isResolved`, `report.incidents[].incidentType` (type is already "Infection"), field mapping for `patientName`, `notes`
- `syncSafetyChecklist`: the report has `fireDrills` and `emergencyKits` arrays with `isPast` flag, not `items[].status`
- `syncPatientFeedback`: rating is 1-10 not 1-5; no `isNegative` field — check `lowRatingFlagged`; no `themes` field; access `summary.rollingAvg30Days`
- `syncPolicyAcknowledgements`: access `policy.completionPercentage` not `policy.completionRate`; unsigned staff are in `policy.notSignedUsers[].staffName`, not `policy.unsigned[].name`

---

### PHASE 2: Database Migrations

#### TASK 6: Create missing tables + add missing columns
**Run via Supabase MCP `execute_sql` or SQL Editor:**

```sql
-- 1. consentz_snapshots — raw endpoint data per sync
CREATE TABLE IF NOT EXISTS consentz_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sync_log_id UUID REFERENCES consentz_sync_logs(id) ON DELETE CASCADE,
  endpoint_name TEXT NOT NULL,
  response_data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_snapshots_org ON consentz_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_endpoint ON consentz_snapshots(endpoint_name);

-- 2. onboarding_progress — first-time user walkthrough
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  steps_completed JSONB DEFAULT '[]',
  is_complete BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- 3. chat_messages — AI chat history
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_org_user ON chat_messages(organization_id, user_id);

-- 4. subscription_plans — Stripe pricing tiers
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  price_amount INTEGER NOT NULL,
  price_currency TEXT DEFAULT 'gbp',
  interval TEXT DEFAULT 'month',
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. subscriptions — org subscription records
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- 6. Seed the £200/month plan (Stripe price ID to be replaced after Stripe setup)
INSERT INTO subscription_plans (name, stripe_price_id, price_amount, price_currency, interval, features)
VALUES (
  'CQC Compliance Pro',
  'price_REPLACE_WITH_ACTUAL',
  20000,
  'gbp',
  'month',
  '["Full CQC compliance dashboard", "All 5 domain tracking", "Consentz integration", "AI policy generation", "AI compliance chatbot", "Ongoing compliance monitoring", "Evidence management", "Staff credential tracking", "Incident management", "Task management", "Audit reports", "SDK access", "Email notifications"]'
);
```

---

### PHASE 3: Complete the Integration Wiring

#### TASK 7: Add Consentz connection flow in UI
**Problem**: No org has `consentz_clinic_id` set. There's no UI to enter it.
**Action**:
- Add a "Connect Consentz" section on the Settings → Integrations page
- Input field for Consentz username + password (or clinic ID directly)
- On submit: call `/api/consentz/auth` to validate credentials → extract `clinic.id` from login response → update `organizations.consentz_clinic_id`
- Store credentials encrypted in org `settings` jsonb for per-org sync
- Show connection status (connected/disconnected, clinic name, last sync time)

#### TASK 8: Add treatment-risk-heatmap proxy route
**Problem**: The Postman collection includes this endpoint but our codebase has no route for it.
**Action**: Create `src/app/api/consentz/treatment-risk-heatmap/route.ts` following the same pattern as the other 7 Consentz proxy routes.
**Optional**: Add to sync cycle and score engine domain mapping (SAFE, EFFECTIVE domains).

#### TASK 9: Add Vercel cron configuration
**File**: Create/update `vercel.json`
**Action**:
```json
{
  "crons": [
    { "path": "/api/cron/consentz-sync", "schedule": "0 */6 * * *" },
    { "path": "/api/cron/compliance-recalc", "schedule": "30 */6 * * *" },
    { "path": "/api/cron/expiry-check", "schedule": "0 8 * * *" },
    { "path": "/api/cron/notification-digest", "schedule": "0 9 * * *" }
  ]
}
```

---

### PHASE 4: New Features (Per Meeting + Your Document)

#### TASK 10: Onboarding walkthrough (first-time user guide)
**Per Tobe in the meeting: "That'll be really useful, a nice little walkthrough."**
- Build a slide-out panel/modal on the dashboard for new users
- 8 steps: Welcome → Link Consentz → Take Assessment → Add Staff → Upload Evidence → Review Gaps → Create Policy → Complete
- Track progress in `onboarding_progress` table
- "Dismiss" option + re-access from help menu
- API: GET/PATCH `/api/onboarding/progress`

#### TASK 11: AI Chat Knowledge Base Chatbot
**Per Tobe in the meeting: "A knowledge base of Claude having access to everything."**
- Build floating chat widget (bottom-right corner of dashboard)
- System prompt with full CQC domain knowledge, KLOEs, regulations
- Context-aware: knows the user's service type, compliance score, gaps
- Store conversation history in `chat_messages` table
- API: POST `/api/chat` (Claude Sonnet)

#### TASK 12: Stripe Billing Integration
**Per Tobe: "Add the billing so that it works as a standalone SaaS product."**
**Pricing: £200/month**
- Create Stripe checkout session route: `POST /api/billing/checkout`
- Create Stripe webhook handler: `POST /api/billing/webhook`
- Handle events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`
- Wire the Settings → Billing page to show plan, status, manage subscription
- Use Stripe price ID from Jasmine's setup

#### TASK 13: Resend Email Integration
**Per meeting: Resend domain verified at `mail@consentz.com`, API key shared via Slack.**
- Create `src/lib/email/resend.ts` with functions:
  - `sendWelcomeEmail(to, name)` — on signup
  - `sendComplianceAlert(to, title, body)` — on critical sync findings
  - `sendExpiryReminder(to, itemType, itemName, date)` — from expiry-check cron
  - `sendNotificationDigest(to, notifications)` — from notification-digest cron
- Wire into existing auth webhook (signup trigger), sync job, and cron routes

#### TASK 14: Policy generation format update
**Per Tobe: "Keep it as plain as possible. Simple font, Arial, don't put any headers, just as plain and generic as possible."**
- Update AI policy generation prompt to enforce plain format
- Export as PDF with Arial 11pt, 2.5cm margins, no logos/headers
- Support multiple policy types per CQC domain (not one "magical CQC policy")

---

### PHASE 5: Final Polish

#### TASK 15: Architecture documentation + HIPAA readiness
**Per Tobe: "I want to be able to clone this out for HIPAA and the different state regulations."**
- Document the adapter pattern: `ConsentzClient` → `EpicClient` / `CernerClient`
- Document data-driven regulation framework (constants-based questions)
- Document score engine regulation-agnostic design
- Create `docs/ARCHITECTURE.md` for the team and Jasmine

---

## CONSENTZ ENDPOINT → CQC DOMAIN MAPPING

This is how each Consentz data source feeds into compliance scoring:

| Endpoint | Primary Domain | Secondary | KLOEs | Weight |
|---|---|---|---|---|
| Staff Competency | SAFE | EFFECTIVE | S3, E2 | 0.85 |
| Consent Completion | SAFE | EFFECTIVE, RESPONSIVE | S1, E6, R1 | 0.90 |
| Consent Decay | EFFECTIVE | SAFE | E6, S1 | 0.80 |
| Infection Incidents | SAFE | WELL_LED | S5, S6, W5 | 0.90 |
| Policy Acknowledgement | WELL_LED | SAFE | W2, W3, W4, S1 | 0.75 |
| Safety Checklist | SAFE | WELL_LED | S2, S5, W5 | 0.85 |
| Treatment Risk Heatmap | SAFE | EFFECTIVE | S2, E1 | 0.70 |
| Patient Feedback | CARING | RESPONSIVE | C1, R2 | 0.80 |

---

## BLENDED SCORE FORMULA

```
Domain Score = (
    Assessment Baseline × 0.30
  + Evidence Coverage   × 0.25
  + Consentz Live Data  × 0.25
  + Task Completion     × 0.15
  - 3 points per overdue critical gap
)
```

This is already implemented in `src/lib/services/score-engine.ts`. The weights match what exists in the code. No changes needed to the formula — only to the data feeding into it (fixing Tasks 1-5).

---

## TESTING CHECKLIST

After all tasks are complete, verify:

### Consentz API Connection
- [ ] Login returns 200 with session token at `user.sessionToken`
- [ ] All 8 CQC endpoints return 200 with real data (clinicId=3)
- [ ] Token auto-refresh works on 401

### Ongoing Compliance
- [ ] After sync, `consentz_sync_logs` has rows with `response_data` populated
- [ ] `compliance_scores` and `domain_scores` update with blended Consentz data
- [ ] Dashboard "Last updated" reflects last sync time
- [ ] Manual sync button triggers recalculation

### Cron
- [ ] Vercel cron config in `vercel.json` is correct
- [ ] `/api/cron/consentz-sync` runs successfully
- [ ] Auto-created tasks appear for critical findings

### SDK
- [ ] `GET /api/sdk/v1/compliance` returns blended scores with API key auth
- [ ] `POST /api/sdk/v1/validate-booking` uses live scores

### New Features
- [ ] AI Chat: CQC knowledge, context-aware, history persists
- [ ] Onboarding walkthrough: appears for new users, tracks completion
- [ ] Stripe: checkout flow, webhook handling, billing page
- [ ] Resend: welcome email on signup, compliance alerts
- [ ] Policy generation: plain format, Arial 11, no branding

---

## BLOCKED ITEMS (Awaiting External Input)

| Item | Blocking On | Notes |
|---|---|---|
| Consentz Calendar Integration | API endpoint from Jasmine | Build notification dispatcher now, plug in endpoint later |
| Consentz Chat Integration | API endpoint from Jasmine | Same — build dispatcher, await endpoint |
| Stripe Price ID | Jasmine to set up in Stripe | Use placeholder, swap when real ID arrives |
| Resend API Key | Already shared via Slack | Add to `.env` |

---

*End of Implementation Plan*
