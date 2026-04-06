# CQC Compliance Platform — Authentication & Security Specification

> **File 6 of 7** | The fortress protecting healthcare data and ensuring regulatory compliance
> **Auth Provider:** Clerk (SSO, MFA, webhook user sync)
> **Data Residency:** UK (`eu-west-2`) — Supabase PostgreSQL + AWS S3
> **Standards:** UK GDPR · Data Protection Act 2018 · NHS DSPT · Cyber Essentials
> **Last Updated:** February 2026
> **Companion Files:** `01-ARCHITECTURE.md` · `02-DATABASE.md` · `03-UI-UX.md` · `04-CQC-FRAMEWORK.md` · `05-API-SERVICES.md`

---

## Table of Contents

1. [Security Architecture Overview](#1-security-architecture-overview)
2. [Authentication with Clerk](#2-authentication-with-clerk)
3. [Session Management](#3-session-management)
4. [Authorization — RBAC System](#4-authorization--rbac-system)
5. [Multi-Tenancy Isolation](#5-multi-tenancy-isolation)
6. [API Security](#6-api-security)
7. [Data Protection & Encryption](#7-data-protection--encryption)
8. [UK GDPR Compliance](#8-uk-gdpr-compliance)
9. [NHS Data Security & Protection Toolkit (DSPT)](#9-nhs-data-security--protection-toolkit-dspt)
10. [Cyber Essentials Alignment](#10-cyber-essentials-alignment)
11. [File Storage Security](#11-file-storage-security)
12. [Webhook Security](#12-webhook-security)
13. [Audit Trail & Logging](#13-audit-trail--logging)
14. [Environment & Secrets Management](#14-environment--secrets-management)
15. [Security Headers & Browser Protections](#15-security-headers--browser-protections)
16. [Incident Response & Breach Notification](#16-incident-response--breach-notification)
17. [User Invitation & Onboarding Security](#17-user-invitation--onboarding-security)
18. [Dependency & Supply Chain Security](#18-dependency--supply-chain-security)
19. [Security Checklist — Pre-Launch](#19-security-checklist--pre-launch)

---

## 1. Security Architecture Overview

### 1.1 Defence-in-Depth Model

Security is implemented at every layer. No single control is relied upon — each layer provides independent protection.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                  │
│                                                                         │
│  LAYER 1: NETWORK & TRANSPORT                                          │
│  ├── TLS 1.2+ on all connections (Vercel edge enforced)                │
│  ├── HSTS headers (max-age=31536000, includeSubDomains)                │
│  ├── Vercel DDoS protection (automatic)                                │
│  └── Cloudflare WAF (optional, recommended for production)             │
│                                                                         │
│  LAYER 2: AUTHENTICATION                                                │
│  ├── Clerk: Session tokens (JWT), OAuth providers                      │
│  ├── MFA: TOTP and SMS (optional, configurable per org)                │
│  ├── Brute force protection: Clerk's built-in lockout                  │
│  └── Bot detection: Clerk CAPTCHA on suspicious sign-ups               │
│                                                                         │
│  LAYER 3: AUTHORIZATION                                                 │
│  ├── RBAC: 5-tier role hierarchy (OWNER → VIEWER)                      │
│  ├── Route-level: requireMinRole() on every handler                    │
│  ├── Record-level: organizationId scoping on every query               │
│  └── Field-level: STAFF can only update own task status                │
│                                                                         │
│  LAYER 4: APPLICATION                                                   │
│  ├── Input validation: Zod schemas on every mutation                   │
│  ├── Rate limiting: Per-user, per-category (6 tiers)                   │
│  ├── CSRF protection: SameSite cookies (Clerk default)                 │
│  └── Content Security Policy headers                                    │
│                                                                         │
│  LAYER 5: DATA                                                          │
│  ├── Encryption at rest: AES-256 (Supabase, AWS S3)                    │
│  ├── Encryption in transit: TLS 1.2+ everywhere                        │
│  ├── Row Level Security: PostgreSQL RLS as secondary barrier           │
│  ├── Soft deletes: No permanent data loss on user action               │
│  └── Signed URLs: Time-limited file access (7 days max)                │
│                                                                         │
│  LAYER 6: MONITORING & AUDIT                                            │
│  ├── ActivityLog: Every mutation logged with actor/entity/diff          │
│  ├── Sentry: Error tracking with PII scrubbing                        │
│  ├── Clerk logs: Authentication events                                 │
│  └── Cron: Daily expiry checks, weekly compliance recalcs              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Trust Boundaries

```
┌──────────────────────────────────────────────────────────────────────┐
│  UNTRUSTED ZONE                                                       │
│  ├── User browsers                                                    │
│  ├── Mobile devices                                                   │
│  └── External webhooks (Clerk, future Consentz)                      │
│       │                                                               │
│       ▼  ──── TLS + Auth Token ────                                  │
│  SEMI-TRUSTED ZONE                                                    │
│  ├── Vercel Edge Network (middleware.ts — Clerk verification)        │
│  ├── Next.js Route Handlers (withAuth wrapper)                       │
│  └── Service Layer (business logic, org-scoped queries)              │
│       │                                                               │
│       ▼  ──── Service Role Key (server-side only) ────               │
│  TRUSTED ZONE                                                         │
│  ├── Supabase PostgreSQL (eu-west-2, RLS enabled)                    │
│  ├── Supabase Storage (eu-west-2, private buckets)                   │
│  ├── Anthropic AI API (claude-sonnet-4, no PII sent)                 │
│  └── Resend Email API (transactional notifications)                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Security Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Auth provider | Clerk (not Supabase Auth) | Superior MFA, OAuth, UI components, webhook sync |
| Data residency | UK `eu-west-2` | UK GDPR compliance, NHS DSPT requirement |
| ORM | Prisma (not Supabase client) | Type-safe queries, portable, RLS as secondary layer |
| File storage | Supabase Storage + signed URLs | Private buckets, time-limited access, no public URLs |
| Multi-tenancy | Application-level `organizationId` scoping | Primary isolation; RLS as defence-in-depth |
| Secrets | Environment variables (Vercel encrypted) | Never committed to git, rotatable |
| Audit logging | Fire-and-forget ActivityLog | Never blocks operations, 7-year retention |

---

## 2. Authentication with Clerk

### 2.1 Why Clerk

Clerk handles the entire authentication lifecycle. We do NOT build custom auth.

| Feature | How We Use It |
|---|---|
| Email + password sign-up | Primary registration method |
| Google OAuth | Social login option |
| Microsoft OAuth | Enterprise/NHS login option |
| MFA (TOTP / SMS) | Optional per user, recommended for ADMIN+ |
| Session management | JWT tokens, automatic refresh |
| User webhooks | Sync user data to our database |
| Brute force protection | Auto-lockout after failed attempts |
| Bot protection | CAPTCHA on suspicious sign-ups |
| Hosted UI components | We use custom UI with Clerk hooks for design control |

### 2.2 Clerk Configuration

```typescript
// Clerk Dashboard Configuration

// Authentication Methods:
// ✅ Email + Password
// ✅ Google OAuth
// ✅ Microsoft OAuth
// ❌ Magic link (disabled — not suitable for healthcare compliance)
// ❌ Phone (disabled — email is primary identifier)

// Password Policy:
// Minimum length: 8 characters
// Require uppercase: Yes
// Require lowercase: Yes
// Require number: Yes
// Require special character: Yes
// Breached password detection: Enabled
// Max login attempts before lockout: 5
// Lockout duration: 15 minutes

// Session Configuration:
// Session lifetime: 7 days
// Inactivity timeout: 30 minutes
// Single session per device: No (allow multiple tabs)
// Token refresh: Automatic via Clerk SDK

// MFA Configuration:
// TOTP (authenticator app): Available
// SMS: Available
// Required for: Configurable per organization (recommended for ADMIN+)

// Webhooks:
// Endpoint: https://{domain}/api/webhooks/clerk
// Events: user.created, user.updated, user.deleted, session.created
// Signing: Svix signature verification
```

### 2.3 Custom Authentication UI

We use Clerk's `useSignIn()` and `useSignUp()` hooks (NOT prebuilt components) to maintain full control over the split-panel design described in `03-UI-UX.md` Section 3.

```typescript
// src/app/(auth)/sign-in/[[...sign-in]]/page.tsx

'use client'

import { useSignIn } from '@clerk/nextjs'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const { signIn, isLoaded, setActive } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      } else if (result.status === 'needs_second_factor') {
        // MFA required — redirect to MFA verification
        router.push('/sign-in/mfa')
      }
    } catch (err: any) {
      // Clerk error codes mapped to user-friendly messages
      const clerkErrors: Record<string, string> = {
        'form_identifier_not_found': 'No account found with this email.',
        'form_password_incorrect': 'Invalid password. Please try again.',
        'user_locked': 'Account locked. Try again in 15 minutes.',
        'form_param_format_invalid': 'Please enter a valid email address.',
      }
      const code = err?.errors?.[0]?.code || ''
      setError(clerkErrors[code] || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(strategy: 'oauth_google' | 'oauth_microsoft') {
    if (!isLoaded) return
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      })
    } catch (err) {
      setError('OAuth sign in failed. Please try again.')
    }
  }

  // ... render form (see 03-UI-UX.md Section 3 for layout)
}
```

### 2.4 Sign-Up with Organization Creation

```typescript
// src/app/(auth)/sign-up/[[...sign-up]]/page.tsx

'use client'

import { useSignUp } from '@clerk/nextjs'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const { signUp, isLoaded, setActive } = useSignUp()
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '',
  })
  const [pendingVerification, setPendingVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return

    try {
      await signUp.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailAddress: formData.email,
        password: formData.password,
      })

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err: any) {
      // Handle: email taken, weak password, etc.
    }
  }

  async function handleVerification(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        // New user → Clerk webhook creates DB record → redirect to onboarding
        router.push('/welcome')
      }
    } catch (err: any) {
      // Handle: invalid code, expired code
    }
  }

  // ... render form
}
```

### 2.5 SSO Callback Handler

```typescript
// src/app/(auth)/sso-callback/page.tsx

'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SSOCallbackPage() {
  // Clerk handles the OAuth callback automatically
  // On success: redirects to /dashboard or /welcome based on onboarding state
  // On failure: redirects to /sign-in with error
  return <AuthenticateWithRedirectCallback />
}
```

### 2.6 MFA Verification Page

```typescript
// src/app/(auth)/sign-in/mfa/page.tsx

'use client'

import { useSignIn } from '@clerk/nextjs'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MFAPage() {
  const { signIn, isLoaded, setActive } = useSignIn()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'totp',
        code,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Invalid verification code. Please try again.')
    }
  }

  // ... render MFA input form
}
```

---

## 3. Session Management

### 3.1 Session Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                      SESSION LIFECYCLE                            │
│                                                                  │
│  1. USER SIGNS IN                                                │
│     └── Clerk creates session → JWT issued → stored in cookie   │
│                                                                  │
│  2. AUTHENTICATED REQUEST                                        │
│     ├── Browser sends cookie automatically (HttpOnly, Secure)   │
│     ├── Clerk middleware verifies JWT signature                  │
│     ├── Extracts userId from claims                             │
│     └── Passes to route handler                                  │
│                                                                  │
│  3. TOKEN REFRESH (automatic)                                    │
│     ├── Clerk SDK refreshes token before expiry                 │
│     ├── No user interaction required                            │
│     └── Transparent to application code                          │
│                                                                  │
│  4. INACTIVITY TIMEOUT (30 min)                                  │
│     ├── No requests for 30 minutes → session expires            │
│     ├── Next request → redirect to /sign-in                     │
│     └── Previous URL preserved for return after re-auth         │
│                                                                  │
│  5. SESSION REVOCATION                                           │
│     ├── User clicks Sign Out → session destroyed                │
│     ├── Admin removes user → all sessions revoked               │
│     ├── Password change → all other sessions revoked            │
│     └── Account deleted → all sessions revoked                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Session Configuration

| Setting | Value | Rationale |
|---|---|---|
| Session lifetime | 7 days | Balance convenience vs. security for daily users |
| Inactivity timeout | 30 minutes | Healthcare data sensitivity |
| Cookie flags | HttpOnly, Secure, SameSite=Lax | Prevent XSS/CSRF |
| Token format | JWT (RS256) | Stateless verification, Clerk-managed keys |
| Multi-tab support | Yes | Users work in multiple tabs |
| Cross-device | Independent sessions | Each device has its own session |

### 3.3 Session Metadata (Clerk Custom Claims)

```typescript
// Stored in Clerk session claims (publicMetadata)
interface ClerkUserMetadata {
  onboardingComplete: boolean    // Controls middleware redirect
  organizationId?: string        // Cached for fast access
  dbUserId?: string              // Our DB user ID
}

// Set during onboarding completion:
// clerkClient.users.updateUserMetadata(userId, {
//   publicMetadata: { onboardingComplete: true, organizationId, dbUserId }
// })
```

### 3.4 Sign Out

```typescript
// src/components/sign-out-button.tsx

'use client'

import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const { signOut } = useClerk()
  const router = useRouter()

  return (
    <button onClick={() => signOut(() => router.push('/sign-in'))}>
      Sign Out
    </button>
  )
}
```

---

## 4. Authorization — RBAC System

### 4.1 Role Hierarchy

```
   OWNER (5)        ← Full access, billing, delete org
     │
   ADMIN (4)        ← Manage users, approve policies, run assessments
     │
   MANAGER (3)      ← Create content, generate AI, manage tasks
     │
   STAFF (2)        ← Upload evidence, report incidents, update own tasks
     │
   VIEWER (1)       ← Read-only access to all compliance data
```

### 4.2 Complete Permission Matrix

| Action | OWNER | ADMIN | MANAGER | STAFF | VIEWER |
|---|---|---|---|---|---|
| **Dashboard & Compliance** | | | | | |
| View dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| View compliance scores | ✅ | ✅ | ✅ | ✅ | ✅ |
| View compliance gaps | ✅ | ✅ | ✅ | ✅ | ✅ |
| Force recalculate scores | ✅ | ✅ | ✅ | ❌ | ❌ |
| Resolve/accept gaps | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Assessment** | | | | | |
| View assessments | ✅ | ✅ | ✅ | ✅ | ✅ |
| Run new assessment | ✅ | ✅ | ❌ | ❌ | ❌ |
| Calculate assessment | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Evidence** | | | | | |
| View evidence library | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload evidence | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit evidence metadata | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete evidence | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Policies** | | | | | |
| View policies | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/edit policies | ✅ | ✅ | ✅ | ❌ | ❌ |
| Generate AI policies | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve policies | ✅ | ✅ | ❌ | ❌ | ❌ |
| Publish policies | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete policies | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Staff** | | | | | |
| View staff records | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add/edit staff | ✅ | ✅ | ✅ | ❌ | ❌ |
| Deactivate staff | ✅ | ✅ | ❌ | ❌ | ❌ |
| Add training records | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Incidents** | | | | | |
| View incidents | ✅ | ✅ | ✅ | ✅ | ✅ |
| Report incident | ✅ | ✅ | ✅ | ✅ | ❌ |
| Update investigation | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Tasks** | | | | | |
| View all tasks | ✅ | ✅ | ✅ | Own only | ✅ |
| Create tasks | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update any task | ✅ | ✅ | ✅ | Own only† | ❌ |
| Delete manual tasks | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Reports & AI** | | | | | |
| Generate reports | ✅ | ✅ | ✅ | ❌ | ❌ |
| Export PDF/CSV | ✅ | ✅ | ✅ | ❌ | ❌ |
| AI inspection prep | ✅ | ✅ | ✅ | ❌ | ❌ |
| AI compliance chat | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Organization** | | | | | |
| View org settings | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit org settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| Invite users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change user roles | ✅ | ✅ | ❌ | ❌ | ❌ |
| Remove users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Audit** | | | | | |
| View activity log | ✅ | ✅ | ✅ | ❌ | ❌ |

> **†** STAFF can only update `status` and `completionNotes` on tasks assigned to them.

### 4.3 Authorization Enforcement Points

Authorization is enforced at three levels to ensure defence-in-depth:

```
LEVEL 1 — MIDDLEWARE (middleware.ts)
  ├── Is user authenticated? (Clerk JWT verification)
  ├── Is onboarding complete? (session metadata check)
  └── Redirect if not

LEVEL 2 — ROUTE HANDLER (withAuth wrapper)
  ├── Resolve auth context (userId → dbUser → organizationId + role)
  ├── requireMinRole() or requireRole() check
  └── Return 403 Forbidden if insufficient

LEVEL 3 — SERVICE LAYER (Prisma queries)
  ├── Every query includes WHERE organizationId = ?
  ├── STAFF tasks filtered to assignedToId = currentUser
  └── Soft-deleted records excluded (WHERE deletedAt IS NULL)

LEVEL 4 — DATABASE (PostgreSQL RLS)
  └── Secondary safety net — prevents cross-tenant data leakage
      even if application code has a bug
```

### 4.4 Authorization Implementation

```typescript
// src/lib/auth.ts — Full implementation (repeated from 05-API-SERVICES.md for completeness)

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import type { UserRole } from '@prisma/client'

export interface AuthContext {
  userId: string          // Clerk user ID
  dbUserId: string        // Our database user UUID
  organizationId: string  // Organization UUID
  role: UserRole          // OWNER | ADMIN | MANAGER | STAFF | VIEWER
  email: string
  fullName: string
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 1,
  STAFF: 2,
  MANAGER: 3,
  ADMIN: 4,
  OWNER: 5,
}

export async function getAuthContext(): Promise<AuthContext> {
  const { userId } = await auth()
  if (!userId) throw new AuthError('UNAUTHORIZED', 'Authentication required')

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, organizationId: true, deletedAt: true,
    },
  })

  if (!user || user.deletedAt) {
    throw new AuthError('USER_NOT_FOUND', 'User not found or deactivated')
  }
  if (!user.organizationId) {
    throw new AuthError('NO_ORGANIZATION', 'User is not associated with an organization')
  }

  return {
    userId,
    dbUserId: user.id,
    organizationId: user.organizationId,
    role: user.role,
    email: user.email,
    fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
  }
}

export function requireRole(ctx: AuthContext, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(ctx.role)) {
    throw new AuthError('FORBIDDEN', `Requires one of: ${allowedRoles.join(', ')}`)
  }
}

