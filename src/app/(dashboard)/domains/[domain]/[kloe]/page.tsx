"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, File06, AlertTriangle, CheckCircle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { cx } from "@/utils/cx";
import { mockGaps, mockEvidence } from "@/lib/mock-data";
import { KLOES, REGULATIONS } from "@/lib/constants/cqc-framework";
import type { DomainSlug } from "@/types";

const SEVERITY_DOT: Record<string, string> = {
    CRITICAL: "bg-error-solid", HIGH: "bg-warning-solid", MEDIUM: "bg-brand-solid", LOW: "bg-quaternary",
};
const SEVERITY_BADGE: Record<string, "error" | "warning" | "brand" | "gray"> = {
    CRITICAL: "error", HIGH: "warning", MEDIUM: "brand", LOW: "gray",
};

export default function KloeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const domainSlug = params.domain as DomainSlug;
    const kloeCode = (params.kloe as string).toUpperCase();

    const kloe = KLOES.find((k) => k.code === kloeCode);
    const kloeGaps = mockGaps.filter((g) => g.kloe === kloeCode);
    const kloeEvidence = mockEvidence.filter((e) => e.linkedKloes.includes(kloeCode));
    const kloeRegulations = REGULATIONS.filter((r) => r.domains.includes(domainSlug));
    const mockScore = kloeGaps.filter((g) => g.status === "OPEN").length === 0 ? 85 : kloeGaps.some((g) => g.severity === "CRITICAL") ? 40 : 60;
    const openGaps = kloeGaps.filter((g) => g.status === "OPEN");

    if (!kloe) return <p className="text-tertiary">KLOE not found.</p>;

    return (
        <div className="flex flex-col gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push(`/domains/${domainSlug}`)}>
                Back to {domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)}
            </Button>

            <div>
                <div className="flex items-center gap-2">
                    <Badge size="md" color="gray" type="pill-color">{kloe.code}</Badge>
                    <h1 className="text-display-xs font-semibold text-primary">{kloe.title}</h1>
                </div>
                <p className="mt-1 text-sm text-tertiary">Domain: {domainSlug.charAt(0).toUpperCase() + domainSlug.slice(1)}</p>
            </div>

            {/* Score */}
            <div className="rounded-xl border border-secondary bg-primary p-5">
                <div className="flex items-center gap-4">
                    <span className="font-mono text-2xl font-bold text-primary">{mockScore}%</span>
                    <div className="flex-1"><ProgressBarBase value={mockScore} min={0} max={100} /></div>
                    <Badge size="sm" color={kloeGaps.filter((g) => g.status === "OPEN").length === 0 ? "success" : "warning"} type="pill-color">
                        {kloeGaps.filter((g) => g.status === "OPEN").length === 0 ? "Compliant" : "Gaps Found"}
                    </Badge>
                </div>
            </div>

            {/* Linked Regulations */}
            {kloeRegulations.length > 0 && (
                <div>
                    <h2 className="mb-3 text-lg font-semibold text-primary">Linked Regulations</h2>
                    <div className="flex flex-wrap gap-2">
                        {kloeRegulations.map((reg) => (
                            <div key={reg.code} className="rounded-lg border border-secondary bg-primary px-3 py-2">
                                <span className="text-sm font-medium text-primary">{reg.code.replace("REG", "Reg ")}</span>
                                <span className="ml-1.5 text-sm text-tertiary">{reg.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Requirements Checklist */}
            <div>
                <h2 className="mb-3 text-lg font-semibold text-primary">Requirements Checklist</h2>
                <div className="rounded-xl border border-secondary bg-primary">
                    {[
                        { label: "Policy or procedure documented", done: kloeEvidence.some((e) => e.type === "POLICY") },
                        { label: "Evidence uploaded and linked", done: kloeEvidence.length > 0 },
                        { label: "No open compliance gaps", done: openGaps.length === 0 },
                        { label: "Staff training completed", done: kloeEvidence.some((e) => e.type === "TRAINING_RECORD") },
                        { label: "Last audit within 12 months", done: kloeEvidence.some((e) => e.type === "AUDIT_REPORT") },
                    ].map((item, i) => (
                        <div key={item.label} className={cx("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-secondary")}>
                            {item.done ? (
                                <CheckCircle className="size-5 shrink-0 text-success-primary" />
                            ) : (
                                <div className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-tertiary" />
                            )}
                            <span className={cx("text-sm", item.done ? "text-primary" : "text-tertiary")}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Linked Evidence */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-primary">Linked Evidence ({kloeEvidence.length})</h2>
                    <Button color="secondary" size="sm" onClick={() => router.push("/evidence/upload")}>Upload Evidence</Button>
                </div>
                {kloeEvidence.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {kloeEvidence.map((ev) => (
                            <button
                                key={ev.id}
                                onClick={() => router.push(`/evidence/${ev.id}`)}
                                className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4 text-left transition duration-100 hover:border-brand-300"
                            >
                                <File06 className="size-5 text-fg-quaternary" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-primary">{ev.name}</p>
                                    <p className="text-xs text-tertiary">{ev.type} &middot; {ev.fileSize} &middot; Uploaded by {ev.uploadedBy}</p>
                                </div>
                                <Badge size="sm" color={ev.status === "VALID" ? "success" : ev.status === "EXPIRED" ? "error" : "warning"} type="pill-color">
                                    {ev.status.replace("_", " ")}
                                </Badge>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-secondary bg-secondary p-8 text-center">
                        <p className="text-sm text-tertiary">No evidence linked to this KLOE yet.</p>
                        <Button color="primary" size="sm" className="mt-3" onClick={() => router.push("/evidence/upload")}>Upload Evidence</Button>
                    </div>
                )}
            </div>

            {/* Gaps */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-primary">Compliance Gaps ({kloeGaps.length})</h2>
                {kloeGaps.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {kloeGaps.map((gap) => (
                            <div key={gap.id} className="rounded-xl border border-secondary bg-primary p-4">
                                <div className="flex items-start gap-3">
                                    <span className={cx("mt-1 size-2.5 shrink-0 rounded-full", SEVERITY_DOT[gap.severity])} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-primary">{gap.title}</p>
                                        <p className="mt-1 text-xs text-tertiary">{gap.description}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Badge size="sm" color={SEVERITY_BADGE[gap.severity]} type="pill-color">{gap.severity}</Badge>
                                            <Badge size="sm" color="gray" type="pill-color">{gap.status.replace("_", " ")}</Badge>
                                            <span className="text-xs text-tertiary">{gap.regulation}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <Button color="secondary" size="sm">View Remediation</Button>
                                    <Button color="tertiary" size="sm">Mark Resolved</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-success-200 bg-success-primary p-4">
                        <CheckCircle className="size-5 text-success-primary" />
                        <p className="text-sm font-medium text-success-primary">No gaps — this KLOE is fully compliant.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
