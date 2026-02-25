// =============================================================================
// AI Service — Mock AI-powered features with canned responses
// =============================================================================

interface GeneratePolicyParams {
  organizationId: string;
  title: string;
  category: string;
  serviceType: string;
  additionalContext?: string;
}

interface GeneratedPolicy {
  title: string;
  content: string;
  category: string;
  linkedKloes: string[];
}

interface GenerateRecommendationsParams {
  organizationId: string;
  domain?: string;
  currentScore?: number;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  effort: 'HIGH' | 'MEDIUM' | 'LOW';
  domain: string;
  linkedKloe: string;
}

interface GenerateInspectionPrepParams {
  organizationId: string;
  serviceType: string;
}

interface InspectionPrepReport {
  summary: string;
  strengths: string[];
  areasOfConcern: string[];
  inspectorQuestions: string[];
  documentChecklist: string[];
}

interface ComplianceChatParams {
  organizationId: string;
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface ChatResponse {
  message: string;
  sources: string[];
}

export class AIService {
  /**
   * Generate a policy document (mock).
   * Returns a canned policy with realistic markdown content.
   */
  static async generatePolicy(params: GeneratePolicyParams): Promise<GeneratedPolicy> {
    // Simulate API latency
    await AIService.simulateDelay();

    return {
      title: params.title || 'Generated Policy Document',
      content: `# ${params.title || 'Policy Document'}

## 1. Purpose

This policy sets out the organisation's approach to ${params.title?.toLowerCase() || 'the relevant area'} in accordance with CQC regulatory requirements and best practice guidance.

## 2. Scope

This policy applies to all staff, volunteers, and contractors at the organisation. It covers all activities relating to ${params.category?.toLowerCase() || 'the relevant area'}.

## 3. Responsibilities

### 3.1 Registered Manager
- Ensure this policy is implemented and reviewed annually
- Provide adequate resources for compliance
- Report any significant concerns to the CQC

### 3.2 All Staff
- Familiarise themselves with this policy
- Attend relevant training sessions
- Report any concerns through the appropriate channels

## 4. Procedure

### 4.1 Key Principles
- Person-centred approach at all times
- Transparency and accountability
- Continuous improvement through regular audit

### 4.2 Implementation Steps
1. All staff to receive training within 30 days of employment
2. Regular audits to be conducted quarterly
3. Incidents to be reported within 24 hours
4. Annual review of this policy by the Registered Manager

## 5. Monitoring and Review

This policy will be reviewed annually or sooner if:
- There are changes in legislation or CQC guidance
- Following a significant incident
- As part of the continuous improvement programme

## 6. Related Documents

- CQC Fundamental Standards
- Health and Social Care Act 2008 (Regulated Activities) Regulations 2014
- Organisation's Complaints Procedure
- Staff Training Policy

---

*This policy was generated to assist with compliance. It should be reviewed and customised by the Registered Manager before publication.*`,
      category: params.category,
      linkedKloes: AIService.getKloesForCategory(params.category),
    };
  }

  /**
   * Generate compliance recommendations (mock).
   * Returns 3 canned recommendations.
   */
  static async generateRecommendations(
    params: GenerateRecommendationsParams,
  ): Promise<Recommendation[]> {
    await AIService.simulateDelay();

    return [
      {
        id: 'rec-1',
        title: 'Implement regular staff supervision schedule',
        description:
          'Establish a structured supervision schedule for all care staff. Monthly 1:1 sessions with documented outcomes will demonstrate effective governance and support staff development. This directly addresses KLOE E5 (Staff Training & Competence) and W2 (Governance & Management).',
        impact: 'HIGH',
        effort: 'MEDIUM',
        domain: params.domain ?? 'effective',
        linkedKloe: 'E5',
      },
      {
        id: 'rec-2',
        title: 'Create a service user feedback programme',
        description:
          'Introduce quarterly satisfaction surveys and monthly resident meetings. Document all feedback and resulting actions. This demonstrates responsiveness to people\'s needs and supports continuous improvement under the Well-Led domain.',
        impact: 'MEDIUM',
        effort: 'LOW',
        domain: 'well-led',
        linkedKloe: 'W3',
      },
      {
        id: 'rec-3',
        title: 'Develop a comprehensive audit schedule',
        description:
          'Create a rolling audit calendar covering medicines management, infection control, health & safety, and care planning. Assign audit leads and track completion with documented findings and action plans. This strengthens governance and provides evidence of continuous quality monitoring.',
        impact: 'HIGH',
        effort: 'HIGH',
        domain: 'safe',
        linkedKloe: 'S4',
      },
    ];
  }

