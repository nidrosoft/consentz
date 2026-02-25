import { z } from 'zod';
import { serviceTypeSchema, domainSlugSchema, kloeCodeSchema } from './shared';

export const saveAssessmentSchema = z.object({
  assessmentId: z.string().uuid().optional(),
  serviceType: serviceTypeSchema,
  currentStep: z.coerce.number().int().min(1).max(4),
  answers: z.array(z.object({
    questionId: z.string().min(1).max(50),
    questionText: z.string().min(1).max(1000),
    step: z.coerce.number().int().min(1).max(4),
    domain: domainSlugSchema,
    kloeCode: kloeCodeSchema.optional(),
    answerValue: z.union([z.boolean(), z.string(), z.array(z.string()), z.number()]),
    answerType: z.enum(['yes_no', 'yes_no_partial', 'multi_select', 'scale', 'date', 'text']),
  })).min(1).max(100),
});

export type SaveAssessmentInput = z.infer<typeof saveAssessmentSchema>;

export const calculateAssessmentSchema = z.object({
  assessmentId: z.string().uuid(),
});
