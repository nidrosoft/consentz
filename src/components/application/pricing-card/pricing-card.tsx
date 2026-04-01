import React from "react";
import { cx } from "@/utils/cx";

function Card({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cx(
                "relative w-full rounded-xl p-1.5",
                "border border-secondary bg-primary shadow-lg",
                "backdrop-blur-xl",
                className,
            )}
            {...props}
        />
    );
}

function Header({
    className,
    children,
    glassEffect = true,
    ...props
}: React.ComponentProps<"div"> & { glassEffect?: boolean }) {
    return (
        <div
            className={cx(
                "relative mb-4 rounded-xl border border-secondary bg-secondary p-4",
                className,
            )}
            {...props}
        >
            {glassEffect && (
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-48 rounded-[inherit]"
                    style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0) 100%)",
                    }}
                />
            )}
            {children}
        </div>
    );
}

function Plan({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cx("mb-8 flex items-center justify-between", className)} {...props} />;
}

function PlanName({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cx(
                "flex items-center gap-2 text-sm font-medium text-secondary [&_svg:not([class*='size-'])]:size-4",
                className,
            )}
            {...props}
        />
    );
}

function PlanBadge({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            className={cx(
                "rounded-full border border-brand-300 bg-brand-primary px-2 py-0.5 text-xs font-medium text-brand-secondary",
                className,
            )}
            {...props}
        />
    );
}

function Price({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cx("mb-3 flex items-end gap-1", className)} {...props} />;
}

function MainPrice({ className, ...props }: React.ComponentProps<"span">) {
    return <span className={cx("text-3xl font-extrabold tracking-tight text-primary", className)} {...props} />;
}

function Period({ className, ...props }: React.ComponentProps<"span">) {
    return <span className={cx("pb-1 text-sm text-tertiary", className)} {...props} />;
}

function OriginalPrice({ className, ...props }: React.ComponentProps<"span">) {
    return <span className={cx("ml-auto mr-1 text-lg text-quaternary line-through", className)} {...props} />;
}

function Description({ className, ...props }: React.ComponentProps<"p">) {
    return <p className={cx("text-xs text-tertiary", className)} {...props} />;
}

function Body({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cx("space-y-6 p-3", className)} {...props} />;
}

function List({ className, ...props }: React.ComponentProps<"ul">) {
    return <ul className={cx("space-y-3", className)} {...props} />;
}

function ListItem({ className, ...props }: React.ComponentProps<"li">) {
    return (
        <li className={cx("flex items-start gap-3 text-sm text-secondary", className)} {...props} />
    );
}

function Separator({
    children = "Upgrade to access",
    className,
    ...props
}: React.ComponentProps<"div"> & { children?: string }) {
    return (
        <div className={cx("flex items-center gap-3 text-sm text-tertiary", className)} {...props}>
            <span className="h-px flex-1 bg-tertiary" />
            <span className="shrink-0">{children}</span>
            <span className="h-px flex-1 bg-tertiary" />
        </div>
    );
}

export const PricingCard = {
    Card,
    Header,
    Plan,
    PlanName,
    PlanBadge,
    Price,
    MainPrice,
    Period,
    OriginalPrice,
    Description,
    Body,
    List,
    ListItem,
    Separator,
};
