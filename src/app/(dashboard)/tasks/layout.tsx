import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tasks",
    description:
        "Track and manage compliance tasks with kanban board and list views. Auto-generated remediation tasks from CQC gap analysis with priority and assignment tracking.",
};

export default function TasksLayout({ children }: { children: React.ReactNode }) {
    return children;
}
