"use client";

import type { HTMLAttributes } from "react";
import { cx } from "@/utils/cx";
import { UntitledLogoMinimal } from "./untitledui-logo-minimal";

export const UntitledLogo = (props: HTMLAttributes<HTMLOrSVGElement>) => {
    return (
        <div {...props} className={cx("flex h-8 w-max items-center justify-start overflow-visible", props.className)}>
            <UntitledLogoMinimal className="aspect-square h-full w-auto shrink-0" />
            <div className="aspect-[0.3] h-full" />
            <span className="text-xl font-bold tracking-tight text-fg-primary">Consentz</span>
        </div>
    );
};
