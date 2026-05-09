# CQC Compliance Platform — Evidence Scoring Engine Specification

> **File 8 of 8** | The complete, explicit, traceable model for how every compliance percentage in the platform is computed.
> **Supersedes:** `07-ASSESSMENT-ENGINE.md` §11 (Scoring Pipeline), §12 (Evidence Quality & Timeliness), §18 (Worked Examples). The questionnaire architecture in `07` (§1–§10) remains current.
> **Version:** 1.0 — May 2026
> **Audience:** Engineers, regulators, auditors, clinic owners. Anyone who needs to defend a score in front of CQC.
> **Companion files:** `01-ARCHITECTURE.md` · `02-DATABASE.md` · `04-CQC-FRAMEWORK.md` · `07-ASSESSMENT-ENGINE.md`

---

## Why this document exists

Earlier versions of the platform documented scoring as `answers × evidenceQualityFactor × timelinessFactor`. The implementation has since moved to a fundamentally different, **evidence-first** model: the questionnaire records a clinic's *claimed* position, but the score the user sees on their dashboard is driven entirely by the evidence library and the AI verification verdict on every uploaded document.

This document is the single source of truth for that new model. Every formula below traces to a specific file and line in the codebase (see §9). When in doubt, code wins; if code and this doc disagree, the doc is the bug.

---

## Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [Evidence Type Catalogue](#2-evidence-type-catalogue)
3. [Per-Item Scoring Model](#3-per-item-scoring-model)
4. [Source & Validation Logic](#4-source--validation-logic)
5. [Aggregation Logic — KLOE → Domain](#5-aggregation-logic--kloe--domain)
6. [Impact on Overall Scoring](#6-impact-on-overall-scoring)
7. [Worked Examples](#7-worked-examples)
8. [Interpretation Layer](#8-interpretation-layer)
9. [Code Traceability Table](#9-code-traceability-table)
10. [Open Decisions / Deprecated Logic](#10-open-decisions--deprecated-logic)

---

## 1. Overview & Philosophy

### 1.1 The numbers a user can see

| Number | What it means | Where it comes from |
|---|---|---|
| **Per-evidence `complianceScore`** | "How well does this one document meet the CQC requirement?" | Claude AI returns 0–100 after comparing the upload against the Cura template gold standard |
| **Per-KLOE score** | "How compliant is this Key Line of Enquiry?" | Weighted average of evidence multipliers, capped by gap presence |
| **Per-domain score** | "How compliant is Safe / Effective / Caring / Responsive / Well-Led?" | Mean of the KLOE scores in that domain |
| **Overall score** | "How compliant is the clinic overall?" | Mean of the 5 domain scores |
| **Predicted CQC rating** | Inadequate / Requires Improvement / Good / Outstanding | `score → rating` thresholds, then CQC aggregation rules across domains |

Every other number in the dashboard derives from those.

### 1.2 The shift away from questionnaire-driven scoring

The questionnaire in `07-ASSESSMENT-ENGINE.md` still exists and is still answered during onboarding. Its job is now narrower:

- **It anchors expectations.** It tells the clinic what they *claim* to have, so missing evidence is visible as a delta against the claim.
- **It seeds the gap list.** A "no" to "Do you have a current safeguarding policy?" creates a `compliance_gap` row even before any upload happens.
- **It does not directly drive the displayed score.** A clinic that answers "yes" to all 61 questions but uploads zero evidence sees a 0% score, not 100%. This is by design — auditors do not credit unverified claims.

> *"The self-assessment questionnaire sets a claimed starting position. The displayed compliance score is driven exclusively by evidence status."*
> — `src/lib/services/score-engine.ts:611–613`

### 1.3 The Cura template as gold standard

The clinic's authoritative policy template library (the **Cura manual** — 92 templates organised into 10 sections, GOV / CSP / CLP / COM / FIN / SEC / MKT / HWB / SPS / PWI) is treated as the CQC-aligned reference. When a clinic uploads a policy document, Claude is given the matching Cura template as context and asked: "How well does this upload match the gold standard?"

This is what turns a vague LLM verdict into a defensible compliance score: the answer is grounded in a specific reference document, and the AI is instructed to call out exactly which sections of the gold-standard template are missing from the upload.

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Clinic uploads  │ →  │  Claude compares │ →  │  Score 0–100 +   │
│  e.g. their      │    │  upload against  │    │  findings array  │
│  safeguarding    │    │  Cura template   │    │  + missing       │
│  policy          │    │  S1_EV01 maps to │    │  elements list   │
│                  │    │                  │    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

### 1.4 Scoring pipeline at a glance

```
EVIDENCE LAYER                       KLOE LAYER             DOMAIN LAYER       OVERALL
═══════════════════════════════════════════════════════════════════════════════════════
[Item 1] weight×multiplier ┐
[Item 2] weight×multiplier ├→ Σ ÷ Σweight ×100 = KLOE %  ┐
[Item 3] missing (gap)     │     ↓ apply gap caps        │
[Item 4] weight×multiplier ┘     KLOE score              ├→ mean = Domain % ┐
                                                          │                  │
[Item 1] weight×multiplier ┐                              │                  │
[Item 2] weight×multiplier ├→ KLOE score                  │                  │
[Item 3] weight×multiplier ┘                              ┘                  ├→ mean = Overall %
                                                                             │      ↓
                                                          (×5 domains)       │   threshold map
                                                                             │      ↓
                                                                             │   CQC rating
                                                                             │      ↓
                                                                             └→ aggregation rules
                                                                                across the 5 domains
```

---

## 2. Evidence Type Catalogue

Every required evidence item in the platform belongs to exactly one **source label** (where it comes from) and falls into one of several **functional categories** (what kind of artefact it is). Both matter for scoring.

### 2.1 Source labels

There are four source labels. They are persisted on every `KloeEvidenceItem` and stored on `kloe_evidence_status.evidence_type`:

| Source label | Display | What it means | Where validity comes from |
|---|---|---|---|
| `POLICY` | "Policy" | A written policy or procedure document | AI verification against Cura template |
| `MANUAL_UPLOAD` | "Manual Upload" | A non-policy artefact uploaded by the clinic (training cert, DBS check, audit report, risk assessment, etc.) | AI verification of presence + content |
| `CONSENTZ` | "Consentz" | Live operational data fetched from the Consentz EHR (consent forms, treatment notes, incident logs) | Sync recency + Consentz API metrics |
| `CONSENTZ_MANUAL` | "Consentz / Manual" | Either the Consentz EHR or a manual upload satisfies the requirement | Whichever channel is most recent |

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/constants/cqc-evidence-requirements.ts:3-10`

### 2.2 Functional categories (within source labels)

A source label tells you *where* evidence comes from. The functional category tells you *what kind of thing* it is and what "good" looks like.

#### 2.2.1 Policies (AI-generated or uploaded)

| | |
|---|---|
| **Source label** | `POLICY` |
| **Examples** | Safeguarding policy, IPC policy, medicines management policy, consent policy |
| **Counts as valid when** | A document exists, status = `complete`, is not expired (review date in future), and has been compared against the matching Cura template |
| **"Good" looks like** | AI compliance score ≥ 70. Document is a faithful adoption (or stronger equivalent) of the Cura template, contains organisation-specific details (clinic name, designated lead, local procedures), is dated, has a review date in the future |
| **"Poor" looks like** | AI compliance score < 50. Generic template with no clinic-specific content, missing review date, missing key sections that the Cura reference contains, or contradicts the gold standard |
| **Hard zero** | Blank / corrupted / unreadable file → `complianceScore = 0`. Wrong document type (e.g. a menu uploaded as a safeguarding policy) → `complianceScore = 0` |
| **AI-generated vs uploaded** | When the platform generates a policy via the policy generator (Cura-grounded RAG), the generated document is treated identically to a manual upload — it must still pass the AI verification check before contributing to score |

#### 2.2.2 Training records

| | |
|---|---|
| **Source label** | `MANUAL_UPLOAD` (sometimes `CONSENTZ_MANUAL` if Consentz EHR tracks competency) |
| **Examples** | Safeguarding training certificate, BLS/ILS, infection control, GDPR, medicines competency |
| **Counts as valid when** | Certificate uploaded, status = `complete`, expiry date is in the future (typically 12 months from issue), and AI confirms it matches the requirement |
| **"Good" looks like** | Recent (issued within the last 12 months), named to the staff member, clearly states the topic, AI compliance score ≥ 70, expiry date present and in the future |
| **"Poor" looks like** | Generic "attendance" certificate with no topic, no expiry date, or expiry within 30 days (`expiring_soon`) without renewal evidence |
| **Hard zero** | Expired training (expiry date in the past) → counts as missing for scoring purposes |

#### 2.2.3 Staff registrations

| | |
|---|---|
| **Source label** | `MANUAL_UPLOAD` |
| **Examples** | NMC pin, GMC registration, GPhC registration, professional indemnity insurance |
| **Counts as valid when** | Registration document uploaded, registration_expiry is in the future, AI confirms identity and registration body |
| **"Good" looks like** | Current, professional body matches role (e.g. NMC for nurses), expiry > 90 days away |
| **"Poor" looks like** | Expired registration (treated as missing — see hard caps in §3.3), placeholder PDF, or wrong professional body for the role |

#### 2.2.4 Risk assessments

| | |
|---|---|
| **Source label** | `MANUAL_UPLOAD` |
| **Examples** | Fire risk assessment, Legionella, COSHH, treatment-specific risk assessments, environmental risk assessment |
| **Counts as valid when** | Document uploaded, dated, signed by a competent person, review date in the future (typically 12 months) |
| **"Good" looks like** | Site-specific (clinic name, treatment list, premises layout), identifies hazards, lists controls, signed and dated, review date < 12 months ago |
| **"Poor" looks like** | Generic template, undated, no controls listed, or last review > 12 months ago |

#### 2.2.5 Audits

| | |
|---|---|
| **Source label** | `MANUAL_UPLOAD` |
| **Examples** | Hand hygiene audit, medication audit, IPC audit, clinical records audit |
| **Counts as valid when** | Audit report uploaded with date, scope, findings, and actions; conducted within the last 12 months |
| **"Good" looks like** | Quantitative findings (e.g. "94% compliance with hand hygiene over 50 observations"), action plan with owners and dates, evidence of follow-up |
| **"Poor" looks like** | Audit "completed" but no findings or actions documented, undated, or older than the audit cycle frequency |

#### 2.2.6 Operational logs (activity-based)

| | |
|---|---|
| **Source label** | `MANUAL_UPLOAD` or `CONSENTZ_MANUAL` |
| **Examples** | Fridge temperature logs, cleaning schedules completed, controlled drugs register, incident log |
| **Expiry rule** | Activity-based — must show activity within the last `activityThresholdDays` (typically 7 days). After that, the item is automatically marked `expiry_status = 'expired'` |
| **"Good" looks like** | Daily/weekly entries, signed, no gaps in the date range |
| **"Poor" looks like** | Sparse entries, last entry > 7 days ago (auto-expires) |

#### 2.2.7 Consentz-sourced operational evidence

| | |
|---|---|
| **Source label** | `CONSENTZ` |
| **Examples** | Patient consent records, treatment notes, staff competency tracking, patient feedback |
| **Counts as valid when** | The Consentz integration is connected, the relevant endpoint has been synced, and the most recent sync is within 24 hours |
| **"Good" looks like** | Connected, synced today, healthy completion rates (consent completion ≥ 90%, staff competency ≥ 85%) |
| **"Poor" looks like** | Connected but no sync, or last sync > 24 hours ago — both treated as missing |
| **Hard zero** | Consentz disconnected → all CONSENTZ-typed items count as missing |

#### 2.2.8 "Other" uploads

Files that don't fit any of the above categories (e.g. meeting minutes, photos, supplementary documentation) are typed as `OTHER` in `EvidenceType` but only contribute to score if they are explicitly linked to a `KloeEvidenceItem` via `kloe_evidence_status`. An "other" file uploaded to the general evidence library that isn't linked to any KLOE has zero scoring impact — by design — because it cannot be tied to a specific compliance requirement.

### 2.3 Criticality levels

Every `KloeEvidenceItem` is one of three criticality levels. This drives the weight in the score formula and the severity of the gap if the item is missing.

| Criticality | Weight | Examples | Behaviour if missing |
|---|---|---|---|
| `critical` | **3** | Safeguarding policy, DBS checks, fire risk assessment, prescribing protocols, IPC policy | Counts as a critical gap; KLOE score capped at 50 (40 if expired) |
| `high` | **2** | Treatment risk assessments, training records, equipment maintenance, incident logs | Counts as a high gap; KLOE score capped at 70 (60 if 2+ high gaps) |
| `medium` | **1** | Whistleblowing policy, chaperone policy, supplementary procedures | No score cap from a single missing medium item; just reduces weighted average |

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/constants/cqc-evidence-requirements.ts:12-16`

> **No `low` criticality exists.** This is intentional — every item required by CQC is at minimum a "medium" because if it weren't required, it wouldn't be on the list.

### 2.4 Expiry types

Each item declares one of three expiry models:

| Expiry type | Behaviour |
|---|---|
| `date` | Item has a hard expiry date (`expires_at`). Auto-flagged `expiring_soon` 30 days before expiry, `expired` after. Default 12 months for policies, training, risk assessments, audits |
| `activity` | Item is "alive" only if `last_activity_at` is within `activityThresholdDays` (typically 7). Used for operational logs (cleaning, fridge temp, hand hygiene) |
| `none` | Item has no expiry — once present it stays present. Used for incident logs, controlled drugs registers, decontamination logs (their freshness is checked via the `activity` mechanism on a separate item) |

> Source: `@/Users/blackpanther/Desktop/consentz/src/types/index.ts:24` and `@/Users/blackpanther/Desktop/consentz/src/lib/services/evidence-status-service.ts:14-38`

---

## 3. Per-Item Scoring Model

This is where the rubber meets the road. For every required evidence item, exactly one number falls out: its **contribution** to the parent KLOE's weighted sum.

### 3.1 The headline formula

```
contribution(item) = criticality_weight(item) × multiplier(item)
```

That's it. Two terms. The rest of this section explains how each term is computed, with no hidden behaviour.

### 3.2 The criticality weight

Already defined in §2.3:

```
criticality_weight = { critical: 3, high: 2, medium: 1 }
```

### 3.3 The multiplier

The multiplier is a number in `[0, 1]` that represents *how well* the item satisfies the requirement. It is computed in two stages: a **presence gate** (binary) and a **quality multiplier** (graduated 0–1).

#### 3.3.1 The presence gate

Before anything else, the item must pass a presence check. If the gate fails, multiplier = 0 *and* the item is counted as a gap.

```
isPresent =
    status === 'complete'
    AND expiry_status !== 'expired'
    AND NOT consentzDisconnected
    AND NOT consentzMissing
    AND NOT consentzOverdue
```

Where:

- `consentzDisconnected` = item is `CONSENTZ`/`CONSENTZ_MANUAL` AND clinic has no Consentz integration
- `consentzMissing` = item is Consentz-typed AND integration is connected AND no sync has ever happened
- `consentzOverdue` = item is Consentz-typed AND last sync was more than 24 hours ago

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/services/kloe-score-formula.ts:116-127`

`expiring_soon` items still pass the gate (they are not yet expired). They are flagged in the UI with a warning but score normally — this prevents premature cliff-edges 30 days before a renewal is due.

#### 3.3.2 The quality multiplier

Once an item is present, the multiplier is determined by the AI verification verdict:

```
multiplier(item) =
    IF verification.complianceScore is set:
        complianceScore / 100         # graduated 0.00 - 1.00
    ELSE IF verification.status == 'rejected':
        0.0                           # legacy fallback
    ELSE IF verification.status == 'verified':
        1.0                           # legacy fallback
    ELSE:
        0.7                           # baseline for unscanned items
```

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/services/kloe-score-formula.ts:42-50`

The 0.7 baseline exists for two reasons:

1. **Backwards compatibility.** Documents uploaded before the AI auto-verification pipeline was built do not have a `complianceScore`. They get 0.7 (a "trust but verify") so they don't suddenly drop to 0 when the new model rolled out.
2. **Latency cushion.** When a user uploads a fresh document, the AI verification runs as a fire-and-forget job. The user briefly sees their score with the new item at 0.7 before Claude completes (typically 5–15 seconds). The score then settles to whatever the AI verdict says.

### 3.4 The AI compliance score scale

The AI returns an integer 0–100. This is what each band means in the system prompt that Claude follows:

| Band | Meaning | Typical findings |
|---|---|---|
| **90–100** | Excellent | Fully meets the requirement, comprehensive, current, well-structured, clinic-specific |
| **70–89** | Good | Meets the core requirement; minor gaps; could be strengthened |
| **50–69** | Partially meets | Covers some elements; significant gaps that an inspector would note |
| **30–49** | Inadequate | Touches on the topic but fundamentally fails to meet the requirement |
| **0–29** | Non-compliant | Irrelevant, expired, generic template with no clinic-specific content, blank, corrupted, or unreadable |

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/services/evidence-verification-service.ts:183-190`

#### 3.4.1 Hard rules in the AI prompt

The Claude prompt enforces a few non-negotiables that cap or zero the score regardless of other content:

- A **blank, corrupted, or unreadable** document → 0
- A **completely irrelevant** document (wrong subject) → 0
- A **generic template** without organisation-specific details → max 40
- An **expired document** (review date passed) → max 50
- A document with **missing dates** → max 60

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/services/evidence-verification-service.ts:191-202`

### 3.5 Worked single-item example

A clinic uploads their safeguarding policy (item `S1_EV01`, criticality `critical`).

| Stage | Value | Source |
|---|---|---|
| Criticality weight | 3 | `S1_EV01` is `critical` |
| `kloe_evidence_status.status` | `complete` | Set automatically when file uploaded |
| `kloe_evidence_status.expiry_status` | `valid` | Review date 2027-04-01, today 2026-05-09 |
| Consentz checks | N/A | `POLICY` source — Consentz checks skipped |
| Presence gate | ✅ pass | All conditions met |
| AI returns | `complianceScore: 88` | Document is faithful to Cura template, clinic-specific, dated, has named designated lead |
| Multiplier | 0.88 | `88 / 100` |
| **Contribution** | **2.64** | `3 × 0.88` |

That 2.64 is the number that goes into the KLOE's weighted sum. Nothing else.

---

## 4. Source & Validation Logic

### 4.1 The four ingestion paths

| Path | Trigger | Pipeline |
|---|---|---|
| **Manual upload via UI** | User clicks "Upload Evidence" on a KLOE detail page | File → Supabase Storage → `evidence_file_versions` row → `kloe_evidence_status.status = complete` → fire-and-forget AI verify → `verification_result` written back |
| **Policy generated by AI** | User clicks "Generate with AI" against a Cura template row | Claude generates policy via RAG → saved as `policies` row + `evidence_file_versions` → linked to the KLOE → AI verify runs (yes, even on the just-generated policy, to score it like any other upload) |
| **Consentz EHR sync** | Cron job or manual sync button | Consentz API → `consentz_sync_logs` row → for each linked KLOE item, `kloe_evidence_status.consentz_synced_at = now`, `status = complete` |
| **Manual mark-complete (legacy)** | User clicks "Mark complete" without uploading a file | Allowed only for items pre-AI-verification era; sets `status = complete` with no `verification_result` → multiplier defaults to 0.7 |

### 4.2 How "valid" is determined per source label

#### 4.2.1 `POLICY` items

```
isValid(POLICY) =
    file uploaded AND status = complete
    AND NOT expired (review date in future)
    AND AI complianceScore ≥ 0  (i.e. AI ran successfully)
```

Notice that AI complianceScore ≥ 0 is **always true** if AI ran — i.e. presence + non-expired is the validity gate, and the AI score becomes the *quality* signal that feeds the multiplier. A policy can be "valid" (counted as present) but still score 30 if it's poor quality.

#### 4.2.2 `MANUAL_UPLOAD` items

```
isValid(MANUAL_UPLOAD) =
    file uploaded AND status = complete
    AND
        (date-based: NOT expired)
        OR (activity-based: last_activity_at within threshold)
        OR (no expiry: no further check)
```

Same multiplier path through AI verification. Note that for activity-based items (e.g. cleaning logs), validity is automatic — if the log hasn't been touched in 7 days, the system flips `expiry_status` to `expired` on its own (cron job calls `EvidenceStatusService.refreshExpiryStatuses`).

#### 4.2.3 `CONSENTZ` items

```
isValid(CONSENTZ) =
    organisation.consentz_clinic_id is set
    AND consentz_synced_at is not null
    AND consentz_synced_at within 24h of now
```

There is no AI verification for Consentz items — the validity comes from the API itself returning fresh data. The contribution multiplier is taken from the verification map if one exists (e.g. for items that *can* also be uploaded manually as `CONSENTZ_MANUAL`), otherwise 1.0.

#### 4.2.4 `CONSENTZ_MANUAL` items

This is an "or" — either source satisfies the requirement. The validity check is:

```
isValid(CONSENTZ_MANUAL) =
    isValid as CONSENTZ
    OR isValid as MANUAL_UPLOAD
```

In practice the system tracks whichever source has the most recent activity.

### 4.3 The Cura template comparison (POLICY items only)

For `POLICY` items, the AI is given the matching Cura template(s) as context. The mapping `evidence_item_id → cura_templates[]` is maintained in `policy-template-service.ts` and uses three coverage states:

| Coverage state | Meaning | Effect on AI scoring instructions |
|---|---|---|
| `covered` | The Cura template directly addresses this requirement | If the upload is a faithful adoption (or stronger), score 80–100 |
| `partial` | Cura has a policy but is missing a related artefact (e.g. policy exists, but no log template) | Call out the missing artefact in `missingElements`; score proportionally |
| `consentz` | The "policy" lives in Cura but the actual evidence is operational data from the Consentz EHR | A written policy alone scores 60–75; the *real* evidence is the Consentz sync |

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/services/evidence-verification-service.ts:209-218`

### 4.4 "Linked but invalid" — the four ways an item can be present in the database but not contribute to score

A user can see a row in their evidence table and reasonably ask: "I uploaded this — why isn't it boosting my score?" There are exactly four reasons:

1. **Expired.** `expiry_status === 'expired'` — gate fails, item counts as missing for scoring.
2. **Consentz disconnected.** Item is Consentz-typed and the clinic disconnected the integration.
3. **AI rejected.** AI verdict was `complianceScore: 0` (e.g. uploaded the wrong document type) or status `rejected` with no score.
4. **Linked to wrong KLOE.** The file exists in `evidence_file_versions` but `kloe_evidence_status` was never updated for the requested KLOE — common in bulk uploads. Filter: the formula only sees rows for *this* KLOE.

The dashboard's evidence library shows the item with a status badge for cases 1–3. Case 4 is rare and is fixed by the "Link to KLOE" action.

---

## 5. Aggregation Logic — KLOE → Domain

### 5.1 Per-KLOE score

```
raw_kloe_score =
    Σ (criticality_weight(item_i) × multiplier(item_i))   ← only present items contribute >0
    ─────────────────────────────────────────────────  × 100
    Σ criticality_weight(item_i)                         ← all items including missing
```

Then the **gap caps** are applied (cumulatively — take the lowest):

```
IF criticalGapCount > 0:
    raw_kloe_score = min(raw_kloe_score, hasCriticalExpired ? 40 : 50)

IF highGapCount >= 2:
    raw_kloe_score = min(raw_kloe_score, 60)
ELSE IF highGapCount == 1:
    raw_kloe_score = min(raw_kloe_score, 70)

kloe_score = round(raw_kloe_score)
```

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/services/kloe-score-formula.ts:99-148`

#### 5.1.1 Why the cap is on the displayed score, not the rating

We deliberately cap the *score itself*, not just the rating. This means a clinic with a 92% raw KLOE score but one missing critical item sees `50%` on their dashboard, not "92% — Requires Improvement". The reason: the score is the most-glanced number in the platform, and it should never imply "Outstanding" when a critical gap exists. This is stricter than the questionnaire-era model (which only capped the rating).

### 5.2 Per-domain score

```
domain_score = round(clamp(0, 100, mean(kloe_scores in this domain)))
```

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/services/score-engine.ts:653-658`

The arithmetic mean is intentional — KLOEs within a domain are treated as equally weighted. CQC's framework has no formal weighting between KLOEs; weighting only kicks in across the 5 domains in the rating-aggregation phase (§6).

#### 5.2.1 Service-type filtering

The KLOEs included in the mean depend on service type:

- **Aesthetic Clinic**: KLOEs S1–S6, E1, E2, E4, E6, E7, C1, C2, C3, R1, R2, R3, W1, W2, W3, W4, W5, W6 — `Effective E3` (Nutrition) is excluded, and can also be marked N/A explicitly via `organizations.e3_nutrition_na_aesthetic`.
- **Care Home**: All KLOEs including E3 (Nutrition).

If a KLOE is filtered out for the service type, it does not appear in the mean — the denominator shrinks.

### 5.3 The deprecated `evidenceQualityFactor` (0.5–1.0)

The old `07-ASSESSMENT-ENGINE.md` §12 specified a domain-level multiplier `evidenceQualityFactor ∈ [0.5, 1.0]` derived from the count and freshness of evidence items, applied as:

```
domain_score_OLD = raw_questionnaire_score × evidenceQualityFactor × timelinessFactor
```

This is **no longer used**. The function `calculateEvidenceQuality` still exists at `@/Users/blackpanther/Desktop/consentz/src/lib/services/score-engine.ts:113-145` but is not called from anywhere in the live scoring pipeline. It is dead code.

The reason it lingers: at the time of migration we kept it as a safety net in case the new evidence-first model proved too harsh and we needed to fall back to a hybrid. The new model has been live in production since the Cura integration (April 2026) and the fallback has not been needed.

**Recommendation:** delete `calculateEvidenceQuality` and `calculateTimeliness` in a follow-up cleanup PR (see §10.1).

### 5.4 Confidence score (separate from compliance score)

Confidence is a 0.0–1.0 number that tells the user "how much can we trust the displayed compliance score?". It is shown next to the overall score on the dashboard.

```
confidence =
    completeEvidenceItemCount / totalEvidenceItemCount    ← clamped to [0, 1]
```

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/services/score-engine.ts:250-260`

A clinic that has uploaded evidence for 30 of 80 required items has `confidence = 0.375`. The displayed compliance score is still computed normally — confidence is just transparency about how much of the picture is filled in.

---

## 6. Impact on Overall Scoring

### 6.1 Overall compliance score

```
overall_score = round(mean(domain_scores))
```

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/services/score-engine.ts:386-390`

All 5 domains weighted equally. This matches CQC's published methodology — there is no formal weighting between Safe / Effective / Caring / Responsive / Well-Led for the headline rating.

### 6.2 Score → rating thresholds

The same threshold table applies to per-KLOE scores, per-domain scores, and the overall score:

| Score range | Rating |
|---|---|
| 88–100 | `OUTSTANDING` |
| 63–87 | `GOOD` |
| 39–62 | `REQUIRES_IMPROVEMENT` |
| 0–38 | `INADEQUATE` |

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/services/score-engine.ts:379-384`

### 6.3 Per-domain rating limiters (in addition to the score caps)

After the threshold map, per-domain ratings are further capped by gap counts (rolled up across all KLOEs in that domain plus open `compliance_gaps` rows):

```
IF domain_critical_gap_count > 0 AND rating IN {OUTSTANDING, GOOD}:
    rating = REQUIRES_IMPROVEMENT

IF domain_high_gap_count > 0 AND rating == OUTSTANDING:
    rating = GOOD
```

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/services/score-engine.ts:669-674`

Note that the *score* itself is not modified at this stage — only the displayed rating. The score caps in §5.1 already handle the score-level effect at the KLOE layer.

### 6.4 Overall rating — CQC aggregation rules

The platform mirrors CQC's published aggregation methodology for combining 5 domain ratings into a single headline rating:

```
IF count(INADEQUATE) >= 2:                                  → INADEQUATE
ELIF count(INADEQUATE) >= 1:                                → REQUIRES_IMPROVEMENT
ELIF count(REQUIRES_IMPROVEMENT) >= 2:                      → REQUIRES_IMPROVEMENT
ELIF hasCriticalGap (anywhere):                             → REQUIRES_IMPROVEMENT
ELIF count(OUTSTANDING) >= 2 AND count(GOOD)+count(OUTSTANDING) == 5: → OUTSTANDING
ELIF count(GOOD) + count(OUTSTANDING) == 5:                 → GOOD
ELIF count(REQUIRES_IMPROVEMENT) == 1 AND that domain's score >= 55: → GOOD
ELSE:                                                       → REQUIRES_IMPROVEMENT
```

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/services/score-engine.ts:396-427`

#### 6.4.1 Note on the "1 RI but score ≥55" rule

A domain just barely under the GOOD threshold (e.g. 60%) can be rounded up to GOOD overall if it's the *only* sub-Good domain and the other 4 are at least GOOD. This matches CQC's "characteristic of GOOD" weighting: one weaker area doesn't drag the whole organisation down if the rest is strong.

### 6.5 Time-to-Good estimate

For clinics not yet at GOOD overall, the platform shows an estimated number of days to reach GOOD:

```
time_to_good_days =
    Σ (3 × count(open critical gaps))
  + Σ (14 × count(open high gaps))
  + Σ (30 × count(open medium gaps))
  ; minimum 14 days
  ; null if all 5 domains already GOOD or OUTSTANDING
```

> Source: `@/Users/blackpanther/Desktop/consentz/src/lib/services/score-engine.ts:433-460`

This is an estimate, not a promise. It assumes the clinic resolves gaps at typical pace — 3 days for a critical (e.g. upload an existing policy), 14 days for a high (e.g. complete a training course), 30 days for a medium (e.g. write a new procedure).

### 6.6 Interaction with the questionnaire

The questionnaire contributes **zero** to the displayed score. It contributes:

- **`compliance_gaps` rows** (when a "no" answer triggers `gapTrigger.severity`). These rows are tied to a *domain* (not a specific evidence item) and feed the **per-domain rating limiter** at §6.3 — they do **not** feed the KLOE score cap at §5.1, which is driven only by missing evidence items.
- **A compliance plan** (the gap list shown on the onboarding step 4 results screen).
- **Onboarding completion state** for the wizard.

If a clinic answers all 61 questions "yes" but uploads no evidence, the questionnaire creates 0 gap rows. But every required evidence item is missing, so each KLOE has multiple critical gaps from missingness. The KLOE scores are 0 (and capped at 50 by the missing-item logic anyway). The domain scores are 0. The overall score is 0. The rating is INADEQUATE.

If the same clinic answers all 61 questions "no" but uploads strong evidence for every requirement, the questionnaire creates ~40–50 `compliance_gaps` rows. Those rows would cap each domain's *rating* at RI (via §6.3) until they are resolved, but the displayed *score* still reflects evidence quality — likely 85–95% depending on AI scores. As the user resolves each gap row in the compliance plan, the rating limiter releases and the displayed rating climbs to match the score.

The model is intentionally sceptical: claims without proof score 0; proof without claims scores correctly but the rating sits a tier below until the open gap rows are cleared.

---

## 7. Worked Examples

All examples below use the **SAFE / S1 — Safeguarding** KLOE for an **Aesthetic Clinic**, which has 6 evidence items:

| Item | Source | Criticality | Weight |
|---|---|---|---|
| `S1_EV01` Safeguarding policy | POLICY | critical | 3 |
| `S1_EV02` Safeguarding training records | MANUAL_UPLOAD | critical | 3 |
| `S1_EV03` DBS check records | MANUAL_UPLOAD | critical | 3 |
| `S1_EV04` Safeguarding incident log | MANUAL_UPLOAD | critical | 3 |
| `S1_EV05` Whistleblowing policy | POLICY | medium | 1 |
| `S1_EV06` Chaperone policy | POLICY | medium | 1 |

**Total weight = 14** (4 critical × 3 + 2 medium × 1)

### 7.1 Example A — Empty evidence library

A new clinic finishes onboarding, answers all 61 questions, uploads no evidence.

| Item | Status | Multiplier | Contribution |
|---|---|---|---|
| S1_EV01 | not_started | — (gap) | 0 |
| S1_EV02 | not_started | — (gap) | 0 |
| S1_EV03 | not_started | — (gap) | 0 |
| S1_EV04 | not_started | — (gap) | 0 |
| S1_EV05 | not_started | — (gap) | 0 |
| S1_EV06 | not_started | — (gap) | 0 |
| **Σ** | — | — | **0** |

```
raw_kloe = 0 / 14 × 100 = 0
critical_gaps = 4   →   cap at 50   →   min(0, 50) = 0
high_gaps = 0       →   no cap
S1 score = 0
```

**S1 = 0% (Inadequate).** Same logic across all KLOEs → all domains 0% → overall 0% → **rating INADEQUATE**.

### 7.2 Example B — All uploaded but generic templates

The clinic uploads all 6 documents, but every one is a generic boilerplate with no clinic-specific content. AI returns `complianceScore: 35` for each (because the prompt rule says "generic templates without organisation-specific details should score no higher than 40").

| Item | Status | AI score | Multiplier | Weight | Contribution |
|---|---|---|---|---|---|
| S1_EV01 | complete | 35 | 0.35 | 3 | 1.05 |
| S1_EV02 | complete | 35 | 0.35 | 3 | 1.05 |
| S1_EV03 | complete | 35 | 0.35 | 3 | 1.05 |
| S1_EV04 | complete | 35 | 0.35 | 3 | 1.05 |
| S1_EV05 | complete | 35 | 0.35 | 1 | 0.35 |
| S1_EV06 | complete | 35 | 0.35 | 1 | 0.35 |
| **Σ** | — | — | — | **14** | **4.90** |

```
raw_kloe = 4.90 / 14 × 100 = 35
critical_gaps = 0   →   no cap
high_gaps = 0       →   no cap
S1 score = 35
```

**S1 = 35% (Inadequate).** All items present → no caps. Score is a direct reflection of the AI's "documents are generic" verdict.

### 7.3 Example C — All uploaded, Cura-aligned, organisation-specific

Same clinic, same 6 items, but each policy is the platform-generated Cura policy customised with clinic name, designated lead, local procedures. Training records are real, dated, named to staff. AI scores: policies 92, training 90, DBS 88, incident log 85, whistleblowing 90, chaperone 88. Average ≈ 89.

| Item | Status | AI score | Multiplier | Weight | Contribution |
|---|---|---|---|---|---|
| S1_EV01 | complete | 92 | 0.92 | 3 | 2.76 |
| S1_EV02 | complete | 90 | 0.90 | 3 | 2.70 |
| S1_EV03 | complete | 88 | 0.88 | 3 | 2.64 |
| S1_EV04 | complete | 85 | 0.85 | 3 | 2.55 |
| S1_EV05 | complete | 90 | 0.90 | 1 | 0.90 |
| S1_EV06 | complete | 88 | 0.88 | 1 | 0.88 |
| **Σ** | — | — | — | **14** | **12.43** |

```
raw_kloe = 12.43 / 14 × 100 = 88.79
critical_gaps = 0   →   no cap
high_gaps = 0       →   no cap
S1 score = 89
```

**S1 = 89% (Outstanding).** Same questionnaire, same items, but the AI verdict on document quality drives a 54-point swing vs Example B.

### 7.4 Example D — Strong evidence except one critical missing

Clinic has Cura-quality everything *except* the safeguarding policy (`S1_EV01`) is still missing.

| Item | Status | AI score | Multiplier | Weight | Contribution |
|---|---|---|---|---|---|
| S1_EV01 | not_started | — (gap) | — | 3 | 0 |
| S1_EV02 | complete | 90 | 0.90 | 3 | 2.70 |
| S1_EV03 | complete | 88 | 0.88 | 3 | 2.64 |
| S1_EV04 | complete | 85 | 0.85 | 3 | 2.55 |
| S1_EV05 | complete | 90 | 0.90 | 1 | 0.90 |
| S1_EV06 | complete | 88 | 0.88 | 1 | 0.88 |
| **Σ** | — | — | — | **14** | **9.67** |

```
raw_kloe = 9.67 / 14 × 100 = 69.07
critical_gaps = 1   →   cap at 50   →   min(69, 50) = 50
high_gaps = 0       →   no cap
S1 score = 50
```

**S1 = 50% (Requires Improvement).** This is the cap in action. The raw evidence quality says "GOOD" (69%), but a missing critical item triggers the cap and the score floors at 50.

### 7.5 Example E — Critical present but expired

Clinic has all 6 items uploaded. AI scored everything 90+. But the safeguarding policy was uploaded 14 months ago and the auto-set review date passed last week, flipping `expiry_status` to `expired`.

| Item | Status | Expiry | Multiplier | Weight | Contribution |
|---|---|---|---|---|---|
| S1_EV01 | complete | **expired** | — (gate fails, treated as critical gap with `hasCriticalExpired = true`) | 3 | 0 |
| S1_EV02 | complete | valid | 0.90 | 3 | 2.70 |
| S1_EV03 | complete | valid | 0.88 | 3 | 2.64 |
| S1_EV04 | complete | n/a | 0.85 | 3 | 2.55 |
| S1_EV05 | complete | valid | 0.90 | 1 | 0.90 |
| S1_EV06 | complete | valid | 0.88 | 1 | 0.88 |
| **Σ** | — | — | — | **14** | **9.67** |

```
raw_kloe = 9.67 / 14 × 100 = 69.07
critical_gaps = 1, hasCriticalExpired = true   →   cap at 40   →   min(69, 40) = 40
S1 score = 40
```

**S1 = 40% (Requires Improvement, bordering Inadequate).** The expired-critical cap is harsher than the missing-critical cap (40 vs 50) — an expired policy is worse than a missing one because it implies the clinic *thinks* they're covered when they aren't.

### 7.6 Example F — Domain roll-up across 6 KLOEs

The Safe domain has 6 KLOEs (S1–S6) for an Aesthetic Clinic. After computing each:

| KLOE | Score |
|---|---|
| S1 — Safeguarding | 89 (Example C above) |
| S2 — Risk Assessment | 80 |
| S3 — Safe Information | 76 |
| S4 — Medicines | 50 (1 critical gap caps it) |
| S5 — IPC | 84 |
| S6 — Learning from Incidents | 72 |

```
domain_safe_score = mean(89, 80, 76, 50, 84, 72) = 75.17 → 75
```

But the rating limiter checks domain-level gap counts:

```
domain_safe_critical_gaps = 1  (the one in S4)
75 → GOOD threshold met (≥63) → but critical limiter applies → REQUIRES_IMPROVEMENT
```

**SAFE = 75% (Requires Improvement).** The score says GOOD; the rating says RI because of the open critical gap.

### 7.7 Example G — Overall rating across 5 domains

A small clinic ends up with:

| Domain | Score | Rating after limiters |
|---|---|---|
| SAFE | 75 | REQUIRES_IMPROVEMENT (due to S4 critical gap) |
| EFFECTIVE | 80 | GOOD |
| CARING | 85 | GOOD |
| RESPONSIVE | 78 | GOOD |
| WELL_LED | 82 | GOOD |

```
overall_score = mean(75, 80, 85, 78, 82) = 80
overall_rating:
    inadequate_count = 0
    ri_count = 1     →  not "≥2 RI"
    has_critical_gap = true   →   REQUIRES_IMPROVEMENT
```

**Overall = 80% (Requires Improvement).** Score says GOOD, but the open critical safeguarding gap caps the rating to RI per `hasCriticalGap` rule. Once the clinic resolves the S4 critical gap, the same scores would yield:

```
ri_count = 0 (S4 cap lifts → S4 score recalculates → SAFE rating becomes GOOD)
all 5 domains GOOD → overall rating GOOD
```

This is the single biggest lever a clinic has: resolving critical gaps is far more impactful than improving already-good scores.

---

## 8. Interpretation Layer

What does a number actually mean? This section translates every dial in the platform into plain English a clinic owner can understand.

### 8.1 Per-evidence `complianceScore`

| AI score | Meaning for the clinic |
|---|---|
| **90–100** | "Inspection-ready. This document would stand up to a CQC inspection without further work." |
| **70–89** | "Strong but improvable. A few minor gaps an inspector might query — typically missing local detail or a related artefact." |
| **50–69** | "Partially adequate. The document covers the topic but has material gaps. An inspector would expect to see remediation." |
| **30–49** | "Inadequate. Touches on the requirement but doesn't actually meet it. Replace, don't patch." |
| **0–29** | "Non-compliant. Wrong document, blank, expired, or generic boilerplate. Treated as missing for scoring." |

### 8.2 Per-KLOE / per-domain / overall percentage

| Score | Rating | What it means |
|---|---|---|
| **88–100** | **Outstanding** | Strong, mature compliance posture. All required evidence in place, current, organisation-specific, exceeds the gold standard in places. Inspection would likely confirm Outstanding. |
| **63–87** | **Good** | Inspection-ready with minor work. Required evidence largely in place; some items could be strengthened or refreshed. |
| **39–62** | **Requires Improvement** | Material gaps. Either critical evidence is missing/expired, or quality is too low across the board. An inspector would issue a notice. |
| **0–38** | **Inadequate** | Fundamental compliance failures. Likely fails registration. Multiple critical gaps and/or no real evidence library. |

### 8.3 Why the score and the rating sometimes disagree

This is the most common support question — "my score is 75% but my rating is RI?" Three reasons:

1. **A critical gap** anywhere in a domain caps the rating at RI even if the score is in GOOD territory (§6.3).
2. **A high gap** in an otherwise OUTSTANDING domain caps the rating at GOOD (§6.3).
3. **Two or more domains at RI** force the overall rating to RI even if their scores are 60+ (§6.4).

The rating is intentionally more conservative than the score. The score is a quality measure; the rating asks "would this pass inspection?". A clinic with a 92% score and one missing critical safeguarding policy would not pass inspection — hence rating RI.

### 8.4 Confidence

| Confidence | Meaning |
|---|---|
| **0.90–1.00** | "We have visibility into nearly your whole compliance picture. Score is trustworthy." |
| **0.60–0.89** | "We can see most of your evidence. Score is reliable but a few requirements are still unfilled." |
| **0.30–0.59** | "Half your evidence library is empty. The score reflects what we can see — it could move significantly as you upload more." |
| **0.00–0.29** | "Your evidence library is mostly empty. Treat the score as a starting point, not an inspection prediction." |

### 8.5 Time-to-Good

A signpost, not a deadline. Assumes the clinic can:

- Upload an existing-but-not-yet-uploaded policy in ~3 days
- Complete an outstanding training course in ~14 days
- Author a brand new procedure or run a new audit in ~30 days

Clinics with strong document libraries hit GOOD faster than the estimate; clinics that need to actually build their evidence from scratch take longer.

---

## 9. Code Traceability Table

Every formula in this document maps to specific code. If the code changes, this table tells you which section to update. If this doc changes, the table tells you which code to verify.

| Spec section | Concept | File | Function / lines |
|---|---|---|---|
| §2.1 | Source labels enum | `src/lib/constants/cqc-evidence-requirements.ts` | `EvidenceSourceLabel` (3-10) |
| §2.3 | Criticality weights | `src/lib/constants/cqc-evidence-requirements.ts` | `CRITICALITY_WEIGHT` (12-16) |
| §2.4 | Expiry types enum | `src/types/index.ts` | `ExpiryType` (24) |
| §2.4 | Expiry computation | `src/lib/services/evidence-status-service.ts` | `computeExpiryStatus` (14-38) |
| §3.3.1 | Presence gate | `src/lib/services/kloe-score-formula.ts` | `computeKloeScore` (116-127) |
| §3.3.2 | Quality multiplier | `src/lib/services/kloe-score-formula.ts` | `evidenceMultiplier` (42-50) |
| §3.4 | AI scoring guide | `src/lib/services/evidence-verification-service.ts` | `buildVerificationSystemPrompt` (183-202) |
| §4.1 | Auto-verify on upload | `src/app/api/evidence-files/route.ts` | POST handler |
| §4.1 | AI verification core | `src/lib/services/evidence-verification-service.ts` | `verifyEvidenceFile` (226-…) |
| §4.3 | Cura template injection | `src/lib/services/evidence-verification-service.ts` | `buildReferencePolicyBlock` (37-58) |
| §4.3 | Coverage states | `src/lib/services/policy-template-service.ts` | `PolicyTemplateWithCoverage` |
| §5.1 | KLOE score formula | `src/lib/services/kloe-score-formula.ts` | `computeKloeScore` (93-160) |
| §5.1 | Gap caps (50 / 40 / 60 / 70) | `src/lib/services/kloe-score-formula.ts` | (146-148) |
| §5.2 | Domain mean | `src/lib/services/score-engine.ts` | `recalculateComplianceScores` (653-658) |
| §5.2.1 | E3 service-type filtering | `src/lib/services/score-engine.ts` | (626-628) |
| §5.3 | Deprecated quality factor | `src/lib/services/score-engine.ts` | `calculateEvidenceQuality` (113-145) — **DEAD CODE** |
| §5.3 | Deprecated timeliness factor | `src/lib/services/score-engine.ts` | `calculateTimeliness` (191-244) — **DEAD CODE** |
| §5.4 | Confidence formula | `src/lib/services/score-engine.ts` | `calculateConfidence` (250-260) |
| §6.1 | Overall mean | `src/lib/services/score-engine.ts` | `calculateOverallScore` (386-390) |
| §6.2 | Score → rating thresholds | `src/lib/services/score-engine.ts` | `scoreToRating` (379-384) |
| §6.3 | Per-domain rating limiters | `src/lib/services/score-engine.ts` | (669-674) |
| §6.4 | Overall rating aggregation | `src/lib/services/score-engine.ts` | `determineOverallRating` (396-427) |
| §6.5 | Time-to-Good estimate | `src/lib/services/score-engine.ts` | `calculateTimeToGood` (433-460) |
| Schema | AI verification result | `src/lib/services/evidence-verification-service.ts` | `verificationResultSchema` (66-78) |
| Schema | KLOE evidence shape | `src/lib/constants/cqc-evidence-requirements.ts` | `KloeEvidenceItem` (18-28) |

---

## 10. Open Decisions / Deprecated Logic

### 10.1 Dead code: `calculateEvidenceQuality` and `calculateTimeliness`

Both functions live in `src/lib/services/score-engine.ts` but are no longer called by `recalculateComplianceScores`. They were the heart of the old questionnaire-driven model documented in `07-ASSESSMENT-ENGINE.md` §12.

**Recommendation:** delete in a follow-up cleanup PR. They are confusing future developers ("which of these two scoring models is real?") and contribute to the spec drift that triggered this rewrite.

### 10.2 Should the questionnaire contribute to the displayed score?

Currently zero. A clinic that has answered all 61 questions but uploaded no evidence sees 0% — which is correct for an inspection-readiness measure, but can be jarring as a first-impression number.

**Three options:**

| Option | Behaviour | Pros | Cons |
|---|---|---|---|
| **A** Status quo | Questionnaire = 0% contribution | Inspection-faithful; no false confidence | Day-1 number is always 0 |
| **B** Lazy hybrid | Show questionnaire score until evidence > 0; then evidence wins | Smoother first-day experience | Two scoring models user-side; explanation gets harder |
| **C** Explicit "claim" vs "verified" | Show two numbers: "Self-assessed: 80%, Verified: 12%" | Honest, defensible | Doubles the surface area; product/UX work needed |

No decision yet — flagged for the client to choose.

### 10.3 Per-domain weights (currently all 1.0)

CQC's published methodology weights all 5 domains equally for the overall rating, which the platform mirrors. There's a `DOMAIN_WEIGHTS` constant in the codebase that's currently `{1.0, 1.0, 1.0, 1.0, 1.0}` — kept as a hook in case CQC's methodology shifts (e.g. if they start weighting Safe more heavily for clinical services).

### 10.4 Activity-based item thresholds

Most activity-based items (cleaning, fridge temp, hand hygiene) use `activityThresholdDays: 7`. A few use longer windows. This is currently per-item in `cqc-evidence-requirements.ts` — there is no global tuning knob. Consider exposing a per-clinic override if customers ask (e.g. specialist clinics with weekly-rather-than-daily logs).

### 10.5 The 0.7 baseline for unscanned documents

A document that exists but has not yet been AI-verified (legacy uploads, or fresh uploads where AI hasn't completed) gets a 0.7 multiplier. This is a deliberate "trust but verify" floor — 0.0 would unfairly punish historical uploads, 1.0 would credit unverified work.

If the AI verification queue ever falls behind significantly, consider a "Stale" indicator next to items at 0.7 to signal the score will move once verification catches up.

---

## Document maintenance

This file should be updated whenever:

1. The presence gate logic in `kloe-score-formula.ts` changes
2. The criticality weights in `cqc-evidence-requirements.ts` change
3. The cap thresholds (40 / 50 / 60 / 70) change
4. The rating thresholds (39 / 63 / 88) change
5. New source labels or expiry types are added
6. The overall rating aggregation rules change

The traceability table in §9 is the canonical map. If a code change touches a row in that table, this document must be reviewed in the same PR.

---

> **End of file.** Questions, corrections, and challenges to any formula are welcome — the goal of this document is to be defensible in front of a CQC inspector. If a number can't be reconstructed from this doc + a calculator, the doc has failed.
