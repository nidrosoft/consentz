# PRD: First-Time User (FTU) Walkthrough & In-App Guidance System

## Consentz CQC Compliance Module

**Document Version:** 1.0
**Last Updated:** April 2026
**Priority:** CRITICAL — Per Tobe's Direction
**Status:** Ready for Development

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Walkthrough Architecture](#3-walkthrough-architecture)
4. [Phase 1: Welcome & Orientation Walkthrough](#4-phase-1-welcome--orientation-walkthrough)
5. [Phase 2: Dashboard Deep-Dive Tour](#5-phase-2-dashboard-deep-dive-tour)
6. [Phase 3: Evidence Management Tour](#6-phase-3-evidence-management-tour)
7. [Phase 4: Policies Tour](#7-phase-4-policies-tour)
8. [Phase 5: Staff Management Tour](#8-phase-5-staff-management-tour)
9. [Phase 6: Incidents Tour](#9-phase-6-incidents-tour)
10. [Phase 7: Tasks Tour](#10-phase-7-tasks-tour)
11. [Phase 8: CQC Domains Tour](#11-phase-8-cqc-domains-tour)
12. [Phase 9: Reports & Audit Log Tour](#12-phase-9-reports--audit-log-tour)
13. [Phase 10: Settings & Integrations Tour](#13-phase-10-settings--integrations-tour)
14. [Phase 11: AI Chat Assistant Tour](#14-phase-11-ai-chat-assistant-tour)
15. [Spotlight & Highlight System](#15-spotlight--highlight-system)
16. [Guided Action Flows (Interactive Tutorials)](#16-guided-action-flows)
17. [Contextual Micro-Tips](#17-contextual-micro-tips)
18. [Persistent Help Widget](#18-persistent-help-widget)
19. [Onboarding Checklist](#19-onboarding-checklist)
20. [UI Components Specification](#20-ui-components-specification)
21. [Technical Requirements & Database Schema](#21-technical-requirements)
22. [Walkthrough JSON Configuration](#22-walkthrough-json-configuration)
23. [All Walkthrough Copy](#23-all-walkthrough-copy)
24. [Implementation Priority](#24-implementation-priority)

---

## 1. Overview

### 1.1 Purpose

This document specifies the complete First-Time User Walkthrough and In-App Guidance System for the Consentz CQC Compliance Module. The system guides new users — clinic owners, care home managers, compliance officers, and staff — through every feature so they can start improving their CQC compliance immediately.

This is a **multi-phase, persistent guidance system** that:

- Walks users through every major screen and feature on first use
- Highlights UI elements with spotlights and animated callouts
- Tracks completion progress per user with a persistent checklist
- Remains accessible via a help widget on every page
- Adapts content based on service type (Aesthetic Clinic vs Care Home)
- Provides interactive guided flows for key actions (upload evidence, generate a policy, etc.)
- Surfaces contextual micro-tips as users encounter features for the first time

### 1.2 Problem Statement

CQC compliance is intimidating. Users arrive with these challenges:

| Challenge | Impact |
|-----------|--------|
| CQC regulation is complex and overwhelming | Users don't know where to start |
| Compliance dashboards are unfamiliar | Users are used to manual spreadsheets or paper-based tracking |
| 5 domains with 25 KLOEs feels like too much | Feature density creates paralysis |
| Users don't understand the scoring system | They can't tell what actions improve their score |
| Consentz integration is invisible | Users don't realize the system is already pulling their data |
| AI features are new and unfamiliar | Users don't know they can generate policies or ask the chatbot |
| Fear of a bad CQC rating is stressful | Users need reassurance and clear next steps |

### 1.3 Solution

A multi-layered guidance system:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  LAYER 1: MANDATORY WELCOME WALKTHROUGH                                 │
│  ─────────────────────────────────────────────────────────────────────  │
│  Triggered on first login after onboarding/assessment. Covers           │
│  dashboard, navigation sidebar, and key areas. ~4 minutes.              │
│  Must complete (or explicitly skip with warning).                       │
│                                                                         │
│                              ↓                                          │
│                                                                         │
│  LAYER 2: PAGE-LEVEL TOURS                                              │
│  ─────────────────────────────────────────────────────────────────────  │
│  Triggered on first visit to each page (Evidence, Policies, Staff,      │
│  Incidents, Tasks, Domains, Reports, Settings). Self-contained          │
│  mini-tours. ~2-3 min each. Dismissible, re-accessible.                │
│                                                                         │
│                              ↓                                          │
│                                                                         │
│  LAYER 3: GUIDED ACTION FLOWS                                           │
│  ─────────────────────────────────────────────────────────────────────  │
│  Step-by-step walkthroughs for key actions: "Upload your first          │
│  evidence," "Generate a policy with AI," "Report an incident."          │
│  Available from Help Widget and triggered by empty states.              │
│                                                                         │
│                              ↓                                          │
│                                                                         │
│  LAYER 4: CONTEXTUAL MICRO-TIPS                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│  One-time tooltips on first encounter. "This badge means your Safe      │
│  domain score." "Clicking this KLOE shows what evidence you need."      │
│  Dismissed individually, tracked per user.                              │
│                                                                         │
│                              ↓                                          │
│                                                                         │
│  LAYER 5: PERSISTENT HELP WIDGET + AI CHAT                              │
│  ─────────────────────────────────────────────────────────────────────  │
│  Floating button (bottom-right) opens: AI compliance chatbot,           │
│  feature guides, guided flows, FAQ, "Restart Tour" option.             │
│  Always available on every page.                                        │
│                                                                         │
│                              ↓                                          │
│                                                                         │
│  LAYER 6: ONBOARDING CHECKLIST                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│  Persistent progress checklist: "Link Consentz account ✓"               │
│  "Take initial assessment ✓" "Upload first evidence" etc.              │
│  Celebrates completion. Links to guided flows.                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Core Design Principles

1. **Progressive Disclosure:** One thing at a time. Never overwhelm with regulation jargon.
2. **Action-Oriented:** Every step tells users what they *can do* here, not just what something *is*.
3. **Service-Type Aware:** Content adapts. Care home users see care home examples. Aesthetic clinic users see clinic examples. Never show irrelevant content.
4. **Non-Blocking:** Overlays don't prevent navigation. Users can click around during tours.
5. **Skippable & Resumable:** Users can exit anytime. Progress saves. Resume where they left off.
6. **Re-Accessible:** Every tour restartable from the Help Widget or Settings.
7. **Reassuring:** Compliance is stressful. The tone is supportive. "You're doing great." "This is easier than it looks."
8. **CQC-Specific Language:** Use terms compliance managers know — "KLOE" not "line item," "evidence" not "attachment," "domain" not "category."
9. **Connected to Consentz:** Always remind users that their Consentz data flows in automatically — they don't have to enter everything twice.

---

## 2. Goals & Success Metrics

### 2.1 Goals

| Goal | Description |
|------|-------------|
| **Orientation** | Users understand the dashboard, sidebar, and where to find every feature within 4 minutes of first login |
| **Score Understanding** | Users understand what their compliance score means, what their predicted rating means, and what actions improve both |
| **Feature Discovery** | Users know how to upload evidence, generate policies, manage staff, report incidents, and use the AI chat |
| **First Actions** | Users complete at least 3 key actions during session 1: view dashboard, check a gap, and visit a domain page |
| **Consentz Connection** | Users understand that Consentz data syncs automatically and how that drives their ongoing compliance |
| **Inspection Confidence** | Users feel less stressed about CQC after the walkthrough, not more |
| **Self-Sufficiency** | Users can navigate the tool without support within their first session |

### 2.2 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Welcome walkthrough completion rate | >85% | Users who complete all mandatory steps |
| Page-level tour engagement | >60% | Users who complete at least 3 of 8 page tours in week 1 |
| Onboarding checklist completion | >70% | Users who complete all checklist items within 7 days |
| First evidence uploaded | >50% | Users who upload at least one piece of evidence in session 1 |
| AI Chat engagement | >40% | Users who send at least one message to the AI assistant in week 1 |
| Day-1 support ticket rate | <5% | Users who contact support within 24 hours |
| Time to first productive action | <8 min | Time from first dashboard load to first meaningful action |

---

## 3. Walkthrough Architecture

### 3.1 Walkthrough State Machine

```
                    ┌──────────────┐
                    │ NOT_STARTED  │
                    └──────┬───────┘
                           │ First dashboard load after assessment
                           ▼
                    ┌──────────────┐
               ┌───→│ IN_PROGRESS  │←──┐
               │    └──────┬───────┘   │
               │           │           │
          User leaves   Completes   User resumes
          mid-tour     all steps    from saved step
               │           │           │
               │           ▼           │
               │    ┌──────────────┐   │
               └────│   PAUSED     │───┘
                    └──────────────┘
                           │
                     User completes
                           │
                           ▼
                    ┌──────────────┐
                    │  COMPLETED   │
                    └──────────────┘
                           │
                    User clicks "Restart Tour"
                           │
                           ▼
                    ┌──────────────┐
                    │  RESTARTED   │→ (flows back to IN_PROGRESS)
                    └──────────────┘

    Separate state: SKIPPED (user explicitly skipped)
    → Can restart anytime from Help Widget or Settings
```

---

## 4. Phase 1: Welcome & Orientation Walkthrough

**Trigger:** First dashboard load after completing the initial CQC assessment
**Duration:** ~4 minutes
**Mandatory:** Yes (skippable with warning)
**Steps:** 12 steps (Step 0 through Step 11)

---

### Step 0: Welcome Modal

**Type:** Full-screen overlay modal (dimmed background)
**Target Element:** None (centered modal)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│              Welcome to CQC Compliance, {organization_name}!            │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Your compliance dashboard is ready. Let's take a quick tour           │
│  so you know exactly where everything is and how the system             │
│  keeps you CQC-ready automatically.                                    │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │                                                                │     │
│  │  Here's what we've set up:                                     │     │
│  │                                                                │     │
│  │  ✓  Initial assessment completed                               │     │
│  │  ✓  {service_type} compliance profile active                   │     │
│  │  ✓  {gap_count} compliance gaps identified                     │     │
│  │  ✓  5 CQC domains being monitored                              │     │
│  │  ✓  AI compliance assistant ready                               │     │
│  │                                                                │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  This tour takes about 4 minutes and covers the essentials.            │
│  You can always restart it from the Help menu.                          │
│                                                                         │
│         [ Let's Get Started → ]        [ Skip Tour ]                   │
│                                                                         │
│  ⚠️ Skipping? You can always restart the tour from Settings            │
│  or the Help widget at any time.                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Dynamic Data:** `{organization_name}`, `{service_type}` (Aesthetic Clinic / Care Home), `{gap_count}`

---

### Step 1: Navigation Sidebar

**Target Element:** `[data-tour="sidebar-nav"]`
**Highlight:** Full sidebar with spotlight, rest of screen dimmed
**Position:** Tooltip to the right of sidebar

```
Tooltip Content:
─────────────────────────────────────────────
  📋 Your Navigation Sidebar

  Everything in the CQC Compliance Module is one click away.
  Your main sections:

  • Dashboard — Your compliance overview at a glance
  • Evidence — Upload and manage compliance evidence
  • Policies — Create, generate, and track policies
  • Staff — Manage team qualifications and training
  • Incidents — Report and track safety incidents
  • Tasks — Your compliance to-do list
  • CQC Domains — Deep-dive into Safe, Effective, Caring,
    Responsive, and Well-Led
  • Reports — Generate compliance reports
  • Audit Log — Full activity trail

                              [1/11]   [Next →]
─────────────────────────────────────────────
```

---

### Step 2: Compliance Score Card

**Target Element:** `[data-tour="compliance-score"]`
**Highlight:** Compliance Score card with spotlight
**Position:** Tooltip below card

```
Tooltip Content:
─────────────────────────────────────────────
  📊 Your Compliance Score

  This is your overall CQC compliance percentage. It's
  calculated from four sources:

  • Your initial assessment answers (30%)
  • Evidence you've uploaded (20%)
  • Live data from Consentz (30%)
  • Task completion (15%)

  The score updates automatically as you take action and
  as your Consentz data syncs. Your goal: get to 63%+
  for a predicted "Good" CQC rating.

                              [2/11]   [← Back]   [Next →]
─────────────────────────────────────────────
```

---

### Step 3: Predicted Rating Badge

**Target Element:** `[data-tour="predicted-rating"]`
**Highlight:** Predicted Rating card with spotlight
**Position:** Tooltip below card

```
Tooltip Content:
─────────────────────────────────────────────
  🏆 Your Predicted CQC Rating

  Based on your current compliance score, this predicts
  what rating a CQC inspector would likely give you:

  • Outstanding — 88%+ compliance
  • Good — 63-87% (this is the target for most providers)
  • Requires Improvement — 39-62%
  • Inadequate — Below 39%

  Don't worry if it's low right now — it improves as you
  upload evidence, close gaps, and complete tasks. That's
  exactly what this tool is for.

                              [3/11]   [← Back]   [Next →]
─────────────────────────────────────────────
```

---

### Step 4: Open Gaps Card

**Target Element:** `[data-tour="open-gaps"]`
**Highlight:** Open Gaps card with spotlight
**Position:** Tooltip below card

```
Tooltip Content:
─────────────────────────────────────────────
  ⚠️ Your Compliance Gaps

  These are areas where your CQC compliance is incomplete
  or at risk. Gaps are categorised by severity:

  🔴 Critical — Could cause an immediate CQC enforcement action
  🟠 High — Significant risk, address within 30 days
  🟡 Medium — Should be addressed, but not urgent
  🔵 Low — Minor improvements, address when convenient

  The Priority Gaps section below shows your most urgent
  items. Start with the critical ones — fixing them
  has the biggest impact on your score.

                              [4/11]   [← Back]   [Next →]
─────────────────────────────────────────────
```

---

### Step 5: CQC Domain Overview

**Target Element:** `[data-tour="domain-overview"]`
**Highlight:** All 5 domain cards
**Position:** Tooltip above domain cards

```
Tooltip Content:
─────────────────────────────────────────────
  🎯 The 5 CQC Domains

  CQC assesses every registered provider against these
  five questions. Each has its own score and rating:

  🛡️ Safe — Are people protected from harm?
  ✅ Effective — Does care achieve good outcomes?
  💛 Caring — Are people treated with compassion?
  📬 Responsive — Are services meeting needs?
  👑 Well-Led — Is leadership delivering quality care?

  Click any domain card to see its detailed breakdown,
  KLOE status, linked evidence, and specific gaps.
  The coloured KLOE badges (S1, S2, E1, etc.) show
  individual compliance areas within each domain.

                              [5/11]   [← Back]   [Next →]
─────────────────────────────────────────────
```

---

### Step 6: Priority Gaps & Recent Activity

**Target Element:** `[data-tour="priority-gaps"]`
**Highlight:** Priority Gaps section
**Position:** Tooltip to the right

```
Tooltip Content:
─────────────────────────────────────────────
  🔥 Priority Gaps

  This list shows your most urgent compliance gaps —
  sorted by severity. Each gap shows:

  • What's missing or at risk
  • Which CQC domain and KLOE it belongs to
  • Severity level (Critical / High / Medium / Low)

  Click any gap to see what action to take. Many gaps
  can be resolved by uploading evidence, creating a
  policy, or completing a task.

  On the right, Recent Activity shows the latest
  actions taken — yours and the system's automatic
  sync activity.

                              [6/11]   [← Back]   [Next →]
─────────────────────────────────────────────
```

---

### Step 7: Evidence Page Preview

**Target Element:** `[data-tour="sidebar-evidence"]`
**Highlight:** Evidence nav item with pulse animation
**Position:** Tooltip to the right of sidebar

```
Tooltip Content:
─────────────────────────────────────────────
  📎 Evidence

  This is where you upload and manage all your CQC
  compliance evidence — policies, certificates, audit
  reports, meeting minutes, risk assessments, photos.

  Each piece of evidence is tagged to a CQC domain
  and KLOE, so it directly feeds your compliance score.
  The more current evidence you have, the higher
  your scores.

  You can filter by domain, type, status, and expiry date.
  The system alerts you when evidence is about to expire.

                              [7/11]   [← Back]   [Next →]
─────────────────────────────────────────────
```

---

### Step 8: Policies Page Preview

**Target Element:** `[data-tour="sidebar-policies"]`
**Highlight:** Policies nav item with pulse animation
**Position:** Tooltip to the right of sidebar

```
Tooltip Content:
─────────────────────────────────────────────
  📄 Policies

  CQC requires multiple policies depending on your service
  type. Here you can:

  • Create policies manually
  • Generate policies using AI (it knows CQC requirements!)
  • Track which staff have acknowledged each policy
  • Set review dates and get reminders

  Policies sync with Consentz — when staff sign off on
  a policy in Consentz, it's tracked here automatically.

  💡 Tip: Try the "Generate with AI" button — it creates
  a CQC-compliant policy in seconds.

                              [8/11]   [← Back]   [Next →]
─────────────────────────────────────────────
```

---

### Step 9: Staff, Incidents & Tasks Preview

**Target Element:** `[data-tour="sidebar-staff"]`, `[data-tour="sidebar-incidents"]`, `[data-tour="sidebar-tasks"]`
**Highlight:** Sequential pulse on Staff, Incidents, Tasks nav items
**Position:** Tooltip to the right of sidebar

```
Tooltip Content:
─────────────────────────────────────────────
  👥 Staff, Incidents & Tasks

  Three more essential sections:

  Staff — Add team members, track qualifications,
  DBS checks, training records, and certification expiry.
  Staff data also syncs from Consentz automatically.

  Incidents — Report and manage safety incidents.
  Infection events sync from Consentz. The system
  tracks investigations and ensures learning happens
  (a key CQC requirement under KLOE S6).

  Tasks — Your compliance to-do list, organised as a
  Kanban board (To Do → In Progress → Done). Tasks
  are auto-created when the system detects issues —
  like expiring certificates or overdue safety checks.

                              [9/11]   [← Back]   [Next →]
─────────────────────────────────────────────
```

---

### Step 10: AI Chat Assistant

**Target Element:** `[data-tour="ai-chat-button"]`
**Highlight:** The floating AI chat button (bottom-right)
**Position:** Tooltip to the left of button

```
Tooltip Content:
─────────────────────────────────────────────
  🤖 Your AI Compliance Assistant

  This is your always-available CQC expert. Click
  this button anytime to ask questions like:

  "What evidence do I need for KLOE S5?"
  "How do I prepare for a CQC inspection?"
  "What are my most critical gaps right now?"
  "Explain Regulation 17 in simple terms"

  The assistant knows CQC regulation inside-out,
  understands your specific service type, and can
  see your current compliance data to give you
  personalised advice.

  Try it now — or come back to it anytime.

                              [10/11]   [← Back]   [Next →]
─────────────────────────────────────────────
```

---

### Step 11: Completion & Consentz Connection

**Type:** Centered celebration modal
**Target Element:** None

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                          🎉 You're All Set!                             │
│                                                                         │
│  You've seen the essentials. Here's the most important thing            │
│  to know:                                                               │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │                                                                │     │
│  │  📡 Your Consentz data syncs automatically every 6 hours.     │     │
│  │                                                                │     │
│  │  Consent records, staff qualifications, incident reports,      │     │
│  │  safety checklists, patient feedback — all of it flows into    │     │
│  │  your compliance score without you lifting a finger.           │     │
│  │                                                                │     │
│  │  Your job: close the gaps the system identifies, upload         │     │
│  │  additional evidence, and keep policies up to date.            │     │
│  │  The system handles the monitoring. You handle the action.     │     │
│  │                                                                │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  Recommended next steps:                                                │
│  1. Review your Priority Gaps on the dashboard                          │
│  2. Upload your first piece of evidence                                │
│  3. Generate a policy using AI                                         │
│                                                                         │
│  You'll see a setup checklist on your dashboard to guide you            │
│  through these first steps.                                            │
│                                                                         │
│                     [ Go to Dashboard → ]                               │
│                                                                         │
│  💡 You can restart this tour anytime from Settings or the              │
│     Help widget.                                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Trigger on completion:** Show confetti animation. Mark Phase 1 as COMPLETED. Activate the Onboarding Checklist widget.

---

## 5. Phase 2: Dashboard Deep-Dive Tour

**Trigger:** First visit to dashboard AFTER Phase 1 completion (or on second login)
**Duration:** ~3 minutes
**Mandatory:** No
**Steps:** 7

| Step | Target Element | Title | Content Summary |
|------|---------------|-------|-----------------|
| 2-1 | `[data-tour="score-trend"]` | Score Trend | "The sparkline shows your score over time. Upward trend = you're improving. The '+3% vs last month' shows momentum." |
| 2-2 | `[data-tour="rating-progress"]` | Rating Progress | "48% to Good remaining means you need 48 more percentage points. Focus on critical gaps — they have the biggest impact." |
| 2-3 | `[data-tour="overdue-tasks"]` | Overdue Tasks | "Tasks past their due date. Each overdue critical task deducts points from your score. Clear these first." |
| 2-4 | `[data-tour="domain-kloe-badges"]` | KLOE Badges | "Each coloured badge is a Key Line of Enquiry — S1, S2, etc. These are the specific areas CQC inspectors assess. Click any badge to see details." |
| 2-5 | `[data-tour="retake-assessment"]` | Retake Assessment | "If your situation has changed significantly, retake the assessment to recalibrate your baseline. This doesn't erase your existing data." |
| 2-6 | `[data-tour="last-updated"]` | Last Updated | "This shows when Consentz data was last synced. It refreshes automatically every 6 hours. Click the refresh icon for a manual sync." |
| 2-7 | `[data-tour="view-all-gaps"]` | View All Gaps | "Click here to see every compliance gap, filterable by domain, severity, and status. This is your compliance action plan." |

---

## 6-9. Phases 3-6: Evidence, Policies, Staff, Incidents Tours

Each page gets a self-contained tour on first visit. The pattern for each:

### Phase 3: Evidence Management Tour (~3 min, 6 steps)

| Step | Target | Title | Content |
|------|--------|-------|---------|
| 3-1 | `[data-tour="evidence-table"]` | Evidence Library | "All your compliance evidence lives here — policies, certificates, audit reports, photos, meeting minutes. Each item is tagged to a CQC domain." |
| 3-2 | `[data-tour="evidence-upload"]` | Upload Evidence | "Click here to upload a new piece of evidence. You'll select the domain, KLOE, type, and expiry date. Supported: PDFs, images, Word docs." |
| 3-3 | `[data-tour="evidence-filters"]` | Filters | "Filter by domain (Safe, Effective, etc.), evidence type, or status (Current, Expiring Soon, Expired). Use this to quickly check coverage." |
| 3-4 | `[data-tour="evidence-status"]` | Status Indicators | "🟢 Current = valid and up to date. 🟡 Expiring Soon = renew within 30 days. 🔴 Expired = needs immediate attention. Expired evidence drags your score down." |
| 3-5 | `[data-tour="evidence-domain-tag"]` | Domain Tags | "Each evidence item shows which CQC domain it supports. The more domains you have well-covered, the higher your overall score." |
| 3-6 | Completion | Coverage Tip | "💡 Aim to have at least 3 pieces of current evidence per KLOE. Quality matters — a recent, specific audit report is worth more than a generic policy from 3 years ago." |

### Phase 4: Policies Tour (~2 min, 5 steps)

| Step | Target | Title | Content |
|------|--------|-------|---------|
| 4-1 | `[data-tour="policy-list"]` | Policy Library | "Your CQC-required policies. Each one tracks: version, review date, status, and staff acknowledgement. {service_type === 'CARE_HOME' ? 'Care homes typically need 25+ policies.' : 'Aesthetic clinics typically need 15+ policies.'}" |
| 4-2 | `[data-tour="create-policy"]` | Create Policy | "Two ways to add a policy: write one manually, or click 'Generate with AI' to have one created for you instantly. AI policies are tailored to your service type and CQC requirements." |
| 4-3 | `[data-tour="ai-generate-policy"]` | AI Generation | "The AI generates plain-format, CQC-compliant policies. Just pick the policy type — the system handles the content, regulation references, and structure. Always review before publishing." |
| 4-4 | `[data-tour="policy-acknowledgement"]` | Staff Acknowledgement | "Track which staff have read and signed each policy. This data also syncs from Consentz. CQC inspectors check that staff are aware of policies — this proves it." |
| 4-5 | `[data-tour="policy-review-date"]` | Review Dates | "Policies should be reviewed at least annually. The system alerts you when review dates approach. Outdated policies are a common CQC finding." |

### Phase 5: Staff Management Tour (~2 min, 5 steps)

| Step | Target | Title | Content |
|------|--------|-------|---------|
| 5-1 | `[data-tour="staff-table"]` | Staff Directory | "Your team members with their qualifications, DBS status, and training records. Staff data syncs from Consentz — practitioners, nurses, and admin staff appear automatically." |
| 5-2 | `[data-tour="add-staff"]` | Add Staff | "Add staff members manually here, or they'll appear from Consentz sync. Each staff member needs: qualifications, DBS check date, and training records." |
| 5-3 | `[data-tour="staff-credentials"]` | Credentials | "{service_type === 'CARE_HOME' ? 'For care homes: DBS checks are mandatory for ALL staff. Track Care Certificate completion, moving & handling, safeguarding, and dementia training.' : 'For aesthetic clinics: Track GMC/NMC registration, Level 7 aesthetics qualifications, prescribing credentials, and treatment-specific competencies.'}" |
| 5-4 | `[data-tour="training-records"]` | Training Records | "Each staff member's training history with expiry dates. The system auto-creates tasks when certifications are about to expire — ensuring continuous compliance." |
| 5-5 | `[data-tour="staff-expiry-alerts"]` | Expiry Alerts | "🔴 Overdue and 🟡 Expiring Soon badges appear on staff with issues. Addressing these directly improves your Safe and Effective domain scores (KLOEs S3 and E2)." |

### Phase 6: Incidents Tour (~2 min, 4 steps)

| Step | Target | Title | Content |
|------|--------|-------|---------|
| 6-1 | `[data-tour="incident-table"]` | Incident Log | "All reported incidents — infections, complications, premises issues, safeguarding concerns. Infection incidents also sync automatically from Consentz." |
| 6-2 | `[data-tour="report-incident"]` | Report an Incident | "Use this form to report a new incident. Include: what happened, severity, who was involved, and date. CQC requires robust incident reporting (Regulation 17, KLOE S6)." |
| 6-3 | `[data-tour="incident-severity"]` | Severity & Status | "Track each incident through: Reported → Investigating → Actioned → Closed. CQC inspectors look for evidence of investigation AND learning — not just reporting." |
| 6-4 | Completion | Learning from Incidents | "💡 The key CQC requirement is LEARNING. After closing an incident, document what changed as a result. 'We updated our IPC procedure after this infection' = evidence of a learning culture (KLOE S6)." |

---

## 10. Phase 7: Tasks Tour (~2 min, 4 steps)

| Step | Target | Title | Content |
|------|--------|-------|---------|
| 7-1 | `[data-tour="task-kanban"]` | Task Board | "Your compliance tasks organised as a Kanban board — drag items from To Do → In Progress → Done. Tasks are created manually or auto-generated by the system." |
| 7-2 | `[data-tour="task-auto-created"]` | Auto-Created Tasks | "The system automatically creates tasks when: staff certificates expire, safety checklists are overdue, consents decay, or the Consentz sync detects issues. You'll never miss a deadline." |
| 7-3 | `[data-tour="task-priority"]` | Priority & Domain | "Each task shows its priority (Critical/High/Medium/Low) and which CQC domain it affects. Completing critical tasks has the biggest impact on your score." |
| 7-4 | `[data-tour="task-create"]` | Create Task | "Create your own tasks for anything: 'Review fire drill procedure,' 'Update safeguarding policy,' 'Schedule staff training.' Assign a domain to track impact." |

---

## 11. Phase 8: CQC Domains Tour (~3 min, 6 steps)

**Trigger:** First visit to any individual domain page (Safe, Effective, Caring, Responsive, or Well-Led)

| Step | Target | Title | Content |
|------|--------|-------|---------|
| 8-1 | `[data-tour="domain-score"]` | Domain Score | "This domain's compliance score and predicted rating. Each domain is assessed independently by CQC — you could be 'Good' in Caring but 'Requires Improvement' in Safe." |
| 8-2 | `[data-tour="kloe-list"]` | Key Lines of Enquiry | "These are the specific questions CQC inspectors ask within this domain. Each KLOE (S1, S2, etc.) has its own completion status based on evidence and compliance data." |
| 8-3 | `[data-tour="kloe-evidence"]` | Linked Evidence | "Click any KLOE to see what evidence is linked to it and what's still missing. This is exactly what a CQC inspector would review — if it's green here, you're covered." |
| 8-4 | `[data-tour="domain-gaps"]` | Domain Gaps | "Gaps specific to this domain. These are the areas where you're not meeting CQC standards. Each gap has a recommended action to resolve it." |
| 8-5 | `[data-tour="domain-regulations"]` | Linked Regulations | "Each KLOE maps to specific Regulations (the legal requirements). For example, KLOE S5 (infection control) maps to Regulation 12 (Safe care) and Regulation 15 (Premises)." |
| 8-6 | Completion | Domain Tip | "💡 Focus on the domain with the lowest score — it pulls your overall score and rating down. CQC can give different ratings per domain, and your worst domain often determines the overall rating." |

---

## 12. Phase 9: Reports & Audit Log Tour (~2 min, 3 steps)

| Step | Target | Title | Content |
|------|--------|-------|---------|
| 9-1 | `[data-tour="reports-page"]` | Reports | "Generate compliance reports for: board meetings, CQC inspection prep, internal audits, or progress tracking. Reports include scores, gaps, evidence status, and trends." |
| 9-2 | `[data-tour="audit-log"]` | Audit Log | "Every action in the system is logged here — who did what, when. This is crucial evidence of governance and accountability (KLOE W4). CQC inspectors love an audit trail." |
| 9-3 | Completion | Governance Tip | "💡 Good governance isn't just about policies — it's about proving you actively monitor and improve. Regular report generation and a clear audit trail demonstrate this to inspectors." |

---

## 13. Phase 10: Settings & Integrations Tour (~2 min, 4 steps)

| Step | Target | Title | Content |
|------|--------|-------|---------|
| 10-1 | `[data-tour="settings-org"]` | Organisation Settings | "Your organisation details, CQC registration number, and service type. Make sure your CQC registration number is set — it links you to CQC's public records." |
| 10-2 | `[data-tour="settings-users"]` | Team & Users | "Invite team members and assign roles. Roles control what each person can see and do: Owner has full access, Staff can view and complete tasks but not change settings." |
| 10-3 | `[data-tour="settings-integrations"]` | Consentz Integration | "This is where you link your Consentz account. Enter your Consentz Clinic ID to enable automatic data sync. You can also generate API keys for the SDK here." |
| 10-4 | `[data-tour="settings-billing"]` | Billing | "Manage your subscription here. The CQC Compliance Module is £200/month and includes all features: full domain monitoring, AI policy generation, AI chat assistant, Consentz integration, and SDK access." |

---

## 14. Phase 11: AI Chat Assistant Tour (~1 min, 3 steps)

**Trigger:** First time user opens the AI chat panel

| Step | Target | Title | Content |
|------|--------|-------|---------|
| 11-1 | `[data-tour="chat-panel"]` | AI Chat | "Your CQC compliance expert, available 24/7. It knows all CQC regulations, understands your service type, and can see your current compliance data." |
| 11-2 | `[data-tour="chat-suggestions"]` | Suggested Questions | "Not sure what to ask? Try these starters. The assistant can help with: understanding KLOEs, inspection prep, evidence requirements, policy guidance, and explaining your scores." |
| 11-3 | `[data-tour="chat-input"]` | Ask Anything | "Type any question about CQC compliance or the tool. The AI responds in plain language and gives you specific, actionable advice based on YOUR data. Try it now!" |

---

## 15. Spotlight & Highlight System

### Spotlight Component

The spotlight system dims the entire screen EXCEPT the targeted element, which receives a glowing highlight border and an elevated z-index.

```typescript
interface SpotlightConfig {
  targetSelector: string;      // CSS selector for the element to highlight
  padding: number;             // Extra space around the element (px)
  borderRadius: number;        // Border radius for the spotlight cutout
  overlayOpacity: number;      // Dimming opacity (0.6 recommended)
  animation: 'pulse' | 'glow' | 'sequential-pulse' | 'none';
  scrollIntoView: boolean;     // Auto-scroll to element if off-screen
}
```

### Tooltip Component

```typescript
interface TooltipConfig {
  title: string;
  content: string;
  icon: string;               // Emoji or icon name
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  stepIndicator: string;      // e.g., "3/11"
  actions: {
    back?: boolean;
    next?: boolean;
    skip?: boolean;
    cta?: { label: string; action: string };
  };
}
```

### Animation Specifications

| Animation | Description | Usage |
|-----------|-------------|-------|
| `pulse` | Gentle pulsing glow on target element | Default for all spotlight steps |
| `glow` | Continuous soft glow border | For emphasizing important elements |
| `sequential-pulse` | Each item in a group pulses one after another | For nav items, domain cards |
| `slide-in` | Tooltip slides in from the edge | For tooltip entrance |
| `confetti` | Confetti burst | Phase completion celebrations |

---

## 16. Guided Action Flows (Interactive Tutorials)

Step-by-step interactive walkthroughs for key actions. Available from Help Widget, empty states, and onboarding checklist.

### Flow 1: Upload Your First Evidence

```
Step 1: "Click 'Upload Evidence' in the top-right" → highlight button
Step 2: "Select the CQC domain this evidence supports" → highlight domain dropdown
Step 3: "Choose the specific KLOE" → highlight KLOE dropdown
Step 4: "Select the evidence type (policy, certificate, audit, etc.)" → highlight type dropdown
Step 5: "Drag and drop your file or click to browse" → highlight upload area
Step 6: "Set an expiry date if applicable" → highlight date picker
Step 7: "Click 'Upload' — and that's it!" → highlight submit button
Completion: "🎉 Your first evidence is uploaded! It's now linked to your compliance score."
```

### Flow 2: Generate a Policy with AI

```
Step 1: "Go to Policies in the sidebar" → highlight nav item
Step 2: "Click 'Create New Policy'" → highlight button
Step 3: "Click 'Generate with AI'" → highlight AI generate button
Step 4: "Select the policy type from the dropdown" → highlight policy type selector
Step 5: "Review the generated policy — edit if needed" → highlight editor
Step 6: "Click 'Publish' to make it active" → highlight publish button
Completion: "🎉 Your first AI-generated policy is live! Staff can now acknowledge it."
```

### Flow 3: Report an Incident

```
Step 1: "Go to Incidents in the sidebar" → highlight nav item
Step 2: "Click 'Report Incident'" → highlight button
Step 3: "Fill in what happened, when, and who was involved" → highlight form
Step 4: "Select the severity level" → highlight severity dropdown
Step 5: "Submit the report" → highlight submit button
Completion: "Incident logged. Remember: CQC looks for evidence of learning from incidents, not just reporting them."
```

### Flow 4: Review and Close a Compliance Gap

```
Step 1: "Go to your Priority Gaps on the dashboard" → highlight gaps section
Step 2: "Click a critical gap to see details" → highlight gap item
Step 3: "Read the recommended action" → highlight recommendation
Step 4: "Take the action — upload evidence, create a policy, or complete a task"
Step 5: "Mark the gap as resolved" → highlight resolve button
Completion: "🎉 Gap closed! Your compliance score will update on the next sync."
```

---

## 17. Contextual Micro-Tips

One-time tooltips that appear when a user encounters a specific element for the first time. Each is shown once, dismissed individually, and tracked per user.

| ID | Trigger | Element | Tip |
|----|---------|---------|-----|
| `tip-kloe-badge` | First hover on a KLOE badge | KLOE badge (S1, E2, etc.) | "This is a Key Line of Enquiry — a specific area CQC inspectors assess. Click to see its evidence requirements." |
| `tip-domain-card-click` | First click on a domain card | Domain card | "Each domain page shows detailed KLOE breakdown, linked evidence, and gaps. This is where you drill into specifics." |
| `tip-severity-critical` | First view of a Critical gap | Critical severity badge | "Critical means a CQC inspector could take immediate enforcement action for this. Address these first." |
| `tip-score-change` | Score changes after sync | Score delta indicator | "Your score just changed because new data synced from Consentz. The system monitors your clinic 24/7." |
| `tip-evidence-expiry` | First view of expiring evidence | Expiring badge | "This evidence expires soon. Renew it to maintain your compliance coverage. Expired evidence doesn't count toward your score." |
| `tip-consentz-sync` | First view of sync timestamp | "Last updated" text | "This shows when Consentz data was last pulled. Syncs happen every 6 hours automatically, or click refresh for a manual sync." |
| `tip-task-auto` | First auto-created task appears | Auto-created task badge | "This task was created automatically because the system detected an issue — like an expiring certificate or overdue safety check." |
| `tip-policy-ai` | First visit to policy creation | AI generate button | "Try AI generation — it creates a fully CQC-compliant policy in seconds, tailored to your service type. You can always edit before publishing." |
| `tip-audit-log` | First visit to audit log | Audit log page | "CQC inspectors look at governance trails. This log proves every action, decision, and change is recorded — that's KLOE W4 in action." |
| `tip-chat-personalised` | First AI chat response | Chat response | "The assistant can see your current compliance data — your score, gaps, and tasks — so its advice is personalised to your situation." |

---

## 18. Persistent Help Widget

Always-present floating button (bottom-right, above the AI chat button).

### Help Panel Sections

```
┌──────────────────────────────────────┐
│  ❓ Help & Support                   │
│                                       │
│  🔍 Search help articles...          │
│                                       │
│  ── Quick Guides ──                  │
│  📋 How compliance scoring works      │
│  📎 Uploading evidence               │
│  📄 Generating policies with AI      │
│  👥 Managing staff credentials       │
│  ⚠️ Reporting incidents              │
│  🎯 Preparing for CQC inspection     │
│                                       │
│  ── Interactive Tutorials ──         │
│  ▶ Upload your first evidence        │
│  ▶ Generate a policy with AI         │
│  ▶ Report an incident                │
│  ▶ Close a compliance gap            │
│                                       │
│  ── Tours ──                         │
│  🔄 Restart welcome tour             │
│  🔄 Restart current page tour        │
│                                       │
│  ── Support ──                       │
│  💬 Ask the AI Assistant             │
│  📧 Contact support                  │
│  ❓ FAQ                               │
│                                       │
│  ── Progress ──                      │
│  Onboarding: 5/8 steps complete     │
│  [View Checklist]                    │
└──────────────────────────────────────┘
```

---

## 19. Onboarding Checklist

Persistent checklist widget (can appear as a dashboard card or slide-out panel). Links to guided flows.

```typescript
const ONBOARDING_CHECKLIST = [
  { id: 'complete-tour', label: 'Complete the welcome tour', linkedPhase: 1 },
  { id: 'link-consentz', label: 'Link your Consentz account', target: '/settings/integrations' },
  { id: 'review-gaps', label: 'Review your priority gaps', target: '/dashboard' },
  { id: 'upload-evidence', label: 'Upload your first evidence', linkedFlow: 'flow-upload-evidence' },
  { id: 'generate-policy', label: 'Generate a policy with AI', linkedFlow: 'flow-generate-policy' },
  { id: 'add-staff', label: 'Add a staff member', target: '/staff' },
  { id: 'visit-domain', label: 'Explore a CQC domain page', target: '/domains/safe' },
  { id: 'ask-ai', label: 'Ask the AI assistant a question', target: 'open-chat' },
];
```

---

## 20. UI Components Specification

### Required Components to Build

| Component | File Path | Description |
|-----------|-----------|-------------|
| `WalkthroughProvider` | `components/walkthrough/walkthrough-provider.tsx` | Context provider wrapping the app. Manages walkthrough state, current phase/step, progress. |
| `SpotlightOverlay` | `components/walkthrough/spotlight-overlay.tsx` | The dimmed overlay with a spotlight cutout around the target element. |
| `WalkthroughTooltip` | `components/walkthrough/walkthrough-tooltip.tsx` | The tooltip card with title, content, step indicator, back/next/skip buttons. |
| `WelcomeModal` | `components/walkthrough/welcome-modal.tsx` | Phase 1 Step 0 full-screen welcome modal. |
| `CompletionModal` | `components/walkthrough/completion-modal.tsx` | Phase completion celebration modal with confetti. |
| `OnboardingChecklist` | `components/walkthrough/onboarding-checklist.tsx` | Persistent checklist widget. |
| `HelpWidget` | `components/walkthrough/help-widget.tsx` | Floating help button + slide-out panel. |
| `MicroTip` | `components/walkthrough/micro-tip.tsx` | Small contextual tooltip for first-encounter tips. |
| `GuidedFlow` | `components/walkthrough/guided-flow.tsx` | Step-by-step interactive tutorial overlay. |

### Data Attributes Required on Existing Components

Add `data-tour` attributes to all target elements in the existing UI:

```
Dashboard page:
  data-tour="compliance-score"       — Compliance Score card
  data-tour="predicted-rating"       — Predicted Rating card
  data-tour="open-gaps"              — Open Gaps card
  data-tour="overdue-tasks"          — Overdue Tasks card
  data-tour="domain-overview"        — CQC Domain Overview section
  data-tour="priority-gaps"          — Priority Gaps section
  data-tour="recent-activity"        — Recent Activity section
  data-tour="retake-assessment"      — Retake Assessment link
  data-tour="last-updated"           — Last updated timestamp
  data-tour="score-trend"            — Score sparkline/trend
  data-tour="rating-progress"        — Rating progress bar
  data-tour="view-all-gaps"          — View all gaps link
  data-tour="domain-kloe-badges"     — KLOE badge row on domain cards

Sidebar:
  data-tour="sidebar-nav"            — Full sidebar
  data-tour="sidebar-dashboard"      — Dashboard nav item
  data-tour="sidebar-evidence"       — Evidence nav item
  data-tour="sidebar-policies"       — Policies nav item
  data-tour="sidebar-staff"          — Staff nav item
  data-tour="sidebar-incidents"      — Incidents nav item
  data-tour="sidebar-tasks"          — Tasks nav item
  data-tour="sidebar-domains"        — CQC Domains section
  data-tour="sidebar-reports"        — Reports nav item
  data-tour="sidebar-audit"          — Audit Log nav item

Evidence page:
  data-tour="evidence-table"         — Evidence table
  data-tour="evidence-upload"        — Upload button
  data-tour="evidence-filters"       — Filter controls
  data-tour="evidence-status"        — Status column
  data-tour="evidence-domain-tag"    — Domain tag column

Policies page:
  data-tour="policy-list"            — Policy list
  data-tour="create-policy"          — Create policy button
  data-tour="ai-generate-policy"     — AI generate button
  data-tour="policy-acknowledgement" — Acknowledgement column
  data-tour="policy-review-date"     — Review date column

Staff page:
  data-tour="staff-table"            — Staff table
  data-tour="add-staff"              — Add staff button
  data-tour="staff-credentials"      — Credentials column
  data-tour="training-records"       — Training section
  data-tour="staff-expiry-alerts"    — Expiry alert badges

AI Chat:
  data-tour="ai-chat-button"         — Floating chat button
  data-tour="chat-panel"             — Chat panel
  data-tour="chat-suggestions"       — Suggestion chips
  data-tour="chat-input"             — Chat input field
```

---

## 21. Technical Requirements & Database Schema

### Database Table

```sql
CREATE TABLE IF NOT EXISTS walkthrough_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Phase completion tracking
  phase_1_status TEXT DEFAULT 'NOT_STARTED' CHECK (phase_1_status IN ('NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'SKIPPED')),
  phase_1_current_step INTEGER DEFAULT 0,
  phase_1_completed_at TIMESTAMPTZ,
  
  phases_completed JSONB DEFAULT '[]',  -- Array of completed phase IDs: [2, 3, 5]
  phases_in_progress JSONB DEFAULT '{}', -- { "3": { "currentStep": 2 } }
  
  -- Micro-tips dismissed
  dismissed_tips JSONB DEFAULT '[]',     -- Array of tip IDs: ["tip-kloe-badge", "tip-score-change"]
  
  -- Guided flows completed
  completed_flows JSONB DEFAULT '[]',    -- Array of flow IDs: ["flow-upload-evidence"]
  
  -- Checklist
  checklist_completed JSONB DEFAULT '[]', -- Array of checklist item IDs
  checklist_dismissed BOOLEAN DEFAULT FALSE,
  
  -- Help widget
  help_widget_opened BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, organization_id)
);
```

### API Routes

```
GET  /api/walkthrough          — Get current user's walkthrough progress
PATCH /api/walkthrough         — Update progress (complete step, dismiss tip, etc.)
POST /api/walkthrough/restart  — Restart a specific phase
POST /api/walkthrough/skip     — Skip a phase with warning
```

---

## 22. Walkthrough JSON Configuration

```json
{
  "version": "1.0",
  "phases": [
    {
      "id": 1,
      "name": "welcome_orientation",
      "title": "Welcome & Orientation",
      "mandatory": true,
      "estimatedMinutes": 4,
      "triggerCondition": "first_dashboard_load_after_assessment",
      "steps": [
        {
          "id": "1-0",
          "type": "modal",
          "title": "Welcome to CQC Compliance!",
          "targetSelector": null,
          "position": "center",
          "actions": [
            { "label": "Let's Get Started", "action": "next" },
            { "label": "Skip Tour", "action": "skip_with_warning" }
          ],
          "dynamicData": ["organization_name", "service_type", "gap_count"]
        },
        {
          "id": "1-1",
          "type": "spotlight",
          "title": "Navigation Sidebar",
          "targetSelector": "[data-tour='sidebar-nav']",
          "position": "right",
          "animation": "sequential-pulse"
        },
        {
          "id": "1-2",
          "type": "spotlight",
          "title": "Compliance Score",
          "targetSelector": "[data-tour='compliance-score']",
          "position": "bottom",
          "animation": "pulse"
        },
        {
          "id": "1-3",
          "type": "spotlight",
          "title": "Predicted Rating",
          "targetSelector": "[data-tour='predicted-rating']",
          "position": "bottom",
          "animation": "pulse"
        },
        {
          "id": "1-4",
          "type": "spotlight",
          "title": "Open Gaps",
          "targetSelector": "[data-tour='open-gaps']",
          "position": "bottom",
          "animation": "pulse"
        },
        {
          "id": "1-5",
          "type": "spotlight",
          "title": "CQC Domain Overview",
          "targetSelector": "[data-tour='domain-overview']",
          "position": "top",
          "animation": "sequential-pulse"
        },
        {
          "id": "1-6",
          "type": "spotlight",
          "title": "Priority Gaps",
          "targetSelector": "[data-tour='priority-gaps']",
          "position": "right",
          "animation": "pulse"
        },
        {
          "id": "1-7",
          "type": "spotlight",
          "title": "Evidence",
          "targetSelector": "[data-tour='sidebar-evidence']",
          "position": "right",
          "animation": "pulse"
        },
        {
          "id": "1-8",
          "type": "spotlight",
          "title": "Policies",
          "targetSelector": "[data-tour='sidebar-policies']",
          "position": "right",
          "animation": "pulse"
        },
        {
          "id": "1-9",
          "type": "spotlight",
          "title": "Staff, Incidents & Tasks",
          "targetSelector": "[data-tour='sidebar-staff']",
          "position": "right",
          "animation": "sequential-pulse"
        },
        {
          "id": "1-10",
          "type": "spotlight",
          "title": "AI Chat Assistant",
          "targetSelector": "[data-tour='ai-chat-button']",
          "position": "left",
          "animation": "glow"
        },
        {
          "id": "1-11",
          "type": "modal",
          "title": "You're All Set!",
          "targetSelector": null,
          "position": "center",
          "animation": "confetti",
          "actions": [
            { "label": "Go to Dashboard", "action": "complete" }
          ]
        }
      ]
    },
    {
      "id": 2, "name": "dashboard_deep_dive", "title": "Dashboard Deep-Dive",
      "mandatory": false, "estimatedMinutes": 3,
      "triggerCondition": "first_visit_after_phase_1", "steps": []
    },
    {
      "id": 3, "name": "evidence_tour", "title": "Evidence Management",
      "mandatory": false, "estimatedMinutes": 3,
      "triggerCondition": "first_visit_to_evidence", "steps": []
    },
    {
      "id": 4, "name": "policies_tour", "title": "Policies",
      "mandatory": false, "estimatedMinutes": 2,
      "triggerCondition": "first_visit_to_policies", "steps": []
    },
    {
      "id": 5, "name": "staff_tour", "title": "Staff Management",
      "mandatory": false, "estimatedMinutes": 2,
      "triggerCondition": "first_visit_to_staff", "steps": []
    },
    {
      "id": 6, "name": "incidents_tour", "title": "Incidents",
      "mandatory": false, "estimatedMinutes": 2,
      "triggerCondition": "first_visit_to_incidents", "steps": []
    },
    {
      "id": 7, "name": "tasks_tour", "title": "Tasks",
      "mandatory": false, "estimatedMinutes": 2,
      "triggerCondition": "first_visit_to_tasks", "steps": []
    },
    {
      "id": 8, "name": "domains_tour", "title": "CQC Domains",
      "mandatory": false, "estimatedMinutes": 3,
      "triggerCondition": "first_visit_to_any_domain_page", "steps": []
    },
    {
      "id": 9, "name": "reports_audit_tour", "title": "Reports & Audit Log",
      "mandatory": false, "estimatedMinutes": 2,
      "triggerCondition": "first_visit_to_reports_or_audit", "steps": []
    },
    {
      "id": 10, "name": "settings_tour", "title": "Settings & Integrations",
      "mandatory": false, "estimatedMinutes": 2,
      "triggerCondition": "first_visit_to_settings", "steps": []
    },
    {
      "id": 11, "name": "ai_chat_tour", "title": "AI Chat Assistant",
      "mandatory": false, "estimatedMinutes": 1,
      "triggerCondition": "first_open_of_chat_panel", "steps": []
    }
  ],
  "checklist": {
    "items": [
      { "id": "complete-tour", "label": "Complete the welcome tour", "linkedPhase": 1 },
      { "id": "link-consentz", "label": "Link your Consentz account", "target": "/settings/integrations" },
      { "id": "review-gaps", "label": "Review your priority gaps", "target": "/dashboard" },
      { "id": "upload-evidence", "label": "Upload your first evidence", "linkedFlow": "flow-upload-evidence" },
      { "id": "generate-policy", "label": "Generate a policy with AI", "linkedFlow": "flow-generate-policy" },
      { "id": "add-staff", "label": "Add a staff member", "target": "/staff" },
      { "id": "visit-domain", "label": "Explore a CQC domain page", "target": "/domains/safe" },
      { "id": "ask-ai", "label": "Ask the AI assistant a question", "target": "open-chat" }
    ]
  },
  "helpWidget": {
    "position": "bottom-right",
    "initialAnimation": "pulse",
    "animationDuration": 3,
    "sections": ["search", "guides", "tutorials", "tours", "faq", "support", "checklist"]
  }
}
```

---

## 23. Step Timing Estimates

### Phase 1: Welcome & Orientation (~4 min total)

| Step | Estimated Time | Type |
|------|---------------|------|
| Step 0: Welcome Modal | 30 seconds | Reading |
| Step 1: Navigation Sidebar | 20 seconds | Viewing |
| Step 2: Compliance Score | 25 seconds | Viewing |
| Step 3: Predicted Rating | 20 seconds | Viewing |
| Step 4: Open Gaps | 20 seconds | Viewing |
| Step 5: CQC Domains | 25 seconds | Viewing |
| Step 6: Priority Gaps | 20 seconds | Viewing |
| Step 7: Evidence Preview | 15 seconds | Viewing |
| Step 8: Policies Preview | 20 seconds | Viewing |
| Step 9: Staff/Incidents/Tasks | 25 seconds | Viewing |
| Step 10: AI Chat | 20 seconds | Viewing |
| Step 11: Completion | 30 seconds | Reading |
| **Total** | **~4.5 minutes** | |

### Phases 2-11: Page-Level Tours

| Phase | Steps | Estimated Time |
|-------|-------|---------------|
| Phase 2: Dashboard Deep-Dive | 7 | ~3 minutes |
| Phase 3: Evidence | 6 | ~3 minutes |
| Phase 4: Policies | 5 | ~2 minutes |
| Phase 5: Staff | 5 | ~2 minutes |
| Phase 6: Incidents | 4 | ~2 minutes |
| Phase 7: Tasks | 4 | ~2 minutes |
| Phase 8: CQC Domains | 6 | ~3 minutes |
| Phase 9: Reports & Audit | 3 | ~2 minutes |
| Phase 10: Settings | 4 | ~2 minutes |
| Phase 11: AI Chat | 3 | ~1 minute |
| **Total (all page tours)** | **47 steps** | **~22 minutes** |

Users don't complete all tours at once — they trigger naturally as the user navigates to each page over their first days.

---

## 24. Implementation Priority

| Priority | Component | Effort |
|---|---|---|
| **P0 — Ship with MVP** | Phase 1 Welcome Walkthrough (12 steps) | 3-4 days |
| **P0 — Ship with MVP** | Spotlight overlay + tooltip components | 2-3 days |
| **P0 — Ship with MVP** | Onboarding Checklist | 2 days |
| **P0 — Ship with MVP** | data-tour attributes on all existing UI elements | 1 day |
| **P1 — Week 2** | Page-level tours (Phases 2-11) | 4-5 days |
| **P1 — Week 2** | Help Widget (basic) | 2 days |
| **P2 — Week 3** | Guided Action Flows (top 4) | 3-4 days |
| **P2 — Week 3** | Contextual micro-tips (first 10) | 2 days |
| **P3 — Month 2** | Service-type content filtering | 1 day |
| **P3 — Month 2** | Additional micro-tips (10+) | Ongoing |
| **P3 — Month 2** | Help Widget search + articles | 2-3 days |

---

**END OF DOCUMENT**
