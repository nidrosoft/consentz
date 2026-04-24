import type { FC, HTMLAttributes, ReactNode } from "react";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

interface FeaturedCardCommonProps {
    title: string;
    description: ReactNode;
    confirmLabel: string;
    className?: string;
    onDismiss: () => void;
    onConfirm: () => void;
}

export const FeaturedCardUpgradeCTA = ({
    icon,
    title,
    badge,
    description,
    confirmLabel,
    onConfirm,
    onDismiss,
}: FeaturedCardCommonProps & { icon: FC<HTMLAttributes<HTMLOrSVGElement>>; badge?: string }) => {
    return (
        <div className="relative flex flex-col gap-4 rounded-xl bg-primary p-4 ring-1 ring-secondary ring-inset">
            <div className="absolute top-2 right-2">
                <CloseButton size="sm" onClick={onDismiss} />
            </div>

            <div className="flex flex-col gap-3">
                <FeaturedIcon color="gray" icon={icon} theme="modern" size="md" />
                <div className="flex flex-col gap-1">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                        {title}
                        {badge && (
                            <Badge size="sm" type="modern" color="gray">
                                {badge}
                            </Badge>
                        )}
                    </p>
                    <p className="text-sm text-tertiary">{description}</p>
                </div>
            </div>
            <Button size="sm" color="primary" onClick={onConfirm}>
                {confirmLabel}
            </Button>
        </div>
    );
};
