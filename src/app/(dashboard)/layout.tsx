"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
    Home01, BarChartSquare02, File06, FileCheck02, Users01,
    AlertTriangle, CheckSquare,
    Settings01, Bell01, CheckCircle, AlertCircle, InfoCircle,
    ShieldTick, Target02, Heart, Zap, Trophy01,
} from "@untitledui/icons";
import { SidebarNavigationSectionsSubheadings } from "@/components/application/app-navigation/sidebar-navigation/sidebar-sections-subheadings";
import { CommandPalette } from "@/components/application/command-palette/command-palette";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Button } from "@/components/base/buttons/button";
import { Toaster } from "@/components/application/notifications/toaster";
import { toast } from "@/lib/toast";
import { ComplianceChat } from "./compliance-chat";
import { SidebarOnboarding } from "./sidebar-onboarding";
import { DashboardUserMenu } from "./dashboard-user-menu";
import { Badge } from "@/components/base/badges/badges";
import { WalkthroughProvider } from "@/components/walkthrough/walkthrough-provider";
import { WalkthroughOverlay } from "@/components/walkthrough/walkthrough-overlay";
import { WalkthroughTrigger } from "@/components/walkthrough/walkthrough-trigger";
import { useOrganization } from "@/hooks/use-organization";
import { useNotifications, useMarkRead } from "@/hooks/use-notifications";
import { useMe } from "@/hooks/use-me";
import { useDashboard } from "@/hooks/use-dashboard";
import { cx } from "@/utils/cx";
import { useUiStore } from "@/stores/ui-store";
import type { NavItemType } from "@/components/application/app-navigation/config";

