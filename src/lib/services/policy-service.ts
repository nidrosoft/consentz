// =============================================================================
// Policy Service — CRUD, approval workflow, and version history
// =============================================================================

import type { Policy, PolicyStatus } from '@/types';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';
import type { PolicyVersion } from '@/lib/mock-data/store';
import {
  policyStore,
  policyVersionStore,
  generateId,
} from '@/lib/mock-data/store';
import { paginateArray } from '@/lib/pagination';

/** Extended policy type used internally by the store. */
type StoredPolicy = Policy & { content?: string; isAiGenerated?: boolean; deletedAt?: string };

interface PolicyListParams {
  organizationId: string;
  pagination: PaginationInput;
  filters?: {
    status?: PolicyStatus | PolicyStatus[];
    category?: string | string[];
  };
}

interface PolicyListResult {
  data: Policy[];
  meta: PaginationMeta;
}

interface PolicyCreateParams {
  organizationId: string;
  title: string;
  category: string;
  createdBy: string;
  content?: string;
  isAiGenerated?: boolean;
}

interface PolicyUpdateParams {
  id: string;
  title?: string;
  category?: string;
  content?: string;
  status?: PolicyStatus;
}

export class PolicyService {
  /**
   * List policies, excluding soft-deleted items.
   */
  static list(params: PolicyListParams): PolicyListResult {
    // Filter out deleted items
    let items = policyStore.filter(
      (p) => !(p as StoredPolicy).deletedAt,
    );

    // Apply filters
    if (params.filters) {
      const { status, category } = params.filters;

      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        items = items.filter((p) => statuses.includes(p.status));
      }

      if (category) {
        const categories = Array.isArray(category) ? category : [category];
        items = items.filter((p) => categories.includes(p.category));
      }
    }

    // Apply search
    if (params.pagination.search) {
      const query = params.pagination.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query),
      );
    }

    // Sort by updatedAt descending
    items.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    return paginateArray(items, params.pagination);
  }

  /**
   * Get a single policy by ID (excluding soft-deleted).
   */
  static getById(id: string): StoredPolicy | undefined {
    const item = policyStore.getById(id) as StoredPolicy | undefined;
    if (!item || item.deletedAt) return undefined;
    return item;
  }

  /**
   * Create a new policy.
   */
  static create(params: PolicyCreateParams): Policy {
    const now = new Date().toISOString();

    const policy: StoredPolicy = {
      id: generateId('pol'),
      title: params.title,
      status: 'DRAFT' as PolicyStatus,
      version: 'v1.0',
      category: params.category,
      createdBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
      lastReviewDate: '',
      nextReviewDate: '',
      content: params.content ?? '',
      isAiGenerated: params.isAiGenerated ?? false,
      deletedAt: undefined,
    };

    return policyStore.create(policy);
  }

  /**
   * Update an existing policy.
   */
  static update(params: PolicyUpdateParams): Policy | undefined {
    const existing = policyStore.getById(params.id) as StoredPolicy | undefined;
    if (!existing || existing.deletedAt) return undefined;

    const updates: Partial<StoredPolicy> = {
      updatedAt: new Date().toISOString(),
    };

    if (params.title !== undefined) updates.title = params.title;
    if (params.category !== undefined) updates.category = params.category;
    if (params.content !== undefined) updates.content = params.content;
    if (params.status !== undefined) updates.status = params.status;

    return policyStore.update(params.id, updates);
  }

  /**
   * Soft-delete a policy.
   */
  static softDelete(id: string): boolean {
    const existing = policyStore.getById(id) as StoredPolicy | undefined;
    if (!existing || existing.deletedAt) return false;

    policyStore.update(id, { deletedAt: new Date().toISOString() } as Partial<StoredPolicy>);
    return true;
  }

  /**
   * Approve a policy — sets status to APPROVED.
   */
  static approve(id: string): Policy | undefined {
    const existing = policyStore.getById(id) as StoredPolicy | undefined;
    if (!existing || existing.deletedAt) return undefined;

    return policyStore.update(id, {
      status: 'APPROVED' as PolicyStatus,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Publish a policy — sets status to PUBLISHED and creates a version entry.
   */
  static publish(id: string, changedBy: string): Policy | undefined {
    const existing = policyStore.getById(id) as StoredPolicy | undefined;
    if (!existing || existing.deletedAt) return undefined;

    const now = new Date().toISOString();

    // Update policy status
    const updated = policyStore.update(id, {
      status: 'PUBLISHED' as PolicyStatus,
      updatedAt: now,
      lastReviewDate: now,
    });

    // Create version entry
    policyVersionStore.create({
      id: generateId('pv'),
      policyId: id,
      version: existing.version,
      content: existing.content ?? '',
      changedBy,
      createdAt: now,
    });

    return updated;
  }

  /**
   * Get version history for a policy.
   */
  static getVersionHistory(policyId: string): PolicyVersion[] {
    return policyVersionStore
      .filter((v) => v.policyId === policyId)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}
