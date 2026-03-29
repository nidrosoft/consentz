import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function throwOnError(result: { error: unknown }) {
  if (result.error) throw result.error;
}

// ─── Fixed UUIDs for deterministic seeding ──────────────────────────────────

const DOMAIN_IDS = {
  safe: 'a1000000-0000-0000-0000-000000000001',
  effective: 'a1000000-0000-0000-0000-000000000002',
  caring: 'a1000000-0000-0000-0000-000000000003',
  responsive: 'a1000000-0000-0000-0000-000000000004',
  well_led: 'a1000000-0000-0000-0000-000000000005',
} as const;

const CQC_KLOE_IDS: Record<string, string> = {
  S1: 'b1000000-0000-0000-0000-000000000001',
  S2: 'b1000000-0000-0000-0000-000000000002',
  S3: 'b1000000-0000-0000-0000-000000000003',
  S4: 'b1000000-0000-0000-0000-000000000004',
  S5: 'b1000000-0000-0000-0000-000000000005',
  S6: 'b1000000-0000-0000-0000-000000000006',
  E1: 'b1000000-0000-0000-0000-000000000007',
  E2: 'b1000000-0000-0000-0000-000000000008',
  E3: 'b1000000-0000-0000-0000-000000000009',
  E4: 'b1000000-0000-0000-0000-000000000010',
  E5: 'b1000000-0000-0000-0000-000000000011',
  E6: 'b1000000-0000-0000-0000-000000000012',
  E7: 'b1000000-0000-0000-0000-000000000013',
  C1: 'b1000000-0000-0000-0000-000000000014',
  C2: 'b1000000-0000-0000-0000-000000000015',
  C3: 'b1000000-0000-0000-0000-000000000016',
  R1: 'b1000000-0000-0000-0000-000000000017',
  R2: 'b1000000-0000-0000-0000-000000000018',
  R3: 'b1000000-0000-0000-0000-000000000019',
  W1: 'b1000000-0000-0000-0000-000000000020',
  W2: 'b1000000-0000-0000-0000-000000000021',
  W3: 'b1000000-0000-0000-0000-000000000022',
  W4: 'b1000000-0000-0000-0000-000000000023',
  W5: 'b1000000-0000-0000-0000-000000000024',
  W6: 'b1000000-0000-0000-0000-000000000025',
};

const KLOE_IDS: Record<string, string> = {
  S1: 'c1000000-0000-0000-0000-000000000001',
  S2: 'c1000000-0000-0000-0000-000000000002',
  S3: 'c1000000-0000-0000-0000-000000000003',
  S4: 'c1000000-0000-0000-0000-000000000004',
  S5: 'c1000000-0000-0000-0000-000000000005',
  S6: 'c1000000-0000-0000-0000-000000000006',
  E1: 'c1000000-0000-0000-0000-000000000007',
  E2: 'c1000000-0000-0000-0000-000000000008',
  E3: 'c1000000-0000-0000-0000-000000000009',
  E4: 'c1000000-0000-0000-0000-000000000010',
  E5: 'c1000000-0000-0000-0000-000000000011',
  E6: 'c1000000-0000-0000-0000-000000000012',
  E7: 'c1000000-0000-0000-0000-000000000013',
  C1: 'c1000000-0000-0000-0000-000000000014',
  C2: 'c1000000-0000-0000-0000-000000000015',
  C3: 'c1000000-0000-0000-0000-000000000016',
  R1: 'c1000000-0000-0000-0000-000000000017',
  R2: 'c1000000-0000-0000-0000-000000000018',
  R3: 'c1000000-0000-0000-0000-000000000019',
  W1: 'c1000000-0000-0000-0000-000000000020',
  W2: 'c1000000-0000-0000-0000-000000000021',
  W3: 'c1000000-0000-0000-0000-000000000022',
  W4: 'c1000000-0000-0000-0000-000000000023',
  W5: 'c1000000-0000-0000-0000-000000000024',
  W6: 'c1000000-0000-0000-0000-000000000025',
};

const REG_IDS: Record<string, string> = {
  reg_9: 'd1000000-0000-0000-0000-000000000009',
  reg_10: 'd1000000-0000-0000-0000-000000000010',
  reg_11: 'd1000000-0000-0000-0000-000000000011',
  reg_12: 'd1000000-0000-0000-0000-000000000012',
  reg_13: 'd1000000-0000-0000-0000-000000000013',
  reg_14: 'd1000000-0000-0000-0000-000000000014',
  reg_15: 'd1000000-0000-0000-0000-000000000015',
  reg_16: 'd1000000-0000-0000-0000-000000000016',
  reg_17: 'd1000000-0000-0000-0000-000000000017',
  reg_18: 'd1000000-0000-0000-0000-000000000018',
  reg_19: 'd1000000-0000-0000-0000-000000000019',
  reg_20: 'd1000000-0000-0000-0000-000000000020',
  reg_20a: 'd1000000-0000-0000-0000-000000000021',
};

const CQC_REG_IDS: Record<string, string> = {
  reg_9: 'e1000000-0000-0000-0000-000000000009',
  reg_10: 'e1000000-0000-0000-0000-000000000010',
  reg_11: 'e1000000-0000-0000-0000-000000000011',
  reg_12: 'e1000000-0000-0000-0000-000000000012',
  reg_13: 'e1000000-0000-0000-0000-000000000013',
  reg_14: 'e1000000-0000-0000-0000-000000000014',
  reg_15: 'e1000000-0000-0000-0000-000000000015',
  reg_16: 'e1000000-0000-0000-0000-000000000016',
  reg_17: 'e1000000-0000-0000-0000-000000000017',
  reg_18: 'e1000000-0000-0000-0000-000000000018',
  reg_19: 'e1000000-0000-0000-0000-000000000019',
  reg_20: 'e1000000-0000-0000-0000-000000000020',
  reg_20a: 'e1000000-0000-0000-0000-000000000021',
};

const DEMO_ORG_ID = 'c9a2e3fc-23d7-4443-9c09-b1b6a67a32e6';
const DEMO_USER_ID = '28cdb01f-107f-42e1-9d30-1cd01ff92b49';

// ─── 1. CQC Domains ────────────────────────────────────────────────────────

async function seedDomains() {
  console.log('Seeding CQC Domains...');

  const domains = [
    { id: DOMAIN_IDS.safe, code: 'safe', name: 'Safe', description: 'People are protected from abuse and avoidable harm.', icon: 'Shield', color: '#3B82F6', sortOrder: 1 },
    { id: DOMAIN_IDS.effective, code: 'effective', name: 'Effective', description: "People's care, treatment and support achieves good outcomes, promotes a good quality of life and is based on the best available evidence.", icon: 'Target', color: '#10B981', sortOrder: 2 },
    { id: DOMAIN_IDS.caring, code: 'caring', name: 'Caring', description: 'Staff involve and treat people with compassion, kindness, dignity and respect.', icon: 'Heart', color: '#EC4899', sortOrder: 3 },
    { id: DOMAIN_IDS.responsive, code: 'responsive', name: 'Responsive', description: "Services are organised so that they meet people's needs.", icon: 'Zap', color: '#F59E0B', sortOrder: 4 },
    { id: DOMAIN_IDS.well_led, code: 'well_led', name: 'Well-Led', description: 'The leadership, management and governance of the organisation assures the delivery of high-quality and person-centred care, supports learning and innovation, and promotes an open and fair culture.', icon: 'Crown', color: '#8B5CF6', sortOrder: 5 },
  ];

  for (const d of domains) {
    throwOnError(
      await supabase.from('cqc_domains').upsert(
        {
          id: d.id,
          code: d.code,
          name: d.name,
          description: d.description,
          icon: d.icon,
          color: d.color,
          sort_order: d.sortOrder,
        },
        { onConflict: 'id' },
      ),
    );
  }

  console.log(`  ✓ ${domains.length} domains seeded`);
}

// ─── 2. KLOEs (CqcKloe + Kloe) ────────────────────────────────────────────

interface KloeDefinition {
  code: string;
  domainCode: keyof typeof DOMAIN_IDS;
  domainType: string;
  title: string;
  description: string;
  sortOrder: number;
  appliesToClinic: boolean;
  appliesToCareHome: boolean;
  clinicGuidance?: string;
  careHomeGuidance?: string;
  weight: number;
}

const KLOE_DEFINITIONS: KloeDefinition[] = [
  // Safe
  { code: 'S1', domainCode: 'safe', domainType: 'safe', title: 'Safeguarding', description: 'How do systems, processes and practices keep people safe and safeguarded from abuse?', sortOrder: 1, appliesToClinic: true, appliesToCareHome: true, weight: 1.5 },
  { code: 'S2', domainCode: 'safe', domainType: 'safe', title: 'Risk Management', description: 'How are risks to people assessed and their safety monitored and managed so they are supported to stay safe and their freedom is respected?', sortOrder: 2, appliesToClinic: true, appliesToCareHome: true, weight: 1.5 },
  { code: 'S3', domainCode: 'safe', domainType: 'safe', title: 'Medicines Management', description: 'How does the provider ensure the proper and safe use of medicines?', sortOrder: 3, appliesToClinic: true, appliesToCareHome: true, weight: 1.5 },
  { code: 'S4', domainCode: 'safe', domainType: 'safe', title: 'Premises & Equipment', description: 'How does the provider ensure the premises and equipment are safe?', sortOrder: 4, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },
  { code: 'S5', domainCode: 'safe', domainType: 'safe', title: 'Infection Control', description: 'How does the provider prevent and control infection?', sortOrder: 5, appliesToClinic: true, appliesToCareHome: true, weight: 1.5 },
  { code: 'S6', domainCode: 'safe', domainType: 'safe', title: 'Lessons Learned', description: 'Are lessons learned and improvements made when things go wrong?', sortOrder: 6, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },

  // Effective
  { code: 'E1', domainCode: 'effective', domainType: 'effective', title: 'Evidence-Based Care', description: 'Are people\'s needs and choices assessed and care and treatment delivered in line with current legislation, standards and evidence-based guidance?', sortOrder: 1, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },
  { code: 'E2', domainCode: 'effective', domainType: 'effective', title: 'Staff Skills & Knowledge', description: 'How does the provider make sure that staff have the skills, knowledge and experience to deliver effective care, support and treatment?', sortOrder: 2, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },
  { code: 'E3', domainCode: 'effective', domainType: 'effective', title: 'Nutrition & Wellbeing', description: 'How are people supported to live healthier lives?', sortOrder: 3, appliesToClinic: true, appliesToCareHome: true, clinicGuidance: 'How are people supported to live healthier lives?', careHomeGuidance: 'How are people supported to eat and drink enough to maintain a balanced diet?', weight: 1.0 },
  { code: 'E4', domainCode: 'effective', domainType: 'effective', title: 'Patient Outcomes', description: 'How does the provider make sure patients achieve good outcomes?', sortOrder: 4, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },
  { code: 'E5', domainCode: 'effective', domainType: 'effective', title: 'Collaborative Working', description: 'How does the staff, teams and services work together to deliver effective care and treatment?', sortOrder: 5, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },
  { code: 'E6', domainCode: 'effective', domainType: 'effective', title: 'Consent', description: 'Is consent to care and treatment always sought in line with legislation and guidance?', sortOrder: 6, appliesToClinic: true, appliesToCareHome: true, weight: 1.5 },
  { code: 'E7', domainCode: 'effective', domainType: 'effective', title: 'Clinical Governance', description: 'How does the governance framework ensure the quality and delivery of treatment is consistent?', sortOrder: 7, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },

  // Caring
  { code: 'C1', domainCode: 'caring', domainType: 'caring', title: 'Kindness & Compassion', description: 'How does the service ensure that people are treated with kindness, respect and compassion?', sortOrder: 1, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },
  { code: 'C2', domainCode: 'caring', domainType: 'caring', title: 'Patient Involvement', description: 'How does the provider support people to express their views and be actively involved in making decisions about their care?', sortOrder: 2, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },
  { code: 'C3', domainCode: 'caring', domainType: 'caring', title: 'Privacy & Dignity', description: 'How is people\'s privacy and dignity respected and promoted?', sortOrder: 3, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },

  // Responsive
  { code: 'R1', domainCode: 'responsive', domainType: 'responsive', title: 'Service Planning', description: 'How are people\'s needs met by the planning and delivery of services?', sortOrder: 1, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },
  { code: 'R2', domainCode: 'responsive', domainType: 'responsive', title: 'Complaints Handling', description: 'How are concerns and complaints listened and responded to and used to improve the quality of care?', sortOrder: 2, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },
  { code: 'R3', domainCode: 'responsive', domainType: 'responsive', title: 'Access & Timeliness', description: 'How does the provider ensure people can access care in a timely way?', sortOrder: 3, appliesToClinic: true, appliesToCareHome: true, clinicGuidance: 'How does the provider ensure people can access care in a timely way?', careHomeGuidance: 'How are people at the end of their life cared for?', weight: 1.0 },

  // Well-Led
  { code: 'W1', domainCode: 'well_led', domainType: 'well_led', title: 'Vision & Strategy', description: 'Is there a clear vision and credible strategy to deliver good quality care?', sortOrder: 1, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },
  { code: 'W2', domainCode: 'well_led', domainType: 'well_led', title: 'Governance & Performance', description: 'Does the governance framework ensure that responsibilities are clear, and quality performance, risks and regulatory requirements are understood and managed?', sortOrder: 2, appliesToClinic: true, appliesToCareHome: true, weight: 1.5 },
  { code: 'W3', domainCode: 'well_led', domainType: 'well_led', title: 'Culture', description: 'How does the provider promote a positive culture that is person-centred, open, inclusive and empowering?', sortOrder: 3, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },
  { code: 'W4', domainCode: 'well_led', domainType: 'well_led', title: 'Engagement', description: 'How are people who use the service, the public, staff and external partners engaged and involved?', sortOrder: 4, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },
  { code: 'W5', domainCode: 'well_led', domainType: 'well_led', title: 'Learning & Innovation', description: 'How does the provider continuously learn, improve and innovate?', sortOrder: 5, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },
  { code: 'W6', domainCode: 'well_led', domainType: 'well_led', title: 'Public Confidence', description: 'How does the provider ensure people can be confident in the organisation?', sortOrder: 6, appliesToClinic: true, appliesToCareHome: true, weight: 1.0 },
];

