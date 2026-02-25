import { z } from 'zod';
import { shortString, dateStringSchema, kloeCodesSchema } from './shared';

export const createTrainingSchema = z.object({
  staffMemberId: z.string(),
  courseName: shortString(255),
  provider: z.string().max(255).optional(),
  category: z.enum(['mandatory', 'statutory', 'professional', 'optional']),
  isMandatory: z.boolean().default(false),
  linkedKloes: kloeCodesSchema.optional().default([]),
  completedDate: dateStringSchema,
  expiryDate: dateStringSchema.optional(),
  certificateUrl: z.string().url().max(1000).optional(),
  score: z.number().min(0).max(100).optional(),
  passed: z.boolean().default(true),
});

export const updateTrainingSchema = createTrainingSchema.partial();

export const trainingFilterSchema = z.object({
  staffMemberId: z.string().optional(),
  category: z.enum(['mandatory', 'statutory', 'professional', 'optional']).optional(),
  expiringSoon: z.coerce.boolean().optional(),
});
