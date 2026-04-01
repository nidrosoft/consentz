// =============================================================================
// AI Service — Anthropic Claude-powered compliance features
// =============================================================================

import Anthropic from '@anthropic-ai/sdk';

const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
};

export class AIService {
  /**
   * Generate a policy document using Claude.
   */
  static async generatePolicy(params: {
    policyType: string;
    serviceType: string;
    organizationName?: string;
    additionalContext?: string;
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
    const systemPrompt = `You are a UK healthcare compliance expert specializing in CQC regulations. Generate a professional, CQC-inspection-ready policy document for a ${serviceLabel}. The policy must reference specific CQC regulations and KLOEs. Include: Purpose, Scope, Responsibilities, Procedures, Monitoring, Review Date. Use formal but accessible language. Do NOT include patient names or specific identifiers. Output the policy in PLAIN TEXT format suitable for an Arial 11pt document — use numbered sections (1. 1.1 etc.), clear headings in UPPERCASE, and standard paragraph text. Do NOT use markdown formatting (no #, **, etc.). The output should be ready to paste directly into a Word document.`;

    let userContent = `Generate a ${params.policyType} policy for our ${serviceLabel}`;
    if (params.organizationName) userContent += ` called "${params.organizationName}"`;
    if (params.additionalContext) userContent += `.\n\nAdditional context: ${params.additionalContext}`;
    userContent += '.';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const content =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const titleMatch = content.match(/^#\s+(.+)/m);
    const title = titleMatch ? titleMatch[1] : `${params.policyType} Policy`;

    return {
      content,
      title,
      category: params.policyType,
      linkedKloes: AIService.getKloesForCategory(params.policyType),
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
