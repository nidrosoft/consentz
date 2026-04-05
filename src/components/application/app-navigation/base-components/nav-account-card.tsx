"use client";

import type { FC, HTMLAttributes } from "react";
import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Placement } from "@react-types/overlays";
import { Bell01, BookOpen01, ChevronSelectorVertical, LogOut01, Settings01, User01, Users01 } from "@untitledui/icons";
import { useFocusManager } from "react-aria";
import type { DialogProps as AriaDialogProps } from "react-aria-components";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { Button } from "@/components/base/buttons/button";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useSignOutConfirm } from "@/providers/sign-out-confirm-provider";
import { cx } from "@/utils/cx";

type NavAccountType = {
    /** Unique identifier for the nav item. */
    id: string;
    /** Name of the account holder. */
    name: string;
    /** Email address of the account holder. */
    email: string;
    /** Avatar image URL. */
    avatar: string;
    /** Online status of the account holder. This is used to display the online status indicator. */
    status: "online" | "offline";
};

const placeholderAccounts: NavAccountType[] = [
    {
        id: "jane",
        name: "Jane Smith",
        email: "jane@consentz.com",
        avatar: "",
        status: "online",
    },
];

export const NavAccountMenu = ({
    className,
    selectedAccountId = "jane",
    accounts,
    ...dialogProps
}: AriaDialogProps & { className?: string; accounts?: NavAccountType[]; selectedAccountId?: string }) => {
    const displayAccounts = accounts ?? placeholderAccounts;
    const { requestSignOutConfirm } = useSignOutConfirm();
    const router = useRouter();
    const focusManager = useFocusManager();
    const dialogRef = useRef<HTMLDivElement>(null);

    const onKeyDown = useCallback(
        (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    focusManager?.focusNext({ tabbable: true, wrap: true });
                    break;
                case "ArrowUp":
                    focusManager?.focusPrevious({ tabbable: true, wrap: true });
                    break;
            }
        },
        [focusManager],
    );

    useEffect(() => {
        const element = dialogRef.current;
        if (element) {
            element.addEventListener("keydown", onKeyDown);
        }

        return () => {
            if (element) {
                element.removeEventListener("keydown", onKeyDown);
            }
        };
    }, [onKeyDown]);

    const selectedAccount = displayAccounts.find((a) => a.id === selectedAccountId) ?? displayAccounts[0];

    return (
        <AriaDialog
            {...dialogProps}
            ref={dialogRef}
            className={cx("w-66 rounded-xl bg-secondary_alt shadow-lg ring ring-secondary_alt outline-hidden", className)}
        >
            <div className="rounded-xl bg-primary ring-1 ring-secondary">
                {selectedAccount && (
                    <div className="border-b border-secondary px-3 py-3">
                        <AvatarLabelGroup status="online" size="md" src={selectedAccount.avatar} title={selectedAccount.name} subtitle={selectedAccount.email} />
                    </div>
                )}
                <div className="flex flex-col gap-0.5 py-1.5">
                    <NavAccountCardMenuItem label="View profile" icon={User01} onClick={() => router.push("/settings")} />
                    <NavAccountCardMenuItem label="Account settings" icon={Settings01} onClick={() => router.push("/settings")} />
                    <NavAccountCardMenuItem label="Notifications" icon={Bell01} onClick={() => router.push("/settings?tab=notifications")} />
                    <NavAccountCardMenuItem label="Documentation" icon={BookOpen01} />
                </div>
                <div className="border-t border-secondary px-2 py-2">
                    <Button iconLeading={Users01} color="secondary" size="sm" className="w-full" onClick={() => router.push("/settings?tab=users")}>
                        Invite a Team Member
                    </Button>
                </div>
            </div>

            <div className="pt-1 pb-1.5">
                <NavAccountCardMenuItem
                    label="Sign out"
                    icon={LogOut01}
                    shortcut="⌥⇧Q"
                    data-testid="nav-account-sign-out"
                    onClick={() => requestSignOutConfirm()}
                />
            </div>
        </AriaDialog>
    );
};

const NavAccountCardMenuItem = ({
    icon: Icon,
    label,
    shortcut,
    ...buttonProps
}: {
    icon?: FC<{ className?: string }>;
    label: string;
    shortcut?: string;
} & HTMLAttributes<HTMLButtonElement>) => {
    return (
        <button {...buttonProps} className={cx("group/item w-full cursor-pointer px-1.5 focus:outline-hidden", buttonProps.className)}>
            <div
                className={cx(
                    "flex w-full items-center justify-between gap-3 rounded-md p-2 group-hover/item:bg-primary_hover",
                    // Focus styles.
                    "outline-focus-ring group-focus-visible/item:outline-2 group-focus-visible/item:outline-offset-2",
                )}
            >
                <div className="flex gap-2 text-sm font-semibold text-secondary group-hover/item:text-secondary_hover">
                    {Icon && <Icon className="size-5 text-fg-quaternary" />} {label}
                </div>

                {shortcut && (
                    <kbd className="flex rounded px-1 py-px font-body text-xs font-medium text-tertiary ring-1 ring-secondary ring-inset">{shortcut}</kbd>
                )}
            </div>
        </button>
    );
};

export const NavAccountCard = ({
    popoverPlacement,
    selectedAccountId = "jane",
    items = placeholderAccounts,
}: {
    popoverPlacement?: Placement;
    selectedAccountId?: string;
    items?: NavAccountType[];
}) => {
    const triggerRef = useRef<HTMLDivElement>(null);
    const isDesktop = useBreakpoint("lg");

    const displayItems = items ?? placeholderAccounts;
    const selectedAccount = displayItems.find((account) => account.id === selectedAccountId);

    if (!selectedAccount) {
        console.warn(`Account with ID ${selectedAccountId} not found in <NavAccountCard />`);
        return null;
    }

    return (
        <div ref={triggerRef} className="relative flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary ring-inset">
            <AvatarLabelGroup
                size="md"
                src={selectedAccount.avatar}
                title={selectedAccount.name}
                subtitle={selectedAccount.email}
                status={selectedAccount.status}
            />

            <div className="absolute top-1.5 right-1.5">
                <AriaDialogTrigger>
                    <AriaButton
                        data-testid="nav-account-menu-trigger"
                        className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 pressed:bg-primary_hover pressed:text-fg-quaternary_hover"
                    >
                        <ChevronSelectorVertical className="size-4 shrink-0" />
                    </AriaButton>
                    <AriaPopover
                        placement={popoverPlacement ?? (isDesktop ? "right bottom" : "top right")}
                        triggerRef={triggerRef}
                        offset={8}
                        className={({ isEntering, isExiting }) =>
                            cx(
                                "origin-(--trigger-anchor-point) will-change-transform",
                                isEntering &&
                                    "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                                isExiting &&
                                    "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                            )
                        }
                    >
                        <NavAccountMenu selectedAccountId={selectedAccountId} accounts={items} />
                    </AriaPopover>
                </AriaDialogTrigger>
            </div>
        </div>
    );
};
