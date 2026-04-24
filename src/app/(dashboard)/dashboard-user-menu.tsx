"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Settings01, User01, Bell01, LogOut01, Users01 } from "@untitledui/icons";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSignOutConfirm } from "@/providers/sign-out-confirm-provider";
import { cx } from "@/utils/cx";

export function DashboardUserMenu() {
    const { requestSignOutConfirm } = useSignOutConfirm();
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const supabase = createBrowserSupabaseClient();
        void supabase.auth.getUser().then(({ data: { user } }) => {
            setEmail(user?.email ?? null);
        });
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
                className="flex items-center gap-1.5 rounded-lg py-1 pl-1 pr-1.5 transition duration-100 hover:bg-primary_hover sm:gap-2 sm:py-1.5 sm:pr-2"
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <span className="flex size-7 items-center justify-center rounded-md bg-brand-secondary text-xs font-semibold text-brand-primary sm:size-9 sm:rounded-lg sm:text-sm">
                    {initial}
                </span>
                <ChevronDown className={cx("hidden size-4 text-fg-tertiary transition sm:block", open && "rotate-180")} />
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
