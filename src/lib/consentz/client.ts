import type {
  ConsentzClinic,
  ConsentzPatient,
  ConsentzPractitioner,
  ConsentzAppointment,
  ConsentCompletionReport,
  ConsentDecayReport,
  StaffCompetencyReport,
  IncidentFeedReport,
  SafetyChecklistReport,
  PatientFeedbackReport,
  PolicyAcknowledgementReport,
} from './types';

const CONSENTZ_BASE_URL = process.env.CONSENTZ_API_URL || 'https://staging.consentz.com';

export interface ConsentzClientConfig {
  sessionToken: string;
  clinicId: number;
}

export class ConsentzClient {
  private baseUrl: string;
  private sessionToken: string;
  private clinicId: number;

  constructor(config: ConsentzClientConfig) {
    this.baseUrl = CONSENTZ_BASE_URL;
    this.sessionToken = config.sessionToken;
    this.clinicId = config.clinicId;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'X-SESSION-TOKEN': this.sessionToken,
        'X-APPLICATION-ID': 'laptop',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `Consentz API error: ${response.status} ${response.statusText}${errorBody ? ` — ${errorBody}` : ''}`
      );
    }

    return response.json();
  }

  // V1 API methods
  async getPatients(): Promise<ConsentzPatient[]> {
    return this.request('/api/v1/patients');
  }

  async getPatient(id: number): Promise<ConsentzPatient> {
    return this.request(`/api/v1/patients/${id}`);
  }

  async getClinic(): Promise<ConsentzClinic> {
    return this.request('/api/v1/clinic');
  }

  async getPractitioners(): Promise<ConsentzPractitioner[]> {
    return this.request('/api/v1/clinic/practitioners');
  }

  async getTreatments(): Promise<unknown[]> {
    return this.request('/api/v1/clinic/treatments');
  }

  async getAppointments(
    practitionerId: number,
    startDate: string,
    endDate: string
  ): Promise<ConsentzAppointment[]> {
    return this.request(
      `/api/v1/appointments?practitionerId=${practitionerId}&startDate=${startDate}&endDate=${endDate}`
    );
  }

  // CQC Report endpoints
  async getConsentCompletion(startDate?: string, endDate?: string): Promise<ConsentCompletionReport> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const qs = params.toString();
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/consent-completion${qs ? `?${qs}` : ''}`);
  }

  async getConsentDecay(
    startDate: string,
    endDate: string,
    expiringWithinDays = 30,
    showOnlyExpired = 0
  ): Promise<ConsentDecayReport> {
    return this.request(
      `/api/v1/clinic/${this.clinicId}/cqc-reports/consent-decay?startDate=${startDate}&endDate=${endDate}&expiringWithinDays=${expiringWithinDays}&showOnlyExpired=${showOnlyExpired}`
    );
  }

  async getStaffCompetency(): Promise<StaffCompetencyReport> {
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports`);
  }

  async getIncidentFeed(status?: string, severity?: string): Promise<IncidentFeedReport> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (severity) params.set('severity', severity);
    const qs = params.toString();
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/infection-incidents${qs ? `?${qs}` : ''}`);
  }

  async getSafetyChecklist(): Promise<SafetyChecklistReport> {
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/safety-checklist`);
  }

  async getPatientFeedback(from: string, to: string): Promise<PatientFeedbackReport> {
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/patient-feedback?from=${from}&to=${to}`);
  }

  async getPolicyAcknowledgement(): Promise<PolicyAcknowledgementReport> {
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/policy-acknowledgement`);
  }
}
