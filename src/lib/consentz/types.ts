// ---------------------------------------------------------------------------
// Consentz API Response Types — verified against staging.consentz.com
// ---------------------------------------------------------------------------

export interface ConsentzPatient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  createdAt: string;
}

export interface ConsentzPractitioner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  gmcNumber?: string;
  qualifications: string[];
  isActive: boolean;
}

export interface ConsentzClinic {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  practitioners: ConsentzPractitioner[];
}

export interface ConsentzAppointment {
  id: number;
  patientId: number;
  practitionerId: number;
  treatment: string;
  date: string;
  status: string;
}

export interface ConsentzLoginResponse {
  user: {
    id: number;
    fullName: string;
    username: string;
    email: string;
    sessionToken: string;
    role: string;
    clinic: {
      id: number;
      name: string;
      logo: string;
      background: string;
      clinicRepresentative: string;
    };
  };
}

// ---------------------------------------------------------------------------
// GET /clinic/:clinicId/cqc-reports — Staff Competency
// ---------------------------------------------------------------------------

export interface StaffCompetencyCert {
  id: number;
  staffId: number;
  staffName: string;
  certName: string;
  issuedDate: string;
  expiryDate: string;
  daysToExpiry: number;
  lifespanDays: number;
  statusLabel: string;
  statusColour: string;
  notes: string;
}

export interface StaffCompetencyReport {
  status: string;
  all: StaffCompetencyCert[];
  overdue: StaffCompetencyCert[];
  expiring30: StaffCompetencyCert[];
  expiring60: StaffCompetencyCert[];
  expiring90: StaffCompetencyCert[];
  chartData: { name: string; avgLifespan: number; count: number }[];
  summary: {
    totalCerts: number;
    overdueCount: number;
    expiring30: number;
    expiring60: number;
    expiring90: number;
  };
}

// ---------------------------------------------------------------------------
// GET /clinic/:clinicId/cqc-reports/consent-completion
// ---------------------------------------------------------------------------

export interface ConsentCompletionPatient {
  patientId: number;
  patientName: string;
  appointmentDate: string;
  appointmentDateOnly: string;
  appointmentDateRaw: string;
  treatment: string;
  practitioner: string;
  consentSignedSameDay: string;
  consentStatus: string;
  consentSignedDate: string;
  consentFormName: string;
  preAptPackSent: string;
  signingPractitioner: string;
  witness: string;
  deviceIp: string;
  statusCode: string;
  totalForms: number;
  signedForms: number;
  completionRate: number;
}

export interface ConsentCompletionPeriod {
  period: string;
  data: ConsentCompletionPatient[];
  statistics: {
    total: number;
    sameDayCount: number;
    existingConsentCount: number;
    partialConsentCount: number;
    noConsentCount: number;
    sameDayPercentage: number;
    existingConsentPercentage: number;
    partialConsentPercentage: number;
    noConsentPercentage: number;
    completionRate: number;
  };
}

export interface ConsentCompletionReport {
  status: string;
  data: ConsentCompletionPeriod[];
}

// ---------------------------------------------------------------------------
// GET /clinic/:clinicId/cqc-reports/consent-decay
// ---------------------------------------------------------------------------

export interface ConsentDecayItem {
  patientId: number;
  patientName: string;
  treatment: string;
  consentDate: string;
  expiryDate: string;
  daysRemaining: number;
  status: string;
}

export interface ConsentDecayReport {
  status: string;
  data: ConsentDecayItem[];
  summary: {
    total: number;
    expired: number;
    expiring: number;
  };
}

// ---------------------------------------------------------------------------
// GET /clinic/:clinicId/cqc-reports/infection-incidents
// ---------------------------------------------------------------------------

export interface IncidentFeedItem {
  id: number;
  patientId: number;
  patientName: string;
  incidentType: string;
  severity: string;
  status: string;
  isResolved: boolean;
  notes: string;
  followUpAction: string;
  reportedAt: string;
}

export interface IncidentFeedReport {
  status: string;
  incidents: IncidentFeedItem[];
  repeatPatients: { patientId: number; patientName: string; count: number }[];
  summary: {
    total: number;
    resolved: number;
    unresolved: number;
    repeatPatients: number;
  };
}

// ---------------------------------------------------------------------------
// GET /clinic/:clinicId/cqc-reports/safety-checklist
// ---------------------------------------------------------------------------

export interface SafetyChecklistEvent {
  id: number;
  type: string;
  start: string;
  end: string;
  isPast: boolean;
}

export interface SafetyChecklistReport {
  status: string;
  config: {
    fireDrillEnabled: boolean;
    fireDrillFirstDate: string;
    fireDrillIntervalWeeks: number;
    emergencyKitFirstDate: string;
    emergencyKitIntervalWeeks: number;
  };
  fireDrills: SafetyChecklistEvent[];
  emergencyKits: SafetyChecklistEvent[];
}

// ---------------------------------------------------------------------------
// GET /clinic/:clinicId/cqc-reports/treatment-risk-heatmap
// ---------------------------------------------------------------------------

export interface TreatmentRiskHeatmapReport {
  status: string;
  from: string;
  to: string;
  totalRows: number;
  heatmapData: {
    categories: { x: string[]; y: string[] };
    data: number[][];
  };
  outcomeBreakdown: {
    green: number;
    yellow: number;
    red: number;
  };
}

// ---------------------------------------------------------------------------
// GET /clinic/:clinicId/cqc-reports/patient-feedback (rating scale: 1-10)
// ---------------------------------------------------------------------------

export interface PatientFeedbackItem {
  id: number;
  patientId: number;
  patientName: string;
  rating: number;
  comments: string;
  lowRatingFlagged: boolean;
  sentAt: string;
  completedAt: string;
}

export interface PatientFeedbackReport {
  status: string;
  from: string;
  to: string;
  rollingAvg: number;
  distribution: Record<string, number>;
  feedback: PatientFeedbackItem[];
  lowRated: PatientFeedbackItem[];
  summary: {
    totalResponses: number;
    lowRatedCount: number;
    rollingAvg30Days: number;
  };
}

// ---------------------------------------------------------------------------
// GET /clinic/:clinicId/cqc-reports/policy-acknowledgement
// ---------------------------------------------------------------------------

export interface PolicyAckStaff {
  staffId: number;
  staffName: string;
}

export interface PolicyAcknowledgementItem {
  policyId: number;
  policyName: string;
  expiryDate: string | null;
  daysToExpiry: number | null;
  signedCount: number;
  notSignedCount: number;
  completionPercentage: number;
  signedUsers: PolicyAckStaff[];
  notSignedUsers: PolicyAckStaff[];
}

export interface PolicyAcknowledgementReport {
  status: string;
  policies: PolicyAcknowledgementItem[];
  summary: {
    totalPolicies: number;
    totalAssignmentSlots: number;
    totalSigned: number;
    totalNotSigned: number;
    completionPercentage: number;
  };
}
