// =============================================================================
// Document Text Extraction Service
// Extracts readable text from PDF, DOCX, DOC, XLSX, XLS, CSV, and images.
// Server-side only — used by the evidence verification API.
// =============================================================================

import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

const MAX_TEXT_LENGTH = 80_000; // ~20k tokens — enough for Claude analysis

export type SupportedMimeType =
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'text/csv'
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp';

const EXTRACTABLE_TYPES = new Set<string>([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

const IMAGE_TYPES = new Set<string>([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export function isExtractableType(mimeType: string): boolean {
  return EXTRACTABLE_TYPES.has(mimeType);
}

export function isImageType(mimeType: string): boolean {
  return IMAGE_TYPES.has(mimeType);
}

export interface ExtractionResult {
  text: string;
  pageCount?: number;
  truncated: boolean;
  method: 'pdf' | 'docx' | 'csv' | 'xlsx' | 'image-ocr' | 'unsupported';
}

/**
 * Extract text content from a document buffer.
 * Returns the extracted text, page count (if applicable), and whether content was truncated.
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
  fileName?: string,
): Promise<ExtractionResult> {
  try {
    if (mimeType === 'application/pdf') {
      return await extractPdf(buffer);
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      return await extractDocx(buffer);
    }

    if (mimeType === 'text/csv') {
      return extractCsv(buffer);
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel'
    ) {
      return extractXlsx(buffer);
    }

    if (IMAGE_TYPES.has(mimeType)) {
      return {
        text: '',
        truncated: false,
        method: 'image-ocr',
      };
    }

    return {
      text: '',
      truncated: false,
      method: 'unsupported',
    };
  } catch (err) {
    console.error(`[DocumentExtractor] Failed to extract text from ${fileName ?? mimeType}:`, err);
    return {
      text: '',
      truncated: false,
      method: 'unsupported',
    };
  }
}

// ---------------------------------------------------------------------------
// PDF extraction
// ---------------------------------------------------------------------------

async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  const text = result.text?.trim() ?? '';
  const pageCount = result.pages?.length ?? undefined;
  const truncated = text.length > MAX_TEXT_LENGTH;

  await parser.destroy().catch(() => {});

  return {
    text: truncated ? text.slice(0, MAX_TEXT_LENGTH) : text,
    pageCount,
    truncated,
    method: 'pdf',
  };
}

// ---------------------------------------------------------------------------
// DOCX extraction (also handles .doc loosely via mammoth)
// ---------------------------------------------------------------------------

async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value?.trim() ?? '';
  const truncated = text.length > MAX_TEXT_LENGTH;

  return {
    text: truncated ? text.slice(0, MAX_TEXT_LENGTH) : text,
    truncated,
    method: 'docx',
  };
}

// ---------------------------------------------------------------------------
// CSV extraction — plain text decode
// ---------------------------------------------------------------------------

function extractCsv(buffer: Buffer): ExtractionResult {
  const text = buffer.toString('utf-8').trim();
  const truncated = text.length > MAX_TEXT_LENGTH;

  return {
    text: truncated ? text.slice(0, MAX_TEXT_LENGTH) : text,
    truncated,
    method: 'csv',
  };
}

// ---------------------------------------------------------------------------
// XLSX extraction — row-by-row text using basic parsing
// Uses a lightweight approach: convert each sheet to CSV-like text
// ---------------------------------------------------------------------------

function extractXlsx(buffer: Buffer): ExtractionResult {
  // For XLSX we do a best-effort text extraction
  // We'll try to parse the shared strings from the XLSX zip structure
  // If this fails, we return empty and let Claude use the filename + metadata
  try {
    // XLSX files are ZIP archives. We'll look for shared strings XML.
    // This is a lightweight approach without importing a full xlsx library.
    const textParts: string[] = [];
    const bufStr = buffer.toString('utf-8');

    // Try to find readable text content patterns
    const textMatches = bufStr.match(/<t[^>]*>([^<]+)<\/t>/g);
    if (textMatches) {
      for (const match of textMatches) {
        const inner = match.replace(/<[^>]+>/g, '').trim();
        if (inner) textParts.push(inner);
      }
    }

    const text = textParts.join(' | ').trim();
    const truncated = text.length > MAX_TEXT_LENGTH;

    return {
      text: truncated ? text.slice(0, MAX_TEXT_LENGTH) : text,
      truncated,
      method: 'xlsx',
    };
  } catch {
    return { text: '', truncated: false, method: 'xlsx' };
  }
}
