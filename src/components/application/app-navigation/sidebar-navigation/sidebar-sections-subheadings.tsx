"use client";

import {
    Button as AriaButton,
    DialogTrigger as AriaDialogTrigger,
    Popover as AriaPopover,
} from "react-aria-components";
import { ChevronLeft } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal";
import { useUiStore } from "@/stores/ui-store";
import { cx } from "@/utils/cx";
import { MobileNavigationHeader } from "../base-components/mobile-header";
import { NavAccountCard, NavAccountMenu } from "../base-components/nav-account-card";
import { NavItemBase } from "../base-components/nav-item";
import { NavItemButton } from "../base-components/nav-item-button";
import type { NavItemType } from "../config";

interface SidebarNavigationSectionsSubheadingsProps {
    /** URL of the currently active item. */
    activeUrl?: string;
    /** List of items to display. */
    items: Array<{ label: string; items: NavItemType[] }>;
    /** Current user info for the account card. */
    user?: { name: string; email: string; avatar?: string };
    /** Optional content rendered above the footer (collapse toggle + account). */
    footerContent?: React.ReactNode;
}

const EXPANDED_WIDTH = 292;
const COLLAPSED_WIDTH = 68;

const EXACT_MATCH_ROUTES = new Set(["/", "/domains"]);

function isActive(href: string | undefined, activeUrl: string): boolean {
    if (!href) return false;
    if (EXACT_MATCH_ROUTES.has(href)) return activeUrl === href;
    return activeUrl === href || activeUrl.startsWith(href + "/");
}

