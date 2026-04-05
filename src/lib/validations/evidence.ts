import { z } from 'zod';
import { shortString, longString, dateStringSchema, kloeCodesSchema, regulationCodesSchema, domainSlugSchema } from './shared';

export const evidenceCategorySchema = z.enum([
  'POLICY', 'TRAINING_RECORD', 'AUDIT_REPORT', 'RISK_ASSESSMENT',
  'INCIDENT_LOG', 'CERTIFICATE', 'MEETING_MINUTES', 'PATIENT_RECORD',
  'CHECKLIST', 'OTHER',
]);

export const createEvidenceSchema = z.object({
  name: shortString(255),
  description: longString(2000).optional(),
  category: evidenceCategorySchema,
  linkedKloes: kloeCodesSchema.optional().default([]),
  linkedDomains: z.array(domainSlugSchema).optional().default([]),
  linkedRegulations: regulationCodesSchema.optional().default([]),
  validFrom: dateStringSchema.optional(),
  validUntil: dateStringSchema.optional(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  fileUrl: z.string().url(),
  fileName: shortString(255),
  fileType: z.string().max(100),
  fileSize: z.number().int().positive().max(52_428_800),
  storagePath: z.string().max(500),
});

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;

export const updateEvidenceSchema = z.object({
  name: shortString(255).optional(),
  description: longString(2000).optional(),
  category: evidenceCategorySchema.optional(),
  linkedKloes: kloeCodesSchema.optional(),
  linkedRegulations: regulationCodesSchema.optional(),
  validFrom: dateStringSchema.optional().nullable(),
  validUntil: dateStringSchema.optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const evidenceFilterSchema = z.object({
  category: evidenceCategorySchema.optional(),
  status: z.enum(['VALID', 'EXPIRING_SOON', 'EXPIRED', 'PENDING_REVIEW', 'ARCHIVED']).optional(),
  domain: domainSlugSchema.optional(),
  kloeCode: z.string().optional(),
  expiringSoon: z.coerce.boolean().optional(),
});
