"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Settings01, User01, Bell01, LogOut01, Users01, Shield01 } from "@untitledui/icons";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSignOutConfirm } from "@/providers/sign-out-confirm-provider";
import { cx } from "@/utils/cx";

export function DashboardUserMenu() {
    const { requestSignOutConfirm } = useSignOutConfirm();
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const supabase = createBrowserSupabaseClient();
        void supabase.auth.getUser().then(({ data: { user } }) => {
            setEmail(user?.email ?? null);
        });
        void fetch("/api/admin/check").then((r) => r.json()).then((d) => setIsAdmin(d.isAdmin === true)).catch(() => {});
    }, []);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    const initial = email?.charAt(0).toUpperCase() ?? "?";

    const navigate = (path: string) => {
        setOpen(false);
        router.push(path);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                data-testid="dashboard-user-menu-trigger"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg py-1.5 pl-1 pr-2 transition duration-100 hover:bg-primary_hover"
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-secondary text-sm font-semibold text-brand-primary">
                    {initial}
                </span>
                <ChevronDown className={cx("size-4 text-fg-tertiary transition", open && "rotate-180")} />
            </button>
            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1 min-w-[240px] rounded-xl border border-secondary_alt bg-primary shadow-lg"
                >
                    {email && (
                        <div className="border-b border-secondary px-3 py-2.5">
                            <p className="truncate text-xs text-tertiary">Signed in as</p>
                            <p className="truncate text-sm font-medium text-primary">{email}</p>
                        </div>
                    )}
                    <div className="py-1">
                        <HeaderMenuItem icon={User01} label="View profile" onClick={() => navigate("/settings")} />
                        <HeaderMenuItem icon={Settings01} label="Account settings" onClick={() => navigate("/settings")} />
                        <HeaderMenuItem icon={Bell01} label="Notifications" onClick={() => navigate("/settings?tab=notifications")} />
                        <HeaderMenuItem icon={Users01} label="Invite a Team Member" onClick={() => navigate("/settings?tab=users")} />
                    </div>
                    {isAdmin && (
                        <div className="border-t border-secondary py-1">
                            <HeaderMenuItem icon={Shield01} label="Admin Panel" onClick={() => navigate("/admin")} />
                        </div>
                    )}
                    <div className="border-t border-secondary py-1">
                        <HeaderMenuItem
                            icon={LogOut01}
                            label="Sign out"
                            onClick={() => {
                                setOpen(false);
                                requestSignOutConfirm();
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function HeaderMenuItem({ icon: Icon, label, onClick }: { icon: React.FC<{ className?: string }>; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-secondary transition duration-100 hover:bg-primary_hover"
        >
            <Icon className="size-4 text-fg-quaternary" />
            {label}
        </button>
    );
}