export const SidebarNavigationSectionsSubheadings = ({ activeUrl = "/", items, user, footerContent }: SidebarNavigationSectionsSubheadingsProps) => {
    const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
    const toggleSidebar = useUiStore((s) => s.toggleSidebar);
    const sidebarWidth = sidebarCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

    const accountItems = user
        ? [{ id: "current", name: user.name, email: user.email, avatar: user.avatar ?? "", status: "online" as const }]
        : undefined;
    const accountInitials = user ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "JS";
    const accountAlt = user?.name ?? "Jane Smith";

    /* ------------------------------------------------------------------ */
    /*  Mobile content — always expanded (rendered inside drawer)         */
    /* ------------------------------------------------------------------ */
    const mobileContent = (
        <aside className="flex h-full w-full max-w-full flex-col justify-between overflow-auto border-secondary bg-primary pt-4 shadow-xs md:border-r">
            <div className="flex flex-col gap-5 px-4">
                <UntitledLogo className="h-8" />
            </div>

            <ul className="mt-8">
                {items.map((group) => (
                    <li key={group.label}>
                        <div className="px-5 pb-1">
                            <p className="text-xs font-bold text-quaternary uppercase">{group.label}</p>
                        </div>
                        <ul className="px-4 pb-5">
                            {group.items.map((item) => (
                                <li key={item.label} className="py-0.5" {...(item.dataTour ? { "data-tour": item.dataTour } : {})}>
                                    <NavItemBase icon={item.icon} href={item.href} badge={item.badge} type="link" current={isActive(item.href, activeUrl)}>
                                        {item.label}
                                    </NavItemBase>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>

            {footerContent && <div className="px-4 pb-2">{footerContent}</div>}
            <div className="mt-auto flex flex-col gap-5 px-2 py-4">
                <NavAccountCard items={accountItems} selectedAccountId={accountItems ? "current" : undefined} />
            </div>
        </aside>
    );

    /* ------------------------------------------------------------------ */
    /*  Desktop content — handles collapsed / expanded state              */
    /* ------------------------------------------------------------------ */
    const desktopContent = (
        <aside
            style={{ "--width": `${sidebarWidth}px` } as React.CSSProperties}
            className="flex h-full flex-col justify-between overflow-x-hidden overflow-y-auto rounded-xl border border-secondary bg-[#F3EEE5] pt-5 shadow-xs transition-[width] duration-200 ease-in-out dark:border-[color:var(--color-gray-800)] dark:bg-[color:var(--color-gray-900)] lg:w-(--width)"
        >
            {/* Logo + collapse toggle */}
            <div className={cx("flex items-center transition-all duration-200", sidebarCollapsed ? "justify-center px-3" : "justify-between px-5")}>
                {sidebarCollapsed ? <UntitledLogoMinimal className="size-8" /> : <UntitledLogo className="h-8" />}
                {!sidebarCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        aria-label="Collapse sidebar"
                        className="flex size-8 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-[#E8E0D4] hover:text-fg-quaternary_hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 outline-focus-ring"
                    >
                        <ChevronLeft className="size-4.5" />
                    </button>
                )}
            </div>

            {/* Navigation items */}
            <ul className="mt-6 flex-1 overflow-x-hidden overflow-y-auto">
                {items.map((group, groupIndex) => (
                    <li key={group.label}>
                        {/* Section header or divider */}
                        {sidebarCollapsed ? (
                            groupIndex > 0 && (
                                <div className="mx-3 my-1">
                                    <hr className="h-px w-full border-none bg-border-secondary" />
                                </div>
                            )
                        ) : (
                            <div className="px-5 pb-1">
                                <p className="text-xs font-bold text-quaternary uppercase">{group.label}</p>
                            </div>
                        )}

                        <ul className={cx(sidebarCollapsed ? "px-3 pb-2" : "px-4 pb-3")}>
                            {group.items.map((item) => (
                                <li key={item.label} {...(item.dataTour ? { "data-tour": item.dataTour } : {})}>
                                    {sidebarCollapsed && item.icon ? (
                                        <NavItemButton
                                            icon={item.icon}
                                            href={item.href}
                                            label={item.label}
                                            current={isActive(item.href, activeUrl)}
                                        />
                                    ) : (
                                        <NavItemBase icon={item.icon} href={item.href} badge={item.badge} type="link" current={isActive(item.href, activeUrl)}>
                                            {item.label}
                                        </NavItemBase>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>

            {/* Footer content (e.g. onboarding widget) */}
            {!sidebarCollapsed && footerContent && (
                <div className="px-4 pb-2">{footerContent}</div>
            )}

            {/* Footer: account card */}
            <div className={cx("flex flex-col gap-2 py-3", sidebarCollapsed ? "items-center px-3" : "px-4")}>
                {sidebarCollapsed ? (
                    <>
                    <button
                        onClick={toggleSidebar}
                        aria-label="Expand sidebar"
                        className="flex size-10 items-center justify-center rounded-md text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-[#E8E0D4] hover:text-fg-quaternary_hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <ChevronLeft className="size-5 rotate-180" />
                    </button>
                    <div className="flex justify-center">
                        <AriaDialogTrigger>
                            <AriaButton
                                className={({ isPressed, isFocusVisible }) =>
                                    cx(
                                        "cursor-pointer rounded-full outline-focus-ring",
                                        (isPressed || isFocusVisible) && "outline-2 outline-offset-2",
                                    )
                                }
                            >
                                <Avatar
                                    status="online"
                                    initials={accountInitials}
                                    size="md"
                                    alt={accountAlt}
                                />
                            </AriaButton>
                            <AriaPopover
                                placement="right bottom"
                                offset={8}
                                crossOffset={6}
                                className={({ isEntering, isExiting }) =>
                                    cx(
                                        "origin-(--trigger-anchor-point) will-change-transform",
                                        isEntering && "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5",
                                        isExiting && "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5",
                                    )
                                }
                            >
                                <NavAccountMenu accounts={accountItems} selectedAccountId={accountItems ? "current" : undefined} />
                            </AriaPopover>
                        </AriaDialogTrigger>
                    </div>
                    </>
                ) : (
                    <NavAccountCard items={accountItems} selectedAccountId={accountItems ? "current" : undefined} />
                )}
            </div>
        </aside>
    );

    return (
        <>
            {/* Mobile header navigation */}
            <MobileNavigationHeader>{mobileContent}</MobileNavigationHeader>

            {/* Desktop sidebar navigation */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:py-1 lg:pl-1" data-tour="sidebar-nav">{desktopContent}</div>

            {/* Placeholder to take up physical space because the real sidebar has `fixed` position. */}
            <div
                style={{ paddingLeft: sidebarWidth + 4 }}
                className="invisible hidden transition-[padding] duration-200 ease-in-out lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block"
            />
        </>
    );
};
