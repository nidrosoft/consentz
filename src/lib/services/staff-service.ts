// =============================================================================
// Staff Service — CRUD for staff members with training records
// =============================================================================

import type { StaffMember, TrainingRecord } from '@/types';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';
import { staffStore, trainingStore, generateId } from '@/lib/mock-data/store';
import { paginateArray } from '@/lib/pagination';

interface StaffListParams {
  organizationId: string;
  pagination: PaginationInput;
  filters?: {
    isActive?: boolean;
    department?: string | string[];
    dbsStatus?: string | string[];
  };
}

interface StaffListResult {
  data: StaffMember[];
  meta: PaginationMeta;
}

interface StaffWithTraining extends StaffMember {
  trainingRecords: TrainingRecord[];
}

interface StaffCreateParams {
  organizationId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  startDate: string;
  dbsStatus?: StaffMember['dbsStatus'];
  dbsExpiry?: string;
}

interface StaffUpdateParams {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  dbsStatus?: StaffMember['dbsStatus'];
  dbsExpiry?: string;
  isActive?: boolean;
}

export class StaffService {
  /**
   * List staff members with optional filters and pagination.
   */
  static list(params: StaffListParams): StaffListResult {
    let items = staffStore.getAll();

    // Apply filters
    if (params.filters) {
      const { isActive, department, dbsStatus } = params.filters;

      if (isActive !== undefined) {
        items = items.filter((s) => s.isActive === isActive);
      }

      if (department) {
        const departments = Array.isArray(department) ? department : [department];
        items = items.filter((s) => departments.includes(s.department));
      }

      if (dbsStatus) {
        const statuses = Array.isArray(dbsStatus) ? dbsStatus : [dbsStatus];
        items = items.filter((s) => statuses.includes(s.dbsStatus));
      }
    }

    // Apply search
    if (params.pagination.search) {
      const query = params.pagination.search.toLowerCase();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.role.toLowerCase().includes(query),
      );
    }

    // Sort by name ascending by default
    items.sort((a, b) => a.name.localeCompare(b.name));

    return paginateArray(items, params.pagination);
  }

  /**
   * Get a single staff member by ID, including their training records.
   */
  static getById(id: string): StaffWithTraining | undefined {
    const member = staffStore.getById(id);
    if (!member) return undefined;

    const trainingRecords = trainingStore.filter((t) => t.staffId === id);

    return {
      ...member,
      trainingRecords,
    };
  }

  /**
   * Create a new staff member.
   */
  static create(params: StaffCreateParams): StaffMember {
    const member: StaffMember = {
      id: generateId('staff'),
      name: params.name,
      email: params.email,
      role: params.role,
      department: params.department,
      startDate: params.startDate,
      dbsStatus: params.dbsStatus ?? 'PENDING',
      dbsExpiry: params.dbsExpiry ?? '',
      isActive: true,
    };

    return staffStore.create(member);
  }

  /**
   * Update an existing staff member.
   */
  static update(params: StaffUpdateParams): StaffMember | undefined {
    const existing = staffStore.getById(params.id);
    if (!existing) return undefined;

    const updates: Partial<StaffMember> = {};

    if (params.name !== undefined) updates.name = params.name;
    if (params.email !== undefined) updates.email = params.email;
    if (params.role !== undefined) updates.role = params.role;
    if (params.department !== undefined) updates.department = params.department;
    if (params.dbsStatus !== undefined) updates.dbsStatus = params.dbsStatus;
    if (params.dbsExpiry !== undefined) updates.dbsExpiry = params.dbsExpiry;
    if (params.isActive !== undefined) updates.isActive = params.isActive;

    return staffStore.update(params.id, updates);
  }

  /**
   * Soft-delete a staff member by marking them as inactive.
   */
  static softDelete(id: string): boolean {
    const existing = staffStore.getById(id);
    if (!existing) return false;

    staffStore.update(id, { isActive: false });
    return true;
  }
}
