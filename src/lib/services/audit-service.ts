// =============================================================================
// Audit Service — Activity logging for all platform actions
// =============================================================================

import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { EntityType } from '@/types';

interface AuditLogParams {
  organizationId: string;
  userId: string;
  action: string;
  entityType: EntityType;
  entityId: string;
  description: string;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  actorName?: string;
}

export class AuditService {
  /**
   * Fire-and-forget activity log entry. Never throws.
   */
  static async log(params: AuditLogParams): Promise<void> {
    try {
      await db.activityLog.create({
        data: {
          organizationId: params.organizationId,
          actorId: params.userId,
          actorName: params.actorName ?? params.userId,
          action: params.action,
          description: params.description,
          entityType: params.entityType,
          entityId: params.entityId,
          previousValues: params.previousValues as Prisma.InputJsonValue ?? undefined,
          newValues: params.newValues as Prisma.InputJsonValue ?? undefined,
        },
      });
    } catch {
      // Fire-and-forget — swallow errors so callers are never disrupted
      console.error('[AuditService] Failed to log activity:', params.action);
    }
  }
}
