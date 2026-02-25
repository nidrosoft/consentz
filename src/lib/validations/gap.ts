import { z } from 'zod';
import { gapStatusSchema, gapSeveritySchema, longString, dateStringSchema, domainSlugSchema } from './shared';

export const updateGapSchema = z.object({
  status: gapStatusSchema,
  resolutionNotes: longString(5000).optional(),
  dueDate: dateStringSchema.optional().nullable(),
});

export const gapFilterSchema = z.object({
  status: gapStatusSchema.optional(),
  severity: gapSeveritySchema.optional(),
  domain: domainSlugSchema.optional(),
  source: z.enum(['assessment', 'monitoring', 'manual', 'ai']).optional(),
});
