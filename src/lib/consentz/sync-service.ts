import { db } from '@/lib/db';
import { ConsentzClient } from './client';

async function getStoredSessionToken(organizationId: string): Promise<string> {
  // TODO: Retrieve stored session token from encrypted storage
  // For now, use environment variable as fallback
  return process.env.CONSENTZ_SESSION_TOKEN || '';
}

export async function syncConsentzData(organizationId: string) {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org?.consentzClinicId) {
    console.log(`[SYNC] Organization ${organizationId} has no Consentz clinic ID, skipping`);
    return;
  }

  const client = new ConsentzClient({
    sessionToken: await getStoredSessionToken(organizationId),
    clinicId: org.consentzClinicId,
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
      await db.consentzSyncLog.create({
        data: {
          organizationId,
          endpoint: task.name,
          status: 'success',
          recordCount: typeof result === 'number' ? result : null,
        },
      });
    } catch (error) {
      console.error(`[SYNC] Error syncing ${task.name}:`, error);
      await db.consentzSyncLog.create({
        data: {
          organizationId,
          endpoint: task.name,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}

async function syncConsentData(client: ConsentzClient, organizationId: string): Promise<number> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const report = await client.getConsentCompletion(
    thirtyDaysAgo.toISOString().split('T')[0],
    now.toISOString().split('T')[0]
  );

  // Store the report data in compliance score breakdown
  // Auto-create tasks when completion rate < 90%
  if (report.completionRate < 90) {
    const existingTask = await db.task.findFirst({
      where: {
        organizationId,
        source: 'CONSENTZ_SYNC',
        sourceId: 'consent-completion',
        status: { not: 'COMPLETED' },
      },
    });
    if (!existingTask) {
      await db.task.create({
        data: {
          organizationId,
          title: `Consent completion rate below target (${report.completionRate}%)`,
          description: `Current consent completion rate is ${report.completionRate}%, below the 90% target. Review appointment consent workflow.`,
          priority: report.completionRate < 70 ? 'HIGH' : 'MEDIUM',
          domains: ['safe', 'effective'],
          kloeCode: 'E7',
          source: 'CONSENTZ_SYNC',
          sourceId: 'consent-completion',
        },
      });
    }
  }

  return report.totalAppointments;
}

async function syncStaffCompetency(client: ConsentzClient, organizationId: string): Promise<number> {
  const report = await client.getStaffCompetency();

  for (const staff of report.staff) {
    for (const cert of staff.certificates) {
      // Upsert staff credentials
      const existing = await db.staffCredential.findFirst({
        where: {
          organizationId,
          consentzUserId: staff.practitionerId,
          credentialName: cert.name,
        },
      });

      const status = cert.status === 'overdue' ? 'EXPIRED' :
                     cert.status.startsWith('expiring') ? 'EXPIRING_SOON' : 'VALID';

      if (existing) {
        await db.staffCredential.update({
          where: { id: existing.id },
          data: {
            expiryDate: new Date(cert.expiryDate),
            status: status as any,
          },
        });
      } else {
        await db.staffCredential.create({
          data: {
            organizationId,
            staffName: staff.practitionerName,
            consentzUserId: staff.practitionerId,
            credentialType: 'CPD',
            credentialName: cert.name,
            expiryDate: new Date(cert.expiryDate),
            status: status as any,
          },
        });
      }

      // Auto-create tasks for expiring/overdue certificates
      if (status !== 'VALID') {
        const existingTask = await db.task.findFirst({
          where: {
            organizationId,
            source: 'CONSENTZ_SYNC',
            sourceId: `cert-${staff.practitionerId}-${cert.name}`,
            status: { not: 'COMPLETED' },
          },
        });
        if (!existingTask) {
          await db.task.create({
            data: {
              organizationId,
              title: `${cert.name} ${status === 'EXPIRED' ? 'expired' : 'expiring'} for ${staff.practitionerName}`,
              description: `Certificate "${cert.name}" for ${staff.practitionerName} ${status === 'EXPIRED' ? 'has expired' : `expires in ${cert.daysUntilExpiry} days`}.`,
              priority: status === 'EXPIRED' ? 'HIGH' : 'MEDIUM',
              domains: ['safe', 'effective'],
              kloeCode: 'E2',
              source: 'CONSENTZ_SYNC',
              sourceId: `cert-${staff.practitionerId}-${cert.name}`,
            },
          });
        }
      }
    }
  }

  return report.staff.length;
}

async function syncIncidents(client: ConsentzClient, organizationId: string): Promise<number> {
  const report = await client.getIncidentFeed();

  for (const incident of report.incidents) {
    const existing = await db.incident.findFirst({
      where: { organizationId, consentzIncidentId: incident.id },
    });

    if (!existing) {
      await db.incident.create({
        data: {
          organizationId,
          consentzIncidentId: incident.id,
          incidentType: mapIncidentType(incident.type),
          title: incident.title,
          description: incident.description,
          severity: mapSeverity(incident.severity),
          status: mapIncidentStatus(incident.status),
          patientName: incident.patientName,
          patientId: incident.patientId,
          reportedBy: incident.reportedBy,
          reportedAt: new Date(incident.reportedAt),
          resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : null,
          domains: ['safe'],
        },
      });
    }
  }

  return report.incidents.length;
}

async function syncSafetyChecklist(_client: ConsentzClient, _organizationId: string): Promise<number> {
  // TODO: Implement safety checklist sync
  return 0;
}

async function syncPatientFeedback(_client: ConsentzClient, _organizationId: string): Promise<number> {
  // TODO: Implement patient feedback sync
  return 0;
}

async function syncPolicyAcknowledgements(_client: ConsentzClient, _organizationId: string): Promise<number> {
  // TODO: Implement policy acknowledgement sync
  return 0;
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
