"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "@untitledui/icons";
import { LogOut } from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSignOutConfirm } from "@/providers/sign-out-confirm-provider";
import { cx } from "@/utils/cx";

export function DashboardUserMenu() {
    const { requestSignOutConfirm } = useSignOutConfirm();
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
                    className="absolute right-0 top-full z-50 mt-1 min-w-[220px] rounded-xl border border-secondary_alt bg-primary py-1 shadow-lg"
                >
                    {email && (
                        <div className="border-b border-secondary px-3 py-2">
                            <p className="truncate text-xs text-tertiary">Signed in as</p>
                            <p className="truncate text-sm font-medium text-primary">{email}</p>
                        </div>
                    )}
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setOpen(false);
                            requestSignOutConfirm();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-secondary transition duration-100 hover:bg-primary_hover"
                    >
                        <LogOut className="size-4 text-fg-tertiary" />
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
}
