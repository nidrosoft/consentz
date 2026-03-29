// =============================================================================
// Audit Service — Activity logging for all platform actions
// =============================================================================

import { getDb } from '@/lib/db';
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
      const client = await getDb();
      await client.from('activity_logs').insert({
        organization_id: params.organizationId,
        actor_id: params.userId,
        actor_name: params.actorName ?? params.userId,
        action: params.action,
        description: params.description,
        entity_type: params.entityType,
        entity_id: params.entityId,
        previous_values: params.previousValues ?? null,
        new_values: params.newValues ?? null,
      });
    } catch {
      console.error('[AuditService] Failed to log activity:', params.action);
    }
  }
}
