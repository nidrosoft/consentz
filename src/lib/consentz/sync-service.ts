import { getDb } from '@/lib/db';
import { type ConsentzClient, getAuthenticatedClient } from './client';

async function getClientForOrg(organizationId: string): Promise<ConsentzClient | null> {
  const dbClient = await getDb();
  const { data: org } = await dbClient.from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (!org?.consentz_clinic_id) {
    console.log(`[SYNC] Organization ${organizationId} has no Consentz clinic ID, skipping`);
    return null;
  }

  return getAuthenticatedClient(org.consentz_clinic_id);
}

export async function syncConsentzData(organizationId: string) {
  const dbClient = await getDb();
  const client = await getClientForOrg(organizationId);
  if (!client) return;

  const syncTasks = [
    { name: 'consent-completion', fn: () => syncConsentData(client, organizationId, dbClient) },
    { name: 'staff-competency', fn: () => syncStaffCompetency(client, organizationId, dbClient) },
    { name: 'incidents', fn: () => syncIncidents(client, organizationId, dbClient) },
    { name: 'safety-checklist', fn: () => syncSafetyChecklist(client, organizationId, dbClient) },
    { name: 'patient-feedback', fn: () => syncPatientFeedback(client, organizationId, dbClient) },
    { name: 'policy-acknowledgement', fn: () => syncPolicyAcknowledgements(client, organizationId, dbClient) },
  ];

  for (const task of syncTasks) {
    try {
      const result = await task.fn();
      await dbClient.from('consentz_sync_logs').insert({
        organization_id: organizationId,
        endpoint: task.name,
        status: 'success',
        record_count: result.recordCount,
        response_data: result.metrics,
      });
    } catch (error) {
      console.error(`[SYNC] Error syncing ${task.name}:`, error);
      await dbClient.from('consentz_sync_logs').insert({
        organization_id: organizationId,
        endpoint: task.name,
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Sync result type — every sync function returns metrics for response_data
// ---------------------------------------------------------------------------

interface SyncResult {
  recordCount: number;
  metrics: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Consent Completion
// ---------------------------------------------------------------------------

async function syncConsentData(
  client: ConsentzClient, organizationId: string, dbClient: Awaited<ReturnType<typeof getDb>>,
): Promise<SyncResult> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const report = await client.getConsentCompletion(
    thirtyDaysAgo.toISOString().split('T')[0],
    now.toISOString().split('T')[0],
  );

  const latestPeriod = report.data?.[0];
  const completionRate = latestPeriod?.statistics?.completionRate ?? 0;
  const total = latestPeriod?.statistics?.total ?? 0;

  if (completionRate < 90) {
    await upsertSyncTask(dbClient, organizationId, {
      sourceId: 'consent-completion',
      title: `Consent completion rate below target (${completionRate}%)`,
      description: `Current consent completion rate is ${completionRate}%, below the 90% target. Review appointment consent workflow.`,
      priority: completionRate < 70 ? 'HIGH' : 'MEDIUM',
      domains: ['safe', 'effective'],
      kloeCode: 'E7',
    });
  }

  return {
    recordCount: total,
    metrics: { completionRate },
  };
}

// ---------------------------------------------------------------------------
// Staff Competency
// ---------------------------------------------------------------------------

async function syncStaffCompetency(
  client: ConsentzClient, organizationId: string, dbClient: Awaited<ReturnType<typeof getDb>>,
): Promise<SyncResult> {
  const report = await client.getStaffCompetency();

  for (const cert of report.all) {
    const { data: existing } = await dbClient.from('staff_credentials')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('consentz_user_id', cert.staffId)
      .eq('credential_name', cert.certName)
      .limit(1)
      .maybeSingle();

    const status = cert.statusLabel === 'Overdue' ? 'EXPIRED'
      : (cert.daysToExpiry <= 90 && cert.daysToExpiry > 0) ? 'EXPIRING_SOON'
      : cert.daysToExpiry <= 0 ? 'EXPIRED'
      : 'VALID';

    if (existing) {
      await dbClient.from('staff_credentials')
        .update({ expiry_date: cert.expiryDate, status })
        .eq('id', existing.id);
    } else {
      await dbClient.from('staff_credentials').insert({
        organization_id: organizationId,
        staff_name: cert.staffName,
        consentz_user_id: cert.staffId,
        credential_type: 'CPD',
        credential_name: cert.certName,
        expiry_date: cert.expiryDate,
        status,
      });
    }

    if (status !== 'VALID') {
      await upsertSyncTask(dbClient, organizationId, {
        sourceId: `cert-${cert.staffId}-${cert.certName}`,
        title: `${cert.certName} ${status === 'EXPIRED' ? 'expired' : 'expiring'} for ${cert.staffName}`,
        description: `Certificate "${cert.certName}" for ${cert.staffName} ${status === 'EXPIRED' ? 'has expired' : `expires in ${cert.daysToExpiry} days`}.`,
        priority: status === 'EXPIRED' ? 'HIGH' : 'MEDIUM',
        domains: ['safe', 'effective'],
        kloeCode: 'E2',
      });
    }
  }

  const { summary } = report;
  const validCount = summary.totalCerts - summary.overdueCount;
  const overallCompetencyRate = summary.totalCerts > 0
    ? Math.round((validCount / summary.totalCerts) * 100)
    : 100;

  return {
    recordCount: report.all.length,
    metrics: { overallCompetencyRate },
  };
}

// ---------------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------------

async function syncIncidents(
  client: ConsentzClient, organizationId: string, dbClient: Awaited<ReturnType<typeof getDb>>,
): Promise<SyncResult> {
  const report = await client.getIncidentFeed();

  for (const incident of report.incidents) {
    const { data: existing } = await dbClient.from('incidents')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('consentz_incident_id', incident.id)
      .limit(1)
      .maybeSingle();

    if (!existing) {
      await dbClient.from('incidents').insert({
        organization_id: organizationId,
        consentz_incident_id: incident.id,
        incident_type: mapIncidentType(incident.incidentType),
        title: `${incident.incidentType} incident — ${incident.patientName || 'Unknown patient'}`,
        description: incident.notes || incident.followUpAction || '',
        severity: mapSeverity(incident.severity),
        status: incident.isResolved ? 'CLOSED' : mapIncidentStatus(incident.status),
        patient_name: incident.patientName || '',
        patient_id: incident.patientId,
        reported_by: 'Consentz Sync',
        reported_at: new Date(incident.reportedAt).toISOString(),
        domains: ['safe'],
      });
    }
  }

  const { summary } = report;
  const resolutionRate = summary.total > 0
    ? Math.round((summary.resolved / summary.total) * 100)
    : 100;

  return {
    recordCount: summary.total,
    metrics: { resolutionRate },
  };
}

// ---------------------------------------------------------------------------
// Safety Checklist
// ---------------------------------------------------------------------------

async function syncSafetyChecklist(
  client: ConsentzClient, organizationId: string, dbClient: Awaited<ReturnType<typeof getDb>>,
): Promise<SyncResult> {
  const report = await client.getSafetyChecklist();

  const pastDrills = report.fireDrills?.filter(d => d.isPast) ?? [];
  const totalDrills = report.fireDrills?.length ?? 0;
  const pastKits = report.emergencyKits?.filter(k => k.isPast) ?? [];
  const totalKits = report.emergencyKits?.length ?? 0;

  const overdueDrills = report.fireDrills?.filter(d => d.isPast) ?? [];
  for (const drill of overdueDrills) {
    const drillDate = new Date(drill.start);
    if (drillDate < new Date()) {
      await upsertSyncTask(dbClient, organizationId, {
        sourceId: `safety-drill-${drill.id}`,
        title: `Fire drill overdue (scheduled ${drill.start.split(' ')[0]})`,
        description: `A fire drill was scheduled for ${drill.start} but may not have been completed. Verify and record completion.`,
        priority: 'MEDIUM',
        domains: ['safe'],
        kloeCode: 'S4',
      });
    }
  }

  const totalItems = totalDrills + totalKits;
  const completedItems = pastDrills.length + pastKits.length;
  const overallScore = totalItems > 0
    ? Math.round((completedItems / totalItems) * 100)
    : 50;

  return {
    recordCount: totalItems,
    metrics: { overallScore },
  };
}

// ---------------------------------------------------------------------------
// Patient Feedback (rating scale: 1-10)
// ---------------------------------------------------------------------------

async function syncPatientFeedback(
  client: ConsentzClient, organizationId: string, dbClient: Awaited<ReturnType<typeof getDb>>,
): Promise<SyncResult> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const report = await client.getPatientFeedback(
    thirtyDaysAgo.toISOString().split('T')[0],
    now.toISOString().split('T')[0],
  );

  const rollingAvg = report.summary?.rollingAvg30Days ?? report.rollingAvg ?? 0;

  if (rollingAvg < 7.0 && rollingAvg > 0) {
    await upsertSyncTask(dbClient, organizationId, {
      sourceId: 'patient-feedback-monthly',
      title: `Patient satisfaction below target (${rollingAvg.toFixed(1)}/10)`,
      description: `${report.summary.totalResponses} responses in the last 30 days. ${report.summary.lowRatedCount} low-rated reviews.`,
      priority: rollingAvg < 5.0 ? 'HIGH' : 'MEDIUM',
      domains: ['caring'],
      kloeCode: 'C1',
    });
  }

  for (const item of report.lowRated ?? []) {
    await dbClient.from('activity_logs').insert({
      organization_id: organizationId,
      action: 'NEGATIVE_FEEDBACK',
      resource_type: 'consentz_sync',
      resource_id: `feedback-${item.id}`,
      details: { rating: item.rating, comments: (item.comments ?? '').slice(0, 500) },
    });
  }

  return {
    recordCount: report.summary.totalResponses,
    metrics: { averageRating: rollingAvg },
  };
}

// ---------------------------------------------------------------------------
// Policy Acknowledgements
// ---------------------------------------------------------------------------

async function syncPolicyAcknowledgements(
  client: ConsentzClient, organizationId: string, dbClient: Awaited<ReturnType<typeof getDb>>,
): Promise<SyncResult> {
  const report = await client.getPolicyAcknowledgement();

  for (const policy of report.policies) {
    if (policy.completionPercentage >= 80) continue;

    const unsignedNames = policy.notSignedUsers.slice(0, 5).map(u => u.staffName).join(', ');
    const suffix = policy.notSignedUsers.length > 5 ? '...' : '';
    await upsertSyncTask(dbClient, organizationId, {
      sourceId: `policy-ack-${policy.policyId}`,
      title: `Policy not fully acknowledged: ${policy.policyName} (${policy.completionPercentage}%)`,
      description: `${policy.notSignedUsers.length} staff members have not signed. Names: ${unsignedNames}${suffix}`,
      priority: policy.completionPercentage < 50 ? 'HIGH' : 'MEDIUM',
      domains: ['well_led'],
      kloeCode: 'W2',
    });
  }

  const overallRate = report.summary?.completionPercentage ?? 0;

  if (overallRate < 70) {
    await upsertSyncTask(dbClient, organizationId, {
      sourceId: 'policy-ack-summary',
      title: `Overall policy acknowledgement critically low (${overallRate}%)`,
      description: `Only ${overallRate}% of policies have been acknowledged across the organisation.`,
      priority: 'HIGH',
      domains: ['well_led'],
      kloeCode: 'W2',
    });
  }

  return {
    recordCount: report.policies.length,
    metrics: { acknowledgementRate: overallRate },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TaskInput {
  sourceId: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  domains: string[];
  kloeCode: string;
}

async function upsertSyncTask(
  dbClient: Awaited<ReturnType<typeof getDb>>,
  organizationId: string,
  input: TaskInput,
) {
  const { data: existing } = await dbClient.from('tasks')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('source', 'CONSENTZ_SYNC')
    .eq('source_id', input.sourceId)
    .neq('status', 'COMPLETED')
    .limit(1)
    .maybeSingle();

  if (!existing) {
    await dbClient.from('tasks').insert({
      organization_id: organizationId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      domains: input.domains,
      kloe_code: input.kloeCode,
      source: 'CONSENTZ_SYNC',
      source_id: input.sourceId,
      status: 'TODO',
    });
  }
}

function mapIncidentType(type: string): string {
  const mapping: Record<string, string> = {
    'infection': 'INFECTION',
    'complication': 'COMPLICATION',
    'premises': 'PREMISES_INCIDENT',
    'safeguarding': 'SAFEGUARDING',
    'medication': 'MEDICATION_ERROR',
    'data_breach': 'DATA_BREACH',
    'complaint': 'COMPLAINT',
    'near_miss': 'NEAR_MISS',
  };
  return mapping[type.toLowerCase()] || 'OTHER';
}

function mapSeverity(severity: string): string {
  const mapping: Record<string, string> = {
    'low': 'LOW', 'moderate': 'MEDIUM', 'medium': 'MEDIUM',
    'high': 'HIGH', 'severe': 'HIGH', 'critical': 'CRITICAL',
  };
  return mapping[severity.toLowerCase()] || 'MEDIUM';
}

function mapIncidentStatus(status: string): string {
  const mapping: Record<string, string> = {
    'open': 'OPEN', 'reported': 'OPEN', 'unresolved': 'OPEN',
    'investigating': 'INVESTIGATING', 'under_investigation': 'INVESTIGATING',
    'actioned': 'ACTIONED', 'action_required': 'ACTIONED',
    'closed': 'CLOSED', 'resolved': 'CLOSED',
  };
  return mapping[status.toLowerCase()] || 'OPEN';
}
