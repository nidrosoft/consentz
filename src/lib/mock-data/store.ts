// =============================================================================
// Mutable In-Memory Data Store
// Seeded from mock data. Persists across requests within a dev session.
// Resets on server restart. Replace with Prisma when DB is connected.
// =============================================================================

import type {
  Organization, AppUser, ComplianceScore, ComplianceGap, Task, Evidence,
  Policy, StaffMember, TrainingRecord, Incident, Notification,
  ActivityLogEntry, UpcomingDeadline,
} from '@/types';
import {
  mockOrganization, mockUser, mockComplianceScore, mockGaps, mockTasks,
  mockEvidence, mockPolicies, mockStaff, mockIncidents, mockNotifications,
  mockActivityLog, mockDeadlines,
} from '@/lib/mock-data';

// =============================================================================
// Generic Collection
// =============================================================================

export class Collection<T extends { id: string }> {
  private items: Map<string, T>;

  constructor(seed: T[] = []) {
    this.items = new Map(seed.map((i) => [i.id, i]));
  }

  getAll(): T[] {
    return Array.from(this.items.values());
  }

  getById(id: string): T | undefined {
    return this.items.get(id);
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  create(item: T): T {
    this.items.set(item.id, item);
    return item;
  }

  update(id: string, data: Partial<T>): T | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.items.set(id, updated);
    return updated;
  }

  remove(id: string): boolean {
    return this.items.delete(id);
  }

  count(predicate?: (item: T) => boolean): number {
    return predicate ? this.filter(predicate).length : this.items.size;
  }
}

// =============================================================================
// ID Generation
// =============================================================================

let counter = 1000;

export function generateId(prefix: string): string {
  return `${prefix}-${++counter}`;
}

// =============================================================================
// Assessment Types (not in main types file yet)
// =============================================================================

export interface Assessment {
  id: string;
  organizationId: string;
  userId: string;
  serviceType: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  currentStep: number;
  answers: AssessmentAnswer[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface AssessmentAnswer {
  questionId: string;
  questionText: string;
  step: number;
  domain: string;
  kloeCode?: string;
  answerValue: boolean | string | string[] | number;
  answerType: string;
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  version: string;
  content: string;
  changedBy: string;
  createdAt: string;
}

// =============================================================================
// Store Instances (Module-level singletons)
// =============================================================================

export const organizationStore = new Collection<Organization>([mockOrganization]);
export const userStore = new Collection<AppUser>([mockUser]);
export const complianceScoreStore = { current: { ...mockComplianceScore } };
export const gapStore = new Collection<ComplianceGap>(mockGaps);
export const taskStore = new Collection<Task>(mockTasks);
export const evidenceStore = new Collection<Evidence & { deletedAt?: string }>(
  mockEvidence.map((e) => ({ ...e, deletedAt: undefined })),
);
export const policyStore = new Collection<Policy & { content?: string; isAiGenerated?: boolean; deletedAt?: string }>(
  mockPolicies.map((p) => ({ ...p, content: '', isAiGenerated: false, deletedAt: undefined })),
);
export const staffStore = new Collection<StaffMember>(mockStaff);
export const trainingStore = new Collection<TrainingRecord>([
  { id: 'tr-1', staffId: 'staff-1', courseName: 'Safeguarding Adults', completedDate: '2025-11-15', expiryDate: '2026-11-15', certificateUrl: null, status: 'VALID' },
  { id: 'tr-2', staffId: 'staff-1', courseName: 'Fire Safety', completedDate: '2025-09-01', expiryDate: '2026-09-01', certificateUrl: null, status: 'VALID' },
  { id: 'tr-3', staffId: 'staff-2', courseName: 'Moving & Handling', completedDate: '2025-12-01', expiryDate: '2026-12-01', certificateUrl: null, status: 'VALID' },
  { id: 'tr-4', staffId: 'staff-2', courseName: 'First Aid', completedDate: '2025-06-15', expiryDate: '2026-06-15', certificateUrl: null, status: 'VALID' },
  { id: 'tr-5', staffId: 'staff-3', courseName: 'Fire Safety', completedDate: '2026-02-03', expiryDate: '2027-02-03', certificateUrl: null, status: 'VALID' },
  { id: 'tr-6', staffId: 'staff-3', courseName: 'Infection Control', completedDate: '2025-10-20', expiryDate: '2026-10-20', certificateUrl: null, status: 'VALID' },
  { id: 'tr-7', staffId: 'staff-4', courseName: 'Safeguarding Adults', completedDate: '2025-08-10', expiryDate: '2026-08-10', certificateUrl: null, status: 'VALID' },
  { id: 'tr-8', staffId: 'staff-5', courseName: 'Data Protection', completedDate: '2025-04-01', expiryDate: '2026-04-01', certificateUrl: null, status: 'EXPIRING_SOON' },
]);
export const incidentStore = new Collection<Incident>(mockIncidents);
export const notificationStore = new Collection<Notification>(mockNotifications);
export const activityLogStore = new Collection<ActivityLogEntry>(mockActivityLog);
export const deadlineStore = new Collection<UpcomingDeadline>(mockDeadlines);
export const assessmentStore = new Collection<Assessment>([
  {
    id: 'assess-1',
    organizationId: 'org-1',
    userId: 'user-1',
    serviceType: 'CARE_HOME',
    status: 'COMPLETED',
    currentStep: 4,
    answers: [],
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T12:00:00Z',
    completedAt: '2026-02-01T12:00:00Z',
  },
]);
export const policyVersionStore = new Collection<PolicyVersion>([]);