async function seedKloes() {
  console.log('Seeding CQC KLOEs...');

  for (const kloe of KLOE_DEFINITIONS) {
    const domainId = DOMAIN_IDS[kloe.domainCode];
    const cqcKloeId = CQC_KLOE_IDS[kloe.code];
    const kloeId = KLOE_IDS[kloe.code];

    // CqcKloe table
    throwOnError(
      await supabase.from('cqc_kloes').upsert(
        {
          id: cqcKloeId,
          code: kloe.code,
          domain_id: domainId,
          domain_type: kloe.domainType,
          title: kloe.title,
          description: kloe.description,
          sort_order: kloe.sortOrder,
          applies_to_clinic: kloe.appliesToClinic,
          applies_to_care_home: kloe.appliesToCareHome,
          clinic_guidance: kloe.clinicGuidance ?? null,
          care_home_guidance: kloe.careHomeGuidance ?? null,
          weight: kloe.weight,
        },
        { onConflict: 'id' },
      ),
    );

    // Kloe table (used by assessment questions and evidence requirements)
    throwOnError(
      await supabase.from('kloes').upsert(
        {
          id: kloeId,
          code: kloe.code,
          domain_id: domainId,
          question: kloe.description,
          description: kloe.title,
          service_types: ['AESTHETIC_CLINIC', 'CARE_HOME'],
          sort_order: kloe.sortOrder,
        },
        { onConflict: 'id' },
      ),
    );
  }

  console.log(`  ✓ ${KLOE_DEFINITIONS.length} CQC KLOEs seeded`);
  console.log(`  ✓ ${KLOE_DEFINITIONS.length} Kloes seeded`);
}

// ─── 3. Regulations ────────────────────────────────────────────────────────

interface RegulationDef {
  code: string;
  number: number;
  name: string;
  description: string;
  isProsecutable: boolean;
  sortOrder: number;
}

const REGULATION_DEFS: RegulationDef[] = [
  { code: 'reg_9', number: 9, name: 'Person-centred care', description: 'The care and treatment of service users must be appropriate, meet their needs and reflect their preferences.', isProsecutable: false, sortOrder: 1 },
  { code: 'reg_10', number: 10, name: 'Dignity and respect', description: 'Service users must be treated with dignity and respect at all times.', isProsecutable: false, sortOrder: 2 },
  { code: 'reg_11', number: 11, name: 'Need for consent', description: 'Care and treatment of service users must only be provided with the consent of the relevant person.', isProsecutable: false, sortOrder: 3 },
  { code: 'reg_12', number: 12, name: 'Safe care and treatment', description: 'Care and treatment must be provided in a safe way for service users.', isProsecutable: true, sortOrder: 4 },
  { code: 'reg_13', number: 13, name: 'Safeguarding service users from abuse and improper treatment', description: 'Service users must be protected from abuse and improper treatment.', isProsecutable: true, sortOrder: 5 },
  { code: 'reg_14', number: 14, name: 'Meeting nutritional and hydration needs', description: 'The nutritional and hydration needs of service users must be met.', isProsecutable: false, sortOrder: 6 },
  { code: 'reg_15', number: 15, name: 'Premises and equipment', description: 'All premises and equipment used must be clean, secure, suitable, properly maintained and properly used.', isProsecutable: true, sortOrder: 7 },
  { code: 'reg_16', number: 16, name: 'Receiving and acting on complaints', description: 'Any complaint received must be investigated and necessary and proportionate action must be taken.', isProsecutable: false, sortOrder: 8 },
  { code: 'reg_17', number: 17, name: 'Good governance', description: 'Systems and processes must be established and operated effectively to ensure compliance with the requirements.', isProsecutable: true, sortOrder: 9 },
  { code: 'reg_18', number: 18, name: 'Staffing', description: 'Sufficient numbers of suitably qualified, competent, skilled and experienced persons must be deployed.', isProsecutable: true, sortOrder: 10 },
  { code: 'reg_19', number: 19, name: 'Fit and proper persons employed', description: 'Persons employed for the purposes of carrying on a regulated activity must be of good character.', isProsecutable: true, sortOrder: 11 },
  { code: 'reg_20', number: 20, name: 'Duty of candour', description: 'Registered persons must act in an open and transparent way with relevant persons in relation to care and treatment provided.', isProsecutable: false, sortOrder: 12 },
  { code: 'reg_20a', number: 20, name: 'Requirements where the service provider is a body other than a partnership', description: 'Requirements relating to organisations that are not partnerships, including fitness of directors.', isProsecutable: false, sortOrder: 13 },
];

async function seedRegulations() {
  console.log('Seeding Regulations...');

  for (const reg of REGULATION_DEFS) {
    // CqcRegulation table
    throwOnError(
      await supabase.from('cqc_regulations').upsert(
        {
          id: CQC_REG_IDS[reg.code],
          code: reg.code,
          number: String(reg.number),
          name: reg.name,
          description: reg.description,
          is_prosecutable: reg.isProsecutable,
          sort_order: reg.sortOrder,
        },
        { onConflict: 'id' },
      ),
    );

    // Regulation table (used by KloeRegulation)
    throwOnError(
      await supabase.from('regulations').upsert(
        {
          id: REG_IDS[reg.code],
          code: reg.code,
          number: reg.number,
          name: reg.name,
          description: reg.description,
          prosecutable: reg.isProsecutable,
        },
        { onConflict: 'id' },
      ),
    );
  }

  console.log(`  ✓ ${REGULATION_DEFS.length} CQC Regulations seeded`);
  console.log(`  ✓ ${REGULATION_DEFS.length} Regulations seeded`);
}

// ─── 4. KLOE-Regulation Mappings ────────────────────────────────────────────

const KLOE_REG_MAPPINGS: Array<{ kloeCode: string; regCodes: string[] }> = [
  { kloeCode: 'S1', regCodes: ['reg_12', 'reg_13'] },
  { kloeCode: 'S2', regCodes: ['reg_12'] },
  { kloeCode: 'S3', regCodes: ['reg_12'] },
  { kloeCode: 'S4', regCodes: ['reg_15'] },
  { kloeCode: 'S5', regCodes: ['reg_12'] },
  { kloeCode: 'S6', regCodes: ['reg_12', 'reg_20'] },
  { kloeCode: 'E1', regCodes: ['reg_9'] },
  { kloeCode: 'E2', regCodes: ['reg_18'] },
  { kloeCode: 'E3', regCodes: ['reg_14'] },
  { kloeCode: 'E4', regCodes: ['reg_9'] },
  { kloeCode: 'E5', regCodes: ['reg_12'] },
  { kloeCode: 'E6', regCodes: ['reg_11'] },
  { kloeCode: 'E7', regCodes: ['reg_17'] },
  { kloeCode: 'C1', regCodes: ['reg_10'] },
  { kloeCode: 'C2', regCodes: ['reg_9'] },
  { kloeCode: 'C3', regCodes: ['reg_10'] },
  { kloeCode: 'R1', regCodes: ['reg_9'] },
  { kloeCode: 'R2', regCodes: ['reg_16'] },
  { kloeCode: 'R3', regCodes: ['reg_9'] },
  { kloeCode: 'W1', regCodes: ['reg_17'] },
  { kloeCode: 'W2', regCodes: ['reg_17'] },
  { kloeCode: 'W3', regCodes: ['reg_18', 'reg_19'] },
  { kloeCode: 'W4', regCodes: ['reg_17'] },
  { kloeCode: 'W5', regCodes: ['reg_17'] },
  { kloeCode: 'W6', regCodes: ['reg_17', 'reg_20'] },
];

async function seedKloeRegulationMappings() {
  console.log('Seeding KLOE-Regulation mappings...');
  let count = 0;

  for (const mapping of KLOE_REG_MAPPINGS) {
    const cqcKloeId = CQC_KLOE_IDS[mapping.kloeCode];
    const kloeId = KLOE_IDS[mapping.kloeCode];

    for (const regCode of mapping.regCodes) {
      const cqcRegId = CQC_REG_IDS[regCode];
      const regId = REG_IDS[regCode];

      // CqcKloeRegulation
      throwOnError(
        await supabase.from('cqc_kloe_regulations').upsert(
          {
            kloe_id: cqcKloeId,
            regulation_id: cqcRegId,
            mapping_type: 'primary',
          },
          { onConflict: 'kloe_id,regulation_id' },
        ),
      );

      // KloeRegulation
      throwOnError(
        await supabase.from('kloe_regulations').upsert(
          {
            kloe_id: kloeId,
            regulation_id: regId,
          },
          { onConflict: 'kloe_id,regulation_id' },
        ),
      );

      count++;
    }
  }

  console.log(`  ✓ ${count} KLOE-Regulation mappings seeded (both tables)`);
}

