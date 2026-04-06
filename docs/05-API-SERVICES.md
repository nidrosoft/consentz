# CQC Compliance Platform — API Services & Business Logic Layer

> **File 5 of 7** | The nervous system connecting every screen to every data operation
> **Runtime:** Next.js 15 Route Handlers (App Router `app/api/`)
> **ORM:** Prisma 5.x → Supabase PostgreSQL (`eu-west-2`)
> **Auth:** Clerk middleware on every request | **Validation:** Zod on every input
> **Last Updated:** February 2026
> **Companion Files:** `01-ARCHITECTURE.md` · `02-DATABASE.md` · `03-UI-UX.md` · `04-CQC-FRAMEWORK.md`

---

## Table of Contents

1. [API Architecture Overview](#1-api-architecture-overview)
2. [Authentication & Authorization Middleware](#2-authentication--authorization-middleware)
3. [Standard API Response Contract](#3-standard-api-response-contract)
4. [Error Handling Framework](#4-error-handling-framework)
5. [Rate Limiting](#5-rate-limiting)
6. [Zod Validation Schemas — Complete Library](#6-zod-validation-schemas--complete-library)
7. [Route Handlers — Assessment](#7-route-handlers--assessment)
8. [Route Handlers — Compliance Score & Gaps](#8-route-handlers--compliance-score--gaps)
9. [Route Handlers — Evidence Management](#9-route-handlers--evidence-management)
10. [Route Handlers — Policy Management](#10-route-handlers--policy-management)
11. [Route Handlers — Staff Management](#11-route-handlers--staff-management)
12. [Route Handlers — Training Records](#12-route-handlers--training-records)
13. [Route Handlers — Incident Reporting](#13-route-handlers--incident-reporting)
14. [Route Handlers — Task Management](#14-route-handlers--task-management)
15. [Route Handlers — Notifications](#15-route-handlers--notifications)
16. [Route Handlers — Reports & Export](#16-route-handlers--reports--export)
17. [Route Handlers — Organization & Settings](#17-route-handlers--organization--settings)
18. [Route Handlers — Dashboard Aggregation](#18-route-handlers--dashboard-aggregation)
19. [AI Service Layer](#19-ai-service-layer)
20. [Webhook Handlers](#20-webhook-handlers)
21. [Background Jobs (Inngest / Cron)](#21-background-jobs-inngest--cron)
22. [Service Layer — Business Logic Classes](#22-service-layer--business-logic-classes)
23. [TanStack Query Hooks — Client Integration](#23-tanstack-query-hooks--client-integration)
24. [File Upload & Storage Service](#24-file-upload--storage-service)
25. [Audit Logging Service](#25-audit-logging-service)
26. [Notification Dispatch Service](#26-notification-dispatch-service)
27. [API Route Map — Quick Reference](#27-api-route-map--quick-reference)

---


## 1. API Architecture Overview

### 1.1 Request Lifecycle

Every API request flows through an identical pipeline. No exceptions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REQUEST LIFECYCLE                                    │
│                                                                             │
│  ① INCOMING REQUEST                                                        │
│     │                                                                       │
│     ▼                                                                       │
│  ② CLERK MIDDLEWARE (middleware.ts)                                         │
│     ├── Verify JWT/session token                                           │
│     ├── Reject if unauthenticated (except public routes)                   │
│     ├── Attach userId to request context                                   │
│     └── Check onboarding status → redirect if incomplete                   │
│     │                                                                       │
│     ▼                                                                       │
│  ③ RATE LIMITER                                                            │
│     ├── Check per-user rate (sliding window)                               │
│     ├── Return 429 if exceeded                                             │
│     └── Pass through                                                        │
│     │                                                                       │
│     ▼                                                                       │
│  ④ ROUTE HANDLER (app/api/.../route.ts)                                    │
│     ├── Extract userId from Clerk auth()                                   │
│     ├── Look up User + organizationId from DB                              │
│     ├── Validate input with Zod schema                                     │
│     ├── Check role-based authorization (RBAC)                              │
│     └── Delegate to Service Layer                                           │
│     │                                                                       │
│     ▼                                                                       │
│  ⑤ SERVICE LAYER (lib/services/*.ts)                                       │
│     ├── All business logic lives here                                      │
│     ├── Prisma queries scoped by organizationId                            │
│     ├── Compliance engine calculations                                     │
│     ├── AI integration calls                                               │
│     └── File storage operations                                             │
│     │                                                                       │
│     ▼                                                                       │
│  ⑥ AUDIT LOG                                                               │
│     ├── Write ActivityLog record for mutations                             │
│     └── Skip for read-only operations (GET)                                │
│     │                                                                       │
│     ▼                                                                       │
│  ⑦ RESPONSE                                                                │
│     ├── Success: { data, meta? }                                           │
│     ├── Error: { error: { code, message, details? } }                      │
│     └── Set appropriate HTTP status code                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 File Location Convention

```
src/app/api/
  ├── webhooks/clerk/route.ts          # Public — no auth
  ├── assessment/
  │   ├── route.ts                     # POST save, GET list
  │   ├── calculate/route.ts           # POST run scoring engine
  │   └── [id]/route.ts               # GET single assessment
  ├── compliance/
  │   ├── score/route.ts               # GET current, POST recalculate
  │   └── gaps/
  │       ├── route.ts                 # GET list gaps
  │       └── [id]/route.ts           # PATCH update gap status
  ├── evidence/
  │   ├── route.ts                     # GET list, POST create metadata
  │   ├── upload/route.ts              # POST file upload to Supabase Storage
  │   └── [id]/route.ts               # GET, PATCH, DELETE single
  ├── policies/
  │   ├── route.ts                     # GET list, POST create
  │   ├── generate/route.ts            # POST AI policy generation
  │   ├── templates/route.ts           # GET available templates
  │   └── [id]/
  │       ├── route.ts                 # GET, PATCH, DELETE single
  │       ├── approve/route.ts         # POST approve policy
  │       ├── publish/route.ts         # POST publish policy
  │       └── versions/route.ts        # GET version history
  ├── staff/
  │   ├── route.ts                     # GET list, POST create
  │   ├── [id]/
  │   │   ├── route.ts                 # GET, PATCH, DELETE single
  │   │   └── training/route.ts        # GET training for staff member
  │   └── training/
  │       ├── route.ts                 # GET all training, POST create record
  │       └── [id]/route.ts           # GET, PATCH, DELETE single record
  ├── incidents/
  │   ├── route.ts                     # GET list, POST create
  │   └── [id]/route.ts               # GET, PATCH single
  ├── tasks/
  │   ├── route.ts                     # GET list, POST create
  │   └── [id]/route.ts               # GET, PATCH, DELETE single
  ├── reports/
  │   ├── generate/route.ts            # POST generate compliance report
  │   ├── inspection-prep/route.ts     # POST AI inspection preparation
  │   └── export/route.ts             # POST export as PDF
  ├── dashboard/
  │   ├── overview/route.ts            # GET dashboard aggregate data
  │   └── activity/route.ts            # GET recent activity feed
  ├── ai/
  │   ├── suggestions/route.ts         # POST AI recommendations
  │   └── chat/route.ts               # POST compliance assistant
  ├── organization/
  │   ├── route.ts                     # GET, PATCH organization details
  │   └── users/
  │       ├── route.ts                 # GET list, POST invite
  │       └── [id]/route.ts           # PATCH role, DELETE remove
  ├── notifications/
  │   ├── route.ts                     # GET list
  │   ├── read/route.ts               # PATCH mark as read
  │   └── preferences/route.ts        # GET, PATCH email preferences
  ├── cqc/
  │   ├── domains/route.ts             # GET all domains (public seed data)
  │   ├── kloes/route.ts              # GET KLOEs (filtered by service type)
  │   └── regulations/route.ts        # GET all regulations
  └── cron/
      ├── expiry-check/route.ts        # Daily: documents, training, certs
      └── compliance-recalc/route.ts   # Weekly: recalculate all scores
```

### 1.3 Separation of Concerns — The Golden Rule

```
┌─────────────────────────────────────────────────────────────────┐
│  ROUTE HANDLERS DO:                                              │
│  ✓ Authenticate (via Clerk)                                     │
│  ✓ Validate input (via Zod)                                     │
│  ✓ Check authorization (RBAC)                                   │
│  ✓ Extract organizationId                                       │
│  ✓ Call service layer                                           │
│  ✓ Return standardized response                                 │
│                                                                  │
│  ROUTE HANDLERS DO NOT:                                          │
│  ✗ Contain business logic                                       │
│  ✗ Write Prisma queries directly (except simple lookups)        │
│  ✗ Call AI services directly                                    │
│  ✗ Send notifications                                           │
│  ✗ Trigger compliance recalculations                            │
│                                                                  │
│  SERVICE LAYER DOES:                                             │
│  ✓ All Prisma queries (scoped by organizationId)                │
│  ✓ Compliance engine calculations                               │
│  ✓ AI service orchestration                                     │
│  ✓ File storage operations                                      │
│  ✓ Notification dispatch                                        │
│  ✓ Audit log writing                                            │
│  ✓ Complex business rule enforcement                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Authorization Middleware

### 2.1 Clerk Middleware Configuration

```typescript
// src/middleware.ts

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk',
  '/api/cron/(.*)',
  '/api/cqc/(.*)',
])

const isOnboardingRoute = createRouteMatcher([
  '/welcome',
  '/assessment(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  if (isPublicRoute(req)) return NextResponse.next()

  if (!userId) {
    return auth().redirectToSignIn({ returnBackUrl: req.url })
  }

  const onboardingComplete = sessionClaims?.metadata?.onboardingComplete as boolean

  if (!onboardingComplete && !isOnboardingRoute(req)) {
    return NextResponse.redirect(new URL('/welcome', req.url))
  }

  if (onboardingComplete && isOnboardingRoute(req)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

### 2.2 Route-Level Auth Helper

Every route handler uses this helper to authenticate AND resolve the organization context.

```typescript
// src/lib/auth.ts

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import type { UserRole } from '@prisma/client'

export interface AuthContext {
  userId: string          // Clerk user ID
  dbUserId: string        // Our database user UUID
  organizationId: string  // Organization UUID
  role: UserRole          // User's role in the organization
  email: string
  fullName: string
}

export async function getAuthContext(): Promise<AuthContext> {
  const { userId } = await auth()

  if (!userId) {
    throw new AuthError('UNAUTHORIZED', 'Authentication required')
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, organizationId: true,
    },
  })

  if (!user) throw new AuthError('USER_NOT_FOUND', 'User not found in database.')
  if (!user.organizationId) throw new AuthError('NO_ORGANIZATION', 'User is not associated with an organization.')

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
    throw new AuthError('FORBIDDEN', `Requires: ${allowedRoles.join(', ')}. Your role: ${ctx.role}`)
  }
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 1, STAFF: 2, MANAGER: 3, ADMIN: 4, OWNER: 5,
}

export function requireMinRole(ctx: AuthContext, minRole: UserRole): void {
  if (ROLE_HIERARCHY[ctx.role] < ROLE_HIERARCHY[minRole]) {
    throw new AuthError('FORBIDDEN', `Requires at least ${minRole} role.`)
  }
}

export class AuthError extends Error {
  code: 'UNAUTHORIZED' | 'USER_NOT_FOUND' | 'NO_ORGANIZATION' | 'FORBIDDEN'
  statusCode: number
  constructor(code: AuthError['code'], message: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.statusCode = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' ? 401 : 404
  }
}
```

### 2.3 RBAC Permission Matrix

| Action | OWNER | ADMIN | MANAGER | STAFF | VIEWER |
|---|---|---|---|---|---|
| View dashboard & compliance data | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload evidence | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create/edit policies | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve/publish policies | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage staff records | ✅ | ✅ | ✅ | ❌ | ❌ |
| Report incidents | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage tasks (all) | ✅ | ✅ | ✅ | Own only | ❌ |
| Generate AI content | ✅ | ✅ | ✅ | ❌ | ❌ |
| Run assessment | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export reports | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage org settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage users / invite | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ | ❌ |
| Resolve compliance gaps | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete evidence | ✅ | ✅ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 3. Standard API Response Contract

### 3.1 Response Envelope

Every API response follows one of two shapes. No exceptions.

```typescript
// src/types/api.ts

// Success response
export interface ApiSuccessResponse<T> {
  data: T
  meta?: {
    total?: number
    page?: number
    pageSize?: number
    hasMore?: boolean
    totalPages?: number
  }
}

// Error response
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
    statusCode: number
  }
}

// Pagination parameters (shared across all list endpoints)
export interface PaginationParams {
  page?: number           // Default: 1
  pageSize?: number       // Default: 20, max: 100
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}
```

### 3.2 Response Helper Functions

```typescript
// src/lib/api-response.ts

import { NextResponse } from 'next/server'

export function apiSuccess<T>(data: T, meta?: object, status = 200) {
  return NextResponse.json({ data, ...(meta && { meta }) }, { status })
}

export function apiError(code: string, message: string, statusCode = 500, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, statusCode, ...(details && { details }) } },
    { status: statusCode }
  )
}

export const ApiErrors = {
  unauthorized: (msg = 'Authentication required') => apiError('UNAUTHORIZED', msg, 401),
  forbidden: (msg = 'Insufficient permissions') => apiError('FORBIDDEN', msg, 403),
  notFound: (entity: string) => apiError('NOT_FOUND', `${entity} not found`, 404),
  badRequest: (msg: string, details?: unknown) => apiError('BAD_REQUEST', msg, 400, details),
  validationError: (errors: unknown) => apiError('VALIDATION_ERROR', 'Invalid request data', 400, errors),
  conflict: (msg: string) => apiError('CONFLICT', msg, 409),
  tooManyRequests: () => apiError('RATE_LIMITED', 'Too many requests. Please try again later.', 429),
  internal: (msg = 'An unexpected error occurred') => apiError('INTERNAL_ERROR', msg, 500),
  serviceUnavailable: (msg = 'Service temporarily unavailable') => apiError('SERVICE_UNAVAILABLE', msg, 503),
} as const
```

### 3.3 Pagination Helper

```typescript
// src/lib/pagination.ts

import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(200).optional(),
})

export type PaginationInput = z.infer<typeof paginationSchema>

export function buildPagination(input: PaginationInput, total: number) {
  const totalPages = Math.ceil(total / input.pageSize)
  return {
    prisma: { skip: (input.page - 1) * input.pageSize, take: input.pageSize },
    meta: { total, page: input.page, pageSize: input.pageSize, totalPages, hasMore: input.page < totalPages },
  }
}

export function parsePagination(searchParams: URLSearchParams): PaginationInput {
  return paginationSchema.parse({
    page: searchParams.get('page'),
    pageSize: searchParams.get('pageSize'),
    sortBy: searchParams.get('sortBy'),
    sortOrder: searchParams.get('sortOrder'),
    search: searchParams.get('search'),
  })
}
```

---

## 4. Error Handling Framework

### 4.1 Route Handler Wrapper

Every route handler is wrapped in a try/catch with standardized error handling.

```typescript
// src/lib/api-handler.ts

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, getAuthContext, type AuthContext } from '@/lib/auth'
import { ApiErrors } from '@/lib/api-response'

type AuthenticatedHandler = (
  req: NextRequest,
  context: { params: Record<string, string>; auth: AuthContext }
) => Promise<NextResponse>

/**
 * Wraps a route handler with standard auth + error handling.
 *
 * Usage:
 * export const GET = withAuth(async (req, { params, auth }) => {
 *   return apiSuccess(data)
 * })
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, context: { params: Record<string, string> }) => {
    try {
      const auth = await getAuthContext()
      return await handler(req, { ...context, auth })
    } catch (error) {
      return handleError(error)
    }
  }
}

export function withPublic(handler: Function) {
  return async (req: NextRequest, context: { params: Record<string, string> }) => {
    try {
      return await handler(req, context)
    } catch (error) {
      return handleError(error)
    }
  }
}

function handleError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    const fn = error.code === 'FORBIDDEN' ? 'forbidden' : error.code === 'UNAUTHORIZED' ? 'unauthorized' : 'notFound'
    return ApiErrors[fn](error.message)
  }
  if (error instanceof z.ZodError) {
    return ApiErrors.validationError(
      error.errors.map((e) => ({ field: e.path.join('.'), message: e.message, code: e.code }))
    )
  }
  if (isPrismaError(error)) return handlePrismaError(error)
  console.error('[API_ERROR]', error)
  return ApiErrors.internal()
}

function isPrismaError(e: unknown): e is { code: string; meta?: Record<string, unknown> } {
  return typeof e === 'object' && e !== null && 'code' in e
}

function handlePrismaError(error: { code: string; meta?: Record<string, unknown> }): NextResponse {
  switch (error.code) {
    case 'P2002': return ApiErrors.conflict(`Duplicate: ${(error.meta?.target as string[])?.join(', ')}`)
    case 'P2025': return ApiErrors.notFound('Record')
    case 'P2003': return ApiErrors.badRequest('Referenced record does not exist.')
    default: return ApiErrors.internal()
  }
}
```

### 4.2 Error Codes Reference

| Code | HTTP | When Used |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | Valid auth but insufficient role |
| `NOT_FOUND` | 404 | Entity doesn't exist or wrong org scope |
| `BAD_REQUEST` | 400 | Invalid parameters |
| `VALIDATION_ERROR` | 400 | Zod validation failure |
| `CONFLICT` | 409 | Duplicate record |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Unhandled server error |
| `SERVICE_UNAVAILABLE` | 503 | AI service or dependency down |
| `ASSESSMENT_INCOMPLETE` | 400 | Calculate before all steps done |
| `FILE_TOO_LARGE` | 413 | Upload exceeds 50MB |
| `UNSUPPORTED_FILE_TYPE` | 415 | MIME type not allowed |
| `AI_GENERATION_FAILED` | 502 | AI service returned error |

---

## 5. Rate Limiting

```typescript
// src/lib/rate-limiter.ts

import { LRUCache } from 'lru-cache'

const rateLimitCache = new LRUCache<string, { count: number; resetTime: number }>({
  max: 10000,
  ttl: 60 * 1000,
})

const RATE_LIMITS = {
  default:       { maxRequests: 60,  windowMs: 60_000 },
  assessment:    { maxRequests: 10,  windowMs: 60_000 },
  aiGeneration:  { maxRequests: 5,   windowMs: 60_000 },
  upload:        { maxRequests: 20,  windowMs: 60_000 },
  export:        { maxRequests: 5,   windowMs: 300_000 },
  cron:          { maxRequests: 1,   windowMs: 60_000 },
} as const

export function checkRateLimit(
  userId: string,
  category: keyof typeof RATE_LIMITS = 'default'
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMITS[category]
  const key = `${userId}:${category}`
  const now = Date.now()
  const entry = rateLimitCache.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitCache.set(key, { count: 1, resetTime: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs }
  }
  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }
  entry.count++
  rateLimitCache.set(key, entry)
  return { allowed: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime }
}
```

| Category | Limit | Window | Why |
|---|---|---|---|
| `default` | 60 req | 60s | General API access |
| `assessment` | 10 req | 60s | Heavy compliance calculation |
| `aiGeneration` | 5 req | 60s | Expensive AI API calls |
| `upload` | 20 req | 60s | File upload bandwidth |
| `export` | 5 req | 5min | Heavy PDF/CSV generation |
| `cron` | 1 req | 60s | Prevent rapid-fire cron triggers |

---

## 6. Zod Validation Schemas — Complete Library

### 6.1 Shared Primitives

```typescript
// src/lib/validations/shared.ts

import { z } from 'zod'

export const uuidSchema = z.string().uuid()
export const cqcDomainTypeSchema = z.enum(['SAFE', 'EFFECTIVE', 'CARING', 'RESPONSIVE', 'WELL_LED'])
export const cqcRatingSchema = z.enum(['OUTSTANDING', 'GOOD', 'REQUIRES_IMPROVEMENT', 'INADEQUATE'])
export const serviceTypeSchema = z.enum(['AESTHETIC_CLINIC', 'CARE_HOME'])
export const gapSeveritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
export const gapStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ACCEPTED_RISK', 'NOT_APPLICABLE'])
export const kloeCodeSchema = z.string().regex(/^[SECRW]\d{1,2}$/, 'KLOE code must be like S1, E3, C2, R1, W6')
export const regulationCodeSchema = z.string().regex(/^REG\d{1,2}A?$/, 'Regulation code must be like REG9, REG12, REG20A')
export const dateStringSchema = z.string().datetime({ offset: true }).or(z.string().date())
export const shortString = (max = 255) => z.string().min(1).max(max).trim()
export const longString = (max = 5000) => z.string().min(1).max(max).trim()
export const kloeCodesSchema = z.array(kloeCodeSchema).max(25)
export const regulationCodesSchema = z.array(regulationCodeSchema).max(14)
```

### 6.2 Assessment Validation

```typescript
// src/lib/validations/assessment.ts

import { z } from 'zod'
import { serviceTypeSchema, cqcDomainTypeSchema, kloeCodeSchema } from './shared'

export const saveAssessmentSchema = z.object({
  assessmentId: z.string().uuid().optional(),
  serviceType: serviceTypeSchema,
  currentStep: z.number().int().min(1).max(4),
  answers: z.array(z.object({
    questionId: z.string().min(1).max(50),
    questionText: z.string().min(1).max(1000),
    step: z.number().int().min(1).max(4),
    domain: cqcDomainTypeSchema,
    kloeCode: kloeCodeSchema.optional(),
    answerValue: z.union([z.boolean(), z.string(), z.array(z.string()), z.number()]),
    answerType: z.enum(['yes_no', 'yes_no_partial', 'multi_select', 'scale', 'date', 'text']),
  })).min(1).max(100),
})

export type SaveAssessmentInput = z.infer<typeof saveAssessmentSchema>

export const calculateAssessmentSchema = z.object({
  assessmentId: z.string().uuid(),
})
```

### 6.3 Evidence Validation

```typescript
// src/lib/validations/evidence.ts

import { z } from 'zod'
import { shortString, longString, dateStringSchema, kloeCodesSchema, regulationCodesSchema } from './shared'

export const evidenceCategorySchema = z.enum([
  'POLICY', 'PROCEDURE', 'RECORD', 'ASSESSMENT', 'TRAINING', 'AUDIT', 'CERTIFICATE', 'REPORT', 'OTHER',
])

export const createEvidenceSchema = z.object({
  name: shortString(255),
  description: longString(2000).optional(),
  category: evidenceCategorySchema,
  linkedKloes: kloeCodesSchema.optional().default([]),
  linkedRegulations: regulationCodesSchema.optional().default([]),
  validFrom: dateStringSchema.optional(),
  validUntil: dateStringSchema.optional(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  fileUrl: z.string().url(),
  fileName: shortString(255),
  fileType: z.string().max(100),
  fileSize: z.number().int().positive().max(52_428_800), // 50MB
  storagePath: z.string().max(500),
})

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>

export const updateEvidenceSchema = z.object({
  name: shortString(255).optional(),
  description: longString(2000).optional(),
  category: evidenceCategorySchema.optional(),
  linkedKloes: kloeCodesSchema.optional(),
  linkedRegulations: regulationCodesSchema.optional(),
  validFrom: dateStringSchema.optional().nullable(),
  validUntil: dateStringSchema.optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
})

export const evidenceFilterSchema = z.object({
  category: evidenceCategorySchema.optional(),
  status: z.enum(['CURRENT', 'EXPIRING_SOON', 'EXPIRED', 'UNDER_REVIEW', 'ARCHIVED']).optional(),
  domain: cqcDomainTypeSchema.optional(),
  kloeCode: z.string().optional(),
  expiringSoon: z.coerce.boolean().optional(),
})
```

### 6.4 Policy Validation

```typescript
// src/lib/validations/policy.ts

import { z } from 'zod'
import { shortString, longString, dateStringSchema, kloeCodesSchema, regulationCodesSchema } from './shared'

export const policyStatusSchema = z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'EXPIRED', 'ARCHIVED'])

export const createPolicySchema = z.object({
  title: shortString(255),
  description: longString(2000).optional(),
  content: z.string().min(1).max(100_000),
  category: z.string().min(1).max(100),
  linkedKloes: kloeCodesSchema.optional().default([]),
  linkedRegulations: regulationCodesSchema.optional().default([]),
  effectiveDate: dateStringSchema.optional(),
  reviewDate: dateStringSchema.optional(),
})

export const updatePolicySchema = createPolicySchema.partial().extend({
  status: policyStatusSchema.optional(),
})

export const generatePolicySchema = z.object({
  templateId: z.string().min(1).max(100),
  customInstructions: z.string().max(2000).optional(),
})

export const policyFilterSchema = z.object({
  status: policyStatusSchema.optional(),
  category: z.string().optional(),
  isAiGenerated: z.coerce.boolean().optional(),
  reviewDueSoon: z.coerce.boolean().optional(),
})
```

### 6.5 Staff & Training Validation

```typescript
// src/lib/validations/staff.ts

import { z } from 'zod'
import { shortString, dateStringSchema, kloeCodesSchema, regulationCodesSchema } from './shared'

export const staffRoleSchema = z.enum([
  'REGISTERED_MANAGER', 'DEPUTY_MANAGER', 'REGISTERED_NURSE', 'SENIOR_CARER',
  'CARE_ASSISTANT', 'PRACTITIONER', 'MEDICAL_DIRECTOR', 'ADMIN', 'DOMESTIC', 'OTHER',
])

export const createStaffSchema = z.object({
  firstName: shortString(100),
  lastName: shortString(100),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(30).optional(),
  jobTitle: shortString(200),
  staffRole: staffRoleSchema,
  department: z.string().max(100).optional(),
  startDate: dateStringSchema,
  contractType: z.enum(['full_time', 'part_time', 'bank', 'agency']).optional(),
  registrationBody: z.enum(['GMC', 'NMC', 'GPhC', 'GDC', 'HCPC', 'OTHER']).optional(),
  registrationNumber: z.string().max(50).optional(),
  registrationExpiry: dateStringSchema.optional(),
  dbsNumber: z.string().max(20).optional(),
  dbsCertificateDate: dateStringSchema.optional(),
  dbsUpdateService: z.boolean().optional().default(false),
  dbsLevel: z.enum(['basic', 'standard', 'enhanced', 'enhanced_barred']).optional(),
  hasIndemnityInsurance: z.boolean().optional().default(false),
  insuranceProvider: z.string().max(255).optional(),
  insuranceExpiry: dateStringSchema.optional(),
  rightToWorkChecked: z.boolean().optional().default(false),
})

export const updateStaffSchema = createStaffSchema.partial().extend({
  isActive: z.boolean().optional(),
  endDate: dateStringSchema.optional().nullable(),
})

export const staffFilterSchema = z.object({
  staffRole: staffRoleSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  department: z.string().optional(),
  registrationExpiring: z.coerce.boolean().optional(),
})
```

```typescript
// src/lib/validations/training.ts

import { z } from 'zod'
import { shortString, dateStringSchema, kloeCodesSchema } from './shared'

export const createTrainingSchema = z.object({
  staffMemberId: z.string().uuid(),
  courseName: shortString(255),
  provider: z.string().max(255).optional(),
  category: z.enum(['mandatory', 'statutory', 'professional', 'optional']),
  isMandatory: z.boolean().default(false),
  linkedKloes: kloeCodesSchema.optional().default([]),
  completedDate: dateStringSchema,
  expiryDate: dateStringSchema.optional(),
  certificateUrl: z.string().url().max(1000).optional(),
  score: z.number().min(0).max(100).optional(),
  passed: z.boolean().default(true),
})
```

### 6.6 Incident Validation

```typescript
// src/lib/validations/incident.ts

import { z } from 'zod'
import { shortString, longString, dateStringSchema, kloeCodesSchema } from './shared'

export const incidentCategorySchema = z.enum([
  'FALL', 'MEDICATION_ERROR', 'SAFEGUARDING', 'INFECTION', 'PRESSURE_ULCER',
  'INJURY', 'NEAR_MISS', 'COMPLAINT', 'EQUIPMENT_FAILURE', 'MISSING_PERSON', 'DEATH', 'OTHER',
])
export const incidentSeveritySchema = z.enum(['NEAR_MISS', 'LOW', 'MODERATE', 'SEVERE', 'CRITICAL'])

export const createIncidentSchema = z.object({
  title: shortString(255),
  description: longString(5000),
  category: incidentCategorySchema,
  severity: incidentSeveritySchema,
  occurredAt: dateStringSchema,
  location: z.string().max(200).optional(),
  staffInvolvedIds: z.array(z.string().uuid()).max(20).optional().default([]),
  personsInvolved: z.array(z.string().max(200)).max(20).optional().default([]),
  linkedKloes: kloeCodesSchema.optional().default([]),
  requiresNotification: z.boolean().default(false),
  dutyOfCandourApplies: z.boolean().default(false),
})

export const updateIncidentSchema = z.object({
  title: shortString(255).optional(),
  description: longString(5000).optional(),
  status: z.enum(['REPORTED', 'UNDER_INVESTIGATION', 'ACTION_REQUIRED', 'RESOLVED', 'CLOSED']).optional(),
  rootCause: longString(5000).optional(),
  actionsTaken: longString(5000).optional(),
  lessonsLearned: longString(5000).optional(),
  investigatorId: z.string().uuid().optional(),
  notifiedBodies: z.array(z.enum(['CQC', 'LOCAL_AUTHORITY', 'POLICE', 'HSE'])).optional(),
  dutyOfCandourMet: z.boolean().optional(),
})

export const incidentFilterSchema = z.object({
  category: incidentCategorySchema.optional(),
  severity: incidentSeveritySchema.optional(),
  status: z.enum(['REPORTED', 'UNDER_INVESTIGATION', 'ACTION_REQUIRED', 'RESOLVED', 'CLOSED']).optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
})
```

### 6.7 Task & Gap Validation

```typescript
// src/lib/validations/task.ts

import { z } from 'zod'
import { shortString, longString, dateStringSchema, cqcDomainTypeSchema, kloeCodeSchema } from './shared'

export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'OVERDUE', 'COMPLETED', 'CANCELLED'])
export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export const createTaskSchema = z.object({
  title: shortString(255),
  description: longString(5000).optional(),
  priority: taskPrioritySchema.default('MEDIUM'),
  domain: cqcDomainTypeSchema.optional(),
  kloeCode: kloeCodeSchema.optional(),
  gapId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  dueDate: dateStringSchema.optional(),
})

export const updateTaskSchema = z.object({
  title: shortString(255).optional(),
  description: longString(5000).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  dueDate: dateStringSchema.optional().nullable(),
  completionNotes: longString(5000).optional(),
})

export const taskFilterSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assignedToId: z.string().uuid().optional(),
  domain: cqcDomainTypeSchema.optional(),
  overdue: z.coerce.boolean().optional(),
  source: z.enum(['ASSESSMENT', 'MANUAL', 'AI', 'SYSTEM']).optional(),
})
```

```typescript
// src/lib/validations/gap.ts

import { z } from 'zod'
import { gapStatusSchema, longString, dateStringSchema } from './shared'

export const updateGapSchema = z.object({
  status: gapStatusSchema,
  resolutionNotes: longString(5000).optional(),
  dueDate: dateStringSchema.optional().nullable(),
})

export const gapFilterSchema = z.object({
  status: gapStatusSchema.optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  domain: z.enum(['SAFE', 'EFFECTIVE', 'CARING', 'RESPONSIVE', 'WELL_LED']).optional(),
  source: z.enum(['assessment', 'monitoring', 'manual', 'ai']).optional(),
})
```

### 6.8 Organization Validation

```typescript
// src/lib/validations/organization.ts

import { z } from 'zod'
import { shortString, cqcRatingSchema, dateStringSchema } from './shared'

export const updateOrganizationSchema = z.object({
  name: shortString(255).optional(),
  cqcProviderId: z.string().max(50).optional(),
  cqcLocationId: z.string().max(50).optional(),
  cqcRegisteredName: z.string().max(255).optional(),
  cqcCurrentRating: cqcRatingSchema.optional(),
  cqcLastInspection: dateStringSchema.optional(),
  cqcNextInspection: dateStringSchema.optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  postcode: z.string().max(20).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(255).optional(),
  registeredManager: z.string().max(255).optional(),
  bedCount: z.number().int().positive().max(1000).optional(),
  staffCount: z.number().int().positive().max(5000).optional(),
})

export const inviteUserSchema = z.object({
  email: z.string().email().max(255),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
})
```

---

## 7. Route Handlers — Assessment

### 7.1 Save Assessment Answers

```typescript
// src/app/api/assessment/route.ts

import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { saveAssessmentSchema } from '@/lib/validations/assessment'
import { AssessmentService } from '@/lib/services/assessment-service'
import { AuditService } from '@/lib/services/audit-service'

// POST /api/assessment — Save answers for a step
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'ADMIN')

  const body = await req.json()
  const input = saveAssessmentSchema.parse(body)

  const assessment = await AssessmentService.saveAnswers({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    ...input,
  })

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'ASSESSMENT_STEP_SAVED',
    entityType: 'Assessment',
    entityId: assessment.id,
    description: `Saved assessment step ${input.currentStep}`,
  })

  return apiSuccess(assessment)
})

// GET /api/assessment — Get latest assessment (in_progress or most recent completed)
export const GET = withAuth(async (req, { auth }) => {
  const assessment = await AssessmentService.getLatest(auth.organizationId)
  return apiSuccess(assessment)
})
```

### 7.2 Calculate Assessment Score

```typescript
// src/app/api/assessment/calculate/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { calculateAssessmentSchema } from '@/lib/validations/assessment'
import { AssessmentService } from '@/lib/services/assessment-service'
import { checkRateLimit } from '@/lib/rate-limiter'

// POST /api/assessment/calculate — Run full scoring engine
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'ADMIN')

  const { allowed } = checkRateLimit(auth.dbUserId, 'assessment')
  if (!allowed) return ApiErrors.tooManyRequests()

  const body = await req.json()
  const { assessmentId } = calculateAssessmentSchema.parse(body)

  const result = await AssessmentService.calculate({
    assessmentId,
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
  })

  // result includes: { overallScore, domainScores[], gaps[], complianceScore, rating }
  return apiSuccess(result)
})
```

### 7.3 Get Single Assessment

```typescript
// src/app/api/assessment/[id]/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { AssessmentService } from '@/lib/services/assessment-service'

// GET /api/assessment/:id
export const GET = withAuth(async (req, { params, auth }) => {
  const assessment = await AssessmentService.getById(params.id, auth.organizationId)
  if (!assessment) return ApiErrors.notFound('Assessment')
  return apiSuccess(assessment)
})
```

---

## 8. Route Handlers — Compliance Score & Gaps

### 8.1 Compliance Score

```typescript
// src/app/api/compliance/score/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { ComplianceService } from '@/lib/services/compliance-service'
import { checkRateLimit } from '@/lib/rate-limiter'

// GET /api/compliance/score — Current score + domain breakdowns
export const GET = withAuth(async (req, { auth }) => {
  const score = await ComplianceService.getCurrentScore(auth.organizationId)
  if (!score) return ApiErrors.notFound('ComplianceScore')

  // Returns:
  // {
  //   overallScore: 72.5,
  //   overallRating: 'REQUIRES_IMPROVEMENT',
  //   domains: [
  //     { domain: 'SAFE', score: 65.0, rating: 'REQUIRES_IMPROVEMENT', gaps: 4, evidence: 12, ... },
  //     { domain: 'EFFECTIVE', score: 80.0, rating: 'GOOD', gaps: 2, evidence: 8, ... },
  //     ...
  //   ],
  //   lastCalculatedAt: '2026-02-10T12:00:00Z',
  //   trend: { direction: 'UP', previousScore: 68.2, changePercent: 6.3 }
  // }
  return apiSuccess(score)
})

// POST /api/compliance/score — Force recalculate
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'MANAGER')

  const { allowed } = checkRateLimit(auth.dbUserId, 'assessment')
  if (!allowed) return ApiErrors.tooManyRequests()

  const score = await ComplianceService.recalculate(auth.organizationId, auth.dbUserId)
  return apiSuccess(score)
})
```

### 8.2 Compliance Gaps

```typescript
// src/app/api/compliance/gaps/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { parsePagination, buildPagination } from '@/lib/pagination'
import { gapFilterSchema } from '@/lib/validations/gap'
import { GapService } from '@/lib/services/gap-service'

// GET /api/compliance/gaps — List gaps with filters
export const GET = withAuth(async (req, { auth }) => {
  const searchParams = new URL(req.url).searchParams
  const pagination = parsePagination(searchParams)
  const filters = gapFilterSchema.parse({
    status: searchParams.get('status'),
    severity: searchParams.get('severity'),
    domain: searchParams.get('domain'),
    source: searchParams.get('source'),
  })

  const { gaps, total } = await GapService.list({
    organizationId: auth.organizationId,
    pagination,
    filters,
  })

  const { meta } = buildPagination(pagination, total)
  return apiSuccess(gaps, { meta })
})
```

```typescript
// src/app/api/compliance/gaps/[id]/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { updateGapSchema } from '@/lib/validations/gap'
import { GapService } from '@/lib/services/gap-service'
import { ComplianceService } from '@/lib/services/compliance-service'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/compliance/gaps/:id
export const GET = withAuth(async (req, { params, auth }) => {
  const gap = await GapService.getById(params.id, auth.organizationId)
  if (!gap) return ApiErrors.notFound('ComplianceGap')
  return apiSuccess(gap)
})

// PATCH /api/compliance/gaps/:id — Update status (resolve, accept risk, etc.)
export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER')

  const body = await req.json()
  const input = updateGapSchema.parse(body)

  const existing = await GapService.getById(params.id, auth.organizationId)
  if (!existing) return ApiErrors.notFound('ComplianceGap')

  const updated = await GapService.update({
    gapId: params.id,
    organizationId: auth.organizationId,
    ...input,
  })

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'GAP_STATUS_UPDATED',
    entityType: 'ComplianceGap',
    entityId: params.id,
    description: `Gap status changed from ${existing.status} to ${input.status}`,
    previousValues: { status: existing.status },
    newValues: { status: input.status },
  })

  // Trigger recalculation if gap was resolved
  if (input.status === 'RESOLVED' || input.status === 'NOT_APPLICABLE') {
    ComplianceService.queueRecalculation(auth.organizationId)
  }

  return apiSuccess(updated)
})
```

---

## 9. Route Handlers — Evidence Management

### 9.1 Evidence List & Create

```typescript
// src/app/api/evidence/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { parsePagination, buildPagination } from '@/lib/pagination'
import { createEvidenceSchema, evidenceFilterSchema } from '@/lib/validations/evidence'
import { EvidenceService } from '@/lib/services/evidence-service'
import { ComplianceService } from '@/lib/services/compliance-service'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/evidence — List with filters
export const GET = withAuth(async (req, { auth }) => {
  const searchParams = new URL(req.url).searchParams
  const pagination = parsePagination(searchParams)
  const filters = evidenceFilterSchema.parse({
    category: searchParams.get('category'),
    status: searchParams.get('status'),
    domain: searchParams.get('domain'),
    kloeCode: searchParams.get('kloeCode'),
    expiringSoon: searchParams.get('expiringSoon'),
  })

  const { evidence, total } = await EvidenceService.list({
    organizationId: auth.organizationId,
    pagination,
    filters,
  })

  const { meta } = buildPagination(pagination, total)
  return apiSuccess(evidence, { meta })
})

// POST /api/evidence — Create evidence metadata record (file already uploaded)
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'STAFF')

  const body = await req.json()
  const input = createEvidenceSchema.parse(body)

  const evidence = await EvidenceService.create({
    organizationId: auth.organizationId,
    uploadedById: auth.dbUserId,
    ...input,
  })

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'EVIDENCE_UPLOADED',
    entityType: 'Evidence',
    entityId: evidence.id,
    description: `Uploaded evidence: ${input.name} (${input.category})`,
  })

  // Evidence upload affects compliance scoring
  ComplianceService.queueRecalculation(auth.organizationId)

  return apiSuccess(evidence, undefined, 201)
})
```

### 9.2 Evidence File Upload

```typescript
// src/app/api/evidence/upload/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { StorageService } from '@/lib/services/storage-service'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'text/plain',
]

// POST /api/evidence/upload — Upload file to Supabase Storage
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'STAFF')

  const { allowed } = checkRateLimit(auth.dbUserId, 'upload')
  if (!allowed) return ApiErrors.tooManyRequests()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return ApiErrors.badRequest('No file provided')

  if (file.size > MAX_FILE_SIZE) {
    return apiError('FILE_TOO_LARGE', 'File size exceeds 50MB limit', 413)
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return apiError('UNSUPPORTED_FILE_TYPE', `File type '${file.type}' is not supported`, 415)
  }

  const category = (formData.get('category') as string) || 'evidence'

  const result = await StorageService.upload({
    file,
    organizationId: auth.organizationId,
    category,
    userId: auth.dbUserId,
  })

  // Returns: { fileUrl, storagePath, fileName, fileType, fileSize }
  return apiSuccess(result, undefined, 201)
})
```

### 9.3 Single Evidence Operations

```typescript
// src/app/api/evidence/[id]/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { updateEvidenceSchema } from '@/lib/validations/evidence'
import { EvidenceService } from '@/lib/services/evidence-service'
import { ComplianceService } from '@/lib/services/compliance-service'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/evidence/:id
export const GET = withAuth(async (req, { params, auth }) => {
  const evidence = await EvidenceService.getById(params.id, auth.organizationId)
  if (!evidence) return ApiErrors.notFound('Evidence')
  return apiSuccess(evidence)
})

// PATCH /api/evidence/:id
export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'STAFF')

  const body = await req.json()
  const input = updateEvidenceSchema.parse(body)

  const existing = await EvidenceService.getById(params.id, auth.organizationId)
  if (!existing) return ApiErrors.notFound('Evidence')

  const updated = await EvidenceService.update(params.id, auth.organizationId, input)

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'EVIDENCE_UPDATED',
    entityType: 'Evidence',
    entityId: params.id,
    description: `Updated evidence: ${updated.name}`,
    previousValues: { name: existing.name, category: existing.category },
    newValues: { name: updated.name, category: updated.category },
  })

  return apiSuccess(updated)
})

// DELETE /api/evidence/:id — Soft delete
export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN')

  const existing = await EvidenceService.getById(params.id, auth.organizationId)
  if (!existing) return ApiErrors.notFound('Evidence')

  await EvidenceService.softDelete(params.id, auth.organizationId)

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'EVIDENCE_DELETED',
    entityType: 'Evidence',
    entityId: params.id,
    description: `Deleted evidence: ${existing.name}`,
  })

  ComplianceService.queueRecalculation(auth.organizationId)

  return apiSuccess({ deleted: true })
})
```

---

## 10. Route Handlers — Policy Management

### 10.1 Policy List & Create

```typescript
// src/app/api/policies/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { parsePagination, buildPagination } from '@/lib/pagination'
import { createPolicySchema, policyFilterSchema } from '@/lib/validations/policy'
import { PolicyService } from '@/lib/services/policy-service'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/policies
export const GET = withAuth(async (req, { auth }) => {
  const searchParams = new URL(req.url).searchParams
  const pagination = parsePagination(searchParams)
  const filters = policyFilterSchema.parse({
    status: searchParams.get('status'),
    category: searchParams.get('category'),
    isAiGenerated: searchParams.get('isAiGenerated'),
    reviewDueSoon: searchParams.get('reviewDueSoon'),
  })

  const { policies, total } = await PolicyService.list({
    organizationId: auth.organizationId,
    pagination,
    filters,
  })

  const { meta } = buildPagination(pagination, total)
  return apiSuccess(policies, { meta })
})

// POST /api/policies — Create manually
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'MANAGER')

  const body = await req.json()
  const input = createPolicySchema.parse(body)

  const policy = await PolicyService.create({
    organizationId: auth.organizationId,
    createdById: auth.dbUserId,
    isAiGenerated: false,
    ...input,
  })

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'POLICY_CREATED',
    entityType: 'Policy',
    entityId: policy.id,
    description: `Created policy: ${input.title}`,
  })

  return apiSuccess(policy, undefined, 201)
})
```

### 10.2 AI Policy Generation

```typescript
// src/app/api/policies/generate/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { generatePolicySchema } from '@/lib/validations/policy'
import { AIService } from '@/lib/services/ai-service'
import { PolicyService } from '@/lib/services/policy-service'
import { AuditService } from '@/lib/services/audit-service'

// POST /api/policies/generate — AI-generate a policy
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'MANAGER')

  const { allowed } = checkRateLimit(auth.dbUserId, 'aiGeneration')
  if (!allowed) return ApiErrors.tooManyRequests()

  const body = await req.json()
  const input = generatePolicySchema.parse(body)

  // Get organization context for AI
  const orgContext = await PolicyService.getOrgContext(auth.organizationId)

  // Generate policy content via AI
  const aiResult = await AIService.generatePolicy({
    templateId: input.templateId,
    customInstructions: input.customInstructions,
    organizationContext: orgContext,
  })

  if (!aiResult.success) {
    return apiError('AI_GENERATION_FAILED', 'Policy generation failed. Please try again.', 502)
  }

  // Save as a DRAFT policy
  const policy = await PolicyService.create({
    organizationId: auth.organizationId,
    createdById: auth.dbUserId,
    title: aiResult.title,
    content: aiResult.content,
    description: aiResult.description,
    category: aiResult.category,
    linkedKloes: aiResult.linkedKloes,
    linkedRegulations: aiResult.linkedRegulations,
    isAiGenerated: true,
  })

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'POLICY_AI_GENERATED',
    entityType: 'Policy',
    entityId: policy.id,
    description: `AI-generated policy: ${policy.title} from template ${input.templateId}`,
  })

  return apiSuccess(policy, undefined, 201)
})
```

### 10.3 Policy Templates

```typescript
// src/app/api/policies/templates/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { db } from '@/lib/db'

// GET /api/policies/templates — Available templates for this org's service type
export const GET = withAuth(async (req, { auth }) => {
  const org = await db.organization.findUnique({
    where: { id: auth.organizationId },
    select: { serviceType: true },
  })

  // Policy templates are stored as seed data, filtered by service type
  const templates = await db.policyTemplate.findMany({
    where: {
      OR: [
        { serviceType: org?.serviceType },
        { serviceType: null }, // Universal templates
      ],
      isActive: true,
    },
    orderBy: [{ isRequired: 'desc' }, { category: 'asc' }, { title: 'asc' }],
  })

  return apiSuccess(templates)
})
```

### 10.4 Single Policy, Approve, Publish, Versions

```typescript
// src/app/api/policies/[id]/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { updatePolicySchema } from '@/lib/validations/policy'
import { PolicyService } from '@/lib/services/policy-service'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/policies/:id
export const GET = withAuth(async (req, { params, auth }) => {
  const policy = await PolicyService.getById(params.id, auth.organizationId)
  if (!policy) return ApiErrors.notFound('Policy')
  return apiSuccess(policy)
})

// PATCH /api/policies/:id
export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER')

  const body = await req.json()
  const input = updatePolicySchema.parse(body)

  const existing = await PolicyService.getById(params.id, auth.organizationId)
  if (!existing) return ApiErrors.notFound('Policy')

  // Only DRAFT and UNDER_REVIEW policies can be edited
  if (!['DRAFT', 'UNDER_REVIEW'].includes(existing.status)) {
    return ApiErrors.badRequest('Only draft or under-review policies can be edited')
  }

  const updated = await PolicyService.update(params.id, auth.organizationId, input)

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'POLICY_UPDATED',
    entityType: 'Policy',
    entityId: params.id,
    description: `Updated policy: ${updated.title}`,
  })

  return apiSuccess(updated)
})

// DELETE /api/policies/:id — Soft delete
export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN')

  const existing = await PolicyService.getById(params.id, auth.organizationId)
  if (!existing) return ApiErrors.notFound('Policy')
  if (existing.status === 'PUBLISHED') {
    return ApiErrors.badRequest('Published policies cannot be deleted. Archive them first.')
  }

  await PolicyService.softDelete(params.id, auth.organizationId)

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'POLICY_DELETED',
    entityType: 'Policy',
    entityId: params.id,
    description: `Deleted policy: ${existing.title}`,
  })

  return apiSuccess({ deleted: true })
})
```

```typescript
// src/app/api/policies/[id]/approve/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { PolicyService } from '@/lib/services/policy-service'
import { AuditService } from '@/lib/services/audit-service'

// POST /api/policies/:id/approve — Approve a policy
export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN')

  const policy = await PolicyService.getById(params.id, auth.organizationId)
  if (!policy) return ApiErrors.notFound('Policy')
  if (policy.status !== 'UNDER_REVIEW') {
    return ApiErrors.badRequest('Only policies under review can be approved')
  }

  const approved = await PolicyService.approve(params.id, auth.organizationId, auth.dbUserId)

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'POLICY_APPROVED',
    entityType: 'Policy',
    entityId: params.id,
    description: `Approved policy: ${policy.title}`,
  })

  return apiSuccess(approved)
})
```

```typescript
// src/app/api/policies/[id]/publish/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { PolicyService } from '@/lib/services/policy-service'
import { ComplianceService } from '@/lib/services/compliance-service'
import { AuditService } from '@/lib/services/audit-service'

// POST /api/policies/:id/publish — Publish a policy
export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN')

  const policy = await PolicyService.getById(params.id, auth.organizationId)
  if (!policy) return ApiErrors.notFound('Policy')
  if (policy.status !== 'APPROVED') {
    return ApiErrors.badRequest('Only approved policies can be published')
  }

  const published = await PolicyService.publish(params.id, auth.organizationId)

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'POLICY_PUBLISHED',
    entityType: 'Policy',
    entityId: params.id,
    description: `Published policy: ${policy.title} (v${published.versionNumber})`,
  })

  // Published policy affects compliance scoring
  ComplianceService.queueRecalculation(auth.organizationId)

  return apiSuccess(published)
})
```

```typescript
// src/app/api/policies/[id]/versions/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { PolicyService } from '@/lib/services/policy-service'

// GET /api/policies/:id/versions — Version history
export const GET = withAuth(async (req, { params, auth }) => {
  const exists = await PolicyService.getById(params.id, auth.organizationId)
  if (!exists) return ApiErrors.notFound('Policy')

  const versions = await PolicyService.getVersionHistory(params.id, auth.organizationId)
  return apiSuccess(versions)
})
```

---

## 11. Route Handlers — Staff Management

### 11.1 Staff List & Create

```typescript
// src/app/api/staff/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { parsePagination, buildPagination } from '@/lib/pagination'
import { createStaffSchema, staffFilterSchema } from '@/lib/validations/staff'
import { StaffService } from '@/lib/services/staff-service'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/staff
export const GET = withAuth(async (req, { auth }) => {
  const searchParams = new URL(req.url).searchParams
  const pagination = parsePagination(searchParams)
  const filters = staffFilterSchema.parse({
    staffRole: searchParams.get('staffRole'),
    isActive: searchParams.get('isActive'),
    department: searchParams.get('department'),
    registrationExpiring: searchParams.get('registrationExpiring'),
  })

  const { staff, total } = await StaffService.list({
    organizationId: auth.organizationId,
    pagination,
    filters,
  })

  const { meta } = buildPagination(pagination, total)
  return apiSuccess(staff, { meta })
})

// POST /api/staff
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'MANAGER')

  const body = await req.json()
  const input = createStaffSchema.parse(body)

  const member = await StaffService.create({
    organizationId: auth.organizationId,
    ...input,
  })

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'STAFF_CREATED',
    entityType: 'StaffMember',
    entityId: member.id,
    description: `Added staff member: ${input.firstName} ${input.lastName} (${input.jobTitle})`,
  })

  return apiSuccess(member, undefined, 201)
})
```

### 11.2 Single Staff Operations

```typescript
// src/app/api/staff/[id]/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { updateStaffSchema } from '@/lib/validations/staff'
import { StaffService } from '@/lib/services/staff-service'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/staff/:id — Includes training records
export const GET = withAuth(async (req, { params, auth }) => {
  const member = await StaffService.getById(params.id, auth.organizationId)
  if (!member) return ApiErrors.notFound('StaffMember')
  return apiSuccess(member)
})

// PATCH /api/staff/:id
export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER')

  const body = await req.json()
  const input = updateStaffSchema.parse(body)

  const existing = await StaffService.getById(params.id, auth.organizationId)
  if (!existing) return ApiErrors.notFound('StaffMember')

  const updated = await StaffService.update(params.id, auth.organizationId, input)

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'STAFF_UPDATED',
    entityType: 'StaffMember',
    entityId: params.id,
    description: `Updated staff member: ${updated.firstName} ${updated.lastName}`,
    previousValues: { jobTitle: existing.jobTitle, staffRole: existing.staffRole },
    newValues: { jobTitle: updated.jobTitle, staffRole: updated.staffRole },
  })

  return apiSuccess(updated)
})

// DELETE /api/staff/:id — Soft delete (deactivate)
export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN')

  const existing = await StaffService.getById(params.id, auth.organizationId)
  if (!existing) return ApiErrors.notFound('StaffMember')

  await StaffService.softDelete(params.id, auth.organizationId)

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'STAFF_DEACTIVATED',
    entityType: 'StaffMember',
    entityId: params.id,
    description: `Deactivated staff member: ${existing.firstName} ${existing.lastName}`,
  })

  return apiSuccess({ deleted: true })
})
```

---

## 12. Route Handlers — Training Records

### 12.1 Training List & Matrix

```typescript
// src/app/api/staff/training/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { parsePagination, buildPagination } from '@/lib/pagination'
import { createTrainingSchema } from '@/lib/validations/training'
import { TrainingService } from '@/lib/services/training-service'
import { ComplianceService } from '@/lib/services/compliance-service'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/staff/training — Training matrix or paginated list
export const GET = withAuth(async (req, { auth }) => {
  const searchParams = new URL(req.url).searchParams
  const view = searchParams.get('view')

  if (view === 'matrix') {
    // Returns: { staff: [{ id, name, trainings: { courseName, status, expiryDate }[] }] }
    const matrix = await TrainingService.getMatrix(auth.organizationId)
    return apiSuccess(matrix)
  }

  const pagination = parsePagination(searchParams)
  const { records, total } = await TrainingService.listAll({
    organizationId: auth.organizationId,
    pagination,
    staffMemberId: searchParams.get('staffMemberId') || undefined,
    category: searchParams.get('category') || undefined,
    expiringSoon: searchParams.get('expiringSoon') === 'true',
  })

  const { meta } = buildPagination(pagination, total)
  return apiSuccess(records, { meta })
})

// POST /api/staff/training — Add training record
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'MANAGER')

  const body = await req.json()
  const input = createTrainingSchema.parse(body)

  const record = await TrainingService.create({
    organizationId: auth.organizationId,
    ...input,
  })

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TRAINING_RECORDED',
    entityType: 'TrainingRecord',
    entityId: record.id,
    description: `Recorded training: ${input.courseName} for staff ${input.staffMemberId}`,
  })

  // Training completion affects compliance scoring
  ComplianceService.queueRecalculation(auth.organizationId)

  return apiSuccess(record, undefined, 201)
})
```

### 12.2 Single Training Operations

```typescript
// src/app/api/staff/training/[id]/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { TrainingService } from '@/lib/services/training-service'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/staff/training/:id
export const GET = withAuth(async (req, { params, auth }) => {
  const record = await TrainingService.getById(params.id, auth.organizationId)
  if (!record) return ApiErrors.notFound('TrainingRecord')
  return apiSuccess(record)
})

// PATCH /api/staff/training/:id
export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER')

  const body = await req.json()
  const existing = await TrainingService.getById(params.id, auth.organizationId)
  if (!existing) return ApiErrors.notFound('TrainingRecord')

  const updated = await TrainingService.update(params.id, auth.organizationId, body)

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TRAINING_UPDATED',
    entityType: 'TrainingRecord',
    entityId: params.id,
    description: `Updated training record: ${updated.courseName}`,
  })

  return apiSuccess(updated)
})

// DELETE /api/staff/training/:id
export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN')

  const existing = await TrainingService.getById(params.id, auth.organizationId)
  if (!existing) return ApiErrors.notFound('TrainingRecord')

  await TrainingService.delete(params.id, auth.organizationId)

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TRAINING_DELETED',
    entityType: 'TrainingRecord',
    entityId: params.id,
    description: `Deleted training record: ${existing.courseName}`,
  })

  return apiSuccess({ deleted: true })
})
```

---

## 13. Route Handlers — Incident Reporting

### 13.1 Incident List & Create

```typescript
// src/app/api/incidents/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { parsePagination, buildPagination } from '@/lib/pagination'
import { createIncidentSchema, incidentFilterSchema } from '@/lib/validations/incident'
import { IncidentService } from '@/lib/services/incident-service'
import { ComplianceService } from '@/lib/services/compliance-service'
import { NotificationService } from '@/lib/services/notification-service'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/incidents
export const GET = withAuth(async (req, { auth }) => {
  const searchParams = new URL(req.url).searchParams
  const pagination = parsePagination(searchParams)
  const filters = incidentFilterSchema.parse({
    category: searchParams.get('category'),
    severity: searchParams.get('severity'),
    status: searchParams.get('status'),
    from: searchParams.get('from'),
    to: searchParams.get('to'),
  })

  const { incidents, total } = await IncidentService.list({
    organizationId: auth.organizationId,
    pagination,
    filters,
  })

  const { meta } = buildPagination(pagination, total)
  return apiSuccess(incidents, { meta })
})

// POST /api/incidents — Report an incident
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'STAFF')

  const body = await req.json()
  const input = createIncidentSchema.parse(body)

  const incident = await IncidentService.create({
    organizationId: auth.organizationId,
    reportedById: auth.dbUserId,
    ...input,
  })

  // Auto-link to relevant KLOEs and regulations
  await IncidentService.autoLinkCompliance(incident.id, auth.organizationId, input.category)

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'INCIDENT_REPORTED',
    entityType: 'Incident',
    entityId: incident.id,
    description: `Reported incident: ${input.title} (${input.severity} - ${input.category})`,
  })

  // Notify all admins/managers
  NotificationService.create({
    organizationId: auth.organizationId,
    type: 'INCIDENT_REPORTED',
    title: `New ${input.severity} Incident Reported`,
    message: `${auth.fullName} reported: ${input.title}`,
    priority: ['SEVERE', 'CRITICAL'].includes(input.severity) ? 'URGENT' : 'HIGH',
    entityType: 'Incident',
    entityId: incident.id,
    targetRoles: ['OWNER', 'ADMIN', 'MANAGER'],
  })

  // SEVERE and CRITICAL incidents trigger immediate recalculation
  if (['SEVERE', 'CRITICAL'].includes(input.severity)) {
    ComplianceService.queueRecalculation(auth.organizationId)
  }

  return apiSuccess(incident, undefined, 201)
})
```

### 13.2 Single Incident Operations

```typescript
// src/app/api/incidents/[id]/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { updateIncidentSchema } from '@/lib/validations/incident'
import { IncidentService } from '@/lib/services/incident-service'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/incidents/:id
export const GET = withAuth(async (req, { params, auth }) => {
  const incident = await IncidentService.getById(params.id, auth.organizationId)
  if (!incident) return ApiErrors.notFound('Incident')
  return apiSuccess(incident)
})

// PATCH /api/incidents/:id — Update investigation/status
export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER')

  const body = await req.json()
  const input = updateIncidentSchema.parse(body)

  const existing = await IncidentService.getById(params.id, auth.organizationId)
  if (!existing) return ApiErrors.notFound('Incident')

  const updated = await IncidentService.update(params.id, auth.organizationId, input)

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'INCIDENT_UPDATED',
    entityType: 'Incident',
    entityId: params.id,
    description: `Updated incident: ${existing.title} — ${input.status || 'details updated'}`,
    previousValues: { status: existing.status },
    newValues: { status: updated.status },
  })

  return apiSuccess(updated)
})
```

---

## 14. Route Handlers — Task Management

### 14.1 Task List & Create

```typescript
// src/app/api/tasks/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { parsePagination, buildPagination } from '@/lib/pagination'
import { createTaskSchema, taskFilterSchema } from '@/lib/validations/task'
import { TaskService } from '@/lib/services/task-service'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/tasks
export const GET = withAuth(async (req, { auth }) => {
  const searchParams = new URL(req.url).searchParams
  const pagination = parsePagination(searchParams)
  const filters = taskFilterSchema.parse({
    status: searchParams.get('status'),
    priority: searchParams.get('priority'),
    assignedToId: searchParams.get('assignedToId'),
    domain: searchParams.get('domain'),
    overdue: searchParams.get('overdue'),
    source: searchParams.get('source'),
  })

  // STAFF users can only see their own tasks
  if (auth.role === 'STAFF') {
    filters.assignedToId = auth.dbUserId
  }

  const { tasks, total } = await TaskService.list({
    organizationId: auth.organizationId,
    pagination,
    filters,
  })

  const { meta } = buildPagination(pagination, total)
  return apiSuccess(tasks, { meta })
})

// POST /api/tasks — Create a manual task
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'MANAGER')

  const body = await req.json()
  const input = createTaskSchema.parse(body)

  const task = await TaskService.create({
    organizationId: auth.organizationId,
    createdById: auth.dbUserId,
    source: 'MANUAL',
    ...input,
  })

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TASK_CREATED',
    entityType: 'Task',
    entityId: task.id,
    description: `Created task: ${input.title}`,
  })

  // Notify the assigned user if different from creator
  if (input.assignedToId && input.assignedToId !== auth.dbUserId) {
    NotificationService.create({
      organizationId: auth.organizationId,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `${auth.fullName} assigned you: ${input.title}`,
      priority: input.priority === 'URGENT' ? 'HIGH' : 'NORMAL',
      entityType: 'Task',
      entityId: task.id,
      targetUserId: input.assignedToId,
    })
  }

  return apiSuccess(task, undefined, 201)
})
```

### 14.2 Single Task Operations

```typescript
// src/app/api/tasks/[id]/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { updateTaskSchema } from '@/lib/validations/task'
import { TaskService } from '@/lib/services/task-service'
import { ComplianceService } from '@/lib/services/compliance-service'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/tasks/:id
export const GET = withAuth(async (req, { params, auth }) => {
  const task = await TaskService.getById(params.id, auth.organizationId)
  if (!task) return ApiErrors.notFound('Task')

  // STAFF can only view own tasks
  if (auth.role === 'STAFF' && task.assignedToId !== auth.dbUserId) {
    return ApiErrors.forbidden('You can only view tasks assigned to you')
  }

  return apiSuccess(task)
})

// PATCH /api/tasks/:id
export const PATCH = withAuth(async (req, { params, auth }) => {
  const body = await req.json()
  const input = updateTaskSchema.parse(body)

  const existing = await TaskService.getById(params.id, auth.organizationId)
  if (!existing) return ApiErrors.notFound('Task')

  // STAFF can only update their own tasks, and only status/completionNotes
  if (auth.role === 'STAFF') {
    if (existing.assignedToId !== auth.dbUserId) {
      return ApiErrors.forbidden('You can only update tasks assigned to you')
    }
    // Only allow status and completionNotes changes for STAFF
    const allowedFields = { status: input.status, completionNotes: input.completionNotes }
    const updated = await TaskService.update(params.id, auth.organizationId, allowedFields)

    if (input.status === 'COMPLETED' && existing.gapId) {
      await TaskService.checkAndResolveGap(existing.gapId, auth.organizationId)
      ComplianceService.queueRecalculation(auth.organizationId)
    }

    AuditService.log({
      organizationId: auth.organizationId,
      userId: auth.dbUserId,
      action: 'TASK_UPDATED',
      entityType: 'Task',
      entityId: params.id,
      description: `Updated task status: ${existing.status} → ${input.status}`,
    })

    return apiSuccess(updated)
  }

  // MANAGER+ can update all fields
  requireMinRole(auth, 'MANAGER')
  const updated = await TaskService.update(params.id, auth.organizationId, input)

  if (input.status === 'COMPLETED' && existing.gapId) {
    await TaskService.checkAndResolveGap(existing.gapId, auth.organizationId)
    ComplianceService.queueRecalculation(auth.organizationId)
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TASK_UPDATED',
    entityType: 'Task',
    entityId: params.id,
    description: `Updated task: ${updated.title}`,
    previousValues: { status: existing.status, priority: existing.priority },
    newValues: { status: updated.status, priority: updated.priority },
  })

  return apiSuccess(updated)
})

// DELETE /api/tasks/:id — Only manual tasks
export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER')

  const existing = await TaskService.getById(params.id, auth.organizationId)
  if (!existing) return ApiErrors.notFound('Task')

  if (existing.source !== 'MANUAL') {
    return ApiErrors.badRequest('Only manually created tasks can be deleted. System tasks can be cancelled.')
  }

  await TaskService.delete(params.id, auth.organizationId)

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'TASK_DELETED',
    entityType: 'Task',
    entityId: params.id,
    description: `Deleted task: ${existing.title}`,
  })

  return apiSuccess({ deleted: true })
})
```

---

## 15. Route Handlers — Notifications

```typescript
// src/app/api/notifications/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { parsePagination, buildPagination } from '@/lib/pagination'
import { db } from '@/lib/db'

// GET /api/notifications — List for current user
export const GET = withAuth(async (req, { auth }) => {
  const searchParams = new URL(req.url).searchParams
  const pagination = parsePagination(searchParams)

  const where = {
    organizationId: auth.organizationId,
    OR: [
      { targetUserId: auth.dbUserId },
      { targetUserId: null }, // Org-wide notifications
    ],
    deletedAt: null,
  }

  const [notifications, total, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    db.notification.count({ where }),
    db.notification.count({
      where: { ...where, readAt: null },
    }),
  ])

  const { meta } = buildPagination(pagination, total)
  return apiSuccess({ notifications, unreadCount }, { meta })
})
```

```typescript
// src/app/api/notifications/read/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { z } from 'zod'
import { db } from '@/lib/db'

const markReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).max(50).optional(),
  markAll: z.boolean().optional().default(false),
})

// PATCH /api/notifications/read — Mark as read
export const PATCH = withAuth(async (req, { auth }) => {
  const body = await req.json()
  const { notificationIds, markAll } = markReadSchema.parse(body)

  const now = new Date()

  if (markAll) {
    await db.notification.updateMany({
      where: {
        organizationId: auth.organizationId,
        OR: [
          { targetUserId: auth.dbUserId },
          { targetUserId: null },
        ],
        readAt: null,
      },
      data: { readAt: now },
    })
  } else if (notificationIds?.length) {
    await db.notification.updateMany({
      where: {
        id: { in: notificationIds },
        organizationId: auth.organizationId,
        OR: [
          { targetUserId: auth.dbUserId },
          { targetUserId: null },
        ],
      },
      data: { readAt: now },
    })
  }

  return apiSuccess({ marked: true })
})
```

---

## 16. Route Handlers — Reports & Export

### 16.1 Compliance Report Generation

```typescript
// src/app/api/reports/generate/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { z } from 'zod'
import { ReportService } from '@/lib/services/report-service'

const generateReportSchema = z.object({
  type: z.enum([
    'full_compliance',
    'domain_summary',
    'gap_analysis',
    'evidence_summary',
    'staff_compliance',
  ]),
  domain: z.enum(['SAFE', 'EFFECTIVE', 'CARING', 'RESPONSIVE', 'WELL_LED']).optional(),
  dateRange: z.object({
    from: z.string().datetime({ offset: true }),
    to: z.string().datetime({ offset: true }),
  }).optional(),
})

// POST /api/reports/generate
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'MANAGER')

  const body = await req.json()
  const input = generateReportSchema.parse(body)

  const report = await ReportService.generate({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    ...input,
  })

  return apiSuccess(report)
})
```

### 16.2 AI Inspection Preparation

```typescript
// src/app/api/reports/inspection-prep/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { AIService } from '@/lib/services/ai-service'
import { ReportService } from '@/lib/services/report-service'
import { AuditService } from '@/lib/services/audit-service'

// POST /api/reports/inspection-prep — AI-powered inspection readiness report
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'MANAGER')

  const { allowed } = checkRateLimit(auth.dbUserId, 'aiGeneration')
  if (!allowed) return ApiErrors.tooManyRequests()

  // Gather all compliance data for AI context
  const prepData = await ReportService.gatherInspectionPrepData(auth.organizationId)

  // Generate AI inspection report
  const report = await AIService.generateInspectionPrep({
    organizationId: auth.organizationId,
    complianceData: prepData,
  })

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'INSPECTION_PREP_GENERATED',
    entityType: 'Report',
    entityId: 'inspection-prep',
    description: 'Generated AI inspection preparation report',
  })

  return apiSuccess(report)
})
```

### 16.3 Export to PDF/CSV

```typescript
// src/app/api/reports/export/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'
import { ReportService } from '@/lib/services/report-service'
import { StorageService } from '@/lib/services/storage-service'
import { AuditService } from '@/lib/services/audit-service'

const exportSchema = z.object({
  reportType: z.enum([
    'full_compliance', 'domain_summary', 'gap_analysis',
    'evidence_summary', 'staff_compliance', 'training_matrix',
    'incident_log', 'inspection_prep',
  ]),
  format: z.enum(['pdf', 'csv']),
  domain: z.enum(['SAFE', 'EFFECTIVE', 'CARING', 'RESPONSIVE', 'WELL_LED']).optional(),
})

// POST /api/reports/export
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'MANAGER')

  const { allowed } = checkRateLimit(auth.dbUserId, 'export')
  if (!allowed) return ApiErrors.tooManyRequests()

  const body = await req.json()
  const input = exportSchema.parse(body)

  // Generate the report content
  const reportBuffer = input.format === 'pdf'
    ? await ReportService.generatePdf(auth.organizationId, input.reportType, input.domain)
    : await ReportService.generateCsv(auth.organizationId, input.reportType, input.domain)

  const fileName = `${input.reportType}_${new Date().toISOString().split('T')[0]}.${input.format}`
  const mimeType = input.format === 'pdf' ? 'application/pdf' : 'text/csv'

  // Upload to storage for 24hr access
  const { fileUrl } = await StorageService.uploadBuffer({
    buffer: reportBuffer,
    fileName,
    mimeType,
    organizationId: auth.organizationId,
    category: 'reports',
    expiresIn: 86400, // 24 hours
  })

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'REPORT_EXPORTED',
    entityType: 'Report',
    entityId: input.reportType,
    description: `Exported ${input.reportType} as ${input.format.toUpperCase()}`,
  })

  return apiSuccess({ url: fileUrl, fileName, format: input.format, expiresIn: 86400 })
})
```

---

## 17. Route Handlers — Organization & Settings

### 17.1 Organization Details

```typescript
// src/app/api/organization/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { updateOrganizationSchema } from '@/lib/validations/organization'
import { db } from '@/lib/db'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/organization — Current organization details
export const GET = withAuth(async (req, { auth }) => {
  const org = await db.organization.findUnique({
    where: { id: auth.organizationId },
    include: {
      _count: {
        select: {
          users: { where: { deletedAt: null } },
          staff: { where: { isActive: true } },
          evidence: { where: { deletedAt: null } },
          policies: { where: { deletedAt: null } },
          incidents: true,
        },
      },
    },
  })
  if (!org) return ApiErrors.notFound('Organization')
  return apiSuccess(org)
})

// PATCH /api/organization — Update organization details
export const PATCH = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'ADMIN')

  const body = await req.json()
  const input = updateOrganizationSchema.parse(body)

  const updated = await db.organization.update({
    where: { id: auth.organizationId },
    data: input,
  })

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'ORGANIZATION_UPDATED',
    entityType: 'Organization',
    entityId: auth.organizationId,
    description: `Updated organization settings`,
  })

  return apiSuccess(updated)
})
```

### 17.2 User Management

```typescript
// src/app/api/organization/users/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { inviteUserSchema } from '@/lib/validations/organization'
import { db } from '@/lib/db'
import { NotificationService } from '@/lib/services/notification-service'
import { AuditService } from '@/lib/services/audit-service'

// GET /api/organization/users — List all users
export const GET = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'ADMIN')

  const users = await db.user.findMany({
    where: { organizationId: auth.organizationId, deletedAt: null },
    select: {
      id: true, clerkId: true, email: true,
      firstName: true, lastName: true, role: true,
      avatarUrl: true, lastLoginAt: true, createdAt: true,
    },
    orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
  })

  return apiSuccess(users)
})

// POST /api/organization/users — Invite a new user
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'ADMIN')

  const body = await req.json()
  const input = inviteUserSchema.parse(body)

  // Check if email already exists in this org
  const existing = await db.user.findFirst({
    where: { email: input.email, organizationId: auth.organizationId, deletedAt: null },
  })
  if (existing) return ApiErrors.conflict('User already exists in this organization')

  // Create user placeholder (will be completed when they sign up via Clerk)
  const user = await db.user.create({
    data: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      organizationId: auth.organizationId,
      clerkId: `pending_${crypto.randomUUID()}`, // Will be updated on Clerk signup
      isInvitePending: true,
    },
  })

  // Send invitation email
  await NotificationService.sendEmailNotification({
    to: input.email,
    subject: `You've been invited to CQC Compliance Platform`,
    template: 'user_invitation',
    data: {
      inviterName: auth.fullName,
      role: input.role,
      organizationName: (await db.organization.findUnique({ where: { id: auth.organizationId } }))?.name,
      signUpUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up?invite=${user.id}`,
    },
  })

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'USER_INVITED',
    entityType: 'User',
    entityId: user.id,
    description: `Invited ${input.email} as ${input.role}`,
  })

  return apiSuccess(user, undefined, 201)
})
```

```typescript
// src/app/api/organization/users/[id]/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { z } from 'zod'
import { db } from '@/lib/db'
import { AuditService } from '@/lib/services/audit-service'

const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']),
})

// PATCH /api/organization/users/:id — Update user role
export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN')

  const body = await req.json()
  const { role } = updateUserRoleSchema.parse(body)

  const user = await db.user.findFirst({
    where: { id: params.id, organizationId: auth.organizationId, deletedAt: null },
  })
  if (!user) return ApiErrors.notFound('User')
  if (user.role === 'OWNER') return ApiErrors.forbidden('Cannot change the owner role')
  if (params.id === auth.dbUserId) return ApiErrors.badRequest('Cannot change your own role')

  const updated = await db.user.update({
    where: { id: params.id },
    data: { role },
  })

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'USER_ROLE_CHANGED',
    entityType: 'User',
    entityId: params.id,
    description: `Changed ${user.email} role from ${user.role} to ${role}`,
    previousValues: { role: user.role },
    newValues: { role },
  })

  return apiSuccess(updated)
})

// DELETE /api/organization/users/:id — Remove user from organization
export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN')

  const user = await db.user.findFirst({
    where: { id: params.id, organizationId: auth.organizationId, deletedAt: null },
  })
  if (!user) return ApiErrors.notFound('User')
  if (user.role === 'OWNER') return ApiErrors.forbidden('Cannot remove the organization owner')
  if (params.id === auth.dbUserId) return ApiErrors.badRequest('Cannot remove yourself')

  await db.user.update({
    where: { id: params.id },
    data: { deletedAt: new Date(), organizationId: null },
  })

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'USER_REMOVED',
    entityType: 'User',
    entityId: params.id,
    description: `Removed ${user.email} from organization`,
  })

  return apiSuccess({ removed: true })
})
```

---

## 18. Route Handlers — Dashboard Aggregation

```typescript
// src/app/api/dashboard/overview/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { DashboardService } from '@/lib/services/dashboard-service'

/**
 * GET /api/dashboard/overview
 *
 * Single request fetches ALL dashboard data using parallel queries.
 * This is the primary endpoint for the main dashboard view.
 *
 * Returns:
 * {
 *   compliance: { overallScore, overallRating, domains[], trend },
 *   gaps: { total, critical, high, medium, low, recentlyResolved },
 *   tasks: { total, overdue, dueSoon[], myTasks[] },
 *   evidence: { total, expiringSoon, recentUploads },
 *   staff: { total, registrationExpiring, dbsExpiring, trainingExpiring },
 *   policies: { total, reviewDue, drafts, published },
 *   incidents: { totalThisMonth, openInvestigations, bySeverity },
 *   activity: ActivityLogEntry[],   // 10 most recent
 *   inspection: { nextDate, daysUntil, lastRating, readinessScore },
 *   notifications: { unreadCount },
 * }
 */
export const GET = withAuth(async (req, { auth }) => {
  const overview = await DashboardService.getOverview({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
  })
  return apiSuccess(overview)
})
```

```typescript
// src/app/api/dashboard/activity/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { parsePagination, buildPagination } from '@/lib/pagination'
import { db } from '@/lib/db'

// GET /api/dashboard/activity — Activity feed with pagination
export const GET = withAuth(async (req, { auth }) => {
  const searchParams = new URL(req.url).searchParams
  const pagination = parsePagination(searchParams)

  const where = { organizationId: auth.organizationId }

  const [activities, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    db.activityLog.count({ where }),
  ])

  const { meta } = buildPagination(pagination, total)
  return apiSuccess(activities, { meta })
})
```

---

## 19. AI Service Layer

### 19.1 AI Service Configuration

```typescript
// src/lib/services/ai-service.ts

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `You are a CQC (Care Quality Commission) compliance expert assistant for UK healthcare providers.
You have deep knowledge of:
- The CQC Single Assessment Framework and its 5 key questions (Safe, Effective, Caring, Responsive, Well-Led)
- The 34 quality statements under the new framework
- The Health and Social Care Act 2008 (Regulated Activities) Regulations 2014
- Fundamental Standards (Regulations 9-20A)
- Key Lines of Enquiry (KLOEs) and characteristics for each rating level
- Best practices for both aesthetic clinics and care homes

Always provide practical, actionable advice. Reference specific regulations, KLOEs, and quality statements where relevant.
Format responses in clear, structured markdown. Prioritize patient safety and regulatory compliance.`

export class AIService {
  /**
   * Generate a complete policy document from a template.
   */
  static async generatePolicy(params: {
    templateId: string
    customInstructions?: string
    organizationContext: {
      serviceType: string
      name: string
      registeredManager?: string
      bedCount?: number
      specialties?: string[]
    }
  }): Promise<{
    success: boolean
    title: string
    content: string
    description: string
    category: string
    linkedKloes: string[]
    linkedRegulations: string[]
  }> {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Generate a comprehensive CQC-compliant policy document.

Template: ${params.templateId}
Service Type: ${params.organizationContext.serviceType}
Organization: ${params.organizationContext.name}
${params.organizationContext.registeredManager ? `Registered Manager: ${params.organizationContext.registeredManager}` : ''}
${params.customInstructions ? `Additional Instructions: ${params.customInstructions}` : ''}

Respond in JSON format:
{
  "title": "Policy title",
  "description": "Brief description of the policy",
  "content": "Full policy content in markdown format with sections: Purpose, Scope, Definitions, Policy Statement, Procedures, Responsibilities, Monitoring & Review, References",
  "category": "policy category",
  "linkedKloes": ["S1", "E2"],
  "linkedRegulations": ["REG12", "REG17"]
}`,
        }],
      })

      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return { success: false, title: '', content: '', description: '', category: '', linkedKloes: [], linkedRegulations: [] }

      const parsed = JSON.parse(jsonMatch[0])
      return { success: true, ...parsed }
    } catch (error) {
      console.error('[AI_SERVICE] Policy generation failed:', error)
      return { success: false, title: '', content: '', description: '', category: '', linkedKloes: [], linkedRegulations: [] }
    }
  }

  /**
   * Generate prioritized recommendations for addressing compliance gaps.
   */
  static async generateRecommendations(params: {
    gaps: Array<{
      domain: string; kloeCode: string; severity: string
      description: string; currentState: string
    }>
    organizationContext: { serviceType: string; overallScore: number; domainScores: Record<string, number> }
  }): Promise<{
    success: boolean
    recommendations: Array<{
      priority: number
      title: string
      description: string
      estimatedEffort: string
      impactOnScore: string
      linkedGapIds: string[]
      steps: string[]
    }>
    summary: string
  }> {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Analyze these compliance gaps and provide a prioritized action plan:

Service Type: ${params.organizationContext.serviceType}
Overall Score: ${params.organizationContext.overallScore}%
Domain Scores: ${JSON.stringify(params.organizationContext.domainScores)}

Current Gaps:
${params.gaps.map((g, i) => `${i + 1}. [${g.severity}] ${g.domain}/${g.kloeCode}: ${g.description}`).join('\n')}

Respond in JSON with: { recommendations: [{ priority, title, description, estimatedEffort, impactOnScore, steps[] }], summary }`,
        }],
      })

      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return { success: false, recommendations: [], summary: '' }

      return { success: true, ...JSON.parse(jsonMatch[0]) }
    } catch (error) {
      console.error('[AI_SERVICE] Recommendations generation failed:', error)
      return { success: false, recommendations: [], summary: '' }
    }
  }

  /**
   * Generate a comprehensive inspection preparation report.
   */
  static async generateInspectionPrep(params: {
    organizationId: string
    complianceData: {
      overallScore: number
      domainScores: Array<{ domain: string; score: number; rating: string; gapCount: number }>
      criticalGaps: Array<{ description: string; domain: string; severity: string }>
      evidenceSummary: { total: number; expiringSoon: number; byDomain: Record<string, number> }
      staffSummary: { total: number; registrationExpiring: number; trainingCompliance: number }
      policySummary: { total: number; published: number; drafts: number; reviewDue: number }
      recentIncidents: Array<{ title: string; severity: string; status: string; date: string }>
    }
  }): Promise<{
    success: boolean
    report: {
      executiveSummary: string
      overallReadiness: string
      domainNarratives: Array<{
        domain: string
        rating: string
        narrative: string
        strengths: string[]
        areasForImprovement: string[]
        inspectorQuestions: string[]
      }>
      criticalActions: string[]
      evidenceChecklist: string[]
      staffPreparation: string[]
      dayOfInspection: string[]
    }
  }> {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Generate a comprehensive CQC inspection preparation report.

Compliance Data:
${JSON.stringify(params.complianceData, null, 2)}

Create a detailed preparation report in JSON format with:
{
  "executiveSummary": "Overall readiness assessment",
  "overallReadiness": "Ready|Mostly Ready|Needs Work|Not Ready",
  "domainNarratives": [{
    "domain": "SAFE",
    "rating": "predicted rating",
    "narrative": "What inspectors will look for and what to present",
    "strengths": ["areas of strength"],
    "areasForImprovement": ["areas needing work"],
    "inspectorQuestions": ["likely questions and how to respond"]
  }],
  "criticalActions": ["immediate actions before inspection"],
  "evidenceChecklist": ["documents to have ready"],
  "staffPreparation": ["how to prepare staff"],
  "dayOfInspection": ["practical tips for inspection day"]
}`,
        }],
      })

      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return { success: false, report: null as any }

      return { success: true, report: JSON.parse(jsonMatch[0]) }
    } catch (error) {
      console.error('[AI_SERVICE] Inspection prep generation failed:', error)
      return { success: false, report: null as any }
    }
  }

  /**
   * Compliance chatbot for answering CQC-related questions.
   */
  static async complianceChat(params: {
    message: string
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
    organizationContext?: { serviceType: string; overallScore?: number }
  }): Promise<{ success: boolean; response: string }> {
    try {
      const contextNote = params.organizationContext
        ? `\n\nContext: This user operates a ${params.organizationContext.serviceType} ${params.organizationContext.overallScore ? `with a current compliance score of ${params.organizationContext.overallScore}%` : ''}.`
        : ''

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SYSTEM_PROMPT + contextNote,
        messages: [
          ...params.conversationHistory.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user', content: params.message },
        ],
      })

      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      return { success: true, response: text }
    } catch (error) {
      console.error('[AI_SERVICE] Chat failed:', error)
      return { success: false, response: 'I apologize, but I\'m unable to respond right now. Please try again.' }
    }
  }
}
```

### 19.2 AI Chat Endpoint

```typescript
// src/app/api/ai/chat/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'
import { AIService } from '@/lib/services/ai-service'
import { db } from '@/lib/db'

const chatSchema = z.object({
  message: z.string().min(1).max(5000),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(10000),
  })).max(20).optional().default([]),
})

// POST /api/ai/chat — Compliance assistant chatbot
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'MANAGER')

  const { allowed } = checkRateLimit(auth.dbUserId, 'aiGeneration')
  if (!allowed) return ApiErrors.tooManyRequests()

  const body = await req.json()
  const input = chatSchema.parse(body)

  const org = await db.organization.findUnique({
    where: { id: auth.organizationId },
    select: { serviceType: true },
  })

  const score = await db.complianceScore.findFirst({
    where: { organizationId: auth.organizationId, isCurrent: true },
    select: { overallScore: true },
  })

  const result = await AIService.complianceChat({
    message: input.message,
    conversationHistory: input.conversationHistory,
    organizationContext: {
      serviceType: org?.serviceType || 'CARE_HOME',
      overallScore: score?.overallScore,
    },
  })

  if (!result.success) {
    return apiError('AI_GENERATION_FAILED', result.response, 502)
  }

  return apiSuccess({ response: result.response })
})
```

### 19.3 AI Suggestions Endpoint

```typescript
// src/app/api/ai/suggestions/route.ts

import { withAuth } from '@/lib/api-handler'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireMinRole } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { AIService } from '@/lib/services/ai-service'
import { GapService } from '@/lib/services/gap-service'
import { ComplianceService } from '@/lib/services/compliance-service'

// POST /api/ai/suggestions — Get AI recommendations based on current gaps
export const POST = withAuth(async (req, { auth }) => {
  requireMinRole(auth, 'MANAGER')

  const { allowed } = checkRateLimit(auth.dbUserId, 'aiGeneration')
  if (!allowed) return ApiErrors.tooManyRequests()

  const { gaps } = await GapService.list({
    organizationId: auth.organizationId,
    pagination: { page: 1, pageSize: 50, sortOrder: 'desc' },
    filters: { status: 'OPEN' },
  })

  if (gaps.length === 0) {
    return apiSuccess({ recommendations: [], summary: 'No open compliance gaps found.' })
  }

  const score = await ComplianceService.getCurrentScore(auth.organizationId)

  const result = await AIService.generateRecommendations({
    gaps: gaps.map(g => ({
      domain: g.domain,
      kloeCode: g.kloeCode || '',
      severity: g.severity,
      description: g.description,
      currentState: g.currentEvidence || '',
    })),
    organizationContext: {
      serviceType: score?.serviceType || 'CARE_HOME',
      overallScore: score?.overallScore || 0,
      domainScores: Object.fromEntries(
        (score?.domainScores || []).map(d => [d.domain, d.score])
      ),
    },
  })

  return apiSuccess(result)
})
```

---

## 20. Webhook Handlers

### 20.1 Clerk User Sync Webhook

```typescript
// src/app/api/webhooks/clerk/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { db } from '@/lib/db'

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    first_name: string | null
    last_name: string | null
    image_url: string | null
    public_metadata: Record<string, unknown>
    created_at: number
    updated_at: number
  }
}

export async function POST(req: NextRequest) {
  // Verify webhook signature via Svix
  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const body = await req.text()

  try {
    const wh = new Webhook(WEBHOOK_SECRET)
    const event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent

    switch (event.type) {
      case 'user.created': {
        const primaryEmail = event.data.email_addresses[0]?.email_address
        if (!primaryEmail) break

        // Check if this email was invited (pending user exists)
        const pendingUser = await db.user.findFirst({
          where: { email: primaryEmail, isInvitePending: true },
        })

        if (pendingUser) {
          // Complete the invited user record
          await db.user.update({
            where: { id: pendingUser.id },
            data: {
              clerkId: event.data.id,
              firstName: event.data.first_name || pendingUser.firstName,
              lastName: event.data.last_name || pendingUser.lastName,
              avatarUrl: event.data.image_url,
              isInvitePending: false,
            },
          })
        } else {
          // New user — create with OWNER role (they'll create an org during onboarding)
          await db.user.upsert({
            where: { clerkId: event.data.id },
            update: {
              email: primaryEmail,
              firstName: event.data.first_name,
              lastName: event.data.last_name,
              avatarUrl: event.data.image_url,
            },
            create: {
              clerkId: event.data.id,
              email: primaryEmail,
              firstName: event.data.first_name,
              lastName: event.data.last_name,
              avatarUrl: event.data.image_url,
              role: 'OWNER',
            },
          })
        }
        break
      }

      case 'user.updated': {
        const email = event.data.email_addresses[0]?.email_address
        await db.user.updateMany({
          where: { clerkId: event.data.id },
          data: {
            email,
            firstName: event.data.first_name,
            lastName: event.data.last_name,
            avatarUrl: event.data.image_url,
          },
        })
        break
      }

      case 'user.deleted': {
        await db.user.updateMany({
          where: { clerkId: event.data.id },
          data: { deletedAt: new Date() },
        })
        break
      }

      case 'session.created': {
        await db.user.updateMany({
          where: { clerkId: event.data.id },
          data: { lastLoginAt: new Date() },
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[WEBHOOK] Clerk webhook error:', error)
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 })
  }
}
```

---

## 21. Background Jobs (Inngest / Cron)

### 21.1 Daily Expiry Check

```typescript
// src/app/api/cron/expiry-check/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { NotificationService } from '@/lib/services/notification-service'

/**
 * GET /api/cron/expiry-check
 *
 * Runs daily via Vercel Cron.
 * Checks for expiring: evidence, policies, registrations, training, DBS.
 * Creates in-app notifications and sends email alerts for urgent items.
 *
 * Secured by CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const summary = {
    evidenceExpiring: 0, evidenceExpired: 0,
    policiesReviewDue: 0,
    registrationsExpiring: 0,
    trainingExpiring: 0,
    dbsExpiring: 0,
    organizations: 0,
  }

  // Process each active organization
  const orgs = await db.organization.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  })

  for (const org of orgs) {
    summary.organizations++

    // ── Evidence expiring within 30 days ──
    const expiringEvidence = await db.evidence.findMany({
      where: {
        organizationId: org.id,
        deletedAt: null,
        validUntil: { gte: now, lte: in30Days },
        status: { not: 'EXPIRED' },
      },
      select: { id: true, name: true, validUntil: true },
    })

    for (const ev of expiringEvidence) {
      summary.evidenceExpiring++
      const daysUntil = Math.ceil((ev.validUntil!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      await NotificationService.create({
        organizationId: org.id,
        type: 'EVIDENCE_EXPIRING',
        title: `Evidence Expiring Soon`,
        message: `"${ev.name}" expires in ${daysUntil} days`,
        priority: daysUntil <= 7 ? 'HIGH' : 'NORMAL',
        entityType: 'Evidence',
        entityId: ev.id,
        targetRoles: ['OWNER', 'ADMIN', 'MANAGER'],
      })
    }

    // ── Evidence already expired (mark status) ──
    const expiredEvidence = await db.evidence.updateMany({
      where: {
        organizationId: org.id,
        deletedAt: null,
        validUntil: { lt: now },
        status: { not: 'EXPIRED' },
      },
      data: { status: 'EXPIRED' },
    })
    summary.evidenceExpired += expiredEvidence.count

    // ── Policies with review dates in next 30 days ──
    const policiesReviewDue = await db.policy.findMany({
      where: {
        organizationId: org.id,
        deletedAt: null,
        reviewDate: { gte: now, lte: in30Days },
        status: 'PUBLISHED',
      },
      select: { id: true, title: true, reviewDate: true },
    })

    for (const pol of policiesReviewDue) {
      summary.policiesReviewDue++
      await NotificationService.create({
        organizationId: org.id,
        type: 'POLICY_REVIEW_DUE',
        title: 'Policy Review Due',
        message: `"${pol.title}" review date approaching`,
        priority: 'NORMAL',
        entityType: 'Policy',
        entityId: pol.id,
        targetRoles: ['OWNER', 'ADMIN', 'MANAGER'],
      })
    }

    // ── Staff registrations expiring within 30 days ──
    const regExpiring = await db.staffMember.findMany({
      where: {
        organizationId: org.id,
        isActive: true,
        registrationExpiry: { gte: now, lte: in30Days },
      },
      select: { id: true, firstName: true, lastName: true, registrationBody: true, registrationExpiry: true },
    })

    for (const staff of regExpiring) {
      summary.registrationsExpiring++
      const daysUntil = Math.ceil((staff.registrationExpiry!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      await NotificationService.create({
        organizationId: org.id,
        type: 'REGISTRATION_EXPIRING',
        title: 'Staff Registration Expiring',
        message: `${staff.firstName} ${staff.lastName}'s ${staff.registrationBody} registration expires in ${daysUntil} days`,
        priority: daysUntil <= 7 ? 'URGENT' : 'HIGH',
        entityType: 'StaffMember',
        entityId: staff.id,
        targetRoles: ['OWNER', 'ADMIN', 'MANAGER'],
      })
    }

    // ── Training expiring within 30 days ──
    const trainingExpiring = await db.trainingRecord.findMany({
      where: {
        staffMember: { organizationId: org.id, isActive: true },
        expiryDate: { gte: now, lte: in30Days },
      },
      include: { staffMember: { select: { firstName: true, lastName: true } } },
    })
    summary.trainingExpiring += trainingExpiring.length

    // ── DBS checks older than 3 years ──
    const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate())
    const dbsExpiring = await db.staffMember.findMany({
      where: {
        organizationId: org.id,
        isActive: true,
        dbsCertificateDate: { lt: threeYearsAgo },
        dbsUpdateService: false,
      },
      select: { id: true, firstName: true, lastName: true },
    })
    summary.dbsExpiring += dbsExpiring.length
  }

  console.log('[CRON] Expiry check completed:', summary)
  return NextResponse.json({ success: true, summary })
}
```

### 21.2 Weekly Compliance Recalculation

```typescript
// src/app/api/cron/compliance-recalc/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ComplianceService } from '@/lib/services/compliance-service'

/**
 * GET /api/cron/compliance-recalc
 *
 * Runs weekly via Vercel Cron.
 * Recalculates compliance scores for all active organizations.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orgs = await db.organization.findMany({
    where: { isActive: true, onboardingComplete: true },
    select: { id: true },
  })

  const results = { total: orgs.length, success: 0, failed: 0, errors: [] as string[] }

  for (const org of orgs) {
    try {
      await ComplianceService.recalculate(org.id, 'SYSTEM')
      results.success++
    } catch (error) {
      results.failed++
      results.errors.push(`${org.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  console.log('[CRON] Compliance recalculation completed:', results)
  return NextResponse.json({ success: true, results })
}
```

### 21.3 Vercel Cron Configuration

```json
// vercel.json (cron section)
{
  "crons": [
    {
      "path": "/api/cron/expiry-check",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/compliance-recalc",
      "schedule": "0 3 * * 0"
    }
  ]
}
```

| Job | Schedule | Path | Purpose |
|---|---|---|---|
| Expiry Check | Daily at 6AM UTC | `/api/cron/expiry-check` | Check evidence, policies, registrations, training, DBS |
| Compliance Recalc | Weekly Sunday 3AM UTC | `/api/cron/compliance-recalc` | Recalculate all org scores |

---

## 22. Service Layer — Business Logic Classes

> All service classes follow the same patterns: static methods, organizationId scoping, no auth checks (handled by route layer), comprehensive error handling.

### 22.1 AssessmentService

```typescript
// src/lib/services/assessment-service.ts

import { db } from '@/lib/db'
import { ComplianceService } from './compliance-service'
import { GapService } from './gap-service'
import { TaskService } from './task-service'

export class AssessmentService {
  /**
   * Save answers for a specific assessment step.
   * Creates a new assessment if assessmentId is not provided.
   */
  static async saveAnswers(params: {
    organizationId: string
    userId: string
    assessmentId?: string
    serviceType: string
    currentStep: number
    answers: Array<{
      questionId: string; questionText: string; step: number
      domain: string; kloeCode?: string
      answerValue: unknown; answerType: string
    }>
  }) {
    let assessmentId = params.assessmentId

    if (!assessmentId) {
      const assessment = await db.assessment.create({
        data: {
          organizationId: params.organizationId,
          conductedById: params.userId,
          serviceType: params.serviceType,
          status: 'IN_PROGRESS',
          currentStep: params.currentStep,
          answers: params.answers,
        },
      })
      assessmentId = assessment.id
    } else {
      // Merge answers with existing
      const existing = await db.assessment.findFirst({
        where: { id: assessmentId, organizationId: params.organizationId },
      })
      if (!existing) throw new Error('Assessment not found')

      const existingAnswers = (existing.answers as any[]) || []
      const newQuestionIds = new Set(params.answers.map(a => a.questionId))
      const merged = [
        ...existingAnswers.filter(a => !newQuestionIds.has(a.questionId)),
        ...params.answers,
      ]

      await db.assessment.update({
        where: { id: assessmentId },
        data: { currentStep: params.currentStep, answers: merged },
      })
    }

    return db.assessment.findUnique({ where: { id: assessmentId } })
  }

  /**
   * Run the full scoring engine on a completed assessment.
   * See 04-CQC-FRAMEWORK.md for complete algorithm.
   */
  static async calculate(params: {
    assessmentId: string
    organizationId: string
    userId: string
  }) {
    const assessment = await db.assessment.findFirst({
      where: { id: params.assessmentId, organizationId: params.organizationId },
    })
    if (!assessment) throw new Error('Assessment not found')

    const answers = assessment.answers as any[]

    // ── Step 1: Score each domain ──
    const domainScores: Record<string, { score: number; maxScore: number; answers: any[] }> = {}
    for (const answer of answers) {
      if (!domainScores[answer.domain]) {
        domainScores[answer.domain] = { score: 0, maxScore: 0, answers: [] }
      }
      domainScores[answer.domain].answers.push(answer)
      const { earned, max } = this.scoreAnswer(answer)
      domainScores[answer.domain].score += earned
      domainScores[answer.domain].maxScore += max
    }

    // ── Step 2: Calculate percentages and ratings ──
    const domains = Object.entries(domainScores).map(([domain, data]) => {
      const percentage = data.maxScore > 0 ? (data.score / data.maxScore) * 100 : 0
      return {
        domain,
        score: Math.round(percentage * 10) / 10,
        rating: this.scoreToRating(percentage),
        answeredQuestions: data.answers.length,
      }
    })

    // ── Step 3: Overall score (weighted average, lowest domain capped) ──
    const overallScore = domains.reduce((sum, d) => sum + d.score, 0) / domains.length
    const lowestDomain = domains.reduce((min, d) => d.score < min.score ? d : min, domains[0])
    const overallRating = this.calculateOverallRating(domains)

    // ── Step 4: Identify gaps ──
    const gaps = this.identifyGaps(answers, assessment.serviceType)

    // ── Step 5: Persist results ──
    await db.$transaction(async (tx) => {
      // Update assessment
      await tx.assessment.update({
        where: { id: params.assessmentId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          overallScore,
          overallRating,
          domainScores: domains,
        },
      })

      // Upsert compliance score
      await tx.complianceScore.updateMany({
        where: { organizationId: params.organizationId, isCurrent: true },
        data: { isCurrent: false },
      })

      await tx.complianceScore.create({
        data: {
          organizationId: params.organizationId,
          overallScore,
          overallRating,
          safeScore: domains.find(d => d.domain === 'SAFE')?.score || 0,
          effectiveScore: domains.find(d => d.domain === 'EFFECTIVE')?.score || 0,
          caringScore: domains.find(d => d.domain === 'CARING')?.score || 0,
          responsiveScore: domains.find(d => d.domain === 'RESPONSIVE')?.score || 0,
          wellLedScore: domains.find(d => d.domain === 'WELL_LED')?.score || 0,
          isCurrent: true,
          calculatedAt: new Date(),
          calculatedById: params.userId,
          assessmentId: params.assessmentId,
        },
      })

      // Create gaps
      for (const gap of gaps) {
        const created = await tx.complianceGap.create({
          data: {
            organizationId: params.organizationId,
            assessmentId: params.assessmentId,
            domain: gap.domain,
            kloeCode: gap.kloeCode,
            regulationCode: gap.regulationCode,
            severity: gap.severity,
            description: gap.description,
            recommendation: gap.recommendation,
            currentEvidence: gap.currentEvidence,
            requiredAction: gap.requiredAction,
            source: 'ASSESSMENT',
            status: 'OPEN',
          },
        })

        // Auto-create remediation task for each gap
        await tx.task.create({
          data: {
            organizationId: params.organizationId,
            title: `Resolve: ${gap.description}`,
            description: gap.recommendation,
            priority: gap.severity === 'CRITICAL' ? 'URGENT' : gap.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
            domain: gap.domain,
            kloeCode: gap.kloeCode,
            gapId: created.id,
            source: 'ASSESSMENT',
            status: 'TODO',
            createdById: params.userId,
          },
        })
      }

      // Mark onboarding complete
      await tx.organization.update({
        where: { id: params.organizationId },
        data: { onboardingComplete: true },
      })
    })

    return {
      overallScore,
      overallRating,
      domains,
      gapCount: gaps.length,
      criticalGaps: gaps.filter(g => g.severity === 'CRITICAL').length,
    }
  }

  private static scoreAnswer(answer: any): { earned: number; max: number } {
    switch (answer.answerType) {
      case 'yes_no':
        return { earned: answer.answerValue === true ? 1 : 0, max: 1 }
      case 'yes_no_partial':
        return { earned: answer.answerValue === 'yes' ? 1 : answer.answerValue === 'partial' ? 0.5 : 0, max: 1 }
      case 'scale':
        return { earned: Number(answer.answerValue) || 0, max: 5 }
      case 'multi_select':
        const selected = Array.isArray(answer.answerValue) ? answer.answerValue.length : 0
        return { earned: Math.min(selected, 5), max: 5 }
      default:
        return { earned: 0, max: 0 }
    }
  }

  private static scoreToRating(score: number): string {
    if (score >= 85) return 'OUTSTANDING'
    if (score >= 65) return 'GOOD'
    if (score >= 40) return 'REQUIRES_IMPROVEMENT'
    return 'INADEQUATE'
  }

  private static calculateOverallRating(domains: Array<{ score: number; rating: string }>): string {
    // CQC rule: overall can't be higher than the lowest domain
    const ratings = ['INADEQUATE', 'REQUIRES_IMPROVEMENT', 'GOOD', 'OUTSTANDING']
    const avgScore = domains.reduce((sum, d) => sum + d.score, 0) / domains.length
    const lowestRating = domains.reduce((min, d) =>
      ratings.indexOf(d.rating) < ratings.indexOf(min) ? d.rating : min, 'OUTSTANDING')
    const avgRating = this.scoreToRating(avgScore)
    return ratings.indexOf(avgRating) <= ratings.indexOf(lowestRating) ? avgRating : lowestRating
  }

  private static identifyGaps(answers: any[], serviceType: string): any[] {
    // See 04-CQC-FRAMEWORK.md Section 8 for full gap identification algorithm
    const gaps: any[] = []
    for (const answer of answers) {
      const { earned, max } = this.scoreAnswer(answer)
      if (max > 0 && earned / max < 0.5) {
        gaps.push({
          domain: answer.domain,
          kloeCode: answer.kloeCode,
          severity: earned === 0 ? 'CRITICAL' : 'HIGH',
          description: `Non-compliant: ${answer.questionText}`,
          recommendation: `Address compliance gap for ${answer.domain} domain`,
          currentEvidence: `Score: ${earned}/${max}`,
          requiredAction: `Achieve minimum compliance threshold`,
        })
      }
    }
    return gaps
  }

  static async getLatest(organizationId: string) {
    return db.assessment.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async getById(id: string, organizationId: string) {
    return db.assessment.findFirst({
      where: { id, organizationId },
    })
  }
}
```

### 22.2 ComplianceService

```typescript
// src/lib/services/compliance-service.ts

import { db } from '@/lib/db'

// Pending recalculations (debounced)
const pendingRecalculations = new Map<string, NodeJS.Timeout>()

export class ComplianceService {
  static async getCurrentScore(organizationId: string) {
    const score = await db.complianceScore.findFirst({
      where: { organizationId, isCurrent: true },
    })
    if (!score) return null

    // Get previous score for trend
    const previous = await db.complianceScore.findFirst({
      where: { organizationId, isCurrent: false },
      orderBy: { calculatedAt: 'desc' },
    })

    const domainScores = [
      { domain: 'SAFE', score: score.safeScore },
      { domain: 'EFFECTIVE', score: score.effectiveScore },
      { domain: 'CARING', score: score.caringScore },
      { domain: 'RESPONSIVE', score: score.responsiveScore },
      { domain: 'WELL_LED', score: score.wellLedScore },
    ].map(d => ({
      ...d,
      rating: d.score >= 85 ? 'OUTSTANDING' : d.score >= 65 ? 'GOOD' : d.score >= 40 ? 'REQUIRES_IMPROVEMENT' : 'INADEQUATE',
    }))

    return {
      ...score,
      domainScores,
      trend: previous ? {
        direction: score.overallScore > previous.overallScore ? 'UP' : score.overallScore < previous.overallScore ? 'DOWN' : 'STABLE',
        previousScore: previous.overallScore,
        changePercent: Math.round(((score.overallScore - previous.overallScore) / previous.overallScore) * 100 * 10) / 10,
      } : null,
    }
  }

  static async recalculate(organizationId: string, userId: string) {
    // Full recalculation based on current state of evidence, policies, staff, gaps, incidents
    // This is a simplified version; the full algorithm is in 04-CQC-FRAMEWORK.md

    const [evidence, policies, staff, gaps, incidents] = await Promise.all([
      db.evidence.count({ where: { organizationId, deletedAt: null, status: 'CURRENT' } }),
      db.policy.count({ where: { organizationId, deletedAt: null, status: 'PUBLISHED' } }),
      db.staffMember.count({ where: { organizationId, isActive: true } }),
      db.complianceGap.groupBy({
        by: ['domain', 'severity'],
        where: { organizationId, status: 'OPEN' },
        _count: true,
      }),
      db.incident.count({
        where: { organizationId, severity: { in: ['SEVERE', 'CRITICAL'] }, status: { not: 'CLOSED' } },
      }),
    ])

    // Domain scoring logic (simplified — full algo in 04-CQC-FRAMEWORK.md)
    // In production this calls the full compliance engine
    const currentScore = await this.getCurrentScore(organizationId)
    if (!currentScore) return null

    return currentScore
  }

  /**
   * Queue a recalculation with debouncing (max 1 per 30 seconds per org).
   * This prevents rapid-fire recalculations when multiple changes happen at once.
   */
  static queueRecalculation(organizationId: string) {
    if (pendingRecalculations.has(organizationId)) {
      clearTimeout(pendingRecalculations.get(organizationId)!)
    }
    pendingRecalculations.set(
      organizationId,
      setTimeout(async () => {
        pendingRecalculations.delete(organizationId)
        try {
          await this.recalculate(organizationId, 'SYSTEM')
        } catch (error) {
          console.error(`[COMPLIANCE] Recalculation failed for org ${organizationId}:`, error)
        }
      }, 30_000)
    )
  }
}
```

### 22.3 DashboardService

```typescript
// src/lib/services/dashboard-service.ts

import { db } from '@/lib/db'
import { ComplianceService } from './compliance-service'

export class DashboardService {
  /**
   * Fetch all dashboard data in parallel for maximum performance.
   */
  static async getOverview(params: { organizationId: string; userId: string }) {
    const { organizationId, userId } = params
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      compliance,
      gapCounts,
      taskData,
      evidenceData,
      staffData,
      policyData,
      incidentData,
      recentActivity,
      org,
      unreadNotifs,
    ] = await Promise.all([
      // Compliance score
      ComplianceService.getCurrentScore(organizationId),

      // Gap breakdown
      db.complianceGap.groupBy({
        by: ['severity'],
        where: { organizationId, status: 'OPEN' },
        _count: true,
      }),

      // Tasks
      Promise.all([
        db.task.count({ where: { organizationId, status: { not: 'COMPLETED' } } }),
        db.task.count({ where: { organizationId, status: 'OVERDUE' } }),
        db.task.findMany({
          where: { organizationId, dueDate: { lte: thirtyDaysFromNow }, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
          orderBy: { dueDate: 'asc' },
          take: 5,
          include: { assignedTo: { select: { firstName: true, lastName: true } } },
        }),
        db.task.findMany({
          where: { organizationId, assignedToId: userId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
          orderBy: { priority: 'desc' },
          take: 5,
        }),
      ]),

      // Evidence
      Promise.all([
        db.evidence.count({ where: { organizationId, deletedAt: null } }),
        db.evidence.count({
          where: { organizationId, deletedAt: null, validUntil: { lte: thirtyDaysFromNow, gte: now } },
        }),
        db.evidence.count({
          where: { organizationId, deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
        }),
      ]),

      // Staff
      Promise.all([
        db.staffMember.count({ where: { organizationId, isActive: true } }),
        db.staffMember.count({
          where: { organizationId, isActive: true, registrationExpiry: { lte: thirtyDaysFromNow, gte: now } },
        }),
      ]),

      // Policies
      Promise.all([
        db.policy.count({ where: { organizationId, deletedAt: null } }),
        db.policy.count({ where: { organizationId, deletedAt: null, status: 'PUBLISHED' } }),
        db.policy.count({ where: { organizationId, deletedAt: null, status: 'DRAFT' } }),
        db.policy.count({
          where: { organizationId, deletedAt: null, reviewDate: { lte: thirtyDaysFromNow, gte: now } },
        }),
      ]),

      // Incidents this month
      Promise.all([
        db.incident.count({ where: { organizationId, createdAt: { gte: thirtyDaysAgo } } }),
        db.incident.count({ where: { organizationId, status: 'UNDER_INVESTIGATION' } }),
      ]),

      // Activity feed (10 most recent)
      db.activityLog.findMany({
        where: { organizationId },
        include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Organization (for inspection date)
      db.organization.findUnique({
        where: { id: organizationId },
        select: { cqcNextInspection: true, cqcLastInspection: true, cqcCurrentRating: true },
      }),

      // Unread notifications
      db.notification.count({
        where: {
          organizationId,
          OR: [{ targetUserId: userId }, { targetUserId: null }],
          readAt: null,
        },
      }),
    ])

    return {
      compliance,
      gaps: {
        total: gapCounts.reduce((sum, g) => sum + g._count, 0),
        critical: gapCounts.find(g => g.severity === 'CRITICAL')?._count || 0,
        high: gapCounts.find(g => g.severity === 'HIGH')?._count || 0,
        medium: gapCounts.find(g => g.severity === 'MEDIUM')?._count || 0,
        low: gapCounts.find(g => g.severity === 'LOW')?._count || 0,
      },
      tasks: {
        total: taskData[0],
        overdue: taskData[1],
        dueSoon: taskData[2],
        myTasks: taskData[3],
      },
      evidence: {
        total: evidenceData[0],
        expiringSoon: evidenceData[1],
        recentUploads: evidenceData[2],
      },
      staff: {
        total: staffData[0],
        registrationExpiring: staffData[1],
      },
      policies: {
        total: policyData[0],
        published: policyData[1],
        drafts: policyData[2],
        reviewDue: policyData[3],
      },
      incidents: {
        totalThisMonth: incidentData[0],
        openInvestigations: incidentData[1],
      },
      activity: recentActivity,
      inspection: org?.cqcNextInspection ? {
        nextDate: org.cqcNextInspection,
        daysUntil: Math.ceil((org.cqcNextInspection.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        lastRating: org.cqcCurrentRating,
      } : null,
      notifications: { unreadCount: unreadNotifs },
    }
  }
}
```

---

## 23. TanStack Query Hooks — Client Integration

### 23.1 API Client Wrapper

```typescript
// src/lib/api-client.ts

export class ApiError extends Error {
  code: string
  statusCode: number
  details?: unknown

  constructor(code: string, message: string, statusCode: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit & { params?: Record<string, string | number | boolean | undefined> }
): Promise<{ data: T; meta?: any }> {
  let fullUrl = url

  // Append query params
  if (options?.params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value))
      }
    }
    const qs = searchParams.toString()
    if (qs) fullUrl += `?${qs}`
  }

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const json = await res.json()

  if (!res.ok) {
    throw new ApiError(
      json.error?.code || 'UNKNOWN',
      json.error?.message || 'An error occurred',
      res.status,
      json.error?.details
    )
  }

  return json
}
```

### 23.2 Dashboard Hooks

```typescript
// src/hooks/use-dashboard.ts

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => apiFetch('/api/dashboard/overview'),
    staleTime: 30_000,       // Consider fresh for 30s
    refetchInterval: 60_000, // Auto-refresh every 60s
  })
}

export function useActivity(page = 1) {
  return useQuery({
    queryKey: ['dashboard', 'activity', page],
    queryFn: () => apiFetch('/api/dashboard/activity', { params: { page } }),
  })
}
```

### 23.3 Compliance Hooks

```typescript
// src/hooks/use-compliance.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

export function useComplianceScore() {
  return useQuery({
    queryKey: ['compliance', 'score'],
    queryFn: () => apiFetch('/api/compliance/score'),
    staleTime: 60_000,
  })
}

export function useComplianceGaps(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['compliance', 'gaps', filters],
    queryFn: () => apiFetch('/api/compliance/gaps', { params: filters }),
  })
}

export function useRecalculate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch('/api/compliance/score', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateGap() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ gapId, ...data }: { gapId: string; status: string; resolutionNotes?: string }) =>
      apiFetch(`/api/compliance/gaps/${gapId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
```

### 23.4 Evidence Hooks

```typescript
// src/hooks/use-evidence.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

export function useEvidence(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['evidence', filters],
    queryFn: () => apiFetch('/api/evidence', { params: filters }),
  })
}

export function useEvidenceDetail(id: string) {
  return useQuery({
    queryKey: ['evidence', id],
    queryFn: () => apiFetch(`/api/evidence/${id}`),
    enabled: !!id,
  })
}

/**
 * Two-step evidence upload:
 * 1. Upload file to storage (returns fileUrl, storagePath)
 * 2. Create evidence metadata record
 */
export function useUploadEvidence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      file: File
      name: string
      category: string
      description?: string
      linkedKloes?: string[]
      linkedRegulations?: string[]
      validFrom?: string
      validUntil?: string
    }) => {
      // Step 1: Upload file
      const formData = new FormData()
      formData.append('file', params.file)
      formData.append('category', params.category)

      const uploadRes = await fetch('/api/evidence/upload', {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('File upload failed')
      const { data: uploadData } = await uploadRes.json()

      // Step 2: Create metadata
      return apiFetch('/api/evidence', {
        method: 'POST',
        body: JSON.stringify({
          name: params.name,
          category: params.category,
          description: params.description,
          linkedKloes: params.linkedKloes,
          linkedRegulations: params.linkedRegulations,
          validFrom: params.validFrom,
          validUntil: params.validUntil,
          fileUrl: uploadData.fileUrl,
          fileName: uploadData.fileName,
          fileType: uploadData.fileType,
          fileSize: uploadData.fileSize,
          storagePath: uploadData.storagePath,
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] })
      queryClient.invalidateQueries({ queryKey: ['compliance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteEvidence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/evidence/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] })
      queryClient.invalidateQueries({ queryKey: ['compliance'] })
    },
  })
}
```

### 23.5 Assessment Hooks

```typescript
// src/hooks/use-assessment.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

export function useCurrentAssessment() {
  return useQuery({
    queryKey: ['assessment', 'current'],
    queryFn: () => apiFetch('/api/assessment'),
  })
}

export function useSaveAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiFetch('/api/assessment', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment'] })
    },
  })
}

export function useCalculateAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assessmentId: string) =>
      apiFetch('/api/assessment/calculate', { method: 'POST', body: JSON.stringify({ assessmentId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment'] })
      queryClient.invalidateQueries({ queryKey: ['compliance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
```

### 23.6 Notification Hooks

```typescript
// src/hooks/use-notifications.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: ['notifications', page],
    queryFn: () => apiFetch('/api/notifications', { params: { page } }),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const { data } = await apiFetch<{ unreadCount: number }>('/api/notifications', { params: { pageSize: 1 } })
      return data.unreadCount
    },
    refetchInterval: 30_000, // Poll every 30s
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { notificationIds?: string[]; markAll?: boolean }) =>
      apiFetch('/api/notifications/read', { method: 'PATCH', body: JSON.stringify(params) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
```

### 23.7 Query Key Convention

| Feature | Query Key Pattern | Invalidated By |
|---|---|---|
| Dashboard | `['dashboard', 'overview']` | Most mutations |
| Activity | `['dashboard', 'activity', page]` | All write operations |
| Compliance Score | `['compliance', 'score']` | Evidence, policy, gap, training changes |
| Compliance Gaps | `['compliance', 'gaps', filters]` | Gap updates, assessment |
| Evidence List | `['evidence', filters]` | Upload, update, delete |
| Evidence Detail | `['evidence', id]` | Update, delete |
| Policies | `['policies', filters]` | Create, update, approve, publish |
| Staff | `['staff', filters]` | Create, update, deactivate |
| Training | `['training', filters]` | Create, update, delete |
| Incidents | `['incidents', filters]` | Create, update |
| Tasks | `['tasks', filters]` | Create, update, complete |
| Notifications | `['notifications', page]` | Mark read |
| Assessment | `['assessment', 'current']` | Save, calculate |

---

## 24. File Upload & Storage Service

```typescript
// src/lib/services/storage-service.ts

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET_NAME = 'compliance-files'

export class StorageService {
  /**
   * Upload a file to Supabase Storage.
   * Path: {orgId}/{category}/{year}/{uuid}-{filename}
   */
  static async upload(params: {
    file: File
    organizationId: string
    category: string
    userId: string
  }): Promise<{
    fileUrl: string
    storagePath: string
    fileName: string
    fileType: string
    fileSize: number
  }> {
    const year = new Date().getFullYear()
    const uniqueId = randomUUID().slice(0, 8)
    const sanitizedName = params.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${params.organizationId}/${params.category}/${year}/${uniqueId}-${sanitizedName}`

    const buffer = Buffer.from(await params.file.arrayBuffer())

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: params.file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw new Error(`Upload failed: ${error.message}`)

    // Generate signed URL (7 days for evidence/policies, shorter for reports)
    const expiresIn = params.category === 'reports' ? 86400 : 604800
    const { data: signedUrl } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresIn)

    return {
      fileUrl: signedUrl?.signedUrl || '',
      storagePath,
      fileName: params.file.name,
      fileType: params.file.type,
      fileSize: params.file.size,
    }
  }

  /**
   * Upload a buffer (for generated PDFs/CSVs).
   */
  static async uploadBuffer(params: {
    buffer: Buffer
    fileName: string
    mimeType: string
    organizationId: string
    category: string
    expiresIn?: number
  }): Promise<{ fileUrl: string; storagePath: string }> {
    const year = new Date().getFullYear()
    const uniqueId = randomUUID().slice(0, 8)
    const storagePath = `${params.organizationId}/${params.category}/${year}/${uniqueId}-${params.fileName}`

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, params.buffer, {
        contentType: params.mimeType,
        cacheControl: '3600',
      })

    if (error) throw new Error(`Upload failed: ${error.message}`)

    const { data: signedUrl } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, params.expiresIn || 604800)

    return { fileUrl: signedUrl?.signedUrl || '', storagePath }
  }

  /**
   * Delete a file from storage.
   */
  static async delete(storagePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath])

    if (error) console.error(`[STORAGE] Delete failed for ${storagePath}:`, error)
  }

  /**
   * Get a fresh signed URL for an existing file.
   */
  static async getSignedUrl(storagePath: string, expiresIn = 604800): Promise<string> {
    const { data } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresIn)

    return data?.signedUrl || ''
  }
}
```

**MIME Types & Limits:**

| Type | MIME Types | Max Size |
|---|---|---|
| PDF | `application/pdf` | 50MB |
| Images | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | 50MB |
| Word | `application/msword`, `.wordprocessingml.document` | 50MB |
| Excel | `application/vnd.ms-excel`, `.spreadsheetml.sheet` | 50MB |
| CSV/Text | `text/csv`, `text/plain` | 50MB |

---

## 25. Audit Logging Service

```typescript
// src/lib/services/audit-service.ts

import { db } from '@/lib/db'

interface AuditLogEntry {
  organizationId: string
  userId: string
  action: string
  entityType: string
  entityId: string
  description: string
  previousValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}

export class AuditService {
  /**
   * Write an audit log entry.
   * Fire-and-forget — never blocks the main operation.
   */
  static log(entry: AuditLogEntry): void {
    // Intentionally not awaited — fire and forget
    db.activityLog.create({
      data: {
        organizationId: entry.organizationId,
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        description: entry.description,
        metadata: {
          ...(entry.previousValues && { previousValues: entry.previousValues }),
          ...(entry.newValues && { newValues: entry.newValues }),
        },
      },
    }).catch((error) => {
      // Log the error but never propagate it
      console.error('[AUDIT] Failed to write audit log:', error, entry)
    })
  }

  /**
   * Log a failed operation.
   */
  static logFailure(params: {
    organizationId: string
    userId: string
    action: string
    entityType: string
    entityId?: string
    error: string
  }): void {
    this.log({
      ...params,
      entityId: params.entityId || 'N/A',
      description: `FAILED: ${params.action} — ${params.error}`,
    })
  }
}
```

**Audit Actions Reference:**

| Action | Trigger | Entity Type |
|---|---|---|
| `ASSESSMENT_STEP_SAVED` | Save assessment step | Assessment |
| `ASSESSMENT_CALCULATED` | Run scoring engine | Assessment |
| `EVIDENCE_UPLOADED` | Upload evidence | Evidence |
| `EVIDENCE_UPDATED` | Edit evidence metadata | Evidence |
| `EVIDENCE_DELETED` | Soft delete evidence | Evidence |
| `POLICY_CREATED` | Create policy manually | Policy |
| `POLICY_AI_GENERATED` | AI generates policy | Policy |
| `POLICY_UPDATED` | Edit policy content | Policy |
| `POLICY_APPROVED` | Approve policy | Policy |
| `POLICY_PUBLISHED` | Publish policy | Policy |
| `POLICY_DELETED` | Soft delete policy | Policy |
| `STAFF_CREATED` | Add staff member | StaffMember |
| `STAFF_UPDATED` | Edit staff details | StaffMember |
| `STAFF_DEACTIVATED` | Deactivate staff | StaffMember |
| `TRAINING_RECORDED` | Add training record | TrainingRecord |
| `TRAINING_UPDATED` | Edit training record | TrainingRecord |
| `TRAINING_DELETED` | Delete training record | TrainingRecord |
| `INCIDENT_REPORTED` | Report incident | Incident |
| `INCIDENT_UPDATED` | Update investigation | Incident |
| `TASK_CREATED` | Create manual task | Task |
| `TASK_UPDATED` | Update task | Task |
| `TASK_DELETED` | Delete manual task | Task |
| `GAP_STATUS_UPDATED` | Resolve/accept gap | ComplianceGap |
| `USER_INVITED` | Invite user to org | User |
| `USER_ROLE_CHANGED` | Change user role | User |
| `USER_REMOVED` | Remove user from org | User |
| `ORGANIZATION_UPDATED` | Edit org settings | Organization |
| `REPORT_EXPORTED` | Export PDF/CSV | Report |
| `INSPECTION_PREP_GENERATED` | AI inspection prep | Report |

---

## 26. Notification Dispatch Service

```typescript
// src/lib/services/notification-service.ts

import { db } from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface CreateNotificationParams {
  organizationId: string
  type: string
  title: string
  message: string
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  entityType?: string
  entityId?: string
  targetUserId?: string       // Specific user
  targetRoles?: string[]      // All users with these roles
}

export class NotificationService {
  /**
   * Create in-app notification.
   * For HIGH/URGENT priority, also send email.
   */
  static async create(params: CreateNotificationParams): Promise<void> {
    const { organizationId, targetUserId, targetRoles, ...data } = params

    try {
      if (targetUserId) {
        // Target specific user
        await db.notification.create({
          data: { organizationId, targetUserId, ...data, priority: data.priority || 'NORMAL' },
        })

        if (['HIGH', 'URGENT'].includes(data.priority || '')) {
          const user = await db.user.findUnique({
            where: { id: targetUserId },
            select: { email: true, firstName: true, emailNotifications: true },
          })
          if (user?.emailNotifications) {
            await this.sendEmailNotification({
              to: user.email,
              subject: data.title,
              template: 'notification',
              data: { userName: user.firstName, ...data },
            })
          }
        }
      } else if (targetRoles?.length) {
        // Target all users with specified roles
        const users = await db.user.findMany({
          where: { organizationId, role: { in: targetRoles as any[] }, deletedAt: null },
          select: { id: true, email: true, firstName: true, emailNotifications: true },
        })

        // Create notification for each user
        await db.notification.createMany({
          data: users.map(user => ({
            organizationId,
            targetUserId: user.id,
            ...data,
            priority: data.priority || 'NORMAL',
          })),
        })

        // Send emails for HIGH/URGENT
        if (['HIGH', 'URGENT'].includes(data.priority || '')) {
          for (const user of users) {
            if (user.emailNotifications) {
              await this.sendEmailNotification({
                to: user.email,
                subject: data.title,
                template: 'notification',
                data: { userName: user.firstName, ...data },
              })
            }
          }
        }
      } else {
        // Org-wide notification (targetUserId = null)
        await db.notification.create({
          data: { organizationId, ...data, priority: data.priority || 'NORMAL' },
        })
      }
    } catch (error) {
      // Notifications should never block main operations
      console.error('[NOTIFICATION] Failed to create notification:', error)
    }
  }

  /**
   * Send email via Resend.
   */
  static async sendEmailNotification(params: {
    to: string
    subject: string
    template: string
    data: Record<string, unknown>
  }): Promise<void> {
    try {
      await resend.emails.send({
        from: 'CQC Compliance <notifications@cqc-compliance.app>',
        to: params.to,
        subject: params.subject,
        html: this.renderEmailTemplate(params.template, params.data),
      })
    } catch (error) {
      console.error('[EMAIL] Failed to send email:', error)
    }
  }

  private static renderEmailTemplate(template: string, data: Record<string, unknown>): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.cqc-compliance.com'
    const userName = (data.userName as string) || 'there'
    const title = (data.title as string) || 'Notification'
    const message = (data.message as string) || ''
    const entityType = data.entityType as string
    const entityId = data.entityId as string

    const actionUrl = entityType && entityId
      ? `${appUrl}/${entityType.toLowerCase()}s/${entityId}`
      : appUrl

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f5f5f5">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;margin-top:24px">
    <tr>
      <td style="background:#1e293b;padding:24px 32px">
        <h1 style="color:#fff;margin:0;font-size:20px">CQC Compliance Platform</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px">
        <p style="color:#334155;font-size:16px;margin:0 0 16px">Hi ${userName},</p>
        <h2 style="color:#1e293b;font-size:18px;margin:0 0 8px">${title}</h2>
        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px">${message}</p>
        <a href="${actionUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500">View Details</a>
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0">
        <p style="color:#94a3b8;font-size:12px;margin:0">You received this because you have email notifications enabled. <a href="${appUrl}/settings" style="color:#64748b">Manage preferences</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`
  }
}
```

---

## 27. API Route Map — Quick Reference

### Complete Endpoint Registry

| Method | Path | Auth | Min Role | Rate Limit | Purpose |
|---|---|---|---|---|---|
| **Webhooks** | | | | | |
| `POST` | `/api/webhooks/clerk` | Public | — | — | Clerk user sync webhook |
| **Assessment** | | | | | |
| `GET` | `/api/assessment` | ✅ | VIEWER | default | Get latest assessment |
| `POST` | `/api/assessment` | ✅ | ADMIN | default | Save assessment answers |
| `POST` | `/api/assessment/calculate` | ✅ | ADMIN | assessment | Run scoring engine |
| `GET` | `/api/assessment/[id]` | ✅ | VIEWER | default | Get single assessment |
| **Compliance** | | | | | |
| `GET` | `/api/compliance/score` | ✅ | VIEWER | default | Current score + domains |
| `POST` | `/api/compliance/score` | ✅ | MANAGER | assessment | Force recalculate |
| `GET` | `/api/compliance/gaps` | ✅ | VIEWER | default | List gaps with filters |
| `GET` | `/api/compliance/gaps/[id]` | ✅ | VIEWER | default | Single gap detail |
| `PATCH` | `/api/compliance/gaps/[id]` | ✅ | MANAGER | default | Update gap status |
| **Evidence** | | | | | |
| `GET` | `/api/evidence` | ✅ | VIEWER | default | List evidence |
| `POST` | `/api/evidence` | ✅ | STAFF | default | Create evidence metadata |
| `POST` | `/api/evidence/upload` | ✅ | STAFF | upload | Upload file to storage |
| `GET` | `/api/evidence/[id]` | ✅ | VIEWER | default | Single evidence detail |
| `PATCH` | `/api/evidence/[id]` | ✅ | STAFF | default | Update evidence |
| `DELETE` | `/api/evidence/[id]` | ✅ | ADMIN | default | Soft delete evidence |
| **Policies** | | | | | |
| `GET` | `/api/policies` | ✅ | VIEWER | default | List policies |
| `POST` | `/api/policies` | ✅ | MANAGER | default | Create policy manually |
| `POST` | `/api/policies/generate` | ✅ | MANAGER | aiGeneration | AI-generate policy |
| `GET` | `/api/policies/templates` | ✅ | VIEWER | default | Available templates |
| `GET` | `/api/policies/[id]` | ✅ | VIEWER | default | Single policy detail |
| `PATCH` | `/api/policies/[id]` | ✅ | MANAGER | default | Update policy |
| `DELETE` | `/api/policies/[id]` | ✅ | ADMIN | default | Soft delete policy |
| `POST` | `/api/policies/[id]/approve` | ✅ | ADMIN | default | Approve policy |
| `POST` | `/api/policies/[id]/publish` | ✅ | ADMIN | default | Publish policy |
| `GET` | `/api/policies/[id]/versions` | ✅ | VIEWER | default | Version history |
| **Staff** | | | | | |
| `GET` | `/api/staff` | ✅ | VIEWER | default | List staff members |
| `POST` | `/api/staff` | ✅ | MANAGER | default | Add staff member |
| `GET` | `/api/staff/[id]` | ✅ | VIEWER | default | Single staff detail |
| `PATCH` | `/api/staff/[id]` | ✅ | MANAGER | default | Update staff |
| `DELETE` | `/api/staff/[id]` | ✅ | ADMIN | default | Deactivate staff |
| **Training** | | | | | |
| `GET` | `/api/staff/training` | ✅ | VIEWER | default | Training matrix/list |
| `POST` | `/api/staff/training` | ✅ | MANAGER | default | Add training record |
| `GET` | `/api/staff/training/[id]` | ✅ | VIEWER | default | Single record |
| `PATCH` | `/api/staff/training/[id]` | ✅ | MANAGER | default | Update record |
| `DELETE` | `/api/staff/training/[id]` | ✅ | ADMIN | default | Delete record |
| **Incidents** | | | | | |
| `GET` | `/api/incidents` | ✅ | VIEWER | default | List incidents |
| `POST` | `/api/incidents` | ✅ | STAFF | default | Report incident |
| `GET` | `/api/incidents/[id]` | ✅ | VIEWER | default | Single incident |
| `PATCH` | `/api/incidents/[id]` | ✅ | MANAGER | default | Update investigation |
| **Tasks** | | | | | |
| `GET` | `/api/tasks` | ✅ | STAFF* | default | List tasks (*STAFF: own only) |
| `POST` | `/api/tasks` | ✅ | MANAGER | default | Create manual task |
| `GET` | `/api/tasks/[id]` | ✅ | STAFF* | default | Single task (*own only) |
| `PATCH` | `/api/tasks/[id]` | ✅ | STAFF* | default | Update task (*status only) |
| `DELETE` | `/api/tasks/[id]` | ✅ | MANAGER | default | Delete manual task |
| **Reports** | | | | | |
| `POST` | `/api/reports/generate` | ✅ | MANAGER | default | Generate compliance report |
| `POST` | `/api/reports/inspection-prep` | ✅ | MANAGER | aiGeneration | AI inspection prep |
| `POST` | `/api/reports/export` | ✅ | MANAGER | export | Export PDF/CSV |
| **Dashboard** | | | | | |
| `GET` | `/api/dashboard/overview` | ✅ | VIEWER | default | Full dashboard aggregate |
| `GET` | `/api/dashboard/activity` | ✅ | VIEWER | default | Activity feed |
| **AI** | | | | | |
| `POST` | `/api/ai/chat` | ✅ | MANAGER | aiGeneration | Compliance chatbot |
| `POST` | `/api/ai/suggestions` | ✅ | MANAGER | aiGeneration | AI recommendations |
| **Organization** | | | | | |
| `GET` | `/api/organization` | ✅ | VIEWER | default | Organization details |
| `PATCH` | `/api/organization` | ✅ | ADMIN | default | Update organization |
| `GET` | `/api/organization/users` | ✅ | ADMIN | default | List users |
| `POST` | `/api/organization/users` | ✅ | ADMIN | default | Invite user |
| `PATCH` | `/api/organization/users/[id]` | ✅ | ADMIN | default | Update user role |
| `DELETE` | `/api/organization/users/[id]` | ✅ | ADMIN | default | Remove user |
| **Notifications** | | | | | |
| `GET` | `/api/notifications` | ✅ | VIEWER | default | List notifications |
| `PATCH` | `/api/notifications/read` | ✅ | VIEWER | default | Mark as read |
| **CQC Reference** | | | | | |
| `GET` | `/api/cqc/domains` | Public | — | default | All CQC domains |
| `GET` | `/api/cqc/kloes` | Public | — | default | KLOEs by service type |
| `GET` | `/api/cqc/regulations` | Public | — | default | All regulations |
| **Cron Jobs** | | | | | |
| `GET` | `/api/cron/expiry-check` | CRON_SECRET | — | cron | Daily expiry check |
| `GET` | `/api/cron/compliance-recalc` | CRON_SECRET | — | cron | Weekly recalculation |

### Total: 55 Endpoints

| Category | Count |
|---|---|
| Assessment | 4 |
| Compliance | 5 |
| Evidence | 6 |
| Policies | 10 |
| Staff | 5 |
| Training | 5 |
| Incidents | 4 |
| Tasks | 5 |
| Reports | 3 |
| Dashboard | 2 |
| AI | 2 |
| Organization | 6 |
| Notifications | 2 |
| CQC Reference | 3 |
| Webhooks | 1 |
| Cron | 2 |
| **Total** | **55** |

---

### Cross-Cutting Concerns Summary

| Concern | Implementation | Location |
|---|---|---|
| Authentication | Clerk JWT/session | `middleware.ts`, `lib/auth.ts` |
| Authorization (RBAC) | `requireRole()`, `requireMinRole()` | `lib/auth.ts` |
| Input Validation | Zod schemas | `lib/validations/*.ts` |
| Error Handling | `withAuth()` wrapper, `handleError()` | `lib/api-handler.ts` |
| Rate Limiting | In-memory LRU (Redis in prod) | `lib/rate-limiter.ts` |
| Pagination | Standardized `page`/`pageSize` | `lib/pagination.ts` |
| Audit Logging | Fire-and-forget `AuditService.log()` | `lib/services/audit-service.ts` |
| Multi-tenancy | `organizationId` scoping on all queries | Every service method |
| Soft Deletes | `deletedAt` timestamp | Evidence, Policy, Staff, User |
| Compliance Triggers | `ComplianceService.queueRecalculation()` | Evidence, policy, training, gap routes |
| File Storage | Supabase Storage with signed URLs | `lib/services/storage-service.ts` |
| Email Notifications | Resend for HIGH/URGENT | `lib/services/notification-service.ts` |
| AI Integration | Anthropic Claude Sonnet 4 | `lib/services/ai-service.ts` |
| Background Jobs | Vercel Cron (daily + weekly) | `api/cron/*.ts` |

---

> **End of 05-API-SERVICES.md** — This specification defines the complete data flow layer for the CQC Compliance Platform. Every screen in `03-UI-UX.md` maps to endpoints defined here, every database model in `02-DATABASE.md` is accessed through these services, and every CQC framework rule in `04-CQC-FRAMEWORK.md` is enforced through this business logic layer.
