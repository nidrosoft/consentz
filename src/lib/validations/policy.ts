import { z } from 'zod';
import { shortString, longString, dateStringSchema, kloeCodesSchema, regulationCodesSchema } from './shared';

export const policyStatusSchema = z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']);

export const createPolicySchema = z.object({
  title: shortString(255),
  description: longString(2000).optional(),
  content: z.string().min(1).max(100_000),
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
  templateId: z.string().min(1).max(100),
  customInstructions: z.string().max(2000).optional(),
});

export const policyFilterSchema = z.object({
  status: policyStatusSchema.optional(),
  category: z.string().optional(),
  isAiGenerated: z.coerce.boolean().optional(),
  reviewDueSoon: z.coerce.boolean().optional(),
});
