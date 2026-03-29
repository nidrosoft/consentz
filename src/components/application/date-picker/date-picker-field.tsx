"use client";

import { getLocalTimeZone, parseDate, today } from "@internationalized/date";
import { useControlledState } from "@react-stately/utils";
import { Calendar as CalendarIcon } from "@untitledui/icons";
import type { DateValue } from "react-aria-components";
import {
    Button as AriaButton,
    DatePicker as AriaDatePicker,
    Dialog as AriaDialog,
    Group as AriaGroup,
    Popover as AriaPopover,
} from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { Calendar } from "./calendar";
import { DateInput } from "./date-input";

const highlightedDates = [today(getLocalTimeZone())];

interface DatePickerFieldProps {
    label?: string;
    value?: string;
    onChange?: (value: string) => void;
    isRequired?: boolean;
    isDisabled?: boolean;
    size?: "sm" | "md";
    hint?: string;
    className?: string;
}

/**
 * Form-friendly date picker that renders a labeled input with a calendar popover.
 * Accepts and emits ISO date strings (YYYY-MM-DD) for easy form integration.
 */
export function DatePickerField({
    label,
    value,
    onChange,
    isRequired,
    isDisabled,
    size = "md",
    hint,
    className,
}: DatePickerFieldProps) {
    const dateValue = value ? safeParseDate(value) : undefined;

    const [internalValue, setInternalValue] = useControlledState<DateValue | null | undefined>(
        dateValue,
        undefined,
        (newVal) => {
            if (newVal) {
                const iso = `${newVal.year}-${String(newVal.month).padStart(2, "0")}-${String(newVal.day).padStart(2, "0")}`;
                onChange?.(iso);
            } else {
                onChange?.("");
            }
        },
    );

    return (
        <AriaDatePicker
            shouldCloseOnSelect
            value={internalValue ?? null}
            onChange={setInternalValue}
            isDisabled={isDisabled}
            isRequired={isRequired}
            className={cx("flex flex-col gap-1.5", className)}
        >
            {label && (
                <span className={cx("text-sm font-medium text-secondary", size === "md" && "text-sm")}>
                    {label}
                    {isRequired && <span className="ml-0.5 text-error-primary">*</span>}
                </span>
            )}
            <AriaGroup
                className={cx(
                    "flex items-center gap-2 rounded-lg bg-primary px-3 shadow-xs ring-1 ring-primary ring-inset transition duration-100",
                    "focus-within:ring-2 focus-within:ring-brand",
                    "hover:ring-secondary_hover",
                    isDisabled && "cursor-not-allowed opacity-50",
                    size === "sm" ? "py-1.5" : "py-2",
                )}
            >
                <AriaButton className="flex shrink-0 items-center justify-center rounded text-fg-quaternary hover:text-fg-secondary focus:outline-hidden">
                    <CalendarIcon className="size-5" />
                </AriaButton>
                <DateInput className="flex-1 !bg-transparent !shadow-none !ring-0" />
            </AriaGroup>
            {hint && <p className="text-sm text-tertiary">{hint}</p>}

            <AriaPopover
                offset={4}
                placement="bottom start"
                className={({ isEntering, isExiting }) =>
                    cx(
                        "origin-(--trigger-anchor-point) will-change-transform z-50",
                        isEntering &&
                            "duration-150 ease-out animate-in fade-in placement-bottom:slide-in-from-top-0.5",
                        isExiting &&
                            "duration-100 ease-in animate-out fade-out placement-bottom:slide-out-to-top-0.5",
                    )
                }
            >
                <AriaDialog className="rounded-2xl bg-primary shadow-xl ring ring-secondary_alt">
                    {({ close }) => (
                        <>
                            <div className="flex px-6 py-5">
                                <Calendar highlightedDates={highlightedDates} />
                            </div>
                            <div className="grid grid-cols-2 gap-3 border-t border-secondary p-4">
                                <Button size="md" color="secondary" onClick={close}>
                                    Cancel
                                </Button>
                                <Button size="md" color="primary" onClick={close}>
                                    Apply
                                </Button>
                            </div>
                        </>
                    )}
                </AriaDialog>
            </AriaPopover>
        </AriaDatePicker>
    );
}

function safeParseDate(iso: string): DateValue | undefined {
    try {
        return parseDate(iso);
    } catch {
        return undefined;
    }
}
