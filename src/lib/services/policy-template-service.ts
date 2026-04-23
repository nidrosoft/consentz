// =============================================================================
// Policy template service.
//
// Sits on top of the `policy_templates` + `policy_template_evidence_map`
// tables seeded from Cura's CQC Cosmetic Clinic Policies & Procedures Manual.
//
// Two responsibilities:
//   1. Query templates (by evidence item, by KLOE, by category) for UI + RAG.
//   2. Render a clinic-personalised DOCX by substituting [CLINIC NAME]-style
//      placeholders with the organisation's metadata.
// =============================================================================

import PizZip from 'pizzip';
import { getDb } from '@/lib/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PolicyTemplate {
  id: string;
  code: string;            // 'CPS-14'
  filename: string;        // 'CPS-14_safeguarding_adults.docx'
  title: string;
  category: string;        // 'CPS'
  categoryLabel: string;   // 'Clinical & Patient Safety'
  policyNumber: number | null;
  section: string | null;
  contentText: string;
  storagePath: string;
  appliesToServiceTypes: string[];
  isSupplementary: boolean;
  charCount: number;
}

export type CoverageStatus = 'covered' | 'partial' | 'via_consentz';

export interface PolicyTemplateWithCoverage extends PolicyTemplate {
  coverageStatus: CoverageStatus;
  coverageNotes: string | null;
}

