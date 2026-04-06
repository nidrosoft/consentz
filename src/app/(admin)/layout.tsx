"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
    Home01, Building07, Users01, Settings01,
    CreditCard01, Shield01, Lock01, ArrowLeft,
    BarChart01, CheckSquare, File06, AlertCircle, FileCheck02,
    RefreshCw05, ClipboardCheck, Sliders01, LogOut01,
} from "@untitledui/icons";
import { SidebarNavigationSectionsSubheadings } from "@/components/application/app-navigation/sidebar-navigation/sidebar-sections-subheadings";
import { Toaster } from "@/components/application/notifications/toaster";
import type { NavItemType } from "@/components/application/app-navigation/config";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const adminNavItems: Array<{ label: string; items: NavItemType[] }> = [
    {
        label: "Platform",
        items: [
            { label: "Overview", href: "/admin", icon: Home01 },
            { label: "Organizations", href: "/admin/organizations", icon: Building07 },
            { label: "Users", href: "/admin/users", icon: Users01 },
            { label: "Revenue", href: "/admin/revenue", icon: CreditCard01 },
        ],
    },
    {
        label: "Compliance",
        items: [
            { label: "Compliance Overview", href: "/admin/compliance", icon: BarChart01 },
            { label: "Tasks & Gaps", href: "/admin/compliance/tasks", icon: CheckSquare },
            { label: "Policies", href: "/admin/compliance/policies", icon: FileCheck02 },
            { label: "Evidence", href: "/admin/compliance/evidence", icon: File06 },
            { label: "Incidents", href: "/admin/compliance/incidents", icon: AlertCircle },
        ],
    },
    {
        label: "System",
        items: [
            { label: "Audit Log", href: "/admin/audit-log", icon: ClipboardCheck },
            { label: "Consentz Sync", href: "/admin/sync", icon: RefreshCw05 },
            { label: "Settings", href: "/admin/settings", icon: Sliders01 },
        ],
    },
];

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
    const crumbs = [{ label: "Admin", href: "/admin" }];
    const parts = pathname.replace("/admin", "").split("/").filter(Boolean);
    const map: Record<string, string> = {
        organizations: "Organizations",
        users: "Users",
        revenue: "Revenue",
        compliance: "Compliance",
        tasks: "Tasks & Gaps",
        policies: "Policies",
        evidence: "Evidence",
        incidents: "Incidents",
        "audit-log": "Audit Log",
        sync: "Consentz Sync",
        settings: "Settings",
    };
    let path = "/admin";
    for (const part of parts) {
        path += `/${part}`;
        crumbs.push({ label: map[part] ?? part, href: path });
    }
    return crumbs;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const breadcrumbs = getBreadcrumbs(pathname);

    const [status, setStatus] = useState<"loading" | "authorized" | "denied">("loading");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminRole, setAdminRole] = useState("");

    useEffect(() => {
        fetch("/api/admin/check")
            .then((r) => r.json())
            .then((d) => {
                setStatus(d.isAdmin ? "authorized" : "denied");
                if (d.role) setAdminRole(d.role);
            })
            .catch(() => setStatus("denied"));

        const supabase = createBrowserSupabaseClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data.user?.email) setAdminEmail(data.user.email);
        });
    }, []);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-primary">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-secondary">
                        <Shield01 className="size-7 text-fg-brand-primary animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-tertiary">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    if (status === "denied") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-primary">
                <div className="flex max-w-sm flex-col items-center gap-5 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-error-secondary">
                        <Lock01 className="size-7 text-fg-error-primary" />
                    </div>
                    <div>
                        <h1 className="text-display-xs font-semibold text-primary">Access Restricted</h1>
                        <p className="mt-2 text-sm text-tertiary">
                            This area is reserved for Consentz platform administrators only.
                            If you believe you should have access, contact the platform owner.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 rounded-lg border border-secondary bg-primary px-4 py-2 text-sm font-semibold text-secondary shadow-xs transition duration-100 hover:bg-primary_hover"
                    >
                        <ArrowLeft className="size-4" />
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-primary lg:flex-row">
            <SidebarNavigationSectionsSubheadings
                activeUrl={pathname}
                items={adminNavItems}
                user={{
                    name: adminRole === "super_admin" ? "Super Admin" : "Support Admin",
                    email: adminEmail || "admin@consentz.com",
                }}
                mobileHeaderActions={
                    <>
                        <button
                            onClick={() => router.push("/admin/settings")}
                            className="flex size-9 items-center justify-center rounded-lg transition duration-100 hover:bg-primary_hover"
                            aria-label="Settings"
                        >
                            <Settings01 className="size-4 text-fg-secondary" />
                        </button>
                        <button
                            onClick={() => router.push("/")}
                            className="rounded-lg border border-secondary px-2 py-1 text-xs font-medium text-secondary shadow-xs transition duration-100 hover:bg-primary_hover"
                        >
                            Back to App
                        </button>
                    </>
                }
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-secondary bg-primary px-4 lg:flex lg:px-6">
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

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push("/admin/settings")}
                            className="flex size-10 items-center justify-center rounded-lg transition duration-100 hover:bg-primary_hover"
                            aria-label="Settings"
                        >
                            <Settings01 className="size-5 text-fg-secondary" />
                        </button>
                        <button
                            onClick={() => router.push("/")}
                            className="rounded-lg border border-secondary px-3 py-1.5 text-sm font-medium text-secondary shadow-xs transition duration-100 hover:bg-primary_hover"
                        >
                            Back to App
                        </button>
                        <button
                            onClick={async () => {
                                const supabase = createBrowserSupabaseClient();
                                await supabase.auth.signOut();
                                router.push("/sign-in");
                            }}
                            className="flex size-10 items-center justify-center rounded-lg text-fg-tertiary transition duration-100 hover:bg-primary_hover hover:text-fg-error-primary"
                            aria-label="Sign out"
                        >
                            <LogOut01 className="size-5" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <div className="mx-[5%] py-6 md:py-8">{children}</div>
                </main>
            </div>

            <Toaster />
        </div>
    );
}
