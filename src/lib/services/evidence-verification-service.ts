// =============================================================================
// Evidence Verification Service — AI-powered CQC evidence validation.
//
// This is the reusable core of the verification pipeline, callable from:
//   - `/api/evidence/verify` (manual user-triggered scan)
//   - `/api/evidence-files` POST (auto-triggered on upload, fire-and-forget)
//
// Keeps the route handlers thin and guarantees identical behaviour
// regardless of which path triggered the scan.
// =============================================================================

import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { extractText, isImageType } from '@/lib/services/document-extractor';
import {
  getKloeDefinition,
  getEvidenceItems,
} from '@/lib/constants/cqc-evidence-requirements';
import type { ServiceType } from '@/lib/constants/assessment-questions';
import { getTemplatesForEvidenceItem, type PolicyTemplateWithCoverage } from '@/lib/services/policy-template-service';

// Per-template character cap when including Cura policy content as RAG context.
const RAG_PER_TEMPLATE_MAX_CHARS = 6_000;
// Overall cap across all injected reference templates (avoids blowing Claude's
// context window when an evidence item maps to 3+ long policies).
const RAG_TOTAL_MAX_CHARS = 18_000;

/**
 * Build a reference-policy block from Cura's authoritative templates mapped
 * to this evidence item. Claude uses this to compare the uploaded document
 * against the "gold standard" — this turns generic LLM judgement into
 * grounded, deterministic scoring.
 */
