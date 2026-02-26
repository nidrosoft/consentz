// =============================================================================
// Incident Service — CRUD and filtered listing for incidents
// =============================================================================

import type { Incident, IncidentSeverity, IncidentStatus, IncidentType, DomainSlug } from '@/types';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';
import { incidentStore, generateId } from '@/lib/mock-data/store';
import { paginateArray } from '@/lib/pagination';

interface IncidentListParams {
  organizationId: string;
  pagination: PaginationInput;
  filters?: {
    category?: string | string[];
    severity?: IncidentSeverity | IncidentSeverity[];
    status?: IncidentStatus | IncidentStatus[];
    dateFrom?: string;
    dateTo?: string;
  };
}

interface IncidentListResult {
  data: Incident[];
  meta: PaginationMeta;
}

interface IncidentCreateParams {
  organizationId: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  reportedBy: string;
  category: string;
  incidentType: IncidentType;
  domain: DomainSlug;
}

interface IncidentUpdateParams {
  id: string;
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  category?: string;
  domain?: DomainSlug;
}

export class IncidentService {
  /**
   * List incidents with optional filters and pagination.
   */
  static list(params: IncidentListParams): IncidentListResult {
    let items = incidentStore.getAll();

    // Apply filters
    if (params.filters) {
      const { category, severity, status, dateFrom, dateTo } = params.filters;

      if (category) {
        const categories = Array.isArray(category) ? category : [category];
        items = items.filter((i) => categories.includes(i.category));
      }

      if (severity) {
        const severities = Array.isArray(severity) ? severity : [severity];
        items = items.filter((i) => severities.includes(i.severity));
      }

      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        items = items.filter((i) => statuses.includes(i.status));
      }

      if (dateFrom) {
        const from = new Date(dateFrom).getTime();
        items = items.filter((i) => new Date(i.reportedAt).getTime() >= from);
      }

      if (dateTo) {
        const to = new Date(dateTo).getTime();
        items = items.filter((i) => new Date(i.reportedAt).getTime() <= to);
      }
    }

    // Apply search
    if (params.pagination.search) {
      const query = params.pagination.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.description.toLowerCase().includes(query),
      );
    }

    // Sort by reportedAt descending
    items.sort(
      (a, b) =>
        new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime(),
    );

    return paginateArray(items, params.pagination);
  }

  /**
   * Get a single incident by ID.
   */
  static getById(id: string): Incident | undefined {
    return incidentStore.getById(id);
  }

  /**
   * Create a new incident.
   */
  static create(params: IncidentCreateParams): Incident {
    const incident: Incident = {
      id: generateId('inc'),
      title: params.title,
      description: params.description,
      severity: params.severity,
      status: 'REPORTED',
      reportedBy: params.reportedBy,
      reportedAt: new Date().toISOString(),
      category: params.category,
      incidentType: params.incidentType,
      domain: params.domain,
    };

    return incidentStore.create(incident);
  }

  /**
   * Update an existing incident.
   */
  static update(params: IncidentUpdateParams): Incident | undefined {
    const existing = incidentStore.getById(params.id);
    if (!existing) return undefined;

    const updates: Partial<Incident> = {};

    if (params.title !== undefined) updates.title = params.title;
    if (params.description !== undefined) updates.description = params.description;
    if (params.severity !== undefined) updates.severity = params.severity;
    if (params.status !== undefined) updates.status = params.status;
    if (params.category !== undefined) updates.category = params.category;
    if (params.domain !== undefined) updates.domain = params.domain;

    return incidentStore.update(params.id, updates);
  }
}
