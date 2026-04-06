"use client";

import { useMemo } from "react";
import { Calendar, type CalendarEvent } from "@/components/application/calendar/calendar";
import type { EventViewColor } from "@/components/application/calendar/base-components/calendar-month-view-event";
import type { Task } from "@/types";

const PRIORITY_COLOR: Record<string, EventViewColor> = {
    URGENT: "pink",
    HIGH: "orange",
    MEDIUM: "brand",
    LOW: "gray",
};

function taskColor(task: Task): EventViewColor {
    if (task.status === "OVERDUE") return "pink";
    if (task.status === "DONE") return "green";
    return PRIORITY_COLOR[task.priority] ?? "gray";
}

interface TaskCalendarViewProps {
    tasks: Task[];
    onSelectTask?: (task: Task) => void;
}

export function TaskCalendarView({ tasks }: TaskCalendarViewProps) {
    const events = useMemo<CalendarEvent[]>(() => {
        const result: CalendarEvent[] = [];
        for (const t of tasks) {
            if (!t.dueDate) continue;
            const due = new Date(t.dueDate);
            if (Number.isNaN(due.getTime())) continue;

            const start = new Date(due);
            start.setHours(9, 0, 0, 0);

            const end = new Date(due);
            end.setHours(10, 0, 0, 0);

            result.push({
                id: t.id,
                title: t.title,
                start,
                end,
                color: taskColor(t),
                dot: t.status === "OVERDUE",
            });
        }
        return result;
    }, [tasks]);

    return <Calendar events={events} view="month" className="min-h-[720px]" />;
}