export function requireMinRole(ctx: AuthContext, minRole: UserRole): void {
  if (ROLE_HIERARCHY[ctx.role] < ROLE_HIERARCHY[minRole]) {
    throw new AuthError('FORBIDDEN', `Requires at least ${minRole} role`)
  }
}

export class AuthError extends Error {
  code: 'UNAUTHORIZED' | 'USER_NOT_FOUND' | 'NO_ORGANIZATION' | 'FORBIDDEN'
  statusCode: number

  constructor(code: AuthError['code'], message: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.statusCode =
      code === 'FORBIDDEN' ? 403 :
      code === 'UNAUTHORIZED' ? 401 : 404
  }
}
```

### 4.5 Role Protection Rules

| Rule | Enforcement |
|---|---|
| OWNER role cannot be changed | Route handler blocks `PATCH /organization/users/:id` for OWNER targets |
| Users cannot change their own role | Route handler blocks self-role-change |
| Users cannot remove themselves | Route handler blocks self-removal |
| Only one OWNER per organization | Sign-up creates OWNER; no way to assign additional OWNERs via UI |
| Invited users default to assigned role | Invite specifies ADMIN, MANAGER, STAFF, or VIEWER |
| Deactivated users are denied access | `getAuthContext()` checks `deletedAt IS NULL` |

---

## 5. Multi-Tenancy Isolation

### 5.1 Isolation Strategy

Every piece of user data belongs to exactly one organization. Isolation is enforced at multiple layers.

```
┌─────────────────────────────────────────────────────────────────────┐
│  PRIMARY: Application Layer (Prisma)                                 │
│                                                                      │
│  Every query includes: WHERE organizationId = ctx.organizationId    │
│                                                                      │
│  // ✅ CORRECT                                                      │
│  db.evidence.findMany({                                             │
│    where: { organizationId: auth.organizationId, deletedAt: null }  │
│  })                                                                  │
│                                                                      │
│  // ❌ NEVER — Missing org scope                                    │
│  db.evidence.findMany({                                             │
│    where: { id: someId }                                            │
│  })                                                                  │
├─────────────────────────────────────────────────────────────────────┤
│  SECONDARY: Database Layer (PostgreSQL RLS)                          │
│                                                                      │
│  RLS policies on all data tables ensure that even if application    │
│  code has a bug, cross-tenant data cannot be accessed.              │
│                                                                      │
│  Note: Prisma connects via service role (bypasses RLS).             │
│  RLS protects against direct Supabase client access only.           │
├─────────────────────────────────────────────────────────────────────┤
│  TERTIARY: File Storage (Supabase Storage)                           │
│                                                                      │
│  Storage path: {organizationId}/{category}/{year}/{uuid}-{file}     │
│  Access: Signed URLs only (no public bucket access)                 │
│  TTL: 7 days for evidence, 24 hours for reports                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Database-Level RLS Policies

