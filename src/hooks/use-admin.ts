"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PaginationMeta } from "@/lib/api-response";

async function fetchJson<T>(url: string): Promise<{ data: T; meta?: PaginationMeta }> {
    const res = await fetch(url);
    if (res.status === 403) throw new Error("NOT_ADMIN");
    if (!res.ok) throw new Error(await res.text());
    const body = await res.json();
    return { data: body.data as T, meta: body.meta };
}

async function patchJson<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json.data as T;
}

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface AdminMetrics {
    totals: {
        organizations: number;
        activeOrganizations: number;
        users: number;
        staff: number;
        policies: number;
        tasks: number;
        openTasks: number;
        openGaps: number;
        evidence: number;
        incidents: number;
    };
    revenue: {
        mrr: number;
        activeSubscriptions: number;
        tierBreakdown: Record<string, number>;
        planPrices: Record<string, number>;
    };
    growth: {
        newOrgsLast30Days: number;
        activityLast7Days: number;
    };
    recentOrganizations: Array<{ id: string; name: string; service_type: string | null; subscription_tier: string | null; subscription_status: string | null; created_at: string }>;
    recentActivity: Array<{ id: string; user_name: string; action: string; entity_type: string; created_at: string }>;
}

export interface AdminOrg {
    id: string;
    name: string;
    service_type: string | null;
    subscription_tier: string | null;
    subscription_status: string | null;
    created_at: string;
    consentz_clinic_id: string | null;
}

export interface AdminUser {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    organization_id: string | null;
    organizationName: string | null;
    created_at: string;
    last_sign_in_at: string | null;
}

export interface AdminOrgDetail {
    organization: Record<string, unknown>;
    users: Array<{
        id: string;
        email: string;
        full_name: string | null;
        role: string;
        created_at: string;
        last_sign_in_at: string | null;
    }>;
    counts: {
        staff: number;
        policies: number;
        tasks: number;
        openGaps: number;
    };
    compliance: {
        overall_score: number;
        safe_score: number;
        effective_score: number;
        caring_score: number;
        responsive_score: number;
        well_led_score: number;
        updated_at: string;
    } | null;
    subscription: Record<string, unknown> | null;
    recentActivity: Array<{ id: string; user_name: string; action: string; entity_type: string; created_at: string }>;
}

export interface AdminRevenue {
    plans: Array<Record<string, unknown>>;
    subscriptions: Array<Record<string, unknown>>;
    organizations: Array<Record<string, unknown>>;
    summary: {
        tierCounts: Record<string, number>;
        tierRevenue: Record<string, number>;
        totalMrr: number;
        activeSubscriptions: number;
        trialingCount: number;
        pastDueCount: number;
        canceledCount: number;
    };
}

// ─── Hooks ──────────────────────────────────────────────────────────────────────

export function useAdminMetrics() {
    return useQuery({
        queryKey: ["admin", "metrics"],
        queryFn: () => fetchJson<AdminMetrics>("/api/admin/metrics").then((r) => r.data),
        retry: false,
    });
}

export function useAdminOrgs(search: string, page: number) {
    return useQuery({
        queryKey: ["admin", "orgs", search, page],
        queryFn: () => {
            const params = new URLSearchParams({ page: String(page), pageSize: "20" });
            if (search) params.set("search", search);
            return fetchJson<AdminOrg[]>(`/api/admin/orgs?${params}`);
        },
        retry: false,
    });
}

export function useAdminUsers(search: string, page: number) {
    return useQuery({
        queryKey: ["admin", "users", search, page],
        queryFn: () => {
            const params = new URLSearchParams({ page: String(page), pageSize: "20" });
            if (search) params.set("search", search);
            return fetchJson<AdminUser[]>(`/api/admin/users?${params}`);
        },
        retry: false,
    });
}

export function useAdminOrgDetail(orgId: string | null) {
    return useQuery({
        queryKey: ["admin", "org-detail", orgId],
        queryFn: () => fetchJson<AdminOrgDetail>(`/api/admin/orgs/${orgId}`).then((r) => r.data),
        enabled: !!orgId,
        retry: false,
    });
}

export function useAdminRevenue() {
    return useQuery({
        queryKey: ["admin", "revenue"],
        queryFn: () => fetchJson<AdminRevenue>("/api/admin/revenue").then((r) => r.data),
        retry: false,
    });
}

export function useAdminUpdateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, ...body }: { userId: string; action: string; role?: string }) =>
            patchJson(`/api/admin/users/${userId}`, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "users"] });
            qc.invalidateQueries({ queryKey: ["admin", "metrics"] });
            qc.invalidateQueries({ queryKey: ["admin", "org-detail"] });
        },
    });
}

export function useAdminUpdateOrg() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ orgId, ...body }: { orgId: string; action: string; tier?: string }) =>
            patchJson(`/api/admin/orgs/${orgId}`, body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "orgs"] });
            qc.invalidateQueries({ queryKey: ["admin", "org-detail"] });
            qc.invalidateQueries({ queryKey: ["admin", "metrics"] });
            qc.invalidateQueries({ queryKey: ["admin", "revenue"] });
        },
    });
}

// ─── Compliance hooks ─────────────────────────────────────────────────────────

