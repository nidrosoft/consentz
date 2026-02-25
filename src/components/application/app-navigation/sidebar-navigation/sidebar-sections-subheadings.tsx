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
}

const EXPANDED_WIDTH = 292;
const COLLAPSED_WIDTH = 68;

export const SidebarNavigationSectionsSubheadings = ({ activeUrl = "/", items }: SidebarNavigationSectionsSubheadingsProps) => {
    const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
    const toggleSidebar = useUiStore((s) => s.toggleSidebar);
    const sidebarWidth = sidebarCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

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
                                <li key={item.label} className="py-0.5">
                                    <NavItemBase icon={item.icon} href={item.href} badge={item.badge} type="link" current={item.href === activeUrl}>
                                        {item.label}
                                    </NavItemBase>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>

            <div className="mt-auto flex flex-col gap-5 px-2 py-4">
                <NavAccountCard />
            </div>
        </aside>
    );

    /* ------------------------------------------------------------------ */
    /*  Desktop content — handles collapsed / expanded state              */
    /* ------------------------------------------------------------------ */
    const desktopContent = (
        <aside
            style={{ "--width": `${sidebarWidth}px` } as React.CSSProperties}
            className="flex h-full flex-col justify-between overflow-x-hidden overflow-y-auto rounded-xl border border-secondary bg-primary pt-5 shadow-xs transition-[width] duration-200 ease-in-out lg:w-(--width)"
        >
            {/* Logo */}
            <div className={cx("flex flex-col gap-5 transition-all duration-200", sidebarCollapsed ? "items-center px-3" : "px-5")}>
                {sidebarCollapsed ? <UntitledLogoMinimal className="size-8" /> : <UntitledLogo className="h-8" />}
            </div>

            {/* Navigation items */}
            <ul className="mt-8 flex-1 overflow-x-hidden">
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

                        <ul className={cx(sidebarCollapsed ? "px-3 pb-2" : "px-4 pb-5")}>
                            {group.items.map((item) => (
                                <li key={item.label} className="py-0.5">
                                    {sidebarCollapsed && item.icon ? (
                                        <NavItemButton
                                            icon={item.icon}
                                            href={item.href}
                                            label={item.label}
                                            current={item.href === activeUrl}
                                        />
                                    ) : (
                                        <NavItemBase icon={item.icon} href={item.href} badge={item.badge} type="link" current={item.href === activeUrl}>
                                            {item.label}
                                        </NavItemBase>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>

            {/* Footer: toggle button + account */}
            <div className={cx("mt-auto flex flex-col gap-3 py-4", sidebarCollapsed ? "items-center px-3" : "px-4")}>
                {/* Collapse / expand toggle */}
                <button
                    onClick={toggleSidebar}
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="flex size-10 items-center justify-center rounded-md text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    <ChevronLeft className={cx("size-5 transition-transform duration-200", sidebarCollapsed && "rotate-180")} />
                </button>

                {/* Account card */}
                {sidebarCollapsed ? (
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
                                    initials="JS"
                                    size="md"
                                    alt="Jane Smith"
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
                                <NavAccountMenu />
                            </AriaPopover>
                        </AriaDialogTrigger>
                    </div>
                ) : (
                    <NavAccountCard />
                )}
            </div>
        </aside>
    );

    return (
        <>
            {/* Mobile header navigation */}
            <MobileNavigationHeader>{mobileContent}</MobileNavigationHeader>

            {/* Desktop sidebar navigation */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:py-1 lg:pl-1">{desktopContent}</div>

            {/* Placeholder to take up physical space because the real sidebar has `fixed` position. */}
            <div
                style={{ paddingLeft: sidebarWidth + 4 }}
                className="invisible hidden transition-[padding] duration-200 ease-in-out lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block"
            />
        </>
    );
};
