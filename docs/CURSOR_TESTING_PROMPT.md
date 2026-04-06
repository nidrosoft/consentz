# CQC COMPLIANCE MODULE — COMPLETE TEST SUITE

## OVERVIEW

This document is a system prompt for Cursor to generate Playwright E2E tests and API integration tests for the entire CQC Compliance Module. It covers every API endpoint, every UI flow, and every user journey. The tests should simulate real users interacting with the platform from start to finish.

**Test stack:** Playwright (E2E + API), Vitest (unit tests), MSW (API mocking for Consentz)

**Test principle:** Every test should verify that the correct data appears in the UI AND is correctly persisted in the database.

---

## SECTION 1: API ENDPOINT TESTS

Test every API endpoint directly before testing UI flows. Use Playwright's `request` context for API testing.

### Setup: Test fixtures and helpers

```typescript
// tests/fixtures.ts
import { test as base } from '@playwright/test';

// Test organization data
export const TEST_ORG = {
  name: 'Beautify Clinic Test',
  serviceType: 'AESTHETIC_CLINIC',
  consentzClinicId: 3,
};

export const TEST_CARE_HOME = {
  name: 'Sunrise Care Home Test',
  serviceType: 'CARE_HOME',
  consentzClinicId: 7,
};

// Test user
export const TEST_USER = {
  email: 'test@beautifyclinic.com',
  password: 'TestPass123!',
  role: 'COMPLIANCE_MANAGER',
  fullName: 'Test Compliance Manager',
};

// Helper: authenticated API request
export async function apiRequest(request, method, path, body?) {
  const token = await getAuthToken(request);
  return request[method.toLowerCase()](`/api${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: body,
  });
}

