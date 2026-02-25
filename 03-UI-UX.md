# CQC Compliance Platform — UI/UX Specification

> **File 3 of 7** | Companion to `01-ARCHITECTURE.md` and `02-DATABASE.md`
> **Design System:** shadcn/ui + Geist fonts + Tailwind CSS
> **Icons:** Lucide React | **Charts:** Recharts
> **Last Updated:** February 2026

---

## 1. Design System Foundation

### 1.1 Visual Language

```
Font Family:      Geist Sans (body), Geist Mono (code/numbers/scores)
Border Radius:    8px (cards), 6px (buttons/inputs), 12px (modals)
Spacing Scale:    4, 8, 12, 16, 20, 24, 32, 40, 48, 64
Shadow:           sm (cards), md (dropdowns), lg (modals)
Motion:           Framer Motion — 200ms ease-out (default)
```

### 1.2 Color System

```
┌─────────────────────────────────────────────────────────────┐
│  SEMANTIC COLORS                                             │
│                                                              │
│  Background       #FFFFFF (light) / #09090B (dark)          │
│  Foreground        #09090B (light) / #FAFAFA (dark)          │
│  Card              #FFFFFF / #0A0A0A                          │
│  Border            #E4E4E7 / #27272A                         │
│  Muted             #F4F4F5 / #27272A                         │
│  Muted Foreground  #71717A / #A1A1AA                         │
│                                                              │
│  CQC DOMAIN COLORS                                           │
│                                                              │
│  Safe              #3B82F6 (blue-500)     Shield icon        │
│  Effective         #8B5CF6 (violet-500)   Target icon        │
│  Caring            #EC4899 (pink-500)     Heart icon         │
│  Responsive        #F59E0B (amber-500)    Zap icon           │
│  Well-Led          #10B981 (emerald-500)  Crown icon         │
│                                                              │
│  STATUS COLORS                                               │
│                                                              │
│  Outstanding       #10B981 (emerald)                         │
│  Good              #3B82F6 (blue)                            │
│  Requires Improv.  #F59E0B (amber)                           │
│  Inadequate        #EF4444 (red)                             │
│                                                              │
│  SEVERITY COLORS                                             │
│                                                              │
│  Critical          #DC2626 (red-600)      ⬤ filled circle   │
│  High              #F97316 (orange-500)                      │
│  Medium            #EAB308 (yellow-500)                      │
│  Low               #6B7280 (gray-500)                        │
│                                                              │
│  UI SEMANTIC                                                 │
│                                                              │
│  Primary           #18181B (zinc-900)     Buttons, links     │
│  Primary Hover     #27272A (zinc-800)                        │
│  Destructive       #EF4444 (red-500)      Delete actions     │
│  Success           #22C55E (green-500)    Confirmations      │
│  Warning           #F59E0B (amber-500)    Alerts             │
│  Info              #3B82F6 (blue-500)     Informational      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Typography Scale

```
Display:    text-4xl  font-bold   Geist Sans    (36px / 40px)
Heading 1:  text-3xl  font-bold   Geist Sans    (30px / 36px)
Heading 2:  text-2xl  font-semibold              (24px / 32px)
Heading 3:  text-xl   font-semibold              (20px / 28px)
Heading 4:  text-lg   font-medium                (18px / 28px)
Body:       text-base font-normal                (16px / 24px)
Small:      text-sm   font-normal                (14px / 20px)
Caption:    text-xs   font-normal text-muted     (12px / 16px)
Mono:       text-base font-mono   Geist Mono     (scores, IDs, numbers)
```

### 1.4 Icon Usage Convention

```
Sidebar Nav:        20px stroke-1.5   (Lucide defaults)
Card Headers:       20px stroke-1.5
Inline text:        16px stroke-1.5   (badges, chips)
Button icons:       16px stroke-2     (left of label)
Status indicators:  12px              (colored dots, not icons)

Domain Icons (consistent across app):
  Safe         →  Shield          (lucide-react)
  Effective    →  Target
  Caring       →  Heart
  Responsive   →  Zap
  Well-Led     →  Crown
```

---

## 2. Layout Architecture

### 2.1 Three Layout Shells

The application uses three layout wrappers. The middleware determines which layout to render based on auth status and onboarding state.

```
LAYOUT 1: AUTH LAYOUT (sign-in, sign-up)
┌──────────────────────────────────────────────────────────────┐
│  Full viewport (100vh). Two-panel split. No sidebar.         │
│  Used by: /sign-in, /sign-up                                │
└──────────────────────────────────────────────────────────────┘

LAYOUT 2: ONBOARDING LAYOUT (assessment wizard)
┌──────────────────────────────────────────────────────────────┐
│  Logo header + sign-out. Left progress sidebar + right       │
│  content area. No main navigation.                           │
│  Used by: /welcome, /assessment/[step], /assessment/results  │
└──────────────────────────────────────────────────────────────┘

LAYOUT 3: DASHBOARD LAYOUT (main app)
┌──────────────────────────────────────────────────────────────┐
│  Collapsible sidebar nav + header bar + main content area.   │
│  Used by: All authenticated pages post-onboarding.           │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Responsive Breakpoints

```
sm:    640px     Mobile landscape
md:    768px     Tablet portrait (sidebar collapses)
lg:    1024px    Tablet landscape / small desktop
xl:    1280px    Desktop (full sidebar visible)
2xl:   1536px    Wide desktop (max content width: 1280px)
```

---

## 3. Authentication — Single-Page Auth (`/sign-in`)

No separate marketing landing page. The root `/` URL redirects to the auth screen. Users see sign-in by default with a toggle to sign-up. Both forms live on the same page; no page navigation needed.

### 3.1 Auth Page Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                         FULL VIEWPORT (100vh)                            │
│                                                                          │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │                              │  │                                  │  │
│  │       LEFT PANEL             │  │        RIGHT PANEL               │  │
│  │       (Brand side)           │  │        (Auth forms)              │  │
│  │       bg-slate-950           │  │        bg-white                  │  │
│  │       50% width              │  │        50% width                 │  │
│  │                              │  │                                  │  │
│  │   ┌──────────────────────┐   │  │   ┌──────────────────────────┐  │  │
│  │   │  Logo                │   │  │   │                          │  │  │
│  │   │  CQC Compliance      │   │  │   │   "Welcome back"        │  │  │
│  │   │  Platform             │   │  │   │    or                   │  │  │
│  │   └──────────────────────┘   │  │   │   "Create your          │  │  │
│  │                              │  │   │    account"              │  │  │
│  │   "Achieve Outstanding       │  │   │                          │  │  │
│  │    CQC Ratings with          │  │   │   ┌──────────────────┐   │  │  │
│  │    Confidence"               │  │   │   │ Email            │   │  │  │
│  │                              │  │   │   └──────────────────┘   │  │  │
│  │   ┌──────────────────────┐   │  │   │   ┌──────────────────┐   │  │  │
│  │   │  Testimonial card    │   │  │   │   │ Password         │   │  │  │
│  │   │  ┌───┐               │   │  │   │   └──────────────────┘   │  │  │
│  │   │  │ AV│ "This tool    │   │  │   │                          │  │  │
│  │   │  │   │  got us from  │   │  │   │   [Forgot password?]     │  │  │
│  │   │  └───┘  RI to Good   │   │  │   │                          │  │  │
│  │   │         in 4 months" │   │  │   │   ┌──────────────────┐   │  │  │
│  │   │  — Sarah T, Mgr      │   │  │   │   │   Sign In >>>>   │   │  │  │
│  │   └──────────────────────┘   │  │   │   └──────────────────┘   │  │  │
│  │                              │  │   │                          │  │  │
│  │   ┌──────────────────────┐   │  │   │   ─── or continue ───   │  │  │
│  │   │  Trust badges:       │   │  │   │                          │  │  │
│  │   │  🔒 UK GDPR          │   │  │   │   [G] Google  [M] MS    │  │  │
│  │   │  🏥 NHS DSPT Ready   │   │  │   │                          │  │  │
│  │   │  ☁️  UK Data Centre   │   │  │   │   Don't have an         │  │  │
│  │   └──────────────────────┘   │  │   │   account? [Sign up]     │  │  │
│  │                              │  │   │                          │  │  │
│  │                              │  │   └──────────────────────────┘  │  │
│  └──────────────────────────────┘  └──────────────────────────────────┘  │
│                                                                          │
│  MOBILE: Left panel hidden. Right panel full-width with logo at top.     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Auth Form States

```
STATE 1: SIGN IN (default)
┌──────────────────────────────────┐
│                                  │
│   Welcome back                   │
│   Sign in to your account        │
│                                  │
│   Email                          │
│   ┌────────────────────────────┐ │
│   │ you@clinic.co.uk           │ │
│   └────────────────────────────┘ │
│                                  │
│   Password                       │
│   ┌────────────────────────────┐ │
│   │ ••••••••          [👁]     │ │
│   └────────────────────────────┘ │
│                                  │
│   [Forgot password?]      right  │
│                                  │
│   ┌────────────────────────────┐ │
│   │       Sign In              │ │  ← Primary button, full width
│   └────────────────────────────┘ │
│                                  │
│   ──────── or continue with ──── │
│                                  │
│   ┌────────────┐ ┌────────────┐  │
│   │  Google     │ │ Microsoft  │  │  ← Outline buttons, half width
│   └────────────┘ └────────────┘  │
│                                  │
│   Don't have an account?         │
│   [Sign up] ← text link toggle  │
│                                  │
└──────────────────────────────────┘


STATE 2: SIGN UP (toggled — same page, form swaps with animation)
┌──────────────────────────────────┐
│                                  │
│   Create your account            │
│   Start your compliance journey  │
│                                  │
│   ┌─────────────┐ ┌────────────┐ │
│   │ First name  │ │ Last name  │ │  ← Side by side, 50/50
│   └─────────────┘ └────────────┘ │
│                                  │
│   Email                          │
│   ┌────────────────────────────┐ │
│   │ you@clinic.co.uk           │ │
│   └────────────────────────────┘ │
│                                  │
│   Password                       │
│   ┌────────────────────────────┐ │
│   │ ••••••••          [👁]     │ │
│   └────────────────────────────┘ │
│   Min 8 chars, 1 number,        │
│   1 uppercase                    │
│                                  │
│   ☐ I agree to the Terms of      │
│     Service and Privacy Policy   │
│                                  │
│   ┌────────────────────────────┐ │
│   │     Create Account         │ │
│   └────────────────────────────┘ │
│                                  │
│   ──────── or continue with ──── │
│                                  │
│   ┌────────────┐ ┌────────────┐  │
│   │  Google     │ │ Microsoft  │  │
│   └────────────┘ └────────────┘  │
│                                  │
│   Already have an account?       │
│   [Sign in] ← toggles back      │
│                                  │
└──────────────────────────────────┘


STATE 3: FORGOT PASSWORD
┌──────────────────────────────────┐
│                                  │
│   ← Back to sign in             │
│                                  │
│   Reset your password            │
│   Enter your email and we'll     │
│   send you a reset link          │
│                                  │
│   Email                          │
│   ┌────────────────────────────┐ │
│   │ you@clinic.co.uk           │ │
│   └────────────────────────────┘ │
│                                  │
│   ┌────────────────────────────┐ │
│   │     Send Reset Link        │ │
│   └────────────────────────────┘ │
│                                  │
└──────────────────────────────────┘


STATE 4: CHECK YOUR EMAIL (after submit)
┌──────────────────────────────────┐
│                                  │
│        ┌────────────┐            │
│        │   ✉️ icon   │            │
│        └────────────┘            │
│                                  │
│   Check your email               │
│   We sent a reset link to        │
│   j***@clinic.co.uk              │
│                                  │
│   Didn't receive it?             │
│   [Resend email] (60s cooldown)  │
│                                  │
│   [← Back to sign in]           │
│                                  │
└──────────────────────────────────┘
```

