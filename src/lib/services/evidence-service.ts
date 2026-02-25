// =============================================================================
// Evidence Service — CRUD for compliance evidence documents
// =============================================================================

import type { Evidence, EvidenceStatus, EvidenceType, DomainSlug } from '@/types';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';
import { evidenceStore, generateId } from '@/lib/mock-data/store';
import { paginateArray } from '@/lib/pagination';

/** Extended evidence type used internally by the store. */
type StoredEvidence = Evidence & { deletedAt?: string };

interface EvidenceListParams {
  organizationId: string;
  pagination: PaginationInput;
  filters?: {
    category?: EvidenceType | EvidenceType[];
    status?: EvidenceStatus | EvidenceStatus[];
    domain?: DomainSlug | DomainSlug[];
  };
}

interface EvidenceListResult {
  data: Evidence[];
  meta: PaginationMeta;
}

interface EvidenceCreateParams {
  organizationId: string;
  name: string;
  type: EvidenceType;
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  expiresAt?: string | null;
  linkedDomains: DomainSlug[];
  linkedKloes: string[];
  status?: EvidenceStatus;
}

interface EvidenceUpdateParams {
  id: string;
  name?: string;
  type?: EvidenceType;
  expiresAt?: string | null;
  linkedDomains?: DomainSlug[];
  linkedKloes?: string[];
  status?: EvidenceStatus;
}

export class EvidenceService {
  /**
   * List evidence, excluding soft-deleted items.
   */
  static list(params: EvidenceListParams): EvidenceListResult {
    // Filter out deleted items
    let items = evidenceStore.filter(
      (e) => !(e as StoredEvidence).deletedAt,
    );

    // Apply filters
    if (params.filters) {
      const { category, status, domain } = params.filters;

      if (category) {
        const categories = Array.isArray(category) ? category : [category];
        items = items.filter((e) => categories.includes(e.type));
      }

      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        items = items.filter((e) => statuses.includes(e.status));
      }

      if (domain) {
        const domains = Array.isArray(domain) ? domain : [domain];
        items = items.filter((e) =>
          e.linkedDomains.some((d) => domains.includes(d)),
        );
      }
    }

    // Apply search
    if (params.pagination.search) {
      const query = params.pagination.search.toLowerCase();
      items = items.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.fileName.toLowerCase().includes(query),
      );
    }

    // Sort by uploadedAt descending
    items.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    );

    return paginateArray(items, params.pagination);
  }

  /**
   * Get a single evidence item by ID (excluding soft-deleted).
   */
  static getById(id: string): Evidence | undefined {
    const item = evidenceStore.getById(id) as StoredEvidence | undefined;
    if (!item || item.deletedAt) return undefined;
    return item;
  }

  /**
   * Create a new evidence record.
   */
  static create(params: EvidenceCreateParams): Evidence {
    const evidence: StoredEvidence = {
      id: generateId('ev'),
      name: params.name,
      type: params.type,
      fileName: params.fileName,
      fileSize: params.fileSize,
      uploadedBy: params.uploadedBy,
      uploadedAt: new Date().toISOString(),
      expiresAt: params.expiresAt ?? null,
      linkedDomains: params.linkedDomains,
      linkedKloes: params.linkedKloes,
      status: params.status ?? 'VALID',
      deletedAt: undefined,
    };

    return evidenceStore.create(evidence);
  }

  /**
   * Update an existing evidence record.
   */
  static update(params: EvidenceUpdateParams): Evidence | undefined {
    const existing = evidenceStore.getById(params.id) as StoredEvidence | undefined;
    if (!existing || existing.deletedAt) return undefined;

    const updates: Partial<StoredEvidence> = {};

    if (params.name !== undefined) updates.name = params.name;
    if (params.type !== undefined) updates.type = params.type;
    if (params.expiresAt !== undefined) updates.expiresAt = params.expiresAt;
    if (params.linkedDomains !== undefined) updates.linkedDomains = params.linkedDomains;
    if (params.linkedKloes !== undefined) updates.linkedKloes = params.linkedKloes;
    if (params.status !== undefined) updates.status = params.status;

    return evidenceStore.update(params.id, updates);
  }

  /**
   * Soft-delete an evidence record by setting deletedAt.
   */
  static softDelete(id: string): boolean {
    const existing = evidenceStore.getById(id) as StoredEvidence | undefined;
    if (!existing || existing.deletedAt) return false;

    evidenceStore.update(id, { deletedAt: new Date().toISOString() } as Partial<StoredEvidence>);
    return true;
  }
}
