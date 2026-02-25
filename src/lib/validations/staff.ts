import { z } from 'zod';
import { shortString, dateStringSchema } from './shared';

export const staffRoleSchema = z.enum([
  'REGISTERED_MANAGER', 'DEPUTY_MANAGER', 'REGISTERED_NURSE', 'SENIOR_CARER',
  'CARE_ASSISTANT', 'PRACTITIONER', 'MEDICAL_DIRECTOR', 'ADMIN', 'DOMESTIC', 'OTHER',
]);

export const createStaffSchema = z.object({
  firstName: shortString(100),
  lastName: shortString(100),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(30).optional(),
  jobTitle: shortString(200),
  staffRole: staffRoleSchema,
  department: z.string().max(100).optional(),
  startDate: dateStringSchema,
  contractType: z.enum(['full_time', 'part_time', 'bank', 'agency']).optional(),
  registrationBody: z.enum(['GMC', 'NMC', 'GPhC', 'GDC', 'HCPC', 'OTHER']).optional(),
  registrationNumber: z.string().max(50).optional(),
  registrationExpiry: dateStringSchema.optional(),
  dbsNumber: z.string().max(20).optional(),
  dbsCertificateDate: dateStringSchema.optional(),
  dbsUpdateService: z.boolean().optional().default(false),
  dbsLevel: z.enum(['basic', 'standard', 'enhanced', 'enhanced_barred']).optional(),
  hasIndemnityInsurance: z.boolean().optional().default(false),
  insuranceProvider: z.string().max(255).optional(),
  insuranceExpiry: dateStringSchema.optional(),
  rightToWorkChecked: z.boolean().optional().default(false),
});

export const updateStaffSchema = createStaffSchema.partial().extend({
  isActive: z.boolean().optional(),
  endDate: dateStringSchema.optional().nullable(),
});

export const staffFilterSchema = z.object({
  staffRole: staffRoleSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  department: z.string().optional(),
  registrationExpiring: z.coerce.boolean().optional(),
});