### 3.3 Auth Form Validation

```
INLINE VALIDATION (on blur):
┌────────────────────────────────┐
│ Email                          │
│ ┌────────────────────────────┐ │
│ │ notanemail                 │ │  ← red border (ring-red-500)
│ └────────────────────────────┘ │
│ ⚠ Please enter a valid email   │  ← text-destructive text-sm
└────────────────────────────────┘

PASSWORD STRENGTH (sign-up only, live):
┌────────────────────────────────┐
│ Password                       │
│ ┌────────────────────────────┐ │
│ │ MyP@ss1                    │ │
│ └────────────────────────────┘ │
│ ████████░░░░  Strong           │
│ ✓ 8+ characters               │
│ ✓ Uppercase letter             │
│ ✓ Number                       │
│ ✕ Special character            │  ← unchecked = text-muted
└────────────────────────────────┘

SUBMIT ERROR (API response):
┌────────────────────────────────┐
│ ┌────────────────────────────┐ │
│ │ ⚠ Invalid email or         │ │  ← bg-destructive/10 p-3 rounded
│ │   password. Please try     │ │
│ │   again.                   │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘

LOADING STATE:
Button text → Spinner icon + "Signing in..." (disabled)
```

### 3.4 Clerk Implementation Notes

```
Component:  Custom UI using Clerk's useSignIn() and useSignUp() hooks
Strategy:   NOT prebuilt Clerk components — we need full design control
            for the split-panel layout with testimonials.
Social:     Google + Microsoft OAuth via Clerk social connections
MFA:        Enabled in Clerk dashboard (optional for users)
Redirect:   After sign-up → /welcome (onboarding)
            After sign-in → /dashboard (if onboarding done) or /welcome
```

---

## 4. Onboarding Flow

After sign-up (or first sign-in), users who have `onboardingComplete: false` in their Clerk metadata are redirected here. This is a linear flow — users cannot skip steps.

### 4.1 Onboarding Layout — Left Progress / Right Content

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ┌─── Logo + "CQC Compliance" ─────────────────────────── [Sign Out] ─┐ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │                    │  │                                            │  │
│  │  PROGRESS SIDEBAR  │  │            CONTENT AREA                   │  │
│  │  (260px, fixed)    │  │            (fluid, scrollable)            │  │
│  │  bg-slate-50       │  │                                            │  │
│  │                    │  │  Step content renders here.                │  │
│  │  ● Step 1          │  │  Each step is a full-page form            │  │
│  │    Welcome         │  │  with next/back navigation                │  │
│  │                    │  │  at the bottom.                           │  │
│  │  ○ Step 2          │  │                                            │  │
│  │    Organization    │  │                                            │  │
│  │                    │  │                                            │  │
│  │  ○ Step 3          │  │                                            │  │
│  │    Assessment      │  │                                            │  │
│  │                    │  │                                            │  │
│  │  ○ Step 4          │  │                                            │  │
│  │    Results         │  │                                            │  │
│  │                    │  │                                            │  │
│  │  ──────────────    │  │                                            │  │
│  │                    │  │                                            │  │
│  │  Step 1 of 4       │  │                                            │  │
│  │  ████░░░░ 25%      │  │                                            │  │
│  │                    │  │                                            │  │
│  └────────────────────┘  └────────────────────────────────────────────┘  │
│                                                                          │
│  MOBILE: Progress sidebar → horizontal stepper bar at top.               │
│  ┌──────────────────────────────────────────────────┐                    │
│  │  ●───────○───────○───────○                       │                    │
│  │  Step 1   Step 2   Step 3   Step 4               │                    │
│  │  ████████░░░░░░░░░░░░░░░░░░░░  25%               │                    │
│  └──────────────────────────────────────────────────┘                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

PROGRESS SIDEBAR STATES:
  ● Active step    → bg-primary text-white rounded-full (number inside)
  ✓ Completed step → bg-green-100 text-green-600 (checkmark inside)
  ○ Upcoming step  → bg-muted text-muted-foreground
  Line between:    → solid (completed), dashed (upcoming)
```

### 4.2 Step 1 — Welcome + Service Type Selection

```
CONTENT AREA:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Welcome to CQC Compliance                                      │
│   Let's set up your compliance workspace.                        │
│   This takes about 10 minutes.                                   │
│                                                                  │
│   What type of service do you provide?                           │
│                                                                  │
│   ┌────────────────────────────┐  ┌────────────────────────────┐ │
│   │                            │  │                            │ │
│   │  ┌────┐                    │  │  ┌────┐                    │ │
│   │  │ 💉 │                    │  │  │ 🏠 │                    │ │
│   │  └────┘                    │  │  └────┘                    │ │
│   │                            │  │                            │ │
│   │  Aesthetic Clinic          │  │  Care Home                 │ │
│   │                            │  │                            │ │
│   │  Independent healthcare    │  │  Residential adult         │ │
│   │  providing cosmetic or     │  │  social care with or      │ │
│   │  aesthetic procedures      │  │  without nursing           │ │
│   │                            │  │                            │ │
│   │  ○ Selected                │  │  ○ Selected                │ │
│   │                            │  │                            │ │
│   └────────────────────────────┘  └────────────────────────────┘ │
│                                                                  │
│   SELECTED STATE:                                                │
│   ┌────────────────────────────┐                                 │
│   │  ring-2 ring-primary       │  ← Blue border                 │
│   │  bg-primary/5              │  ← Subtle blue tint            │
│   │  scale(1.02)               │  ← Slight scale animation      │
│   │  ● Radio dot filled        │                                 │
│   └────────────────────────────┘                                 │
│                                                                  │
│                                           ┌──────────────────┐   │
│                                           │    Continue →     │   │
│                                           └──────────────────┘   │
│                                                                  │
│   Button disabled until a service type is selected.              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.3 Step 2 — Organization Details

```
CONTENT AREA:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Tell us about your organization                                │
│   We'll use this to personalize your compliance requirements.    │
│                                                                  │
│   Organization name *                                            │
│   ┌────────────────────────────────────────────────────────────┐ │
│   │ Brightwood Care Home                                       │ │
│   └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│   ┌───────────────────────────┐  ┌─────────────────────────────┐ │
│   │ CQC Provider ID           │  │ CQC Location ID             │ │
│   │ ┌───────────────────────┐ │  │ ┌─────────────────────────┐ │ │
│   │ │ 1-123456789           │ │  │ │ 1-987654321             │ │ │
│   │ └───────────────────────┘ │  │ └─────────────────────────┘ │ │
│   │ Optional — found on CQC   │  │ Optional                    │ │
│   └───────────────────────────┘  └─────────────────────────────┘ │
│                                                                  │
│   Registered Manager name                                        │
│   ┌────────────────────────────────────────────────────────────┐ │
│   │ Jane Smith                                                 │ │
│   └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│   ┌───────────────────────────┐  ┌─────────────────────────────┐ │
│   │ Postcode *                │  │ Number of beds / treatment  │ │
│   │ ┌───────────────────────┐ │  │ rooms *                     │ │
│   │ │ SW1A 1AA              │ │  │ ┌─────────────────────────┐ │ │
│   │ └───────────────────────┘ │  │ │ 35                      │ │ │
│   └───────────────────────────┘  │ └─────────────────────────┘ │ │
│                                  └─────────────────────────────┘ │
│                                                                  │
│   Current CQC rating (if known)                                  │
│   ┌────────────────────────────────────────────────────────────┐ │
│   │ ▼  Select...                                               │ │
│   │    Not yet rated                                           │ │
│   │    Outstanding                                             │ │
│   │    Good                                                    │ │
│   │    Requires Improvement                                    │ │
│   │    Inadequate                                              │ │
│   └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│   Last inspection date (if known)                                │
│   ┌────────────────────────────────────────────────────────────┐ │
│   │ 📅  dd/mm/yyyy                                             │ │
│   └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────┐                  ┌──────────────────────┐  │
│  │   ← Back         │                  │    Continue →        │  │
│  └──────────────────┘                  └──────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.4 Step 3 — Compliance Assessment

This is the core assessment wizard. Questions are grouped by CQC domain with domain tabs.

```
CONTENT AREA (assessment questions):
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Compliance Assessment                                          │
│   Answer honestly — this determines your starting position.      │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │  Domain tabs (horizontal, scrollable on mobile):          │   │
│   │                                                           │   │
│   │  [🛡 Safe ✓]  [🎯 Effective]  [💜 Caring]                │   │
│   │  [⚡ Responsive]  [👑 Well-Led]                            │   │
│   │                                                           │   │
│   │  Active tab: colored underline matching domain color.     │   │
│   │  Completed tabs: show ✓ checkmark in green.               │   │
│   │  Disabled tabs: not clickable until prior tab done.       │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   🛡 Safe — Question 3 of 8                                     │
│   ████████░░ 3/8                                                 │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │                                                          │   │
│   │  S1: Do you have a written safeguarding policy           │   │
│   │  that is reviewed at least annually?                     │   │
│   │                                                          │   │
│   │  ┌─────────────────────┐  ┌─────────────────────┐       │   │
│   │  │  ✓  Yes, current    │  │  ✕  No / Outdated   │       │   │
│   │  └─────────────────────┘  └─────────────────────┘       │   │
│   │                                                          │   │
│   │  ┌─────────────────────┐  ┌─────────────────────┐       │   │
│   │  │  ~ Partially        │  │  ?  Not sure         │       │   │
│   │  └─────────────────────┘  └─────────────────────┘       │   │
│   │                                                          │   │
│   │  Answer cards are clickable. Selected gets:              │   │
│   │  ring-2 + colored bg (green=Yes, red=No,                │   │
│   │  amber=Partial, gray=Unsure)                             │   │
│   │                                                          │   │
│   │  "No" and "Not sure" → gap created with severity         │   │
│   │  "Partially" → gap created with MEDIUM severity          │   │
│   │                                                          │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │  ℹ  Why this matters                                     │   │
│   │  Safeguarding is a fundamental standard (Reg 13).        │   │
│   │  CQC inspectors will ask to see your policy and          │   │
│   │  evidence of staff training. This is prosecutable.       │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────┐                  ┌──────────────────────┐  │
│  │   ← Previous     │                  │    Next Question →   │  │
│  └──────────────────┘                  └──────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.5 Assessment Question Types