// Helper: get org ID for test org
export async function getTestOrgId(request) { /* ... */ }
```

### 1.1 Authentication & Organization API Tests

```typescript
// tests/api/auth.spec.ts
test.describe('Authentication & Organization', () => {

  test('POST /api/auth/consentz-login — authenticates with Consentz and stores session', async ({ request }) => {
    const res = await request.post('/api/auth/consentz-login', {
      data: {
        username: 'testuser@consentz.com',
        password: 'testpass',
        applicationId: 'laptop',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.sessionToken).toBeTruthy();
    expect(body.user.clinic.id).toBeGreaterThan(0);
  });

  test('GET /api/organizations/[orgId] — returns organization details', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'GET', `/organizations/${orgId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBeTruthy();
    expect(body.serviceType).toMatch(/AESTHETIC_CLINIC|CARE_HOME/);
    expect(body.consentzClinicId).toBeGreaterThan(0);
  });

  test('GET /api/organizations/[orgId]/members — returns team members', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'GET', `/organizations/${orgId}/members`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('role');
    expect(body[0]).toHaveProperty('fullName');
  });
});
```

### 1.2 Dashboard API Tests

```typescript
// tests/api/dashboard.spec.ts
test.describe('Dashboard API', () => {

  test('GET /api/dashboard/[orgId] — returns full dashboard data', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'GET', `/dashboard/${orgId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    // Overall compliance data
    expect(body.overallScore).toBeGreaterThanOrEqual(0);
    expect(body.overallScore).toBeLessThanOrEqual(100);
    expect(body.predictedRating).toMatch(/Outstanding|Good|Requires Improvement|Inadequate/);

    // Domain scores
    expect(body.domains).toHaveLength(5);
    for (const domain of body.domains) {
      expect(domain).toHaveProperty('code');
      expect(domain).toHaveProperty('name');
      expect(domain).toHaveProperty('score');
      expect(domain).toHaveProperty('rating');
      expect(domain).toHaveProperty('icon');
      expect(domain).toHaveProperty('color');
      expect(domain.score).toBeGreaterThanOrEqual(0);
      expect(domain.score).toBeLessThanOrEqual(100);
    }

    // Verify all 5 domains present
    const codes = body.domains.map(d => d.code);
    expect(codes).toContain('safe');
    expect(codes).toContain('effective');
    expect(codes).toContain('caring');
    expect(codes).toContain('responsive');
    expect(codes).toContain('well_led');

    // Priority gaps
    expect(body.priorityGaps).toBeDefined();
    expect(Array.isArray(body.priorityGaps)).toBe(true);

    // Each gap should have domain badges
    for (const gap of body.priorityGaps) {
      expect(gap).toHaveProperty('domain');
      expect(gap).toHaveProperty('severity');
    }
  });

  test('Dashboard score calculation — rating thresholds are correct', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'GET', `/dashboard/${orgId}`);
    const body = await res.json();
    const score = body.overallScore;

    if (score >= 88) expect(body.predictedRating).toBe('Outstanding');
    else if (score >= 63) expect(body.predictedRating).toBe('Good');
    else if (score >= 39) expect(body.predictedRating).toBe('Requires Improvement');
    else expect(body.predictedRating).toBe('Inadequate');
  });
});
```

### 1.3 Domain & KLOE API Tests

```typescript
// tests/api/domains.spec.ts
test.describe('Domains & KLOEs', () => {

  test('GET /api/domains/[orgId]/safe — returns Safe domain with KLOEs', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'GET', `/domains/${orgId}/safe`);
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.domain.code).toBe('safe');
    expect(body.domain.name).toBe('Safe');
    expect(body.kloes.length).toBe(6); // S1-S6
    
    for (const kloe of body.kloes) {
      expect(kloe.code).toMatch(/^S[1-6]$/);
      expect(kloe).toHaveProperty('question');
      expect(kloe).toHaveProperty('evidenceCount');
      expect(kloe).toHaveProperty('gapCount');
      expect(kloe).toHaveProperty('status'); // green, amber, red
    }
  });

  // Repeat for all 5 domains
  const domainTests = [
    { code: 'effective', kloeCount: 7, pattern: /^E[1-7]$/ },
    { code: 'caring', kloeCount: 3, pattern: /^C[1-3]$/ },
    { code: 'responsive', kloeCount: 3, pattern: /^R[1-3]$/ },
    { code: 'well_led', kloeCount: 6, pattern: /^W[1-6]$/ },
  ];

  for (const dt of domainTests) {
    test(`GET /api/domains/[orgId]/${dt.code} — returns correct KLOEs`, async ({ request }) => {
      const orgId = await getTestOrgId(request);
      const res = await apiRequest(request, 'GET', `/domains/${orgId}/${dt.code}`);
      const body = await res.json();
      expect(body.kloes.length).toBe(dt.kloeCount);
      for (const kloe of body.kloes) {
        expect(kloe.code).toMatch(dt.pattern);
      }
    });
  }

  test('SERVICE TYPE FILTER — Aesthetic clinic does NOT see care home KLOEs', async ({ request }) => {
    const orgId = await getTestOrgId(request); // Aesthetic clinic
    const res = await apiRequest(request, 'GET', `/domains/${orgId}/responsive`);
    const body = await res.json();
    const r3 = body.kloes.find(k => k.code === 'R3');
    // R3 for clinics should be "Timely access to care", NOT "End of life"
    expect(r3.question).not.toContain('end of life');
    expect(r3.question).not.toContain('End of Life');
    expect(r3.question.toLowerCase()).toContain('timely');
  });
});
```

### 1.4 Evidence API Tests

```typescript
// tests/api/evidence.spec.ts
test.describe('Evidence Library', () => {

  test('POST /api/evidence/[orgId] — upload new evidence', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'POST', `/evidence/${orgId}`, {
      title: 'Infection Control Audit Q1 2026',
      category: 'AUDIT_REPORT',
      domains: ['safe'],
      kloeCode: 'S5',
      status: 'VALID',
      expiryDate: '2026-12-31',
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();
    expect(body.title).toBe('Infection Control Audit Q1 2026');
    expect(body.domains).toContain('safe');
  });

  test('GET /api/evidence/[orgId] — list all evidence with filters', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    
    // Filter by domain
    const res = await apiRequest(request, 'GET', `/evidence/${orgId}?domain=safe`);
    const body = await res.json();
    for (const item of body) {
      expect(item.domains).toContain('safe');
    }
  });

  test('Evidence can belong to multiple domains', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'POST', `/evidence/${orgId}`, {
      title: 'Incident Analysis Report',
      category: 'INCIDENT_LOG',
      domains: ['safe', 'well_led'],  // maps to both
      kloeCode: 'S6',
      status: 'VALID',
    });
    const body = await res.json();
    expect(body.domains).toContain('safe');
    expect(body.domains).toContain('well_led');
  });

  test('Evidence expiry triggers status change', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    // Create evidence expiring yesterday
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const res = await apiRequest(request, 'POST', `/evidence/${orgId}`, {
      title: 'Expired DBS Check',
      category: 'CERTIFICATE',
      domains: ['safe'],
      expiryDate: yesterday,
    });
    const body = await res.json();
    expect(body.status).toBe('EXPIRED');
  });
});
```

### 1.5 Incidents API Tests

```typescript
// tests/api/incidents.spec.ts
test.describe('Incidents', () => {

  test('POST /api/incidents/[orgId] — create a premises incident', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'POST', `/incidents/${orgId}`, {
      incidentType: 'PREMISES_INCIDENT',
      title: 'Slip hazard in treatment room 2',
      description: 'Water leak near patient chair',
      severity: 'MEDIUM',
      domains: ['safe'],
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.incidentType).toBe('PREMISES_INCIDENT');
    expect(body.status).toBe('OPEN');
  });

  test('POST /api/incidents/[orgId] — create a patient complication', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'POST', `/incidents/${orgId}`, {
      incidentType: 'COMPLICATION',
      title: 'Adverse reaction to dermal filler',
      description: 'Patient experienced swelling beyond expected parameters',
      severity: 'HIGH',
      patientName: 'Jane Doe',
      patientId: 142689,
      domains: ['safe', 'effective'],
    });
    const body = await res.json();
    expect(body.incidentType).toBe('COMPLICATION');
    expect(body.patientName).toBe('Jane Doe');
  });

  test('PUT /api/incidents/[orgId]/[id] — resolve an incident with root cause', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    // Create then resolve
    const create = await apiRequest(request, 'POST', `/incidents/${orgId}`, {
      incidentType: 'INFECTION',
      title: 'Test incident',
      description: 'Test',
      severity: 'LOW',
      domains: ['safe'],
    });
    const incident = await create.json();

    const resolve = await apiRequest(request, 'PUT', `/incidents/${orgId}/${incident.id}`, {
      status: 'CLOSED',
      rootCause: 'Equipment not sterilized properly',
      actionsTaken: 'Updated sterilization SOP and retrained staff',
      lessonsLearned: 'Added double-check step to sterilization workflow',
    });
    const resolved = await resolve.json();
    expect(resolved.status).toBe('CLOSED');
    expect(resolved.rootCause).toBeTruthy();
    expect(resolved.resolvedAt).toBeTruthy();
  });
});
```

### 1.6 Tasks API Tests

```typescript
// tests/api/tasks.spec.ts
test.describe('Tasks', () => {

  test('POST /api/tasks/[orgId] — create task with domain badges', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'POST', `/tasks/${orgId}`, {
      title: 'Update infection control policy',
      description: 'Annual review required',
      priority: 'HIGH',
      domains: ['safe', 'well_led'],
      kloeCode: 'S5',
      dueDate: '2026-04-01',
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.domains).toContain('safe');
    expect(body.domains).toContain('well_led');
    expect(body.status).toBe('TODO');
  });

  test('Task status transitions: TODO → IN_PROGRESS → REVIEW → COMPLETED', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const create = await apiRequest(request, 'POST', `/tasks/${orgId}`, {
      title: 'Test task flow',
      priority: 'MEDIUM',
      domains: ['safe'],
    });
    const task = await create.json();

    // Move through each status
    for (const newStatus of ['IN_PROGRESS', 'REVIEW', 'COMPLETED']) {
      const update = await apiRequest(request, 'PUT', `/tasks/${orgId}/${task.id}`, {
        status: newStatus,
      });
      const updated = await update.json();
      expect(updated.status).toBe(newStatus);
    }

    // Completed task should have completedAt
    const final = await apiRequest(request, 'GET', `/tasks/${orgId}/${task.id}`);
    const finalBody = await final.json();
    expect(finalBody.completedAt).toBeTruthy();
  });
});
```

### 1.7 Assessment Engine API Tests

```typescript
// tests/api/assessments.spec.ts
test.describe('Assessment Engine', () => {

  test('POST /api/assessments/[orgId] — start new assessment for aesthetic clinic', async ({ request }) => {
    const orgId = await getTestOrgId(request); // aesthetic clinic
    const res = await apiRequest(request, 'POST', `/assessments/${orgId}`, {
      serviceType: 'AESTHETIC_CLINIC',
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('IN_PROGRESS');
    expect(body.serviceType).toBe('AESTHETIC_CLINIC');
  });

  test('GET /api/assessments/[orgId]/[id] — returns questions grouped by domain', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const create = await apiRequest(request, 'POST', `/assessments/${orgId}`, {
      serviceType: 'AESTHETIC_CLINIC',
    });
    const assessment = await create.json();

    const detail = await apiRequest(request, 'GET', `/assessments/${orgId}/${assessment.id}`);
    const body = await detail.json();

    // Should have questions for all 5 domains
    expect(body.questions).toBeDefined();
    const domainGroups = new Set(body.questions.map(q => q.domainCode));
    expect(domainGroups.size).toBe(5);

    // No care home specific questions should appear
    for (const q of body.questions) {
      expect(q.question.toLowerCase()).not.toContain('falls risk');
      expect(q.question.toLowerCase()).not.toContain('must screening');
      expect(q.question.toLowerCase()).not.toContain('end of life');
      expect(q.question.toLowerCase()).not.toContain('meal plan');
    }
  });

  test('POST /api/assessments/[orgId]/[id]/respond — submit answers and get score', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const create = await apiRequest(request, 'POST', `/assessments/${orgId}`, {
      serviceType: 'AESTHETIC_CLINIC',
    });
    const assessment = await create.json();

    // Get questions
    const detail = await apiRequest(request, 'GET', `/assessments/${orgId}/${assessment.id}`);
    const { questions } = await detail.json();

    // Answer all questions with "yes"
    for (const q of questions) {
      await apiRequest(request, 'POST', `/assessments/${orgId}/${assessment.id}/respond`, {
        questionId: q.id,
        answer: 'yes',
      });
    }

    // Check final score
    const final = await apiRequest(request, 'GET', `/assessments/${orgId}/${assessment.id}`);
    const result = await final.json();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.status).toBe('COMPLETED');
  });

  test('Assessment "No" answers auto-generate remediation tasks', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const create = await apiRequest(request, 'POST', `/assessments/${orgId}`, {
      serviceType: 'AESTHETIC_CLINIC',
    });
    const assessment = await create.json();

    const detail = await apiRequest(request, 'GET', `/assessments/${orgId}/${assessment.id}`);
    const { questions } = await detail.json();

    // Answer first question with "no"
    await apiRequest(request, 'POST', `/assessments/${orgId}/${assessment.id}/respond`, {
      questionId: questions[0].id,
      answer: 'no',
    });

    // Check that a task was auto-created
    const tasks = await apiRequest(request, 'GET', `/tasks/${orgId}?source=ASSESSMENT`);
    const taskList = await tasks.json();
    expect(taskList.length).toBeGreaterThan(0);
    expect(taskList[0].source).toBe('ASSESSMENT');
  });
});
```

### 1.8 Policies API Tests

```typescript
// tests/api/policies.spec.ts
test.describe('Policies', () => {

  test('POST /api/policies/[orgId] — create new policy', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'POST', `/policies/${orgId}`, {
      title: 'Infection Prevention and Control Policy',
      status: 'DRAFT',
      domains: ['safe'],
      nextReviewDate: '2027-03-01',
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.version).toBe('1.0');
    expect(body.status).toBe('DRAFT');
  });

  test('POST /api/policies/[orgId]/[id]/acknowledge — staff acknowledges policy', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    // Create policy
    const create = await apiRequest(request, 'POST', `/policies/${orgId}`, {
      title: 'Test Policy',
      status: 'ACTIVE',
      domains: ['well_led'],
    });
    const policy = await create.json();

    // Acknowledge
    const ack = await apiRequest(request, 'POST', `/policies/${orgId}/${policy.id}/acknowledge`, {
      userId: 'test-user-1',
      userName: 'Dr. Sarah Smith',
    });
    expect(ack.status()).toBe(200);
  });

  test('POST /api/ai/[orgId]/generate-policy — AI generates policy draft', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'POST', `/ai/${orgId}/generate-policy`, {
      policyType: 'infection_control',
      serviceType: 'AESTHETIC_CLINIC',
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.content).toBeTruthy();
    expect(body.content.length).toBeGreaterThan(500);
    // Should reference CQC regulations
    expect(body.content.toLowerCase()).toContain('regulation');
  });
});
```

### 1.9 Consentz CQC Report Integration Tests

```typescript
// tests/api/consentz-integration.spec.ts
// These test against the actual Consentz staging API (or mocked responses)

