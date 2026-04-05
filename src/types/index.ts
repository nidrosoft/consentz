// =============================================================================
// CQC Compliance Platform - TypeScript Type Definitions
// =============================================================================

export type ServiceType = 'AESTHETIC_CLINIC' | 'CARE_HOME';

export type CqcRating = 'OUTSTANDING' | 'GOOD' | 'REQUIRES_IMPROVEMENT' | 'INADEQUATE' | 'NOT_RATED';

export type GapSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type GapStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_RISK' | 'NOT_APPLICABLE';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'OVERDUE';
export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type PolicyStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export type IncidentSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'NEAR_MISS';
export type IncidentStatus = 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';

export type EvidenceType = 'POLICY' | 'CERTIFICATE' | 'TRAINING_RECORD' | 'AUDIT_REPORT' | 'RISK_ASSESSMENT' | 'MEETING_MINUTES' | 'PHOTO' | 'OTHER';
export type EvidenceStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'PENDING_REVIEW';

export type DomainSlug = 'safe' | 'effective' | 'caring' | 'responsive' | 'well-led';
export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
export type EntityType =
    | 'GAP'
    | 'TASK'
    | 'EVIDENCE'
    | 'POLICY'
    | 'INCIDENT'
    | 'STAFF'
    | 'TRAINING'
    | 'ORGANIZATION'
    | 'ASSESSMENT'
    | 'NOTIFICATION';
export type TrainingStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
export type DbsStatus = 'CLEAR' | 'PENDING' | 'EXPIRED';
export type CredentialStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NOT_APPLICABLE';
export type IncidentType = 'PREMISES' | 'PATIENT_COMPLICATION';

export interface CqcDomain {
  id: string;
  name: string;
  slug: DomainSlug;
  description: string;
  icon: string;
  color: string;
}

export interface DomainScore {
  domainId: string;
  domainName: string;
  slug: DomainSlug;
  score: number;
  rating: CqcRating;
  gapCount: number;
  trend: number;
  kloeCount: number;
}

export interface ComplianceScore {
  overall: number;
  domains: DomainScore[];
  predictedRating: CqcRating;
  lastUpdated: string;
}

export interface ComplianceGap {
  id: string;
  title: string;
  description: string;
  severity: GapSeverity;
  status: GapStatus;
  domain: DomainSlug;
  kloe: string;
  regulation: string;
  createdAt: string;
  remediationSteps?: string[];
  dueDate?: string | null;
  resolutionNotes?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  relatedGapId: string | null;
  // TODO [BACKEND]: Tobe confirmed tasks can relate to multiple domains.
  // When backend endpoints arrive, change to `domains: DomainSlug[]` (like Evidence.linkedDomains)
  // and update all references across services, API routes, and UI components.
  // The DomainBadgeList component already supports rendering multiple domain badges.
  domain: DomainSlug;
}

export interface Evidence {
  id: string;
  name: string;
  type: EvidenceType;
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  expiresAt: string | null;
  linkedDomains: DomainSlug[];
  linkedKloes: string[];
  status: EvidenceStatus;
}

export interface Policy {
  id: string;
  title: string;
  status: PolicyStatus;
  version: string;
  category: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastReviewDate: string;
  nextReviewDate: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  startDate: string;
  dbsStatus: DbsStatus;
  dbsExpiry: string;
  isActive: boolean;
  // Clinic-specific credentials (aesthetic clinics)
  gmcNumber: string | null;
  gmcStatus: CredentialStatus;
  gmcExpiry: string | null;
  aestheticQualification: string | null; // e.g. "Level 7 Diploma in Aesthetic Medicine"
  aestheticQualificationStatus: CredentialStatus;
  aestheticQualificationExpiry: string | null;
  staffType: 'MEDICAL' | 'NON_MEDICAL' | 'ADMINISTRATIVE';
}

export interface TrainingRecord {
  id: string;
  staffId: string;
  courseName: string;
  completedDate: string;
  expiryDate: string;
  certificateUrl: string | null;
  status: TrainingStatus;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedBy: string;
  reportedAt: string;
  category: string;
  incidentType: IncidentType;
  domain: DomainSlug;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actionUrl: string | null;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  user: string;
  createdAt: string;
  entityType: EntityType;
}

export interface Organization {
  id: string;
  name: string;
  serviceType: ServiceType;
  postcode: string;
  cqcProviderId: string;
  cqcLocationId: string;
  registeredManager: string;
  bedCount: number;
  currentRating: CqcRating;
  lastInspection: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER';
  avatar: string | null;
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  dueDate: string;
  type: 'TASK' | 'POLICY_REVIEW' | 'TRAINING_EXPIRY' | 'DBS_RENEWAL' | 'EVIDENCE_EXPIRY';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  relatedEntityId: string;
}