```sql
-- Applied via Prisma migration (prisma/migrations/XXX_enable_rls.sql)

-- Enable RLS on all user-data tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Service role bypass (Prisma uses service role connection)
-- This is necessary because Prisma queries go through the service role
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- Anon/authenticated role policies (for direct Supabase client, e.g. Storage)
-- Users can only access data in their own organization
CREATE POLICY "tenant_isolation_users" ON users
  FOR ALL
  USING (organization_id = (
    SELECT organization_id FROM users WHERE clerk_id = auth.uid()
  ));

-- CQC reference tables: public read
CREATE POLICY "public_read_cqc_domains" ON cqc_domains FOR SELECT USING (true);
CREATE POLICY "public_read_cqc_kloes" ON cqc_kloes FOR SELECT USING (true);
CREATE POLICY "public_read_cqc_regulations" ON cqc_regulations FOR SELECT USING (true);
```

### 5.3 Cross-Tenant Access Prevention Checklist

| Vector | Mitigation |
|---|---|
| URL parameter manipulation (`/evidence/other-org-id`) | `WHERE organizationId = ctx.organizationId` on every query |
| API request body (`{ organizationId: "other-org" }`) | `organizationId` is NEVER accepted from client input; always from auth context |
| Bulk operations | All bulk queries scoped by org |
| Foreign key references | Service layer validates that referenced records belong to same org |
| File access | Signed URLs include org-specific storage paths |
| Webhooks | Clerk webhook verifies Svix signature; no org data in webhook payload |
| Cron jobs | Iterate orgs individually; never mix data across orgs |

