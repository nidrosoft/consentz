import type {
  ConsentzClinic,
  ConsentzPatient,
  ConsentzPractitioner,
  ConsentzAppointment,
  ConsentzLoginResponse,
  ConsentCompletionReport,
  ConsentDecayReport,
  StaffCompetencyReport,
  IncidentFeedReport,
  SafetyChecklistReport,
  TreatmentRiskHeatmapReport,
  PatientFeedbackReport,
  PolicyAcknowledgementReport,
} from './types';

const CONSENTZ_BASE_URL = process.env.CONSENTZ_API_URL || 'https://staging.consentz.com';
const APP_ID = process.env.CONSENTZ_APPLICATION_ID || 'admin';

// ---------------------------------------------------------------------------
// Static-token client (legacy — used by proxy routes)
// ---------------------------------------------------------------------------

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
        'X-APPLICATION-ID': APP_ID,
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
    endDate: string,
  ): Promise<ConsentzAppointment[]> {
    return this.request(
      `/api/v1/appointments?practitionerId=${practitionerId}&startDate=${startDate}&endDate=${endDate}`,
    );
  }

  // CQC Report endpoints
  async getConsentCompletion(startDate?: string, endDate?: string): Promise<ConsentCompletionReport> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('period', 'month');
    const qs = params.toString();
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/consent-completion${qs ? `?${qs}` : ''}`);
  }

  async getConsentDecay(
    startDate: string,
    endDate: string,
    expiringWithinDays = 30,
    showOnlyExpired = 0,
  ): Promise<ConsentDecayReport> {
    return this.request(
      `/api/v1/clinic/${this.clinicId}/cqc-reports/consent-decay?startDate=${startDate}&endDate=${endDate}&expiringWithinDays=${expiringWithinDays}&showOnlyExpired=${showOnlyExpired}`,
    );
  }

  async getStaffCompetency(): Promise<StaffCompetencyReport> {
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports`);
  }

  async getIncidentFeed(status?: string, severity?: string): Promise<IncidentFeedReport> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (severity) params.set('severity', severity);
    params.set('startDate', '2022-01-01');
    params.set('period', 'month');
    const qs = params.toString();
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/infection-incidents${qs ? `?${qs}` : ''}`);
  }

  async getSafetyChecklist(): Promise<SafetyChecklistReport> {
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/safety-checklist?startDate=2022-01-01&period=month`);
  }

  async getTreatmentRiskHeatmap(from?: string): Promise<TreatmentRiskHeatmapReport> {
    const params = new URLSearchParams();
    params.set('from', from || '2022-01-01');
    params.set('period', 'month');
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/treatment-risk-heatmap?${params.toString()}`);
  }

  async getPatientFeedback(from: string, to: string): Promise<PatientFeedbackReport> {
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/patient-feedback?from=${from}&period=month`);
  }

  async getPolicyAcknowledgement(): Promise<PolicyAcknowledgementReport> {
    return this.request(`/api/v1/clinic/${this.clinicId}/cqc-reports/policy-acknowledgement?startDate=2022-01-01&period=month`);
  }
}

// ---------------------------------------------------------------------------
// Auto-authenticating client (for sync + cron — logs in with credentials)
// ---------------------------------------------------------------------------

export interface ConsentzAuthConfig {
  username: string;
  password: string;
}

export class ConsentzAuthClient {
  private baseUrl: string;
  private sessionToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private clinicId: number | null = null;

  constructor(private config: ConsentzAuthConfig) {
    this.baseUrl = CONSENTZ_BASE_URL;
  }

  async authenticate(): Promise<{ sessionToken: string; clinicId: number }> {
    if (this.sessionToken && this.clinicId && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
      return { sessionToken: this.sessionToken, clinicId: this.clinicId };
    }

    const res = await fetch(`${this.baseUrl}/api/v1/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-APPLICATION-ID': APP_ID },
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
        confirmLogin: true,
      }),
    });

    if (!res.ok) {
      throw new Error(`Consentz login failed: ${res.status} ${await res.text()}`);
    }

    const data: ConsentzLoginResponse = await res.json();
    this.sessionToken = data.user.sessionToken;
    this.clinicId = data.user.clinic.id;
    this.tokenExpiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000);

    return { sessionToken: this.sessionToken, clinicId: this.clinicId };
  }

  async getClient(): Promise<ConsentzClient> {
    const { sessionToken, clinicId } = await this.authenticate();
    return new ConsentzClient({ sessionToken, clinicId });
  }
}

let _authClient: ConsentzAuthClient | null = null;

export function getConsentzAuthClient(): ConsentzAuthClient {
  if (!_authClient) {
    _authClient = new ConsentzAuthClient({
      username: process.env.CONSENTZ_USERNAME || 'demo',
      password: process.env.CONSENTZ_PASSWORD || 'password',
    });
  }
  return _authClient;
}

/**
 * Returns an authenticated ConsentzClient for the given clinic ID.
 * Uses CONSENTZ_SESSION_TOKEN if set, otherwise logs in via env credentials.
 */
export async function getAuthenticatedClient(clinicId: number): Promise<ConsentzClient> {
  const envToken = process.env.CONSENTZ_SESSION_TOKEN;
  if (envToken) {
    return new ConsentzClient({ sessionToken: envToken, clinicId });
  }
  const { sessionToken } = await getConsentzAuthClient().authenticate();
  return new ConsentzClient({ sessionToken, clinicId });
}
