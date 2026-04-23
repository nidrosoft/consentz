"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Download01, FileCheck02, SearchLg } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { useAllPolicyTemplates, getPolicyTemplateDownloadUrl, type PolicyTemplateDTO } from "@/hooks/use-policy-templates";

// Display order for the 10 Cura categories. Supplementary policies (GOV-08,
// FIN-50-56, MKT-67/69-71, etc.) surface under a "Supplementary" pseudo-group.
const CATEGORY_ORDER = [
    "GOV", "CPS", "CLP", "COM", "FIN",
    "SEC", "MKT", "HWB", "SPS", "PWI",
];

export default function PolicyTemplatesPage() {
    const router = useRouter();
    const { data: templates, isLoading } = useAllPolicyTemplates();
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return templates ?? [];
        return (templates ?? []).filter((t) =>
            t.code.toLowerCase().includes(q)
            || t.title.toLowerCase().includes(q)
            || t.categoryLabel.toLowerCase().includes(q),
        );
    }, [templates, search]);

    const grouped = useMemo(() => {
        const map = new Map<string, { label: string; templates: PolicyTemplateDTO[] }>();
        for (const t of filtered) {
            const existing = map.get(t.category);
            if (existing) existing.templates.push(t);
            else map.set(t.category, { label: t.categoryLabel, templates: [t] });
        }
        // Order by the canonical category sequence.
        const ordered: Array<{ category: string; label: string; templates: PolicyTemplateDTO[] }> = [];
        for (const cat of CATEGORY_ORDER) {
            const g = map.get(cat);
            if (g) ordered.push({ category: cat, ...g });
        }
        // Any uncategorised ones last (shouldn't happen but defensive).
        for (const [cat, g] of map) {
            if (!CATEGORY_ORDER.includes(cat)) ordered.push({ category: cat, ...g });
        }
        return ordered;
    }, [filtered]);

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <Button color="link-color" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/policies")}>Back to Policies</Button>

            <div className="flex flex-col gap-2">
                <h1 className="text-display-xs font-semibold text-primary">Policy Templates</h1>
                <p className="text-sm text-tertiary">
                    CQC-aligned policy templates from the Cura Cosmetic Clinic Policies &amp; Procedures Manual.
                    Each template is pre-filled with your clinic details; download, review, and adopt as your own.
                </p>
            </div>

            <div className="max-w-md">
                <Input
                    icon={SearchLg}
                    placeholder="Search templates by code, title, or category..."
                    value={search}
                    onChange={setSearch}
                />
            </div>

            {isLoading && (
                <p className="text-sm text-tertiary">Loading templates…</p>
            )}

            {!isLoading && filtered.length === 0 && (
                <EmptyState size="sm">
                    <EmptyState.Header>
                        <EmptyState.FeaturedIcon icon={FileCheck02} color="gray" />
                    </EmptyState.Header>
                    <EmptyState.Content>
                        <EmptyState.Title>No templates match your search</EmptyState.Title>
                        <EmptyState.Description>Try a different keyword or clear the search.</EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState>
            )}

            {!isLoading && grouped.map((group) => (
                <section key={group.category} className="flex flex-col gap-3">
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-md font-semibold text-primary">{group.label}</h2>
                        <span className="text-xs text-tertiary">{group.templates.length} template{group.templates.length === 1 ? "" : "s"}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {group.templates.map((t) => (
                            <div
                                key={t.id}
                                className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-4 sm:p-5"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <Badge size="sm" color="brand" type="pill-color">{t.code}</Badge>
                                    {t.isSupplementary && <Badge size="sm" color="gray" type="pill-color">Supplementary</Badge>}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-primary line-clamp-2">{t.title}</h3>
                                </div>
                                <a
                                    href={getPolicyTemplateDownloadUrl(t.code)}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-solid px-3 py-2 text-sm font-semibold text-white hover:bg-brand-solid_hover transition"
                                    download
                                >
                                    <Download01 className="size-4" />
                                    Download
                                </a>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
