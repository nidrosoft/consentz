"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle, AlertCircle, ShieldTick } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import type { TreatmentRiskHeatmapReport } from "@/lib/consentz/types";

interface TreatmentRiskHeatmapProps {
    data: TreatmentRiskHeatmapReport;
}

function riskColor(value: number, max: number): string {
    if (max === 0) return "bg-[#ECFDF5]";
    const ratio = value / max;
    if (ratio === 0) return "bg-[#ECFDF5]";
    if (ratio < 0.2) return "bg-[#A7F3D0]";
    if (ratio < 0.4) return "bg-[#FDE68A]";
    if (ratio < 0.6) return "bg-[#FDBA74]";
    if (ratio < 0.8) return "bg-[#F87171]";
    return "bg-[#EF4444]";
}

function riskTextColor(value: number, max: number): string {
    if (max === 0) return "text-[#065F46]";
    const ratio = value / max;
    if (ratio === 0) return "text-[#065F46]";
    if (ratio < 0.2) return "text-[#065F46]";
    if (ratio < 0.4) return "text-[#78350F]";
    if (ratio < 0.6) return "text-[#7C2D12]";
    return "text-white";
}

export function TreatmentRiskHeatmap({ data }: TreatmentRiskHeatmapProps) {
    const { heatmapData, outcomeBreakdown, totalRows, from, to } = data;
    const { categories, data: matrix } = heatmapData;

    const maxValue = useMemo(() => {
        let m = 0;
        for (const row of matrix) {
            for (const v of row) {
                if (v > m) m = v;
            }
        }
        return m;
    }, [matrix]);

    const totalOutcomes = outcomeBreakdown.green + outcomeBreakdown.yellow + outcomeBreakdown.red;
    const greenPct = totalOutcomes > 0 ? Math.round((outcomeBreakdown.green / totalOutcomes) * 100) : 0;
    const yellowPct = totalOutcomes > 0 ? Math.round((outcomeBreakdown.yellow / totalOutcomes) * 100) : 0;
    const redPct = totalOutcomes > 0 ? Math.round((outcomeBreakdown.red / totalOutcomes) * 100) : 0;

    return (
        <div className="space-y-5">
            {/* Outcome summary */}
            <div className="grid grid-cols-3 gap-3">
                <div className="relative overflow-hidden rounded-xl border border-[#059669]/20 bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-[#059669]/10">
                            <CheckCircle className="size-5 text-[#059669]" />
                        </div>
                        <div className="flex-1">
                            <p className="text-2xl font-bold text-[#065F46]">{greenPct}%</p>
                            <p className="text-xs font-medium text-[#065F46]/70">Good outcomes</p>
                        </div>
                        <span className="rounded-full bg-[#059669]/10 px-2.5 py-1 text-sm font-bold text-[#059669]">{outcomeBreakdown.green}</span>
                    </div>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-[#D97706]/20 bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-[#D97706]/10">
                            <AlertTriangle className="size-5 text-[#D97706]" />
                        </div>
                        <div className="flex-1">
                            <p className="text-2xl font-bold text-[#92400E]">{yellowPct}%</p>
                            <p className="text-xs font-medium text-[#92400E]/70">Moderate risk</p>
                        </div>
                        <span className="rounded-full bg-[#D97706]/10 px-2.5 py-1 text-sm font-bold text-[#D97706]">{outcomeBreakdown.yellow}</span>
                    </div>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-[#DC2626]/20 bg-gradient-to-br from-[#FEF2F2] to-[#FEE2E2] px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-[#DC2626]/10">
                            <AlertCircle className="size-5 text-[#DC2626]" />
                        </div>
                        <div className="flex-1">
                            <p className="text-2xl font-bold text-[#991B1B]">{redPct}%</p>
                            <p className="text-xs font-medium text-[#991B1B]/70">High risk</p>
                        </div>
                        <span className="rounded-full bg-[#DC2626]/10 px-2.5 py-1 text-sm font-bold text-[#DC2626]">{outcomeBreakdown.red}</span>
                    </div>
                </div>
            </div>

            {/* Heatmap grid */}
            <div className="overflow-x-auto rounded-xl border border-secondary bg-secondary/50 p-4">
                <div className="min-w-[500px]">
                    {/* Column headers */}
                    <div className="flex">
                        <div className="w-36 shrink-0" />
                        {categories.x.map((label) => (
                            <div key={label} className="flex-1 px-1 pb-3 text-center">
                                <span className="text-xs font-semibold text-primary truncate block" title={label}>{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Rows */}
                    {categories.y.map((rowLabel, rowIdx) => (
                        <div key={rowLabel} className="flex items-stretch">
                            <div className="flex w-36 shrink-0 items-center pr-3">
                                <span className="text-xs font-semibold text-primary truncate" title={rowLabel}>{rowLabel}</span>
                            </div>
                            {matrix[rowIdx]?.map((value, colIdx) => (
                                <div
                                    key={colIdx}
                                    className={cx(
                                        "flex flex-1 items-center justify-center border-2 border-white py-4 transition duration-150 hover:scale-105 hover:shadow-md hover:z-10",
                                        riskColor(value, maxValue),
                                        rowIdx === 0 && colIdx === 0 && "rounded-tl-lg",
                                        rowIdx === 0 && colIdx === categories.x.length - 1 && "rounded-tr-lg",
                                        rowIdx === categories.y.length - 1 && colIdx === 0 && "rounded-bl-lg",
                                        rowIdx === categories.y.length - 1 && colIdx === categories.x.length - 1 && "rounded-br-lg",
                                    )}
                                    title={`${rowLabel} × ${categories.x[colIdx]}: ${value}`}
                                >
                                    <span className={cx("text-sm font-bold", riskTextColor(value, maxValue))}>
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend + metadata */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-secondary">Risk level:</span>
                    {[
                        { color: "bg-[#A7F3D0]", label: "Low" },
                        { color: "bg-[#FDE68A]", label: "Moderate" },
                        { color: "bg-[#FDBA74]", label: "Elevated" },
                        { color: "bg-[#F87171]", label: "High" },
                        { color: "bg-[#EF4444]", label: "Critical" },
                    ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <span className={cx("size-3 rounded", color)} />
                            <span className="text-xs text-tertiary">{label}</span>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-tertiary">
                    <span className="font-medium">{totalRows} treatments analysed</span>
                    {from && to && <span>{from} — {to}</span>}
                </div>
            </div>
        </div>
    );
}

export function TreatmentRiskHeatmapSkeleton() {
    return (
        <div className="space-y-5 animate-pulse">
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-xl bg-quaternary" />
                ))}
            </div>
            <div className="h-48 rounded-xl bg-quaternary" />
        </div>
    );
}

export function TreatmentRiskHeatmapEmpty() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
                <ShieldTick className="size-5 text-fg-quaternary" />
            </div>
            <p className="text-sm font-medium text-primary">No treatment risk data available</p>
            <p className="max-w-sm text-center text-xs text-tertiary">
                Connect your Consentz integration in Settings to sync treatment data and generate the risk heatmap.
            </p>
        </div>
    );
}