---

## 6. API Security

### 6.1 Rate Limiting

| Category | Limit | Window | Protects Against |
|---|---|---|---|
| `default` | 60 req | 60s | General abuse |
| `assessment` | 10 req | 60s | CPU-intensive calculation |
| `aiGeneration` | 5 req | 60s | Expensive AI API costs |
| `upload` | 20 req | 60s | Storage abuse |
| `export` | 5 req | 5 min | PDF/CSV generation load |
| `cron` | 1 req | 60s | Prevent manual cron spam |

Rate limiting is per-user (identified by `dbUserId`). In production, the in-memory LRU cache should be replaced with Vercel KV (Redis) for multi-instance consistency.

### 6.2 Input Validation

Every API mutation validates input using Zod schemas before any business logic executes.

| Validation Type | Implementation | Examples |
|---|---|---|
| Type checking | Zod schema `.parse()` | Strings, numbers, booleans, dates |
| Length limits | `.min()` / `.max()` | Names: 1-255, descriptions: 1-5000 |
| Format validation | `.email()`, `.url()`, `.uuid()`, `.regex()` | Email addresses, KLOE codes, UUID params |
| Enum restriction | `.enum()` | Roles, statuses, severities, categories |
| Array limits | `.array().max()` | KLOE codes max 25, tags max 20 |
| File size | Manual check in upload handler | 50MB max |
| MIME type | Manual check against allowlist | PDF, images, Office docs, CSV, text |
| Nested objects | `.object()` nesting | Assessment answers, date ranges |

### 6.3 CORS Configuration

```typescript
// next.config.ts

const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL || '' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ]
  },
}
```

### 6.4 Request Size Limits

| Endpoint | Max Body Size | Enforced By |
|---|---|---|
| Standard API routes | 4.5 MB | Vercel default |
| File upload (`/api/evidence/upload`) | 50 MB | Custom check + Vercel config |
| AI chat | 50 KB (message + history) | Zod schema: message 5000 chars, history 20 msgs |
| Webhook | 1 MB | Svix standard |

```typescript
// next.config.ts — Increase body size for upload routes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}
```

---

## 7. Data Protection & Encryption

### 7.1 Encryption Standards

| Data State | Method | Standard | Where |
|---|---|---|---|
| At rest (database) | AES-256 | FIPS 140-2 | Supabase PostgreSQL (eu-west-2) |
| At rest (files) | AES-256 | FIPS 140-2 | Supabase Storage (eu-west-2) |
| At rest (backups) | AES-256 | FIPS 140-2 | Supabase automated backups |
| In transit (client ↔ server) | TLS 1.2+ | RFC 8446 | Vercel Edge (automatic HTTPS) |
| In transit (server ↔ DB) | TLS 1.2+ | — | Supabase connection string (SSL mode) |
| In transit (server ↔ AI) | TLS 1.2+ | — | Anthropic API (HTTPS) |
| In transit (server ↔ email) | TLS 1.2+ | — | Resend API (HTTPS) |
| Passwords | bcrypt (Clerk-managed) | — | Never stored in our database |
| Session tokens | RS256 JWT (Clerk-managed) | RFC 7519 | Clerk infrastructure |

