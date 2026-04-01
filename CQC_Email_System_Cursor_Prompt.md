# CQC COMPLIANCE MODULE — TRANSACTIONAL EMAIL SYSTEM

> **For Cursor:** Complete implementation guide for the automated email system using Resend + Supabase Auth. Every email is auto-triggered — no admin dashboard, no manual sends.
>
> **Auth:** Supabase Auth (NOT Clerk). All auth hooks, password resets, and user management go through Supabase.
>
> **Email Provider:** Resend (domain verified: mail@consentz.com)
>
> **Architecture:** Modular — each email is a self-contained template + trigger. Adding new emails = add a template file + register the trigger.

---

## TABLE OF CONTENTS

1. [Architecture & Setup](#1-architecture)
2. [Email Template System](#2-template-system)
3. [Base Layout Component](#3-base-layout)
4. [Email #1: Welcome](#4-welcome)
5. [Email #2: Team Invitation](#5-team-invitation)
6. [Email #3: Password Reset](#6-password-reset)
7. [Email #4: Assessment Completed](#7-assessment-completed)
8. [Email #5: Consentz Account Linked](#8-consentz-linked)
9. [Email #6: Score Milestone Reached](#9-score-milestone)
10. [Email #7: Score Dropped Significantly](#10-score-dropped)
11. [Email #8: First "Good" Prediction](#11-first-good)
12. [Email #9: Incident Reported](#12-incident-reported)
13. [Email #10: Incident Requires Investigation](#13-incident-investigation)
14. [Email #11: Subscription Activated](#14-subscription-activated)
15. [Email #12: Subscription Cancelled](#15-subscription-cancelled)
16. [Email #13: Sync Failed](#16-sync-failed)
17. [Email #14: Sync Detected Critical Issues](#17-sync-critical)
18. [Email #15: Weekly Compliance Digest](#18-weekly-digest)
19. [Email #16: Monthly Compliance Report](#19-monthly-report)
20. [Cron Jobs for Scheduled Emails](#20-cron-jobs)
21. [Adding New Emails (Modular Guide)](#21-adding-new-emails)

---

## 1. ARCHITECTURE & SETUP {#1-architecture}

### Dependencies

```bash
npm install resend
```

### Environment Variables

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=CQC Compliance <mail@consentz.com>
NEXT_PUBLIC_APP_URL=https://your-app-url.com
```

### File Structure

```
lib/
  email/
    resend.ts              — Resend client singleton
    send.ts                — Universal send function with error handling
    templates/
      base-layout.ts       — Shared HTML layout (header, footer, styles)
      welcome.ts           — Email #1
      team-invitation.ts   — Email #2
      password-reset.ts    — Email #3
      assessment-completed.ts
      consentz-linked.ts
      score-milestone.ts
      score-dropped.ts
      first-good.ts
      incident-reported.ts
      incident-investigation.ts
      subscription-activated.ts
      subscription-cancelled.ts
      sync-failed.ts
      sync-critical-issues.ts
      weekly-digest.ts
      monthly-report.ts
    triggers/
      auth-triggers.ts     — Hooks into Supabase Auth events
      compliance-triggers.ts — Score change detection
      incident-triggers.ts
      sync-triggers.ts
      billing-triggers.ts

app/
  api/
    email/
      webhook/route.ts     — Supabase Auth webhook receiver
    cron/
      weekly-digest/route.ts
      monthly-report/route.ts
      incident-reminders/route.ts
```

### Resend Client: `lib/email/resend.ts`

```typescript
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CQC Compliance <mail@consentz.com>';
```

### Universal Send Function: `lib/email/send.ts`

```typescript
import { resend, FROM_EMAIL } from './resend';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  tags?: { name: string; value: string }[];
}

/**
 * Universal email sender with logging.
 * Every email sent is logged to the activity_logs table for audit trail.
 */
export async function sendEmail(params: SendEmailParams, context?: {
  organizationId?: string;
  userId?: string;
  emailType: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      tags: params.tags,
    });

    if (error) {
      console.error(`[EMAIL] Failed to send ${context?.emailType}:`, error);
      return { success: false, error };
    }

    // Log to activity_logs for audit trail
    if (context?.organizationId) {
      await supabase.from('activity_logs').insert({
        organization_id: context.organizationId,
        user_id: context.userId || 'system',
        action: 'EMAIL_SENT',
        resource_type: 'email',
        details: {
          emailType: context.emailType,
          to: params.to,
          subject: params.subject,
          resendId: data?.id,
        },
      });
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error(`[EMAIL] Exception sending ${context?.emailType}:`, err);
    return { success: false, error: err.message };
  }
}
```

---

## 2. EMAIL TEMPLATE SYSTEM {#2-template-system}

Every template is a function that takes typed data and returns an HTML string. All templates use the shared base layout for consistent branding.

### Design Principles
- **Clean and minimal** — White background, single column, max-width 600px
- **Consentz branding** — Dark header bar with "Consentz" wordmark, teal accent color (#0D9488)
- **Mobile responsive** — All emails render correctly on mobile
- **No images** — Pure HTML/CSS, no external image dependencies (fast loading, no broken images)
- **CTA buttons** — Teal background, white text, rounded corners, large click target
- **Footer** — "This is an automated message from the CQC Compliance Module by Consentz. Do not reply to this email."

---

## 3. BASE LAYOUT COMPONENT {#3-base-layout}

### Create: `lib/email/templates/base-layout.ts`

```typescript
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface BaseLayoutParams {
  preheader?: string;  // Preview text shown in inbox
  body: string;        // Main email content HTML
}

export function baseLayout({ preheader, body }: BaseLayoutParams): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CQC Compliance</title>
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}</span>` : ''}
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #18181b; padding: 24px 32px; }
    .header-text { color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; margin: 0; }
    .header-sub { color: #a1a1aa; font-size: 12px; margin: 4px 0 0 0; }
    .content { padding: 32px; }
    .footer { padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7; }
    .footer p { color: #71717a; font-size: 12px; line-height: 18px; margin: 0 0 8px 0; }
    h1 { color: #18181b; font-size: 22px; font-weight: 700; margin: 0 0 16px 0; line-height: 28px; }
    h2 { color: #18181b; font-size: 17px; font-weight: 600; margin: 24px 0 12px 0; }
    p { color: #3f3f46; font-size: 15px; line-height: 24px; margin: 0 0 16px 0; }
    .btn { display: inline-block; background-color: #0d9488; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 8px 0; }
    .btn:hover { background-color: #0f766e; }
    .card { background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 16px 0; }
    .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e4e4e7; }
    .card-row:last-child { border-bottom: none; }
    .card-label { color: #71717a; font-size: 13px; }
    .card-value { color: #18181b; font-size: 15px; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge-good { background-color: #dcfce7; color: #166534; }
    .badge-warning { background-color: #fef9c3; color: #854d0e; }
    .badge-critical { background-color: #fee2e2; color: #991b1b; }
    .badge-info { background-color: #dbeafe; color: #1e40af; }
    .divider { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
    .metric-grid { display: flex; gap: 12px; margin: 16px 0; }
    .metric-box { flex: 1; background-color: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center; }
    .metric-value { font-size: 28px; font-weight: 700; color: #18181b; margin: 0; }
    .metric-label { font-size: 12px; color: #71717a; margin: 4px 0 0 0; }
    .list-item { padding: 10px 0; border-bottom: 1px solid #f4f4f5; }
    .list-item:last-child { border-bottom: none; }
    .severity-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
    .dot-critical { background-color: #ef4444; }
    .dot-high { background-color: #f97316; }
    .dot-medium { background-color: #eab308; }
    .muted { color: #71717a; font-size: 13px; }
  </style>
</head>
<body>
  <div style="background-color: #f4f4f5; padding: 40px 16px;">
    <div class="wrapper" style="border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div class="header">
        <p class="header-text">Consentz</p>
        <p class="header-sub">CQC Compliance Module</p>
      </div>

      <!-- Content -->
      <div class="content">
        ${body}
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>This is an automated message from the CQC Compliance Module by Consentz.</p>
        <p>Please do not reply to this email. If you need help, use the AI assistant inside your dashboard or contact <a href="mailto:care@consentz.com" style="color: #0d9488;">care@consentz.com</a>.</p>
        <p style="margin-top: 12px;">
          <a href="${APP_URL}/dashboard" style="color: #0d9488; text-decoration: none; margin-right: 16px;">Dashboard</a>
          <a href="${APP_URL}/settings" style="color: #0d9488; text-decoration: none;">Settings</a>
        </p>
        <p style="color: #a1a1aa; font-size: 11px; margin-top: 16px;">&copy; ${new Date().getFullYear()} Consentz. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
```

---

## 4. EMAIL #1: WELCOME {#4-welcome}

**Trigger:** Supabase Auth `user.created` event (when a new user signs up)
**To:** New user's email
**Subject:** Welcome to CQC Compliance by Consentz

### Template: `lib/email/templates/welcome.ts`

```typescript
import { baseLayout } from './base-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface WelcomeEmailData {
  userName: string;
  organizationName: string;
  serviceType: string; // 'Aesthetic Clinic' or 'Care Home'
}

export function welcomeEmail(data: WelcomeEmailData): string {
  return baseLayout({
    preheader: `Your CQC compliance dashboard is ready, ${data.userName}.`,
    body: `
      <h1>Welcome to CQC Compliance, ${data.userName}!</h1>
      
      <p>Your account for <strong>${data.organizationName}</strong> has been created. You're now set up as a <strong>${data.serviceType}</strong> in the CQC Compliance Module.</p>
      
      <p>Here's how to get started:</p>

      <div class="card">
        <div class="list-item">
          <strong>Step 1:</strong> Complete your initial CQC assessment<br>
          <span class="muted">Takes about 10 minutes. This creates your baseline compliance score.</span>
        </div>
        <div class="list-item">
          <strong>Step 2:</strong> Link your Consentz account<br>
          <span class="muted">Go to Settings → Integrations to connect your clinic data.</span>
        </div>
        <div class="list-item">
          <strong>Step 3:</strong> Review your compliance gaps<br>
          <span class="muted">Your dashboard will show priority areas to address.</span>
        </div>
      </div>

      <p style="text-align: center; margin: 28px 0;">
        <a href="${APP_URL}/dashboard" class="btn">Go to Your Dashboard →</a>
      </p>

      <p class="muted" style="text-align: center;">If you have questions, the AI compliance assistant is available inside your dashboard 24/7.</p>
    `,
  });
}
```

### Trigger: `lib/email/triggers/auth-triggers.ts`

```typescript
import { sendEmail } from '../send';
import { welcomeEmail } from '../templates/welcome';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Called from Supabase Auth webhook when a new user is created.
 * See: app/api/email/webhook/route.ts
 */
export async function handleUserCreated(userId: string, email: string) {
  // Fetch user's org details
  const { data: user } = await supabase
    .from('users')
    .select('name, organization_id')
    .eq('id', userId)
    .single();

  if (!user?.organization_id) return;

  const { data: org } = await supabase
    .from('organizations')
    .select('name, service_type')
    .eq('id', user.organization_id)
    .single();

  const html = welcomeEmail({
    userName: user.name || 'there',
    organizationName: org?.name || 'your organization',
    serviceType: org?.service_type === 'CARE_HOME' ? 'Care Home' : 'Aesthetic Clinic',
  });

  await sendEmail(
    { to: email, subject: 'Welcome to CQC Compliance by Consentz', html },
    { organizationId: user.organization_id, userId, emailType: 'welcome' }
  );
}
```

---

## 5. EMAIL #2: TEAM INVITATION {#5-team-invitation}

**Trigger:** Owner/Admin invites a team member via Settings → Users
**To:** Invited person's email
**Subject:** You've been invited to join {orgName} on CQC Compliance

### Template: `lib/email/templates/team-invitation.ts`

```typescript
import { baseLayout } from './base-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface TeamInvitationData {
  invitedName: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteLink: string; // Supabase Auth magic link or signup URL with invite token
}

export function teamInvitationEmail(data: TeamInvitationData): string {
  return baseLayout({
    preheader: `${data.inviterName} invited you to manage CQC compliance for ${data.organizationName}.`,
    body: `
      <h1>You've been invited!</h1>

      <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> on the CQC Compliance Module as a <span class="badge badge-info">${data.role}</span>.</p>
      
      <p>The CQC Compliance Module helps your organisation track and improve compliance across all five CQC domains — Safe, Effective, Caring, Responsive, and Well-Led.</p>

      <p style="text-align: center; margin: 28px 0;">
        <a href="${data.inviteLink}" class="btn">Accept Invitation →</a>
      </p>

      <p class="muted" style="text-align: center;">This invitation link expires in 7 days. If you didn't expect this invite, you can safely ignore this email.</p>
    `,
  });
}
```

### Trigger Point

This fires from the team member invitation API route:

```typescript
// Inside: app/api/users/invite/route.ts (the invite endpoint)
import { teamInvitationEmail } from '@/lib/email/templates/team-invitation';
import { sendEmail } from '@/lib/email/send';

// After creating the invite record and generating the Supabase invite link:
await sendEmail(
  {
    to: invitedEmail,
    subject: `You've been invited to join ${orgName} on CQC Compliance`,
    html: teamInvitationEmail({ invitedName, inviterName, organizationName: orgName, role, inviteLink }),
  },
  { organizationId: orgId, userId: inviterId, emailType: 'team_invitation' }
);
```

---

## 6. EMAIL #3: PASSWORD RESET {#6-password-reset}

**Trigger:** Supabase Auth handles this natively. Configure the email template in Supabase Dashboard → Authentication → Email Templates → Reset Password.

**Supabase Dashboard Configuration:**

Go to: Supabase Dashboard → Authentication → Email Templates → "Reset Password"

Set the template to:

```html
<!-- Paste this into the Supabase "Reset Password" email template -->
<!-- Subject: Reset your CQC Compliance password -->

<div style="background-color: #f4f4f5; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background-color: #18181b; padding: 24px 32px;">
      <p style="color: #fff; font-size: 20px; font-weight: 700; margin: 0;">Consentz</p>
      <p style="color: #a1a1aa; font-size: 12px; margin: 4px 0 0 0;">CQC Compliance Module</p>
    </div>
    <div style="padding: 32px;">
      <h1 style="color: #18181b; font-size: 22px; margin: 0 0 16px;">Reset Your Password</h1>
      <p style="color: #3f3f46; font-size: 15px; line-height: 24px;">We received a request to reset your password. Click the button below to create a new one.</p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #0d9488; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600;">Reset Password →</a>
      </p>
      <p style="color: #71717a; font-size: 13px;">This link expires in 24 hours. If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
    <div style="padding: 24px 32px; background: #fafafa; border-top: 1px solid #e4e4e7;">
      <p style="color: #71717a; font-size: 12px; margin: 0;">This is an automated message. Please do not reply.</p>
    </div>
  </div>
</div>
```

**No code needed** — Supabase sends this automatically when `supabase.auth.resetPasswordForEmail()` is called.

---

## 7. EMAIL #4: ASSESSMENT COMPLETED {#7-assessment-completed}

**Trigger:** After the user completes the initial CQC assessment and scores are calculated
**To:** The user who completed the assessment
**Subject:** Your CQC Assessment is Complete — Here's Your Baseline

### Template: `lib/email/templates/assessment-completed.ts`

```typescript
import { baseLayout } from './base-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface AssessmentCompletedData {
  userName: string;
  overallScore: number;
  predictedRating: string;
  domainScores: { safe: number; effective: number; caring: number; responsive: number; well_led: number };
  topGaps: { title: string; domain: string; severity: string }[];
  totalGaps: number;
}

function ratingBadgeClass(rating: string): string {
  if (rating === 'OUTSTANDING' || rating === 'GOOD') return 'badge-good';
  if (rating === 'REQUIRES_IMPROVEMENT') return 'badge-warning';
  return 'badge-critical';
}

function severityDotClass(severity: string): string {
  if (severity === 'CRITICAL') return 'dot-critical';
  if (severity === 'HIGH') return 'dot-high';
  return 'dot-medium';
}

export function assessmentCompletedEmail(data: AssessmentCompletedData): string {
  const gapsList = data.topGaps.map(g => `
    <div class="list-item">
      <span class="severity-dot ${severityDotClass(g.severity)}"></span>
      <strong>${g.title}</strong><br>
      <span class="muted">${g.domain} · ${g.severity}</span>
    </div>
  `).join('');

  return baseLayout({
    preheader: `Your baseline score is ${data.overallScore}% — predicted rating: ${data.predictedRating}.`,
    body: `
      <h1>Your CQC Assessment is Complete</h1>

      <p>Great work, ${data.userName}. Your initial CQC compliance assessment has been processed. Here's your baseline:</p>

      <div style="text-align: center; margin: 24px 0;">
        <div class="metric-box" style="display: inline-block; padding: 24px 40px;">
          <p class="metric-value">${data.overallScore}%</p>
          <p class="metric-label">Overall Compliance Score</p>
          <p style="margin: 8px 0 0;"><span class="badge ${ratingBadgeClass(data.predictedRating)}">${data.predictedRating.replace('_', ' ')}</span></p>
        </div>
      </div>

      <h2>Domain Breakdown</h2>
      <div class="card">
        <div class="card-row"><span class="card-label">🛡️ Safe</span><span class="card-value">${data.domainScores.safe}%</span></div>
        <div class="card-row"><span class="card-label">✅ Effective</span><span class="card-value">${data.domainScores.effective}%</span></div>
        <div class="card-row"><span class="card-label">💛 Caring</span><span class="card-value">${data.domainScores.caring}%</span></div>
        <div class="card-row"><span class="card-label">📬 Responsive</span><span class="card-value">${data.domainScores.responsive}%</span></div>
        <div class="card-row"><span class="card-label">👑 Well-Led</span><span class="card-value">${data.domainScores.well_led}%</span></div>
      </div>

      <h2>Your Top ${data.topGaps.length} Priority Gaps</h2>
      <div class="card">
        ${gapsList}
      </div>
      <p class="muted">${data.totalGaps} total gaps identified. Address critical ones first for the biggest score impact.</p>

      <hr class="divider">

      <p><strong>What's next?</strong> Your dashboard is now active. Link your Consentz account to enable ongoing compliance monitoring — your score will update automatically as your clinic data syncs.</p>

      <p style="text-align: center; margin: 28px 0;">
        <a href="${APP_URL}/dashboard" class="btn">View Your Dashboard →</a>
      </p>
    `,
  });
}
```

### Trigger Point

Fire this at the end of the assessment completion handler:

```typescript
// Inside the assessment completion API route, after scores are saved:
import { assessmentCompletedEmail } from '@/lib/email/templates/assessment-completed';

// After saving assessment results to Supabase...
await sendEmail(
  {
    to: userEmail,
    subject: `Your CQC Assessment is Complete — Baseline: ${overallScore}%`,
    html: assessmentCompletedEmail({ userName, overallScore, predictedRating, domainScores, topGaps, totalGaps }),
  },
  { organizationId: orgId, userId, emailType: 'assessment_completed' }
);
```

---

## 8. EMAIL #5: CONSENTZ ACCOUNT LINKED {#8-consentz-linked}

**Trigger:** After user enters their Consentz Clinic ID in Settings → Integrations AND the first data sync succeeds
**To:** User who linked the account
**Subject:** Consentz Connected — Your Compliance Data Is Flowing

### Template: `lib/email/templates/consentz-linked.ts`

```typescript
import { baseLayout } from './base-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface ConsentzLinkedData {
  userName: string;
  clinicName: string;
  endpointsSucceeded: number;
  endpointsFailed: number;
  nextSyncTime: string;
}

export function consentzLinkedEmail(data: ConsentzLinkedData): string {
  return baseLayout({
    preheader: `Your Consentz clinic "${data.clinicName}" is now connected.`,
    body: `
      <h1>Consentz Connected Successfully</h1>

      <p>Great news, ${data.userName}. Your Consentz clinic <strong>"${data.clinicName}"</strong> is now linked to the CQC Compliance Module.</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Status</span><span class="card-value" style="color: #16a34a;">✓ Connected</span></div>
        <div class="card-row"><span class="card-label">Data feeds active</span><span class="card-value">${data.endpointsSucceeded} of 8</span></div>
        ${data.endpointsFailed > 0 ? `<div class="card-row"><span class="card-label">Feeds unavailable</span><span class="card-value" style="color: #f97316;">${data.endpointsFailed}</span></div>` : ''}
        <div class="card-row"><span class="card-label">Next automatic sync</span><span class="card-value">${data.nextSyncTime}</span></div>
      </div>

      <h2>What This Means</h2>
      <p>Your compliance score will now update automatically every 6 hours using live data from your Consentz clinic:</p>
      <p style="padding-left: 16px; border-left: 3px solid #0d9488;">
        Staff qualifications · Consent completion · Consent expiry · Infection incidents · Policy sign-offs · Safety checklists · Treatment risk data · Patient feedback
      </p>
      
      <p>You no longer need to manually track most of this — the system does it for you.</p>

      <p style="text-align: center; margin: 28px 0;">
        <a href="${APP_URL}/dashboard" class="btn">View Updated Dashboard →</a>
      </p>
    `,
  });
}
```

---

## 9. EMAIL #6: SCORE MILESTONE REACHED {#9-score-milestone}

**Trigger:** After a sync recalculation, the predicted rating crosses a threshold boundary (e.g., crosses from REQUIRES_IMPROVEMENT into GOOD territory at 63%)
**To:** Organization owner/admins
**Subject:** 🎉 Your CQC Rating Prediction Just Improved!

### Template: `lib/email/templates/score-milestone.ts`

```typescript
import { baseLayout } from './base-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface ScoreMilestoneData {
  userName: string;
  previousRating: string;
  newRating: string;
  overallScore: number;
  previousScore: number;
}

export function scoreMilestoneEmail(data: ScoreMilestoneData): string {
  return baseLayout({
    preheader: `Your predicted CQC rating just moved from ${data.previousRating} to ${data.newRating}!`,
    body: `
      <h1 style="text-align: center;">🎉 Rating Milestone!</h1>

      <p style="text-align: center; font-size: 17px;">Your predicted CQC rating has improved.</p>

      <div style="text-align: center; margin: 24px 0;">
        <span class="badge badge-warning" style="font-size: 16px; padding: 8px 16px;">${data.previousRating.replace('_', ' ')}</span>
        <span style="display: inline-block; margin: 0 12px; color: #71717a; font-size: 20px;">→</span>
        <span class="badge badge-good" style="font-size: 16px; padding: 8px 16px;">${data.newRating.replace('_', ' ')}</span>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <div class="metric-box" style="display: inline-block; padding: 20px 40px;">
          <p class="metric-value">${data.overallScore}%</p>
          <p class="metric-label">Current Score (was ${data.previousScore}%)</p>
        </div>
      </div>

      <p>This is a direct result of your team's work — uploading evidence, completing tasks, closing gaps, and keeping your Consentz data up to date.</p>

      <p><strong>Keep going.</strong> Every gap you close and every piece of evidence you upload moves you closer to demonstrating excellence to CQC inspectors.</p>

      <p style="text-align: center; margin: 28px 0;">
        <a href="${APP_URL}/dashboard" class="btn">View Your Progress →</a>
      </p>
    `,
  });
}
```

---

## 10. EMAIL #7: SCORE DROPPED SIGNIFICANTLY {#10-score-dropped}

**Trigger:** After a sync, overall score drops by 10+ points
**To:** Organization owner/admins
**Subject:** ⚠️ Your Compliance Score Has Dropped — Action Needed

```typescript
import { baseLayout } from './base-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface ScoreDroppedData {
  userName: string;
  previousScore: number;
  newScore: number;
  dropAmount: number;
  predictedRating: string;
  likelyCauses: string[]; // e.g., ["3 staff certifications expired", "Consent completion rate dropped to 72%"]
}

export function scoreDroppedEmail(data: ScoreDroppedData): string {
  const causesList = data.likelyCauses.map(c => `<div class="list-item"><span class="severity-dot dot-high"></span>${c}</div>`).join('');

  return baseLayout({
    preheader: `Your compliance score dropped ${data.dropAmount} points to ${data.newScore}%. Immediate review recommended.`,
    body: `
      <h1>⚠️ Compliance Score Drop Detected</h1>

      <p>${data.userName}, your compliance score has dropped significantly after the latest Consentz data sync.</p>

      <div style="text-align: center; margin: 24px 0;">
        <div class="metric-box" style="display: inline-block; padding: 20px 40px; border: 2px solid #fbbf24;">
          <p class="metric-value" style="color: #dc2626;">${data.previousScore}% → ${data.newScore}%</p>
          <p class="metric-label">Down ${data.dropAmount} points</p>
        </div>
      </div>

      ${data.likelyCauses.length > 0 ? `
        <h2>Likely Causes</h2>
        <div class="card">${causesList}</div>
      ` : ''}

      <p>A drop this size typically means something in your clinic operations needs attention — expired credentials, lapsed consents, or new incidents that haven't been addressed.</p>

      <p style="text-align: center; margin: 28px 0;">
        <a href="${APP_URL}/dashboard" class="btn">Review Your Dashboard →</a>
      </p>
    `,
  });
}
```

---

## 11. EMAIL #8: FIRST "GOOD" PREDICTION {#11-first-good}

**Trigger:** First time ever the predicted rating reaches "GOOD" (63%+)
**To:** Organization owner/admins
**Subject:** 🏆 Your CQC Prediction Just Hit "Good"!

```typescript
import { baseLayout } from './base-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface FirstGoodData {
  userName: string;
  overallScore: number;
  daysToGetHere: number;
}

export function firstGoodEmail(data: FirstGoodData): string {
  return baseLayout({
    preheader: `Your clinic is now predicted to receive a "Good" CQC rating. Congratulations!`,
    body: `
      <h1 style="text-align: center;">🏆 Congratulations!</h1>

      <p style="text-align: center; font-size: 17px; color: #3f3f46;">Your predicted CQC rating just reached</p>

      <div style="text-align: center; margin: 24px 0;">
        <span class="badge badge-good" style="font-size: 24px; padding: 12px 32px;">GOOD</span>
      </div>

      <div style="text-align: center; margin: 16px 0;">
        <div class="metric-box" style="display: inline-block; padding: 20px 40px;">
          <p class="metric-value">${data.overallScore}%</p>
          <p class="metric-label">Compliance Score</p>
        </div>
      </div>

      <p>${data.userName}, this is a significant milestone. It means your clinic now has sufficient evidence, policies, and operational compliance to likely receive a "Good" rating from CQC.</p>

      ${data.daysToGetHere > 0 ? `<p class="muted" style="text-align: center;">You reached this in ${data.daysToGetHere} days from your first assessment.</p>` : ''}

      <hr class="divider">

      <p><strong>What's next?</strong> "Good" is a strong position, but "Outstanding" (88%+) is achievable with continued effort. Keep closing gaps, maintaining evidence, and demonstrating continuous improvement.</p>

      <p style="text-align: center; margin: 28px 0;">
        <a href="${APP_URL}/dashboard" class="btn">See What's Next →</a>
      </p>
    `,
  });
}
```

---

## 12-13. INCIDENT EMAILS {#12-incident-reported}

### Email #9: Incident Reported

**Trigger:** An incident is created (manually or from Consentz sync)
**To:** The reporter (confirmation) + organization admins (notification)
**Subject:** Incident Reported: {incidentTitle}

```typescript
import { baseLayout } from './base-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface IncidentReportedData {
  recipientName: string;
  incidentTitle: string;
  severity: string;
  incidentType: string;
  reportedBy: string;
  reportedAt: string;
  incidentId: string;
  isReporter: boolean; // true = confirmation to reporter, false = notification to admin
}

export function incidentReportedEmail(data: IncidentReportedData): string {
  const severityClass = data.severity === 'CRITICAL' ? 'badge-critical' : data.severity === 'HIGH' ? 'badge-warning' : 'badge-info';

  return baseLayout({
    preheader: `${data.isReporter ? 'Your incident report has been logged' : 'A new incident has been reported at your organisation'}.`,
    body: `
      <h1>${data.isReporter ? 'Incident Report Confirmed' : 'New Incident Reported'}</h1>

      <p>${data.isReporter 
        ? `${data.recipientName}, your incident report has been logged successfully.` 
        : `${data.recipientName}, a new incident has been reported at your organisation by ${data.reportedBy}.`}</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Incident</span><span class="card-value">${data.incidentTitle}</span></div>
        <div class="card-row"><span class="card-label">Severity</span><span class="badge ${severityClass}">${data.severity}</span></div>
        <div class="card-row"><span class="card-label">Type</span><span class="card-value">${data.incidentType}</span></div>
        <div class="card-row"><span class="card-label">Reported by</span><span class="card-value">${data.reportedBy}</span></div>
        <div class="card-row"><span class="card-label">Date/time</span><span class="card-value">${data.reportedAt}</span></div>
      </div>

      <p><strong>Next step:</strong> This incident needs investigation. CQC requires evidence that incidents are investigated and that learning is applied (KLOE S6, Regulation 17).</p>

      <p style="text-align: center; margin: 28px 0;">
        <a href="${APP_URL}/incidents/${data.incidentId}" class="btn">View Incident →</a>
      </p>
    `,
  });
}
```

### Email #10: Incident Requires Investigation

**Trigger:** Cron job checks daily — any incident in "REPORTED" status for 5+ days without investigation
**To:** Organization admins
**Subject:** Reminder: Incident "{title}" awaiting investigation ({X} days)

```typescript
import { baseLayout } from './base-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface IncidentInvestigationData {
  recipientName: string;
  incidentTitle: string;
  severity: string;
  daysOpen: number;
  incidentId: string;
}

export function incidentInvestigationEmail(data: IncidentInvestigationData): string {
  return baseLayout({
    preheader: `Incident "${data.incidentTitle}" has been open for ${data.daysOpen} days without investigation.`,
    body: `
      <h1>Incident Investigation Reminder</h1>

      <p>${data.recipientName}, the following incident has been open for <strong>${data.daysOpen} days</strong> without being investigated:</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Incident</span><span class="card-value">${data.incidentTitle}</span></div>
        <div class="card-row"><span class="card-label">Severity</span><span class="card-value">${data.severity}</span></div>
        <div class="card-row"><span class="card-label">Days open</span><span class="card-value" style="color: #dc2626;">${data.daysOpen} days</span></div>
      </div>

      <p>CQC inspectors specifically check that incidents are investigated promptly and that lessons are documented. Uninvestigated incidents are a common finding under KLOE S6 (Learning from incidents) and Regulation 17 (Good governance).</p>

      <p style="text-align: center; margin: 28px 0;">
        <a href="${APP_URL}/incidents/${data.incidentId}" class="btn">Investigate Now →</a>
      </p>
    `,
  });
}
```

---

## 14-15. BILLING EMAILS {#14-subscription-activated}

### Email #11: Subscription Activated

**Trigger:** Stripe webhook `checkout.session.completed`
**Subject:** Your CQC Compliance Subscription Is Active

```typescript
export function subscriptionActivatedEmail(data: { userName: string; planName: string; amount: string; nextBillingDate: string }): string {
  return baseLayout({
    preheader: `Your ${data.planName} subscription is now active.`,
    body: `
      <h1>Subscription Confirmed</h1>
      <p>${data.userName}, your CQC Compliance subscription is now active.</p>
      <div class="card">
        <div class="card-row"><span class="card-label">Plan</span><span class="card-value">${data.planName}</span></div>
        <div class="card-row"><span class="card-label">Amount</span><span class="card-value">${data.amount}/month</span></div>
        <div class="card-row"><span class="card-label">Next billing date</span><span class="card-value">${data.nextBillingDate}</span></div>
      </div>
      <p>All features are now unlocked: full CQC domain monitoring, AI policy generation, AI compliance assistant, Consentz integration, SDK access, and more.</p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Go to Dashboard →</a>
      </p>
    `,
  });
}
```

### Email #12: Subscription Cancelled

**Trigger:** Stripe webhook `customer.subscription.deleted`
**Subject:** Your CQC Compliance Subscription Has Been Cancelled

```typescript
export function subscriptionCancelledEmail(data: { userName: string; accessUntil: string }): string {
  return baseLayout({
    preheader: 'Your subscription has been cancelled. Your access continues until the end of your billing period.',
    body: `
      <h1>Subscription Cancelled</h1>
      <p>${data.userName}, your CQC Compliance subscription has been cancelled.</p>
      <div class="card">
        <div class="card-row"><span class="card-label">Access until</span><span class="card-value">${data.accessUntil}</span></div>
        <div class="card-row"><span class="card-label">After that</span><span class="card-value">Read-only access to your data</span></div>
      </div>
      <p>Your compliance data will be preserved. You can resubscribe anytime from Settings → Billing to restore full access and resume monitoring.</p>
      <p>If this was a mistake or you'd like to discuss your options, contact <a href="mailto:care@consentz.com" style="color: #0d9488;">care@consentz.com</a>.</p>
    `,
  });
}
```

---

## 16-17. SYNC EMAILS {#16-sync-failed}

### Email #13: Sync Failed

**Trigger:** Cron sync job completes with FAILED status for an organization
**To:** Organization admins
**Subject:** ⚠️ Consentz Sync Failed — Action May Be Required

```typescript
export function syncFailedEmail(data: { userName: string; errorMessage: string; lastSuccessfulSync: string }): string {
  return baseLayout({
    preheader: 'The automatic Consentz data sync failed. Your compliance data may be stale.',
    body: `
      <h1>⚠️ Consentz Sync Failed</h1>
      <p>${data.userName}, the scheduled data sync with your Consentz account failed.</p>
      <div class="card">
        <div class="card-row"><span class="card-label">Error</span><span class="card-value">${data.errorMessage}</span></div>
        <div class="card-row"><span class="card-label">Last successful sync</span><span class="card-value">${data.lastSuccessfulSync}</span></div>
      </div>
      <p><strong>Common causes:</strong></p>
      <p>• Consentz credentials may have changed or expired<br>
         • The Consentz staging server may be temporarily down<br>
         • Your Consentz Clinic ID may have changed</p>
      <p>The system will retry automatically at the next scheduled sync. If this persists, check your Consentz connection in Settings → Integrations.</p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations" class="btn">Check Integration Settings →</a>
      </p>
    `,
  });
}
```

### Email #14: Sync Detected Critical Issues

**Trigger:** After a successful sync, if auto-created tasks include CRITICAL severity items
**To:** Organization admins
**Subject:** 🔴 Critical Compliance Issues Detected in Latest Sync

```typescript
export function syncCriticalIssuesEmail(data: { userName: string; issues: { title: string; domain: string }[]; syncTime: string }): string {
  const issueList = data.issues.map(i => `
    <div class="list-item"><span class="severity-dot dot-critical"></span><strong>${i.title}</strong><br><span class="muted">${i.domain} domain</span></div>
  `).join('');

  return baseLayout({
    preheader: `${data.issues.length} critical compliance issue(s) found in your latest Consentz sync.`,
    body: `
      <h1>🔴 Critical Issues Detected</h1>
      <p>${data.userName}, the latest Consentz data sync at ${data.syncTime} detected <strong>${data.issues.length} critical compliance issue(s)</strong> that require immediate attention:</p>
      <div class="card">${issueList}</div>
      <p>Critical issues can lead to CQC enforcement action if found during an inspection. Tasks have been auto-created on your dashboard for each item.</p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Review Issues Now →</a>
      </p>
    `,
  });
}
```

---

## 18. EMAIL #15: WEEKLY COMPLIANCE DIGEST {#18-weekly-digest}

**Trigger:** Vercel Cron every Monday at 8:00 AM UK time
**To:** Organization owners/admins
**Subject:** Weekly CQC Compliance Summary — {orgName}

```typescript
import { baseLayout } from './base-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface WeeklyDigestData {
  userName: string;
  organizationName: string;
  currentScore: number;
  scoreChange: number; // +5 or -3
  predictedRating: string;
  gapsOpened: number;
  gapsClosed: number;
  tasksCompleted: number;
  tasksOverdue: number;
  upcomingDeadlines: { title: string; dueDate: string; type: string }[];
  topPriorityGap: { title: string; domain: string; severity: string } | null;
}

export function weeklyDigestEmail(data: WeeklyDigestData): string {
  const changeIcon = data.scoreChange > 0 ? '📈' : data.scoreChange < 0 ? '📉' : '➡️';
  const changeColor = data.scoreChange > 0 ? '#16a34a' : data.scoreChange < 0 ? '#dc2626' : '#71717a';

  const deadlinesList = data.upcomingDeadlines.slice(0, 5).map(d => `
    <div class="list-item"><strong>${d.title}</strong><br><span class="muted">${d.type} · Due: ${d.dueDate}</span></div>
  `).join('');

  return baseLayout({
    preheader: `Score: ${data.currentScore}% (${data.scoreChange >= 0 ? '+' : ''}${data.scoreChange}) · ${data.gapsClosed} gaps closed · ${data.tasksCompleted} tasks done`,
    body: `
      <h1>Weekly Compliance Summary</h1>
      <p class="muted" style="margin-top: -12px;">${data.organizationName} · Week ending ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
        <tr>
          <td style="text-align: center; background: #f4f4f5; border-radius: 8px; padding: 20px; width: 33%;">
            <p style="font-size: 28px; font-weight: 700; margin: 0; color: #18181b;">${data.currentScore}%</p>
            <p style="font-size: 12px; color: #71717a; margin: 4px 0 0;">Compliance Score</p>
            <p style="font-size: 13px; font-weight: 600; margin: 6px 0 0; color: ${changeColor};">${changeIcon} ${data.scoreChange >= 0 ? '+' : ''}${data.scoreChange} this week</p>
          </td>
          <td width="12"></td>
          <td style="text-align: center; background: #f4f4f5; border-radius: 8px; padding: 20px; width: 33%;">
            <p style="font-size: 28px; font-weight: 700; margin: 0; color: #18181b;">${data.gapsClosed}</p>
            <p style="font-size: 12px; color: #71717a; margin: 4px 0 0;">Gaps Closed</p>
            <p style="font-size: 13px; color: #71717a; margin: 6px 0 0;">${data.gapsOpened} opened</p>
          </td>
          <td width="12"></td>
          <td style="text-align: center; background: #f4f4f5; border-radius: 8px; padding: 20px; width: 33%;">
            <p style="font-size: 28px; font-weight: 700; margin: 0; color: #18181b;">${data.tasksCompleted}</p>
            <p style="font-size: 12px; color: #71717a; margin: 4px 0 0;">Tasks Done</p>
            ${data.tasksOverdue > 0 ? `<p style="font-size: 13px; color: #dc2626; margin: 6px 0 0;">${data.tasksOverdue} overdue</p>` : '<p style="font-size: 13px; color: #16a34a; margin: 6px 0 0;">None overdue ✓</p>'}
          </td>
        </tr>
      </table>

      ${data.topPriorityGap ? `
        <h2>Top Priority This Week</h2>
        <div class="card">
          <div class="list-item">
            <span class="severity-dot ${data.topPriorityGap.severity === 'CRITICAL' ? 'dot-critical' : 'dot-high'}"></span>
            <strong>${data.topPriorityGap.title}</strong><br>
            <span class="muted">${data.topPriorityGap.domain} domain · ${data.topPriorityGap.severity}</span>
          </div>
        </div>
      ` : ''}

      ${data.upcomingDeadlines.length > 0 ? `
        <h2>Upcoming Deadlines</h2>
        <div class="card">${deadlinesList}</div>
      ` : ''}

      <p style="text-align: center; margin: 28px 0;">
        <a href="${APP_URL}/dashboard" class="btn">Open Dashboard →</a>
      </p>

      <p class="muted" style="text-align: center;">You receive this digest every Monday. Manage email preferences in <a href="${APP_URL}/settings" style="color: #0d9488;">Settings</a>.</p>
    `,
  });
}
```

---

## 19. EMAIL #16: MONTHLY COMPLIANCE REPORT {#19-monthly-report}

**Trigger:** Vercel Cron on the 1st of every month at 9:00 AM UK time
**To:** Organization owners/admins
**Subject:** Monthly CQC Compliance Report — {month} {year}

This follows the same pattern as the weekly digest but with monthly aggregates: score change over the month, total gaps opened/closed, total tasks completed, domain score trends, and a summary suitable for forwarding to board/management.

```typescript
// Same structure as weekly digest but with monthly data aggregation.
// Include: month-over-month score trend per domain, total evidence uploaded, 
// policies reviewed, and a "board summary" paragraph at the top that can be
// copied into a governance meeting report.
// Template follows the same baseLayout pattern — implement using the 
// weekly digest as a reference but with monthly data.
```

---

## 20. CRON JOBS FOR SCHEDULED EMAILS {#20-cron-jobs}

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-consentz",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/weekly-digest",
      "schedule": "0 8 * * 1"
    },
    {
      "path": "/api/cron/monthly-report",
      "schedule": "0 9 1 * *"
    },
    {
      "path": "/api/cron/incident-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Weekly Digest Cron: `app/api/cron/weekly-digest/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { weeklyDigestEmail } from '@/lib/email/templates/weekly-digest';
import { sendEmail } from '@/lib/email/send';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all organizations
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name');

  if (!orgs) return NextResponse.json({ error: 'No orgs' }, { status: 500 });

  for (const org of orgs) {
    // Get admins/owners for this org
    const { data: admins } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('organization_id', org.id)
      .in('role', ['OWNER', 'ADMIN']);

    if (!admins?.length) continue;

    // Gather weekly metrics
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [scores, gapsOpened, gapsClosed, tasksDone, tasksOverdue, topGap, deadlines] = await Promise.all([
      supabase.from('compliance_scores').select('*').eq('organization_id', org.id).single(),
      supabase.from('compliance_gaps').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).gte('created_at', oneWeekAgo),
      supabase.from('compliance_gaps').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('status', 'RESOLVED').gte('updated_at', oneWeekAgo),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('status', 'DONE').gte('updated_at', oneWeekAgo),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).neq('status', 'DONE').lt('due_date', new Date().toISOString()),
      supabase.from('compliance_gaps').select('title, domain, severity').eq('organization_id', org.id).eq('status', 'OPEN').in('severity', ['CRITICAL', 'HIGH']).order('severity').limit(1).maybeSingle(),
      supabase.from('tasks').select('title, due_date, domain').eq('organization_id', org.id).neq('status', 'DONE').gte('due_date', new Date().toISOString()).order('due_date').limit(5),
    ]);

    const scoreChange = (scores.data?.overall_score || 0) - (scores.data?.previous_score || scores.data?.overall_score || 0);

    // Send to each admin
    for (const admin of admins) {
      const html = weeklyDigestEmail({
        userName: admin.name || 'there',
        organizationName: org.name,
        currentScore: scores.data?.overall_score || 0,
        scoreChange,
        predictedRating: scores.data?.predicted_rating || 'INADEQUATE',
        gapsOpened: gapsOpened.count || 0,
        gapsClosed: gapsClosed.count || 0,
        tasksCompleted: tasksDone.count || 0,
        tasksOverdue: tasksOverdue.count || 0,
        upcomingDeadlines: (deadlines.data || []).map((d: any) => ({
          title: d.title,
          dueDate: d.due_date ? new Date(d.due_date).toLocaleDateString('en-GB') : 'No date',
          type: d.domain || 'Task',
        })),
        topPriorityGap: topGap.data || null,
      });

      await sendEmail(
        { to: admin.email, subject: `Weekly CQC Compliance Summary — ${org.name}`, html },
        { organizationId: org.id, userId: admin.id, emailType: 'weekly_digest' }
      );
    }
  }

  return NextResponse.json({ success: true });
}
```

### Incident Reminder Cron: `app/api/cron/incident-reminders/route.ts`

```typescript
// Runs daily at 9 AM. Finds incidents in REPORTED status for 5+ days.
// Sends reminder email to org admins for each.
// Same pattern as weekly digest cron — iterate orgs, find stale incidents, send emails.
```

---

## 21. ADDING NEW EMAILS (MODULAR GUIDE) {#21-adding-new-emails}

To add a new email to the system:

**Step 1:** Create a template file in `lib/email/templates/{email-name}.ts`
```typescript
import { baseLayout } from './base-layout';

interface NewEmailData { /* typed fields */ }

export function newEmailTemplate(data: NewEmailData): string {
  return baseLayout({
    preheader: 'Preview text...',
    body: `<h1>Title</h1><p>Content using ${data.someField}</p>`,
  });
}
```

**Step 2:** Identify the trigger point (API route, cron job, webhook, or Supabase database trigger)

**Step 3:** Call `sendEmail()` at the trigger point:
```typescript
import { newEmailTemplate } from '@/lib/email/templates/new-email';
import { sendEmail } from '@/lib/email/send';

await sendEmail(
  { to: recipientEmail, subject: 'Subject line', html: newEmailTemplate(data) },
  { organizationId, userId, emailType: 'new_email_type' }
);
```

**Step 4:** If it's a scheduled email, add a cron entry to `vercel.json`.

That's it. The base layout, send function, and logging are already handled.

---

## TRIGGER SUMMARY TABLE

| # | Email | Trigger Point | Automatic? |
|---|-------|--------------|------------|
| 1 | Welcome | Supabase Auth webhook → `user.created` | ✅ Fully automatic |
| 2 | Team Invitation | `POST /api/users/invite` | ✅ On invite action |
| 3 | Password Reset | Supabase Auth native | ✅ Built-in |
| 4 | Assessment Completed | Assessment completion handler | ✅ On assessment submit |
| 5 | Consentz Linked | First successful sync after linking | ✅ On sync success |
| 6 | Score Milestone | Score recalculation (in sync job) | ✅ Automatic after sync |
| 7 | Score Dropped | Score recalculation (in sync job) | ✅ Automatic after sync |
| 8 | First Good | Score recalculation (in sync job) | ✅ Automatic after sync |
| 9 | Incident Reported | `POST /api/incidents` | ✅ On incident creation |
| 10 | Incident Investigation | Daily cron at 9 AM | ✅ Fully automatic |
| 11 | Subscription Activated | Stripe webhook | ✅ Fully automatic |
| 12 | Subscription Cancelled | Stripe webhook | ✅ Fully automatic |
| 13 | Sync Failed | End of sync cron job | ✅ Fully automatic |
| 14 | Sync Critical Issues | End of sync cron job | ✅ Fully automatic |
| 15 | Weekly Digest | Monday 8 AM cron | ✅ Fully automatic |
| 16 | Monthly Report | 1st of month 9 AM cron | ✅ Fully automatic |

Every single email is automatic. No admin dashboard needed.

---

**END OF DOCUMENT**