// ─── 5. Evidence Requirements ──────────────────────────────────────────────

interface EvidenceReqDef {
  kloeCode: string;
  serviceType: 'AESTHETIC_CLINIC' | 'CARE_HOME';
  title: string;
  description: string;
  category: string;
  sortOrder: number;
}

function evidenceId(kloe: string, svc: string, order: number): string {
  const kloeNum = parseInt(kloe.replace(/\D/g, ''), 10);
  const domainLetter = kloe.charAt(0).toLowerCase();
  const domainMap: Record<string, number> = { s: 1, e: 2, c: 3, r: 4, w: 5 };
  const d = domainMap[domainLetter] || 0;
  const s = svc === 'AESTHETIC_CLINIC' ? 1 : 2;
  return `f${s}00000${d}-0000-0000-0000-0000${String(kloeNum).padStart(2, '0')}00${String(order).padStart(4, '0')}`;
}

const CLINIC_EVIDENCE: EvidenceReqDef[] = [
  // S1: Safeguarding
  { kloeCode: 'S1', serviceType: 'AESTHETIC_CLINIC', title: 'Safeguarding policy', description: 'Current safeguarding adults and children policy with named safeguarding lead', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'S1', serviceType: 'AESTHETIC_CLINIC', title: 'DBS check records for all staff', description: 'Evidence of Disclosure and Barring Service checks for all clinical and non-clinical staff', category: 'CERTIFICATE', sortOrder: 2 },
  { kloeCode: 'S1', serviceType: 'AESTHETIC_CLINIC', title: 'Safeguarding training certificates', description: 'Training certificates showing all staff have completed appropriate level safeguarding training', category: 'TRAINING_RECORD', sortOrder: 3 },

  // S2: Risk Management
  { kloeCode: 'S2', serviceType: 'AESTHETIC_CLINIC', title: 'Patient risk assessment templates', description: 'Standardised risk assessment forms used for all patients prior to treatment', category: 'RISK_ASSESSMENT', sortOrder: 1 },
  { kloeCode: 'S2', serviceType: 'AESTHETIC_CLINIC', title: 'Risk register', description: 'Active risk register documenting identified risks, mitigations and review dates', category: 'RISK_ASSESSMENT', sortOrder: 2 },
  { kloeCode: 'S2', serviceType: 'AESTHETIC_CLINIC', title: 'Adverse event protocol', description: 'Documented protocol for managing adverse events and complications', category: 'POLICY', sortOrder: 3 },

  // S3: Medicines Management
  { kloeCode: 'S3', serviceType: 'AESTHETIC_CLINIC', title: 'Prescribing policy', description: 'Policy covering prescribing, administration and supply of medicines including PGDs', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'S3', serviceType: 'AESTHETIC_CLINIC', title: 'Medicine storage audit', description: 'Regular audits of medicine storage conditions, temperatures, and stock control', category: 'AUDIT_REPORT', sortOrder: 2 },
  { kloeCode: 'S3', serviceType: 'AESTHETIC_CLINIC', title: 'Controlled drugs register', description: 'Register for any controlled drugs held and administered at the clinic', category: 'CHECKLIST', sortOrder: 3 },

  // S4: Premises & Equipment
  { kloeCode: 'S4', serviceType: 'AESTHETIC_CLINIC', title: 'Fire safety certificate', description: 'Current fire risk assessment and fire safety certificate', category: 'CERTIFICATE', sortOrder: 1 },
  { kloeCode: 'S4', serviceType: 'AESTHETIC_CLINIC', title: 'Equipment maintenance log', description: 'Log of all equipment maintenance, calibration and servicing records', category: 'CHECKLIST', sortOrder: 2 },
  { kloeCode: 'S4', serviceType: 'AESTHETIC_CLINIC', title: 'Premises risk assessment', description: 'Comprehensive risk assessment of premises including health and safety compliance', category: 'RISK_ASSESSMENT', sortOrder: 3 },

  // S5: Infection Control
  { kloeCode: 'S5', serviceType: 'AESTHETIC_CLINIC', title: 'Infection prevention and control policy', description: 'Comprehensive IPC policy covering decontamination, sterilisation and aseptic technique', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'S5', serviceType: 'AESTHETIC_CLINIC', title: 'Hand hygiene audit', description: 'Regular hand hygiene compliance audits with results and action plans', category: 'AUDIT_REPORT', sortOrder: 2 },
  { kloeCode: 'S5', serviceType: 'AESTHETIC_CLINIC', title: 'Waste disposal records', description: 'Clinical and hazardous waste disposal contracts and collection records', category: 'CHECKLIST', sortOrder: 3 },

  // S6: Lessons Learned
  { kloeCode: 'S6', serviceType: 'AESTHETIC_CLINIC', title: 'Incident log and investigation records', description: 'Complete log of all incidents with investigation findings and outcomes', category: 'INCIDENT_LOG', sortOrder: 1 },
  { kloeCode: 'S6', serviceType: 'AESTHETIC_CLINIC', title: 'Root cause analysis reports', description: 'RCA reports for significant incidents demonstrating thorough investigation', category: 'AUDIT_REPORT', sortOrder: 2 },
  { kloeCode: 'S6', serviceType: 'AESTHETIC_CLINIC', title: 'Improvement action plan', description: 'Action plans arising from incidents, complaints and audits with progress tracking', category: 'CHECKLIST', sortOrder: 3 },

  // E1: Evidence-Based Care
  { kloeCode: 'E1', serviceType: 'AESTHETIC_CLINIC', title: 'Treatment protocols', description: 'Evidence-based treatment protocols for all procedures offered', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'E1', serviceType: 'AESTHETIC_CLINIC', title: 'Patient pathway documentation', description: 'Documented patient pathways from consultation through treatment to aftercare', category: 'POLICY', sortOrder: 2 },
  { kloeCode: 'E1', serviceType: 'AESTHETIC_CLINIC', title: 'Clinical guidelines', description: 'Reference to NICE guidelines, JCCP standards and other evidence-based resources used', category: 'POLICY', sortOrder: 3 },

  // E2: Staff Skills & Knowledge
  { kloeCode: 'E2', serviceType: 'AESTHETIC_CLINIC', title: 'Staff training matrix', description: 'Matrix showing all staff training requirements, completed training and gaps', category: 'TRAINING_RECORD', sortOrder: 1 },
  { kloeCode: 'E2', serviceType: 'AESTHETIC_CLINIC', title: 'Competency assessments', description: 'Completed competency assessments for all clinical staff for each procedure they perform', category: 'TRAINING_RECORD', sortOrder: 2 },
  { kloeCode: 'E2', serviceType: 'AESTHETIC_CLINIC', title: 'CPD log', description: 'Continuing professional development records for all clinical staff', category: 'TRAINING_RECORD', sortOrder: 3 },

  // E3: Nutrition & Wellbeing
  { kloeCode: 'E3', serviceType: 'AESTHETIC_CLINIC', title: 'Aftercare guidelines', description: 'Written aftercare guidelines provided to patients following treatment', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'E3', serviceType: 'AESTHETIC_CLINIC', title: 'Patient wellbeing information', description: 'Information provided to patients about maintaining their health and wellbeing', category: 'POLICY', sortOrder: 2 },

  // E4: Patient Outcomes
  { kloeCode: 'E4', serviceType: 'AESTHETIC_CLINIC', title: 'Patient outcome tracking', description: 'System for tracking and measuring patient outcomes and satisfaction', category: 'AUDIT_REPORT', sortOrder: 1 },
  { kloeCode: 'E4', serviceType: 'AESTHETIC_CLINIC', title: 'Follow-up protocol', description: 'Protocol for post-treatment follow-up including timelines and escalation procedures', category: 'POLICY', sortOrder: 2 },
  { kloeCode: 'E4', serviceType: 'AESTHETIC_CLINIC', title: 'Clinical audit', description: 'Regular clinical audits measuring treatment outcomes against benchmarks', category: 'AUDIT_REPORT', sortOrder: 3 },

  // E5: Collaborative Working
  { kloeCode: 'E5', serviceType: 'AESTHETIC_CLINIC', title: 'MDT meeting minutes', description: 'Minutes from multi-disciplinary team meetings showing collaborative working', category: 'MEETING_MINUTES', sortOrder: 1 },
  { kloeCode: 'E5', serviceType: 'AESTHETIC_CLINIC', title: 'Referral pathways', description: 'Documented referral pathways to other healthcare providers and specialists', category: 'POLICY', sortOrder: 2 },
  { kloeCode: 'E5', serviceType: 'AESTHETIC_CLINIC', title: 'Communication protocols', description: 'Protocols for communication between staff, teams and external partners', category: 'POLICY', sortOrder: 3 },

  // E6: Consent
  { kloeCode: 'E6', serviceType: 'AESTHETIC_CLINIC', title: 'Consent policy', description: 'Comprehensive consent policy covering capacity assessment and cooling-off periods', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'E6', serviceType: 'AESTHETIC_CLINIC', title: 'Consent form templates', description: 'Procedure-specific consent forms including risks, benefits and alternatives', category: 'POLICY', sortOrder: 2 },
  { kloeCode: 'E6', serviceType: 'AESTHETIC_CLINIC', title: 'Cooling-off period records', description: 'Records demonstrating compliance with mandatory cooling-off periods', category: 'CHECKLIST', sortOrder: 3 },

  // E7: Clinical Governance
  { kloeCode: 'E7', serviceType: 'AESTHETIC_CLINIC', title: 'Clinical governance framework', description: 'Documented clinical governance framework including accountability structures', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'E7', serviceType: 'AESTHETIC_CLINIC', title: 'Quality management policy', description: 'Quality management system documentation and continuous improvement processes', category: 'POLICY', sortOrder: 2 },

  // C1: Kindness & Compassion
  { kloeCode: 'C1', serviceType: 'AESTHETIC_CLINIC', title: 'Patient dignity policy', description: 'Policy ensuring dignity and respect in all patient interactions', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'C1', serviceType: 'AESTHETIC_CLINIC', title: 'Chaperone policy', description: 'Policy for offering and providing chaperones during consultations and treatments', category: 'POLICY', sortOrder: 2 },
  { kloeCode: 'C1', serviceType: 'AESTHETIC_CLINIC', title: 'Patient feedback records', description: 'Collected patient feedback including surveys, reviews and testimonials', category: 'PATIENT_RECORD', sortOrder: 3 },

  // C2: Patient Involvement
  { kloeCode: 'C2', serviceType: 'AESTHETIC_CLINIC', title: 'Patient involvement policy', description: 'Policy on supporting patients to participate in decisions about their care', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'C2', serviceType: 'AESTHETIC_CLINIC', title: 'Shared decision making records', description: 'Evidence of shared decision making in consultations and treatment planning', category: 'PATIENT_RECORD', sortOrder: 2 },

  // C3: Privacy & Dignity
  { kloeCode: 'C3', serviceType: 'AESTHETIC_CLINIC', title: 'Privacy policy', description: 'Privacy policy covering patient data, consultations and treatment areas', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'C3', serviceType: 'AESTHETIC_CLINIC', title: 'Data protection policy', description: 'GDPR-compliant data protection policy and procedures', category: 'POLICY', sortOrder: 2 },
  { kloeCode: 'C3', serviceType: 'AESTHETIC_CLINIC', title: 'Confidentiality agreements', description: 'Signed confidentiality agreements for all staff members', category: 'CERTIFICATE', sortOrder: 3 },

  // R1: Service Planning
  { kloeCode: 'R1', serviceType: 'AESTHETIC_CLINIC', title: 'Service delivery plan', description: 'Plan describing service provision, capacity planning and resource allocation', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'R1', serviceType: 'AESTHETIC_CLINIC', title: 'Accessibility policy', description: 'Policy ensuring services are accessible to all including those with protected characteristics', category: 'POLICY', sortOrder: 2 },
  { kloeCode: 'R1', serviceType: 'AESTHETIC_CLINIC', title: 'Reasonable adjustments log', description: 'Log of reasonable adjustments made for individual patients', category: 'CHECKLIST', sortOrder: 3 },

  // R2: Complaints Handling
  { kloeCode: 'R2', serviceType: 'AESTHETIC_CLINIC', title: 'Complaints policy', description: 'Comprehensive complaints policy including timescales and escalation routes', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'R2', serviceType: 'AESTHETIC_CLINIC', title: 'Complaints log', description: 'Log of all complaints received with outcomes and learning', category: 'INCIDENT_LOG', sortOrder: 2 },
  { kloeCode: 'R2', serviceType: 'AESTHETIC_CLINIC', title: 'Resolution records', description: 'Records showing how complaints were investigated and resolved', category: 'CHECKLIST', sortOrder: 3 },

  // R3: Access & Timeliness
  { kloeCode: 'R3', serviceType: 'AESTHETIC_CLINIC', title: 'Booking system records', description: 'Records from booking system demonstrating appointment availability and management', category: 'CHECKLIST', sortOrder: 1 },
  { kloeCode: 'R3', serviceType: 'AESTHETIC_CLINIC', title: 'Wait time monitoring', description: 'Monitoring data for patient waiting times from referral to treatment', category: 'AUDIT_REPORT', sortOrder: 2 },
  { kloeCode: 'R3', serviceType: 'AESTHETIC_CLINIC', title: 'Triage protocols', description: 'Protocols for triaging and prioritising patient appointments', category: 'POLICY', sortOrder: 3 },

  // W1: Vision & Strategy
  { kloeCode: 'W1', serviceType: 'AESTHETIC_CLINIC', title: 'Strategy document', description: 'Published business and clinical strategy with clear objectives and timelines', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'W1', serviceType: 'AESTHETIC_CLINIC', title: 'Mission and values statement', description: 'Documented mission, vision and values statements communicated to all staff', category: 'POLICY', sortOrder: 2 },

  // W2: Governance & Performance
  { kloeCode: 'W2', serviceType: 'AESTHETIC_CLINIC', title: 'Governance policy', description: 'Governance framework documenting structures, roles and responsibilities', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'W2', serviceType: 'AESTHETIC_CLINIC', title: 'Board meeting minutes', description: 'Minutes from governance/management meetings showing oversight of quality and safety', category: 'MEETING_MINUTES', sortOrder: 2 },
  { kloeCode: 'W2', serviceType: 'AESTHETIC_CLINIC', title: 'Quality report', description: 'Regular quality reports covering KPIs, incidents, complaints and compliance metrics', category: 'AUDIT_REPORT', sortOrder: 3 },

  // W3: Culture
  { kloeCode: 'W3', serviceType: 'AESTHETIC_CLINIC', title: 'Staff wellbeing policy', description: 'Policy supporting staff wellbeing, health and work-life balance', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'W3', serviceType: 'AESTHETIC_CLINIC', title: 'Team meeting records', description: 'Records of regular team meetings demonstrating open communication', category: 'MEETING_MINUTES', sortOrder: 2 },
  { kloeCode: 'W3', serviceType: 'AESTHETIC_CLINIC', title: 'Whistleblowing policy', description: 'Whistleblowing and raising concerns policy with named contact', category: 'POLICY', sortOrder: 3 },

  // W4: Engagement
  { kloeCode: 'W4', serviceType: 'AESTHETIC_CLINIC', title: 'Patient engagement strategy', description: 'Strategy for engaging patients and the public in service development', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'W4', serviceType: 'AESTHETIC_CLINIC', title: 'Staff survey results', description: 'Results from staff satisfaction surveys with action plans', category: 'AUDIT_REPORT', sortOrder: 2 },

  // W5: Learning & Innovation
  { kloeCode: 'W5', serviceType: 'AESTHETIC_CLINIC', title: 'Continuous improvement plan', description: 'Documented plan for continuous improvement with measurable targets', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'W5', serviceType: 'AESTHETIC_CLINIC', title: 'Innovation log', description: 'Log of innovations, service improvements and changes implemented', category: 'CHECKLIST', sortOrder: 2 },

  // W6: Public Confidence
  { kloeCode: 'W6', serviceType: 'AESTHETIC_CLINIC', title: 'CQC registration', description: 'Current CQC registration certificate and statement of purpose', category: 'CERTIFICATE', sortOrder: 1 },
  { kloeCode: 'W6', serviceType: 'AESTHETIC_CLINIC', title: 'Insurance certificates', description: 'Current professional indemnity and public liability insurance certificates', category: 'CERTIFICATE', sortOrder: 2 },
  { kloeCode: 'W6', serviceType: 'AESTHETIC_CLINIC', title: 'Annual report', description: 'Annual report/review demonstrating transparency and accountability', category: 'AUDIT_REPORT', sortOrder: 3 },
];