### 7.2 Sensitive Data Classification

| Classification | Examples | Storage Rules |
|---|---|---|
| **CRITICAL** | Clerk secret key, Supabase service role key, DB password | Environment variables only, never logged |
| **HIGH** | Patient-adjacent data (incident descriptions, staff records) | Encrypted at rest, org-scoped, audit logged |
| **MEDIUM** | Compliance scores, policy content, evidence metadata | Encrypted at rest, org-scoped |
| **LOW** | CQC reference data, KLOE definitions, regulation text | Public read, no org scope |

### 7.3 Data Minimization

| Principle | Implementation |
|---|---|
| No patient PII stored | Platform tracks compliance metadata, not patient records |
| Minimal Clerk data synced | Only: clerkId, email, firstName, lastName, avatarUrl |
| AI requests contain no PII | Policy generation uses org metadata, not patient data |
| Evidence files may contain PII | Stored encrypted, signed URLs, time-limited access |
| Logs exclude sensitive values | Audit logs store field names and non-sensitive diffs only |

---

## 8. UK GDPR Compliance

### 8.1 Lawful Basis for Processing

| Data Category | Lawful Basis | Article |
|---|---|---|
| User account data (email, name) | Contract performance | Art. 6(1)(b) |
| Compliance assessment data | Legitimate interest | Art. 6(1)(f) |
| Staff records (names, qualifications) | Legitimate interest | Art. 6(1)(f) |
| Incident reports | Legal obligation | Art. 6(1)(c) |
| Evidence documents | Legitimate interest | Art. 6(1)(f) |
| Email notifications | Consent (toggleable) | Art. 6(1)(a) |
| Analytics/cookies | Consent | Art. 6(1)(a) |

### 8.2 Data Subject Rights Implementation

| Right | How We Fulfill It |
|---|---|
| **Right of access** (Art. 15) | Settings page: "Download my data" button → exports user's data as JSON/CSV |
| **Right to rectification** (Art. 16) | Users can edit their profile; admins can correct staff records |
| **Right to erasure** (Art. 17) | "Delete my account" → soft delete + 30-day purge window; OWNER can request full org deletion |
| **Right to restrict processing** (Art. 18) | Account deactivation freezes all data processing for that user |
| **Right to data portability** (Art. 20) | Export compliance data as structured JSON; evidence files downloadable |
| **Right to object** (Art. 21) | Email notification opt-out in user preferences |

### 8.3 Data Processing Agreement (DPA) Requirements

As a data processor for healthcare organizations, we must maintain DPAs with:

| Sub-Processor | Data Processed | DPA Status |
|---|---|---|
| **Supabase** | All database records, file storage | DPA available (GDPR-compliant) |
| **Clerk** | User auth data (email, name, session) | DPA available (GDPR-compliant) |
| **Vercel** | Request logs, edge caching | DPA available (GDPR-compliant) |
| **Anthropic** | AI prompts (no PII) | DPA available |
| **Resend** | Email addresses, notification content | DPA available (GDPR-compliant) |
| **Sentry** | Error logs (PII scrubbed) | DPA available (GDPR-compliant) |

### 8.4 Data Retention Policy

| Data Type | Retention Period | After Expiry |
|---|---|---|
| Active user accounts | Lifetime of subscription | Soft delete on cancellation |
| Soft-deleted users | 30 days | Permanent deletion |
| Compliance assessments | 7 years | Auto-archive |
| Evidence documents | 7 years (or until manually deleted) | Archive to cold storage |
| Audit logs (ActivityLog) | 7 years (NHS Records Management Code) | Archive to cold storage |
| Incident reports | 7 years minimum | Archive |
| Session/auth logs (Clerk) | 1 year | Auto-purged by Clerk |
| AI chat conversations | Not persisted | Stateless per request |
| Error logs (Sentry) | 90 days | Auto-purged |

### 8.5 Breach Notification Capability

Per UK GDPR Article 33, breaches must be reported to the ICO within 72 hours.

```
BREACH RESPONSE TIMELINE:
─────────────────────────────────────────────────────────────
  0h         Breach detected (Sentry alert, user report, audit anomaly)
  │
  1h         Incident response team notified
  │          Initial assessment: scope, affected data, affected users
  │
  4h         Containment measures implemented
  │          (Revoke tokens, disable endpoints, isolate affected data)
  │
  24h        Full impact assessment completed
  │          Decision: reportable to ICO? (risk to individuals?)
  │
  72h        ICO notification (if required)
  │          Via: https://ico.org.uk/make-a-complaint/data-protection-complaints/
  │
  72h+       Affected users notified (if high risk to individuals)
             Remediation plan executed
─────────────────────────────────────────────────────────────
```

---

## 9. NHS Data Security & Protection Toolkit (DSPT)

### 9.1 DSPT Alignment

The NHS DSPT requires annual submission demonstrating compliance with 10 Data Security Standards. Our platform supports organizations in meeting these standards and itself complies with them.

| Standard | Requirement | Our Implementation |
|---|---|---|
| **1. Leadership** | Senior management oversight | OWNER role has full access; audit trail shows accountability |
| **2. Confidentiality** | Staff understand data handling obligations | Role-based access; training tracking module |
| **3. Training** | All staff complete data security training | Training records with expiry alerts; mandatory course tracking |
| **4. Managing access** | Only authorized access to data | RBAC with 5 roles; organizationId scoping; audit logging |
| **5. Process reviews** | Regular security process reviews | Weekly compliance recalculation; expiry check cron jobs |
| **6. Responding to incidents** | Incident reporting and management | Full incident management module with severity levels |
| **7. Business continuity** | Continuity planning | Supabase automated backups; Vercel multi-region |
| **8. Unsupported systems** | No unsupported software | Modern tech stack; automated dependency updates |
| **9. IT protection** | Technical security controls | Encryption, TLS, rate limiting, input validation |
| **10. Accountable suppliers** | Sub-processor management | DPAs with all sub-processors (Section 8.3) |

### 9.2 DSPT Annual Submission Support

The platform helps organizations prepare their DSPT submission by:

| Feature | DSPT Evidence It Provides |
|---|---|
| Staff training matrix | Evidence for Standards 2 & 3 (training completion rates) |
| RBAC access control | Evidence for Standard 4 (access management) |
| Activity/audit logs | Evidence for Standards 4 & 5 (access monitoring, process reviews) |
| Incident management | Evidence for Standard 6 (incident response capability) |
| Policy management | Evidence for Standards 1, 4, 5 (governance policies) |
| Evidence library | Central repository for all DSPT submission evidence |
| Compliance reports | Exportable reports for DSPT submission documentation |

