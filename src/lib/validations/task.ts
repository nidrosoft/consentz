import { z } from 'zod';
import { shortString, longString, dateStringSchema, domainSlugSchema, kloeCodeSchema } from './shared';

export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE']);
export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createTaskSchema = z.object({
  title: shortString(255),
  description: longString(5000).optional(),
  priority: taskPrioritySchema.default('MEDIUM'),
  domain: domainSlugSchema.optional(),
  kloeCode: kloeCodeSchema.optional(),
  gapId: z.string().optional(),
  assignedToId: z.string().optional(),
  dueDate: dateStringSchema.optional(),
});

export const updateTaskSchema = z.object({
  title: shortString(255).optional(),
  description: longString(5000).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assignedToId: z.string().optional().nullable(),
  dueDate: dateStringSchema.optional().nullable(),
  completionNotes: longString(5000).optional(),
});

export const taskFilterSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assignedToId: z.string().optional(),
  domain: domainSlugSchema.optional(),
  overdue: z.coerce.boolean().optional(),
  source: z.enum(['ASSESSMENT', 'MANUAL', 'AI', 'SYSTEM']).optional(),
});