```
TYPE 1: YES / NO / PARTIAL / UNSURE (most common)
┌───────────────────────────────────────┐
│  ┌─────────┐ ┌─────────┐             │
│  │ ✓ Yes   │ │ ✕ No    │             │
│  └─────────┘ └─────────┘             │
│  ┌─────────┐ ┌─────────┐             │
│  │ ~ Partial│ │ ? Unsure│             │
│  └─────────┘ └─────────┘             │
└───────────────────────────────────────┘

TYPE 2: MULTI-SELECT (select all that apply)
┌───────────────────────────────────────┐
│  Which of the following do you have?  │
│                                       │
│  ☑ Incident reporting procedure       │
│  ☑ Root cause analysis process        │
│  ☐ Lessons learned register           │
│  ☐ Regular safety briefings           │
│  ☑ Duty of candour process            │
│                                       │
│  3 of 5 selected                      │
└───────────────────────────────────────┘

TYPE 3: SCALE (1-5 confidence rating)
┌───────────────────────────────────────┐
│  How confident are you in your        │
│  medicines management process?        │
│                                       │
│  [1]  [2]  [3]  [4]  [5]             │
│  Not         Somewhat       Very      │
│  at all      confident    confident   │
│                                       │
│  Selected value gets filled bg.       │
└───────────────────────────────────────┘

TYPE 4: DATE INPUT (when was this last done?)
┌───────────────────────────────────────┐
│  When was your last fire safety       │
│  risk assessment conducted?           │
│                                       │
│  ┌────────────────────────────────┐   │
│  │ 📅  dd/mm/yyyy                 │   │
│  └────────────────────────────────┘   │
│                                       │
│  ○ Never conducted                    │
│  ○ Don't know                         │
└───────────────────────────────────────┘
```

### 4.6 Step 4 — Results Summary

```
CONTENT AREA (after engine calculates scores):
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Your Compliance Results                                        │
│   Here's where you stand today.                                  │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │                                                          │   │
│   │          ┌─────────────────┐                             │   │
│   │          │                 │                              │   │
│   │          │      58%        │  Predicted Rating:           │   │
│   │          │   Overall       │  ┌──────────────────────┐   │   │
│   │          │   Compliance    │  │ REQUIRES IMPROVEMENT │   │   │
│   │          │                 │  └──────────────────────┘   │   │
│   │          └─────────────────┘  (amber badge)              │   │
│   │                                                          │   │
│   │   The donut chart is a Recharts RadialBarChart with      │   │
│   │   the score in the center. Color matches rating band.    │   │
│   │                                                          │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Domain Breakdown                                               │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│   │🛡 Safe │ │🎯 Eff. │ │💜 Care │ │⚡ Resp │ │👑 W-Led│       │
│   │        │ │        │ │        │ │        │ │        │       │
│   │  72%   │ │  45%   │ │  68%   │ │  51%   │ │  54%   │       │
│   │  Good  │ │  RI    │ │  Good  │ │  RI    │ │  RI    │       │
│   │ 2 gaps │ │ 5 gaps │ │ 1 gap  │ │ 3 gaps │ │ 4 gaps │       │
│   └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
│                                                                  │
│   Summary                                                        │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │  15 compliance gaps identified                           │   │
│   │                                                          │   │
│   │  ⬤ 3 Critical — must fix immediately                    │   │
│   │  ⬤ 5 High — address within 2 weeks                      │   │
│   │  ⬤ 4 Medium — address within 1 month                    │   │
│   │  ⬤ 3 Low — address when convenient                      │   │
│   │                                                          │   │
│   │  Estimated time to "Good" rating: ~45 days               │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │                                                          │   │
│   │       Go to Your Dashboard →                             │   │
│   │                                                          │   │
│   │  Sets onboardingComplete: true in Clerk metadata.        │   │
│   │  Creates initial ComplianceScore + DomainScores.         │   │
│   │  Creates ComplianceGap records from assessment.          │   │
│   │  Creates initial Task records from gaps.                 │   │
│   │  Redirects to /dashboard.                                │   │
│   │                                                          │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Dashboard Layout

### 5.1 Sidebar Navigation

```
┌──────────────────────┐
│                      │
│  ┌────┐              │
│  │LOGO│ CQC Comply   │  ← Logo + product name
│  └────┘              │
│                      │
│  ─────────────────── │
│                      │
│  MAIN                │
│  ┌──────────────────┐│
│  │ 🏠 Dashboard     ││  ← Active: bg-accent, left-2 border primary
│  └──────────────────┘│
│  │ 📊 Domains       ││  ← Expandable: Safe, Effective, etc.
│  │ 📄 Evidence      ││
│  │ 📋 Policies      ││
│  │ 👥 Staff         ││
│  │ ⚠️  Incidents     ││
│  │ ✅ Tasks          ││
│  │                   ││
│  │ REPORTS           ││
│  │ 📈 Reports       ││
│  │ 📑 Audit Log     ││
│  │                   ││
│  ─────────────────── │
│                      │
│  SETTINGS            │
│  │ ⚙️  Settings      ││
│  │ ❓ Help           ││
│  │                   ││
│  ─────────────────── │
│                      │
│  ┌──────────────────┐│
│  │ ┌──┐             ││
│  │ │AV│ Jane Smith   ││  ← User avatar + name
│  │ └──┘ Admin        ││  ← Role badge
│  │      Brightwood   ││  ← Org name (truncated)
│  └──────────────────┘│
│                      │
└──────────────────────┘

WIDTH:   240px expanded, 64px collapsed (icon-only)
TOGGLE:  Hamburger button at top, or auto-collapse below md breakpoint
ACTIVE:  bg-accent with left-2 border in primary color
HOVER:   bg-accent/50

DOMAINS EXPANDED:
│  📊 Domains  ∨       │
│     🛡 Safe           │
│     🎯 Effective      │
│     💜 Caring         │
│     ⚡ Responsive     │
│     👑 Well-Led       │

COLLAPSED (64px, icon-only):
│ 🏠 │  Tooltip on hover shows label
│ 📊 │
│ 📄 │
│ 📋 │
│ 👥 │
│ ⚠️ │
│ ✅ │
```

### 5.2 Header Bar

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ☰  Dashboard > Overview          🔍 Search...   🔔(3)  ┌──┐   │
│  │                                                       │AV│   │
│  │  Breadcrumb trail               Command+K     Badge   └──┘   │
│  │  (auto from route)              (Cmd palette) count  Avatar  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Hamburger:      Toggles sidebar collapse (desktop) / opens sheet (mobile)
Breadcrumbs:    Auto-generated from URL path segments
Search:         Opens command palette (Cmd+K) — searches all entities
Notifications:  Bell icon with unread count badge, click → dropdown
Avatar:         Click → dropdown: Profile, Settings, Sign Out
```

### 5.3 Notification Bell Dropdown

```
BELL DROPDOWN (positioned top-right, below header):
┌─────────────────────────────────────────┐
│  Notifications                   Mark   │
│                                  all    │
│                                  read   │
│  ─────────────────────────────────────  │
│                                         │
│  🔴 NEW                                │
│  ┌─────────────────────────────────┐   │
│  │ 📄 Document expiring            │   │
│  │    Fire safety cert — 7 days    │   │
│  │    2 hours ago                  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ ⚠️  Task overdue                 │   │
│  │    Review infection policy       │   │
│  │    5 hours ago                  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 📊 Score changed                │   │
│  │    58% → 62% (+4)              │   │
│  │    Yesterday                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│  [View all notifications →]             │
│                                         │
└─────────────────────────────────────────┘

Max 5 in dropdown. Click item → navigates to actionUrl.
Unread items: dot indicator + slightly bolder text.
```

### 5.4 Dashboard Home — The Four Metric Cards

```
MAIN CONTENT (/dashboard):
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Good morning, Jane                                              │
│  Brightwood Care Home — last updated 2 minutes ago               │
│                                                                  │
│  ┌─── METRIC CARDS (4-column grid, responsive) ───────────────┐  │
│  │                                                             │  │
│  │ ┌──────────────────┐ ┌──────────────────┐                  │  │
│  │ │                  │ │                  │                  │  │
│  │ │  Compliance      │ │  Predicted       │                  │  │
│  │ │  Score           │ │  Rating          │                  │  │
│  │ │                  │ │                  │                  │  │
│  │ │     58%          │ │  Requires        │                  │  │
│  │ │     ▲ +3         │ │  Improvement     │                  │  │
│  │ │                  │ │                  │                  │  │
│  │ │  ████████░░░░    │ │  ⬤ amber badge   │                  │  │
│  │ │  Progress bar    │ │  Confidence: 72% │                  │  │
│  │ │  (amber fill)    │ │                  │                  │  │
│  │ └──────────────────┘ └──────────────────┘                  │  │
│  │                                                             │  │
│  │ ┌──────────────────┐ ┌──────────────────┐                  │  │
│  │ │                  │ │                  │                  │  │
│  │ │  Open Gaps       │ │  Overdue Tasks   │                  │  │
│  │ │                  │ │                  │                  │  │
│  │ │     15           │ │     4            │                  │  │
│  │ │                  │ │                  │                  │  │
│  │ │  3 critical      │ │  2 high priority │                  │  │
│  │ │  5 high          │ │  2 medium        │                  │  │
│  │ │  4 medium        │ │                  │                  │  │
│  │ │  3 low           │ │  [View all →]    │                  │  │
│  │ └──────────────────┘ └──────────────────┘                  │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Metric Card Internal Structure (component specification):**

```
┌──────────────────────────────────────┐
│  ┌──────┐                            │
│  │ ICON │  Card Title        [→]     │  ← Lucide icon + title + optional link
│  └──────┘  text-sm text-muted        │
│                                      │
│  VALUE                               │  ← text-3xl font-bold Geist Mono
│  ▲ +3 from last week                 │  ← Trend indicator (green=up, red=down)
│                                      │
│  ████████████░░░░  or  sub-detail    │  ← Progress bar or secondary metric
│                                      │
│  text-xs text-muted helper text      │  ← Context line
└──────────────────────────────────────┘

THE FOUR CARDS:
  Card 1: Compliance Score  — Icon: BarChart3, Value: 58%, Trend: ▲+3
  Card 2: Predicted Rating  — Icon: Award, Value: badge color-coded
  Card 3: Open Gaps         — Icon: AlertTriangle, Value: 15, sub: severity breakdown
  Card 4: Overdue Tasks     — Icon: Clock, Value: 4, sub: priority breakdown

