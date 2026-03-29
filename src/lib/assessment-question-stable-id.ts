import { createHash } from "node:crypto";

const PREFIX = "consentz:assessment-question:v1";

/**
 * Deterministic UUID for a canonical assessment question id + service type.
 * Matches rows created by `scripts/seed-full-assessment-bank.ts`.
 */
export function stableAssessmentQuestionUuid(logicalId: string, serviceType: string): string {
  const hash = createHash("sha256").update(`${PREFIX}:${logicalId}:${serviceType}`).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function isUuidString(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}
