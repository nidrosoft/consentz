"use client";

import { useState, useMemo } from "react";
import { FilterLines, ArrowsUp } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { mockTasks, mockUser } from "@/lib/mock-data";
import type { Task, TaskStatus, TaskPriority, DomainSlug } from "@/types";
import { TaskBoard } from "./_components/task-board";
import { TaskListView } from "./_components/task-list-view";
import { TaskSlideOver } from "./_components/task-slide-over";
import { AddTaskModal } from "./_components/add-task-modal";

type ViewMode = "board" | "list" | "my";

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [view, setView] = useState<ViewMode>("board");
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [slideOverOpen, setSlideOverOpen] = useState(false);

    // Filters
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | null>(null);
    const [domainFilter, setDomainFilter] = useState<DomainSlug | null>(null);
    const [sortBy, setSortBy] = useState<"dueDate" | "priority">("dueDate");
    const [showFilters, setShowFilters] = useState(false);

    const overdueCount = tasks.filter((t) => t.status === "OVERDUE").length;

    const filtered = useMemo(() => {
        let result = [...tasks];
        if (view === "my") result = result.filter((t) => t.assignee === mockUser.name);
        if (priorityFilter) result = result.filter((t) => t.priority === priorityFilter);
        if (domainFilter) result = result.filter((t) => t.domain === domainFilter);
        const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        if (sortBy === "dueDate") result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        else result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        return result;
    }, [tasks, view, priorityFilter, domainFilter, sortBy]);

    function handleMoveTask(taskId: string, newStatus: TaskStatus) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    }

    function handleUpdateTask(taskId: string, updates: Partial<Task>) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
        if (selectedTask?.id === taskId) setSelectedTask((prev) => prev ? { ...prev, ...updates } : prev);
    }

    function handleSelectTask(task: Task) {
        setSelectedTask(task);
        setSlideOverOpen(true);
    }

    function handleAddTask(task: Task) {
        setTasks((prev) => [...prev, task]);
    }

    const views: { id: ViewMode; label: string }[] = [
        { id: "board", label: "Board" },
        { id: "list", label: "List" },
        { id: "my", label: "My Tasks" },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Tasks</h1>
                    <p className="mt-1 text-sm text-tertiary">
                        {tasks.length} tasks{overdueCount > 0 && <> · <span className="font-medium text-error-primary">{overdueCount} overdue</span></>}
                    </p>
                </div>
                <AddTaskModal onAdd={handleAddTask} />
            </div>

            {/* View toggle + Filter/Sort */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-1 rounded-lg border border-secondary bg-secondary p-0.5">
                    {views.map((v) => (
                        <button
                            key={v.id}
                            onClick={() => setView(v.id)}
                            className={cx(
                                "rounded-md px-3 py-1.5 text-xs font-medium transition duration-100",
                                view === v.id ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
                            )}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cx(
                            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition duration-100",
                            showFilters ? "border-brand-600 bg-brand-primary text-brand-secondary" : "border-secondary bg-primary text-secondary hover:bg-primary_hover",
                        )}
                    >
                        <FilterLines className="size-3.5" />
                        Filter
                    </button>
                    <button
                        onClick={() => setSortBy(sortBy === "dueDate" ? "priority" : "dueDate")}
                        className="flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-1.5 text-xs font-medium text-secondary transition duration-100 hover:bg-primary_hover"
                    >
                        <ArrowsUp className="size-3.5" />
                        {sortBy === "dueDate" ? "Due date" : "Priority"}
                    </button>
                </div>
            </div>

            {/* Filter chips */}
            {showFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-tertiary">Priority:</span>
                    {(["URGENT", "HIGH", "MEDIUM", "LOW"] as TaskPriority[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPriorityFilter(priorityFilter === p ? null : p)}
                            className={cx(
                                "rounded-full px-2.5 py-1 text-xs font-medium transition duration-100",
                                priorityFilter === p ? "bg-brand-primary text-brand-secondary" : "bg-secondary text-secondary hover:bg-primary_hover",
                            )}
                        >
                            {p}
                        </button>
                    ))}
                    <span className="ml-2 text-xs text-tertiary">Domain:</span>
                    {(["safe", "effective", "caring", "responsive", "well-led"] as DomainSlug[]).map((d) => (
                        <button
                            key={d}
                            onClick={() => setDomainFilter(domainFilter === d ? null : d)}
                            className={cx(
                                "rounded-full px-2.5 py-1 text-xs font-medium capitalize transition duration-100",
                                domainFilter === d ? "bg-brand-primary text-brand-secondary" : "bg-secondary text-secondary hover:bg-primary_hover",
                            )}
                        >
                            {d}
                        </button>
                    ))}
                    {(priorityFilter || domainFilter) && (
                        <button
                            onClick={() => { setPriorityFilter(null); setDomainFilter(null); }}
                            className="ml-2 text-xs font-medium text-brand-secondary hover:underline"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            )}

            {/* Content */}
            {view === "list" || view === "my" ? (
                <TaskListView tasks={filtered} onSelectTask={handleSelectTask} />
            ) : (
                <TaskBoard tasks={filtered} onMoveTask={handleMoveTask} onSelectTask={handleSelectTask} />
            )}

            {/* Slide-over detail panel */}
            <TaskSlideOver
                task={selectedTask}
                isOpen={slideOverOpen}
                onClose={() => setSlideOverOpen(false)}
                onUpdate={handleUpdateTask}
            />
        </div>
    );
}