---

## 10. Cyber Essentials Alignment

### 10.1 Five Technical Controls

| Control | Our Implementation |
|---|---|
| **1. Firewalls** | Vercel edge network acts as WAF; Supabase network rules restrict DB access to authorized IPs; no direct public database exposure |
| **2. Secure Configuration** | Environment-based config; no default passwords; Clerk enforces strong passwords; production builds strip debug info |
| **3. User Access Control** | 5-tier RBAC; MFA available; session timeout (30 min inactivity); account lockout after failed attempts |
| **4. Malware Protection** | Server-side: no user-executable code on servers; uploaded files are stored as blobs, never executed; MIME type validation on uploads |
| **5. Security Update Management** | Dependabot automated PRs for dependencies; Node.js LTS; weekly dependency audits via `npm audit` |

---

## 11. File Storage Security

### 11.1 Storage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  SUPABASE STORAGE (eu-west-2)                                    │
│                                                                  │
│  Bucket: compliance-files (PRIVATE — no public access)          │
│                                                                  │
│  Path Convention:                                                │
│  {organizationId}/{category}/{year}/{uuid}-{sanitized_filename} │
│                                                                  │
│  Categories:                                                     │
│  ├── evidence/    (PDFs, images, documents)                     │
│  ├── policies/    (generated policy PDFs)                       │
│  ├── training/    (certificates, completion records)            │
│  ├── reports/     (exported compliance reports)                 │
│  └── avatars/     (user profile photos)                         │
│                                                                  │
│  Access Method: Signed URLs ONLY                                │
│  ├── Evidence/policies/training: 7-day expiry                   │
│  ├── Reports: 24-hour expiry                                    │
│  └── No direct bucket access from browser                       │
│                                                                  │
│  Encryption: AES-256 at rest (Supabase default)                 │
│  Max File Size: 50 MB                                           │
│  MIME Validation: Server-side allowlist check                   │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 File Upload Security Controls

| Control | Implementation |
|---|---|
| Authentication required | `withAuth()` wrapper; `requireMinRole('STAFF')` |
| File size limit | 50 MB; checked before upload |
| MIME type allowlist | PDF, JPEG, PNG, WebP, GIF, Word, Excel, CSV, text |
| Filename sanitization | `filename.replace(/[^a-zA-Z0-9._-]/g, '_')` |
| Path includes UUID | Prevents filename collision and enumeration |
| Org-scoped path | Files stored under `{orgId}/` — cannot access other orgs' files |
| Signed URL access | Time-limited, non-guessable URLs |
| No execution | Files stored as blobs; no server-side processing that could execute code |
| Rate limited | 20 uploads per minute per user |

### 11.3 Allowed MIME Types

```typescript
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
]
```

---

## 12. Webhook Security

### 12.1 Clerk Webhook Verification

All incoming Clerk webhooks are verified using Svix signatures before processing.

```typescript
// Verification flow in /api/webhooks/clerk/route.ts

// 1. Extract Svix headers
const svixId = req.headers.get('svix-id')
const svixTimestamp = req.headers.get('svix-timestamp')
const svixSignature = req.headers.get('svix-signature')

// 2. Reject if any header missing
if (!svixId || !svixTimestamp || !svixSignature) {
  return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
}

// 3. Verify signature using CLERK_WEBHOOK_SECRET
const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
const event = wh.verify(body, {
  'svix-id': svixId,
  'svix-timestamp': svixTimestamp,
  'svix-signature': svixSignature,
})

// 4. Process verified event (user.created, user.updated, etc.)
```

### 12.2 Webhook Security Rules

| Rule | Implementation |
|---|---|
| Signature verification | Svix HMAC signature on every request |
| Timestamp validation | Svix rejects requests older than 5 minutes (replay protection) |
| Idempotency | `svix-id` header used as idempotency key |
| No sensitive data in response | Webhook handler returns `{ received: true }` only |
| Error isolation | Webhook failures don't affect user-facing operations |
| Rate limiting | Clerk controls webhook delivery rate |
| HTTPS only | Clerk requires HTTPS webhook endpoints |

### 12.3 Cron Job Security