const CARE_HOME_EVIDENCE: EvidenceReqDef[] = [
  // S1: Safeguarding
  { kloeCode: 'S1', serviceType: 'CARE_HOME', title: 'Safeguarding adults policy', description: 'Safeguarding adults policy aligned with local authority safeguarding procedures', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'S1', serviceType: 'CARE_HOME', title: 'DBS check records', description: 'Enhanced DBS checks for all staff including volunteers', category: 'CERTIFICATE', sortOrder: 2 },
  { kloeCode: 'S1', serviceType: 'CARE_HOME', title: 'Safeguarding referral log', description: 'Log of all safeguarding referrals made to the local authority', category: 'INCIDENT_LOG', sortOrder: 3 },

  // S2: Risk Management
  { kloeCode: 'S2', serviceType: 'CARE_HOME', title: 'Individual resident risk assessments', description: 'Person-centred risk assessments for each resident covering falls, skin integrity, nutrition', category: 'RISK_ASSESSMENT', sortOrder: 1 },
  { kloeCode: 'S2', serviceType: 'CARE_HOME', title: 'Organisational risk register', description: 'Active risk register with escalation framework and regular review schedule', category: 'RISK_ASSESSMENT', sortOrder: 2 },
  { kloeCode: 'S2', serviceType: 'CARE_HOME', title: 'Falls prevention programme', description: 'Falls prevention policy and associated assessment tools', category: 'POLICY', sortOrder: 3 },

  // S3: Medicines Management
  { kloeCode: 'S3', serviceType: 'CARE_HOME', title: 'Medicines management policy', description: 'Policy covering ordering, storage, administration and disposal of medicines', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'S3', serviceType: 'CARE_HOME', title: 'MAR sheets', description: 'Medication Administration Record sheets showing timely and accurate administration', category: 'CHECKLIST', sortOrder: 2 },
  { kloeCode: 'S3', serviceType: 'CARE_HOME', title: 'Medicines audit', description: 'Regular medicines audit results and action plans', category: 'AUDIT_REPORT', sortOrder: 3 },

  // S4: Premises & Equipment
  { kloeCode: 'S4', serviceType: 'CARE_HOME', title: 'Fire safety certificate and drill records', description: 'Fire risk assessment, fire safety certificate and records of regular fire drills', category: 'CERTIFICATE', sortOrder: 1 },
  { kloeCode: 'S4', serviceType: 'CARE_HOME', title: 'Environmental risk assessment', description: 'Assessment of premises including garden, corridors, communal areas and bedrooms', category: 'RISK_ASSESSMENT', sortOrder: 2 },
  { kloeCode: 'S4', serviceType: 'CARE_HOME', title: 'Equipment maintenance schedule', description: 'Maintenance records for hoists, beds, call bells and other care equipment', category: 'CHECKLIST', sortOrder: 3 },

  // S5: Infection Control
  { kloeCode: 'S5', serviceType: 'CARE_HOME', title: 'IPC policy', description: 'Infection prevention and control policy including outbreak management plan', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'S5', serviceType: 'CARE_HOME', title: 'Cleaning schedules and audits', description: 'Cleaning rotas, deep cleaning schedules and environmental audit results', category: 'CHECKLIST', sortOrder: 2 },
  { kloeCode: 'S5', serviceType: 'CARE_HOME', title: 'Laundry and waste management records', description: 'Procedures and records for clinical waste disposal and contaminated laundry', category: 'CHECKLIST', sortOrder: 3 },

  // S6: Lessons Learned
  { kloeCode: 'S6', serviceType: 'CARE_HOME', title: 'Incident and accident log', description: 'Complete log of incidents, accidents and near-misses with investigation outcomes', category: 'INCIDENT_LOG', sortOrder: 1 },
  { kloeCode: 'S6', serviceType: 'CARE_HOME', title: 'Lessons learned register', description: 'Register of lessons learned shared with staff via meetings and supervision', category: 'MEETING_MINUTES', sortOrder: 2 },
  { kloeCode: 'S6', serviceType: 'CARE_HOME', title: 'Improvement plan', description: 'Action plans showing continuous improvement following incidents', category: 'CHECKLIST', sortOrder: 3 },

  // E1: Evidence-Based Care
  { kloeCode: 'E1', serviceType: 'CARE_HOME', title: 'Person-centred care plans', description: 'Comprehensive care plans for each resident reflecting their needs and preferences', category: 'PATIENT_RECORD', sortOrder: 1 },
  { kloeCode: 'E1', serviceType: 'CARE_HOME', title: 'Pre-admission assessment', description: 'Thorough pre-admission assessments ensuring needs can be met', category: 'RISK_ASSESSMENT', sortOrder: 2 },
  { kloeCode: 'E1', serviceType: 'CARE_HOME', title: 'NICE guidelines compliance', description: 'Evidence of implementing relevant NICE guidelines in care delivery', category: 'POLICY', sortOrder: 3 },

  // E2: Staff Skills & Knowledge
  { kloeCode: 'E2', serviceType: 'CARE_HOME', title: 'Mandatory training matrix', description: 'Training matrix showing compliance with mandatory training requirements for all staff', category: 'TRAINING_RECORD', sortOrder: 1 },
  { kloeCode: 'E2', serviceType: 'CARE_HOME', title: 'Supervision and appraisal records', description: 'Records of regular supervision sessions and annual appraisals for all staff', category: 'TRAINING_RECORD', sortOrder: 2 },
  { kloeCode: 'E2', serviceType: 'CARE_HOME', title: 'Induction programme records', description: 'Evidence of comprehensive induction including Care Certificate completion', category: 'TRAINING_RECORD', sortOrder: 3 },

  // E3: Nutrition & Wellbeing
  { kloeCode: 'E3', serviceType: 'CARE_HOME', title: 'Nutrition and hydration policy', description: 'Policy ensuring nutritional needs are assessed and met, including MUST assessments', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'E3', serviceType: 'CARE_HOME', title: 'Menu plans and dietary records', description: 'Four-weekly menu rotation with evidence of choice and cultural/dietary needs met', category: 'CHECKLIST', sortOrder: 2 },
  { kloeCode: 'E3', serviceType: 'CARE_HOME', title: 'Food and fluid charts', description: 'Fluid and food intake monitoring charts for at-risk residents', category: 'PATIENT_RECORD', sortOrder: 3 },

  // E4: Patient Outcomes
  { kloeCode: 'E4', serviceType: 'CARE_HOME', title: 'Resident outcome measures', description: 'Evidence of measuring resident outcomes including wellbeing and quality of life', category: 'AUDIT_REPORT', sortOrder: 1 },
  { kloeCode: 'E4', serviceType: 'CARE_HOME', title: 'Care plan review records', description: 'Regular care plan reviews with resident and family involvement', category: 'PATIENT_RECORD', sortOrder: 2 },
  { kloeCode: 'E4', serviceType: 'CARE_HOME', title: 'Benchmarking data', description: 'Comparison data with national standards and similar services', category: 'AUDIT_REPORT', sortOrder: 3 },

  // E5: Collaborative Working
  { kloeCode: 'E5', serviceType: 'CARE_HOME', title: 'Multi-agency working records', description: 'Records of collaboration with GPs, district nurses, social workers and other professionals', category: 'MEETING_MINUTES', sortOrder: 1 },
  { kloeCode: 'E5', serviceType: 'CARE_HOME', title: 'Hospital discharge and transfer protocols', description: 'Protocols for safe hospital admission, discharge and transfers', category: 'POLICY', sortOrder: 2 },
  { kloeCode: 'E5', serviceType: 'CARE_HOME', title: 'Handover and communication records', description: 'Structured handover documentation between shifts and teams', category: 'CHECKLIST', sortOrder: 3 },

  // E6: Consent
  { kloeCode: 'E6', serviceType: 'CARE_HOME', title: 'Mental Capacity Act policy', description: 'Policy on Mental Capacity Act including assessment and best interest decisions', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'E6', serviceType: 'CARE_HOME', title: 'DoLS applications and authorisations', description: 'Records of Deprivation of Liberty Safeguards applications and outcomes', category: 'CERTIFICATE', sortOrder: 2 },
  { kloeCode: 'E6', serviceType: 'CARE_HOME', title: 'Consent records', description: 'Records showing consent obtained or best interest decisions documented for each resident', category: 'PATIENT_RECORD', sortOrder: 3 },

  // E7: Clinical Governance
  { kloeCode: 'E7', serviceType: 'CARE_HOME', title: 'Governance meeting minutes', description: 'Regular governance meetings reviewing quality, safety and compliance', category: 'MEETING_MINUTES', sortOrder: 1 },
  { kloeCode: 'E7', serviceType: 'CARE_HOME', title: 'Quality assurance framework', description: 'Framework for monitoring and improving quality of care across the service', category: 'POLICY', sortOrder: 2 },

  // C1: Kindness & Compassion
  { kloeCode: 'C1', serviceType: 'CARE_HOME', title: 'Dignity champion programme', description: 'Evidence of dignity champion roles and their impact on care delivery', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'C1', serviceType: 'CARE_HOME', title: 'Resident satisfaction surveys', description: 'Regular resident and family satisfaction surveys with analysis and actions', category: 'AUDIT_REPORT', sortOrder: 2 },
  { kloeCode: 'C1', serviceType: 'CARE_HOME', title: 'Compliments and thank you records', description: 'Log of compliments received demonstrating positive care experiences', category: 'CHECKLIST', sortOrder: 3 },

  // C2: Patient Involvement
  { kloeCode: 'C2', serviceType: 'CARE_HOME', title: 'Residents meetings records', description: 'Minutes from regular residents meetings showing their input into service delivery', category: 'MEETING_MINUTES', sortOrder: 1 },
  { kloeCode: 'C2', serviceType: 'CARE_HOME', title: 'Advocacy access records', description: 'Evidence of providing access to independent advocacy services', category: 'CHECKLIST', sortOrder: 2 },

  // C3: Privacy & Dignity
  { kloeCode: 'C3', serviceType: 'CARE_HOME', title: 'Privacy and dignity policy', description: 'Policy covering personal care, private space and confidentiality', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'C3', serviceType: 'CARE_HOME', title: 'GDPR compliance records', description: 'Data protection impact assessments and processing records', category: 'POLICY', sortOrder: 2 },
  { kloeCode: 'C3', serviceType: 'CARE_HOME', title: 'Personal belongings policy', description: 'Policy for safeguarding residents personal possessions and finances', category: 'POLICY', sortOrder: 3 },

  // R1: Service Planning
  { kloeCode: 'R1', serviceType: 'CARE_HOME', title: 'Admissions policy', description: 'Clear admissions criteria and process ensuring needs can be met', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'R1', serviceType: 'CARE_HOME', title: 'Activities programme', description: 'Varied activities programme reflecting residents interests and abilities', category: 'CHECKLIST', sortOrder: 2 },
  { kloeCode: 'R1', serviceType: 'CARE_HOME', title: 'Equality and diversity policy', description: 'Policy ensuring services meet the diverse needs of residents', category: 'POLICY', sortOrder: 3 },

  // R2: Complaints Handling
  { kloeCode: 'R2', serviceType: 'CARE_HOME', title: 'Complaints procedure', description: 'Accessible complaints procedure displayed in the home and provided to residents/families', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'R2', serviceType: 'CARE_HOME', title: 'Complaints and concerns log', description: 'Log of all complaints and concerns with investigation outcomes', category: 'INCIDENT_LOG', sortOrder: 2 },
  { kloeCode: 'R2', serviceType: 'CARE_HOME', title: 'Complaints trend analysis', description: 'Regular analysis of complaints identifying themes and driving improvements', category: 'AUDIT_REPORT', sortOrder: 3 },

  // R3: End of Life / Access
  { kloeCode: 'R3', serviceType: 'CARE_HOME', title: 'End of life care policy', description: 'Policy for delivering compassionate end of life care', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'R3', serviceType: 'CARE_HOME', title: 'Advance care plans', description: 'Advance care plans and DNACPR decisions documented and reviewed', category: 'PATIENT_RECORD', sortOrder: 2 },
  { kloeCode: 'R3', serviceType: 'CARE_HOME', title: 'Palliative care training records', description: 'Records of staff training in end of life and palliative care', category: 'TRAINING_RECORD', sortOrder: 3 },

  // W1: Vision & Strategy
  { kloeCode: 'W1', serviceType: 'CARE_HOME', title: 'Service development plan', description: 'Documented plan for service development with clear targets and timelines', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'W1', serviceType: 'CARE_HOME', title: 'Vision and values statement', description: 'Published vision, mission and values communicated throughout the service', category: 'POLICY', sortOrder: 2 },

  // W2: Governance & Performance
  { kloeCode: 'W2', serviceType: 'CARE_HOME', title: 'Registered manager governance records', description: 'Evidence of registered manager oversight including Regulation 18 notifications', category: 'AUDIT_REPORT', sortOrder: 1 },
  { kloeCode: 'W2', serviceType: 'CARE_HOME', title: 'Quality assurance audits', description: 'Internal audit programme results covering all aspects of service delivery', category: 'AUDIT_REPORT', sortOrder: 2 },
  { kloeCode: 'W2', serviceType: 'CARE_HOME', title: 'Provider information return', description: 'CQC Provider Information Return and any associated action plans', category: 'AUDIT_REPORT', sortOrder: 3 },

  // W3: Culture
  { kloeCode: 'W3', serviceType: 'CARE_HOME', title: 'Staff retention and wellbeing records', description: 'Staff turnover data, exit interview themes and wellbeing initiatives', category: 'AUDIT_REPORT', sortOrder: 1 },
  { kloeCode: 'W3', serviceType: 'CARE_HOME', title: 'Staff meeting records', description: 'Minutes from regular staff meetings demonstrating open culture', category: 'MEETING_MINUTES', sortOrder: 2 },
  { kloeCode: 'W3', serviceType: 'CARE_HOME', title: 'Whistleblowing and freedom to speak up policy', description: 'Policy promoting open culture with named freedom to speak up guardian', category: 'POLICY', sortOrder: 3 },

  // W4: Engagement
  { kloeCode: 'W4', serviceType: 'CARE_HOME', title: 'Relatives and friends engagement', description: 'Evidence of engaging families and friends in care planning and service improvement', category: 'MEETING_MINUTES', sortOrder: 1 },
  { kloeCode: 'W4', serviceType: 'CARE_HOME', title: 'Community links records', description: 'Records of links with local community, schools, faith groups and volunteers', category: 'CHECKLIST', sortOrder: 2 },

  // W5: Learning & Innovation
  { kloeCode: 'W5', serviceType: 'CARE_HOME', title: 'Service improvement plan', description: 'Documented improvement plan with outcomes from audits, feedback and inspections', category: 'POLICY', sortOrder: 1 },
  { kloeCode: 'W5', serviceType: 'CARE_HOME', title: 'Best practice sharing records', description: 'Evidence of sharing and adopting best practice from sector networks', category: 'MEETING_MINUTES', sortOrder: 2 },

  // W6: Public Confidence
  { kloeCode: 'W6', serviceType: 'CARE_HOME', title: 'CQC registration and notifications', description: 'Current CQC registration and evidence of timely statutory notifications', category: 'CERTIFICATE', sortOrder: 1 },
  { kloeCode: 'W6', serviceType: 'CARE_HOME', title: 'Insurance and indemnity certificates', description: 'Current employers liability, public liability and professional indemnity insurance', category: 'CERTIFICATE', sortOrder: 2 },
  { kloeCode: 'W6', serviceType: 'CARE_HOME', title: 'Annual quality account', description: 'Published annual quality report demonstrating performance and transparency', category: 'AUDIT_REPORT', sortOrder: 3 },
];

