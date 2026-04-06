"use client";

import { useState, useRef, type DragEvent } from "react";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { DomainBadge } from "@/components/shared/domain-badge";
import { cx } from "@/utils/cx";
import type { Task, TaskStatus } from "@/types";
import { STATUS_COLUMNS, PRIORITY_BADGE } from "./task-constants";

function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface TaskBoardProps {
    tasks: Task[];
    onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
    onSelectTask: (task: Task) => void;
}

export function TaskBoard({ tasks, onMoveTask, onSelectTask }: TaskBoardProps) {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

    function handleDragStart(e: DragEvent, taskId: string) {
        setDraggedId(taskId);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", taskId);
    }

    function handleDragEnd() {
        setDraggedId(null);
        setDragOverCol(null);
    }

    function handleDragOver(e: DragEvent, colId: TaskStatus) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverCol(colId);
    }

    function handleDragLeave() {
        setDragOverCol(null);
    }

    function handleDrop(e: DragEvent, colId: TaskStatus) {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
            onMoveTask(taskId, colId);
        }
        setDraggedId(null);
        setDragOverCol(null);
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4">
            {STATUS_COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.id);
                const isOver = dragOverCol === col.id;

                return (
                    <div
                        key={col.id}
                        className={cx(
                            "flex min-w-[280px] shrink-0 flex-col gap-3 rounded-xl p-3 transition-colors duration-150 sm:min-w-0",
                            isOver && "bg-brand-primary/30 ring-2 ring-brand-300 ring-inset",
                        )}
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        {/* Column header */}
                        <div className="flex items-center gap-2">
                            <col.icon className={cx("size-4", col.color)} />
                            <span className="text-sm font-semibold text-primary">{col.label}</span>
                            <Badge size="sm" color="gray" type="pill-color">{colTasks.length}</Badge>
                        </div>

                        {/* Task cards */}
                        <div className="flex flex-col gap-2">
                            {colTasks.map((task) => {
                                const days = daysUntil(task.dueDate);
                                const dueLabel = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d`;
                                const isDragging = draggedId === task.id;

                                return (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => onSelectTask(task)}
                                        className={cx(
                                            "cursor-grab rounded-xl border border-secondary bg-primary p-4 transition duration-150 hover:border-brand-300 hover:shadow-xs active:cursor-grabbing",
                                            isDragging && "opacity-50 ring-2 ring-brand",
                                        )}
                                    >
                                        <p className="text-sm font-medium text-primary">{task.title}</p>
                                        <p className="mt-1 line-clamp-2 text-xs text-tertiary">{task.description}</p>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <BadgeWithDot size="sm" color={PRIORITY_BADGE[task.priority]}>
                                                {task.priority}
                                            </BadgeWithDot>
                                            <DomainBadge domain={task.domain} size="sm" />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs text-tertiary">
                                            <span>{task.assignee}</span>
                                            <span className={cx(
                                                days < 0 && "font-medium text-error-primary",
                                                days >= 0 && days <= 3 && "font-medium text-warning-primary",
                                            )}>
                                                {dueLabel}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            {colTasks.length === 0 && (
                                <div className={cx(
                                    "rounded-xl border border-dashed border-secondary p-8 text-center text-xs text-tertiary",
                                    isOver && "border-brand-300 bg-brand-primary/20",
                                )}>
                                    {isOver ? "Drop here" : "No tasks"}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