interface OrgProfile {
  name: string | null;
  cqcRegistrationNumber: string | null;
  cqcRegisteredName: string | null;
  registeredManager: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

interface TemplateRow {
  id: string;
  code: string;
  filename: string;
  title: string;
  category: string;
  category_label: string;
  policy_number: number | null;
  section: string | null;
  content_text: string;
  storage_path: string;
  applies_to_service_types: string[];
  is_supplementary: boolean;
  char_count: number;
}

function rowToTemplate(row: TemplateRow): PolicyTemplate {
  return {
    id: row.id,
    code: row.code,
    filename: row.filename,
    title: row.title,
    category: row.category,
    categoryLabel: row.category_label,
    policyNumber: row.policy_number,
    section: row.section,
    contentText: row.content_text,
    storagePath: row.storage_path,
    appliesToServiceTypes: row.applies_to_service_types,
    isSupplementary: row.is_supplementary,
    charCount: row.char_count,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Return the policy templates that satisfy a given evidence item (e.g. S1-E1),
 * ordered by template code. Includes coverage status from the KLOE map.
 */
export async function getTemplatesForEvidenceItem(
  evidenceItemId: string,
): Promise<PolicyTemplateWithCoverage[]> {
  const db = await getDb();
  const { data, error } = await db
    .from('policy_template_evidence_map')
    .select(`
      coverage_status,
      notes,
      policy_templates!inner (
        id, code, filename, title, category, category_label,
        policy_number, section, content_text, storage_path,
        applies_to_service_types, is_supplementary, char_count
      )
    `)
    .eq('evidence_item_id', evidenceItemId)
    .order('template_code', { ascending: true });
  if (error) throw new Error(`policy template lookup failed: ${error.message}`);

  type MapRow = { coverage_status: CoverageStatus; notes: string | null; policy_templates: TemplateRow };
  return (data as unknown as MapRow[]).map((m) => ({
    ...rowToTemplate(m.policy_templates),
    coverageStatus: m.coverage_status,
    coverageNotes: m.notes,
  }));
}

/**
 * Return all policy templates linked to a KLOE (any evidence item). Useful
 * for RAG context injection when verifying evidence for a KLOE.
 */
export async function getTemplatesForKloe(kloeCode: string): Promise<PolicyTemplateWithCoverage[]> {
  const db = await getDb();
  const { data, error } = await db
    .from('policy_template_evidence_map')
    .select(`
      evidence_item_id,
      coverage_status,
      notes,
      policy_templates!inner (
        id, code, filename, title, category, category_label,
        policy_number, section, content_text, storage_path,
        applies_to_service_types, is_supplementary, char_count
      )
    `)
    .eq('kloe_code', kloeCode);
  if (error) throw new Error(`policy template lookup failed: ${error.message}`);

  type MapRow = { coverage_status: CoverageStatus; notes: string | null; policy_templates: TemplateRow };
  // A template can be linked to multiple evidence items inside a KLOE; dedupe
  // by template code and keep the "strongest" coverage status.
  const rank: Record<CoverageStatus, number> = { covered: 3, via_consentz: 2, partial: 1 };
  const byCode = new Map<string, PolicyTemplateWithCoverage>();
  for (const m of data as unknown as MapRow[]) {
    const existing = byCode.get(m.policy_templates.code);
    if (!existing || rank[m.coverage_status] > rank[existing.coverageStatus]) {
      byCode.set(m.policy_templates.code, {
        ...rowToTemplate(m.policy_templates),
        coverageStatus: m.coverage_status,
        coverageNotes: m.notes,
      });
    }
  }
  return Array.from(byCode.values()).sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Return the raw per-evidence-item template mapping for a KLOE. Same data
 * as `getTemplatesForKloe` but grouped by `evidenceItemId` so the UI can
 * render "Download template" buttons on each evidence row.
 */
export async function getTemplateMapForKloe(
  kloeCode: string,
): Promise<Record<string, PolicyTemplateWithCoverage[]>> {
  const db = await getDb();
  const { data, error } = await db
    .from('policy_template_evidence_map')
    .select(`
      evidence_item_id,
      coverage_status,
      notes,
      policy_templates!inner (
        id, code, filename, title, category, category_label,
        policy_number, section, content_text, storage_path,
        applies_to_service_types, is_supplementary, char_count
      )
    `)
    .eq('kloe_code', kloeCode)
    .order('template_code', { ascending: true });
  if (error) throw new Error(`policy template lookup failed: ${error.message}`);

  type MapRow = { evidence_item_id: string; coverage_status: CoverageStatus; notes: string | null; policy_templates: TemplateRow };
  const grouped: Record<string, PolicyTemplateWithCoverage[]> = {};
  for (const m of data as unknown as MapRow[]) {
    const tpl: PolicyTemplateWithCoverage = {
      ...rowToTemplate(m.policy_templates),
      coverageStatus: m.coverage_status,
      coverageNotes: m.notes,
    };
    (grouped[m.evidence_item_id] ??= []).push(tpl);
  }
  return grouped;
}

/**
 * Return every ingested policy template, ordered by category then code.
 * Used by the `/policies/templates` catalogue.
 */
export async function getAllTemplates(): Promise<PolicyTemplate[]> {
  const db = await getDb();
  const { data, error } = await db
    .from('policy_templates')
    .select('id, code, filename, title, category, category_label, policy_number, section, content_text, storage_path, applies_to_service_types, is_supplementary, char_count')
    .order('category', { ascending: true })
    .order('policy_number', { ascending: true });
  if (error) throw new Error(`policy template list failed: ${error.message}`);
  return (data as TemplateRow[]).map(rowToTemplate);
}

/**
 * Return a single template by code.
 */
export async function getTemplateByCode(code: string): Promise<PolicyTemplate | null> {
  const db = await getDb();
  const { data, error } = await db
    .from('policy_templates')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  if (error) throw new Error(`policy template lookup failed: ${error.message}`);
  return data ? rowToTemplate(data as TemplateRow) : null;
}

// ---------------------------------------------------------------------------
// DOCX placeholder substitution
// ---------------------------------------------------------------------------

/**
 * Build the substitution map. Keys are the literal placeholder strings that
 * appear in Cura's DOCX templates. We ONLY auto-fill clinic-identity fields
 * — date/name/signature/YES-NO/etc. remain in the document for the clinic's
 * manager to complete when adopting the policy.
 */
function buildPlaceholderMap(org: OrgProfile): Record<string, string> {
  const clinicName = org.name ?? '';
  const fullAddress = [org.address, org.city, org.postcode].filter(Boolean).join(', ');
  const addressWithPostcode = fullAddress;
  const emailAndPhone = [org.email, org.phone].filter(Boolean).join(' / ');
  const tradingName = org.cqcRegisteredName ?? org.name ?? '';

  // All variants observed in the manual (case-sensitive, whitespace-normalised).
  const m: Record<string, string> = {
    '[CLINIC NAME]': clinicName,
    '[INSERT CLINIC NAME]': clinicName,
    '[INSERT TRADING NAME OR N/A]': tradingName,
    '[INSERT CQC REGISTRATION NUMBER]': org.cqcRegistrationNumber ?? '',
    '[INSERT REGISTERED MANAGER FULL NAME]': org.registeredManager ?? '',
    '[REGISTERED MANAGER NAME]': org.registeredManager ?? '',
    '[INSERT FULL CLINIC ADDRESS]': fullAddress,
    '[FULL ADDRESS INCLUDING POSTCODE]': addressWithPostcode,
    '[INSERT EMAIL ADDRESS AND TELEPHONE NUMBER]': emailAndPhone,
    '[EMAIL ADDRESS]': org.email ?? '',
    '[TELEPHONE NUMBER]': org.phone ?? '',
    '[WEBSITE]': org.website ?? '',
  };
  // Strip empty substitutions — leaving the placeholder visible is better
  // UX than silently blanking a section.
  for (const k of Object.keys(m)) if (!m[k]) delete m[k];
  return m;
}

/**
 * XML-escape a replacement value.
 */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Apply placeholder substitutions to a single XML file inside the DOCX.
 *
 * Two passes:
 *   1. Direct replace of the literal placeholder (works when the placeholder
 *      sits in a single <w:t> run).
 *   2. "Rejoin" replace — Word sometimes splits a typed placeholder across
 *      multiple <w:t> runs (e.g. "[CLINIC " + "NAME]"). We scan for each
 *      placeholder's characters punctuated by `</w:t>...<w:t ...>` markers
 *      and replace the full span.
 */
function replacePlaceholdersInXml(xml: string, subs: Record<string, string>): string {
  let out = xml;

  // Pass 1: direct replace.
  for (const [placeholder, value] of Object.entries(subs)) {
    if (!out.includes(placeholder)) continue;
    out = out.split(placeholder).join(xmlEscape(value));
  }

  // Pass 2: rejoin split runs. Each placeholder starts with "[" and ends with
  // "]" with only alphanumerics, spaces, and a few punctuation chars between.
  // When Word splits the placeholder, the typical XML looks like:
  //   <w:t>[CLINIC </w:t></w:r><w:r ...><w:t>NAME]</w:t>
  // We build a tolerant regex per placeholder and retry.
  for (const [placeholder, value] of Object.entries(subs)) {
    if (!out.includes(placeholder.charAt(0))) continue;
    const chars = [...placeholder];
    // Build: `\[` + c1 + (optional run-break) + c2 + ... + `\]`
    const pattern = chars
      .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('(?:</w:t>\\s*</w:r>\\s*<w:r[^>]*>\\s*<w:t[^>]*>)?');
    const re = new RegExp(pattern, 'g');
    if (re.test(out)) {
      re.lastIndex = 0;
      out = out.replace(re, xmlEscape(value));
    }
  }

  return out;
}

/**
 * Render a personalised DOCX for the given template + organisation.
 *
 * Returns the raw DOCX bytes ready to stream to the client.
 */
export async function renderPolicyDocxForOrg(
  templateCode: string,
  organizationId: string,
): Promise<{ filename: string; bytes: Buffer } | null> {
  const db = await getDb();

  // Load template + org in parallel.
  const [tplRes, orgRes] = await Promise.all([
    db.from('policy_templates').select('code, filename, storage_path').eq('code', templateCode).maybeSingle(),
    db.from('organizations')
      .select('name, cqc_registration_number, cqc_registered_name, registered_manager, address, city, postcode, email, phone, website')
      .eq('id', organizationId).maybeSingle(),
  ]);

  if (tplRes.error) throw new Error(`template load failed: ${tplRes.error.message}`);
  if (!tplRes.data) return null;
  if (orgRes.error) throw new Error(`org load failed: ${orgRes.error.message}`);

  const tpl = tplRes.data as { code: string; filename: string; storage_path: string };
  const orgRow = (orgRes.data ?? {}) as Record<string, string | null>;

  const org: OrgProfile = {
    name: orgRow.name,
    cqcRegistrationNumber: orgRow.cqc_registration_number,
    cqcRegisteredName: orgRow.cqc_registered_name,
    registeredManager: orgRow.registered_manager,
    address: orgRow.address,
    city: orgRow.city,
    postcode: orgRow.postcode,
    email: orgRow.email,
    phone: orgRow.phone,
    website: orgRow.website,
  };

  // Download the DOCX bytes from storage.
  const download = await db.storage.from('policy-templates').download(tpl.storage_path);
  if (download.error || !download.data) {
    throw new Error(`template download failed: ${download.error?.message ?? 'no data'}`);
  }
  const arrayBuf = await download.data.arrayBuffer();

  const zip = new PizZip(Buffer.from(arrayBuf));
  const subs = buildPlaceholderMap(org);

  // Touch every word/*.xml part (document.xml, headers, footers).
  const files = Object.keys(zip.files).filter(
    (name) => name.startsWith('word/') && name.endsWith('.xml'),
  );
  for (const name of files) {
    const file = zip.file(name);
    if (!file) continue;
    const xml = file.asText();
    const next = replacePlaceholdersInXml(xml, subs);
    if (next !== xml) zip.file(name, next);
  }

  const bytes = zip.generate({ type: 'nodebuffer' });
  // Filename: drop the CPS-14_ prefix slug and use a clean clinic-prefixed name.
  const safeClinic = (org.name ?? 'clinic').replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 40);
  const outName = `${tpl.code}_${safeClinic}.docx`;
  return { filename: outName, bytes };
}
