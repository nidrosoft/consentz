# CONSENTZ × CQC COMPLIANCE MODULE — FINAL INTEGRATION CURSOR PROMPT

> **Purpose:** This is the system prompt for Cursor AI to finalize the CQC Compliance Module. The UI is 100% complete. This document covers ONLY the remaining backend integration, API wiring, and new features needed to ship.
>
> **Critical:** We do NOT use Prisma. Everything is Supabase-native (supabase-js client, direct SQL via `.rpc()`, Supabase Edge Functions). All database operations use the Supabase client. Do NOT install or reference Prisma anywhere.

---

## TABLE OF CONTENTS

1. [Current State & What's Done](#1-current-state)
2. [Tech Stack & Environment](#2-tech-stack)
3. [STEP 0: Validate Staging Endpoints](#3-step-0-validate)
4. [Consentz API Integration Service](#4-consentz-api-service)
5. [Ongoing Compliance Score Engine](#5-compliance-engine)
6. [Sync Scheduler (Cron)](#6-sync-scheduler)
7. [Dashboard Wiring — Endpoint-to-UI Map](#7-dashboard-wiring)
8. [SDK — Outbound Compliance API](#8-sdk)
9. [Consentz Calendar & Chat Integration](#9-calendar-chat)
10. [Policy Document Generation](#10-policy-generation)
11. [New User Setup Guide / Onboarding Walkthrough](#11-onboarding-walkthrough)
12. [AI Chat Help (Knowledge Base Chatbot)](#12-ai-chat)
13. [Stripe Billing Integration](#13-stripe-billing)
14. [Resend Email Integration](#14-resend-email)
15. [Testing & Validation Checklist](#15-testing)
16. [Architecture Notes (HIPAA Cloning Readiness)](#16-architecture-notes)

---

## 1. CURRENT STATE — What's Already Built {#1-current-state}

The UI is fully complete. Here is what EXISTS and should NOT be rebuilt:

### Pages & Components (All Done)
- **Dashboard** — Compliance Score card, Predicted Rating card, Open Gaps card, Overdue Tasks card, CQC Domain Overview (5 domain cards with scores, KLOE badges, gap counts), Priority Gaps list, Recent Activity feed
- **Evidence** — Evidence table with filters by domain, type, status. Upload modal with file attachment and metadata.
- **Policies** — Policy list, create/edit forms, AI generation button, policy acknowledgement tracking
- **Staff** — Staff table with CRUD, credential tracking, training records
- **Incidents** — Incident reporting form, incident table, severity/status filters
- **Tasks** — Kanban board (To Do → In Progress → Done), task creation modal
- **CQC Domains** — Individual pages for Safe, Effective, Caring, Responsive, Well-Led. Each shows domain score, KLOE breakdown, linked evidence, domain-specific gaps
- **All Domains** — Combined overview page
- **Reports** — Report generation page
- **Audit Log** — Activity log with user, action, timestamp
- **Settings** — Organization settings, User profile, Billing (placeholder), Integrations (SDK API key generation working)
- **Assessment Flow** — Multi-step questionnaire with service-type branching (Aesthetic Clinic vs Care Home), scoring engine, gap identification
- **Onboarding** — Service type selection, organization setup

### Database Tables (All Exist in Supabase)
- `organizations` — id, name, service_type, consentz_clinic_id, cqc_registration_number, settings (jsonb)
- `users` — id, clerk_id, organization_id, role, name, email
- `assessments` — id, organization_id, service_type, status, is_initial, results (jsonb), domain_scores (jsonb)
- `assessment_answers` — id, assessment_id, question_id, domain, kloe_code, answer_value, score, creates_gap, gap_severity
- `compliance_scores` — id, organization_id, overall_score, safe_score, effective_score, caring_score, responsive_score, well_led_score, predicted_rating, previous_score, calculated_at
- `compliance_gaps` — id, organization_id, domain, kloe_code, title, description, severity, status, remediation_steps
- `evidence` — id, organization_id, domain, kloe_code, title, type, file_url, status, expiry_date
- `policies` — id, organization_id, title, domain, content, status, version, review_date
- `policy_acknowledgements` — id, policy_id, user_id, acknowledged_at
- `staff_members` — id, organization_id, name, role, email, qualifications (jsonb), dbs_check_date, dbs_expiry
- `training_records` — id, staff_member_id, training_type, completed_date, expiry_date, certificate_url
- `incidents` — id, organization_id, title, description, severity, status, incident_type, reported_by, reported_at
- `tasks` — id, organization_id, title, description, status, priority, domain, kloe_code, due_date, assigned_to
- `notifications` — id, organization_id, user_id, title, message, type, read, created_at
- `activity_logs` — id, organization_id, user_id, action, resource_type, resource_id, details (jsonb), created_at
- `api_keys` — id, organization_id, key_hash, name, last_used, created_at

### What Does NOT Exist Yet (Build These)
- `consentz_sync_logs` — tracking sync operations
- `consentz_snapshots` — storing raw API response data
- `subscription_plans` — pricing tier definitions
- `subscriptions` — user subscription records
- `onboarding_progress` — tracking setup guide completion
- `chat_messages` — AI chat conversation history

---

## 2. TECH STACK & ENVIRONMENT {#2-tech-stack}

```
Framework:        Next.js 15 (App Router)
Language:         TypeScript (strict mode)
Database:         Supabase PostgreSQL (supabase-js client — NO PRISMA)
Auth:             Clerk (middleware, webhooks, session management)
UI:               shadcn/ui + Tailwind CSS
AI:               Anthropic Claude API (claude-sonnet-4-20250514)
Email:            Resend (API key shared via Slack — check .env)
Payments:         Stripe (API keys from Jasmine — check .env)
Deployment:       Vercel
File Storage:     Supabase Storage
```

### Environment Variables Required
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Consentz API (staging)
CONSENTZ_BASE_URL=https://staging.consentz.com/api/v1
CONSENTZ_APPLICATION_ID=admin
CONSENTZ_USERNAME=demo
CONSENTZ_PASSWORD=password

# Anthropic
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=mail@consentz.com

# Sync
CRON_SECRET=  # For securing Vercel Cron endpoints
```

---

## 3. STEP 0: VALIDATE STAGING ENDPOINTS (DO THIS FIRST) {#3-step-0-validate}

**Before writing ANY integration code, you MUST validate that every Consentz staging endpoint returns data.** Create a temporary validation script.

### Create: `scripts/validate-consentz-endpoints.ts`

```typescript
/**
 * Run this script first: npx ts-node scripts/validate-consentz-endpoints.ts
 * 
 * It will:
 * 1. Login to Consentz staging and get a session token
 * 2. Hit all 8 CQC report endpoints
 * 3. Print the response status + first 500 chars of each response body
 * 4. Save full responses to scripts/endpoint-responses/ for reference
 * 
 * This tells us the ACTUAL response shapes so we can build transformers correctly.
 */

const BASE_URL = 'https://staging.consentz.com/api/v1';
const APP_ID = 'admin';
const CLINIC_ID = '3';

interface EndpointConfig {
  name: string;
  path: string;
  queryParams?: Record<string, string>;
}

const ENDPOINTS: EndpointConfig[] = [
  {
    name: 'staff-competency',
    path: `/clinic/${CLINIC_ID}/cqc-reports`,
  },
  {
    name: 'consent-completion',
    path: `/clinic/${CLINIC_ID}/cqc-reports/consent-completion`,
    queryParams: { startDate: '2022-01-01', period: 'month' },
  },
  {
    name: 'consent-decay',
    path: `/clinic/${CLINIC_ID}/cqc-reports/consent-decay`,
    queryParams: { startDate: '2022-01-01', period: 'month' },
  },
  {
    name: 'infection-incidents',
    path: `/clinic/${CLINIC_ID}/cqc-reports/infection-incidents`,
    queryParams: { startDate: '2022-01-01', period: 'month' },
  },
  {
    name: 'policy-acknowledgement',
    path: `/clinic/${CLINIC_ID}/cqc-reports/policy-acknowledgement`,
    queryParams: { startDate: '2022-01-01', period: 'month' },
  },
  {
    name: 'safety-checklist',
    path: `/clinic/${CLINIC_ID}/cqc-reports/safety-checklist`,
    queryParams: { startDate: '2022-01-01', period: 'month' },
  },
  {
    name: 'treatment-risk-heatmap',
    path: `/clinic/${CLINIC_ID}/cqc-reports/treatment-risk-heatmap`,
    queryParams: { from: '2022-01-01', period: 'month' },
  },
  {
    name: 'patient-feedback',
    path: `/clinic/${CLINIC_ID}/cqc-reports/patient-feedback`,
    queryParams: { from: '2022-01-01', period: 'month' },
  },
];

async function validate() {
  // Step 1: Login
  console.log('🔐 Logging in to Consentz staging...');
  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-APPLICATION-ID': APP_ID,
    },
    body: JSON.stringify({
      username: 'demo',
      password: 'password',
      confirmLogin: true,
    }),
  });

  if (!loginRes.ok) {
    console.error('❌ Login failed:', loginRes.status, await loginRes.text());
    return;
  }

  const loginData = await loginRes.json();
  console.log('✅ Login successful. Response keys:', Object.keys(loginData));
  
  // Extract session token — check common patterns
  const sessionToken = loginData.sessionToken 
    || loginData.session_token 
    || loginData.token
    || loginData.result?.sessionToken;
  
  console.log('🔑 Session token found:', sessionToken ? 'YES' : 'NO — check loginData structure');
  console.log('📦 Full login response (first 500 chars):', JSON.stringify(loginData).substring(0, 500));
  
  // IMPORTANT: If sessionToken is not found, log the full response and stop.
  // You may need to use the hardcoded token from Postman: r:b1620015184fefc06ad34d1ca78b32d4
  const token = sessionToken || 'r:b1620015184fefc06ad34d1ca78b32d4';

  // Step 2: Hit all endpoints
  console.log('\n📡 Testing all 8 CQC report endpoints...\n');

  for (const endpoint of ENDPOINTS) {
    const url = new URL(`${BASE_URL}${endpoint.path}`);
    if (endpoint.queryParams) {
      Object.entries(endpoint.queryParams).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-SESSION-TOKEN': token,
          'X-APPLICATION-ID': APP_ID,
        },
      });

      const body = await res.text();
      const status = res.ok ? '✅' : '❌';
      
      console.log(`${status} ${endpoint.name}`);
      console.log(`   URL: ${url.toString()}`);
      console.log(`   Status: ${res.status}`);
      console.log(`   Response (first 500 chars): ${body.substring(0, 500)}`);
      console.log(`   Full response length: ${body.length} chars`);
      console.log('');

      // Save full response for reference
      // fs.writeFileSync(`scripts/endpoint-responses/${endpoint.name}.json`, body);
    } catch (err) {
      console.log(`❌ ${endpoint.name} — NETWORK ERROR: ${err}`);
    }
  }

  console.log('🏁 Validation complete. Review the responses above to confirm data shapes.');
  console.log('⚠️  IMPORTANT: Save the actual response shapes — you will use them to build the type definitions in Section 4.');
}

validate();
```

### What To Do With The Results

After running the script, you will have the actual JSON response structures. Use them to:
1. Create TypeScript interfaces in `lib/consentz/types.ts`
2. Build the transformation functions in `lib/consentz/transformers.ts`
3. Map fields to our Supabase tables

**Do NOT proceed to Section 4 until you have confirmed all 8 endpoints return 200 OK with data.**

If any endpoint fails, check:
- Is the session token expired? Try re-logging in, or use the hardcoded Postman token.
- Is the clinicId correct? Try `3` as per the Postman collection.
- Are query params required? Some endpoints need `startDate` + `period`, others need `from` + `period`.

---

## 4. CONSENTZ API INTEGRATION SERVICE {#4-consentz-api-service}

Build a centralized service that handles all communication with the Consentz API.

### File Structure

```
lib/
  consentz/
    client.ts          — HTTP client with auth, retry, token refresh
    types.ts           — TypeScript interfaces for all API responses
    transformers.ts    — Transform Consentz responses → our Supabase models
    endpoints.ts       — Individual endpoint call functions
    sync.ts            — Orchestrator that calls all endpoints and stores results
    domain-mapper.ts   — Maps endpoint data to CQC domains/KLOEs
```

### 4.1 Create: `lib/consentz/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const CONSENTZ_BASE_URL = process.env.CONSENTZ_BASE_URL!;
const APP_ID = process.env.CONSENTZ_APPLICATION_ID || 'admin';

interface ConsentzAuthConfig {
  username: string;
  password: string;
}

export class ConsentzClient {
  private sessionToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(private config: ConsentzAuthConfig) {}

  /**
   * Authenticate with Consentz and store the session token.
   * Call this before making any API requests.
   * Token is cached and refreshed when expired.
   */
  async authenticate(): Promise<string> {
    if (this.sessionToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
      return this.sessionToken;
    }

    const res = await fetch(`${CONSENTZ_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-APPLICATION-ID': APP_ID,
      },
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
        confirmLogin: true,
      }),
    });

    if (!res.ok) {
      throw new Error(`Consentz login failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    
    // IMPORTANT: Adjust this based on actual login response from Step 0
    // The session token path may be: data.sessionToken, data.token, data.result.sessionToken, etc.
    this.sessionToken = data.sessionToken || data.token || data.result?.sessionToken;
    
    if (!this.sessionToken) {
      throw new Error(`Could not extract session token from login response. Keys: ${Object.keys(data)}`);
    }

    // Default to 24-hour token lifetime — adjust if Consentz specifies differently
    this.tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    return this.sessionToken;
  }

  /**
   * Make an authenticated GET request to Consentz API.
   * Automatically refreshes token if expired.
   * Retries once on 401 (token might have been invalidated).
   */
  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const token = await this.authenticate();
    
    const url = new URL(`${CONSENTZ_BASE_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    let res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-SESSION-TOKEN': token,
        'X-APPLICATION-ID': APP_ID,
      },
    });

    // Retry once on 401 — token may have expired
    if (res.status === 401) {
      this.sessionToken = null;
      const newToken = await this.authenticate();
      res = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'X-SESSION-TOKEN': newToken,
          'X-APPLICATION-ID': APP_ID,
        },
      });
    }

    if (!res.ok) {
      throw new Error(`Consentz API error: ${res.status} ${res.statusText} on ${path}`);
    }

    return res.json() as Promise<T>;
  }
}

// Singleton instance — use organization-specific credentials in production
let clientInstance: ConsentzClient | null = null;

export function getConsentzClient(): ConsentzClient {
  if (!clientInstance) {
    clientInstance = new ConsentzClient({
      username: process.env.CONSENTZ_USERNAME!,
      password: process.env.CONSENTZ_PASSWORD!,
    });
  }
  return clientInstance;
}

/**
 * For multi-tenant: create a client with specific organization credentials.
 * The org's Consentz credentials should be stored encrypted in the organizations table.
 */
export function createConsentzClientForOrg(username: string, password: string): ConsentzClient {
  return new ConsentzClient({ username, password });
}
```

### 4.2 Create: `lib/consentz/types.ts`

**IMPORTANT: The interfaces below are EXPECTED shapes based on endpoint names. After running the Step 0 validation script, UPDATE THESE to match the ACTUAL response structures.**

```typescript
// ============================================================
// CONSENTZ API RESPONSE TYPES
// ============================================================
// ⚠️ UPDATE THESE based on actual staging endpoint responses!
// Run scripts/validate-consentz-endpoints.ts first.
// ============================================================

/** POST /login response */
export interface ConsentzLoginResponse {
  sessionToken: string; // Adjust field name based on actual response
  // Add other fields from actual response
}

/** GET /clinic/:clinicId/cqc-reports — Staff Competency */
export interface ConsentzStaffCompetencyReport {
  // EXPECTED: Array of staff members with their qualification/certification status
  // Update with actual shape after Step 0
  result: unknown; // Replace 'unknown' with actual type
}

/** GET /clinic/:clinicId/cqc-reports/consent-completion */
export interface ConsentzConsentCompletionReport {
  // EXPECTED: Consent completion rates over time periods
  // Likely includes: completionRate, breakdown by type, period data
  result: unknown;
}

/** GET /clinic/:clinicId/cqc-reports/consent-decay */
export interface ConsentzConsentDecayReport {
  // EXPECTED: List of consents nearing expiry or expired
  // Likely includes: patientId, consentType, signedDate, expiryDate, daysRemaining
  result: unknown;
}

/** GET /clinic/:clinicId/cqc-reports/infection-incidents */
export interface ConsentzInfectionIncidentsReport {
  // EXPECTED: Infection-related incidents with severity and status
  result: unknown;
}

/** GET /clinic/:clinicId/cqc-reports/policy-acknowledgement */
export interface ConsentzPolicyAckReport {
  // EXPECTED: Per-policy acknowledgement status by staff
  result: unknown;
}

/** GET /clinic/:clinicId/cqc-reports/safety-checklist */
export interface ConsentzSafetyChecklistReport {
  // EXPECTED: Fire drills, emergency kit checks, safety items with dates/status
  result: unknown;
}

/** GET /clinic/:clinicId/cqc-reports/treatment-risk-heatmap */
export interface ConsentzTreatmentRiskHeatmapReport {
  // EXPECTED: Treatment types with associated risk levels/complication rates
  result: unknown;
}

/** GET /clinic/:clinicId/cqc-reports/patient-feedback */
export interface ConsentzPatientFeedbackReport {
  // EXPECTED: Patient satisfaction scores, feedback entries, rating distribution
  result: unknown;
}
```

### 4.3 Create: `lib/consentz/endpoints.ts`

```typescript
import { ConsentzClient } from './client';
import {
  ConsentzStaffCompetencyReport,
  ConsentzConsentCompletionReport,
  ConsentzConsentDecayReport,
  ConsentzInfectionIncidentsReport,
  ConsentzPolicyAckReport,
  ConsentzSafetyChecklistReport,
  ConsentzTreatmentRiskHeatmapReport,
  ConsentzPatientFeedbackReport,
} from './types';

// Default query params — pull broad date range to get maximum data
const DEFAULT_PARAMS = {
  startDate: '2022-01-01',
  period: 'month',
};

// Note: treatment-risk-heatmap and patient-feedback use 'from' instead of 'startDate'
const ALT_PARAMS = {
  from: '2022-01-01',
  period: 'month',
};

export async function fetchStaffCompetency(client: ConsentzClient, clinicId: string) {
  return client.get<ConsentzStaffCompetencyReport>(`/clinic/${clinicId}/cqc-reports`);
}

export async function fetchConsentCompletion(client: ConsentzClient, clinicId: string) {
  return client.get<ConsentzConsentCompletionReport>(
    `/clinic/${clinicId}/cqc-reports/consent-completion`,
    DEFAULT_PARAMS
  );
}

export async function fetchConsentDecay(client: ConsentzClient, clinicId: string) {
  return client.get<ConsentzConsentDecayReport>(
    `/clinic/${clinicId}/cqc-reports/consent-decay`,
    DEFAULT_PARAMS
  );
}

export async function fetchInfectionIncidents(client: ConsentzClient, clinicId: string) {
  return client.get<ConsentzInfectionIncidentsReport>(
    `/clinic/${clinicId}/cqc-reports/infection-incidents`,
    DEFAULT_PARAMS
  );
}

export async function fetchPolicyAcknowledgement(client: ConsentzClient, clinicId: string) {
  return client.get<ConsentzPolicyAckReport>(
    `/clinic/${clinicId}/cqc-reports/policy-acknowledgement`,
    DEFAULT_PARAMS
  );
}

export async function fetchSafetyChecklist(client: ConsentzClient, clinicId: string) {
  return client.get<ConsentzSafetyChecklistReport>(
    `/clinic/${clinicId}/cqc-reports/safety-checklist`,
    DEFAULT_PARAMS
  );
}

export async function fetchTreatmentRiskHeatmap(client: ConsentzClient, clinicId: string) {
  return client.get<ConsentzTreatmentRiskHeatmapReport>(
    `/clinic/${clinicId}/cqc-reports/treatment-risk-heatmap`,
    ALT_PARAMS
  );
}

export async function fetchPatientFeedback(client: ConsentzClient, clinicId: string) {
  return client.get<ConsentzPatientFeedbackReport>(
    `/clinic/${clinicId}/cqc-reports/patient-feedback`,
    ALT_PARAMS
  );
}

/** Fetch ALL 8 endpoints in parallel. Returns object keyed by report name. */
export async function fetchAllReports(client: ConsentzClient, clinicId: string) {
  const [
    staffCompetency,
    consentCompletion,
    consentDecay,
    infectionIncidents,
    policyAcknowledgement,
    safetyChecklist,
    treatmentRiskHeatmap,
    patientFeedback,
  ] = await Promise.allSettled([
    fetchStaffCompetency(client, clinicId),
    fetchConsentCompletion(client, clinicId),
    fetchConsentDecay(client, clinicId),
    fetchInfectionIncidents(client, clinicId),
    fetchPolicyAcknowledgement(client, clinicId),
    fetchSafetyChecklist(client, clinicId),
    fetchTreatmentRiskHeatmap(client, clinicId),
    fetchPatientFeedback(client, clinicId),
  ]);

  return {
    staffCompetency: staffCompetency.status === 'fulfilled' ? staffCompetency.value : null,
    consentCompletion: consentCompletion.status === 'fulfilled' ? consentCompletion.value : null,
    consentDecay: consentDecay.status === 'fulfilled' ? consentDecay.value : null,
    infectionIncidents: infectionIncidents.status === 'fulfilled' ? infectionIncidents.value : null,
    policyAcknowledgement: policyAcknowledgement.status === 'fulfilled' ? policyAcknowledgement.value : null,
    safetyChecklist: safetyChecklist.status === 'fulfilled' ? safetyChecklist.value : null,
    treatmentRiskHeatmap: treatmentRiskHeatmap.status === 'fulfilled' ? treatmentRiskHeatmap.value : null,
    patientFeedback: patientFeedback.status === 'fulfilled' ? patientFeedback.value : null,
    fetchedAt: new Date().toISOString(),
    errors: [
      staffCompetency, consentCompletion, consentDecay, infectionIncidents,
      policyAcknowledgement, safetyChecklist, treatmentRiskHeatmap, patientFeedback,
    ]
      .map((r, i) => r.status === 'rejected' ? { endpoint: i, error: r.reason?.message } : null)
      .filter(Boolean),
  };
}
```

### 4.4 Create: `lib/consentz/domain-mapper.ts`

This is the critical mapping layer — it defines which Consentz endpoint data feeds which CQC domain and KLOE.

```typescript
/**
 * CONSENTZ ENDPOINT → CQC DOMAIN/KLOE MAPPING
 * 
 * This is the heart of the "ongoing compliance" feature.
 * Each Consentz data feed maps to specific CQC domains and KLOEs,
 * affecting domain scores in real-time.
 */

export type CqcDomain = 'safe' | 'effective' | 'caring' | 'responsive' | 'well_led';

interface DomainMapping {
  primaryDomain: CqcDomain;
  secondaryDomains: CqcDomain[];
  kloes: string[];
  regulations: string[];
  weight: number; // How heavily this endpoint affects the domain score (0-1)
  description: string;
}

export const ENDPOINT_DOMAIN_MAP: Record<string, DomainMapping> = {
  
  staffCompetency: {
    primaryDomain: 'safe',
    secondaryDomains: ['effective'],
    kloes: ['S3', 'E2'],
    regulations: ['Reg 18', 'Reg 19'],
    weight: 0.85,
    description: 'Staff qualifications, certifications, DBS checks, training currency. Drives Safe (sufficient skilled staff) and Effective (staff have skills for effective care).',
  },

  consentCompletion: {
    primaryDomain: 'safe',
    secondaryDomains: ['effective', 'responsive'],
    kloes: ['S1', 'E6', 'R1'],
    regulations: ['Reg 11', 'Reg 13'],
    weight: 0.90,
    description: 'Whether consents are properly obtained before treatment. High completion = safe practice. Low = safeguarding risk.',
  },

  consentDecay: {
    primaryDomain: 'effective',
    secondaryDomains: ['safe'],
    kloes: ['E6', 'S1'],
    regulations: ['Reg 11'],
    weight: 0.80,
    description: 'Expiring or expired consents. Drives ongoing consent management — consents must be refreshed periodically.',
  },

  infectionIncidents: {
    primaryDomain: 'safe',
    secondaryDomains: ['well_led'],
    kloes: ['S5', 'S6', 'W5'],
    regulations: ['Reg 12', 'Reg 17'],
    weight: 0.90,
    description: 'Infection control incidents. High count with no learning = critical Safe failure. Evidence of learning from incidents feeds Well-Led.',
  },

  policyAcknowledgement: {
    primaryDomain: 'well_led',
    secondaryDomains: ['safe'],
    kloes: ['W2', 'W3', 'W4', 'S1'],
    regulations: ['Reg 17'],
    weight: 0.75,
    description: 'Staff acknowledgement of policies. Demonstrates governance (Well-Led) and that staff are aware of safeguarding/safety procedures (Safe).',
  },

  safetyChecklist: {
    primaryDomain: 'safe',
    secondaryDomains: ['well_led'],
    kloes: ['S2', 'S5', 'W5'],
    regulations: ['Reg 12', 'Reg 15', 'Reg 17'],
    weight: 0.85,
    description: 'Fire drills, emergency equipment, premises safety. Core Safe domain evidence. Completion demonstrates risk management (Well-Led).',
  },

  treatmentRiskHeatmap: {
    primaryDomain: 'safe',
    secondaryDomains: ['effective'],
    kloes: ['S2', 'E1'],
    regulations: ['Reg 12'],
    weight: 0.70,
    description: 'Treatment risk distribution. Helps identify high-risk procedures needing additional safeguards. Informs risk assessment processes.',
  },

  patientFeedback: {
    primaryDomain: 'caring',
    secondaryDomains: ['responsive'],
    kloes: ['C1', 'R2'],
    regulations: ['Reg 10', 'Reg 16'],
    weight: 0.80,
    description: 'Patient satisfaction and complaints. Primary driver for Caring domain. Complaint handling drives Responsive domain.',
  },
};

/**
 * Given all Consentz report data, calculate per-domain metric scores (0-100).
 * 
 * IMPORTANT: The scoring logic below uses PLACEHOLDER calculations.
 * After you see the actual response data from Step 0, replace the placeholder
 * calculations with real field-level logic.
 */
export function calculateDomainMetricsFromConsentz(reports: Record<string, any>): Record<CqcDomain, number> {
  const scores: Record<CqcDomain, { total: number; weightSum: number }> = {
    safe: { total: 0, weightSum: 0 },
    effective: { total: 0, weightSum: 0 },
    caring: { total: 0, weightSum: 0 },
    responsive: { total: 0, weightSum: 0 },
    well_led: { total: 0, weightSum: 0 },
  };

  for (const [endpointKey, mapping] of Object.entries(ENDPOINT_DOMAIN_MAP)) {
    const data = reports[endpointKey];
    if (!data) continue;

    // Calculate a 0-100 metric from this endpoint's data
    // ⚠️ REPLACE THIS with actual calculations based on real response fields
    const metric = calculateEndpointMetric(endpointKey, data);

    // Apply to primary domain
    scores[mapping.primaryDomain].total += metric * mapping.weight;
    scores[mapping.primaryDomain].weightSum += mapping.weight;

    // Apply to secondary domains at 50% influence
    for (const secondary of mapping.secondaryDomains) {
      scores[secondary].total += metric * mapping.weight * 0.5;
      scores[secondary].weightSum += mapping.weight * 0.5;
    }
  }

  // Normalize to 0-100
  const result: Record<CqcDomain, number> = {
    safe: 0, effective: 0, caring: 0, responsive: 0, well_led: 0,
  };

  for (const [domain, { total, weightSum }] of Object.entries(scores)) {
    result[domain as CqcDomain] = weightSum > 0 ? Math.round(total / weightSum) : 0;
  }

  return result;
}

/**
 * PLACEHOLDER: Calculate a 0-100 score for a single endpoint's data.
 * 
 * ⚠️ YOU MUST REPLACE THIS with actual logic based on the real response fields.
 * 
 * Example real implementations after seeing data:
 * 
 * consentCompletion: 
 *   score = data.completionRate (if it's already 0-100)
 *   OR score = (data.completed / data.total) * 100
 * 
 * staffCompetency:
 *   score = (staffWithAllCertsValid / totalStaff) * 100
 * 
 * consentDecay:
 *   expiredCount = data.filter(c => c.daysRemaining <= 0).length
 *   score = Math.max(0, 100 - (expiredCount * 10))
 * 
 * infectionIncidents:
 *   score = incidents.length === 0 ? 100 : Math.max(0, 100 - (incidents.length * 15))
 *   (bonus if evidence of learning exists)
 * 
 * patientFeedback:
 *   score = data.averageRating * 20 (if 1-5 scale)
 */
function calculateEndpointMetric(endpointKey: string, data: any): number {
  // PLACEHOLDER — returns 50 for all endpoints
  // REPLACE with actual calculation per endpoint after inspecting staging data
  console.warn(`⚠️ Using placeholder metric for ${endpointKey} — replace with real calculation`);
  return 50;
}
```

---

## 5. ONGOING COMPLIANCE SCORE ENGINE {#5-compliance-engine}

This is the core algorithm that makes the tool an "ongoing compliance" system rather than a one-time assessment.

### The Blended Score Formula

```
Domain Score = (
    Assessment Baseline × 0.30      ← Initial questionnaire snapshot
  + Evidence Coverage   × 0.20      ← % of required evidence uploaded and current
  + Consentz Live Data  × 0.30      ← Real-time metrics from 8 Consentz endpoints
  + Task Completion     × 0.15      ← % of compliance tasks completed
  - Penalty             × penalty   ← 3 points per overdue critical gap
)

Overall Score = Weighted average of all 5 domain scores
  (Safe: 25%, Effective: 20%, Caring: 15%, Responsive: 15%, Well-Led: 25%)
```

### Create: `lib/compliance/score-engine.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { calculateDomainMetricsFromConsentz, CqcDomain } from '../consentz/domain-mapper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type CqcRating = 'OUTSTANDING' | 'GOOD' | 'REQUIRES_IMPROVEMENT' | 'INADEQUATE';

// Domain weights in overall score — Safe and Well-Led weighted higher per CQC priority
const DOMAIN_WEIGHTS: Record<CqcDomain, number> = {
  safe: 0.25,
  effective: 0.20,
  caring: 0.15,
  responsive: 0.15,
  well_led: 0.25,
};

function scoreToRating(score: number): CqcRating {
  if (score >= 88) return 'OUTSTANDING';
  if (score >= 63) return 'GOOD';
  if (score >= 39) return 'REQUIRES_IMPROVEMENT';
  return 'INADEQUATE';
}

interface ScoreInputs {
  organizationId: string;
  consentzReports: Record<string, any>; // Raw Consentz endpoint data
}

export async function recalculateComplianceScore(inputs: ScoreInputs) {
  const { organizationId, consentzReports } = inputs;

  // 1. Get assessment baseline scores
  const { data: assessment } = await supabase
    .from('assessments')
    .select('domain_scores')
    .eq('organization_id', organizationId)
    .eq('status', 'COMPLETED')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  const assessmentScores: Record<CqcDomain, number> = assessment?.domain_scores || {
    safe: 0, effective: 0, caring: 0, responsive: 0, well_led: 0,
  };

  // 2. Calculate evidence coverage per domain
  const evidenceCoverage = await calculateEvidenceCoverage(organizationId);

  // 3. Get Consentz live metrics
  const consentzMetrics = calculateDomainMetricsFromConsentz(consentzReports);

  // 4. Get task completion per domain
  const taskCompletion = await calculateTaskCompletion(organizationId);

  // 5. Count overdue critical gaps
  const { count: overdueCritical } = await supabase
    .from('compliance_gaps')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('severity', 'CRITICAL')
    .eq('status', 'OPEN');

  // 6. Calculate blended score per domain
  const domainScores: Record<CqcDomain, number> = {} as any;

  for (const domain of Object.keys(DOMAIN_WEIGHTS) as CqcDomain[]) {
    let score = (
      (assessmentScores[domain] || 0) * 0.30 +
      (evidenceCoverage[domain] || 0) * 0.20 +
      (consentzMetrics[domain] || 0) * 0.30 +
      (taskCompletion[domain] || 0) * 0.15
    );

    // Penalty: each overdue critical gap reduces score by 3 points
    score -= (overdueCritical || 0) * 3;

    domainScores[domain] = Math.max(0, Math.min(100, Math.round(score)));
  }

  // 7. Calculate overall score (weighted average)
  let overallScore = 0;
  for (const [domain, weight] of Object.entries(DOMAIN_WEIGHTS)) {
    overallScore += (domainScores[domain as CqcDomain] || 0) * weight;
  }
  overallScore = Math.max(0, Math.min(100, Math.round(overallScore)));

  // 8. Determine predicted rating
  const predictedRating = scoreToRating(overallScore);

  // 9. Fetch previous score for delta tracking
  const { data: prevScore } = await supabase
    .from('compliance_scores')
    .select('overall_score')
    .eq('organization_id', organizationId)
    .single();

  // 10. Upsert compliance_scores record
  const { error } = await supabase
    .from('compliance_scores')
    .upsert({
      organization_id: organizationId,
      overall_score: overallScore,
      previous_score: prevScore?.overall_score || null,
      safe_score: domainScores.safe,
      effective_score: domainScores.effective,
      caring_score: domainScores.caring,
      responsive_score: domainScores.responsive,
      well_led_score: domainScores.well_led,
      predicted_rating: predictedRating,
      calculated_at: new Date().toISOString(),
      consentz_data_freshness: consentzReports.fetchedAt || new Date().toISOString(),
    }, {
      onConflict: 'organization_id',
    });

  if (error) throw error;

  return { overallScore, predictedRating, domainScores };
}

async function calculateEvidenceCoverage(orgId: string): Promise<Record<CqcDomain, number>> {
  // Count evidence items per domain, compare against expected evidence count per domain
  // Expected evidence counts based on KLOE requirements
  const EXPECTED_EVIDENCE: Record<CqcDomain, number> = {
    safe: 18,      // S1-S6 require ~3 pieces each
    effective: 15,  // E1-E6 require ~2-3 pieces each
    caring: 8,      // C1-C3
    responsive: 8,  // R1-R3
    well_led: 15,   // W1-W6
  };

  const domains: CqcDomain[] = ['safe', 'effective', 'caring', 'responsive', 'well_led'];
  const result: Record<CqcDomain, number> = {} as any;

  for (const domain of domains) {
    const { count } = await supabase
      .from('evidence')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('domain', domain)
      .in('status', ['CURRENT', 'APPROVED']);

    const coverage = Math.min(100, ((count || 0) / EXPECTED_EVIDENCE[domain]) * 100);
    result[domain] = Math.round(coverage);
  }

  return result;
}

async function calculateTaskCompletion(orgId: string): Promise<Record<CqcDomain, number>> {
  const domains: CqcDomain[] = ['safe', 'effective', 'caring', 'responsive', 'well_led'];
  const result: Record<CqcDomain, number> = {} as any;

  for (const domain of domains) {
    const { count: total } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('domain', domain);

    const { count: completed } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('domain', domain)
      .eq('status', 'DONE');

    result[domain] = total && total > 0 ? Math.round(((completed || 0) / total) * 100) : 0;
  }

  return result;
}
```

---

## 6. SYNC SCHEDULER {#6-sync-scheduler}

### New Tables to Create in Supabase

Run these SQL migrations via Supabase Dashboard → SQL Editor:

```sql
-- Table: consentz_sync_logs — tracks each sync cycle
CREATE TABLE IF NOT EXISTS consentz_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED')),
  endpoints_called INTEGER DEFAULT 0,
  endpoints_succeeded INTEGER DEFAULT 0,
  endpoints_failed INTEGER DEFAULT 0,
  error_details JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

CREATE INDEX idx_sync_logs_org ON consentz_sync_logs(organization_id);
CREATE INDEX idx_sync_logs_status ON consentz_sync_logs(status);

-- Table: consentz_snapshots — stores raw API response data per sync
CREATE TABLE IF NOT EXISTS consentz_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sync_log_id UUID REFERENCES consentz_sync_logs(id) ON DELETE CASCADE,
  endpoint_name TEXT NOT NULL,
  response_data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_org ON consentz_snapshots(organization_id);
CREATE INDEX idx_snapshots_endpoint ON consentz_snapshots(endpoint_name);

-- Add consentz_data_freshness column to compliance_scores if not exists
ALTER TABLE compliance_scores ADD COLUMN IF NOT EXISTS consentz_data_freshness TIMESTAMPTZ;
```

### Create: `app/api/cron/sync-consentz/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createConsentzClientForOrg } from '@/lib/consentz/client';
import { fetchAllReports } from '@/lib/consentz/endpoints';
import { recalculateComplianceScore } from '@/lib/compliance/score-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Cron endpoint — called by Vercel Cron every 6 hours.
 * For each organization with a linked Consentz clinic:
 *   1. Fetch all 8 CQC report endpoints
 *   2. Store snapshot data
 *   3. Recalculate compliance scores
 *   4. Auto-create tasks for critical findings
 */
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all organizations with Consentz clinic IDs
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, consentz_clinic_id, settings')
    .not('consentz_clinic_id', 'is', null);

  if (orgError || !orgs) {
    return NextResponse.json({ error: 'Failed to fetch orgs', details: orgError }, { status: 500 });
  }

  const results = [];

  for (const org of orgs) {
    const startTime = Date.now();

    // Create sync log entry
    const { data: syncLog } = await supabase
      .from('consentz_sync_logs')
      .insert({
        organization_id: org.id,
        status: 'RUNNING',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    try {
      // Get org-specific Consentz credentials from settings
      // In production, credentials should be encrypted. For now, use env defaults.
      const consentzUsername = org.settings?.consentz_username || process.env.CONSENTZ_USERNAME!;
      const consentzPassword = org.settings?.consentz_password || process.env.CONSENTZ_PASSWORD!;

      const client = createConsentzClientForOrg(consentzUsername, consentzPassword);
      const clinicId = String(org.consentz_clinic_id);

      // Fetch all 8 reports
      const reports = await fetchAllReports(client, clinicId);

      // Store snapshots
      const endpointNames = [
        'staffCompetency', 'consentCompletion', 'consentDecay', 'infectionIncidents',
        'policyAcknowledgement', 'safetyChecklist', 'treatmentRiskHeatmap', 'patientFeedback',
      ];

      for (const name of endpointNames) {
        if (reports[name as keyof typeof reports]) {
          await supabase.from('consentz_snapshots').insert({
            organization_id: org.id,
            sync_log_id: syncLog?.id,
            endpoint_name: name,
            response_data: reports[name as keyof typeof reports],
            fetched_at: reports.fetchedAt,
          });
        }
      }

      // Recalculate compliance scores
      await recalculateComplianceScore({
        organizationId: org.id,
        consentzReports: reports,
      });

      // Auto-create tasks for critical findings
      await autoCreateTasksFromReports(org.id, reports);

      // Update sync log
      const succeeded = endpointNames.filter(n => reports[n as keyof typeof reports] !== null).length;
      await supabase
        .from('consentz_sync_logs')
        .update({
          status: 'COMPLETED',
          endpoints_called: 8,
          endpoints_succeeded: succeeded,
          endpoints_failed: 8 - succeeded,
          error_details: reports.errors.length > 0 ? reports.errors : null,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        })
        .eq('id', syncLog?.id);

      results.push({ orgId: org.id, status: 'success', succeeded, failed: 8 - succeeded });

    } catch (err: any) {
      await supabase
        .from('consentz_sync_logs')
        .update({
          status: 'FAILED',
          error_details: { message: err.message },
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        })
        .eq('id', syncLog?.id);

      results.push({ orgId: org.id, status: 'failed', error: err.message });
    }
  }

  return NextResponse.json({ synced: results.length, results });
}

/**
 * Auto-create compliance tasks based on critical findings in Consentz data.
 * ⚠️ IMPLEMENT the logic based on actual response fields after Step 0.
 */
async function autoCreateTasksFromReports(orgId: string, reports: any) {
  const tasksToCreate: any[] = [];

  // Example: Create task for expired consents from consent-decay endpoint
  // REPLACE with real field checks after inspecting data
  if (reports.consentDecay) {
    // const expiredConsents = reports.consentDecay.result?.filter((c: any) => c.daysRemaining <= 0);
    // if (expiredConsents?.length > 0) {
    //   tasksToCreate.push({
    //     organization_id: orgId,
    //     title: `${expiredConsents.length} expired consent(s) require renewal`,
    //     description: 'Patients with expired consents identified by Consentz sync. Review and renew before next treatment.',
    //     status: 'TODO',
    //     priority: 'HIGH',
    //     domain: 'effective',
    //     kloe_code: 'E6',
    //     source: 'consentz_sync',
    //   });
    // }
  }

  // Example: Create task for overdue staff certifications
  // Example: Create task for pending safety checklist items
  // Example: Create task for negative patient feedback requiring response

  if (tasksToCreate.length > 0) {
    await supabase.from('tasks').insert(tasksToCreate);
  }
}
```

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-consentz",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This runs the sync every 6 hours (00:00, 06:00, 12:00, 18:00 UTC).

### Manual Sync Trigger API

Also create an endpoint for manual sync (user clicks "Refresh" on dashboard):

Create: `app/api/consentz/sync/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { getConsentzClient } from '@/lib/consentz/client';
import { fetchAllReports } from '@/lib/consentz/endpoints';
import { recalculateComplianceScore } from '@/lib/compliance/score-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get user's org
  const { data: user } = await supabase
    .from('users')
    .select('organization_id')
    .eq('clerk_id', userId)
    .single();

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Get org's Consentz clinic ID
  const { data: org } = await supabase
    .from('organizations')
    .select('consentz_clinic_id')
    .eq('id', user.organization_id)
    .single();

  if (!org?.consentz_clinic_id) {
    return NextResponse.json({ error: 'No Consentz clinic linked' }, { status: 400 });
  }

  try {
    const client = getConsentzClient();
    const reports = await fetchAllReports(client, String(org.consentz_clinic_id));

    const result = await recalculateComplianceScore({
      organizationId: user.organization_id,
      consentzReports: reports,
    });

    // Log activity
    await supabase.from('activity_logs').insert({
      organization_id: user.organization_id,
      user_id: userId,
      action: 'MANUAL_SYNC',
      resource_type: 'consentz_sync',
      details: { overallScore: result.overallScore, predictedRating: result.predictedRating },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: 'Sync failed', details: err.message }, { status: 500 });
  }
}
```

---

## 7. DASHBOARD WIRING — ENDPOINT-TO-UI MAP {#7-dashboard-wiring}

This maps each existing UI section to its data source. The dashboard currently shows assessment-only data. Wire it up to use BOTH assessment data AND Consentz live data.

| UI Section | Current Data Source | Wire To |
|---|---|---|
| **Compliance Score** card (15% shown) | `compliance_scores.overall_score` | Same — but now it's recalculated with Consentz data blended in |
| **Predicted Rating** badge | `compliance_scores.predicted_rating` | Same — now dynamically updates with live data |
| **Open Gaps** count | `compliance_gaps` count where status=OPEN | Same + auto-generated gaps from Consentz sync |
| **Overdue Tasks** count | `tasks` where status!=DONE and due_date < now | Same + auto-generated tasks from sync |
| **Domain cards** (Safe 14%, etc.) | `compliance_scores.{domain}_score` | Now blended score from assessment + Consentz |
| **Priority Gaps** list | `compliance_gaps` ordered by severity | Enriched with Consentz-detected gaps |
| **Recent Activity** | `activity_logs` | Include sync activities |
| **"Last updated"** timestamp | Currently static | `compliance_scores.consentz_data_freshness` |

### Dashboard API route update

Modify `app/api/dashboard/route.ts` (or create if it doesn't exist) to pull from the updated compliance_scores plus latest consentz_snapshots:

```typescript
// GET /api/dashboard
// Returns the full dashboard payload including Consentz-enriched scores

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  // ... auth check, get org_id ...

  const [scores, gaps, tasks, activity, lastSync] = await Promise.all([
    supabase.from('compliance_scores').select('*').eq('organization_id', orgId).single(),
    supabase.from('compliance_gaps').select('*').eq('organization_id', orgId).eq('status', 'OPEN').order('severity'),
    supabase.from('tasks').select('*').eq('organization_id', orgId).neq('status', 'DONE'),
    supabase.from('activity_logs').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(10),
    supabase.from('consentz_sync_logs').select('*').eq('organization_id', orgId).eq('status', 'COMPLETED').order('completed_at', { ascending: false }).limit(1),
  ]);

  return NextResponse.json({
    overallScore: scores.data?.overall_score || 0,
    predictedRating: scores.data?.predicted_rating || 'INADEQUATE',
    previousScore: scores.data?.previous_score,
    domains: {
      safe: { score: scores.data?.safe_score || 0, rating: scoreToRating(scores.data?.safe_score || 0) },
      effective: { score: scores.data?.effective_score || 0, rating: scoreToRating(scores.data?.effective_score || 0) },
      caring: { score: scores.data?.caring_score || 0, rating: scoreToRating(scores.data?.caring_score || 0) },
      responsive: { score: scores.data?.responsive_score || 0, rating: scoreToRating(scores.data?.responsive_score || 0) },
      well_led: { score: scores.data?.well_led_score || 0, rating: scoreToRating(scores.data?.well_led_score || 0) },
    },
    openGaps: gaps.data?.length || 0,
    priorityGaps: gaps.data?.slice(0, 5) || [],
    overdueTasks: tasks.data?.filter((t: any) => t.due_date && new Date(t.due_date) < new Date()).length || 0,
    activeTasks: tasks.data?.length || 0,
    recentActivity: activity.data || [],
    lastSyncAt: lastSync.data?.[0]?.completed_at || scores.data?.consentz_data_freshness || null,
  });
}
```

---

## 8. SDK — OUTBOUND COMPLIANCE API {#8-sdk}

The SDK allows external systems to query this organization's compliance status. API key auth is already built (generation works in Settings → Integrations).

### Create: `app/api/sdk/v1/status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 });

  // Hash the key and look it up
  const keyHash = createHash('sha256').update(apiKey).digest('hex');
  const { data: keyRecord } = await supabase
    .from('api_keys')
    .select('organization_id')
    .eq('key_hash', keyHash)
    .single();

  if (!keyRecord) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

  // Update last_used
  await supabase.from('api_keys').update({ last_used: new Date().toISOString() }).eq('key_hash', keyHash);

  // Fetch compliance status
  const { data: scores } = await supabase
    .from('compliance_scores')
    .select('*')
    .eq('organization_id', keyRecord.organization_id)
    .single();

  const { data: org } = await supabase
    .from('organizations')
    .select('name, service_type, cqc_registration_number')
    .eq('id', keyRecord.organization_id)
    .single();

  return NextResponse.json({
    organization: org?.name,
    serviceType: org?.service_type,
    cqcRegistrationNumber: org?.cqc_registration_number,
    compliance: {
      overallScore: scores?.overall_score || 0,
      predictedRating: scores?.predicted_rating || 'INADEQUATE',
      domains: {
        safe: scores?.safe_score || 0,
        effective: scores?.effective_score || 0,
        caring: scores?.caring_score || 0,
        responsive: scores?.responsive_score || 0,
        wellLed: scores?.well_led_score || 0,
      },
      lastUpdated: scores?.calculated_at,
      dataFreshness: scores?.consentz_data_freshness,
    },
  });
}
```

Also create endpoints for:
- `GET /api/sdk/v1/gaps` — returns open gaps
- `GET /api/sdk/v1/domains/:domain` — returns detailed domain status
- `GET /api/sdk/v1/evidence` — returns evidence summary

All use the same API key authentication pattern.

---

## 9. CONSENTZ CALENDAR & CHAT INTEGRATION {#9-calendar-chat}

Per Tobe's request: integrate with Consentz's native Calendar and Chat features. Jasmine to provide the API endpoints.

### Calendar Integration

Create: `app/api/consentz/calendar/route.ts`

The calendar should sync compliance deadlines (evidence expiry, training expiry, audit dates, task due dates) INTO the Consentz calendar so clinic staff see compliance reminders alongside their normal appointments.

```typescript
// When a compliance task is created or updated with a due date,
// push a calendar event to the Consentz calendar API.
// 
// ⚠️ BLOCKED: Awaiting calendar API endpoint from Jasmine.
// Placeholder structure:

export async function POST(req: NextRequest) {
  // 1. Auth check
  // 2. Get task/event details from request body
  // 3. Call Consentz calendar API to create event:
  //    POST /clinic/:clinicId/calendar/events
  //    Body: { title, date, time, description, type: 'compliance' }
  // 4. Store the Consentz calendar event ID in our task record
  
  return NextResponse.json({ message: 'Awaiting Consentz Calendar API from Jasmine' });
}
```

### Chat Integration

Consentz has a built-in chat. Push compliance notifications (critical gap found, overdue task, expiring evidence) as messages in the Consentz chat.

```typescript
// ⚠️ BLOCKED: Awaiting chat API endpoint from Jasmine.
// When a critical compliance event occurs, push a message:
//   POST /clinic/:clinicId/chat/messages
//   Body: { message, type: 'compliance_alert', priority: 'high' }
```

**For now:** Build the notification dispatcher that determines WHAT to send. When the Consentz Calendar/Chat endpoints arrive from Jasmine, plug them into the dispatcher.

---

## 10. POLICY DOCUMENT GENERATION {#10-policy-generation}

Per Tobe's directive: **Policies must be plain format. No logos. Arial font, size 11. As generic as possible.**

### AI Policy Generation with Claude

Update the existing policy generation feature to use this format:

Create/Update: `lib/ai/policy-generator.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface PolicyGenerationInput {
  policyType: string;      // e.g., "Infection Prevention and Control"
  serviceType: 'AESTHETIC_CLINIC' | 'CARE_HOME';
  organizationName: string;
  additionalContext?: string;
}

export async function generatePolicy(input: PolicyGenerationInput): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `Generate a CQC-compliant ${input.policyType} policy for a ${
          input.serviceType === 'AESTHETIC_CLINIC' ? 'aesthetic clinic' : 'care home'
        } called "${input.organizationName}".

FORMATTING REQUIREMENTS (STRICT):
- Plain text only. No logos, no headers with images, no branding.
- Font: Arial, size 11 (the rendering system will apply this — just output clean text).
- Use simple section headings in bold (e.g., "1. Purpose", "2. Scope").
- Number all sections sequentially.
- Keep language professional but plain and accessible.
- Do NOT include any placeholder logos or company branding sections.
- Include these standard sections: Purpose, Scope, Definitions, Responsibilities, Procedures, Monitoring & Review, Related Policies, Version Control.

CQC COMPLIANCE REQUIREMENTS:
- Reference the specific CQC Regulations this policy addresses.
- Include reference to relevant KLOEs (Key Lines of Enquiry).
- Ensure the policy meets the evidence requirements for CQC inspection.
- For ${input.serviceType === 'CARE_HOME' ? 'care homes: reference relevant NICE guidelines, Mental Capacity Act where applicable, and duty of candour requirements.' : 'aesthetic clinics: reference relevant clinical standards, consent requirements, cooling-off periods, and practitioner qualification requirements.'}

${input.additionalContext ? `Additional context: ${input.additionalContext}` : ''}

Output the full policy document text only. No markdown code blocks.`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return text;
}
```

### Policy Export (PDF/DOCX)

When exporting policies, apply Arial 11 formatting:

```typescript
// Use a library like jsPDF or docx to export
// Apply: font-family: Arial, font-size: 11pt, margins: 2.5cm
// No logo, no header image — just the policy title and content
```

---

## 11. NEW USER SETUP GUIDE / ONBOARDING WALKTHROUGH {#11-onboarding-walkthrough}

**[IMPORTANT — Per Tobe]** Build a first-time user guide that walks new users through the product.

### New Table

```sql
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
```

### Onboarding Steps

Define 8 steps that guide the user through setup:

```typescript
export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to CQC Compliance',
    description: 'Your journey to CQC compliance starts here. This tool monitors your clinic or care home against all 5 CQC domains.',
    action: 'next', // Just informational
  },
  {
    id: 'link_consentz',
    title: 'Link Your Consentz Account',
    description: 'Connect your Consentz clinic to enable ongoing compliance monitoring. Go to Settings → Integrations.',
    action: 'navigate',
    target: '/settings/integrations',
    completionCheck: 'org.consentz_clinic_id !== null',
  },
  {
    id: 'take_assessment',
    title: 'Complete Your Initial Assessment',
    description: 'Answer questions about your current compliance status. This creates your baseline score.',
    action: 'navigate',
    target: '/assessment',
    completionCheck: 'assessment.status === COMPLETED',
  },
  {
    id: 'add_staff',
    title: 'Add Your Staff Members',
    description: 'Add your team so we can track their qualifications, DBS checks, and training.',
    action: 'navigate',
    target: '/staff',
    completionCheck: 'staff_members.count >= 1',
  },
  {
    id: 'upload_evidence',
    title: 'Upload Key Evidence',
    description: 'Start uploading policies, certificates, and other evidence. Even one document gets you started.',
    action: 'navigate',
    target: '/evidence',
    completionCheck: 'evidence.count >= 1',
  },
  {
    id: 'review_gaps',
    title: 'Review Your Compliance Gaps',
    description: 'Check your priority gaps and start addressing the critical ones first.',
    action: 'navigate',
    target: '/dashboard',
    completionCheck: 'viewed', // Just needs to visit the page
  },
  {
    id: 'create_policy',
    title: 'Create or Generate a Policy',
    description: 'Use AI to generate a CQC-compliant policy, or upload one you already have.',
    action: 'navigate',
    target: '/policies',
    completionCheck: 'policies.count >= 1',
  },
  {
    id: 'setup_complete',
    title: 'You\'re All Set!',
    description: 'Your compliance dashboard is now active. We\'ll sync with Consentz automatically and keep your scores updated.',
    action: 'complete',
  },
];
```

### UI Component

Build a **slide-out panel or modal** that appears on the dashboard for new users. Should include:
- Step counter (e.g., "Step 3 of 8")
- Progress bar
- Current step title + description
- "Go There" button (navigates to relevant page)
- "Skip" button
- "Dismiss" option (can re-access from help menu)
- Checkmarks for completed steps

### API Route

Create: `app/api/onboarding/route.ts` — GET (fetch progress), PATCH (update step completion)

---

## 12. AI CHAT HELP (KNOWLEDGE BASE CHATBOT) {#12-ai-chat}

**[IMPORTANT — Per Tobe]** Build an AI-powered chat assistant that users can ask questions about CQC compliance and the product.

### New Table

```sql
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_org_user ON chat_messages(organization_id, user_id);
```

### Chat API Route

Create: `app/api/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYSTEM_PROMPT = `You are the CQC Compliance Assistant for the Consentz CQC Compliance Module. You help aesthetic clinic and care home managers understand and achieve CQC compliance.

YOUR KNOWLEDGE BASE:
- CQC's 5 domains: Safe, Effective, Caring, Responsive, Well-Led
- All Key Lines of Enquiry (KLOEs): S1-S6, E1-E7, C1-C3, R1-R3, W1-W6
- The 14 Fundamental Standards (Regulations 9-20A)
- CQC inspection process and rating methodology (Outstanding, Good, Requires Improvement, Inadequate)
- Evidence requirements for each KLOE
- Policy requirements for aesthetic clinics and care homes
- Differences between aesthetic clinic and care home compliance requirements
- The Health and Social Care Act 2008 (Regulated Activities) Regulations 2014

YOUR ROLE:
- Answer questions about CQC compliance requirements
- Explain what specific KLOEs mean and what evidence is needed
- Help users understand their compliance gaps and how to fix them
- Guide users on how to use features in this tool (assessment, evidence upload, policy generation, etc.)
- Provide practical, actionable advice
- Be friendly and supportive — many users find CQC compliance overwhelming

IMPORTANT RULES:
- Always clarify whether advice applies to aesthetic clinics, care homes, or both
- Never provide legal advice — recommend consulting a legal professional for legal questions
- If asked about something outside CQC compliance, politely redirect
- Be concise but thorough
- Use plain language, avoid jargon where possible`;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message } = await req.json();
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  // Get user's org and service type for context
  const { data: user } = await supabase
    .from('users')
    .select('organization_id')
    .eq('clerk_id', userId)
    .single();

  const { data: org } = await supabase
    .from('organizations')
    .select('name, service_type')
    .eq('id', user?.organization_id)
    .single();

  // Get recent chat history for context (last 10 messages)
  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('organization_id', user?.organization_id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const messages = [
    ...(history || []).reverse().map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ];

  // Call Claude
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: `${SYSTEM_PROMPT}\n\nCONTEXT: This user is from "${org?.name}" which is a ${org?.service_type === 'CARE_HOME' ? 'care home' : 'aesthetic clinic'}.`,
    messages,
  });

  const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

  // Store both messages
  await supabase.from('chat_messages').insert([
    { organization_id: user?.organization_id, user_id: userId, role: 'user', content: message },
    { organization_id: user?.organization_id, user_id: userId, role: 'assistant', content: assistantMessage },
  ]);

  return NextResponse.json({ message: assistantMessage });
}
```

### Chat UI Component

Build a floating chat widget (bottom-right corner of the dashboard):
- Chat bubble icon that opens a panel
- Message history with user/assistant styling
- Text input with send button
- "Powered by AI" disclaimer
- Clear chat option

---

## 13. STRIPE BILLING INTEGRATION {#13-stripe-billing}

Per Tobe: pricing is **£200 per month**. Build it as a simple single-tier subscription for now. The infrastructure should support adding tiers later.

### New Tables

```sql
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  price_amount INTEGER NOT NULL,  -- in pence (20000 = £200)
  price_currency TEXT DEFAULT 'gbp',
  interval TEXT DEFAULT 'month',
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
```

### Seed the Plan

```sql
INSERT INTO subscription_plans (name, stripe_price_id, price_amount, price_currency, interval, features)
VALUES (
  'CQC Compliance Pro',
  'price_REPLACE_WITH_ACTUAL_STRIPE_PRICE_ID',
  20000,
  'gbp',
  'month',
  '["Full CQC compliance dashboard", "All 5 domain tracking", "Consentz integration", "AI policy generation", "AI compliance chatbot", "Ongoing compliance monitoring", "Evidence management", "Staff credential tracking", "Incident management", "Task management", "Audit reports", "SDK access", "Email notifications", "Priority support"]'
);
```

### Create: `app/api/billing/checkout/route.ts`

```typescript
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get or create Stripe customer
  // Create Checkout Session with the £200/month plan
  // Return checkout URL

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: 'price_REPLACE_WITH_ACTUAL_STRIPE_PRICE_ID', // Set up in Stripe Dashboard
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
    metadata: {
      userId,
      // organizationId from user lookup
    },
  });

  return NextResponse.json({ url: session.url });
}
```

### Create: `app/api/billing/webhook/route.ts`

Handle Stripe webhook events:
- `checkout.session.completed` — activate subscription
- `invoice.payment_succeeded` — update current_period
- `invoice.payment_failed` — mark as PAST_DUE
- `customer.subscription.deleted` — mark as CANCELED

---

## 14. RESEND EMAIL INTEGRATION {#14-resend-email}

Resend is already configured (domain verified: mail@consentz.com). API key is in the Slack chat.

### Create: `lib/email/resend.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'mail@consentz.com';

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to CQC Compliance by Consentz',
    html: `<p>Hi ${name},</p><p>Welcome to the CQC Compliance Module. Your account is ready.</p><p>Start by completing your initial assessment to get your baseline compliance score.</p><p>Best,<br/>The Consentz Team</p>`,
  });
}