```typescript
// Cron endpoints secured by bearer token
const authHeader = req.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

| Rule | Implementation |
|---|---|
| Bearer token auth | `CRON_SECRET` environment variable |
| Vercel Cron only | Configured in `vercel.json`, Vercel injects the secret |
| Rate limited | 1 request per 60 seconds (prevents manual trigger abuse) |
| Idempotent | Jobs can safely run multiple times without side effects |
| Logging | Summary object returned and logged for monitoring |

---

## 13. Audit Trail & Logging

### 13.1 What Gets Logged

Every state-changing operation is recorded in the `activity_logs` table.

| Field | Content | Example |
|---|---|---|
| `userId` | Actor who performed the action | `user_uuid` |
| `actorRole` | Role at time of action | `ADMIN` |
| `action` | Machine-readable action code | `EVIDENCE_UPLOADED` |
| `entityType` | What type of record was affected | `Evidence` |
| `entityId` | UUID of the affected record | `evidence_uuid` |
| `description` | Human-readable description | "Uploaded evidence: Fire Safety Certificate (CERTIFICATE)" |
| `metadata.previousValues` | State before change | `{ status: "DRAFT" }` |
| `metadata.newValues` | State after change | `{ status: "PUBLISHED" }` |
| `ipAddress` | Client IP (from request headers) | `203.0.113.42` |
| `userAgent` | Client browser/device | `Mozilla/5.0...` |
| `createdAt` | Timestamp | `2026-02-10T14:30:00Z` |

### 13.2 Retention & Access

| Aspect | Policy |
|---|---|
| Retention period | 7 years (NHS Records Management Code of Practice) |
| Access | MANAGER+ can view in UI; VIEWER and STAFF cannot |
| Immutability | Logs are append-only; no UPDATE or DELETE on activity_logs |
| Export | Included in compliance reports; exportable as CSV |
| Archival | After 2 years: move to cold storage (Supabase archive) |

### 13.3 Logged Actions

28 action types across all modules (see `05-API-SERVICES.md` Section 25 for complete reference):

| Category | Actions |
|---|---|
| Assessment | `ASSESSMENT_STEP_SAVED`, `ASSESSMENT_CALCULATED` |
| Evidence | `EVIDENCE_UPLOADED`, `EVIDENCE_UPDATED`, `EVIDENCE_DELETED` |
| Policy | `POLICY_CREATED`, `POLICY_AI_GENERATED`, `POLICY_UPDATED`, `POLICY_APPROVED`, `POLICY_PUBLISHED`, `POLICY_DELETED` |
| Staff | `STAFF_CREATED`, `STAFF_UPDATED`, `STAFF_DEACTIVATED` |
| Training | `TRAINING_RECORDED`, `TRAINING_UPDATED`, `TRAINING_DELETED` |
| Incidents | `INCIDENT_REPORTED`, `INCIDENT_UPDATED` |
| Tasks | `TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED` |
| Compliance | `GAP_STATUS_UPDATED` |
| Users | `USER_INVITED`, `USER_ROLE_CHANGED`, `USER_REMOVED` |
| Organization | `ORGANIZATION_UPDATED` |
| Reports | `REPORT_EXPORTED`, `INSPECTION_PREP_GENERATED` |

### 13.4 Error & Application Logging

| Log Type | Tool | Retention | PII Policy |
|---|---|---|---|
| Application errors | Sentry | 90 days | Scrub emails, names, tokens before sending |
| API errors | `console.error` + Vercel Logs | 30 days (Vercel) | Log error codes and entity IDs, not request bodies |
| Auth failures | Clerk Dashboard | 1 year | Clerk manages |
| Cron job results | `console.log` + Vercel Logs | 30 days | Summary counts only, no PII |
| Rate limit hits | In-memory (not persisted) | Session only | — |

### 13.5 Sentry PII Scrubbing

```typescript
// sentry.client.config.ts

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  beforeSend(event) {
    // Strip PII from error reports
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
    }
    if (event.request?.data) {
      // Redact known PII fields
      const sensitiveFields = ['email', 'password', 'firstName', 'lastName', 'phone']
      for (const field of sensitiveFields) {
        if (typeof event.request.data === 'object' && field in event.request.data) {
          (event.request.data as any)[field] = '[REDACTED]'
        }
      }
    }
    return event
  },

  // Don't send PII in breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'fetch' && breadcrumb.data?.url?.includes('/api/')) {
      delete breadcrumb.data.body
    }
    return breadcrumb
  },
})
```

---

## 14. Environment & Secrets Management

### 14.1 Environment Variables

```bash
# ─── CRITICAL (server-side only — NEVER prefix with NEXT_PUBLIC_) ───
CLERK_SECRET_KEY=sk_live_...            # Clerk server key
CLERK_WEBHOOK_SECRET=whsec_...          # Svix webhook verification
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Bypasses RLS — CRITICAL
DATABASE_URL=postgresql://...           # Pooled connection (PgBouncer)
DIRECT_URL=postgresql://...             # Direct connection (migrations only)
ANTHROPIC_API_KEY=sk-ant-...            # AI service
RESEND_API_KEY=re_...                   # Email sending
CRON_SECRET=cron_...                    # Cron job authentication
SENTRY_DSN=https://...                  # Error tracking (server)

# ─── PUBLIC (safe for browser — prefixed with NEXT_PUBLIC_) ───
NEXT_PUBLIC_APP_URL=https://app.cqc-compliance.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...  # Clerk browser key
NEXT_PUBLIC_SUPABASE_URL=https://...    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...    # Supabase anon key (RLS-restricted)
NEXT_PUBLIC_SENTRY_DSN=https://...      # Error tracking (client)
```

### 14.2 Secrets Management Rules

| Rule | Implementation |
|---|---|
| Never commit secrets to git | `.env.local` in `.gitignore`; secrets in Vercel dashboard |
| Server-side secrets have no `NEXT_PUBLIC_` prefix | Ensures they're never bundled in client JavaScript |
| Rotate keys quarterly | Calendar reminder; Clerk/Supabase support key rotation |
| Different keys per environment | Separate Clerk projects for dev/staging/prod |
| Service role key restricted | Used only by Prisma (server-side); never exposed to client |
| Monitor for leaked secrets | GitHub secret scanning enabled; Clerk key compromise alerts |

### 14.3 Environment Separation

| Environment | Clerk Project | Supabase Project | Purpose |
|---|---|---|---|
| `development` | `cqc-dev` | `cqc-dev` | Local development |
| `staging` | `cqc-staging` | `cqc-staging` | Pre-production testing |
| `production` | `cqc-prod` | `cqc-prod` | Live production |

---

## 15. Security Headers & Browser Protections

### 15.1 Security Headers Configuration

```typescript
// next.config.ts

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.cqc-compliance.com https://*.clerk.accounts.dev",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://img.clerk.com",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://clerk.cqc-compliance.com https://*.clerk.accounts.dev https://*.sentry.io",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
    ]
  },
}
```

### 15.2 Cookie Security

| Cookie | Flags | Managed By |
|---|---|---|
| `__session` (Clerk) | HttpOnly, Secure, SameSite=Lax, Path=/ | Clerk SDK |
| `__client_uat` (Clerk) | Secure, SameSite=Lax | Clerk SDK |

We do NOT set any custom cookies. All session management is handled by Clerk.

---

## 16. Incident Response & Breach Notification

### 16.1 Security Incident Classification

| Severity | Examples | Response Time |
|---|---|---|
| **P1 — Critical** | Data breach, unauthorized data access, credential compromise | Immediate (within 1 hour) |
| **P2 — High** | Authentication bypass, privilege escalation, DDoS attack | Within 4 hours |
| **P3 — Medium** | Suspicious login patterns, rate limit abuse, failed auth spikes | Within 24 hours |
| **P4 — Low** | Dependency vulnerability (no known exploit), minor config issue | Within 1 week |

### 16.2 Incident Response Procedure

```
STEP 1: DETECT
  ├── Sentry alerts (application errors, unusual patterns)
  ├── Clerk alerts (brute force, suspicious logins)
  ├── User reports (via support channel)
  └── Automated monitoring (cron anomaly detection)

STEP 2: CONTAIN
  ├── Revoke affected sessions (Clerk API)
  ├── Disable compromised API keys (rotate immediately)
  ├── Block suspicious IPs (Vercel/Cloudflare WAF)
  └── Take affected endpoints offline if needed

STEP 3: ASSESS
  ├── Query audit logs for scope of access
  ├── Identify affected organizations and data
  ├── Determine root cause
  └── Document timeline

STEP 4: NOTIFY (if data breach)
  ├── ICO within 72 hours (UK GDPR Art. 33)
  ├── Affected data subjects without undue delay (Art. 34)
  ├── Affected organizations (contractual obligation)
  └── Document notification sent and responses

STEP 5: REMEDIATE
  ├── Fix root cause
  ├── Deploy patch
  ├── Rotate all potentially compromised credentials
  ├── Enhance monitoring for similar attacks
  └── Update security documentation