async function seedEvidenceRequirements() {
  console.log('Seeding Evidence Requirements...');

  const allReqs = [...CLINIC_EVIDENCE, ...CARE_HOME_EVIDENCE];
  let count = 0;

  for (const req of allReqs) {
    const kloeId = KLOE_IDS[req.kloeCode];
    const id = evidenceId(req.kloeCode, req.serviceType, req.sortOrder);

    throwOnError(
      await supabase.from('evidence_requirements').upsert(
        {
          id,
          kloe_id: kloeId,
          service_type: req.serviceType,
          title: req.title,
          description: req.description,
          category: req.category,
          sort_order: req.sortOrder,
        },
        { onConflict: 'id' },
      ),
    );

    count++;
  }

  console.log(`  ✓ ${count} evidence requirements seeded`);
}

// ─── 6. Assessment Questions ────────────────────────────────────────────────

interface AssessmentQuestionDef {
  kloeCode: string;
  serviceType: 'AESTHETIC_CLINIC' | 'CARE_HOME';
  question: string;
  helpText: string;
  questionType: string;
  weight: number;
  sortOrder: number;
}

function questionId(kloe: string, svc: string, order: number): string {
  const kloeNum = parseInt(kloe.replace(/\D/g, ''), 10);
  const domainLetter = kloe.charAt(0).toLowerCase();
  const domainMap: Record<string, number> = { s: 1, e: 2, c: 3, r: 4, w: 5 };
  const d = domainMap[domainLetter] || 0;
  const s = svc === 'AESTHETIC_CLINIC' ? 1 : 2;
  return `aa${s}0000${d}-0000-0000-0000-0000${String(kloeNum).padStart(2, '0')}00${String(order).padStart(4, '0')}`;
}

