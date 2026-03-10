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

export interface ConsentCompletionReport {
  totalAppointments: number;
  consentedAppointments: number;
  completionRate: number;
  breakdown: {
    sameDayConsent: number;
    existingConsent: number;
    partialConsent: number;
    noConsent: number;
  };
  period: { startDate: string; endDate: string };
}

export interface ConsentDecayItem {
  patientId: number;
  patientName: string;
  treatment: string;
  consentDate: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'expiring' | 'expired';
}

export interface ConsentDecayReport {
  items: ConsentDecayItem[];
  totalExpiring: number;
  totalExpired: number;
}

export interface StaffCompetencyItem {
  practitionerId: number;
  practitionerName: string;
  certificates: {
    name: string;
    expiryDate: string;
    status: 'valid' | 'expiring_30' | 'expiring_60' | 'expiring_90' | 'overdue';
    daysUntilExpiry: number;
  }[];
}

export interface StaffCompetencyReport {
  staff: StaffCompetencyItem[];
  summary: {
    totalCertificates: number;
    valid: number;
    expiring30: number;
    expiring60: number;
    expiring90: number;
    overdue: number;
  };
}

export interface IncidentFeedItem {
  id: number;
  type: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  patientId?: number;
  patientName?: string;
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  isRepeatPatient: boolean;
}

export interface IncidentFeedReport {
  incidents: IncidentFeedItem[];
  summary: {
    total: number;
    open: number;
    investigating: number;
    resolved: number;
    byType: Record<string, number>;
  };
}

export interface SafetyChecklistItem {
  id: number;
  category: string;
  item: string;
  status: 'completed' | 'overdue' | 'blocked';
  lastCompleted?: string;
  nextDue?: string;
  blockers?: string[];
}

export interface SafetyChecklistReport {
  items: SafetyChecklistItem[];
  summary: {
    completed: number;
    overdue: number;
    blocked: number;
    complianceRate: number;
  };
}

export interface PatientFeedbackItem {
  id: number;
  patientId?: number;
  rating: number;
  comment: string;
  themes: string[];
  date: string;
  isNegative: boolean;
}

export interface PatientFeedbackReport {
  feedback: PatientFeedbackItem[];
  summary: {
    averageRating: number;
    totalResponses: number;
    distribution: Record<number, number>;
    topThemes: { theme: string; count: number }[];
    negativeCount: number;
  };
}

export interface PolicyAcknowledgementItem {
  policyId: number;
  policyName: string;
  totalStaff: number;
  signedStaff: number;
  completionRate: number;
  unsigned: { name: string; email: string }[];
}

export interface PolicyAcknowledgementReport {
  policies: PolicyAcknowledgementItem[];
  overallCompletionRate: number;
}
