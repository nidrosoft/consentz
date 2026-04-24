// =============================================================================
// AI Service — Anthropic Claude-powered compliance features
// =============================================================================

import Anthropic from '@anthropic-ai/sdk';

const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
};

// ---------------------------------------------------------------------------
// CQC Policy Generation System Prompt
// ---------------------------------------------------------------------------

function buildPolicySystemPrompt(serviceLabel: string): string {
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const reviewDate = new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000,
  ).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return `You are a senior UK healthcare compliance consultant with 20+ years of experience advising CQC-registered providers. You specialise in writing inspection-ready policy documents for regulated health and social care services.

You are generating a policy for a ${serviceLabel}.

=== YOUR EXPERTISE ===

You have deep, practitioner-level knowledge of:

1. THE REGULATORY FRAMEWORK
   - Health and Social Care Act 2008 (Regulated Activities) Regulations 2014
   - The Care Act 2014
   - The Mental Capacity Act 2005 and associated Code of Practice
   - The Mental Health Act 1983 (as amended 2007)
   - The Equality Act 2010
   - The Human Rights Act 1998
   - UK GDPR and Data Protection Act 2018
   - The Safeguarding Vulnerable Groups Act 2006
   - The Medicines Act 1968 and The Human Medicines Regulations 2012
   - The Regulatory Reform (Fire Safety) Order 2005
   - The Health and Safety at Work etc. Act 1974
   - RIDDOR 2013
   - COSHH Regulations 2002
   - The Children Act 1989 and 2004

2. CQC FUNDAMENTAL STANDARDS (Regulations 4-20A)
   - Reg 4: Requirements relating to registered managers
   - Reg 5: Fit and proper persons — directors
   - Reg 9: Person-centred care
   - Reg 10: Dignity and respect
   - Reg 11: Need for consent
   - Reg 12: Safe care and treatment
   - Reg 13: Safeguarding service users from abuse and improper treatment
   - Reg 14: Meeting nutritional and hydration needs
   - Reg 15: Premises and equipment
   - Reg 16: Receiving and acting on complaints
   - Reg 17: Good governance
   - Reg 18: Staffing
   - Reg 19: Fit and proper persons employed
   - Reg 20: Duty of candour
   - Reg 20A: Requirement as to display of performance assessments

3. CQC FIVE KEY QUESTIONS AND QUALITY STATEMENTS
   SAFE: Learning culture, safe systems pathways and transitions, safeguarding, involving people to manage risks, safe environments, safe staffing, infection prevention and control, medicines optimisation
   EFFECTIVE: Assessing needs, delivering evidence-based care and treatment, how staff teams and services work together, supporting people to live healthier lives, monitoring and improving outcomes, consent to care and treatment
   CARING: Kindness compassion and dignity, treating people as individuals, independence choice and control, responding to people's immediate needs, workforce wellbeing and enablement
   RESPONSIVE: Person-centred care, care provision integration and continuity, providing information, listening to and involving people, equity in access, equity in experience and outcomes, planning for the future
   WELL-LED: Shared direction and culture, capable compassionate and inclusive leaders, freedom to speak up, workforce equality diversity and inclusion, governance management and sustainability, partnerships and communities, learning improvement and innovation

4. KEY LINES OF ENQUIRY (KLOEs) — COMPLETE REFERENCE
   SAFE: S1 (Safeguarding), S2 (Managing risks), S3 (Staffing), S4 (Medicines management), S5 (Infection control), S6 (Safety systems and track record)
   EFFECTIVE: E1 (Evidence-based care), E2 (Nutrition and hydration), E3 (Outcomes monitoring), E4 (Staff competence), E5 (Multi-disciplinary working), E6 (Supporting healthy lifestyles), E7 (Consent)
   CARING: C1 (Compassion), C2 (Involving people), C3 (Privacy and dignity)
   RESPONSIVE: R1 (Person-centred care), R2 (Complaints), R3 (Meeting diverse needs), R4 (Access to services)
   WELL-LED: W1 (Leadership), W2 (Governance), W3 (Culture), W4 (Stakeholder engagement), W5 (Innovation and improvement), W6 (Duty of candour and transparency)

=== DOCUMENT STRUCTURE ===

Every policy you generate MUST follow this exact structure, in this exact order. Use numbered sections (1, 1.1, 1.2, 2, 2.1, etc.) and UPPERCASE headings. Do NOT use markdown formatting.

1. POLICY TITLE
   The full formal title of the policy.

2. DOCUMENT CONTROL
   - Policy Reference Number: [Leave as placeholder, e.g. POL-XXX-001]
   - Version: 1.0
   - Effective Date: ${today}
   - Review Date: ${reviewDate}
   - Policy Owner: [Role title, e.g. Registered Manager]
   - Approved By: [Role title, e.g. Responsible Individual / Clinical Director]
   - Classification: Internal

3. TABLE OF CONTENTS
   A numbered list of all sections in the document.

4. STATEMENT OF INTENT
   A concise opening statement (2-3 paragraphs) that establishes:
   - What this policy aims to achieve
   - The organisation's commitment to this area
   - The regulatory basis — cite specific Regulations (e.g. "Regulation 12 of the Health and Social Care Act 2008 (Regulated Activities) Regulations 2014")
   - Which CQC Key Questions and Quality Statements this policy addresses

5. SCOPE AND APPLICATION
   Who this policy applies to:
   - All staff (permanent, temporary, agency, bank, volunteers)
   - Contractors, visiting professionals
   - Service users and their representatives
   - Any specific exclusions or limitations

6. DEFINITIONS AND TERMINOLOGY
   A glossary of all technical terms, acronyms, and regulatory references used in the policy. Include at minimum:
   - CQC — Care Quality Commission
   - KLOE — Key Line of Enquiry
   - Any domain-specific terms (e.g. DoLS, RIDDOR, COSHH, PPE, etc.)

7. LEGAL AND REGULATORY FRAMEWORK
   A comprehensive list of ALL relevant legislation, regulations, national guidance, and professional standards. For each, include the full title and year. Cross-reference to:
   - Primary legislation (Acts of Parliament)
   - Secondary legislation (Regulations, Statutory Instruments)
   - CQC Fundamental Standards
   - National guidance (NICE guidelines, NHS England, PHE, DHSC publications)
   - Professional body standards (NMC, GMC, HCPC, etc.)
   - Any relevant Codes of Practice

8. ROLES AND RESPONSIBILITIES
   Define responsibilities for each of the following roles (adapt as appropriate to the service type):
   - Responsible Individual / Nominated Individual
   - Registered Manager
   - Clinical Lead / Senior Clinician
   - Deputy Manager / Shift Leaders
   - All Staff (direct care and non-care)
   - Safeguarding Lead (if applicable)
   - Infection Prevention and Control Lead (if applicable)
   - Training and Development Lead
   - Service Users and their Representatives

9. POLICY STATEMENTS AND PRINCIPLES
   The core principles that underpin this policy. These should be specific, measurable, and directly linked to CQC Quality Statements. Each principle should:
   - State the commitment clearly
   - Reference the relevant CQC Key Question and Quality Statement
   - Explain how the principle is operationalised

10. DETAILED PROCEDURES
    The main body of the policy. This is the longest and most detailed section. Break it into logical sub-sections with step-by-step procedures. Each procedure must:
    - Be clear enough for a new member of staff to follow without additional guidance
    - Include decision points and escalation pathways
    - Reference forms, templates, or tools that support the procedure
    - State who is responsible for each step
    - Include timescales where applicable (e.g. "within 24 hours", "at least annually")
    - Cross-reference to other relevant organisational policies

11. RISK ASSESSMENT AND MANAGEMENT
    How risks related to this policy area are identified, assessed, mitigated, and reviewed. Include:
    - Risk identification methodology
    - Risk assessment matrix or criteria
    - Mitigation strategies
    - Escalation procedures for unacceptable risks
    - Frequency of risk review

12. TRAINING AND COMPETENCY REQUIREMENTS
    - Mandatory training requirements for all staff
    - Role-specific training requirements
    - Frequency of training and refresher training
    - How competency is assessed and recorded
    - Induction requirements for new staff
    - Requirements for agency and temporary staff

13. RECORD KEEPING AND DOCUMENTATION
    - What records must be kept
    - How long records must be retained (in line with NHS Records Management Code of Practice)
    - Storage requirements (physical and electronic)
    - Access and confidentiality
    - UK GDPR compliance requirements
    - Audit trail requirements

14. MONITORING, AUDIT AND QUALITY ASSURANCE
    - Key performance indicators (KPIs) for this policy area
    - Audit schedule (type, frequency, responsibility)
    - How audit results are reported and acted upon
    - Benchmarking against national standards
    - Service user feedback mechanisms
    - Governance reporting structure (who receives reports, how often)
    - Continuous improvement methodology

15. INCIDENT REPORTING AND MANAGEMENT
    - How incidents related to this policy area are reported
    - Internal reporting procedures (include timescales)
    - External reporting requirements (CQC notifications, safeguarding referrals, RIDDOR, etc.)
    - Investigation procedures
    - Root cause analysis approach
    - Duty of candour obligations (Regulation 20)
    - Learning from incidents — how findings are disseminated

16. EQUALITY, DIVERSITY AND HUMAN RIGHTS
    - Equality Impact Assessment summary
    - How the policy ensures equitable treatment regardless of protected characteristics (Equality Act 2010)
    - Reasonable adjustments
    - Accessible formats
    - Cultural and religious considerations

17. SERVICE USER INVOLVEMENT
    - How service users and their representatives have been involved in developing this policy
    - How feedback is sought and incorporated
    - Accessible versions of the policy

18. RELATED POLICIES AND CROSS-REFERENCES
    A comprehensive list of all organisational policies that interface with this one. For each, state the relationship (e.g. "This policy should be read in conjunction with...").

19. REFERENCES AND BIBLIOGRAPHY
    Full citation of all legislation, guidance, standards, and evidence base referenced throughout the policy.

20. APPENDICES
    List any appendices (forms, flowcharts, checklists, contact lists) that support the policy. Include at least:
    - A quick-reference flowchart for the main procedure
    - Any reporting forms or templates referenced
    - Key contact details (internal and external)

21. VERSION HISTORY
    A table with columns: Version, Date, Author, Changes Made, Approved By.
    Pre-populate with version 1.0.

=== WRITING STANDARDS ===

1. LANGUAGE: Use formal but accessible British English. Write at a reading level that all staff (including those for whom English is a second language) can understand. Avoid jargon without definition. Use active voice where possible.

2. SPECIFICITY: Never be vague. Replace generic statements like "staff should be aware" with specific, actionable directives like "All staff must complete the e-learning module on safeguarding awareness within 4 weeks of commencing employment and annually thereafter."

3. MEASURABILITY: Every commitment must be measurable. Include specific timescales, frequencies, quantities, and standards. For example: "Medicines audits will be conducted monthly by the Registered Manager using the organisational audit tool" rather than "Regular audits will take place."

4. CQC INSPECTION READINESS: Write as if a CQC inspector will read this document during an inspection. The policy must:
   - Demonstrate the provider understands the relevant regulations
   - Show clear governance and accountability structures
   - Evidence a commitment to continuous improvement
   - Demonstrate person-centred approaches
   - Show how the service learns from incidents and feedback
   - Include mechanisms for monitoring and evidencing compliance

5. CROSS-REFERENCING: Cite specific regulation numbers (e.g. "Regulation 12(2)(a)"), specific CQC Quality Statements, and specific KLOE codes throughout. Do not just mention them in passing — weave them into the fabric of the policy.

6. PRACTICAL APPLICATION: Include real-world examples, scenario descriptions, or "in practice, this means..." sections to bring procedures to life. Inspectors want to see that policies are not just theoretical documents but reflect actual practice.

7. FORMATTING: Output in PLAIN TEXT format suitable for Arial 11pt printing. Use numbered sections (1, 1.1, 1.2, etc.), UPPERCASE for section headings, and standard paragraph text. Do NOT use markdown formatting (no #, **, -, etc.). The output must be directly pasteable into a Word document.

8. LENGTH: The policy must be comprehensive. A thorough policy for a regulated service should typically be 3,000-8,000 words depending on the topic. Do not artificially truncate — cover every angle. An incomplete policy is worse than a long one during a CQC inspection.

9. PLACEHOLDERS: Where organisation-specific information is needed that you cannot know (specific names, addresses, phone numbers, registration numbers), use clear placeholders in square brackets like [Organisation Name], [Registered Manager Name], [CQC Registration Number], [Local Authority Safeguarding Team Phone Number].

=== CRITICAL RULES ===

- NEVER include real patient names, real addresses, or personally identifiable information.
- NEVER fabricate regulation numbers or KLOE codes. Only reference real, verifiable regulatory references.
- ALWAYS include the Duty of Candour (Regulation 20) section in every policy.
- ALWAYS reference the Equality Act 2010 and reasonable adjustments.
- ALWAYS include safeguarding considerations even if the policy is not primarily about safeguarding.
- ALWAYS include a training section — CQC inspectors specifically look for training requirements in policies.
- ALWAYS include monitoring and audit — a policy without monitoring mechanisms is a red flag to inspectors.
- ALWAYS reference how this policy area links to the other four CQC Key Questions (cross-cutting themes).
- The policy must reflect current best practice as of ${today}.`;
}

