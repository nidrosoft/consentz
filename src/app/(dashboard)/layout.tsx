"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
    Home01, BarChartSquare02, File06, FileCheck02, Users01,
    AlertTriangle, CheckSquare, PieChart01, ClipboardCheck,
    Settings01, Bell01,
    ShieldTick, Target02, Heart, Zap, Trophy01,
} from "@untitledui/icons";
import { SidebarNavigationSectionsSubheadings } from "@/components/application/app-navigation/sidebar-navigation/sidebar-sections-subheadings";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { mockUser, mockNotifications } from "@/lib/mock-data";
import type { NavItemType } from "@/components/application/app-navigation/config";

const unreadCount = mockNotifications.filter((n) => !n.isRead).length;

const navItems: Array<{ label: string; items: NavItemType[] }> = [
    {
        label: "Main",
        items: [
            { label: "Dashboard", href: "/", icon: Home01 },
            { label: "Evidence", href: "/evidence", icon: File06 },
            { label: "Policies", href: "/policies", icon: FileCheck02 },
            { label: "Staff", href: "/staff", icon: Users01 },
            { label: "Incidents", href: "/incidents", icon: AlertTriangle },
            {
                label: "Tasks",
                href: "/tasks",
                icon: CheckSquare,
                badge: (
                    <Badge size="sm" type="modern">
                        3
                    </Badge>
                ),
            },
        ],
    },
    {
        label: "CQC Domains",
        items: [
            { label: "All Domains", href: "/domains", icon: BarChartSquare02 },
            { label: "Safe", href: "/domains/safe", icon: ShieldTick },
            { label: "Effective", href: "/domains/effective", icon: Target02 },
            { label: "Caring", href: "/domains/caring", icon: Heart },
            { label: "Responsive", href: "/domains/responsive", icon: Zap },
            { label: "Well-Led", href: "/domains/well-led", icon: Trophy01 },
        ],
    },
    {
        label: "Reports",
        items: [
            { label: "Reports", href: "/reports", icon: PieChart01 },
            { label: "Audit Log", href: "/audits", icon: ClipboardCheck },
        ],
    },
];

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs = [{ label: "Dashboard", href: "/" }];
    const map: Record<string, string> = {
        domains: "Domains",
        evidence: "Evidence",
        policies: "Policies",
        staff: "Staff",
        incidents: "Incidents",
        tasks: "Tasks",
        reports: "Reports",
        audits: "Audit Log",
        settings: "Settings",
        notifications: "Notifications",
        safe: "Safe",
        effective: "Effective",
        caring: "Caring",
        responsive: "Responsive",
        "well-led": "Well-Led",
        organization: "Organization",
        users: "Users",
        billing: "Billing",
        integrations: "Integrations",
        upload: "Upload",
        create: "Create",
        templates: "Templates",
        add: "Add",
        training: "Training",
        report: "Report",
        compliance: "Compliance",
        "inspection-prep": "Inspection Prep",
        export: "Export",
    };
    let path = "";
    for (const part of parts) {
        path += `/${part}`;
        crumbs.push({ label: map[part] ?? part, href: path });
    }
    return crumbs;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const breadcrumbs = getBreadcrumbs(pathname);

    return (
        <div className="flex min-h-screen bg-primary">
            {/* Sidebar — Untitled UI SidebarNavigationSectionsSubheadings */}
            <SidebarNavigationSectionsSubheadings activeUrl={pathname} items={navItems} />

            {/* Main area */}
            <div className="flex flex-1 flex-col">
                {/* Header bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-secondary bg-primary px-4 md:px-6">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-1 text-sm">
                        {breadcrumbs.map((crumb, i) => (
                            <span key={crumb.href} className="flex items-center gap-1">
                                {i > 0 && <span className="text-quaternary">/</span>}
                                {i === breadcrumbs.length - 1 ? (
                                    <span className="font-medium text-primary">{crumb.label}</span>
                                ) : (
                                    <button
                                        onClick={() => router.push(crumb.href)}
                                        className="text-tertiary transition duration-100 hover:text-secondary"
                                    >
                                        {crumb.label}
                                    </button>
                                )}
                            </span>
                        ))}
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push("/settings")}
                            className="flex size-10 items-center justify-center rounded-lg transition duration-100 hover:bg-primary_hover"
                            aria-label="Settings"
                        >
                            <Settings01 className="size-5 text-fg-secondary" />
                        </button>
                        <button
                            onClick={() => router.push("/notifications")}
                            className="relative flex size-10 items-center justify-center rounded-lg transition duration-100 hover:bg-primary_hover"
                        >
                            <Bell01 className="size-5 text-fg-secondary" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-error-solid text-[10px] font-bold text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => router.push("/settings")}
                            className="flex size-10 items-center justify-center rounded-lg transition duration-100 hover:bg-primary_hover"
                        >
                            <Avatar size="sm" initials={mockUser.name.split(" ").map((n) => n[0]).join("")} />
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="px-4 py-6 md:py-8">{children}</div>
                </main>
            </div>
        </div>
    );
}
