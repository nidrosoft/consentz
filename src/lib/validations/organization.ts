import { z } from 'zod';
import { shortString, cqcRatingSchema, dateStringSchema } from './shared';

export const updateOrganizationSchema = z.object({
  name: shortString(255).optional(),
  cqcProviderId: z.string().max(50).optional(),
  cqcLocationId: z.string().max(50).optional(),
  cqcRegisteredName: z.string().max(255).optional(),
  cqcCurrentRating: cqcRatingSchema.optional(),
  cqcLastInspection: dateStringSchema.optional(),
  cqcNextInspection: dateStringSchema.optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  postcode: z.string().max(20).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(255).optional(),
  registeredManager: z.string().max(255).optional(),
  bedCount: z.number().int().positive().max(1000).optional(),
  staffCount: z.number().int().positive().max(5000).optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().email().max(255),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});