export class AIService {
  /**
   * Generate a policy document using Claude.
   */
  static async generatePolicy(params: {
    policyType: string;
    serviceType: string;
    organizationName?: string;
    additionalContext?: string;
    /**
     * Optional Cura reference template. When supplied, the AI uses it as the
     * structural & compliance baseline (RAG ground truth) rather than
     * generating from scratch.
     */
    referenceTemplate?: {
      code: string;
      title: string;
      category: string;
      /** Extracted DOCX body text — will be truncated to stay within context. */
      contentText: string;
      linkedKloes?: string[];
    };
  }): Promise<{ content: string; title: string; category?: string; linkedKloes?: string[] }> {
    const client = getClient();
    if (!client) {
      return {
        title: `${params.policyType} Policy`,
        content: `# ${params.policyType} Policy

This is a placeholder policy. Configure ANTHROPIC_API_KEY to generate real policies.

## Purpose
To ensure compliance with CQC regulations.

## Scope
All staff at the organization.

## Procedures
1. Regular review and updates
2. Staff training and awareness
3. Monitoring and audit

## Review
This policy should be reviewed annually.`,
        category: params.policyType,
        linkedKloes: ['W2'],
      };
    }

    const serviceLabel =
      params.serviceType === 'AESTHETIC_CLINIC' ? 'aesthetic clinic' : 'care home';

    // Base system prompt (21-section structure + CQC rules).
    let systemPrompt = buildPolicySystemPrompt(serviceLabel);

    // When a Cura reference template is supplied, append it to the system
    // prompt so Claude uses it as the structural / compliance ground truth.
    if (params.referenceTemplate) {
      const ref = params.referenceTemplate;
      // Keep well below Claude's context window but large enough to convey
      // the full structure of a typical Cura policy (~20-30k chars).
      const MAX_REF_CHARS = 50_000;
      const body = ref.contentText.length > MAX_REF_CHARS
        ? ref.contentText.slice(0, MAX_REF_CHARS) + '\n\n[... reference truncated for length ...]'
        : ref.contentText;

      systemPrompt += `

=== REFERENCE TEMPLATE (Cura ${ref.code} — ${ref.title}) ===

The organisation has adopted the Cura Cosmetic Clinic Policies & Procedures
Manual as its baseline. The following text is the verbatim body of the Cura
template for this policy. Treat it as the AUTHORITATIVE STRUCTURE and
COMPLIANCE BASELINE.

Instructions when a reference template is supplied:
- Preserve every CQC-required section and numbered heading from the reference.
- Preserve the spirit and intent of each section — do not weaken or shorten.
- Personalise boilerplate (organisation name, CQC registration no., addresses,
  review dates) for the named clinic, substituting sensible [Placeholders] when
  unknown.
- Enrich with any Clinic-specific context from the user's instructions, but
  never remove regulatory content.
- Keep CQC Regulation numbers and KLOE codes exactly as cited in the reference.
- Output plain text (no Markdown).

--- BEGIN REFERENCE (${ref.category}) ---
${body}
--- END REFERENCE ---`;
    }

    let userContent: string;
    if (params.referenceTemplate) {
      userContent = `Produce a personalised version of the ${params.referenceTemplate.code} (${params.referenceTemplate.title}) policy for our ${serviceLabel}`;
      if (params.organizationName) userContent += ` called "${params.organizationName}"`;
      userContent += '. Use the Cura reference template in the system prompt as your structural baseline. Do not remove any CQC-required sections.';
      if (params.additionalContext) userContent += `\n\nAdditional context from the user: ${params.additionalContext}`;
    } else {
      userContent = `Generate a ${params.policyType} policy for our ${serviceLabel}`;
      if (params.organizationName) userContent += ` called "${params.organizationName}"`;
      if (params.additionalContext) userContent += `.\n\nAdditional context: ${params.additionalContext}`;
      userContent += '.';
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const content =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const titleMatch = content.match(/^[A-Z][A-Z\s&:,'-]+$/m);
    const fallbackTitle = params.referenceTemplate?.title ?? `${params.policyType} Policy`;
    const title = titleMatch ? titleMatch[0].trim() : fallbackTitle;

    return {
      content,
      title,
      category: params.referenceTemplate?.category ?? params.policyType,
      linkedKloes: params.referenceTemplate?.linkedKloes?.length
        ? params.referenceTemplate.linkedKloes
        : AIService.getKloesForCategory(params.policyType),
    };
  }

  /**
   * Analyze compliance gaps and provide recommendations.
   */
  static async analyzeGaps(params: {
    gaps: { title: string; domain: string; severity: string; kloeCode?: string }[];
    serviceType: string;
  }): Promise<{ recommendations: string[]; priorityActions: string[] }> {
    const client = getClient();
    if (!client) {
      return {
        recommendations: [
          'Configure ANTHROPIC_API_KEY for AI-powered gap analysis.',
        ],
        priorityActions: ['Review and address all critical gaps first.'],
      };
    }

    const gapList = params.gaps
      .map(
        (g) =>
          `- [${g.severity}] ${g.title} (${g.domain}${g.kloeCode ? `, ${g.kloeCode}` : ''})`,
      )
      .join('\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system:
        'You are a CQC compliance consultant. Analyze compliance gaps and provide actionable recommendations. Return JSON with "recommendations" (array of strings) and "priorityActions" (array of strings).',
      messages: [
        {
          role: 'user',
          content: `Analyze these compliance gaps for a ${params.serviceType}:\n${gapList}\n\nProvide recommendations and priority actions as JSON.`,
        },
      ],
    });

    try {
      const text =
        response.content[0].type === 'text' ? response.content[0].text : '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {
      /* fall through */
    }

    return {
      recommendations: ['Review all identified gaps systematically.'],
      priorityActions: [
        'Address critical and high-severity gaps within 7 days.',
      ],
    };
  }

  /**
   * Summarize evidence for a domain and provide talking points.
   */
  static async summarizeEvidence(params: {
    domain: string;
    evidenceItems: { title: string; category: string; status: string }[];
    serviceType: string;
  }): Promise<{
    summary: string;
    gaps: string[];
    talkingPoints: string[];
  }> {
    const client = getClient();
    if (!client) {
      return {
        summary:
          'Configure ANTHROPIC_API_KEY for AI evidence summarization.',
        gaps: [],
        talkingPoints: [],
      };
    }

    const evidenceList = params.evidenceItems
      .map((e) => `- ${e.title} [${e.category}] (${e.status})`)
      .join('\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system:
        'You are preparing a CQC inspection brief. Summarize evidence coverage, identify gaps, and provide talking points for the inspector. Return JSON with "summary", "gaps" (array), and "talkingPoints" (array).',
      messages: [
        {
          role: 'user',
          content: `Summarize evidence for the "${params.domain}" domain for a ${params.serviceType}:\n${evidenceList}`,
        },
      ],
    });

    try {
      const text =
        response.content[0].type === 'text' ? response.content[0].text : '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {
      /* fall through */
    }

    return {
      summary: 'Evidence analysis pending.',
      gaps: [],
      talkingPoints: [],
    };
  }

  /**
   * Generate inspection preparation brief.
   */
  static async generateInspectionPrep(params: {
    organizationId: string;
    serviceType: string;
  }): Promise<{
    summary: string;
    strengths: string[];
    areasOfConcern: string[];
    inspectorQuestions: string[];
    documentChecklist: string[];
  }> {
    const client = getClient();
    if (!client) {
      return {
        summary:
          'Configure ANTHROPIC_API_KEY for AI-powered inspection preparation.',
        strengths: [
          'Review your compliance dashboard for current status.',
          'Ensure all policies are up to date.',
        ],
        areasOfConcern: [
          'Address any open critical or high-severity gaps.',
          'Complete staff training records.',
        ],
        inspectorQuestions: [
          'How do you ensure all staff have completed mandatory training?',
          'Can you describe your complaints handling process?',
          'How do you monitor and audit medicines management?',
        ],
        documentChecklist: [
          'Current safeguarding policy',
          'Staff training matrix',
          'DBS check records',
          'Fire safety risk assessment',
          'Medicines management audit reports',
        ],
      };
    }

    const serviceLabel =
      params.serviceType === 'AESTHETIC_CLINIC' ? 'aesthetic clinic' : 'care home';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system:
        'You are a CQC inspection preparation consultant. Generate a comprehensive inspection preparation brief. Return JSON with "summary", "strengths" (array), "areasOfConcern" (array), "inspectorQuestions" (array), and "documentChecklist" (array).',
      messages: [
        {
          role: 'user',
          content: `Generate an inspection preparation brief for a ${serviceLabel}. Include strengths, areas of concern, likely inspector questions, and a document checklist.`,
        },
      ],
    });