const CLINIC_QUESTIONS: AssessmentQuestionDef[] = [
  // S1: Safeguarding (4 questions)
  { kloeCode: 'S1', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have a current safeguarding policy that covers adults and children?', helpText: 'The policy should name a safeguarding lead and describe referral procedures.', questionType: 'YES_NO', weight: 2.0, sortOrder: 1 },
  { kloeCode: 'S1', serviceType: 'AESTHETIC_CLINIC', question: 'Have all staff completed DBS checks appropriate to their role?', helpText: 'Enhanced DBS for clinical staff; basic DBS for non-clinical staff with patient contact.', questionType: 'YES_NO', weight: 2.0, sortOrder: 2 },
  { kloeCode: 'S1', serviceType: 'AESTHETIC_CLINIC', question: 'Have all staff completed safeguarding training within the last 12 months?', helpText: 'Level 2 minimum for clinical staff; Level 1 for non-clinical staff.', questionType: 'YES_NO', weight: 1.5, sortOrder: 3 },
  { kloeCode: 'S1', serviceType: 'AESTHETIC_CLINIC', question: 'How confident are you that staff can identify and report safeguarding concerns?', helpText: 'Consider scenario-based testing or supervision discussions.', questionType: 'SCALE', weight: 1.0, sortOrder: 4 },

  // S2: Risk Management (4 questions)
  { kloeCode: 'S2', serviceType: 'AESTHETIC_CLINIC', question: 'Do you conduct individual patient risk assessments before every treatment?', helpText: 'Include medical history, contraindications, allergies and psychological readiness.', questionType: 'YES_NO', weight: 2.0, sortOrder: 1 },
  { kloeCode: 'S2', serviceType: 'AESTHETIC_CLINIC', question: 'Do you maintain an active risk register that is reviewed regularly?', helpText: 'The register should include clinical and non-clinical risks with named owners and review dates.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
  { kloeCode: 'S2', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have a documented protocol for managing adverse events?', helpText: 'Should cover immediate response, escalation to secondary care and patient communication.', questionType: 'YES_NO', weight: 2.0, sortOrder: 3 },
  { kloeCode: 'S2', serviceType: 'AESTHETIC_CLINIC', question: 'Rate the effectiveness of your risk monitoring systems.', helpText: 'Consider whether risks are reviewed, mitigations are tested and new risks are identified proactively.', questionType: 'SCALE', weight: 1.0, sortOrder: 4 },

  // S3: Medicines Management (3 questions)
  { kloeCode: 'S3', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have a prescribing and medicines management policy including PGDs where applicable?', helpText: 'Must cover prescribing, administration, storage, disposal and PGD governance.', questionType: 'YES_NO', weight: 2.0, sortOrder: 1 },
  { kloeCode: 'S3', serviceType: 'AESTHETIC_CLINIC', question: 'Are medicine storage conditions monitored and recorded daily?', helpText: 'Includes fridge temperature monitoring, stock rotation and expiry date checks.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
  { kloeCode: 'S3', serviceType: 'AESTHETIC_CLINIC', question: 'Do you conduct regular medicines audits?', helpText: 'Audits should cover stock control, administration accuracy and prescribing patterns.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // S4: Premises & Equipment (3 questions)
  { kloeCode: 'S4', serviceType: 'AESTHETIC_CLINIC', question: 'Do you hold a current fire safety certificate and conduct regular fire drills?', helpText: 'Fire risk assessment reviewed annually; drills at least every 6 months.', questionType: 'YES_NO', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'S4', serviceType: 'AESTHETIC_CLINIC', question: 'Is all clinical equipment serviced, calibrated and maintained according to manufacturer guidelines?', helpText: 'Includes lasers, IPL, dermal filler storage equipment and sterilisation equipment.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
  { kloeCode: 'S4', serviceType: 'AESTHETIC_CLINIC', question: 'Has a premises risk assessment been completed within the last 12 months?', helpText: 'Should cover health and safety, accessibility, security and clinical environment suitability.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // S5: Infection Control (3 questions)
  { kloeCode: 'S5', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have a comprehensive infection prevention and control (IPC) policy?', helpText: 'Should cover standard precautions, aseptic technique, sharps management and spillage procedures.', questionType: 'YES_NO', weight: 2.0, sortOrder: 1 },
  { kloeCode: 'S5', serviceType: 'AESTHETIC_CLINIC', question: 'Do you conduct regular hand hygiene audits?', helpText: 'WHO 5 Moments for Hand Hygiene framework; minimum quarterly audits.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
  { kloeCode: 'S5', serviceType: 'AESTHETIC_CLINIC', question: 'Are clinical waste disposal and sharps management procedures in place?', helpText: 'Registered waste carrier; compliant sharps bins; documented collection schedule.', questionType: 'YES_NO', weight: 1.5, sortOrder: 3 },

  // S6: Lessons Learned (3 questions)
  { kloeCode: 'S6', serviceType: 'AESTHETIC_CLINIC', question: 'Do you maintain a comprehensive incident log for all adverse events, near-misses and complaints?', helpText: 'All incidents should be logged regardless of severity, with Datix-style categorisation.', questionType: 'YES_NO', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'S6', serviceType: 'AESTHETIC_CLINIC', question: 'Are root cause analyses conducted for significant incidents?', helpText: 'Use structured methodology (5 Whys, fishbone diagrams) for incidents causing harm.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
  { kloeCode: 'S6', serviceType: 'AESTHETIC_CLINIC', question: 'Can you demonstrate improvements made as a result of incidents or complaints?', helpText: 'Show closed-loop learning with documented changes to practice and measurable outcomes.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // E1: Evidence-Based Care (3 questions)
  { kloeCode: 'E1', serviceType: 'AESTHETIC_CLINIC', question: 'Are all treatments delivered according to evidence-based protocols?', helpText: 'Protocols should reference NICE, JCCP, BAD or other recognised clinical guidelines.', questionType: 'YES_NO', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'E1', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have documented patient pathways from consultation to aftercare?', helpText: 'Pathways should cover assessment, informed consent, treatment, recovery and follow-up.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },
  { kloeCode: 'E1', serviceType: 'AESTHETIC_CLINIC', question: 'Are treatment protocols reviewed and updated at least annually?', helpText: 'Reviews should incorporate latest evidence, new guidelines and learning from practice.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // E2: Staff Skills & Knowledge (3 questions)
  { kloeCode: 'E2', serviceType: 'AESTHETIC_CLINIC', question: 'Do all clinical staff hold appropriate qualifications and registrations for the treatments they perform?', helpText: 'Check GMC, NMC, GPhC registration; Level 7 qualifications for advanced procedures.', questionType: 'YES_NO', weight: 2.0, sortOrder: 1 },
  { kloeCode: 'E2', serviceType: 'AESTHETIC_CLINIC', question: 'Is there a training matrix showing all staff training requirements and completion status?', helpText: 'Should cover mandatory training, clinical competencies and CPD requirements.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
  { kloeCode: 'E2', serviceType: 'AESTHETIC_CLINIC', question: 'Do clinical staff maintain CPD records and have these been reviewed?', helpText: 'Minimum 30 hours per year recommended; must include treatment-specific updates.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // E3: Nutrition & Wellbeing (2 questions)
  { kloeCode: 'E3', serviceType: 'AESTHETIC_CLINIC', question: 'Do you provide written aftercare guidance to patients following treatment?', helpText: 'Treatment-specific aftercare with emergency contact details and expected recovery timelines.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'E3', serviceType: 'AESTHETIC_CLINIC', question: 'Do you provide patients with wellbeing information and healthy lifestyle advice?', helpText: 'Include pre-treatment preparation, hydration, sun protection and realistic expectations.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // E4: Patient Outcomes (3 questions)
  { kloeCode: 'E4', serviceType: 'AESTHETIC_CLINIC', question: 'Do you systematically track patient outcomes including satisfaction and complications?', helpText: 'Use validated outcome measures, before/after photography and patient-reported outcomes.', questionType: 'YES_NO', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'E4', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have a post-treatment follow-up protocol?', helpText: 'Protocol should specify follow-up timelines, assessment criteria and escalation pathways.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },
  { kloeCode: 'E4', serviceType: 'AESTHETIC_CLINIC', question: 'Do you conduct regular clinical audits measuring treatment outcomes?', helpText: 'At least annual audit cycle covering complication rates, patient satisfaction and clinical outcomes.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // E5: Collaborative Working (2 questions)
  { kloeCode: 'E5', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have documented referral pathways to other healthcare providers?', helpText: 'Include emergency referral routes, GP communication and specialist referrals.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'E5', serviceType: 'AESTHETIC_CLINIC', question: 'Do you hold regular team meetings to discuss patient care and service delivery?', helpText: 'Minimum monthly meetings with documented minutes and actions.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // E6: Consent (3 questions)
  { kloeCode: 'E6', serviceType: 'AESTHETIC_CLINIC', question: 'Do you obtain written informed consent for all treatments, including a cooling-off period?', helpText: 'Minimum 14-day cooling-off for non-surgical procedures; ensure patients can withdraw consent.', questionType: 'YES_NO', weight: 2.0, sortOrder: 1 },
  { kloeCode: 'E6', serviceType: 'AESTHETIC_CLINIC', question: 'Do consent forms cover all risks, benefits, alternatives and expected outcomes?', helpText: 'Procedure-specific forms using plain language with opportunity for questions.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
  { kloeCode: 'E6', serviceType: 'AESTHETIC_CLINIC', question: 'Do you assess patient capacity to consent and document the assessment?', helpText: 'Mental Capacity Act principles; consider psychological readiness and body dysmorphia screening.', questionType: 'YES_NO', weight: 1.5, sortOrder: 3 },

  // E7: Clinical Governance (2 questions)
  { kloeCode: 'E7', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have a documented clinical governance framework?', helpText: 'Should define structures, accountability, audit programme and quality improvement processes.', questionType: 'YES_NO', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'E7', serviceType: 'AESTHETIC_CLINIC', question: 'Is there a quality management system with regular review cycles?', helpText: 'Includes KPIs, quality dashboards and action plans for improvement areas.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // C1: Kindness & Compassion (3 questions)
  { kloeCode: 'C1', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have a chaperone policy and is it offered to all patients?', helpText: 'Written policy; chaperone offered and documented for intimate examinations.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'C1', serviceType: 'AESTHETIC_CLINIC', question: 'Do you collect and act on patient feedback?', helpText: 'Regular feedback surveys; visible response to feedback; complaints used for learning.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },
  { kloeCode: 'C1', serviceType: 'AESTHETIC_CLINIC', question: 'Rate how well the clinic environment supports patient dignity and comfort.', helpText: 'Consider private consultation rooms, waiting area comfort and noise levels.', questionType: 'SCALE', weight: 1.0, sortOrder: 3 },

  // C2: Patient Involvement (2 questions)
  { kloeCode: 'C2', serviceType: 'AESTHETIC_CLINIC', question: 'Are patients actively involved in decisions about their treatment plan?', helpText: 'Evidence of shared decision making; treatment options discussed; patient preferences documented.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'C2', serviceType: 'AESTHETIC_CLINIC', question: 'Do you provide patients with written information to support their decision making?', helpText: 'Procedure-specific leaflets covering risks, alternatives, recovery and realistic outcomes.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // C3: Privacy & Dignity (2 questions)
  { kloeCode: 'C3', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have appropriate privacy measures in treatment and consultation areas?', helpText: 'Soundproofing, curtains/screens, lockable treatment rooms and separate changing areas.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'C3', serviceType: 'AESTHETIC_CLINIC', question: 'Are all staff trained on GDPR and have signed confidentiality agreements?', helpText: 'Annual GDPR training; signed confidentiality agreements; data breach protocol in place.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // R1: Service Planning (2 questions)
  { kloeCode: 'R1', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have a documented service delivery plan covering capacity and resource allocation?', helpText: 'Plan should address appointment availability, staffing levels and equipment planning.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'R1', serviceType: 'AESTHETIC_CLINIC', question: 'Do you make reasonable adjustments for patients with disabilities or additional needs?', helpText: 'Accessibility audit completed; adjustments documented and communicated to staff.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // R2: Complaints Handling (2 questions)
  { kloeCode: 'R2', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have a documented complaints policy that is accessible to all patients?', helpText: 'Policy displayed in clinic; timescales for acknowledgement and response; escalation routes.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'R2', serviceType: 'AESTHETIC_CLINIC', question: 'Are complaints logged, investigated and used to drive improvements?', helpText: 'Demonstrate closed-loop learning; trend analysis; actions taken as a result of complaints.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // R3: Access & Timeliness (2 questions)
  { kloeCode: 'R3', serviceType: 'AESTHETIC_CLINIC', question: 'Do you monitor and manage patient waiting times?', helpText: 'Track time from initial enquiry to consultation and consultation to treatment.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'R3', serviceType: 'AESTHETIC_CLINIC', question: 'Can patients easily book, cancel and reschedule appointments?', helpText: 'Online booking availability; flexible cancellation policy; out-of-hours contact options.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // W1: Vision & Strategy (2 questions)
  { kloeCode: 'W1', serviceType: 'AESTHETIC_CLINIC', question: 'Does the clinic have a published strategy document with clear objectives?', helpText: 'Should include clinical, operational and quality improvement objectives with timelines.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'W1', serviceType: 'AESTHETIC_CLINIC', question: 'Are the clinic mission and values communicated to all staff?', helpText: 'Values visible in clinic; discussed in induction; referenced in decision making.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // W2: Governance & Performance (3 questions)
  { kloeCode: 'W2', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have a governance framework with clear accountability structures?', helpText: 'Named responsible individuals for quality, safety, safeguarding and complaints.', questionType: 'YES_NO', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'W2', serviceType: 'AESTHETIC_CLINIC', question: 'Are governance meetings held regularly with documented minutes?', helpText: 'At least quarterly meetings reviewing quality metrics, incidents and compliance.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },
  { kloeCode: 'W2', serviceType: 'AESTHETIC_CLINIC', question: 'Do you produce regular quality reports?', helpText: 'Reports covering KPIs, incident trends, complaint analysis and compliance status.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // W3: Culture (2 questions)
  { kloeCode: 'W3', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have a whistleblowing policy and is it known to all staff?', helpText: 'Named contact for raising concerns; assurance of protection; discussed in induction.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'W3', serviceType: 'AESTHETIC_CLINIC', question: 'Do you actively promote staff wellbeing and an open culture?', helpText: 'Staff wellbeing initiatives; regular supervision; open-door management approach.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // W4: Engagement (2 questions)
  { kloeCode: 'W4', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have a patient engagement strategy?', helpText: 'Structured approach to collecting and acting on patient views; patient representatives.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'W4', serviceType: 'AESTHETIC_CLINIC', question: 'Do you conduct staff surveys and act on the results?', helpText: 'Annual staff survey minimum; published results; documented action plans.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // W5: Learning & Innovation (2 questions)
  { kloeCode: 'W5', serviceType: 'AESTHETIC_CLINIC', question: 'Do you have a continuous improvement plan with measurable targets?', helpText: 'Plan linked to governance findings, audit results and patient feedback.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'W5', serviceType: 'AESTHETIC_CLINIC', question: 'Can you provide examples of innovations or improvements made in the last 12 months?', helpText: 'New technologies, process improvements, service expansions or quality enhancements.', questionType: 'TEXT', weight: 1.0, sortOrder: 2 },

  // W6: Public Confidence (2 questions)
  { kloeCode: 'W6', serviceType: 'AESTHETIC_CLINIC', question: 'Is your CQC registration current and displayed?', helpText: 'Registration certificate displayed; statement of purpose current; CQC rating visible.', questionType: 'YES_NO', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'W6', serviceType: 'AESTHETIC_CLINIC', question: 'Are all insurance certificates current and available for inspection?', helpText: 'Professional indemnity, public liability and employers liability insurance in date.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
];

const CARE_HOME_QUESTIONS: AssessmentQuestionDef[] = [
  // S1: Safeguarding (3 questions)
  { kloeCode: 'S1', serviceType: 'CARE_HOME', question: 'Do you have an up-to-date safeguarding adults policy aligned with local authority procedures?', helpText: 'Policy should name the safeguarding lead and describe the referral process to the local authority.', questionType: 'YES_NO', weight: 2.0, sortOrder: 1 },
  { kloeCode: 'S1', serviceType: 'CARE_HOME', question: 'Do all staff have enhanced DBS checks including barred list checks?', helpText: 'Enhanced DBS required for all staff; adults barred list for regulated activity roles.', questionType: 'YES_NO', weight: 2.0, sortOrder: 2 },
  { kloeCode: 'S1', serviceType: 'CARE_HOME', question: 'Are safeguarding referrals made promptly and recorded with outcomes?', helpText: 'Log should record date, concern, referral to local authority and outcome.', questionType: 'YES_NO', weight: 1.5, sortOrder: 3 },

  // S2: Risk Management (3 questions)
  { kloeCode: 'S2', serviceType: 'CARE_HOME', question: 'Does every resident have a comprehensive, person-centred risk assessment?', helpText: 'Cover falls, skin integrity, nutrition, moving and handling, behaviour and choking.', questionType: 'YES_NO', weight: 2.0, sortOrder: 1 },
  { kloeCode: 'S2', serviceType: 'CARE_HOME', question: 'Is there a falls prevention programme in place with documented outcomes?', helpText: 'Post-fall protocols; environmental risk reduction; equipment provision.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
  { kloeCode: 'S2', serviceType: 'CARE_HOME', question: 'Rate the effectiveness of your risk management processes.', helpText: 'Consider frequency of review, staff awareness and trend analysis of incidents.', questionType: 'SCALE', weight: 1.0, sortOrder: 3 },

  // S3: Medicines Management (3 questions)
  { kloeCode: 'S3', serviceType: 'CARE_HOME', question: 'Are medicines stored, administered and disposed of in line with NICE guidance?', helpText: 'Correct storage temperatures; trained staff administering; disposal via registered carrier.', questionType: 'YES_NO', weight: 2.0, sortOrder: 1 },
  { kloeCode: 'S3', serviceType: 'CARE_HOME', question: 'Are MAR sheets completed accurately with no gaps or unexplained omissions?', helpText: 'Regular audit of MAR sheets; reasons for non-administration recorded.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
  { kloeCode: 'S3', serviceType: 'CARE_HOME', question: 'Are medicines audits conducted regularly and actions followed up?', helpText: 'Minimum monthly audit; documented findings; evidence actions are completed.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // S4: Premises & Equipment (3 questions)
  { kloeCode: 'S4', serviceType: 'CARE_HOME', question: 'Is the home environment safe, clean and well-maintained for residents?', helpText: 'Consider corridors, bathrooms, gardens, communal areas and individual rooms.', questionType: 'SCALE', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'S4', serviceType: 'CARE_HOME', question: 'Are fire drills conducted regularly and evacuation plans in place for all residents?', helpText: 'Personal emergency evacuation plans (PEEPs) for each resident; quarterly drills.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
  { kloeCode: 'S4', serviceType: 'CARE_HOME', question: 'Is care equipment (hoists, beds, call bells) maintained and serviced regularly?', helpText: 'Documented maintenance schedule; LOLER inspections; call bell response monitoring.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // S5: Infection Control (3 questions)
  { kloeCode: 'S5', serviceType: 'CARE_HOME', question: 'Do you have an IPC policy including an outbreak management plan?', helpText: 'Plan should cover norovirus, COVID-19 and other common care home infections.', questionType: 'YES_NO', weight: 2.0, sortOrder: 1 },
  { kloeCode: 'S5', serviceType: 'CARE_HOME', question: 'Are cleaning schedules in place and environmental audits conducted regularly?', helpText: 'Daily cleaning rotas; deep cleaning programme; documented audit results.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
  { kloeCode: 'S5', serviceType: 'CARE_HOME', question: 'Are laundry and clinical waste handled according to infection control procedures?', helpText: 'Separate streams for soiled/infected laundry; registered waste carrier; sharps protocols.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // S6: Lessons Learned (2 questions)
  { kloeCode: 'S6', serviceType: 'CARE_HOME', question: 'Are all incidents, accidents and near-misses logged and investigated?', helpText: 'Consistent reporting culture; investigations proportionate to severity.', questionType: 'YES_NO', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'S6', serviceType: 'CARE_HOME', question: 'Are lessons learned shared with staff and do they lead to measurable improvements?', helpText: 'Shared in team meetings, supervision and newsletters; documented changes to practice.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // E1: Evidence-Based Care (3 questions)
  { kloeCode: 'E1', serviceType: 'CARE_HOME', question: 'Does every resident have a comprehensive, person-centred care plan?', helpText: 'Care plans should reflect needs, preferences, life history and be co-produced with the resident.', questionType: 'YES_NO', weight: 2.0, sortOrder: 1 },
  { kloeCode: 'E1', serviceType: 'CARE_HOME', question: 'Are care plans reviewed regularly and updated when needs change?', helpText: 'Minimum monthly review; immediate review after incidents or changes in condition.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
  { kloeCode: 'E1', serviceType: 'CARE_HOME', question: 'Are NICE guidelines and best practice frameworks implemented in care delivery?', helpText: 'Relevant NICE guidelines (falls, nutrition, dementia) referenced in policies.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // E2: Staff Skills & Knowledge (3 questions)
  { kloeCode: 'E2', serviceType: 'CARE_HOME', question: 'Do all staff complete mandatory training within required timescales?', helpText: 'Skills for Care core subjects; Care Certificate for new staff within 12 weeks.', questionType: 'YES_NO', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'E2', serviceType: 'CARE_HOME', question: 'Do all staff receive regular supervision and annual appraisals?', helpText: 'Minimum 6-weekly supervision; annual appraisal with development objectives.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },
  { kloeCode: 'E2', serviceType: 'CARE_HOME', question: 'Is there a comprehensive induction programme for new staff?', helpText: 'Structured induction; shadow shifts; competency sign-off; Care Certificate completion.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // E3: Nutrition & Wellbeing (3 questions)
  { kloeCode: 'E3', serviceType: 'CARE_HOME', question: 'Are residents nutritional needs assessed using validated tools (e.g. MUST)?', helpText: 'MUST screening on admission and monthly thereafter; referral to dietitian where needed.', questionType: 'YES_NO', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'E3', serviceType: 'CARE_HOME', question: 'Do residents have a choice of meals that meet cultural and dietary needs?', helpText: 'Four-weekly menu rotation; alternative options; fortified diets where indicated.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },
  { kloeCode: 'E3', serviceType: 'CARE_HOME', question: 'Are food and fluid intake charts maintained for at-risk residents?', helpText: 'Accurate recording; reviewed by senior staff; escalation when intake is poor.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // E4: Patient Outcomes (2 questions)
  { kloeCode: 'E4', serviceType: 'CARE_HOME', question: 'Do you measure and track resident outcomes including quality of life?', helpText: 'Validated tools for wellbeing; falls rates; pressure ulcer incidence; hospital admissions.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'E4', serviceType: 'CARE_HOME', question: 'Are care plan reviews conducted with resident and family involvement?', helpText: 'Residents and their representatives invited to care plan reviews; views documented.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // E5: Collaborative Working (2 questions)
  { kloeCode: 'E5', serviceType: 'CARE_HOME', question: 'Do you work collaboratively with GPs, district nurses and other health professionals?', helpText: 'Regular GP visits; named GP for the home; healthcare professional contact records.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'E5', serviceType: 'CARE_HOME', question: 'Are hospital admissions and discharges managed safely with good communication?', helpText: 'Transfer documentation; pre-discharge meetings; medication reconciliation on return.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // E6: Consent (3 questions)
  { kloeCode: 'E6', serviceType: 'CARE_HOME', question: 'Is mental capacity assessed and documented for residents who lack capacity?', helpText: 'Decision-specific capacity assessments; two-stage test applied correctly.', questionType: 'YES_NO', weight: 2.0, sortOrder: 1 },
  { kloeCode: 'E6', serviceType: 'CARE_HOME', question: 'Are DoLS applications submitted and monitored where necessary?', helpText: 'Timely applications; regular review of authorisations; conditions complied with.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
  { kloeCode: 'E6', serviceType: 'CARE_HOME', question: 'Are best interest decisions documented with appropriate people consulted?', helpText: 'Independent mental capacity advocates involved where no family; decisions recorded.', questionType: 'YES_NO', weight: 1.5, sortOrder: 3 },

  // E7: Clinical Governance (2 questions)
  { kloeCode: 'E7', serviceType: 'CARE_HOME', question: 'Are regular governance meetings held reviewing quality and safety data?', helpText: 'Monthly or quarterly meetings; documented agenda covering incidents, audits and compliance.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'E7', serviceType: 'CARE_HOME', question: 'Is there a quality assurance framework driving continuous improvement?', helpText: 'Audit programme; action plans from findings; evidence of measurable improvements.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // C1: Kindness & Compassion (3 questions)
  { kloeCode: 'C1', serviceType: 'CARE_HOME', question: 'Do staff demonstrate kindness, respect and compassion in their interactions with residents?', helpText: 'Observation of care delivery; resident feedback; family comments.', questionType: 'SCALE', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'C1', serviceType: 'CARE_HOME', question: 'Do you conduct resident and family satisfaction surveys regularly?', helpText: 'At least annual survey; results shared with residents; action plans implemented.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },
  { kloeCode: 'C1', serviceType: 'CARE_HOME', question: 'Are dignity champions or similar roles in place within the staff team?', helpText: 'Named champions; influence on care practice; role in training and awareness.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // C2: Patient Involvement (2 questions)
  { kloeCode: 'C2', serviceType: 'CARE_HOME', question: 'Are residents involved in decisions about their daily care and routines?', helpText: 'Choice over getting up/bedtimes, meals, activities; documented in care plan.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'C2', serviceType: 'CARE_HOME', question: 'Are regular residents meetings held and do they influence service delivery?', helpText: 'At least monthly meetings; accessible to all residents; documented outcomes.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // C3: Privacy & Dignity (2 questions)
  { kloeCode: 'C3', serviceType: 'CARE_HOME', question: 'Is residents privacy maintained during personal care and in their private spaces?', helpText: 'Knocking before entering; curtains drawn; respectful language; locked personal storage.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'C3', serviceType: 'CARE_HOME', question: 'Are residents personal possessions and finances safeguarded?', helpText: 'Property records on admission; secure storage; transparent financial management.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // R1: Service Planning (2 questions)
  { kloeCode: 'R1', serviceType: 'CARE_HOME', question: 'Do you offer a varied activities programme that reflects residents interests?', helpText: 'Person-centred activities; one-to-one for those unable to join groups; external trips.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'R1', serviceType: 'CARE_HOME', question: 'Is the admissions process thorough to ensure needs can be met?', helpText: 'Pre-admission assessment; trial visits; needs-matching against current resident profile.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // R2: Complaints Handling (2 questions)
  { kloeCode: 'R2', serviceType: 'CARE_HOME', question: 'Is the complaints procedure accessible and understood by residents and families?', helpText: 'Displayed prominently; available in easy-read; discussed at admission.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'R2', serviceType: 'CARE_HOME', question: 'Are complaints analysed for themes and used to drive improvements?', helpText: 'Quarterly trend analysis; identified themes addressed; outcomes shared.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // R3: End of Life Care (3 questions)
  { kloeCode: 'R3', serviceType: 'CARE_HOME', question: 'Do you provide compassionate end of life care in line with residents wishes?', helpText: 'Advance care plans; preferred place of death; family involvement.', questionType: 'YES_NO', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'R3', serviceType: 'CARE_HOME', question: 'Are advance care plans and DNACPR decisions documented and regularly reviewed?', helpText: 'Plans reviewed with resident/family; accessible to emergency services.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
  { kloeCode: 'R3', serviceType: 'CARE_HOME', question: 'Have staff received end of life and palliative care training?', helpText: 'Training records; access to specialist palliative care advice; syringe driver competencies.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // W1: Vision & Strategy (2 questions)
  { kloeCode: 'W1', serviceType: 'CARE_HOME', question: 'Is there a clear vision and service development plan for the home?', helpText: 'Published plan with objectives; communicated to staff, residents and families.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'W1', serviceType: 'CARE_HOME', question: 'Are the organisation\'s values embedded in day-to-day practice?', helpText: 'Values visible; referenced in supervision and appraisals; evidenced in care delivery.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // W2: Governance & Performance (3 questions)
  { kloeCode: 'W2', serviceType: 'CARE_HOME', question: 'Does the registered manager have effective oversight of quality and safety?', helpText: 'Regular audits; action plans; Reg 18 notifications submitted; provider visits.', questionType: 'YES_NO', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'W2', serviceType: 'CARE_HOME', question: 'Are internal audits conducted regularly covering all areas of service delivery?', helpText: 'Annual audit programme; medication, care planning, IPC, health and safety audits.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },
  { kloeCode: 'W2', serviceType: 'CARE_HOME', question: 'Is the CQC Provider Information Return submitted on time with accurate data?', helpText: 'PIR completed within required timescales; data verified before submission.', questionType: 'YES_NO', weight: 1.0, sortOrder: 3 },

  // W3: Culture (2 questions)
  { kloeCode: 'W3', serviceType: 'CARE_HOME', question: 'Is there an open culture where staff feel safe to raise concerns?', helpText: 'Freedom to speak up guardian; whistleblowing policy; no evidence of blame culture.', questionType: 'SCALE', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'W3', serviceType: 'CARE_HOME', question: 'Are staff supported in their wellbeing and professional development?', helpText: 'Wellbeing initiatives; manageable workloads; career development opportunities.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // W4: Engagement (2 questions)
  { kloeCode: 'W4', serviceType: 'CARE_HOME', question: 'Are families and friends actively engaged in the life of the home?', helpText: 'Open visiting; family events; involvement in care planning and service improvement.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'W4', serviceType: 'CARE_HOME', question: 'Does the home have links with the local community?', helpText: 'Volunteers; intergenerational activities; local events; community partnerships.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // W5: Learning & Innovation (2 questions)
  { kloeCode: 'W5', serviceType: 'CARE_HOME', question: 'Does the service have a documented continuous improvement plan?', helpText: 'Plan driven by audit findings, feedback and incident learning; progress tracked.', questionType: 'YES_NO', weight: 1.0, sortOrder: 1 },
  { kloeCode: 'W5', serviceType: 'CARE_HOME', question: 'Does the home participate in sector networks and share best practice?', helpText: 'Membership of care associations; attendance at conferences; benchmarking.', questionType: 'YES_NO', weight: 1.0, sortOrder: 2 },

  // W6: Public Confidence (2 questions)
  { kloeCode: 'W6', serviceType: 'CARE_HOME', question: 'Is the CQC registration current with statutory notifications submitted on time?', helpText: 'Registration certificate displayed; all notifiable events reported within timescales.', questionType: 'YES_NO', weight: 1.5, sortOrder: 1 },
  { kloeCode: 'W6', serviceType: 'CARE_HOME', question: 'Are all required insurances current and available for inspection?', helpText: 'Employers liability; public liability; professional indemnity where required.', questionType: 'YES_NO', weight: 1.5, sortOrder: 2 },
];

async function seedAssessmentQuestions() {
  console.log('Seeding Assessment Questions...');

  const allQuestions = [...CLINIC_QUESTIONS, ...CARE_HOME_QUESTIONS];
  let count = 0;

  for (const q of allQuestions) {
    const kloeId = KLOE_IDS[q.kloeCode];
    const id = questionId(q.kloeCode, q.serviceType, q.sortOrder);

    throwOnError(
      await supabase.from('assessment_questions').upsert(
        {
          id,
          kloe_id: kloeId,
          service_type: q.serviceType,
          question: q.question,
          help_text: q.helpText,
          question_type: q.questionType,
          weight: q.weight,
          sort_order: q.sortOrder,
        },
        { onConflict: 'id' },
      ),
    );

    count++;
  }

  console.log(`  ✓ ${count} assessment questions seeded`);
}

// ─── 7. Demo Organization + User ───────────────────────────────────────────

async function seedDemoData() {
  console.log('Seeding Demo Organization and User...');

  throwOnError(
    await supabase.from('organizations').upsert(
      {
        id: DEMO_ORG_ID,
        name: 'Consentz Demo Clinic',
        service_type: 'AESTHETIC_CLINIC',
        address: '123 Harley Street',
        city: 'London',
        postcode: 'W1G 6AZ',
        county: 'Greater London',
        phone: '+44 20 7123 4567',
        email: 'info@consentz-demo.com',
        website: 'https://consentz-demo.com',
        registered_manager: 'Dr. Sarah Johnson',
        staff_count: 12,
        operating_hours: 'Mon-Fri 9am-6pm, Sat 9am-1pm',
        subscription_tier: 'professional',
        subscription_status: 'active',
        onboarding_complete: true,
      },
      { onConflict: 'id' },
    ),
  );

  throwOnError(
    await supabase.from('users').upsert(
      {
        id: DEMO_USER_ID,
        supabase_user_id: 'a0000000-0000-4000-8000-000000000001',
        email: 'admin@consentz.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'COMPLIANCE_MANAGER',
        organization_id: DEMO_ORG_ID,
      },
      { onConflict: 'id' },
    ),
  );

  console.log('  ✓ Demo organization seeded');
  console.log('  ✓ Demo user seeded');
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting CQC Compliance Module seed...\n');

  await seedDomains();
  await seedKloes();
  await seedRegulations();
  await seedKloeRegulationMappings();
  await seedEvidenceRequirements();
  await seedAssessmentQuestions();
  await seedDemoData();

  console.log('\n✅ Seed completed successfully!');
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
