import { getDb } from '@/lib/db';
import { ConsentzClient } from './client';

async function getStoredSessionToken(organizationId: string): Promise<string> {
  // TODO: Retrieve stored session token from encrypted storage
  void organizationId;
  return process.env.CONSENTZ_SESSION_TOKEN || '';
}

export async function syncConsentzData(organizationId: string) {
  const dbClient = await getDb();
  const { data: org } = await dbClient.from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (!org?.consentz_clinic_id) {
    console.log(`[SYNC] Organization ${organizationId} has no Consentz clinic ID, skipping`);
    return;
  }

  const client = new ConsentzClient({
    sessionToken: await getStoredSessionToken(organizationId),
    clinicId: org.consentz_clinic_id,
  });

  const syncTasks = [
    { name: 'consent-completion', fn: () => syncConsentData(client, organizationId) },
    { name: 'staff-competency', fn: () => syncStaffCompetency(client, organizationId) },
    { name: 'incidents', fn: () => syncIncidents(client, organizationId) },
    { name: 'safety-checklist', fn: () => syncSafetyChecklist(client, organizationId) },
    { name: 'patient-feedback', fn: () => syncPatientFeedback(client, organizationId) },
    { name: 'policy-acknowledgement', fn: () => syncPolicyAcknowledgements(client, organizationId) },
  ];

  for (const task of syncTasks) {
    try {
      const result = await task.fn();
      await dbClient.from('consentz_sync_logs').insert({
        organization_id: organizationId,
        endpoint: task.name,
        status: 'success',
        record_count: typeof result === 'number' ? result : null,
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

async function syncConsentData(client: ConsentzClient, organizationId: string): Promise<number> {
  const dbClient = await getDb();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const report = await client.getConsentCompletion(
    thirtyDaysAgo.toISOString().split('T')[0],
    now.toISOString().split('T')[0]
  );

  if (report.completionRate < 90) {
    const { data: existingTask } = await dbClient.from('tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('source', 'CONSENTZ_SYNC')
      .eq('source_id', 'consent-completion')
      .neq('status', 'COMPLETED')
      .limit(1)
      .maybeSingle();

    if (!existingTask) {
      await dbClient.from('tasks').insert({
        organization_id: organizationId,
        title: `Consent completion rate below target (${report.completionRate}%)`,
        description: `Current consent completion rate is ${report.completionRate}%, below the 90% target. Review appointment consent workflow.`,
        priority: report.completionRate < 70 ? 'HIGH' : 'MEDIUM',
        domains: ['safe', 'effective'],
        kloe_code: 'E7',
        source: 'CONSENTZ_SYNC',
        source_id: 'consent-completion',
      });
    }
  }

  return report.totalAppointments;
}

async function syncStaffCompetency(client: ConsentzClient, organizationId: string): Promise<number> {
  const dbClient = await getDb();
  const report = await client.getStaffCompetency();

  for (const staff of report.staff) {
    for (const cert of staff.certificates) {
      const { data: existing } = await dbClient.from('staff_credentials')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('consentz_user_id', staff.practitionerId)
        .eq('credential_name', cert.name)
        .limit(1)
        .maybeSingle();

      const status = cert.status === 'overdue' ? 'EXPIRED' :
                     cert.status.startsWith('expiring') ? 'EXPIRING_SOON' : 'VALID';

      if (existing) {
        await dbClient.from('staff_credentials')
          .update({
            expiry_date: new Date(cert.expiryDate).toISOString(),
            status,
          })
          .eq('id', existing.id);
      } else {
        await dbClient.from('staff_credentials').insert({
          organization_id: organizationId,
          staff_name: staff.practitionerName,
          consentz_user_id: staff.practitionerId,
          credential_type: 'CPD',
          credential_name: cert.name,
          expiry_date: new Date(cert.expiryDate).toISOString(),
          status,
        });
      }

      if (status !== 'VALID') {
        const { data: existingTask } = await dbClient.from('tasks')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('source', 'CONSENTZ_SYNC')
          .eq('source_id', `cert-${staff.practitionerId}-${cert.name}`)
          .neq('status', 'COMPLETED')
          .limit(1)
          .maybeSingle();

        if (!existingTask) {
          await dbClient.from('tasks').insert({
            organization_id: organizationId,
            title: `${cert.name} ${status === 'EXPIRED' ? 'expired' : 'expiring'} for ${staff.practitionerName}`,
            description: `Certificate "${cert.name}" for ${staff.practitionerName} ${status === 'EXPIRED' ? 'has expired' : `expires in ${cert.daysUntilExpiry} days`}.`,
            priority: status === 'EXPIRED' ? 'HIGH' : 'MEDIUM',
            domains: ['safe', 'effective'],
            kloe_code: 'E2',
            source: 'CONSENTZ_SYNC',
            source_id: `cert-${staff.practitionerId}-${cert.name}`,
          });
        }
      }
    }
  }

  return report.staff.length;
}

async function syncIncidents(client: ConsentzClient, organizationId: string): Promise<number> {
  const dbClient = await getDb();
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
        incident_type: mapIncidentType(incident.type),
        title: incident.title,
        description: incident.description,
        severity: mapSeverity(incident.severity),
        status: mapIncidentStatus(incident.status),
        patient_name: incident.patientName,
        patient_id: incident.patientId,
        reported_by: incident.reportedBy,
        reported_at: new Date(incident.reportedAt).toISOString(),
        resolved_at: incident.resolvedAt ? new Date(incident.resolvedAt).toISOString() : null,
        domains: ['safe'],
      });
    }
  }

  return report.incidents.length;
}

async function syncSafetyChecklist(client: ConsentzClient, organizationId: string): Promise<number> {
  const dbClient = await getDb();
  const report = await client.getSafetyChecklist();

  for (const item of report.items) {
    if (item.status !== 'overdue' && item.status !== 'blocked') continue;

    const sourceId = `safety-checklist-${item.id}`;
    const { data: existingTask } = await dbClient.from('tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('source', 'CONSENTZ_SYNC')
      .eq('source_id', sourceId)
      .neq('status', 'COMPLETED')
      .limit(1)
      .maybeSingle();

    if (!existingTask) {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await dbClient.from('tasks').insert({
        organization_id: organizationId,
        title: `Safety checklist overdue: ${item.item}`,
        description: `Category: ${item.category}. ${item.blockers?.length ? 'Blockers: ' + item.blockers.join(', ') : 'Last completed: ' + (item.lastCompleted || 'Never')}`,
        priority: item.status === 'blocked' ? 'HIGH' : 'MEDIUM',
        domains: ['safe'],
        kloe_code: 'S4',
        source: 'CONSENTZ_SYNC',
        source_id: sourceId,
        status: 'TODO',
        due_date: item.nextDue || sevenDaysFromNow,
      });
    }
  }

  return report.items.length;
}

async function syncPatientFeedback(client: ConsentzClient, organizationId: string): Promise<number> {
  const dbClient = await getDb();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const report = await client.getPatientFeedback(
    thirtyDaysAgo.toISOString().split('T')[0],
    now.toISOString().split('T')[0]
  );

  const { summary } = report;

  if (summary.averageRating < 4.0) {
    const sourceId = 'patient-feedback-monthly';
    const { data: existingTask } = await dbClient.from('tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('source', 'CONSENTZ_SYNC')
      .eq('source_id', sourceId)
      .neq('status', 'COMPLETED')
      .limit(1)
      .maybeSingle();

    if (!existingTask) {
      await dbClient.from('tasks').insert({
        organization_id: organizationId,
        title: `Patient satisfaction below target (${summary.averageRating.toFixed(1)}/5.0)`,
        description: `${summary.totalResponses} responses in the last 30 days. ${summary.negativeCount} negative reviews. Top themes: ${summary.topThemes.slice(0, 3).map(t => t.theme).join(', ')}`,
        priority: summary.averageRating < 3.0 ? 'HIGH' : 'MEDIUM',
        domains: ['caring'],
        kloe_code: 'C1',
        source: 'CONSENTZ_SYNC',
        source_id: sourceId,
        status: 'TODO',
      });
    }
  }

  // Log negative feedback to activity
  for (const item of report.feedback) {
    if (item.isNegative) {
      await dbClient.from('activity_log').insert({
        organization_id: organizationId,
        type: 'NEGATIVE_FEEDBACK',
        title: `Negative patient feedback (${item.rating}/5)`,
        description: item.comment.slice(0, 500),
        source: 'CONSENTZ_SYNC',
        source_id: `feedback-${item.id}`,
        created_at: new Date(item.date).toISOString(),
      });
    }
  }

  return summary.totalResponses;
}

async function syncPolicyAcknowledgements(client: ConsentzClient, organizationId: string): Promise<number> {
  const dbClient = await getDb();
  const report = await client.getPolicyAcknowledgement();

  for (const policy of report.policies) {
    if (policy.completionRate >= 80) continue;

    const sourceId = `policy-ack-${policy.policyId}`;
    const { data: existingTask } = await dbClient.from('tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('source', 'CONSENTZ_SYNC')
      .eq('source_id', sourceId)
      .neq('status', 'COMPLETED')
      .limit(1)
      .maybeSingle();

    if (!existingTask) {
      const unsignedNames = policy.unsigned.slice(0, 5).map(u => u.name).join(', ');
      const suffix = policy.unsigned.length > 5 ? '...' : '';
      await dbClient.from('tasks').insert({
        organization_id: organizationId,
        title: `Policy not fully acknowledged: ${policy.policyName} (${policy.completionRate}%)`,
        description: `${policy.unsigned.length} staff members have not signed. Names: ${unsignedNames}${suffix}`,
        priority: policy.completionRate < 50 ? 'HIGH' : 'MEDIUM',
        domains: ['well_led'],
        kloe_code: 'W2',
        source: 'CONSENTZ_SYNC',
        source_id: sourceId,
        status: 'TODO',
      });
    }
  }

  // Create summary task if overall completion is critically low
  if (report.overallCompletionRate < 70) {
    const summarySourceId = 'policy-ack-summary';
    const { data: existingSummary } = await dbClient.from('tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('source', 'CONSENTZ_SYNC')
      .eq('source_id', summarySourceId)
      .neq('status', 'COMPLETED')
      .limit(1)
      .maybeSingle();

    if (!existingSummary) {
      await dbClient.from('tasks').insert({
        organization_id: organizationId,
        title: `Overall policy acknowledgement critically low (${report.overallCompletionRate}%)`,
        description: `Only ${report.overallCompletionRate}% of policies have been acknowledged across the organisation. This is below the 70% threshold and requires urgent attention.`,
        priority: 'HIGH',
        domains: ['well_led'],
        kloe_code: 'W2',
        source: 'CONSENTZ_SYNC',
        source_id: summarySourceId,
        status: 'TODO',
      });
    }
  }

  return report.policies.length;
}

function mapIncidentType(type: string): 'INFECTION' | 'COMPLICATION' | 'PREMISES_INCIDENT' | 'SAFEGUARDING' | 'MEDICATION_ERROR' | 'DATA_BREACH' | 'COMPLAINT' | 'NEAR_MISS' | 'OTHER' {
  const mapping: Record<string, any> = {
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

function mapSeverity(severity: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const mapping: Record<string, any> = {
    'low': 'LOW', 'moderate': 'MEDIUM', 'medium': 'MEDIUM',
    'high': 'HIGH', 'severe': 'HIGH', 'critical': 'CRITICAL',
  };
  return mapping[severity.toLowerCase()] || 'MEDIUM';
}

function mapIncidentStatus(status: string): 'OPEN' | 'INVESTIGATING' | 'ACTIONED' | 'CLOSED' {
  const mapping: Record<string, any> = {
    'open': 'OPEN', 'reported': 'OPEN',
    'investigating': 'INVESTIGATING', 'under_investigation': 'INVESTIGATING',
    'actioned': 'ACTIONED', 'action_required': 'ACTIONED',
    'closed': 'CLOSED', 'resolved': 'CLOSED',
  };
  return mapping[status.toLowerCase()] || 'OPEN';
}
