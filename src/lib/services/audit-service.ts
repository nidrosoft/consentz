// =============================================================================
// Audit Service — Activity logging for all platform actions
// =============================================================================

import type { EntityType } from '@/types';
import { activityLogStore, generateId } from '@/lib/mock-data/store';

interface AuditLogParams {
  organizationId: string;
  userId: string;
  action: string;
  entityType: EntityType;
  entityId: string;
  description: string;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

export class AuditService {
  /**
   * Fire-and-forget activity log entry. Never throws.
   */
  static log(params: AuditLogParams): void {
    try {
      activityLogStore.create({
        id: generateId('log'),
        action: params.action,
        description: params.description,
        user: params.userId,
        createdAt: new Date().toISOString(),
        entityType: params.entityType,
      });
    } catch {
      // Fire-and-forget — swallow errors so callers are never disrupted
      console.error('[AuditService] Failed to log activity:', params.action);
    }
  }
}
