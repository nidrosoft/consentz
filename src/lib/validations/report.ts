import { z } from 'zod';
import { domainSlugSchema, dateStringSchema } from './shared';

export const generateReportSchema = z.object({
  type: z.enum(['full_compliance', 'domain_summary', 'gap_analysis', 'evidence_summary', 'staff_compliance']),
  domain: domainSlugSchema.optional(),
  dateRange: z.object({
    from: dateStringSchema,
    to: dateStringSchema,
  }).optional(),
});

export const exportSchema = z.object({
  reportType: z.enum([
    'full_compliance', 'domain_summary', 'gap_analysis', 'evidence_summary',
    'staff_compliance', 'training_matrix', 'incident_log', 'inspection_prep',
  ]),
  format: z.enum(['pdf', 'csv']),
  domain: domainSlugSchema.optional(),
});