Responsive grid:
  xl:   4 columns (all in one row)
  lg:   2 columns (2 rows of 2)
  md:   2 columns
  sm:   1 column (stacked)
```

### 5.5 Dashboard — Below the Metric Cards

```
(continues from above)
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  CQC Domain Overview                     [Retake Assessment →]   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Five domain cards in a single row. Each clickable →       │   │
│  │  /domains/[domain]. Horizontal scroll on mobile.           │   │
│  │                                                            │   │
│  │ ┌───────────┐┌───────────┐┌───────────┐┌───────────┐┌──────┐ │
│  │ │🛡 Safe    ││🎯 Effect. ││💜 Caring  ││⚡ Respons.││👑 Led│ │
│  │ │           ││           ││           ││           ││      │ │
│  │ │   72%     ││   45%     ││   68%     ││   51%     ││ 54%  │ │
│  │ │ ████░░    ││ ████░░░░░ ││ ████░░    ││ ████░░░░  ││████░░│ │
│  │ │ Good      ││ RI        ││ Good      ││ RI        ││ RI   │ │
│  │ │ 2 gaps    ││ 5 gaps    ││ 1 gap     ││ 3 gaps    ││4 gaps│ │
│  │ └───────────┘└───────────┘└───────────┘└───────────┘└──────┘ │
│  │  Progress bar color matches domain rating band.            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────┐ ┌────────────────────────────┐  │
│  │  Priority Gaps              │ │  Recent Activity           │  │
│  │  (left 60%)                 │ │  (right 40%)               │  │
│  │                             │ │                            │  │
│  │  ⬤ No safeguarding policy  │ │  📄 Evidence uploaded      │  │
│  │    CRITICAL · Safe · S1     │ │     Fire drill log.pdf     │  │
│  │    [Fix now →]              │ │     by Jane · 2h ago       │  │
│  │                             │ │                            │  │
│  │  ⬤ DBS checks incomplete   │ │  ✅ Task completed         │  │
│  │    HIGH · Safe · S3         │ │     Update infection ctrl  │  │
│  │    [Fix now →]              │ │     by Mark · 5h ago       │  │
│  │                             │ │                            │  │
│  │  ⬤ No complaints policy    │ │  📊 Score recalculated     │  │
│  │    HIGH · Responsive · R2   │ │     58% (+3 from 55%)      │  │
│  │    [Fix now →]              │ │     System · yesterday     │  │
│  │                             │ │                            │  │
│  │  [View all 15 gaps →]       │ │  [View all activity →]     │  │
│  └─────────────────────────────┘ └────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Upcoming Deadlines                                          │ │
│  │                                                              │ │
│  │  🔴 TODAY    Safeguarding policy review                      │ │
│  │  🟡 3 DAYS   Jane Smith — NMC registration expires           │ │
│  │  🟡 7 DAYS   Fire safety certificate renewal                 │ │
│  │  ⚪ 14 DAYS  DBS update check — Mark Jones                   │ │
│  │  ⚪ 30 DAYS  Annual infection control audit due               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Domain Pages