function buildReferencePolicyBlock(templates: PolicyTemplateWithCoverage[]): string {
  if (templates.length === 0) return '';

  let remaining = RAG_TOTAL_MAX_CHARS;
  const parts: string[] = [];
  for (const t of templates) {
    if (remaining <= 0) break;
    const truncLimit = Math.min(RAG_PER_TEMPLATE_MAX_CHARS, remaining);
    const body = t.contentText.length > truncLimit
      ? `${t.contentText.slice(0, truncLimit)}\n[…truncated for length]`
      : t.contentText;
    const coverageLabel =
      t.coverageStatus === 'covered' ? 'Covered — directly addresses this requirement'
      : t.coverageStatus === 'partial' ? `Partial — ${t.coverageNotes ?? 'policy exists but may lack a form/log/template'}`
      : 'Covered via Consentz — policy defines the approach; live evidence comes from the Consentz EHR';
    parts.push(
      `--- REFERENCE POLICY: ${t.code} · ${t.title} (${coverageLabel}) ---\n${body}`,
    );
    remaining -= body.length + 120;
  }
  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Schema for the structured AI response
// ---------------------------------------------------------------------------

export const verificationResultSchema = z.object({
  isCompliant: z.boolean().describe('Whether the document meets the CQC requirement'),
  confidenceScore: z.number().min(0).max(100).describe('Confidence in the assessment (0-100)'),
  complianceScore: z.number().min(0).max(100).describe('How well the document meets the requirement (0-100)'),
  summary: z.string().describe('A concise 1-2 sentence summary of the verification result'),
  findings: z.array(z.object({
    criterion: z.string().describe('The specific CQC criterion being checked'),
    met: z.boolean().describe('Whether this criterion was met'),
    detail: z.string().describe('Explanation of how/why the criterion was or was not met'),
  })).describe('Detailed findings for each criterion checked'),
  missingElements: z.array(z.string()).describe('List of key elements missing from the document'),
  recommendations: z.array(z.string()).describe('Suggestions for improving the document'),
  documentType: z.string().describe('The detected type/nature of the document'),
  dateRelevance: z.enum(['current', 'outdated', 'undated', 'not_applicable']).describe('Whether the document appears current or outdated'),
});

export type VerificationResult = z.infer<typeof verificationResultSchema>;

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface VerifyEvidenceFileParams {
  organizationId: string;
  evidenceItemId?: string;
  fileVersionId?: string;
  evidenceId?: string;
  kloeCode: string;
  evidenceRequirementId: string;
  /**
   * User-declared document type (e.g. "policy", "training record"). When
   * omitted (e.g. auto-verify on upload), we fall back to the requirement's
   * sourceLabel so Claude still has a meaningful category hint.
   */
  documentCategory?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export interface VerifyEvidenceFileResult {
  verificationStatus: 'verified' | 'rejected' | 'error';
  result: VerificationResult | { error: string };
  evidenceRequirementId: string;
  kloeCode: string;
}

// ---------------------------------------------------------------------------
// System prompt builder (extracted from the original route)
// ---------------------------------------------------------------------------

function buildVerificationSystemPrompt(
  kloeTitle: string,
  kloeKeyQuestion: string,
  kloeDescription: string,
  requirementDescription: string,
  documentCategory: string,
  regulations: string[],
  serviceType: string,
  referencePolicyBlock: string,
): string {
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const serviceLabel = serviceType === 'AESTHETIC_CLINIC' ? 'aesthetic clinic' : 'care home';

  return `You are a senior UK CQC (Care Quality Commission) compliance auditor with 20+ years of inspection experience. You are conducting a desk-based evidence review for a ${serviceLabel}.

Today's date: ${today}

=== YOUR TASK ===

You must verify whether an uploaded document genuinely satisfies a specific CQC evidence requirement. You are NOT checking whether the document looks professional — you are checking whether it contains the SUBSTANCE required by the CQC framework.

=== CONTEXT ===

KLOE: ${kloeTitle}
Key Question: ${kloeKeyQuestion}
KLOE Description: ${kloeDescription}
Linked CQC Regulations: ${regulations.join(', ')}

SPECIFIC REQUIREMENT BEING VERIFIED:
"${requirementDescription}"

DOCUMENT CATEGORY DECLARED BY USER: ${documentCategory}

=== CQC REGULATORY FRAMEWORK ===

You have deep knowledge of:
1. Health and Social Care Act 2008 (Regulated Activities) Regulations 2014
2. CQC Fundamental Standards (Regulations 4-20A)
3. CQC Five Key Questions: Safe, Effective, Caring, Responsive, Well-Led
4. Key Lines of Enquiry (KLOEs) and Quality Statements
5. The Mental Capacity Act 2005
6. The Equality Act 2010
7. UK GDPR and Data Protection Act 2018
8. NICE guidelines relevant to the service type
9. Professional body standards (NMC, GMC, HCPC, etc.)
10. NHS Records Management Code of Practice

=== VERIFICATION CRITERIA ===

For each document, assess:

1. RELEVANCE: Does this document actually relate to the stated requirement? A fire safety certificate cannot satisfy a safeguarding training requirement, regardless of quality.

2. CONTENT ADEQUACY: Does the document contain the specific information, procedures, records, or evidence that a CQC inspector would expect to see for this requirement?

3. CURRENCY: Is the document dated? Is it current or expired? For policies, are review dates within acceptable ranges (typically 12 months)? For training records, are they within their validity period?

4. SPECIFICITY: Does the document show organisation-specific content (not just generic templates)? CQC inspectors specifically look for evidence of personalisation and local context.

5. REGULATORY ALIGNMENT: Does the document reference or align with the relevant regulations, standards, and guidance?

6. COMPLETENESS: Does the document cover all key elements expected for this type of evidence? For example, a safeguarding policy must include reporting procedures, designated lead details, training requirements, etc.

7. ACTIONABILITY: For operational documents (procedures, protocols), are the instructions clear, step-by-step, and actionable?

=== SCORING GUIDE ===

- 90-100: Excellent — fully meets the requirement, comprehensive, current, well-structured
- 70-89: Good — meets the core requirement but has minor gaps or could be strengthened
- 50-69: Partially meets — covers some elements but has significant gaps that would be noted in inspection
- 30-49: Inadequate — touches on the topic but fundamentally fails to meet the requirement
- 0-29: Non-compliant — document is irrelevant, expired, generic template, or unreadable

=== CRITICAL RULES ===

- Be STRICT. This is compliance auditing, not creative writing feedback.
- A blank, corrupted, or unreadable document scores 0.
- A completely irrelevant document (e.g. a menu uploaded as a safeguarding policy) scores 0.
- Generic templates without organisation-specific details should score no higher than 40.
- Expired documents (review date passed) should be flagged and capped at 50.
- Missing dates should reduce confidence and cap score at 60.
- Be specific in your findings — reference exact content (or lack thereof) from the document.
- Never fabricate document content. Only reference what you can actually see in the text.
- If the document is an image and no text was extracted, state this clearly and score based on what is visible.
- If the document appears to be in a foreign language, note this and score appropriately.${
    referencePolicyBlock
      ? `

=== AUTHORITATIVE REFERENCE POLICIES ===

The following is the clinic's authoritative policy template library (the "Cura manual"). These templates are the CQC-aligned gold standard that the clinic SHOULD be using for this requirement. Use them as your benchmark:

- If the uploaded document is a faithful adoption (or equivalent) of these reference policies, score it HIGH (80-100).
- If the uploaded document covers the same topic but MISSES key sections present in the reference, call out exactly which sections are missing and score proportionally.
- If the uploaded document contradicts or substantially diverges from the reference, flag this clearly in findings and score LOW.
- Do NOT penalise the clinic for making minor local adaptations (names, contact details, scheduling) — those are expected.
- If the reference is flagged as "Partial — <note>", factor the missing element (e.g. log template) into your missingElements output.
- If the reference is flagged as "Covered via Consentz", the expected evidence is operational data from the Consentz EHR; a written policy alone should score modestly (60-75) because the actual records live elsewhere.

${referencePolicyBlock}`
      : ''
  }`;
}

// ---------------------------------------------------------------------------
// The main service function
// ---------------------------------------------------------------------------

export async function verifyEvidenceFile(
  params: VerifyEvidenceFileParams,
): Promise<VerifyEvidenceFileResult> {
  const {
    organizationId,
    evidenceItemId: _evidenceItemId,
    fileVersionId,
    evidenceId,
    kloeCode,
    evidenceRequirementId,
    documentCategory: providedCategory,
    fileName,
    fileUrl,
    fileType,
  } = params;

  const client = await getDb();

  // --- Resolve organisation & service type ---
  const { data: org } = await client
    .from('organizations')
    .select('service_type')
    .eq('id', organizationId)
    .maybeSingle();
  const serviceType = (org?.service_type ?? 'AESTHETIC_CLINIC') as ServiceType;

  // --- Look up the KLOE definition and evidence requirement ---
  const kloeDef = getKloeDefinition(serviceType, kloeCode);
  if (!kloeDef) {
    throw new Error(`Unknown KLOE code: ${kloeCode}`);
  }
  const evidenceItems = getEvidenceItems(serviceType, kloeCode);
  const requirement = evidenceItems.find((item) => item.id === evidenceRequirementId);
  if (!requirement) {
    throw new Error(`Unknown evidence requirement: ${evidenceRequirementId}`);
  }

  // Resolve document category: prefer the user-declared one (manual verify),
  // else fall back to the requirement's sourceLabel (auto-verify on upload).
  const documentCategory = providedCategory && providedCategory.trim().length > 0
    ? providedCategory
    : (requirement.sourceLabel ?? 'Evidence document');

  // --- Mark as pending ---
  if (fileVersionId) {
    await client
      .from('evidence_file_versions')
      .update({ verification_status: 'pending' })
      .eq('id', fileVersionId);
  }
  if (evidenceId) {
    await client
      .from('evidence_items')
      .update({ verification_status: 'pending' })
      .eq('id', evidenceId);
  }

  // --- Download the file and extract text / image bytes ---
  let extractedText = '';
  let isImage = false;
  let imageBase64: string | undefined;

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`Failed to download file: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (isImageType(fileType)) {
      isImage = true;
      imageBase64 = buffer.toString('base64');
    } else {
      const extraction = await extractText(buffer, fileType, fileName);
      extractedText = extraction.text;
      if (!extractedText || extractedText.length < 10) {
        extractedText = `[Document could not be parsed. File name: ${fileName}, Type: ${fileType}]`;
      }
    }
  } catch (err) {
    console.error('[verifyEvidenceFile] File download/extraction failed:', err);
    extractedText = `[Failed to extract text from document. File name: ${fileName}, Type: ${fileType}]`;
  }

  // --- Load Cura reference policies for RAG (non-fatal if it fails) ---
  let referenceTemplates: PolicyTemplateWithCoverage[] = [];
  try {
    referenceTemplates = await getTemplatesForEvidenceItem(evidenceRequirementId);
  } catch (err) {
    console.warn('[verifyEvidenceFile] reference policy lookup failed, proceeding without RAG:', err);
  }
  const referencePolicyBlock = buildReferencePolicyBlock(referenceTemplates);

  // --- Build prompts ---
  const systemPrompt = buildVerificationSystemPrompt(
    kloeDef.title,
    kloeDef.keyQuestion,
    kloeDef.description,
    requirement.description,
    documentCategory,
    kloeDef.regulations,
    serviceType,
    referencePolicyBlock,
  );

  const userParts: Array<{ type: 'text'; text: string } | { type: 'image'; image: string; mimeType: string }> = [];
  if (isImage && imageBase64) {
    userParts.push({ type: 'image', image: imageBase64, mimeType: fileType });
    userParts.push({
      type: 'text',
      text: `Please verify this image document "${fileName}" (type: ${documentCategory}) against the requirement: "${requirement.description}". Analyse what you can see in the image and provide your verification.`,
    });
  } else {
    userParts.push({
      type: 'text',
      text: `Please verify the following document against the CQC evidence requirement.

Document name: ${fileName}
Document category: ${documentCategory}
File type: ${fileType}
Requirement: "${requirement.description}"
Criticality: ${requirement.criticality}

--- DOCUMENT CONTENT START ---
${extractedText}
--- DOCUMENT CONTENT END ---

Verify this document and provide your structured assessment.`,
    });
  }

  // --- Call Claude ---
  try {
    const { object: result } = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: verificationResultSchema,
      system: systemPrompt,
      messages: [{ role: 'user', content: userParts as any }],
      temperature: 0.1,
    });

    const verificationStatus: 'verified' | 'rejected' =
      result.isCompliant && result.complianceScore >= 50 ? 'verified' : 'rejected';

    const persistPayload = {
      verification_status: verificationStatus,
      verification_result: result,
    };

    if (fileVersionId) {
      await client.from('evidence_file_versions').update(persistPayload).eq('id', fileVersionId);
    }
    if (evidenceId) {
      await client.from('evidence_items').update(persistPayload).eq('id', evidenceId);
    }

    return { verificationStatus, result, evidenceRequirementId, kloeCode };
  } catch (err) {
    console.error('[verifyEvidenceFile] AI verification failed:', err);
    const errorPayload = {
      verification_status: 'error' as const,
      verification_result: { error: 'AI verification failed. Please try again.' },
    };
    if (fileVersionId) {
      await client.from('evidence_file_versions').update(errorPayload).eq('id', fileVersionId);
    }
    if (evidenceId) {
      await client.from('evidence_items').update(errorPayload).eq('id', evidenceId);
    }
    return {
      verificationStatus: 'error',
      result: { error: 'AI verification failed. Please try again.' },
      evidenceRequirementId,
      kloeCode,
    };
  }
}