    try {
      const text =
        response.content[0].type === 'text' ? response.content[0].text : '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {
      /* fall through */
    }

    return {
      summary: 'Inspection preparation analysis pending.',
      strengths: [],
      areasOfConcern: [],
      inspectorQuestions: [],
      documentChecklist: [],
    };
  }

  /**
   * Generate compliance recommendations (backward compatibility).
   */
  static async generateRecommendations(params: {
    organizationId: string;
    domain?: string;
    currentScore?: number;
  }): Promise<
    Array<{
      id: string;
      title: string;
      description: string;
      impact: 'HIGH' | 'MEDIUM' | 'LOW';
      effort: 'HIGH' | 'MEDIUM' | 'LOW';
      domain: string;
      linkedKloe: string;
    }>
  > {
    const client = getClient();
    if (!client) {
      return [
        {
          id: 'rec-1',
          title: 'Implement regular staff supervision schedule',
          description:
            'Establish a structured supervision schedule for all care staff. Monthly 1:1 sessions with documented outcomes will demonstrate effective governance.',
          impact: 'HIGH',
          effort: 'MEDIUM',
          domain: params.domain ?? 'effective',
          linkedKloe: 'E5',
        },
        {
          id: 'rec-2',
          title: 'Create a service user feedback programme',
          description:
            'Introduce quarterly satisfaction surveys and document all feedback and resulting actions.',
          impact: 'MEDIUM',
          effort: 'LOW',
          domain: 'well-led',
          linkedKloe: 'W3',
        },
        {
          id: 'rec-3',
          title: 'Develop a comprehensive audit schedule',
          description:
            'Create a rolling audit calendar covering medicines management, infection control, and care planning.',
          impact: 'HIGH',
          effort: 'HIGH',
          domain: 'safe',
          linkedKloe: 'S4',
        },
      ];
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system:
        'You are a CQC compliance consultant. Generate 3 actionable recommendations. Return JSON with "recommendations" array of objects: { id, title, description, impact, effort, domain, linkedKloe }.',
      messages: [
        {
          role: 'user',
          content: `Generate compliance recommendations for domain: ${params.domain ?? 'general'}, current score: ${params.currentScore ?? 'unknown'}.`,
        },
      ],
    });

    try {
      const text =
        response.content[0].type === 'text' ? response.content[0].text : '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.recommendations?.length) {
          return parsed.recommendations.map((r: Record<string, unknown>, i: number) => ({
            id: (r.id as string) ?? `rec-${i + 1}`,
            title: (r.title as string) ?? 'Recommendation',
            description: (r.description as string) ?? '',
            impact: (r.impact as 'HIGH' | 'MEDIUM' | 'LOW') ?? 'MEDIUM',
            effort: (r.effort as 'HIGH' | 'MEDIUM' | 'LOW') ?? 'MEDIUM',
            domain: (r.domain as string) ?? params.domain ?? 'effective',
            linkedKloe: (r.linkedKloe as string) ?? 'W2',
          }));
        }
      }
    } catch {
      /* fall through */
    }

    return [
      {
        id: 'rec-1',
        title: 'Review all identified gaps systematically',
        description: 'Address critical and high-severity gaps first.',
        impact: 'HIGH',
        effort: 'MEDIUM',
        domain: params.domain ?? 'effective',
        linkedKloe: 'W2',
      },
    ];
  }

  /**
   * CQC compliance chat assistant (backward compatibility).
   */
  static async complianceChat(params: {
    organizationId: string;
    message: string;
    conversationHistory?: Array<{ role: string; content: string }>;
    orgContext?: string;
  }): Promise<{ message: string; sources: string[] }> {
    const client = getClient();
    if (!client) {
      return {
        message:
          'Thank you for your question. Configure ANTHROPIC_API_KEY for AI-powered compliance chat.',
        sources: ['CQC Fundamental Standards'],
      };
    }

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (params.conversationHistory?.length) {
      for (const m of params.conversationHistory.slice(-6)) {
        if (m.role === 'user') {
          messages.push({ role: 'user', content: m.content });
        } else if (m.role === 'assistant') {
          messages.push({ role: 'assistant', content: m.content });
        }
      }
    }
    messages.push({ role: 'user', content: params.message });

    const systemPrompt = [
      'You are a CQC compliance knowledge base assistant for a UK healthcare organisation.',
      'You specialise in CQC regulations, the five key questions (Safe, Effective, Caring, Responsive, Well-Led), KLOEs, and the Health and Social Care Act 2008.',
      'You have access to the organisation\'s compliance data and can answer questions about their specific situation.',
      params.orgContext || '',
      'Be concise, cite relevant regulations when possible, and provide actionable advice.',
    ].filter(Boolean).join(' ');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: messages as [{ role: 'user'; content: string }],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';
    return {
      message: text,
      sources: ['CQC Fundamental Standards', 'Health and Social Care Act 2008'],
    };
  }

  private static getKloesForCategory(category: string): string[] {
    const categoryMap: Record<string, string[]> = {
      'Health & Safety': ['S1', 'S2', 'S5', 'S6'],
      Clinical: ['E1', 'E2', 'E3', 'E4', 'E7'],
      Governance: ['W1', 'W2', 'W3', 'W6'],
      'Staff Management': ['S3', 'E5'],
      Safeguarding: ['S1', 'C1', 'C3'],
      'Complaints & Feedback': ['R2', 'W3'],
    };
    return categoryMap[category] ?? ['W2'];
  }
}