### 6.1 Domain Overview Grid (`/domains`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  CQC Domains                                                     │
│  Your compliance across all 5 key questions.                     │
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────┐      │
│  │  🛡 Safe                  │  │  🎯 Effective             │      │
│  │  Are people safe?         │  │  Is care effective?       │      │
│  │                           │  │                           │      │
│  │  ┌──────┐    72%          │  │  ┌──────┐    45%          │      │
│  │  │ Donut│    Good         │  │  │ Donut│    RI           │      │
│  │  └──────┘    ▲ +5         │  │  └──────┘    ▼ -2         │      │
│  │                           │  │                           │      │
│  │  6 KLOEs · 2 gaps        │  │  7 KLOEs · 5 gaps        │      │
│  │  S1 ✅ S2 ✅ S3 ⚠️       │  │  E1 ✅ E2 ⚠️ E3 ⚠️      │      │
│  │  S4 ⚠️ S5 ✅ S6 ✅       │  │  E4 ✅ E5 ⚠️ E6 ⚠️ E7 ⚠️│      │
│  └──────────────────────────┘  └──────────────────────────┘      │
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────┐      │
│  │  💜 Caring               │  │  ⚡ Responsive            │      │
│  │  Is care caring?         │  │  Is care responsive?      │      │
│  │  ...same card pattern... │  │  ...same card pattern...  │      │
│  └──────────────────────────┘  └──────────────────────────┘      │
│                                                                  │
│  ┌──────────────────────────┐                                    │
│  │  👑 Well-Led             │  Cards: grid-cols-2 xl:grid-cols-3 │
│  │  Is care well-led?       │  Click card → /domains/[domain]    │
│  │  ...same card pattern... │                                    │
│  └──────────────────────────┘                                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Single Domain Detail (`/domains/[domain]`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  🛡 Safe Domain                                    Score: 72%    │
│  Are people protected from abuse and avoidable harm?             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ██████████████████░░░░░░  72%          Rating: Good       │  │
│  │  ▲ +5 from last assessment              2 gaps remaining   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Key Lines of Enquiry                                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  ┌─ S1 · Safeguarding ─────────────────── 85% ──── ✅ ─┐  │  │
│  │  │  Systems and practices protecting from abuse          │  │  │
│  │  │  Linked: Reg 12, Reg 13, Reg 19                       │  │  │
│  │  │  Evidence: 3 documents linked                [View →] │  │  │
│  │  └───────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌─ S2 · Risk Assessment ──────────────── 70% ──── ✅ ─┐  │  │
│  │  │  Safety monitoring and management                     │  │  │
│  │  │  Linked: Reg 12, Reg 13, Reg 15                       │  │  │
│  │  │  Evidence: 2 documents linked                [View →] │  │  │
│  │  └───────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌─ S3 · Staffing ──────────────────────── 60% ──── ⚠️ ─┐ │  │
│  │  │  Sufficient suitable staff                             │  │  │
│  │  │  1 gap: DBS checks incomplete (HIGH)                   │  │  │
│  │  │  Evidence: 1 of 3 required                    [View →] │  │  │
│  │  └───────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  (S4, S5, S6 continue same pattern...)                     │  │
│  │  Click [View →] on any KLOE → /domains/safe/s1             │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Gaps in This Domain                                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  🔴 DBS checks incomplete for 3 staff members             │  │
│  │     S3 · Reg 18, Reg 19 · HIGH                            │  │
│  │     ┌───────────────────┐ ┌──────────────┐                │  │
│  │     │ View Remediation  │ │ Mark Resolved│                │  │
│  │     └───────────────────┘ └──────────────┘                │  │
│  │                                                            │  │
│  │  🟡 Medicines audit overdue by 2 weeks                     │  │
│  │     S4 · Reg 12 · MEDIUM                                  │  │
│  │     ┌───────────────────┐ ┌──────────────┐                │  │
│  │     │ View Remediation  │ │ Mark Resolved│                │  │
│  │     └───────────────────┘ └──────────────┘                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Evidence Library Page

### 7.1 Evidence Library (`/evidence`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Evidence Library                          ┌──────────────────┐  │
│  128 documents                             │ + Upload Evidence│  │
│                                            └──────────────────┘  │
│                                                                  │
│  ┌── FILTER BAR ──────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  🔍 Search evidence...    Category ▼   Status ▼   Domain ▼│  │
│  │                                                            │  │
│  │  Active filters:  [Policy ✕]  [Expiring Soon ✕]  [Clear]  │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  VIEW TOGGLE:   [Grid] [List]                  Sort: Date ▼│  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  GRID VIEW (default):                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │ 📄          │ │ 📄          │ │ 📄          │ │ 📄        │  │
│  │             │ │             │ │             │ │           │  │
│  │ Safeguarding│ │ Fire Drill  │ │ Staff       │ │ Medicines │  │
│  │ Policy v3   │ │ Log Jan '26 │ │ Training    │ │ Audit Q4  │  │
│  │             │ │             │ │ Matrix      │ │           │  │
│  │ POLICY      │ │ RECORD      │ │ TRAINING    │ │ AUDIT     │  │
│  │ ⬤ Current   │ │ ⬤ Current   │ │ 🟡 Expiring │ │ ⬤ Current │  │
│  │             │ │             │ │ 12 days     │ │           │  │
│  │ S1, S3      │ │ S5          │ │ E2          │ │ S4        │  │
│  │ Jane · 3d   │ │ Mark · 1w   │ │ Jane · 2w   │ │ Jane · 1m │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
│                                                                  │
│  LIST VIEW:                                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Name              Category  KLOEs    Status    Uploaded   │  │
│  │  ──────────────────────────────────────────────────────────│  │
│  │  Safeguarding v3   Policy    S1, S3   Current   3d ago    │  │
│  │  Fire Drill Log    Record    S5       Current   1w ago    │  │
│  │  Staff Training    Training  E2       Expiring  2w ago    │  │
│  │  Medicines Audit   Audit     S4       Current   1m ago    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ← Previous    Page 1 of 7    Next →        20 per page ▼ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 Evidence Upload Flow (`/evidence/upload`)

A 4-step wizard for uploading and classifying evidence.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ← Back to Evidence Library                                      │
│                                                                  │
│  Upload Evidence                                                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  STEP INDICATOR (horizontal):                              │  │
│  │  ● Upload File ──── ○ Classify ──── ○ Link CQC ──── ○ Rev │  │
│  │  ━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  STEP 1: Upload                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              ┌───────────────────────┐                     │  │
│  │              │                       │                     │  │
│  │              │    📁 Drop files      │  Dashed border      │  │
│  │              │    here or click      │  Drag hover: blue   │  │
│  │              │    to browse          │  bg + scale anim    │  │
│  │              │                       │                     │  │
│  │              │    PDF, DOC, DOCX,    │                     │  │
│  │              │    JPG, PNG           │                     │  │
│  │              │    Max 50MB           │                     │  │
│  │              │                       │                     │  │
│  │              └───────────────────────┘                     │  │
│  │                                                            │  │
│  │  After drop (file uploading):                              │  │
│  │  ┌────────────────────────────────────┐                    │  │
│  │  │ 📄 fire-drill-log.pdf     3.2MB  ✕│                    │  │
│  │  │    ████████████████░░░ 85%         │                    │  │
│  │  └────────────────────────────────────┘                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  STEP 2: Classify                                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Evidence name *                                           │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ Fire Drill Log — January 2026                        │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌──────────────────────┐  ┌────────────────────────────┐  │  │
│  │  │ Category *           │  │ Valid from                 │  │  │
│  │  │ ▼ Record             │  │ 📅 15/01/2026              │  │  │
│  │  └──────────────────────┘  └────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌──────────────────────┐  ┌────────────────────────────┐  │  │
│  │  │ Description          │  │ Valid until                │  │  │
│  │  │ Monthly fire drill...│  │ 📅 15/01/2027              │  │  │
│  │  └──────────────────────┘  └────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  STEP 3: Link to CQC Framework                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Which KLOEs does this evidence support? *                 │  │
│  │                                                            │  │
│  │  🛡 Safe                                                   │  │
│  │  ☐ S1 · Safeguarding systems                              │  │
│  │  ☐ S2 · Risk assessment and safety monitoring              │  │
│  │  ☐ S3 · Sufficient suitable staff                          │  │
│  │  ☐ S4 · Medicines management                              │  │
│  │  ☑ S5 · Infection control and prevention                  │  │
│  │  ☐ S6 · Premises safety                                   │  │
│  │                                                            │  │
│  │  🎯 Effective (collapsed, expand to see E1-E7)            │  │
│  │  💜 Caring (collapsed)                                    │  │
│  │  ⚡ Responsive (collapsed)                                │  │
│  │  👑 Well-Led (collapsed)                                  │  │
│  │                                                            │  │
│  │  AI Suggestion:                                           │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ 💡 Based on the file name, we suggest linking to S5  │  │  │
│  │  │    (Infection control). [Apply suggestion]            │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  STEP 4: Review & Submit                                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Review your evidence                                     │  │
│  │                                                            │  │
│  │  File:      fire-drill-log.pdf (3.2MB)                    │  │
│  │  Name:      Fire Drill Log — January 2026                 │  │
│  │  Category:  Record                                        │  │
│  │  Valid:     15/01/2026 → 15/01/2027                       │  │
│  │  KLOEs:     S5 (Infection control and prevention)         │  │
│  │                                                            │  │
│  │  ┌──────────┐             ┌─────────────────────────────┐  │  │
│  │  │ ← Back   │             │  Upload Evidence ✓          │  │  │
│  │  └──────────┘             └─────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  On submit: toast "Evidence uploaded" + redirect to              │
│  /evidence/[id] detail page.                                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. Policy Pages

### 8.1 Policy Library (`/policies`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Policies                                   ┌──────────────────┐ │
│  42 policies                                │ + Create Policy  │ │
│                                             └──────────────────┘ │
│                                                                  │
│  🔍 Search...     Status ▼    Domain ▼    Sort: Review date ▼    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │ 📋 Safeguarding Policy              PUBLISHED  ✅   │   │  │
│  │  │    S1, S3 · Reg 13                                  │   │  │
│  │  │    Last reviewed: 15/01/2026   Next: 15/01/2027     │   │  │
│  │  │    v3 · Approved by Jane Smith                      │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │ 📋 Complaints Procedure              DRAFT  🟡      │   │  │
│  │  │    R2 · Reg 16                                      │   │  │
│  │  │    Created: 08/02/2026   Review: —                  │   │  │
│  │  │    v1 · AI Generated                                │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │ 📋 Infection Control Policy      ⚠️ REVIEW DUE      │   │  │
│  │  │    S5 · Reg 12                                      │   │  │
│  │  │    Last reviewed: 01/02/2025   Overdue by 1 year    │   │  │
│  │  │    v2 · Needs update                                │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 8.2 Create Policy (`/policies/create`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ← Back to Policies                                              │
│                                                                  │
│  Create a Policy                                                 │
│  Choose how you'd like to create your policy.                    │
│                                                                  │
│  ┌────────────────────────────┐  ┌────────────────────────────┐  │
│  │                            │  │                            │  │
│  │  ┌────┐                    │  │  ┌────┐                    │  │
│  │  │ 🤖 │                    │  │  │ ✏️ │                    │  │
│  │  └────┘                    │  │  └────┘                    │  │
│  │                            │  │                            │  │
│  │  AI Generate               │  │  Write from Scratch        │  │
│  │                            │  │                            │  │
│  │  Tell us what you need     │  │  Start with a blank        │  │
│  │  and our AI will draft a   │  │  document and write        │  │
│  │  CQC-compliant policy.     │  │  your own policy.          │  │
│  │                            │  │                            │  │
│  │  ~2 min generation         │  │                            │  │
│  │                            │  │                            │  │
│  └────────────────────────────┘  └────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────┐                                  │
│  │                            │                                  │
│  │  ┌────┐                    │                                  │
│  │  │ 📑 │                    │                                  │
│  │  └────┘                    │                                  │
│  │                            │                                  │
│  │  Use a Template            │                                  │
│  │                            │                                  │
│  │  Choose from pre-built     │                                  │
│  │  CQC policy templates      │                                  │
│  │  and customize them.       │                                  │
│  │                            │                                  │
│  └────────────────────────────┘                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 8.3 AI Policy Generation Flow

```
After selecting "AI Generate":
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Generate Policy with AI                                         │
│                                                                  │
│  What policy do you need?                                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ▼  Select or type...                                       │  │
│  │    Safeguarding Policy                                     │  │
│  │    Complaints Procedure                                    │  │
│  │    Infection Control Policy                                │  │
│  │    Medicines Management                                    │  │
│  │    Fire Safety Policy                                      │  │
│  │    Data Protection Policy                                  │  │
│  │    Whistleblowing Policy                                   │  │
│  │    ... (20+ templates)                                     │  │
│  │    ──────────────                                          │  │
│  │    Custom: type your own policy title                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Link to CQC domains (auto-suggested based on policy type)       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ☑ S1 · Safeguarding  ☑ S3 · Staffing  ☐ ...             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Additional instructions (optional)                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Include specific guidance about lone working...            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │           🤖  Generate Policy                              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  GENERATING STATE:                                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ┌────┐  Generating your Safeguarding Policy...            │  │
│  │  │ ⟳  │  Analyzing CQC requirements for your service type  │  │
│  │  └────┘  ████████████░░░░░░░░  60%                        │  │
│  │                                                            │  │
│  │  ✓ Identified relevant regulations                        │  │
│  │  ✓ Structured policy sections                             │  │
│  │  ⟳ Writing detailed content...                            │  │
│  │  ○ Formatting and review                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  After generation → redirects to /policies/[id] editor            │
│  with the AI content pre-filled, ready for user editing.         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 8.4 Policy Editor (`/policies/[id]`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ← Policies                                                      │
│                                                                  │
│  ┌── TOP BAR ────────────────────────────────────────────────┐   │
│  │  Safeguarding Policy                  Status: DRAFT 🟡    │   │
│  │  v1 · Created 08/02/2026             ┌────────────────┐  │   │
│  │  S1, S3 · Reg 13                     │ Publish ▼      │  │   │
│  │                                       │  Submit Review │  │   │
│  │                                       │  Publish       │  │   │
│  │                                       │  Export PDF    │  │   │
│  │                                       └────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌── EDITOR AREA ─────────────────── ┐ ┌── SIDEBAR ──────────┐  │
│  │                                   │ │                      │  │
│  │  (Rich text editor - Tiptap or    │ │  POLICY DETAILS      │  │
│  │   similar)                        │ │                      │  │
│  │                                   │ │  Category: Policy    │  │
│  │  1. INTRODUCTION                  │ │  Author: Jane Smith  │  │
│  │  This safeguarding policy sets    │ │  AI Generated: Yes   │  │
│  │  out the commitment of...         │ │                      │  │
│  │                                   │ │  LINKED KLOEs        │  │
│  │  2. SCOPE                         │ │  ☑ S1 Safeguarding   │  │
│  │  This policy applies to all       │ │  ☑ S3 Staffing       │  │
│  │  staff, volunteers, and...        │ │                      │  │
│  │                                   │ │  LINKED REGULATIONS  │  │
│  │  3. DEFINITIONS                   │ │  Reg 13 Safeguarding │  │
│  │  Abuse — A form of...             │ │  Reg 19 Fit & proper │  │
│  │                                   │ │                      │  │
│  │  4. RESPONSIBILITIES              │ │  DATES               │  │
│  │  The Registered Manager will...   │ │  Effective: 08/02/26 │  │
│  │                                   │ │  Review:    08/02/27 │  │
│  │  (full rich text editing with     │ │                      │  │
│  │   heading, bold, italic, lists,   │ │  VERSION HISTORY     │  │
│  │   links, tables)                  │ │  v1 · Draft · Today  │  │
│  │                                   │ │  [View history →]    │  │
│  │  Auto-saves every 30 seconds.     │ │                      │  │
│  │  "Saved" indicator in top bar.    │ │                      │  │
│  │                                   │ │                      │  │
│  └───────────────────────────────────┘ └──────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. Staff Pages

### 9.1 Staff Directory (`/staff`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Staff Directory                               ┌──────────────┐ │
│  24 staff members                              │ + Add Staff  │ │
│                                                └──────────────┘ │
│                                                                  │
│  🔍 Search staff...     Role ▼    Status ▼    Department ▼       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Name             Role              DBS    Reg.    Training │  │
│  │ ─────────────────────────────────────────────────────────  │  │
│  │ ┌──┐                                                      │  │
│  │ │AV│ Jane Smith   Registered Mgr   ✅     NMC ✅   ✅    │  │
│  │ └──┘                                                      │  │
│  │ ┌──┐                                                      │  │
│  │ │AV│ Mark Jones   Senior Carer     ⚠️ exp NMC ✅   ⚠️ 2  │  │
│  │ └──┘                                      due            │  │
│  │ ┌──┐                                                      │  │
│  │ │AV│ Sarah Brown  Care Assistant   ✅     —       ✅    │  │
│  │ └──┘                                                      │  │
│  │                                                            │  │
│  │  Click row → /staff/[id]                                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Compliance Summary                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ 22 / 24  │ │ 20 / 24  │ │ 3        │ │ 2 registrations  │   │
│  │ DBS done │ │ training │ │ expiring │ │ expiring in 30d  │   │
│  │          │ │ current  │ │ soon     │ │                  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 9.2 Add Staff Form (`/staff/add`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ← Back to Staff Directory                                       │
│                                                                  │
│  Add Staff Member                                                │
│                                                                  │
│  SECTION 1: Personal Details                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ┌──────────────────────┐  ┌────────────────────────────┐  │  │
│  │  │ First name *         │  │ Last name *                │  │  │
│  │  │ ┌──────────────────┐ │  │ ┌────────────────────────┐ │  │  │
│  │  │ │ Jane              │ │  │ │ Smith                  │ │  │  │
│  │  │ └──────────────────┘ │  │ └────────────────────────┘ │  │  │
│  │  └──────────────────────┘  └────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌──────────────────────┐  ┌────────────────────────────┐  │  │
│  │  │ Email                │  │ Phone                      │  │  │
│  │  │ ┌──────────────────┐ │  │ ┌────────────────────────┐ │  │  │
│  │  │ │ jane@brightwood  │ │  │ │ +44 7700 900000        │ │  │  │
│  │  │ └──────────────────┘ │  │ └────────────────────────┘ │  │  │
│  │  └──────────────────────┘  └────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌──────────────────────┐  ┌────────────────────────────┐  │  │
│  │  │ Job title *          │  │ Role *                     │  │  │
│  │  │ ┌──────────────────┐ │  │ ┌────────────────────────┐ │  │  │
│  │  │ │ Registered Mgr   │ │  │ │ ▼ Registered Manager   │ │  │  │
│  │  │ └──────────────────┘ │  │ └────────────────────────┘ │  │  │
│  │  └──────────────────────┘  └────────────────────────────┘  │  │
│  │                                                            │  │
│  │  Start date *                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ 📅 01/01/2020                                        │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  SECTION 2: Professional Registration (optional)                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ┌──────────────────────┐  ┌────────────────────────────┐  │  │
│  │  │ Registration body    │  │ Registration number        │  │  │
│  │  │ ▼ NMC               │  │ 12A3456B                   │  │  │
│  │  └──────────────────────┘  └────────────────────────────┘  │  │
│  │                                                            │  │
│  │  Registration expiry date                                  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ 📅 31/03/2027                                        │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  SECTION 3: DBS Check                                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ┌──────────────────────┐  ┌────────────────────────────┐  │  │
│  │  │ DBS certificate no.  │  │ DBS issue date             │  │  │
│  │  │ 001234567890         │  │ 📅 15/06/2024              │  │  │
│  │  └──────────────────────┘  └────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌──────────────────────┐  ┌────────────────────────────┐  │  │
│  │  │ DBS Level            │  │ Update service enrolled?   │  │  │
│  │  │ ▼ Enhanced           │  │ ☑ Yes                      │  │  │
│  │  └──────────────────────┘  └────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  SECTION 4: Insurance (Aesthetic Clinics only — hidden for care)  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ☑ Has professional indemnity insurance                    │  │
│  │                                                            │  │
│  │  Insurance expiry date                                     │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ 📅 31/12/2026                                        │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Right to work in UK confirmed? *                                │
│  ○ Yes  ○ No  ○ Pending verification                            │
│                                                                  │
│  ┌──────────────┐                    ┌────────────────────────┐  │
│  │   Cancel      │                    │   Save Staff Member   │  │
│  └──────────────┘                    └────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 9.3 Staff Profile (`/staff/[id]`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ← Staff Directory                                               │
│                                                                  │
│  ┌───── PROFILE HEADER ──────────────────────────────────────┐   │
│  │  ┌────┐                                                   │   │
│  │  │ AV │  Jane Smith                      ┌─────────────┐ │   │
│  │  │    │  Registered Manager · NMC        │  Edit  ▼    │ │   │
│  │  └────┘  Started: 01/01/2020             └─────────────┘ │   │
│  │                                                           │   │
│  │  Compliance Status:  ✅ DBS  ✅ Registration  ✅ Training │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌── TABS ───────────────────────────────────────────────────┐   │
│  │  [Details]   [Training Records]   [Documents]             │   │
│  │   ━━━━━━━                                                 │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TAB: Details (all personal, registration, DBS info)             │
│  TAB: Training Records                                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Training Records (12)                  [+ Add Training]  │  │
│  │                                                            │  │
│  │  Course          Provider  Date      Expiry   Status      │  │
│  │  ───────────────────────────────────────────────────────   │  │
│  │  Safeguarding L2 NHS      15/01/26  15/01/27  ✅ Current  │  │
│  │  Fire Safety     Bright   08/12/25  08/12/26  ✅ Current  │  │
│  │  Manual Handling Skills4   01/06/25  01/06/26  ⚠️ 120 days│  │
│  │  First Aid       Red X    01/01/24  01/01/25  🔴 Expired  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  TAB: Documents (uploaded certificates, DBS scans, etc.)         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 9.4 Training Matrix (`/staff/training`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Training Matrix                                                 │
│  Overview of all staff training compliance.                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  STAFF ↓ / COURSES →   Safeguard  Fire    MH    First Aid │  │
│  │  ──────────────────────────────────────────────────────── │  │
│  │  Jane Smith (Reg Mgr)   ✅        ✅     ✅     ⚠️ 30d   │  │
│  │  Mark Jones (Snr Care)  ✅        ✅     🔴     ✅        │  │
│  │  Sarah Brown (Care)     ✅        ⚠️ 90d ✅     ✅        │  │
│  │  Tom Wilson (Care)      🔴        ✅     ✅     🔴        │  │
│  │                                                            │  │
│  │  LEGEND:                                                   │  │
│  │  ✅ Current   ⚠️ Expiring (days until)   🔴 Expired/None  │  │
│  │                                                            │  │
│  │  Click any cell → slide-over with training record detail   │  │
│  │  or option to "Add Training Record" if missing.            │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Summary: 20/24 staff fully compliant · 4 training gaps          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. Incident Reporting

### 10.1 Incident Log (`/incidents`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Incidents                                   ┌────────────────┐ │
│  47 incidents                                │ + Report Incident│ │
│                                              └────────────────┘ │
│                                                                  │
│  🔍 Search...   Category ▼   Severity ▼   Status ▼   Date ▼     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Title              Category     Severity  Status   Date   │  │
│  │  ─────────────────────────────────────────────────────────│  │
│  │  Near miss: med     Medication   ⬤ Near    OPEN    08/02  │  │
│  │  at wrong time      Error        Miss              2026   │  │
│  │                                                            │  │
│  │  Resident fall      Fall         🔴 Moderate INVEST 05/02 │  │
│  │  Room 12                                            2026   │  │
│  │                                                            │  │
│  │  Pressure ulcer     Pressure     🟡 Low     CLOSED 01/02  │  │
│  │  Stage 1            Ulcer                           2026   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 10.2 Report Incident Form (`/incidents/report`)

A single-page form with collapsible sections (progressive disclosure).

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ← Back to Incidents                                             │
│                                                                  │
│  Report an Incident                                              │
│  Record safety incidents, complaints, and near misses.           │
│                                                                  │
│  ┌── FORM (single page, sections expand/collapse) ───────────┐  │
│  │                                                            │  │
│  │  SECTION 1: What happened?                          [Open] │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │  Title *                                                   │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ Near miss: medication given at wrong time            │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌───────────────────────┐  ┌───────────────────────────┐  │  │
│  │  │ Category *            │  │ Severity *                │  │  │
│  │  │ ▼ Medication Error    │  │ ▼ Near Miss               │  │  │
│  │  └───────────────────────┘  └───────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌───────────────────────┐  ┌───────────────────────────┐  │  │
│  │  │ When? *               │  │ Where? (optional)         │  │  │
│  │  │ 📅 08/02/2026 14:30  │  │ Room 12, Ground Floor     │  │  │
│  │  └───────────────────────┘  └───────────────────────────┘  │  │
│  │                                                            │  │
│  │  Description *                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ Detailed description of the incident...              │  │  │
│  │  │ (5 row textarea)                                     │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  SECTION 2: Who was involved?                [Collapsed]   │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │  Staff involved (select from directory, multi-select)      │  │
│  │  Other persons (free text)                                 │  │
│  │                                                            │  │
│  │  SECTION 3: Investigation (optional)         [Collapsed]   │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │  Root cause · Actions taken · Lessons learned              │  │
│  │                                                            │  │
│  │  SECTION 4: Notifications                    [Collapsed]   │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │  ☐ This incident requires external notification            │  │
│  │    (reveals: ☐ CQC ☐ Local Authority ☐ Police ☐ HSE)      │  │
│  │  ☐ Duty of candour applies                                │  │
│  │    (reveals: ☐ Duty of candour has been met)               │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────┐            ┌──────────────────────┐        │
│  │  Save as Draft   │            │  Submit Incident     │        │
│  └─────────────────┘            └──────────────────────┘        │
│                                                                  │
│  On submit: toast "Incident reported" + redirect /incidents/[id] │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 11. Task Board (`/tasks`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Tasks                                         ┌──────────────┐ │
│  32 tasks · 4 overdue                          │ + Add Task   │ │
│                                                └──────────────┘ │
│                                                                  │
│  VIEW:  [Board]  [List]  [My Tasks]             Filter ▼  Sort ▼ │
│                                                                  │
│  BOARD VIEW (Kanban columns):                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────┐  │
│  │ TODO (12)    │ │IN PROGRESS(8)│ │OVERDUE (4)   │ │DONE(8) │  │
│  │              │ │              │ │ 🔴            │ │        │  │
│  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌────┐ │  │
│  │ │Upload    │ │ │ │Write     │ │ │ │Review    │ │ │ │ ✅ │ │  │
│  │ │safeguard.│ │ │ │complaints│ │ │ │infection │ │ │ │    │ │  │
│  │ │policy    │ │ │ │policy    │ │ │ │control   │ │ │ │Fire│ │  │
│  │ │          │ │ │ │          │ │ │ │policy    │ │ │ │cert│ │  │
│  │ │🔴 URGENT │ │ │ │🟡 HIGH   │ │ │ │🔴 HIGH   │ │ │ │    │ │  │
│  │ │Due: 2d   │ │ │ │Due: 5d   │ │ │ │Due: -3d  │ │ │ │    │ │  │
│  │ │→ Jane    │ │ │ │→ Mark    │ │ │ │→ Jane    │ │ │ └────┘ │  │
│  │ │Safe · S1 │ │ │ │Resp · R2 │ │ │ │Safe · S5 │ │ │        │  │
│  │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │ │        │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────┘  │
│                                                                  │
│  Cards draggable between columns. Click → slide-over detail.     │
│                                                                  │
│  LIST VIEW:                                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Task           Domain  Priority  Assigned  Due    Status  │  │
│  │  ─────────────────────────────────────────────────────────│  │
│  │  Upload safe.   Safe    🔴 Urgent  Jane     2d     Todo   │  │
│  │  Write compl.   Resp    🟡 High    Mark     5d     In Prog│  │
│  │  Review infec.  Safe    🔴 High    Jane     -3d    Overdue│  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 11.1 Task Slide-Over Panel

When clicking a task card anywhere in the app, a slide-over panel opens from the right:

```
┌───────────────────────────────────────┐
│                                  [✕]  │
│                                       │
│  Upload safeguarding policy           │
│  🔴 URGENT · Due in 2 days           │
│                                       │
│  ─────────────────────────────────── │
│                                       │
│  Status:    ▼ TODO                    │
│  Priority:  ▼ Urgent                  │
│  Assigned:  ▼ Jane Smith              │
│  Due date:  📅 10/02/2026             │
│  Source:    Assessment (auto)         │
│                                       │
│  ─────────────────────────────────── │
│                                       │
│  CQC Context                          │
│  Domain: 🛡 Safe                      │
│  KLOE:   S1 · Safeguarding           │
│  Gap:    No safeguarding policy →     │
│                                       │
│  ─────────────────────────────────── │
│                                       │
│  Description                          │
│  Upload or create a safeguarding      │
│  policy covering Regulation 13.       │
│  Ensure it includes reporting         │
│  procedures and staff training.       │
│                                       │
│  ─────────────────────────────────── │
│                                       │
│  Quick Actions                        │
│  ┌──────────────────────────────────┐ │
│  │  📋 Create Policy (AI) →         │ │
│  │  📄 Upload Evidence →            │ │
│  │  ✅ Mark Complete                 │ │
│  └──────────────────────────────────┘ │
│                                       │
└───────────────────────────────────────┘

Width: 420px (desktop), full-width (mobile)
Animation: slide from right (250ms ease-out)
Backdrop: bg-black/40 overlay
```

---

## 12. Reports Pages

### 12.1 Reports Hub (`/reports`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Reports                                                         │
│  Generate, view, and export compliance reports.                  │
│                                                                  │
│  ┌────────────────────────────┐  ┌────────────────────────────┐  │
│  │                            │  │                            │  │
│  │  ┌────┐                    │  │  ┌────┐                    │  │
│  │  │ 📊 │                    │  │  │ 🔍 │                    │  │
│  │  └────┘                    │  │  └────┘                    │  │
│  │                            │  │                            │  │
│  │  Compliance Report         │  │  Inspection Prep           │  │
│  │                            │  │                            │  │
│  │  Full compliance overview  │  │  AI-powered preparation    │  │
│  │  across all CQC domains    │  │  for your next CQC         │  │
│  │  with evidence mapping.    │  │  inspection visit.         │  │
│  │                            │  │                            │  │
│  │  [Generate Report →]       │  │  [Start Prep →]            │  │
│  │                            │  │                            │  │
│  └────────────────────────────┘  └────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────┐                                  │
│  │                            │                                  │
│  │  ┌────┐                    │                                  │
│  │  │ 📥 │                    │                                  │
│  │  └────┘                    │                                  │
│  │                            │                                  │
│  │  Export Data               │                                  │
│  │                            │                                  │
│  │  Download compliance data  │                                  │
│  │  as PDF or CSV for your    │                                  │
│  │  records.                  │                                  │
│  │                            │                                  │
│  │  [Export →]                │                                  │
│  │                            │                                  │
│  └────────────────────────────┘                                  │
│                                                                  │
│  Recent Reports                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Compliance Report — 01/02/2026           [Download PDF]  │  │
│  │  Inspection Prep — 28/01/2026             [Download PDF]  │  │
│  │  Monthly Summary — January 2026           [Download PDF]  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 12.2 Export Flow

```
EXPORT MODAL (dialog, centered):
┌──────────────────────────────────────────┐
│                                          │
│  Export Compliance Data                  │
│                                          │
│  Format                                  │
│  ○ PDF Report (formatted, printable)     │
│  ○ CSV Data (spreadsheet-ready)          │
│                                          │
│  Include                                 │
│  ☑ Compliance scores & domain breakdown  │
│  ☑ Gap analysis                          │
│  ☑ Evidence inventory                    │
│  ☐ Staff compliance matrix               │
│  ☐ Incident history                      │
│  ☐ Full audit log                        │
│                                          │
│  Date range                              │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ 📅 From      │  │ 📅 To        │       │
│  └─────────────┘  └─────────────┘       │
│                                          │
│  ┌──────────┐     ┌──────────────────┐   │
│  │  Cancel   │     │  Export ↓        │   │
│  └──────────┘     └──────────────────┘   │
│                                          │
└──────────────────────────────────────────┘
```

---

## 13. Audit Log (`/audits`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Audit Log                                                       │
│  Immutable record of all platform activity.                      │
│                                                                  │
│  🔍 Search...    User ▼    Action ▼    Entity ▼    Date range ▼  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  ┌──┐  Jane Smith created evidence                         │  │
│  │  │AV│  "Fire Drill Log — January 2026"                     │  │
│  │  └──┘  08/02/2026 14:32 · IP: 192.168.1.x                │  │
│  │                                                            │  │
│  │  ┌──┐  System recalculated compliance score                │  │
│  │  │🤖│  55% → 58% (+3)                                     │  │
│  │  └──┘  08/02/2026 09:00 · Scheduled job                   │  │
│  │                                                            │  │
│  │  ┌──┐  Mark Jones updated task                             │  │
│  │  │AV│  "Write complaints policy" → IN_PROGRESS             │  │
│  │  └──┘  07/02/2026 16:45 · IP: 10.0.0.x                   │  │
│  │                                                            │  │
│  │  ┌──┐  Jane Smith approved policy                          │  │
│  │  │AV│  "Infection Control Policy" v2 → PUBLISHED           │  │
│  │  └──┘  07/02/2026 11:20 · IP: 192.168.1.x                │  │
│  │                                                            │  │
│  │  (click any entry to expand and see full previousValues    │  │
│  │   and newValues JSON diff)                                 │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ← Previous    Page 1 of 23    Next →       50 per page ▼ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Entries are read-only. Cannot be edited or deleted.             │
│  7-year retention per NHS Records Management Code.               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 14. Notification Center (`/notifications`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Notifications                               [Mark all read]     │
│                                                                  │
│  FILTER:  [All]  [Unread (3)]  [Urgent]                         │
│                                                                  │
│  TODAY                                                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  🔴 📄 Document expiring soon                              │  │
│  │     Fire safety certificate expires in 7 days.             │  │
│  │     [Review document →]                     2 hours ago    │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  🟡 ⚠️  Task overdue                                       │  │
│  │     "Review infection control policy" is 3 days overdue.   │  │
│  │     [View task →]                           5 hours ago    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  YESTERDAY                                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ⚪ 📊 Compliance score changed                             │  │
│  │     Your overall score increased from 55% to 58%.          │  │
│  │     [View dashboard →]                      Yesterday      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  EARLIER                                                         │
│  (grouped by date, paginated, load more on scroll)               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 15. Settings Pages

### 15.1 Settings Landing (`/settings`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Settings                                                        │
│                                                                  │
│  ┌────────────────────────────┐  ┌────────────────────────────┐  │
│  │  🏢 Organization           │  │  👥 Team Members           │  │
│  │  Name, address, CQC IDs,  │  │  Invite users, manage      │  │
│  │  service type details.     │  │  roles and permissions.    │  │
│  │  [Manage →]                │  │  [Manage →]                │  │
│  └────────────────────────────┘  └────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────┐  ┌────────────────────────────┐  │
│  │  💳 Billing & Plan         │  │  🔗 Integrations           │  │
│  │  Subscription, invoices,   │  │  Consentz SDK, webhooks,   │  │
│  │  upgrade options.          │  │  API keys (future).        │  │
│  │  [Manage →]                │  │  [Manage →]                │  │
│  └────────────────────────────┘  └────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────┐                                  │
│  │  🔔 Notifications          │                                  │
│  │  Email preferences and     │                                  │
│  │  alert settings.           │                                  │
│  │  [Manage →]                │                                  │
│  └────────────────────────────┘                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 15.2 Organization Settings (`/settings/organization`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ← Settings                                                      │
│                                                                  │
│  Organization Details                           ┌─────────────┐ │
│                                                 │  Save        │ │
│                                                 └─────────────┘ │
│                                                                  │
│  Organization name *                                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Brightwood Care Home                                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Service type                                                    │
│  ┌──────────────────────────────────────────┐                    │
│  │ Care Home                   [locked 🔒]  │  Cannot change     │
│  └──────────────────────────────────────────┘  after onboarding  │
│                                                                  │
│  ┌───────────────────────────┐  ┌─────────────────────────────┐  │
│  │ CQC Provider ID           │  │ CQC Location ID             │  │
│  │ 1-123456789               │  │ 1-987654321                 │  │
│  └───────────────────────────┘  └─────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────┐  ┌─────────────────────────────┐  │
│  │ Registered Manager        │  │ Number of beds              │  │
│  │ Jane Smith                │  │ 35                          │  │
│  └───────────────────────────┘  └─────────────────────────────┘  │
│                                                                  │
│  Address                                                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 123 Oak Street, London, SW1A 1AA                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│  DANGER ZONE                                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Delete Organization                                       │  │
│  │  Permanently delete this organization and all its data.    │  │
│  │  This action cannot be undone.     [Delete Organization]   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 15.3 Team Management (`/settings/users`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ← Settings                                                      │
│                                                                  │
│  Team Members                                ┌────────────────┐ │
│  4 members                                   │ + Invite User  │ │
│                                              └────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ┌──┐ Jane Smith        jane@bright.co.uk   OWNER     [···]│  │
│  │ └──┘                                                       │  │
│  │ ┌──┐ Mark Jones        mark@bright.co.uk   ADMIN     [···]│  │
│  │ └──┘                                                       │  │
│  │ ┌──┐ Sarah Brown       sarah@bright.co.uk  STAFF     [···]│  │
│  │ └──┘                                                       │  │
│  │ ┌──┐ Pending invite    tom@bright.co.uk    VIEWER    [···]│  │
│  │ └──┘ (Invited 2d ago)                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [···] menu: Change role, Remove user, Resend invite             │
│                                                                  │
│  INVITE DIALOG:                                                  │
│  ┌──────────────────────────────────────┐                        │
│  │  Invite Team Member                  │                        │
│  │                                      │                        │
│  │  Email *                             │                        │
│  │  ┌──────────────────────────────┐    │                        │
│  │  │ tom@brightwood.co.uk         │    │                        │
│  │  └──────────────────────────────┘    │                        │
│  │                                      │                        │
│  │  Role *                              │                        │
│  │  ○ Admin — Full access               │                        │
│  │  ○ Manager — Manage content          │                        │
│  │  ○ Staff — View + limited edit       │                        │
│  │  ○ Viewer — Read only                │                        │
│  │                                      │                        │
│  │  ┌────────┐  ┌──────────────────┐    │                        │
│  │  │ Cancel │  │  Send Invite     │    │                        │
│  │  └────────┘  └──────────────────┘    │                        │
│  └──────────────────────────────────────┘                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 15.4 Notification Preferences (`/settings/notifications`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ← Settings                                                      │
│                                                                  │
│  Notification Preferences                       ┌─────────────┐ │
│                                                 │  Save        │ │
│                                                 └─────────────┘ │
│                                                                  │
│  Choose which notifications you receive by email.                │
│  All notifications appear in-app regardless.                     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Notification Type                    In-App    Email      │  │
│  │  ─────────────────────────────────────────────────────────│  │
│  │  Document expiring soon               Always    [✓ on ]   │  │
│  │  Training due                         Always    [✓ on ]   │  │
│  │  Task overdue                         Always    [✓ on ]   │  │
│  │  Incident reported                    Always    [✓ on ]   │  │
│  │  Compliance score changed             Always    [  off]   │  │
│  │  New gap identified                   Always    [✓ on ]   │  │
│  │  Policy review due                    Always    [✓ on ]   │  │
│  │  Registration expiring                Always    [✓ on ]   │  │
│  │  Inspection reminder                  Always    [✓ on ]   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Email Digest                                                    │
│  ○ Individual emails (as they happen)                            │
│  ○ Daily digest (9am summary)                                    │
│  ○ Weekly digest (Monday morning)                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 16. Shared Interaction Patterns

### 16.1 Confirmation Dialog

```
┌──────────────────────────────────────┐
│                                      │
│  ⚠️  Delete this evidence?           │
│                                      │
│  "Fire Drill Log — January 2026"     │
│  will be permanently removed.        │
│  This action cannot be undone.       │
│                                      │
│  ┌────────────┐  ┌────────────────┐  │
│  │   Cancel    │  │ Delete (red)   │  │
│  └────────────┘  └────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

### 16.2 Toast Notifications (Sonner)

```
POSITION: Bottom-right
AUTO-DISMISS: 5 seconds
TYPES:
  ✅ Success:  "Evidence uploaded successfully"     (green left border)
  ❌ Error:    "Failed to save. Please try again."  (red left border)
  ⚠️  Warning:  "Document expires in 7 days"         (amber left border)
  ℹ️  Info:     "Score recalculated"                  (blue left border)
```

### 16.3 Empty States

```
┌──────────────────────────────────────────┐
│                                          │
│          ┌─────────────┐                 │
│          │  📄 icon     │                 │
│          │  (large,     │                 │
│          │   muted)     │                 │
│          └─────────────┘                 │
│                                          │
│   No evidence uploaded yet               │
│   Upload your first compliance           │
│   document to get started.               │
│                                          │
│   ┌────────────────────────┐             │
│   │   + Upload Evidence     │             │
│   └────────────────────────┘             │
│                                          │
└──────────────────────────────────────────┘

EACH PAGE HAS A UNIQUE EMPTY STATE:
  Evidence:   "No evidence uploaded yet"     + Upload CTA
  Policies:   "No policies created yet"      + Create Policy CTA
  Staff:      "No staff members added yet"   + Add Staff CTA
  Incidents:  "No incidents reported"         + Report Incident CTA
  Tasks:      "All caught up! No tasks."     + Add Task CTA
```

### 16.4 Loading States

```
SKELETON:  shadcn Skeleton for cards/tables (pulsing bg-muted blocks)
SPINNER:   Lucide Loader2 with animate-spin for button loading
PROGRESS:  Upload progress bar (0-100%) for file uploads
PAGE:      Full-page skeleton matching the page's actual layout
```

### 16.5 Command Palette (Cmd+K)

```
┌────────────────────────────────────────────┐
│  🔍 Search across everything...            │
│                                            │
│  RECENT                                    │
│  📄 Safeguarding Policy v3                 │
│  👤 Mark Jones — Senior Carer              │
│  ⚠️  Incident #12 — Near miss              │
│                                            │
│  QUICK ACTIONS                             │
│  + Upload evidence                         │
│  + Report incident                         │
│  + Add staff member                        │
│  + Create policy                           │
│                                            │
│  PAGES                                     │
│  🏠 Dashboard                              │
│  📊 Safe Domain                            │
│  ⚙️  Settings                               │
│                                            │
└────────────────────────────────────────────┘

Implementation: shadcn Command component
Trigger: Cmd+K (Mac) / Ctrl+K (Windows)
Searches: Evidence, policies, staff, incidents, pages
Results: Grouped by entity type, navigate on select
```

### 16.6 Form Validation Pattern

```
FIELD-LEVEL (on blur):
  Valid:   Green checkmark icon appears
  Error:   Red border + error message below in text-destructive text-sm
  Pending: Subtle loading spinner (e.g. checking email uniqueness)

FORM-LEVEL (on submit):
  If errors: Scroll to first error field, focus it, show toast
  If success: Toast confirmation + navigate/close

REQUIRED FIELDS:
  Label shows * asterisk
  If submitted empty: "This field is required"

BUTTON STATES:
  Default:  Normal styling
  Loading:  Spinner + "Saving..." text, button disabled
  Disabled: Greyed out (when form invalid or no changes)
  Success:  Brief green checkmark before redirect
```

---

## 17. Mobile Adaptations

### 17.1 Mobile Layout (< 768px)

```
┌──────────────────────┐
│  ☰  CQC Comply  🔔 AV│  ← Compact header
├──────────────────────┤
│                      │
│  Full-width content  │  ← Sidebar hidden
│  Single column       │     Opens as Sheet
│  Touch-friendly      │
│  buttons (min 44px)  │
│                      │
│  Metric cards stack  │  ← 1 column
│  vertically          │
│                      │
│  Domain cards →      │  ← Horizontal scroll
│  horizontal scroll   │     with snap points
│                      │
│  Tables →            │  ← Convert to stacked
│  responsive cards    │     card layout
│                      │
├──────────────────────┤
│  [🏠] [📊] [✅] [⚙️] │  ← Bottom tab bar
└──────────────────────┘

BOTTOM TAB BAR:
  🏠 Home      📊 Domains     ✅ Tasks     ⚙️ More
  Active: filled icon + label
  Inactive: outline icon only
  Fixed to bottom, h-16, shadow-top
```

---

## 18. Page-by-Page Summary Table

| Route | Page Title | Layout | Key Components |
|---|---|---|---|
| `/sign-in` | Sign In / Sign Up | Auth (split) | Sign-in/up toggle form, social buttons, testimonial, trust badges |
| `/welcome` | Welcome | Onboarding | Service type selector cards |
| `/assessment/[step]` | Assessment | Onboarding | Domain tabs, question renderer, progress tracker |
| `/assessment/results` | Results | Onboarding | Score donut, domain breakdown, gap summary, CTA |
| `/dashboard` | Dashboard | Dashboard | 4 metric cards, domain row, priority gaps, activity, deadlines |
| `/domains` | Domains | Dashboard | 5 domain cards (grid) with scores and KLOE status |
| `/domains/[domain]` | Domain Detail | Dashboard | KLOE list, evidence coverage, domain gaps, remediation |
| `/domains/[domain]/[kloe]` | KLOE Detail | Dashboard | Requirements checklist, linked evidence, regulation info |
| `/evidence` | Evidence Library | Dashboard | Filter bar, grid/list toggle, pagination, category badges |
| `/evidence/upload` | Upload Evidence | Dashboard | 4-step wizard (upload, classify, link CQC, review) |
| `/evidence/[id]` | Evidence Detail | Dashboard | File preview, metadata, linked KLOEs, version history |
| `/policies` | Policy Library | Dashboard | Policy cards with status, review dates, linked regulations |
| `/policies/create` | Create Policy | Dashboard | 3 options: AI generate, write from scratch, use template |
| `/policies/[id]` | Policy Editor | Dashboard | Rich text editor, sidebar metadata, version history |
| `/staff` | Staff Directory | Dashboard | DataTable, compliance summary cards, DBS/reg/training status |
| `/staff/add` | Add Staff | Dashboard | 4-section form: personal, registration, DBS, insurance |
| `/staff/[id]` | Staff Profile | Dashboard | Tabbed: Details, Training Records, Documents |
| `/staff/training` | Training Matrix | Dashboard | Staff × Course grid with ✅/⚠️/🔴 indicators |
| `/incidents` | Incident Log | Dashboard | DataTable with severity/status/category filters |
| `/incidents/report` | Report Incident | Dashboard | Collapsible sections form with progressive disclosure |
| `/incidents/[id]` | Incident Detail | Dashboard | Timeline, investigation panel, notification status |
| `/tasks` | Task Board | Dashboard | Kanban board / list view toggle, draggable cards |
| `/audits` | Audit Log | Dashboard | Immutable log with entity/action/user filters, expandable |
| `/reports` | Reports Hub | Dashboard | Report type cards (compliance, inspection, export) |
| `/reports/compliance` | Compliance Report | Dashboard | Auto-generated domain-by-domain report |
| `/reports/inspection-prep` | Inspection Prep | Dashboard | AI checklist, Q&A prep, evidence gap summary |
| `/reports/export` | Export | Dashboard | Format picker (PDF/CSV), section checkboxes, date range |
| `/notifications` | Notification Center | Dashboard | Grouped by date, filter by type, mark read |
| `/settings` | Settings | Dashboard | Card grid linking to sub-pages |
| `/settings/organization` | Org Settings | Dashboard | Org form, CQC IDs, danger zone (delete) |
| `/settings/users` | Team Management | Dashboard | User list, invite dialog, role management |
| `/settings/billing` | Billing | Dashboard | Plan card, upgrade CTA, invoice history |
| `/settings/integrations` | Integrations | Dashboard | Consentz SDK config (future), API key management |
| `/settings/notifications` | Notification Prefs | Dashboard | Per-type email toggles, digest frequency |

---

## 19. Animation & Micro-Interactions

```
PAGE TRANSITIONS:     Fade in (opacity 0→1, 200ms ease-out)
CARD HOVER:           translateY(-2px) + shadow-md (150ms)
BUTTON CLICK:         scale(0.98) on press (100ms)
SIDEBAR COLLAPSE:     width 240→64px (200ms ease)
MODAL OPEN:           Overlay fade + dialog scale(0.95→1) (200ms)
SHEET OPEN:           Slide from right (250ms ease-out)
TAB SWITCH:           Underline slides to active tab (200ms)
SCORE CHANGE:         Number counts up/down (500ms, Geist Mono)
PROGRESS BAR:         Width transition (300ms ease-in-out)
SKELETON PULSE:       bg-muted animate-pulse (standard)
DRAG (kanban):        opacity-50 + ring-2 on dragged card
TOAST ENTER:          Slide up from bottom-right (200ms)
TOAST EXIT:           Fade out (150ms)
ONBOARDING STEP:      Content slide-left (entering), slide-right (going back)
FORM VALIDATION:      Error shake on invalid submit (150ms, 2 cycles)
```

---

## 20. Accessibility Requirements

```
WCAG 2.1 AA compliance target:
  - Color contrast: minimum 4.5:1 for text, 3:1 for large text
  - All interactive elements keyboard accessible (Tab, Enter, Space, Esc)
  - Focus rings visible on all focusable elements (ring-2 ring-ring)
  - aria-labels on icon-only buttons
  - Screen reader friendly: semantic HTML (nav, main, aside, h1-h6)
  - Form labels linked to inputs via htmlFor
  - Error messages linked to inputs via aria-describedby
  - Skip-to-content link as first focusable element
  - Reduced motion: @media (prefers-reduced-motion) disables animations
  - Touch targets: minimum 44x44px on mobile
  - Role attributes on dynamic content (role="dialog", role="alert")
  - Live regions (aria-live="polite") for toast notifications
  - Tab order follows visual order (no tabindex hacks)
```
