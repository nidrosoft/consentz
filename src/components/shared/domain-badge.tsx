"use client";

import type { FC } from "react";
import { ShieldTick, Target02, Heart, Zap, Trophy01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import type { DomainSlug } from "@/types";

const DOMAIN_CONFIG: Record<DomainSlug, {
    icon: FC<{ className?: string }>;
    label: string;
    text: string;
    bg: string;
    border: string;
}> = {
    safe: { icon: ShieldTick, label: "Safe", text: "text-[#3B82F6]", bg: "bg-[#EFF6FF]", border: "border-[#BFDBFE]" },
    effective: { icon: Target02, label: "Effective", text: "text-[#8B5CF6]", bg: "bg-[#F5F3FF]", border: "border-[#DDD6FE]" },
    caring: { icon: Heart, label: "Caring", text: "text-[#EC4899]", bg: "bg-[#FDF2F8]", border: "border-[#FBCFE8]" },
    responsive: { icon: Zap, label: "Responsive", text: "text-[#F59E0B]", bg: "bg-[#FFFBEB]", border: "border-[#FDE68A]" },
    "well-led": { icon: Trophy01, label: "Well-Led", text: "text-[#10B981]", bg: "bg-[#ECFDF5]", border: "border-[#A7F3D0]" },
};

export function getDomainConfig(slug: DomainSlug) {
    return DOMAIN_CONFIG[slug];
}

interface DomainBadgeProps {
    domain: DomainSlug;
    size?: "sm" | "md";
    showIcon?: boolean;
}

export function DomainBadge({ domain, size = "sm", showIcon = true }: DomainBadgeProps) {
    const config = DOMAIN_CONFIG[domain];
    if (!config) return null;
    const Icon = config.icon;

    return (
        <span className={cx(
            "inline-flex items-center gap-1 rounded-full border font-medium",
            config.bg, config.border, config.text,
            size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        )}>
            {showIcon && <Icon className="size-3" />}
            {config.label}
        </span>
    );
}

interface DomainBadgeListProps {
    domains: DomainSlug[];
    size?: "sm" | "md";
    showIcon?: boolean;
    max?: number;
}

export function DomainBadgeList({ domains, size = "sm", showIcon = true, max }: DomainBadgeListProps) {
    const shown = max ? domains.slice(0, max) : domains;
    const remaining = max && domains.length > max ? domains.length - max : 0;

    return (
        <span className="inline-flex flex-wrap items-center gap-1">
            {shown.map((d) => <DomainBadge key={d} domain={d} size={size} showIcon={showIcon} />)}
            {remaining > 0 && (
                <span className="rounded-full border border-secondary bg-secondary px-2 py-0.5 text-xs font-medium text-tertiary">
                    +{remaining}
                </span>
            )}
        </span>
    );
}
