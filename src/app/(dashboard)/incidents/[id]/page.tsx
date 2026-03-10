"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, AlertTriangle, Calendar, User01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { useIncidentDetail } from "@/hooks/use-incidents";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import type { Incident } from "@/types";

const SEVERITY_BADGE: Record<string, "error" | "warning" | "gray" | "brand"> = {
    CRITICAL: "error", MAJOR: "warning", MINOR: "brand", NEAR_MISS: "gray",
};

export default function IncidentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params.id === "string" ? params.id : "";
    const { data, isLoading, error, refetch } = useIncidentDetail(id);
    const incident = data as Incident | undefined;

    if (isLoading) return <PageSkeleton variant="detail" />;

    if (error || !incident) {
        return (
            <div className="flex flex-col gap-4">
                <p className="text-sm text-tertiary">Incident not found.</p>
                {error && (
                    <Button color="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/incidents")}>Back to Incidents</Button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="size-6 text-error-primary" />
                        <h1 className="text-display-xs font-semibold text-primary">{incident.title}</h1>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge size="sm" color={SEVERITY_BADGE[incident.severity]} type="pill-color">{incident.severity.replace("_", " ")}</Badge>
                        <Badge size="sm" color="gray" type="pill-color">{incident.status}</Badge>
                        <span className="text-xs text-tertiary">{incident.category}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {incident.status === "REPORTED" && <Button color="primary" size="sm">Begin Investigation</Button>}
                    {incident.status === "INVESTIGATING" && <Button color="primary" size="sm">Mark Resolved</Button>}
                    {incident.status === "RESOLVED" && <Button color="secondary" size="sm">Close Incident</Button>}
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <User01 className="size-5 text-fg-quaternary" />
                    <div>
                        <p className="text-xs text-tertiary">Reported by</p>
                        <p className="text-sm font-medium text-primary">{incident.reportedBy}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <Calendar className="size-5 text-fg-quaternary" />
                    <div>
                        <p className="text-xs text-tertiary">Date/Time</p>
                        <p className="text-sm font-medium text-primary">{new Date(incident.reportedAt).toLocaleString("en-GB")}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4">
                    <AlertTriangle className="size-5 text-fg-quaternary" />
                    <div>
                        <p className="text-xs text-tertiary">Domain</p>
                        <p className="text-sm font-medium text-primary capitalize">{incident.domain}</p>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <h2 className="mb-3 text-lg font-semibold text-primary">Description</h2>
                <p className="text-sm text-secondary">{incident.description}</p>
            </div>

            {/* Investigation timeline placeholder */}
            <div className="rounded-xl border border-secondary bg-primary p-6">
                <h2 className="mb-3 text-lg font-semibold text-primary">Investigation Timeline</h2>
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 size-2 shrink-0 rounded-full bg-warning-solid" />
                        <div>
                            <p className="text-sm font-medium text-primary">Incident reported</p>
                            <p className="text-xs text-tertiary">{new Date(incident.reportedAt).toLocaleString("en-GB")} by {incident.reportedBy}</p>
                        </div>
                    </div>
                    {incident.status !== "REPORTED" && (
                        <div className="flex items-start gap-3">
                            <div className="mt-1 size-2 shrink-0 rounded-full bg-brand-solid" />
                            <div>
                                <p className="text-sm font-medium text-primary">Investigation started</p>
                                <p className="text-xs text-tertiary">Assigned to Registered Manager for review</p>
                            </div>
                        </div>
                    )}
                    {(incident.status === "RESOLVED" || incident.status === "CLOSED") && (
                        <div className="flex items-start gap-3">
                            <div className="mt-1 size-2 shrink-0 rounded-full bg-success-solid" />
                            <div>
                                <p className="text-sm font-medium text-primary">Incident resolved</p>
                                <p className="text-xs text-tertiary">Corrective actions implemented</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