  /**
   * Generate an inspection preparation report (mock).
   */
  static async generateInspectionPrep(
    params: GenerateInspectionPrepParams,
  ): Promise<InspectionPrepReport> {
    await AIService.simulateDelay();

    return {
      summary:
        'Based on your current compliance data, your organisation is predicted to receive a "Requires Improvement" rating. The key areas requiring attention are the Effective and Responsive domains. Immediate action on critical gaps will help improve your position before inspection.',
      strengths: [
        'Good progress on infection prevention and control procedures',
        'Active incident reporting culture with timely documentation',
        'Strong safeguarding awareness among senior staff',
        'Regular DBS check renewals for majority of staff',
      ],
      areasOfConcern: [
        'Multiple critical gaps remain open in the Safe domain',
        'Staff training records are incomplete for mandatory courses',
        'Complaints handling procedure is still in draft status',
        'Governance meeting schedule has not been established',
        'Consent documentation processes need formalisation',
      ],
      inspectorQuestions: [
        'How do you ensure all staff have completed mandatory training?',
        'Can you describe your complaints handling process?',
        'How do you monitor and audit medicines management?',
        'What governance structures are in place for quality oversight?',
        'How do you gather and act on service user feedback?',
        'Can you demonstrate how care plans are person-centred?',
        'What systems do you have for learning from incidents?',
        'How do you ensure duty of candour is met?',
      ],
      documentChecklist: [
        'Current safeguarding adults policy (signed and dated)',
        'Staff training matrix with completion dates',
        'DBS check records for all staff',
        'Fire safety risk assessment and certificate',
        'Medicines management audit reports',
        'Complaints log with resolution details',
        'Governance meeting minutes (last 6 months)',
        'Care plans for all current service users',
        'Incident reports and lessons learned summaries',
        'Staff supervision records (last 12 months)',
        'Service user feedback surveys and action plans',
        'Infection control audit results',
      ],
    };
  }

  /**
   * CQC compliance chat assistant (mock).
   * Returns a helpful response about CQC compliance topics.
   */
  static async complianceChat(params: ComplianceChatParams): Promise<ChatResponse> {
    await AIService.simulateDelay();

    const message = params.message.toLowerCase();

    // Provide contextual mock responses based on keywords
    if (message.includes('safeguarding')) {
      return {
        message:
          'Safeguarding is covered under Regulation 13 of the Health and Social Care Act 2008. Your organisation must have a written safeguarding policy that is reviewed annually. All staff should receive safeguarding training appropriate to their role, and there must be a designated safeguarding lead. Key requirements include: having clear referral pathways to the local authority, maintaining a log of all safeguarding concerns, and ensuring staff can recognise signs of abuse and neglect. Based on your current data, I can see you have an open critical gap related to safeguarding policy -- addressing this should be your top priority.',
        sources: [
          'CQC Regulation 13: Safeguarding service users from abuse and improper treatment',
          'Care Act 2014, Section 42',
          'CQC KLOE S1: Safeguarding',
        ],
      };
    }

    if (message.includes('training') || message.includes('staff')) {
      return {
        message:
          'Under Regulation 18 (Staffing) and KLOE E5, all staff must receive appropriate training to carry out their roles competently. Mandatory training typically includes: safeguarding adults and children, fire safety, moving and handling, first aid, infection control, food hygiene, health and safety, mental capacity and DoLS, and data protection. Training records must be maintained and kept up to date. I recommend implementing a training matrix that tracks all staff training status and expiry dates, with automated reminders for renewals.',
        sources: [
          'CQC Regulation 18: Staffing',
          'CQC KLOE E5: Staff Training & Competence',
          'Skills for Care - Mandatory Training Guide',
        ],
      };
    }

    if (message.includes('inspection') || message.includes('prepare')) {
      return {
        message:
          'To prepare for a CQC inspection, focus on the five key questions: Safe, Effective, Caring, Responsive, and Well-Led. Ensure all policies are current and accessible, staff training records are complete, and evidence of quality monitoring is documented. Inspectors will speak with staff, service users, and families. They will review your Statement of Purpose, complaints log, incident reports, and governance meeting minutes. I recommend running the Inspection Prep report to get a tailored checklist based on your current compliance status.',
        sources: [
          'CQC Inspection Framework',
          'CQC Provider Handbook',
          'Health and Social Care Act 2008',
        ],
      };
    }

    // Default response
    return {
      message:
        'Thank you for your question about CQC compliance. The Care Quality Commission assesses services against five key questions: Is the service Safe, Effective, Caring, Responsive, and Well-Led? Each domain has specific Key Lines of Enquiry (KLOEs) that inspectors evaluate. To improve your compliance score, I recommend focusing on resolving open gaps starting with critical severity items, ensuring all policies are up to date and published, maintaining comprehensive staff training records, and documenting your quality improvement activities. Would you like me to provide more specific guidance on any particular area?',
      sources: [
        'CQC Fundamental Standards',
        'Health and Social Care Act 2008 (Regulated Activities) Regulations 2014',
      ],
    };
  }

  /**
   * Simulate network/API latency for mock responses.
   */
  private static simulateDelay(ms = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Map policy categories to relevant KLOEs.
   */
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