STEP 6: REVIEW
  ├── Post-incident review within 5 business days
  ├── Update incident response plan
  ├── Implement preventive measures
  └── File incident report for compliance records
```

---

## 17. User Invitation & Onboarding Security

### 17.1 Invitation Flow

```
OWNER/ADMIN clicks "Invite User"
    │
    ▼
API validates: email, role (ADMIN/MANAGER/STAFF/VIEWER)
    │
    ▼
Create pending user record (clerkId = "pending_{uuid}", isInvitePending = true)
    │
    ▼
Send invitation email via Resend (contains sign-up URL with invite token)
    │
    ▼
Invitee clicks link → /sign-up?invite={userId}
    │
    ▼
Invitee completes Clerk sign-up (email verification required)
    │
    ▼
Clerk webhook fires user.created → matches email to pending record
    │
    ▼
Pending user record updated: clerkId set, isInvitePending = false
    │
    ▼
User accesses platform with pre-assigned role and organization
    │
    ▼
Invited users SKIP onboarding assessment (org already onboarded)
```

### 17.2 Invitation Security Controls

| Control | Implementation |
|---|---|
| Email verification | Clerk requires email verification on sign-up |
| Role assignment | Only OWNER/ADMIN can invite; cannot invite as OWNER |
| Duplicate prevention | Check email uniqueness per organization before creating invite |
| Invitation link | Time-limited sign-up URL (inherent via Clerk sign-up) |
| No sensitive data in email | Invite email contains org name and role only; no credentials |
| Pending user cleanup | Unclaimed invitations are visible in user management; can be revoked |

### 17.3 Onboarding Security

| Step | Security Measure |
|---|---|
| Welcome page | Authenticated (Clerk middleware); only shown if `onboardingComplete = false` |
| Organization setup | Creates org in DB; assigns current user as OWNER |
| Assessment wizard | Answers saved per step; can resume if browser closes |
| Assessment calculation | Rate limited (10/min); heavy operation |
| Onboarding completion | Sets `onboardingComplete = true` in Clerk metadata AND DB |
| Post-onboarding | Middleware prevents return to onboarding pages |

---

## 18. Dependency & Supply Chain Security

### 18.1 Dependency Management

| Practice | Implementation |
|---|---|
| Automated vulnerability scanning | Dependabot alerts + PRs (GitHub) |
| Weekly audit | `npm audit` in CI pipeline |
| Lock file committed | `package-lock.json` committed; `npm ci` in production |
| Minimal dependencies | Prefer built-in APIs over third-party packages |
| Security-critical packages | Clerk, Svix, Prisma — monitor release notes |
| Node.js version | LTS (20.x); auto-update patch versions |

### 18.2 Key Dependencies Security Status

| Package | Purpose | Security Posture |
|---|---|---|
| `@clerk/nextjs` | Authentication | SOC 2 Type II certified; regular security audits |
| `@prisma/client` | Database ORM | Open-source; active security team; parameterized queries prevent SQL injection |
| `@supabase/supabase-js` | Storage client | SOC 2 Type II; GDPR-compliant |
| `@anthropic-ai/sdk` | AI integration | SOC 2 Type II; no data retention on API calls |
| `svix` | Webhook verification | Purpose-built for secure webhooks; HMAC signatures |
| `resend` | Email sending | SOC 2 Type II; GDPR-compliant |
| `zod` | Input validation | Type-safe; prevents injection; zero dependencies |
| `lru-cache` | Rate limiting | Zero dependencies; well-audited |
| `next` | Framework | Vercel-maintained; rapid security patches |

---

## 19. Security Checklist — Pre-Launch

### 19.1 Authentication & Access

- [ ] Clerk production instance configured (not test keys)
- [ ] Strong password policy enforced (8+ chars, upper, lower, number, special)
- [ ] Brute force protection enabled (5 attempts, 15 min lockout)
- [ ] MFA available and documented for users
- [ ] OAuth providers configured (Google, Microsoft)
- [ ] Session timeout set to 30 minutes inactivity
- [ ] Webhook endpoint configured with Svix verification
- [ ] All non-public routes require authentication

### 19.2 Authorization

- [ ] RBAC enforced on every API route handler
- [ ] STAFF users can only access own tasks (verified)
- [ ] VIEWER users have read-only access (verified)
- [ ] OWNER role protections in place (cannot change own role, cannot be removed)
- [ ] organizationId scoping on every Prisma query (verified with code review)

### 19.3 Data Protection

- [ ] All connections use TLS 1.2+ (Vercel enforced)
- [ ] Database encryption at rest enabled (Supabase default)
- [ ] Storage bucket set to private (no public access)
- [ ] Signed URLs configured with appropriate TTLs
- [ ] No PII in AI API requests (verified)
- [ ] Sentry PII scrubbing configured
- [ ] Environment variables set in Vercel dashboard (not committed)
- [ ] Service role key used server-side only

### 19.4 Compliance

- [ ] Privacy policy published and accessible
- [ ] Cookie consent banner implemented
- [ ] Data Subject Access Request process documented
- [ ] Data Processing Agreements signed with all sub-processors
- [ ] Data retention policy implemented
- [ ] UK data residency confirmed (Supabase eu-west-2)
- [ ] DSPT alignment documented for customers
- [ ] ICO breach notification process documented

### 19.5 Application Security

- [ ] All security headers configured (HSTS, CSP, X-Frame-Options, etc.)
- [ ] Rate limiting active on all endpoints
- [ ] Input validation on every mutation (Zod schemas)
- [ ] File upload: MIME type validation, size limits, filename sanitization
- [ ] CORS restricted to app domain only
- [ ] Error responses don't leak internal details
- [ ] No stack traces in production responses
- [ ] `npm audit` clean (no critical/high vulnerabilities)

### 19.6 Monitoring & Response

- [ ] Sentry configured and receiving errors
- [ ] Clerk webhook events flowing correctly
- [ ] Cron jobs running on schedule
- [ ] Audit logging working for all mutation types
- [ ] Incident response plan documented and shared with team
- [ ] Security contact email published (security@cqc-compliance.com)

---

> **End of 06-AUTH-SECURITY.md** — This specification defines the complete security posture for the CQC Compliance Platform. Authentication flows reference `03-UI-UX.md` screens, RBAC enforcement maps to every endpoint in `05-API-SERVICES.md`, multi-tenancy isolation builds on the database architecture in `02-DATABASE.md`, and regulatory compliance supports the CQC framework requirements in `04-CQC-FRAMEWORK.md`.
