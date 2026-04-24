import { z } from 'zod';
import { shortString, longString, dateStringSchema, kloeCodesSchema, regulationCodesSchema } from './shared';

export const policyStatusSchema = z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']);

export const createPolicySchema = z.object({
  title: shortString(255),
  description: longString(2000).optional(),
  content: z.string().max(100_000).optional().default(''),
  category: z.string().min(1).max(100),
  linkedKloes: kloeCodesSchema.optional().default([]),
  linkedRegulations: regulationCodesSchema.optional().default([]),
  effectiveDate: dateStringSchema.optional(),
  reviewDate: dateStringSchema.optional(),
});

export const updatePolicySchema = createPolicySchema.partial().extend({
  status: policyStatusSchema.optional(),
});

export const generatePolicySchema = z.object({
  // Either a Cura template code (preferred — uses uploaded DOCX as RAG ground
  // truth) or a legacy free-form templateId string ("Safeguarding Adults Policy").
  // At least one must be supplied; `templateCode` takes precedence when both are present.
  templateId: z.string().min(1).max(100).optional(),
  templateCode: z.string().min(1).max(32).optional(),
  customInstructions: z.string().max(2000).optional(),
}).refine((v) => !!(v.templateCode ?? v.templateId), {
  message: 'Either templateCode or templateId is required',
  path: ['templateId'],
});

export const policyFilterSchema = z.object({
  status: policyStatusSchema.optional(),
  category: z.string().optional(),
  isAiGenerated: z.coerce.boolean().optional(),
  reviewDueSoon: z.coerce.boolean().optional(),
});
