// =============================================================================
// Ingest Cura's CQC Cosmetic Clinic Policies & Procedures Manual.
//
// Reads every .docx in the manual folder plus the KLOE_Evidence_Policy_Map.pdf,
// uploads each DOCX to the `policy-templates` Supabase Storage bucket, and
// populates `policy_templates` + `policy_template_evidence_map` tables so the
// app can:
//
//   1. Show "Download Cura template" on every POLICY evidence row.
//   2. Inject authoritative policy content into the AI verification prompt
//      (RAG-lite — we already know the answer thanks to the KLOE map PDF, so
//      there's no need for embeddings/vector search for the primary flow).
//
// Run with:
//   pnpm run seed:policy-templates
//
// Safe to re-run — it upserts by `code` and replaces all map rows per template.
// =============================================================================

/* eslint-disable no-console */
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

// Env is loaded via `tsx --env-file=.env.local` in the package.json script.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const MANUAL_ROOT = resolve(
  process.cwd(),
  'CQC Cosmetic Clinic — Policies & Procedures Manual',
);

// ---------------------------------------------------------------------------
// Category metadata (folder prefix -> human label)
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  GOV: 'Governance & Management',
  CPS: 'Clinical & Patient Safety',
  CSP: 'Clinical & Patient Safety',
  CLP: 'Clinical Practice',
  COM: 'Compliance & Regulatory',
  FIN: 'Financial & Operational',
  SEC: 'Security & Technology',
  MKT: 'Marketing & Communications',
  HWB: 'Health & Wellbeing',
  SPS: 'Special Situations',
  PWI: 'Procedures & Work Instructions',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateRow {
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

interface MapRow {
  template_code: string;
  evidence_item_id: string;
  kloe_code: string;
  coverage_status: 'covered' | 'partial' | 'via_consentz';
  notes: string | null;
}

/**
 * The Cura KLOE map PDF uses evidence IDs like "S1-E1", "C3-E12".
 * The Consentz app's evidence requirement constants use "S1_EV01", "C3_EV12".
 * Normalise to the app format so map rows join directly against the UI.
 */
function normaliseEvidenceItemId(pdfId: string): string {
  // pdfId matches /^([A-Z]\d{1,2})-E(\d{1,2})$/
  const m = pdfId.match(/^([A-Z]\d{1,2})-E(\d{1,2})$/);
  if (!m) return pdfId;
  const kloe = m[1]!;
  const n = m[2]!.padStart(2, '0');
  return `${kloe}_EV${n}`;
}

// Dynamically imported below so this script can still load the app's
// constants in a Node/tsx context without extra config.
let validEvidenceIdsCache: Set<string> | null = null;
async function loadValidEvidenceIds(): Promise<Set<string>> {
  if (validEvidenceIdsCache) return validEvidenceIdsCache;
  const mod = await import('../src/lib/constants/cqc-evidence-requirements');
  const kloes = ['S1','S2','S3','S4','S5','S6','E1','E2','E3','E4','E5','E6','C1','C2','C3','R1','R2','R3','W1','W2','W3','W4','W5','W6'];
  const ids = new Set<string>();
  // Both service types — a policy could in theory apply to either.
  for (const svc of ['AESTHETIC_CLINIC','CARE_HOME'] as const) {
    for (const kloe of kloes) {
      const items = mod.getEvidenceItems(svc, kloe);
      for (const i of items) ids.add(i.id);
    }
  }
  validEvidenceIdsCache = ids;
  return ids;
}

// ---------------------------------------------------------------------------
// Supplementary policies list (from KLOE map PDF — 18 policies with no direct
// evidence slot). These still get ingested so they're downloadable but are
// flagged so the UI can hide them from per-evidence lookups.
// ---------------------------------------------------------------------------

const SUPPLEMENTARY_CODES = new Set([
  'GOV-08', 'GOV-09',
  'FIN-50', 'FIN-51', 'FIN-52', 'FIN-53', 'FIN-54', 'FIN-55', 'FIN-56',
  'MKT-67', 'MKT-69', 'MKT-70', 'MKT-71',
  'HWB-75', 'HWB-76',
  'COM-46', 'COM-47',
  'SPS-82',
]);

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

async function extractDocxText(absPath: string): Promise<string> {
  const buf = await readFile(absPath);
  const res = await mammoth.extractRawText({ buffer: buf });
  // Normalise: collapse 3+ blank lines into 2, trim trailing ws per line.
  return (res.value ?? '')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function parseKloeMapPdf(pdfPath: string): Promise<MapRow[]> {
  const buf = await readFile(pdfPath);
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  const result = await parser.getText();
  await parser.destroy().catch(() => {});
  const text = result.text ?? '';

  // The PDF is laid out as repeated blocks that look like:
  //   S1-\nE1\n<evidence description>\n<policy filenames>\n✅ Covered
  //   S1-\nE2\n...\n❌ Gap
  //
  // We care about Covered / Partial / Via Consentz rows only (Gap rows have
  // no template — the app treats them as manual upload required).
  //
  // Strategy:
  //   1. Scan for evidence refs of the form `<DOMAIN_LETTER><N>-<Em>` which
  //      may be split across lines in the PDF rendering.
  //   2. For each ref, grab everything between it and the next ref (or a
  //      section header) to get the evidence block.
  //   3. Inside the block, find all `XXX-NN_filename.docx` references and
  //      detect the status emoji / text.

  // First, reconstruct refs split across lines — e.g. "S1-\nE1" -> "S1-E1".
  const normalized = text
    .replace(/(\b[SECRW]\d{1,2})-\s*\n\s*(E\d{1,2}\b)/g, '$1-$2')
    .replace(/\r\n/g, '\n');

  // Regex to match every evidence reference in order. The full ref pattern is
  // e.g. S1-E1, S10-E12 (domains: S, E, C, R, W with 1-2 digits; evidence 1-2).
  const refRegex = /\b([SECRW]\d{1,2}-E\d{1,2})\b/g;
  const matches: { ref: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = refRegex.exec(normalized)) !== null) {
    matches.push({ ref: m[1]!, index: m.index });
  }

  if (matches.length === 0) {
    throw new Error('Could not parse any evidence refs from KLOE map PDF');
  }

  // The same evidence ref may appear several times in the PDF (intro prose,
  // main body, summary tables). We want ONLY the main-body row — the one
  // that contains actual policy filenames AND a status emoji. We parse every
  // block, score it, and keep the best candidate per ref.
  type Candidate = { ref: string; block: string; filenames: Set<string>; status: MapRow['coverage_status'] | 'gap'; notes: string | null };
  const bestByRef = new Map<string, Candidate>();

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i]!;
    const next = matches[i + 1];
    const block = normalized.slice(cur.index, next ? next.index : normalized.length);
    const blockFlat = block.replace(/\s+/g, ' ');

    // Status detection — order matters (via_consentz is a subtype of covered).
    let status: MapRow['coverage_status'] | 'gap' = 'gap';
    if (/Covered\s*\(via\s*Consentz\)/i.test(blockFlat)) status = 'via_consentz';
    else if (/⚠\s*Partial|Partial\s*—/i.test(blockFlat)) status = 'partial';
    else if (/✅\s*Covered/i.test(blockFlat)) status = 'covered';
    else if (/❌\s*Gap/i.test(blockFlat)) status = 'gap';
    else continue; // Not a body row (e.g. intro prose mentioning "S1-E1, S1-E2").

    // Filenames — the PDF sometimes wraps them mid-filename (e.g. "COM-\n39_"
    // or "medicines_\nmanagement.docx"). After collapsing all whitespace to
    // single spaces, we allow spaces inside the filename and strip them again
    // when canonicalising. Case-insensitive match so COM-38_CQC_compliance.docx
    // is captured; original case is preserved to match the on-disk filename.
    const fnRegex = /\b([A-Z]{3})-\s*(\d{2})_\s*([A-Za-z][A-Za-z_ ]{0,60}?)\s*\.docx\b/gi;
    const filenames = new Set<string>();
    let fm: RegExpExecArray | null;
    while ((fm = fnRegex.exec(blockFlat)) !== null) {
      const slug = fm[3]!.replace(/\s+/g, ''); // strip any wrapped whitespace
      filenames.add(`${fm[1]!.toUpperCase()}-${fm[2]}_${slug}.docx`);
    }

    // Partial-gap explanatory note.
    const notesMatch = blockFlat.match(/⚠\s*Partial\s*—\s*([^✅⚠❌]+?)(?=\s*$|\s*[A-Z]\d|\s*✅|\s*⚠|\s*❌|\s*Ref\s)/i);
    const notes = notesMatch ? notesMatch[1]!.trim() : null;

    const candidate: Candidate = { ref: cur.ref, block, filenames, status, notes };

    // Keep the candidate with the most filenames; tie-break on lower index.
    const existing = bestByRef.get(cur.ref);
    if (!existing || candidate.filenames.size > existing.filenames.size) {
      bestByRef.set(cur.ref, candidate);
    }
  }

  const validIds = await loadValidEvidenceIds();
  const rows: MapRow[] = [];
  const droppedOrphans: string[] = [];
  for (const c of bestByRef.values()) {
    if (c.status === 'gap') continue; // Gaps have no templates to map.
    const kloeCode = c.ref.split('-')[0]!;
    const normalisedEvidenceId = normaliseEvidenceItemId(c.ref);
    if (!validIds.has(normalisedEvidenceId)) {
      // Cura PDF references an evidence item that doesn't exist in the app's
      // live framework (e.g. S1_EV07). Drop it rather than polluting the DB.
      droppedOrphans.push(`${c.ref} → ${normalisedEvidenceId}`);
      continue;
    }
    for (const fn of c.filenames) {
      const code = fn.split('_')[0]!; // "CPS-14"
      rows.push({
        template_code: code,
        evidence_item_id: normalisedEvidenceId, // app-format: S1_EV01
        kloe_code: kloeCode,
        coverage_status: c.status,
        notes: c.notes,
      });
    }
  }
  if (droppedOrphans.length > 0) {
    console.log(`  Dropped ${droppedOrphans.length} orphan ref(s) not in app framework: ${droppedOrphans.join(', ')}`);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function walkManualForDocx(): Promise<string[]> {
  const entries = await readdir(MANUAL_ROOT, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const subpath = join(MANUAL_ROOT, e.name);
    const sub = await readdir(subpath);
    for (const f of sub) {
      if (f.toLowerCase().endsWith('.docx')) files.push(join(subpath, f));
    }
  }
  return files.sort();
}

function parseFilename(filename: string): {
  code: string;          // 'CPS-14'
  number: number;        // 14
  titleSlug: string;     // 'safeguarding_adults'
  category: string;      // 'CPS'
} | null {
  const m = filename.match(/^([A-Z]{3})-(\d{2})_([a-z_]+)\.docx$/i);
  if (!m) return null;
  return {
    code: `${m[1]!.toUpperCase()}-${m[2]}`,
    number: parseInt(m[2]!, 10),
    titleSlug: m[3]!,
    category: m[1]!.toUpperCase(),
  };
}

function deriveTitleFromContent(content: string, titleSlug: string): string {
  // First non-empty content line after the placeholder logo lines. Cura's
  // template puts the title on the ~3rd-5th real line, e.g.
  //   [ CLINIC LOGO ]
  //   [CLINIC NAME]
  //   CPS-14
  //   Safeguarding Adults & Vulnerable Adults Policy
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 15)) {
    if (/Policy|Procedure|Protocol|Instruction|Management|Strategy|Guidelines/i.test(line)
        && !/^\[.*\]$/.test(line)
        && !/^[A-Z]{3}-\d{2}$/.test(line)) {
      return line;
    }
  }
  // Fallback: prettify the slug.
  return titleSlug
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function main() {
  console.log('→ Scanning manual folder...');
  const docxFiles = await walkManualForDocx();
  console.log(`  Found ${docxFiles.length} DOCX files.`);

  console.log('→ Parsing KLOE map PDF...');
  const mapRows = await parseKloeMapPdf(join(MANUAL_ROOT, 'KLOE_Evidence_Policy_Map.pdf'));
  console.log(`  Parsed ${mapRows.length} template→evidence mappings.`);

  const templatesByCode = new Map<string, TemplateRow>();

  console.log('→ Processing DOCX files + uploading to storage...');
  for (const abs of docxFiles) {
    const fname = basename(abs);
    const parsed = parseFilename(fname);
    if (!parsed) {
      console.warn(`  ! skipping (unparseable filename): ${fname}`);
      continue;
    }

    const content = await extractDocxText(abs);
    const title = deriveTitleFromContent(content, parsed.titleSlug);
    const storagePath = `${parsed.category}/${fname}`;

    // Upload DOCX to storage (upsert).
    const fileBuffer = await readFile(abs);
    const { error: uploadErr } = await supabase.storage
      .from('policy-templates')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      });
    if (uploadErr) {
      console.error(`  ! upload failed for ${fname}: ${uploadErr.message}`);
      continue;
    }

    const row: TemplateRow = {
      code: parsed.code,
      filename: fname,
      title,
      category: parsed.category,
      category_label: CATEGORY_LABELS[parsed.category] ?? parsed.category,
      policy_number: parsed.number,
      section: `Section — ${CATEGORY_LABELS[parsed.category] ?? parsed.category}`,
      content_text: content,
      storage_path: storagePath,
      applies_to_service_types: ['AESTHETIC_CLINIC'],
      is_supplementary: SUPPLEMENTARY_CODES.has(parsed.code),
      char_count: content.length,
    };
    templatesByCode.set(parsed.code, row);
    process.stdout.write('.');
  }
  console.log(`\n  Prepared ${templatesByCode.size} template rows.`);

  console.log('→ Upserting policy_templates...');
  const { error: tplErr } = await supabase
    .from('policy_templates')
    .upsert(Array.from(templatesByCode.values()), { onConflict: 'code' });
  if (tplErr) {
    console.error(`  ! upsert failed: ${tplErr.message}`);
    process.exit(1);
  }
  console.log('  OK');

  // Drop any map rows whose template_code didn't make it into the DB (e.g.
  // filename parsed from PDF but no actual .docx on disk).
  const validMapRows = mapRows.filter((r) => templatesByCode.has(r.template_code));
  const dropped = mapRows.length - validMapRows.length;
  if (dropped > 0) {
    console.warn(`  ! ${dropped} map row(s) reference templates with no DOCX on disk`);
  }

  console.log('→ Replacing policy_template_evidence_map...');
  // Clear existing map rows for the codes we're re-ingesting.
  const codes = Array.from(templatesByCode.keys());
  const { error: delErr } = await supabase
    .from('policy_template_evidence_map')
    .delete()
    .in('template_code', codes);
  if (delErr) {
    console.error(`  ! delete failed: ${delErr.message}`);
    process.exit(1);
  }

  // Dedupe (template_code, evidence_item_id) pairs — the composite PK requires
  // uniqueness and the PDF sometimes lists a filename multiple times.
  const uniqueMap = new Map<string, MapRow>();
  for (const r of validMapRows) {
    uniqueMap.set(`${r.template_code}::${r.evidence_item_id}`, r);
  }

  const { error: insErr } = await supabase
    .from('policy_template_evidence_map')
    .insert(Array.from(uniqueMap.values()));
  if (insErr) {
    console.error(`  ! insert failed: ${insErr.message}`);
    process.exit(1);
  }
  console.log(`  OK — inserted ${uniqueMap.size} mapping rows.`);

  // Summary
  const byStatus = Array.from(uniqueMap.values()).reduce<Record<string, number>>((acc, r) => {
    acc[r.coverage_status] = (acc[r.coverage_status] ?? 0) + 1;
    return acc;
  }, {});
  console.log('\nDone.\n');
  console.log(`  Templates: ${templatesByCode.size}`);
  console.log(`  Supplementary:      ${Array.from(templatesByCode.values()).filter((t) => t.is_supplementary).length}`);
  console.log(`  Evidence mappings:  ${uniqueMap.size}`);
  console.log(`     covered:         ${byStatus.covered ?? 0}`);
  console.log(`     partial:         ${byStatus.partial ?? 0}`);
  console.log(`     via_consentz:    ${byStatus.via_consentz ?? 0}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
