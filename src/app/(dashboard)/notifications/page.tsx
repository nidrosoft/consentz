"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell01, CheckCircle, AlertTriangle, AlertCircle, InfoCircle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { useNotifications } from "@/hooks/use-notifications";
import { PageSkeleton } from "@/components/shared/page-skeleton";

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

export default function NotificationsPage() {
    const router = useRouter();
    const { data: notifications, isLoading, error, refetch } = useNotifications();
    const list = notifications ?? [];
    const [tab, setTab] = useState<"all" | "unread">("all");
    const filtered = tab === "unread" ? list.filter((n: { isRead: boolean }) => !n.isRead) : list;

    const unreadCount = list.filter((n: { isRead: boolean }) => !n.isRead).length;

    if (isLoading) return <PageSkeleton variant="list" />;

    if (error) {
        return (
            <div className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-6">
                <p className="text-sm text-error-primary">Failed to load notifications.</p>
                <Button color="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Notifications</h1>
                    <p className="mt-1 text-sm text-tertiary">{unreadCount} unread</p>
                </div>
                <Button color="secondary" size="sm">Mark all as read</Button>
            </div>

            <div className="flex gap-1 rounded-lg border border-secondary bg-secondary p-0.5">
                <button onClick={() => setTab("all")} className={cx("rounded-md px-4 py-1.5 text-sm font-medium transition duration-100", tab === "all" ? "bg-primary shadow-xs text-primary" : "text-tertiary hover:text-secondary")}>All</button>
                <button onClick={() => setTab("unread")} className={cx("rounded-md px-4 py-1.5 text-sm font-medium transition duration-100", tab === "unread" ? "bg-primary shadow-xs text-primary" : "text-tertiary hover:text-secondary")}>
                    Unread
                    {unreadCount > 0 && (
                        <Badge size="sm" color="error" type="pill-color" className="ml-1.5">{unreadCount}</Badge>
                    )}
                </button>
            </div>

            <div className="rounded-xl border border-secondary bg-primary">
                {filtered.map((notif: { id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string; actionUrl: string | null }, i: number) => {
                    const Icon = TYPE_ICON[notif.type];
                    return (
                        <button
                            key={notif.id}
                            onClick={() => notif.actionUrl && router.push(notif.actionUrl)}
                            className={cx(
                                "flex w-full items-start gap-4 px-5 py-4 text-left transition duration-100 hover:bg-primary_hover",
                                i < filtered.length - 1 && "border-b border-secondary",
                                !notif.isRead && "bg-brand-primary/30",
                            )}
                        >
                            <Icon className={cx("mt-0.5 size-5 shrink-0", TYPE_COLOR[notif.type])} />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className={cx("text-sm text-primary", !notif.isRead && "font-semibold")}>{notif.title}</p>
                                    {!notif.isRead && <span className="size-2 rounded-full bg-brand-solid" />}
                                </div>
                                <p className="mt-0.5 text-xs text-tertiary">{notif.message}</p>
                            </div>
                            <span className="shrink-0 text-xs text-tertiary">{timeAgo(notif.createdAt)}</span>
                        </button>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="p-8 text-center text-sm text-tertiary">No notifications</div>
                )}
            </div>
        </div>
    );
}
