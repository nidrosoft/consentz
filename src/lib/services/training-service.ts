// =============================================================================
// Training Service — CRUD and training matrix generation
// =============================================================================

import type { TrainingRecord, TrainingStatus } from '@/types';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';
import { trainingStore, staffStore, generateId } from '@/lib/mock-data/store';
import { paginateArray } from '@/lib/pagination';

interface TrainingListParams {
  organizationId: string;
  pagination: PaginationInput;
  filters?: {
    staffId?: string;
    status?: TrainingStatus | TrainingStatus[];
    courseName?: string;
  };
}

interface TrainingListResult {
  data: TrainingRecord[];
  meta: PaginationMeta;
}

interface TrainingCreateParams {
  organizationId: string;
  staffId: string;
  courseName: string;
  completedDate: string;
  expiryDate: string;
  certificateUrl?: string | null;
  status?: TrainingStatus;
}

interface TrainingUpdateParams {
  id: string;
  courseName?: string;
  completedDate?: string;
  expiryDate?: string;
  certificateUrl?: string | null;
  status?: TrainingStatus;
}

interface StaffTrainingEntry {
  courseName: string;
  status: TrainingStatus;
  expiryDate: string;
}

interface TrainingMatrixRow {
  id: string;
  name: string;
  trainings: StaffTrainingEntry[];
}

interface TrainingMatrix {
  staff: TrainingMatrixRow[];
}

export class TrainingService {
  /**
   * List all training records with optional filters and pagination.
   */
  static listAll(params: TrainingListParams): TrainingListResult {
    let items = trainingStore.getAll();

    // Apply filters
    if (params.filters) {
      const { staffId, status, courseName } = params.filters;

      if (staffId) {
        items = items.filter((t) => t.staffId === staffId);
      }

      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        items = items.filter((t) => statuses.includes(t.status));
      }

      if (courseName) {
        const query = courseName.toLowerCase();
        items = items.filter((t) => t.courseName.toLowerCase().includes(query));
      }
    }

    // Apply search
    if (params.pagination.search) {
      const query = params.pagination.search.toLowerCase();
      items = items.filter((t) =>
        t.courseName.toLowerCase().includes(query),
      );
    }

    // Sort by completedDate descending
    items.sort(
      (a, b) =>
        new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime(),
    );

    return paginateArray(items, params.pagination);
  }

  /**
   * Get a single training record by ID.
   */
  static getById(id: string): TrainingRecord | undefined {
    return trainingStore.getById(id);
  }

  /**
   * Create a new training record.
   */
  static create(params: TrainingCreateParams): TrainingRecord {
    const record: TrainingRecord = {
      id: generateId('tr'),
      staffId: params.staffId,
      courseName: params.courseName,
      completedDate: params.completedDate,
      expiryDate: params.expiryDate,
      certificateUrl: params.certificateUrl ?? null,
      status: params.status ?? 'VALID',
    };

    return trainingStore.create(record);
  }

  /**
   * Update an existing training record.
   */
  static update(params: TrainingUpdateParams): TrainingRecord | undefined {
    const existing = trainingStore.getById(params.id);
    if (!existing) return undefined;

    const updates: Partial<TrainingRecord> = {};

    if (params.courseName !== undefined) updates.courseName = params.courseName;
    if (params.completedDate !== undefined) updates.completedDate = params.completedDate;
    if (params.expiryDate !== undefined) updates.expiryDate = params.expiryDate;
    if (params.certificateUrl !== undefined) updates.certificateUrl = params.certificateUrl;
    if (params.status !== undefined) updates.status = params.status;

    return trainingStore.update(params.id, updates);
  }

  /**
   * Delete a training record permanently.
   */
  static delete(id: string): boolean {
    return trainingStore.remove(id);
  }

  /**
   * Generate a training matrix: staff-by-course grid.
   * Each row is a staff member with their training records.
   */
  static getMatrix(organizationId: string): TrainingMatrix {
    const activeStaff = staffStore.filter((s) => s.isActive);
    const allTraining = trainingStore.getAll();

    const staffRows: TrainingMatrixRow[] = activeStaff.map((member) => {
      const memberTrainings = allTraining.filter(
        (t) => t.staffId === member.id,
      );

      const trainings: StaffTrainingEntry[] = memberTrainings.map((t) => ({
        courseName: t.courseName,
        status: t.status,
        expiryDate: t.expiryDate,
      }));

      return {
        id: member.id,
        name: member.name,
        trainings,
      };
    });

    return { staff: staffRows };
  }
}
