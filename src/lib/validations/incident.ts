import { z } from 'zod';
import { shortString, longString, dateStringSchema, kloeCodesSchema } from './shared';

export const incidentCategorySchema = z.enum([
  'FALL', 'MEDICATION_ERROR', 'SAFEGUARDING', 'INFECTION', 'PRESSURE_ULCER',
  'INJURY', 'NEAR_MISS', 'COMPLAINT', 'EQUIPMENT_FAILURE', 'MISSING_PERSON', 'DEATH', 'OTHER',
]);

export const incidentSeveritySchema = z.enum(['NEAR_MISS', 'LOW', 'MODERATE', 'SEVERE', 'CRITICAL']);

export const createIncidentSchema = z.object({
  title: shortString(255),
  description: longString(5000),
  category: incidentCategorySchema,
  severity: incidentSeveritySchema,
  occurredAt: dateStringSchema,
  location: z.string().max(200).optional(),
  staffInvolvedIds: z.array(z.string()).max(20).optional().default([]),
  personsInvolved: z.array(z.string().max(200)).max(20).optional().default([]),
  linkedKloes: kloeCodesSchema.optional().default([]),
  requiresNotification: z.boolean().default(false),
  dutyOfCandourApplies: z.boolean().default(false),
});

export const updateIncidentSchema = z.object({
  title: shortString(255).optional(),
  description: longString(5000).optional(),
  status: z.enum(['REPORTED', 'INVESTIGATING', 'RESOLVED', 'CLOSED']).optional(),
  rootCause: longString(5000).optional(),
  actionsTaken: longString(5000).optional(),
  lessonsLearned: longString(5000).optional(),
  investigatorId: z.string().optional(),
  notifiedBodies: z.array(z.enum(['CQC', 'LOCAL_AUTHORITY', 'POLICE', 'HSE'])).optional(),
  dutyOfCandourMet: z.boolean().optional(),
});

export const incidentFilterSchema = z.object({
  category: incidentCategorySchema.optional(),
  severity: incidentSeveritySchema.optional(),
  status: z.enum(['REPORTED', 'INVESTIGATING', 'RESOLVED', 'CLOSED']).optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
});
