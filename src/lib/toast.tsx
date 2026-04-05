import { toast as sonnerToast } from "sonner";
import { IconNotification } from "@/components/application/notifications/notifications";
import type { FC } from "react";

type ToastColor = "success" | "error" | "warning" | "brand" | "gray";

interface ToastOptions {
    title: string;
    description?: string;
    icon?: FC<{ className?: string }>;
    color?: ToastColor;
    duration?: number;
    action?: { label: string; onClick: () => void };
}

export function showToast({ title, description = "", icon, color = "success", duration = 4000, action }: ToastOptions) {
    sonnerToast.custom(
        (id) => (
            <IconNotification
                title={title}
                description={description}
                icon={icon}
                color={color}
                hideDismissLabel={!action}
                confirmLabel={action?.label}
                onConfirm={() => {
                    action?.onClick();
                    sonnerToast.dismiss(id);
                }}
                onClose={() => sonnerToast.dismiss(id)}
            />
        ),
        { duration },
    );
}

export const toast = {
    success: (title: string, description?: string) =>
        showToast({ title, description: description ?? "", color: "success" }),

    error: (title: string, description?: string) =>
        showToast({ title, description: description ?? "", color: "error", duration: 6000 }),

    warning: (title: string, description?: string) =>
        showToast({ title, description: description ?? "", color: "warning", duration: 5000 }),

    info: (title: string, description?: string) =>
        showToast({ title, description: description ?? "", color: "brand" }),

    custom: (options: ToastOptions) => showToast(options),
};