export interface AdminComplianceOverview {
    averageScore: number;
    domainAverages: { safe: number; effective: number; caring: number; responsive: number; wellLed: number };
    outstanding: number;
    requiresImprovement: number;
    totalOpenGaps: number;
    overdueTasks: number;
    scoreBands: Record<string, number>;
    bottom10: Array<{ id: string; name: string; serviceType: string | null; score: number; updatedAt: string }>;
}

export function useAdminComplianceOverview() {
    return useQuery({
        queryKey: ["admin", "compliance", "overview"],
        queryFn: () => fetchJson<AdminComplianceOverview>("/api/admin/compliance/overview").then((r) => r.data),
        retry: false,
    });
}

export interface AdminTask {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string | null;
    due_date: string | null;
    assigned_to_name: string | null;
    organization_id: string | null;
    organizationName: string | null;
    serviceType: string | null;
    created_at: string;
}

export function useAdminTasks(search: string, page: number, filters?: { status?: string; priority?: string }) {
    return useQuery({
        queryKey: ["admin", "compliance", "tasks", search, page, filters],
        queryFn: () => {
            const params = new URLSearchParams({ page: String(page), pageSize: "20" });
            if (search) params.set("search", search);
            if (filters?.status) params.set("status", filters.status);
            if (filters?.priority) params.set("priority", filters.priority);
            return fetchJson<AdminTask[]>(`/api/admin/compliance/tasks?${params}`);
        },
        retry: false,
    });
}

export interface AdminPolicy {
    id: string;
    title: string;
    status: string | null;
    category: string | null;
    cqc_domain: string | null;
    review_date: string | null;
    updated_at: string;
    organization_id: string | null;
    organizationName: string | null;
    serviceType: string | null;
    created_at: string;
}

export function useAdminPolicies(search: string, page: number, filters?: { status?: string }) {
    return useQuery({
        queryKey: ["admin", "compliance", "policies", search, page, filters],
        queryFn: () => {
            const params = new URLSearchParams({ page: String(page), pageSize: "20" });
            if (search) params.set("search", search);
            if (filters?.status) params.set("status", filters.status);
            return fetchJson<AdminPolicy[]>(`/api/admin/compliance/policies?${params}`);
        },
        retry: false,
    });
}

export interface AdminEvidence {
    id: string;
    title: string;
    description: string | null;
    status: string | null;
    type: string | null;
    linked_domains: string[] | null;
    linked_kloes: string[] | null;
    file_url: string | null;
    expiry_date: string | null;
    organization_id: string | null;
    organizationName: string | null;
    serviceType: string | null;
    created_at: string;
}

export function useAdminEvidence(search: string, page: number) {
    return useQuery({
        queryKey: ["admin", "compliance", "evidence", search, page],
        queryFn: () => {
            const params = new URLSearchParams({ page: String(page), pageSize: "20" });
            if (search) params.set("search", search);
            return fetchJson<AdminEvidence[]>(`/api/admin/compliance/evidence?${params}`);
        },
        retry: false,
    });
}

export interface AdminIncident {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    severity: string | null;
    status: string | null;
    reported_by: string | null;
    reported_date: string | null;
    resolution_date: string | null;
    organization_id: string | null;
    organizationName: string | null;
    serviceType: string | null;
    created_at: string;
}

export function useAdminIncidents(search: string, page: number, filters?: { status?: string; severity?: string }) {
    return useQuery({
        queryKey: ["admin", "compliance", "incidents", search, page, filters],
        queryFn: () => {
            const params = new URLSearchParams({ page: String(page), pageSize: "20" });
            if (search) params.set("search", search);
            if (filters?.status) params.set("status", filters.status);
            if (filters?.severity) params.set("severity", filters.severity);
            return fetchJson<AdminIncident[]>(`/api/admin/compliance/incidents?${params}`);
        },
        retry: false,
    });
}

export interface AdminAuditLog {
    id: string;
    organization_id: string | null;
    organizationName: string | null;
    user_id: string | null;
    user_name: string | null;
    entity_type: string | null;
    entity_id: string | null;
    action: string;
    details: Record<string, unknown> | null;
    created_at: string;
}

export function useAdminAuditLog(search: string, page: number, filters?: { action?: string; orgId?: string }) {
    return useQuery({
        queryKey: ["admin", "audit-log", search, page, filters],
        queryFn: () => {
            const params = new URLSearchParams({ page: String(page), pageSize: "30" });
            if (search) params.set("search", search);
            if (filters?.action) params.set("action", filters.action);
            if (filters?.orgId) params.set("orgId", filters.orgId);
            return fetchJson<AdminAuditLog[]>(`/api/admin/audit-log?${params}`);
        },
        retry: false,
    });
}

export interface AdminSyncStatus {
    summary: { connected: number; healthy: number; stale: number; failed: number };
    syncJobs: Array<{
        organizationId: string;
        organizationName: string;
        serviceType: string | null;
        lastSync: string;
        status: string;
        recordsSynced: number;
        error: string | null;
    }>;
}

export function useAdminSync() {
    return useQuery({
        queryKey: ["admin", "sync"],
        queryFn: () => fetchJson<AdminSyncStatus>("/api/admin/sync").then((r) => r.data),
        retry: false,
    });
}
