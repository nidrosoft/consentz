import { z } from 'zod';

export const markReadSchema = z.object({
  notificationIds: z.array(z.string()).max(50).optional(),
  markAll: z.boolean().optional().default(false),
});
