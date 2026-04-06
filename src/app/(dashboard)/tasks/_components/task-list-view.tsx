"use client";

import { BadgeWithDot } from "@/components/base/badges/badges";
import { DomainBadge } from "@/components/shared/domain-badge";
import { Table, TableCard } from "@/components/application/table/table";
import { cx } from "@/utils/cx";
import type { Task } from "@/types";
import { PRIORITY_BADGE, STATUS_BADGE } from "./task-constants";

function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface TaskListViewProps {
    tasks: Task[];
    onSelectTask: (task: Task) => void;
}

export function TaskListView({ tasks, onSelectTask }: TaskListViewProps) {
    return (
        <TableCard.Root>
            <TableCard.Header
                title="All Tasks"
                badge={String(tasks.length)}
                description="Click any row to view task details."
            />
            <Table aria-label="Tasks" selectionMode="none">
                <Table.Header>
                    <Table.Head id="title" label="Task" isRowHeader />
                    <Table.Head id="domain" label="Domain" className="hidden sm:table-cell" />
                    <Table.Head id="priority" label="Priority" />
                    <Table.Head id="assignee" label="Assigned" />
                    <Table.Head id="due" label="Due" className="hidden sm:table-cell" />
                    <Table.Head id="status" label="Status" />
                </Table.Header>
                <Table.Body items={tasks}>
                    {(task) => {
                        const days = daysUntil(task.dueDate);
                        const dueLabel = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d`;
                        return (
                            <Table.Row id={task.id} className="cursor-pointer" onAction={() => onSelectTask(task)}>
                                <Table.Cell>
                                    <div>
                                        <p className="text-sm font-medium text-primary whitespace-nowrap">{task.title}</p>
                                        <p className="text-xs text-tertiary line-clamp-1">{task.description}</p>
                                    </div>
                                </Table.Cell>
                                <Table.Cell className="hidden sm:table-cell">
                                    <DomainBadge domain={task.domain} size="sm" />
                                </Table.Cell>
                                <Table.Cell>
                                    <BadgeWithDot size="sm" color={PRIORITY_BADGE[task.priority]}>
                                        {task.priority}
                                    </BadgeWithDot>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-tertiary whitespace-nowrap">{task.assignee}</span>
                                </Table.Cell>
                                <Table.Cell className="hidden sm:table-cell">
                                    <span className={cx(
                                        "text-sm whitespace-nowrap",
                                        days < 0 ? "font-medium text-error-primary" : days <= 3 ? "font-medium text-warning-primary" : "text-tertiary",
                                    )}>
                                        {dueLabel}
                                    </span>
                                </Table.Cell>
                                <Table.Cell>
                                    <BadgeWithDot size="sm" color={STATUS_BADGE[task.status]}>
                                        {task.status.replace("_", " ")}
                                    </BadgeWithDot>
                                </Table.Cell>
                            </Table.Row>
                        );
                    }}
                </Table.Body>
            </Table>
        </TableCard.Root>
    );
}