export async function sendComplianceAlert(to: string, alertTitle: string, alertBody: string) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `CQC Compliance Alert: ${alertTitle}`,
    html: `<p>${alertBody}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View Dashboard</a></p>`,
  });
}

export async function sendExpiryReminder(to: string, itemType: string, itemName: string, expiryDate: string) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Expiry Reminder: ${itemName}`,
    html: `<p>Your ${itemType} "${itemName}" expires on ${expiryDate}. Please renew it to maintain compliance.</p>`,
  });
}
```

Trigger emails from:
- Clerk webhook (user signup) → welcome email
- Sync job (critical findings) → compliance alert
- Cron job (daily check for expiring items) → expiry reminders

---

## 15. TESTING & VALIDATION CHECKLIST {#15-testing}

After implementing everything, verify each item:

### Consentz API Connection
- [ ] Login endpoint returns 200 and a session token
- [ ] All 8 CQC report endpoints return 200 with data for clinicId=3
- [ ] Token refresh works (invalidate token, make request, auto-refreshes)
- [ ] Error handling: graceful failure when endpoint is down

### Ongoing Compliance Engine
- [ ] After sync, compliance_scores table is updated with new scores
- [ ] Domain scores change based on Consentz data (not just assessment)
- [ ] "Last updated" timestamp on dashboard reflects last sync time
- [ ] Manual sync button triggers recalculation
- [ ] Predicted rating changes appropriately with score changes

