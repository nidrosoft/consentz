// =============================================================================
// Dashboard Service — Aggregated overview data for the main dashboard
// =============================================================================

import type {
  ComplianceScore,
  ComplianceGap,
  Task,
  Evidence,
  StaffMember,
  Policy,
  Incident,
  ActivityLogEntry,
  UpcomingDeadline,
  Notification,
  GapSeverity,
} from '@/types';
import {
  complianceScoreStore,
  gapStore,
  taskStore,
  evidenceStore,
  staffStore,
  policyStore,
  incidentStore,
  activityLogStore,
  deadlineStore,
  notificationStore,
} from '@/lib/mock-data/store';

interface DashboardOverviewParams {
  organizationId: string;
  userId: string;
}

interface GapCountsBySeverity {
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  total: number;
}

interface TaskSummary {
  totalActive: number;
  overdueCount: number;
  dueSoon: Task[];
  userTasks: Task[];
}

interface EvidenceSummary {
  total: number;
  expiringSoonCount: number;
  recentUploads: Evidence[];
}

interface StaffSummary {
  totalActive: number;
  dbsExpiringCount: number;
}

interface PolicySummary {
  total: number;
  published: number;
  drafts: number;
  reviewDue: number;
}

interface IncidentSummary {
  thisMonth: number;
  investigating: number;
}

interface DashboardOverview {
  compliance: ComplianceScore;
  gaps: GapCountsBySeverity;
  tasks: TaskSummary;
  evidence: EvidenceSummary;
  staff: StaffSummary;
  policies: PolicySummary;
  incidents: IncidentSummary;
  activity: ActivityLogEntry[];
  deadlines: UpcomingDeadline[];
  notifications: { unreadCount: number };
}

export class DashboardService {
  /**
   * Get aggregated dashboard overview data.
   */
  static getOverview(params: DashboardOverviewParams): DashboardOverview {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // --- Compliance ---
    const compliance = complianceScoreStore.current;

    // --- Gaps (OPEN only) ---
    const openGaps = gapStore.filter((g) => g.status === 'OPEN');
    const gaps: GapCountsBySeverity = {
      CRITICAL: openGaps.filter((g) => g.severity === 'CRITICAL').length,
      HIGH: openGaps.filter((g) => g.severity === 'HIGH').length,
      MEDIUM: openGaps.filter((g) => g.severity === 'MEDIUM').length,
      LOW: openGaps.filter((g) => g.severity === 'LOW').length,
      total: openGaps.length,
    };

    // --- Tasks ---
    const allTasks = taskStore.getAll();
    const activeTasks = allTasks.filter(
      (t) => t.status !== 'DONE',
    );
    const overdueTasks = allTasks.filter((t) => t.status === 'OVERDUE');

    // Due soon: tasks with dueDate within 7 days, not done
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueSoon = activeTasks
      .filter((t) => {
        const due = new Date(t.dueDate);
        return due >= now && due <= sevenDaysFromNow;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    // User tasks: assigned to the current user
    const userTasks = activeTasks
      .filter((t) => t.assignee === params.userId || t.assignee.toLowerCase().includes('jane'))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    const tasks: TaskSummary = {
      totalActive: activeTasks.length,
      overdueCount: overdueTasks.length,
      dueSoon,
      userTasks,
    };

    // --- Evidence ---
    const allEvidence = evidenceStore.filter(
      (e) => !(e as Evidence & { deletedAt?: string }).deletedAt,
    );
    const expiringSoon = allEvidence.filter((e) => e.status === 'EXPIRING_SOON');
    const recentUploads = [...allEvidence]
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 5);

    const evidence: EvidenceSummary = {
      total: allEvidence.length,
      expiringSoonCount: expiringSoon.length,
      recentUploads,
    };

    // --- Staff ---
    const activeStaff = staffStore.filter((s) => s.isActive);
    const dbsExpiring = activeStaff.filter((s) => {
      const expiry = new Date(s.dbsExpiry);
      return expiry <= thirtyDaysFromNow && expiry >= now;
    });

    const staff: StaffSummary = {
      totalActive: activeStaff.length,
      dbsExpiringCount: dbsExpiring.length,
    };

    // --- Policies ---
    const allPolicies = policyStore.filter(
      (p) => !(p as Policy & { deletedAt?: string }).deletedAt,
    );
    const reviewDuePolicies = allPolicies.filter((p) => {
      if (!p.nextReviewDate) return false;
      const reviewDate = new Date(p.nextReviewDate);
      return reviewDate <= thirtyDaysFromNow;
    });

    const policies: PolicySummary = {
      total: allPolicies.length,
      published: allPolicies.filter((p) => p.status === 'PUBLISHED').length,
      drafts: allPolicies.filter((p) => p.status === 'DRAFT').length,
      reviewDue: reviewDuePolicies.length,
    };

    // --- Incidents ---
    const monthlyIncidents = incidentStore.filter((i) => {
      const reported = new Date(i.reportedAt);
      return reported >= startOfMonth;
    });
    const investigatingIncidents = incidentStore.filter(
      (i) => i.status === 'INVESTIGATING',
    );

    const incidents: IncidentSummary = {
      thisMonth: monthlyIncidents.length,
      investigating: investigatingIncidents.length,
    };

    // --- Activity (last 10) ---
    const activity = [...activityLogStore.getAll()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // --- Deadlines (sorted by dueDate) ---
    const deadlines = [...deadlineStore.getAll()].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

    // --- Notifications ---
    const unreadCount = notificationStore.count((n) => !n.isRead);

    return {
      compliance,
      gaps,
      tasks,
      evidence,
      staff,
      policies,
      incidents,
      activity,
      deadlines,
      notifications: { unreadCount },
    };
  }
}
