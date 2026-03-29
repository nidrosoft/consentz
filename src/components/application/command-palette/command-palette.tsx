"use client";

import { useState, useEffect, useMemo, type FC, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import {
    BarChart01,
    ShieldTick,
    Target02,
    Heart,
    Zap,
    Trophy01,
    File06,
    BookOpen01,
    Users01,
    AlertTriangle,
    CheckSquare,
    Settings01,
    Bell01,
    PieChart01,
    SearchLg,
} from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface CommandItem {
    id: string;
    label: string;
    section: string;
    href: string;
    icon: FC<{ className?: string }>;
    keywords?: string[];
}

const COMMANDS: CommandItem[] = [
    { id: "dashboard", label: "Dashboard", section: "Navigation", href: "/", icon: BarChart01, keywords: ["home", "overview"] },
    { id: "domains", label: "All Domains", section: "CQC Domains", href: "/domains", icon: ShieldTick },
    { id: "safe", label: "Safe Domain", section: "CQC Domains", href: "/domains/safe", icon: ShieldTick, keywords: ["safeguarding"] },
    { id: "effective", label: "Effective Domain", section: "CQC Domains", href: "/domains/effective", icon: Target02 },
    { id: "caring", label: "Caring Domain", section: "CQC Domains", href: "/domains/caring", icon: Heart },
    { id: "responsive", label: "Responsive Domain", section: "CQC Domains", href: "/domains/responsive", icon: Zap },
    { id: "well-led", label: "Well-Led Domain", section: "CQC Domains", href: "/domains/well-led", icon: Trophy01 },
    { id: "evidence", label: "Evidence Library", section: "Navigation", href: "/evidence", icon: File06, keywords: ["documents", "upload"] },
    { id: "policies", label: "Policies", section: "Navigation", href: "/policies", icon: BookOpen01, keywords: ["policy", "generate"] },
    { id: "staff", label: "Staff Directory", section: "Navigation", href: "/staff", icon: Users01, keywords: ["team", "training"] },
    { id: "incidents", label: "Incidents", section: "Navigation", href: "/incidents", icon: AlertTriangle, keywords: ["report"] },
    { id: "tasks", label: "Tasks", section: "Navigation", href: "/tasks", icon: CheckSquare, keywords: ["todo", "remediation"] },
    { id: "reports", label: "Reports", section: "Navigation", href: "/reports", icon: PieChart01, keywords: ["export", "compliance"] },
    { id: "settings", label: "Settings", section: "Navigation", href: "/settings", icon: Settings01 },
    { id: "notifications", label: "Notifications", section: "Navigation", href: "/notifications", icon: Bell01 },
    { id: "audit", label: "Audit Log", section: "Navigation", href: "/audits", icon: PieChart01, keywords: ["activity", "history"] },
];

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState(0);
    const router = useRouter();

    useHotkeys(
        "mod+k",
        (e) => {
            e.preventDefault();
            setOpen((o) => !o);
            setQuery("");
            setSelected(0);
        },
        { enableOnFormTags: true },
    );

    const filtered = useMemo(() => {
        if (!query) return COMMANDS;
        const q = query.toLowerCase();
        return COMMANDS.filter(
            (c) =>
                c.label.toLowerCase().includes(q) ||
                c.section.toLowerCase().includes(q) ||
                c.keywords?.some((k) => k.includes(q)),
        );
    }, [query]);

    useEffect(() => {
        setSelected(0);
    }, [query]);

    function navigate(href: string) {
        setOpen(false);
        setQuery("");
        router.push(href);
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelected((s) =>
                filtered.length === 0 ? 0 : Math.min(s + 1, filtered.length - 1),
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelected((s) => Math.max(s - 1, 0));
        } else if (e.key === "Enter" && filtered[selected]) {
            navigate(filtered[selected].href);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    }

    if (!open) return null;

    const sections = [...new Set(filtered.map((c) => c.section))];

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-overlay/60" onClick={() => setOpen(false)} />
            <div className="fixed top-[20%] left-1/2 z-[101] w-full max-w-lg -translate-x-1/2 rounded-xl border border-secondary bg-primary shadow-2xl">
                <div className="flex items-center gap-2 border-b border-secondary px-4 py-3">
                    <SearchLg className="size-5 text-fg-quaternary" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search pages..."
                        className="flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-placeholder"
                    />
                    <kbd className="rounded border border-secondary px-1.5 py-0.5 text-xs text-tertiary">Esc</kbd>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                    {filtered.length === 0 && (
                        <p className="py-6 text-center text-sm text-tertiary">No results found.</p>
                    )}
                    {sections.map((section) => (
                        <div key={section}>
                            <p className="px-2 pt-2 pb-1 text-xs font-semibold text-tertiary">{section}</p>
                            {filtered
                                .filter((c) => c.section === section)
                                .map((cmd) => {
                                    const idx = filtered.indexOf(cmd);
                                    const Icon = cmd.icon;
                                    return (
                                        <button
                                            key={cmd.id}
                                            type="button"
                                            onClick={() => navigate(cmd.href)}
                                            onMouseEnter={() => setSelected(idx)}
                                            className={cx(
                                                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm",
                                                idx === selected
                                                    ? "bg-active text-primary"
                                                    : "text-secondary hover:bg-primary_hover",
                                            )}
                                        >
                                            <Icon className="size-4 text-fg-quaternary" />
                                            {cmd.label}
                                        </button>
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