const navItems: Array<{ label: string; items: NavItemType[] }> = [
    {
        label: "Main",
        items: [
            { label: "Dashboard", href: "/", icon: Home01, dataTour: "sidebar-dashboard" },
            { label: "Evidence", href: "/evidence", icon: File06, dataTour: "sidebar-evidence" },
            { label: "Policies", href: "/policies", icon: FileCheck02, dataTour: "sidebar-policies" },
            { label: "Staff", href: "/staff", icon: Users01, dataTour: "sidebar-staff" },
            { label: "Incidents", href: "/incidents", icon: AlertTriangle, dataTour: "sidebar-incidents" },
            {
                label: "Tasks",
                href: "/tasks",
                icon: CheckSquare,
                dataTour: "sidebar-tasks",
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
            { label: "All Domains", href: "/domains", icon: BarChartSquare02, dataTour: "sidebar-domains" },
            { label: "Safe", href: "/domains/safe", icon: ShieldTick },
            { label: "Effective", href: "/domains/effective", icon: Target02 },
            { label: "Caring", href: "/domains/caring", icon: Heart },
            { label: "Responsive", href: "/domains/responsive", icon: Zap },
            { label: "Well-Led", href: "/domains/well-led", icon: Trophy01 },
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

const TYPE_ICON: Record<string, typeof Bell01> = {
    INFO: InfoCircle, WARNING: AlertTriangle, ERROR: AlertCircle, SUCCESS: CheckCircle,
};
const TYPE_COLOR: Record<string, string> = {
    INFO: "text-brand-600", WARNING: "text-warning-primary", ERROR: "text-error-primary", SUCCESS: "text-success-primary",
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const breadcrumbOverrides = useUiStore((s) => s.breadcrumbOverrides);
    const breadcrumbs = getBreadcrumbs(pathname).map((crumb) => {
        const segment = crumb.href.split("/").pop() ?? "";
        if (breadcrumbOverrides[segment]) {
            return { ...crumb, label: breadcrumbOverrides[segment] };
        }
        return crumb;
    });
    const notifOpen = useUiStore((s) => s.notificationsOpen);
    const setNotifOpen = useUiStore((s) => s.setNotificationsOpen);

    const { data: org } = useOrganization();
    const { data: me } = useMe();
    const { data: dashboardOverview } = useDashboard();

    useEffect(() => {
        if (!me) return;
        const key = "consentz-welcomed";
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
        toast.info("Welcome back", `Good to see you, ${me.fullName?.split(" ")[0] ?? "there"}!`);
    }, [me]);

    const { data: notifications } = useNotifications();
    const markRead = useMarkRead();
    const list = notifications ?? [];
    const unreadCount = list.filter((n) => !n.isRead).length;

    const handleMarkAllRead = () => {
        const unreadIds = list.filter((n) => !n.isRead).map((n) => n.id);
        if (unreadIds.length > 0) markRead.mutate(unreadIds);
    };

    return (
        <WalkthroughProvider>
        <div className="flex min-h-screen flex-col bg-primary lg:flex-row">
            <SidebarNavigationSectionsSubheadings
                activeUrl={pathname}
                items={navItems}
                user={me ? { name: me.fullName, email: me.email } : undefined}
                footerContent={<SidebarOnboarding />}
                mobileHeaderActions={
                    <>
                        <button
                            onClick={() => router.push("/settings")}
                            className="flex size-9 items-center justify-center rounded-lg transition duration-100 hover:bg-primary_hover"
                            aria-label="Settings"
                        >
                            <Settings01 className="size-4 text-fg-secondary" />
                        </button>
                        <button
                            onClick={() => setNotifOpen(true)}
                            className="relative flex size-9 items-center justify-center rounded-lg transition duration-100 hover:bg-primary_hover"
                            aria-label="Notifications"
                        >
                            <Bell01 className="size-4 text-fg-secondary" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-error-solid text-[9px] font-bold text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <DashboardUserMenu />
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
                            onClick={() => router.push("/settings")}
                            className="flex size-10 items-center justify-center rounded-lg transition duration-100 hover:bg-primary_hover"
                            aria-label="Settings"
                        >
                            <Settings01 className="size-5 text-fg-secondary" />
                        </button>
                        <button
                            onClick={() => setNotifOpen(true)}
                            className="relative flex size-10 items-center justify-center rounded-lg transition duration-100 hover:bg-primary_hover"
                            aria-label="Notifications"
                        >
                            <Bell01 className="size-5 text-fg-secondary" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-error-solid text-[10px] font-bold text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <DashboardUserMenu />
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="px-4 py-5 sm:px-6 md:py-8 lg:px-[5%]">{children}</div>
                </main>
            </div>

            <CommandPalette />
            <ComplianceChat />
            <Toaster />

            {/* Notifications slideout */}
            <SlideoutMenu isOpen={notifOpen} onOpenChange={setNotifOpen} isDismissable>
                <SlideoutMenu.Header onClose={() => setNotifOpen(false)} className="relative flex w-full flex-col gap-0.5 px-4 pt-6 md:px-6">
                    <div className="flex items-center justify-between pr-8">
                        <div>
                            <h1 className="text-md font-semibold text-primary md:text-lg">Notifications</h1>
                            <p className="text-sm text-tertiary">{unreadCount} unread</p>
                        </div>
                        {unreadCount > 0 && (
                            <Button color="link-gray" size="sm" onClick={handleMarkAllRead} isLoading={markRead.isPending}>
                                Mark all as read
                            </Button>
                        )}
                    </div>
                </SlideoutMenu.Header>
                <SlideoutMenu.Content>
                    {list.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
                                <Bell01 className="size-6 text-fg-quaternary" />
                            </div>
                            <p className="mt-4 text-sm font-medium text-primary">All caught up!</p>
                            <p className="mt-1 text-xs text-tertiary">You have no notifications. We&apos;ll let you know when something needs your attention.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {list.map((notif, i) => {
                                const Icon = TYPE_ICON[notif.type] ?? Bell01;
                                return (
                                    <button
                                        key={notif.id}
                                        onClick={() => {
                                            if (!notif.isRead) markRead.mutate([notif.id]);
                                            if (notif.actionUrl) {
                                                setNotifOpen(false);
                                                router.push(notif.actionUrl);
                                            }
                                        }}
                                        className={cx(
                                            "flex w-full items-start gap-3 px-1 py-3 text-left transition duration-100 hover:bg-primary_hover rounded-lg",
                                            i < list.length - 1 && "border-b border-secondary",
                                            !notif.isRead && "bg-brand-primary/30",
                                        )}
                                    >
                                        <Icon className={cx("mt-0.5 size-5 shrink-0", TYPE_COLOR[notif.type] ?? "text-fg-quaternary")} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className={cx("text-sm text-primary truncate", !notif.isRead && "font-semibold")}>{notif.title}</p>
                                                {!notif.isRead && <span className="size-2 shrink-0 rounded-full bg-brand-solid" />}
                                            </div>
                                            <p className="mt-0.5 text-xs text-tertiary line-clamp-2">{notif.message}</p>
                                        </div>
                                        <span className="shrink-0 text-xs text-tertiary">{timeAgo(notif.createdAt)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </SlideoutMenu.Content>
                <SlideoutMenu.Footer className="flex w-full items-center justify-between">
                    <Button color="link-gray" size="sm" onClick={() => { setNotifOpen(false); router.push("/settings?tab=notifications"); }}>
                        Notification settings
                    </Button>
                    <Button color="secondary" size="sm" onClick={() => setNotifOpen(false)}>
                        Close
                    </Button>
                </SlideoutMenu.Footer>
            </SlideoutMenu>

            <WalkthroughTrigger />
            <WalkthroughOverlay
                organizationName={org?.name}
                serviceType={org?.serviceType === "CARE_HOME" ? "Care Home" : "Aesthetic Clinic"}
                gapCount={dashboardOverview?.gaps?.total ?? 0}
            />
        </div>
        </WalkthroughProvider>
    );
}
