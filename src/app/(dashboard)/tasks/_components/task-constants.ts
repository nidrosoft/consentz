import { CheckSquare, Clock, AlertCircle, CheckCircle } from "@untitledui/icons";
import type { TaskStatus, TaskPriority } from "@/types";

export const STATUS_COLUMNS: { id: TaskStatus; label: string; icon: typeof CheckSquare; color: string }[] = [
    { id: "TODO", label: "To Do", icon: CheckSquare, color: "text-tertiary" },
    { id: "IN_PROGRESS", label: "In Progress", icon: Clock, color: "text-brand-600" },
    { id: "OVERDUE", label: "Overdue", icon: AlertCircle, color: "text-error-primary" },
    { id: "DONE", label: "Done", icon: CheckCircle, color: "text-success-primary" },
];

export const PRIORITY_BADGE: Record<TaskPriority, "error" | "warning" | "brand" | "gray"> = {
    URGENT: "error",
    HIGH: "warning",
    MEDIUM: "brand",
    LOW: "gray",
};

export const STATUS_BADGE: Record<TaskStatus, "error" | "warning" | "brand" | "gray" | "success"> = {
    TODO: "gray",
    IN_PROGRESS: "brand",
    OVERDUE: "error",
    DONE: "success",
};

export const DOMAIN_OPTIONS = [
    { id: "safe", label: "Safe" },
    { id: "effective", label: "Effective" },
    { id: "caring", label: "Caring" },
    { id: "responsive", label: "Responsive" },
    { id: "well-led", label: "Well-Led" },
];

export const PRIORITY_OPTIONS: { id: TaskPriority; label: string }[] = [
    { id: "URGENT", label: "Urgent" },
    { id: "HIGH", label: "High" },
    { id: "MEDIUM", label: "Medium" },
    { id: "LOW", label: "Low" },
];

export const STATUS_OPTIONS: { id: TaskStatus; label: string }[] = [
    { id: "TODO", label: "To Do" },
    { id: "IN_PROGRESS", label: "In Progress" },
    { id: "OVERDUE", label: "Overdue" },
    { id: "DONE", label: "Done" },
];

export const ASSIGNEE_OPTIONS = [
    { id: "Jane Smith", label: "Jane Smith" },
    { id: "Mark Jones", label: "Mark Jones" },
    { id: "Sarah Williams", label: "Sarah Williams" },
    { id: "Emily Taylor", label: "Emily Taylor" },
    { id: "David Brown", label: "David Brown" },
];