test.describe('Consentz CQC Report APIs', () => {

  test('Consent Completion API returns valid data', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'GET',
      `/consentz/${orgId}/consent-completion?startDate=2026-01-01&endDate=2026-01-31`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.summary).toHaveProperty('totalAppointments');
    expect(body.summary).toHaveProperty('completionRate');
    expect(body.chart).toHaveProperty('counts');
  });

  test('Consent Decay API returns patient-level data', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'GET',
      `/consentz/${orgId}/consent-decay?startDate=2026-01-01&endDate=2026-03-01`);
    const body = await res.json();
    expect(body.status).toBe('success');
    if (body.data.length > 0) {
      expect(body.data[0]).toHaveProperty('patientName');
      expect(body.data[0]).toHaveProperty('daysRemaining');
      expect(body.data[0]).toHaveProperty('treatment');
      expect(body.data[0]).toHaveProperty('consentFormType');
    }
  });

  test('Staff Competency Clock API returns certificate buckets', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'GET', `/consentz/${orgId}/staff-competency`);
    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body).toHaveProperty('all');
    expect(body).toHaveProperty('overdue');
    expect(body).toHaveProperty('expiring30');
    expect(body).toHaveProperty('expiring60');
    expect(body).toHaveProperty('expiring90');
    expect(body.summary).toHaveProperty('totalCerts');
  });

  test('Incident Feed API returns filterable incidents', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'GET', `/consentz/${orgId}/incidents`);
    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body).toHaveProperty('incidents');
    expect(body).toHaveProperty('summary');
    expect(body.summary).toHaveProperty('total');
    expect(body.summary).toHaveProperty('resolved');
    expect(body.summary).toHaveProperty('unresolved');
  });

  test('Safety Checklist API returns drill and kit status', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'GET', `/consentz/${orgId}/safety-checklist`);
    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body).toHaveProperty('fireDrills');
    expect(body).toHaveProperty('emergencyKits');
    expect(body.summary).toHaveProperty('fireDrillCount');
  });

  test('Patient Feedback API returns satisfaction data', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'GET',
      `/consentz/${orgId}/patient-feedback?from=2026-01-01&to=2026-03-01`);
    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body).toHaveProperty('distribution');
    expect(body).toHaveProperty('rollingAvg');
  });

  test('Policy Acknowledgement API returns per-policy staff status', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await apiRequest(request, 'GET', `/consentz/${orgId}/policy-acknowledgement`);
    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body).toHaveProperty('policies');
    if (body.policies.length > 0) {
      expect(body.policies[0]).toHaveProperty('policyName');
      expect(body.policies[0]).toHaveProperty('signedCount');
      expect(body.policies[0]).toHaveProperty('notSignedCount');
      expect(body.policies[0]).toHaveProperty('completionPercentage');
      expect(body.policies[0]).toHaveProperty('signedUsers');
      expect(body.policies[0]).toHaveProperty('notSignedUsers');
    }
  });
});
```

### 1.10 SDK Outbound API Tests

```typescript
// tests/api/sdk-outbound.spec.ts
test.describe('SDK Outbound API', () => {

  test('GET /api/sdk/v1/compliance/[orgId] — returns compliance snapshot', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const apiKey = await getTestApiKey(request, orgId);
    
    const res = await request.get(`/api/sdk/v1/compliance/${orgId}`, {
      headers: { 'X-API-KEY': apiKey },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('overallScore');
    expect(body).toHaveProperty('rating');
    expect(body).toHaveProperty('domains');
    expect(body).toHaveProperty('alerts');
  });

  test('POST /api/sdk/v1/validate-booking — blocks non-compliant booking', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const apiKey = await getTestApiKey(request, orgId);

    const res = await request.post('/api/sdk/v1/validate-booking', {
      headers: { 'X-API-KEY': apiKey },
      data: {
        orgId,
        patientId: 142689,
        practitionerId: 15,
        treatmentId: 1,
        scheduledDate: '2026-04-01',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('allowed');
    expect(body).toHaveProperty('warnings');
  });

  test('SDK API rejects requests without API key', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await request.get(`/api/sdk/v1/compliance/${orgId}`);
    expect(res.status()).toBe(401);
  });

  test('SDK API rejects invalid API key', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    const res = await request.get(`/api/sdk/v1/compliance/${orgId}`, {
      headers: { 'X-API-KEY': 'invalid_key_12345' },
    });
    expect(res.status()).toBe(403);
  });
});
```

---

## SECTION 2: E2E UI TESTS WITH PERSONAS

### Persona 1: Sarah — Compliance Manager at an Aesthetic Clinic

Sarah's daily workflow tests every core feature of the platform.

```typescript
// tests/e2e/persona-sarah-clinic.spec.ts
test.describe('Persona: Sarah — Compliance Manager, Aesthetic Clinic', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'sarah@beautifyclinic.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Morning check: Dashboard loads with compliance overview', async ({ page }) => {
    // Overall score and rating badge visible
    await expect(page.locator('[data-testid="overall-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="cqc-rating-badge"]')).toBeVisible();
    
    // Rating badge shows CQC terminology
    const badge = await page.locator('[data-testid="cqc-rating-badge"]').textContent();
    expect(['Outstanding', 'Good', 'Requires Improvement', 'Inadequate']).toContain(badge?.trim());

    // All 5 domain cards visible
    await expect(page.locator('[data-testid="domain-card"]')).toHaveCount(5);

    // Each domain card has score and icon
    const domainCards = page.locator('[data-testid="domain-card"]');
    for (let i = 0; i < 5; i++) {
      await expect(domainCards.nth(i).locator('[data-testid="domain-score"]')).toBeVisible();
      await expect(domainCards.nth(i).locator('[data-testid="domain-icon"]')).toBeVisible();
    }

    // Priority gaps section visible
    await expect(page.locator('[data-testid="priority-gaps"]')).toBeVisible();
  });

  test('Click Safe domain card → navigates to Safe domain detail', async ({ page }) => {
    await page.click('[data-testid="domain-card-safe"]');
    await page.waitForURL('**/domains/safe');

    // KLOEs S1-S6 visible
    await expect(page.locator('[data-testid="kloe-row"]')).toHaveCount(6);
    
    // Each KLOE has question text and status indicator
    const kloeRows = page.locator('[data-testid="kloe-row"]');
    for (let i = 0; i < 6; i++) {
      await expect(kloeRows.nth(i).locator('[data-testid="kloe-question"]')).toBeVisible();
      await expect(kloeRows.nth(i).locator('[data-testid="kloe-status"]')).toBeVisible();
    }
  });

  test('Navigate to Evidence Library → upload new evidence', async ({ page }) => {
    await page.click('[data-testid="nav-evidence"]');
    await page.waitForURL('**/evidence');

    // Click upload button
    await page.click('[data-testid="upload-evidence-btn"]');

    // Fill form
    await page.fill('[name="title"]', 'Hand Hygiene Audit March 2026');
    await page.selectOption('[name="category"]', 'AUDIT_REPORT');
    await page.click('[data-testid="domain-checkbox-safe"]');
    await page.fill('[name="expiryDate"]', '2026-12-31');
    await page.click('button[type="submit"]');

    // Verify appears in list with correct domain badge
    await expect(page.locator('text=Hand Hygiene Audit March 2026')).toBeVisible();
    await expect(page.locator('[data-testid="domain-badge-safe"]').first()).toBeVisible();
  });

  test('Navigate to Incidents → create and resolve an incident', async ({ page }) => {
    await page.click('[data-testid="nav-incidents"]');
    await page.waitForURL('**/incidents');

    // Create new incident
    await page.click('[data-testid="new-incident-btn"]');
    await page.selectOption('[name="incidentType"]', 'COMPLICATION');
    await page.fill('[name="title"]', 'E2E Test: Filler reaction');
    await page.fill('[name="description"]', 'Patient had unexpected swelling');
    await page.selectOption('[name="severity"]', 'HIGH');
    await page.fill('[name="patientName"]', 'Test Patient');
    await page.click('button[type="submit"]');

    // Verify in list
    await expect(page.locator('text=E2E Test: Filler reaction')).toBeVisible();

    // Click to resolve
    await page.click('text=E2E Test: Filler reaction');
    await page.fill('[name="rootCause"]', 'Known allergy not recorded');
    await page.fill('[name="actionsTaken"]', 'Updated patient allergy form process');
    await page.click('[data-testid="resolve-incident-btn"]');
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('CLOSED');
  });

  test('Navigate to Tasks → Kanban board works with drag simulation', async ({ page }) => {
    await page.click('[data-testid="nav-tasks"]');
    await page.waitForURL('**/tasks');

    // Create a task
    await page.click('[data-testid="add-task-btn"]');
    await page.fill('[name="title"]', 'E2E Test: Review complaints log');
    await page.selectOption('[name="priority"]', 'HIGH');
    await page.click('[data-testid="domain-checkbox-responsive"]');
    await page.click('button[type="submit"]');

    // Task appears in TODO column
    await expect(page.locator('[data-testid="column-TODO"]').locator('text=E2E Test: Review complaints log')).toBeVisible();

    // Verify domain badge on task card
    await expect(page.locator('[data-testid="task-card"]').last().locator('[data-testid="domain-badge-responsive"]')).toBeVisible();
  });

  test('Navigate to Staff → view credentials and competency clock', async ({ page }) => {
    await page.click('[data-testid="nav-staff"]');
    await page.waitForURL('**/staff');

    // Staff list visible
    await expect(page.locator('[data-testid="staff-card"]').first()).toBeVisible();

    // For aesthetic clinic: GMC Registration column should be visible
    await expect(page.locator('text=GMC Registration')).toBeVisible();
    // Level 7 Diploma column should be visible
    await expect(page.locator('text=Level 7')).toBeVisible();
    // DBS should NOT be mandatory (it's a clinic, not care home)
  });

  test('Run Assessment → complete flow → get score and tasks', async ({ page }) => {
    await page.click('[data-testid="nav-assessment"]');
    
    // Start new assessment
    await page.click('[data-testid="start-assessment-btn"]');

    // Should show first domain (Safe)
    await expect(page.locator('[data-testid="assessment-domain-title"]')).toContainText('Safe');

    // Answer first 3 questions with Yes
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="answer-yes"]');
      await page.click('[data-testid="next-question-btn"]');
    }

    // Answer one with No
    await page.click('[data-testid="answer-no"]');
    await page.click('[data-testid="next-question-btn"]');

    // Eventually complete all questions (skip through remaining)
    while (await page.locator('[data-testid="next-question-btn"]').isVisible().catch(() => false)) {
      await page.click('[data-testid="answer-yes"]');
      await page.click('[data-testid="next-question-btn"]');
    }

    // Results page should show
    await expect(page.locator('[data-testid="assessment-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="overall-score"]')).toBeVisible();

    // A task should have been created for the "No" answer
    await page.click('[data-testid="nav-tasks"]');
    await expect(page.locator('[data-testid="task-source-ASSESSMENT"]').first()).toBeVisible();
  });

  test('Settings → Consentz Integration → trigger sync', async ({ page }) => {
    await page.click('[data-testid="nav-settings"]');
    await page.click('[data-testid="settings-integrations"]');

    // Consentz connection section visible
    await expect(page.locator('text=Consentz Connection')).toBeVisible();

    // Last sync timestamp visible
    await expect(page.locator('[data-testid="last-sync-time"]')).toBeVisible();

    // Trigger manual sync
    await page.click('[data-testid="sync-now-btn"]');
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('success', { timeout: 30000 });
  });

  test('Settings → SDK → generate and view API key', async ({ page }) => {
    await page.click('[data-testid="nav-settings"]');
    await page.click('[data-testid="settings-sdk"]');

    // Generate new key
    await page.click('[data-testid="generate-api-key-btn"]');
    await page.fill('[name="keyName"]', 'E2E Test Key');
    await page.click('[data-testid="confirm-generate-btn"]');

    // Key is displayed (only shown once)
    const keyDisplay = page.locator('[data-testid="api-key-display"]');
    await expect(keyDisplay).toBeVisible();
    const keyValue = await keyDisplay.textContent();
    expect(keyValue).toMatch(/^cqc_/);  // keys start with prefix
  });

  test('Reports → Inspection Preparation generates a brief', async ({ page }) => {
    await page.click('[data-testid="nav-reports"]');
    await page.click('[data-testid="inspection-prep"]');

    // Should show all 5 domains with readiness status
    await expect(page.locator('[data-testid="domain-readiness"]')).toHaveCount(5);

    // Generate brief for Safe domain
    await page.click('[data-testid="generate-brief-safe"]');
    await expect(page.locator('[data-testid="ai-brief-content"]')).toBeVisible({ timeout: 15000 });
  });
});
```

### Persona 2: David — Manager at a Care Home

Tests care-home-specific features and ensures no clinic content leaks in.

```typescript
// tests/e2e/persona-david-carehome.spec.ts
test.describe('Persona: David — Manager, Care Home', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'david@sunrisecare.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Responsive domain R3 shows End of Life Care (not Timely Access)', async ({ page }) => {
    await page.click('[data-testid="domain-card-responsive"]');
    await page.waitForURL('**/domains/responsive');

    const r3 = page.locator('[data-testid="kloe-row"]').filter({ hasText: 'R3' });
    const r3Text = await r3.locator('[data-testid="kloe-question"]').textContent();
    expect(r3Text?.toLowerCase()).toContain('end of life');
    expect(r3Text?.toLowerCase()).not.toContain('timely');
  });

  test('Staff page shows DBS as mandatory, hides GMC and Level 7', async ({ page }) => {
    await page.click('[data-testid="nav-staff"]');
    await expect(page.locator('text=DBS Check')).toBeVisible();
    // GMC Registration should NOT appear for care homes
    await expect(page.locator('text=GMC Registration')).not.toBeVisible();
    await expect(page.locator('text=Level 7')).not.toBeVisible();
  });

  test('Assessment shows care home questions — nutrition, falls, end of life', async ({ page }) => {
    await page.click('[data-testid="nav-assessment"]');
    await page.click('[data-testid="start-assessment-btn"]');

    // Gather all question texts
    const questions: string[] = [];
    while (await page.locator('[data-testid="assessment-question"]').isVisible().catch(() => false)) {
      const text = await page.locator('[data-testid="assessment-question"]').textContent();
      if (text) questions.push(text.toLowerCase());
      await page.click('[data-testid="answer-yes"]');
      if (await page.locator('[data-testid="next-question-btn"]').isVisible().catch(() => false)) {
        await page.click('[data-testid="next-question-btn"]');
      } else {
        break;
      }
    }

    // Should include care home topics
    const allText = questions.join(' ');
    expect(allText).toContain('nutrition');
    // Should NOT include clinic-specific topics
    expect(allText).not.toContain('botox');
    expect(allText).not.toContain('filler');
    expect(allText).not.toContain('gmc registration');
  });
});
```

---

## SECTION 3: DATA INTEGRITY TESTS

These verify that operations correctly persist to the database and that compliance scores update.

```typescript
// tests/data-integrity/score-updates.spec.ts
test.describe('Data Integrity — Score Recalculation', () => {

  test('Uploading valid evidence improves domain score', async ({ request }) => {
    const orgId = await getTestOrgId(request);

    // Get initial score
    const before = await apiRequest(request, 'GET', `/dashboard/${orgId}`);
    const initialSafe = (await before.json()).domains.find(d => d.code === 'safe').score;

    // Upload evidence for safe domain
    await apiRequest(request, 'POST', `/evidence/${orgId}`, {
      title: 'New IPC Policy',
      category: 'POLICY',
      domains: ['safe'],
      kloeCode: 'S5',
      status: 'VALID',
    });

    // Trigger score recalculation
    await apiRequest(request, 'POST', `/organizations/${orgId}/sync`);

    // Score should improve or stay same (never decrease from adding valid evidence)
    const after = await apiRequest(request, 'GET', `/dashboard/${orgId}`);
    const newSafe = (await after.json()).domains.find(d => d.code === 'safe').score;
    expect(newSafe).toBeGreaterThanOrEqual(initialSafe);
  });

  test('Resolving an incident improves the Safe domain score', async ({ request }) => {
    const orgId = await getTestOrgId(request);

    // Create an unresolved incident
    const create = await apiRequest(request, 'POST', `/incidents/${orgId}`, {
      incidentType: 'INFECTION',
      title: 'Score test incident',
      description: 'Test',
      severity: 'HIGH',
      domains: ['safe'],
    });
    const incident = await create.json();

    const before = await apiRequest(request, 'GET', `/dashboard/${orgId}`);
    const scoreBefore = (await before.json()).domains.find(d => d.code === 'safe').score;

    // Resolve it
    await apiRequest(request, 'PUT', `/incidents/${orgId}/${incident.id}`, {
      status: 'CLOSED',
      rootCause: 'Test root cause',
      actionsTaken: 'Test actions',
    });

    // Recalculate
    await apiRequest(request, 'POST', `/organizations/${orgId}/sync`);

    const after = await apiRequest(request, 'GET', `/dashboard/${orgId}`);
    const scoreAfter = (await after.json()).domains.find(d => d.code === 'safe').score;
    expect(scoreAfter).toBeGreaterThanOrEqual(scoreBefore);
  });

  test('Consentz sync log records every sync attempt', async ({ request }) => {
    const orgId = await getTestOrgId(request);
    
    // Trigger sync
    await apiRequest(request, 'POST', `/organizations/${orgId}/sync`);

    // Check sync logs exist
    const logs = await apiRequest(request, 'GET', `/organizations/${orgId}/sync-logs`);
    const body = await logs.json();
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('endpoint');
    expect(body[0]).toHaveProperty('syncedAt');
    expect(body[0]).toHaveProperty('status');
  });
});
```

---

## TEST EXECUTION ORDER

Run tests in this order for best results:

```bash
# 1. API unit tests (no browser needed)
npx playwright test tests/api/ --project=api

# 2. Consentz integration tests (against staging)
npx playwright test tests/api/consentz-integration.spec.ts --project=api

# 3. SDK outbound tests
npx playwright test tests/api/sdk-outbound.spec.ts --project=api

# 4. Data integrity tests
npx playwright test tests/data-integrity/ --project=api

# 5. E2E UI tests — Aesthetic Clinic persona
npx playwright test tests/e2e/persona-sarah-clinic.spec.ts --project=chromium

# 6. E2E UI tests — Care Home persona
npx playwright test tests/e2e/persona-david-carehome.spec.ts --project=chromium

# Full suite
npx playwright test
```

---

## PLAYWRIGHT CONFIG

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'api', testMatch: /.*\.spec\.ts/, use: { browserName: undefined } },
    { name: 'chromium', testMatch: /tests\/e2e\/.*/, use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```
