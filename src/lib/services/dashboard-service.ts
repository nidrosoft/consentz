// =============================================================================
// Dashboard Service — Aggregated overview data for the main dashboard
// =============================================================================

import { db } from '@/lib/db';

interface DashboardOverviewParams {
  organizationId: string;
  userId: string;
}

export class DashboardService {
  static async getOverview(params: DashboardOverviewParams) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      complianceScore,
      openGaps,
      allTasks,
      evidenceItems,
      activeStaff,
      allPolicies,
      monthlyIncidents,
      investigatingIncidents,
      recentActivity,
      unreadNotifs,
    ] = await Promise.all([
      db.complianceScore.findUnique({
        where: { organizationId: params.organizationId },
        include: { domainScores: { orderBy: { domain: 'asc' } } },
      }),
      db.complianceGap.findMany({
        where: { organizationId: params.organizationId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      db.task.findMany({
        where: { organizationId: params.organizationId },
        orderBy: { dueDate: 'asc' },
      }),
      db.evidenceItem.findMany({
        where: { organizationId: params.organizationId },
        orderBy: { createdAt: 'desc' },
      }),
      db.staffMember.findMany({
        where: { organizationId: params.organizationId, isActive: true },
      }),
      db.policy.findMany({
        where: { organizationId: params.organizationId },
      }),
      db.incident.count({
        where: { organizationId: params.organizationId, reportedAt: { gte: startOfMonth } },
      }),
      db.incident.count({
        where: { organizationId: params.organizationId, status: 'INVESTIGATING' },
      }),
      db.activityLog.findMany({
        where: { organizationId: params.organizationId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.notification.count({
        where: { organizationId: params.organizationId, userId: params.userId, isRead: false },
      }),
    ]);

    const activeTasks = allTasks.filter((t) => t.status !== 'COMPLETED');
    const overdueTasks = allTasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== 'COMPLETED');
    const dueSoon = activeTasks
      .filter((t) => t.dueDate && t.dueDate >= now && t.dueDate <= sevenDaysFromNow)
      .slice(0, 5);
    const userTasks = activeTasks
      .filter((t) => t.assignedTo === params.userId)
      .slice(0, 5);

    const dbsExpiring = activeStaff.filter((s) => {
      if (!s.dbsCertificateDate) return false;
      const oneYearFromDbs = new Date(s.dbsCertificateDate);
      oneYearFromDbs.setFullYear(oneYearFromDbs.getFullYear() + 3);
      return oneYearFromDbs <= thirtyDaysFromNow && oneYearFromDbs >= now;
    });

    const DOMAIN_CONFIG: Record<string, { name: string; icon: string; color: string; kloeCount: number }> = {
      safe: { name: 'Safe', icon: 'Shield', color: '#3B82F6', kloeCount: 6 },
      effective: { name: 'Effective', icon: 'Target', color: '#10B981', kloeCount: 7 },
      caring: { name: 'Caring', icon: 'Heart', color: '#EC4899', kloeCount: 3 },
      responsive: { name: 'Responsive', icon: 'Zap', color: '#F59E0B', kloeCount: 3 },
      well_led: { name: 'Well-Led', icon: 'Crown', color: '#8B5CF6', kloeCount: 6 },
    };

    const compliance = complianceScore
      ? {
          overallScore: complianceScore.score,
          predictedRating: complianceScore.predictedRating,
          hasCriticalGap: complianceScore.hasCriticalGap,
          domainScores: complianceScore.domainScores.map((ds) => {
            const cfg = DOMAIN_CONFIG[ds.domain] ?? { name: ds.domain, icon: 'Circle', color: '#6B7280', kloeCount: 0 };
            return {
              code: ds.domain,
              name: cfg.name,
              score: ds.percentage,
              rating: ds.status,
              icon: cfg.icon,
              color: cfg.color,
              kloeCount: cfg.kloeCount,
              totalGaps: ds.totalGaps,
              criticalGaps: ds.criticalGaps,
            };
          }),
        }
      : {
          overallScore: 0,
          predictedRating: 'INADEQUATE' as const,
          hasCriticalGap: false,
          domainScores: [],
        };

    const priorityGaps = openGaps
      .filter((g) => g.severity === 'CRITICAL' || g.severity === 'HIGH')
      .sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
      })
      .slice(0, 10)
      .map((g) => ({
        id: g.id,
        title: g.title,
        domain: g.domain,
        kloeCode: g.kloeCode,
        severity: g.severity,
        dueDate: g.dueDate?.toISOString() ?? null,
      }));

    const lastSync = await db.consentzSyncLog.findFirst({
      where: { organizationId: params.organizationId, status: 'success' },
      orderBy: { syncedAt: 'desc' },
    });

    return {
      compliance,
      priorityGaps,
      consentzDataFreshness: lastSync?.syncedAt?.toISOString() ?? null,
      gaps: {
        CRITICAL: openGaps.filter((g) => g.severity === 'CRITICAL').length,
        HIGH: openGaps.filter((g) => g.severity === 'HIGH').length,
        MEDIUM: openGaps.filter((g) => g.severity === 'MEDIUM').length,
        LOW: openGaps.filter((g) => g.severity === 'LOW').length,
        total: openGaps.length,
      },
      tasks: {
        totalActive: activeTasks.length,
        overdueCount: overdueTasks.length,
        dueSoon,
        userTasks,
      },
      evidence: {
        total: evidenceItems.length,
        expiringSoonCount: evidenceItems.filter((e) => e.status === 'EXPIRING_SOON').length,
        recentUploads: evidenceItems.slice(0, 5),
      },
      staff: {
        totalActive: activeStaff.length,
        dbsExpiringCount: dbsExpiring.length,
      },
      policies: {
        total: allPolicies.length,
        published: allPolicies.filter((p) => p.status === 'ACTIVE').length,
        drafts: allPolicies.filter((p) => p.status === 'DRAFT').length,
        reviewDue: allPolicies.filter((p) => p.nextReviewDate && p.nextReviewDate <= thirtyDaysFromNow).length,
      },
      incidents: {
        thisMonth: monthlyIncidents,
        investigating: investigatingIncidents,
      },
      activity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        description: a.description,
        actorName: a.actorName,
        createdAt: a.createdAt.toISOString(),
      })),
      deadlines: [],
      notifications: { unreadCount: unreadNotifs },
    };
  }
}