### Cron Sync
- [ ] Vercel Cron hits /api/cron/sync-consentz successfully
- [ ] consentz_sync_logs shows COMPLETED entries
- [ ] consentz_snapshots stores raw response data
- [ ] Auto-created tasks appear after sync

### SDK
- [ ] Generate API key in Settings → Integrations
- [ ] GET /api/sdk/v1/status with API key returns compliance data
- [ ] Invalid API key returns 401

### New Features
- [ ] AI Chat: Send message, get CQC-relevant response, history persists
- [ ] Onboarding walkthrough: Appears for new users, steps track completion
- [ ] Policy generation: AI generates plain-format policy (Arial 11, no logos)
- [ ] Stripe: Checkout flow works, webhook updates subscription status
- [ ] Resend: Welcome email sends on signup

---

## 16. ARCHITECTURE NOTES — HIPAA CLONING READINESS {#16-architecture-notes}

Tobe wants this architecture documented for cloning to HIPAA and other regulations. Key design decisions that enable this:

1. **Regulatory framework is data-driven** — KLOEs, regulations, questions are in constants files, not hardcoded in components. To add HIPAA: create new constants for HIPAA rules, map them to the same domain structure.

2. **Service type branching** — The same pattern (Aesthetic Clinic vs Care Home) can become (Hospital vs Med Spa vs Nursing Home) for US.

3. **Assessment engine is configurable** — Questions are defined in a data file with domain/KLOE mapping. New regulation = new question set.

4. **Consentz adapter pattern** — The `ConsentzClient` class is a specific implementation. For HIPAA, create an `EpicClient` or `CernerClient` with the same interface. The sync engine doesn't care where data comes from.

5. **Score engine is regulation-agnostic** — It takes domain scores and weights. HIPAA domains (Privacy, Security, Breach Notification) just need different weights.

Document these patterns in a `docs/ARCHITECTURE.md` file for the team.

---

## EXECUTION ORDER

1. **Run Step 0** — Validate all staging endpoints, capture response shapes
2. **Update types.ts** — Replace `unknown` types with actual response interfaces
3. **Build ConsentzClient + endpoints** — Get the API integration service working
4. **Build domain-mapper + score engine** — Wire up the ongoing compliance calculations
5. **Build sync cron** — Automated polling + score recalculation
6. **Wire dashboard** — Update dashboard API to use blended scores
7. **Build SDK endpoints** — Outbound compliance API
8. **Build AI Chat** — Knowledge base chatbot
9. **Build Onboarding Walkthrough** — New user setup guide
10. **Update Policy Generation** — Plain format, Arial 11
11. **Build Stripe Billing** — £200/month subscription
12. **Build Resend Email** — Welcome, alerts, reminders
13. **Add Calendar/Chat placeholders** — Ready for Jasmine's endpoints
14. **Test everything** — Run through the checklist
15. **Write ARCHITECTURE.md** — For HIPAA cloning

---

*End of Cursor System Prompt*
