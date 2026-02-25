"use client";

import { File06, CheckSquare, Stars01 } from "@untitledui/icons";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { DomainBadge, getDomainConfig } from "@/components/shared/domain-badge";
import { cx } from "@/utils/cx";
import type { Task, TaskStatus, TaskPriority } from "@/types";
import { PRIORITY_BADGE, STATUS_OPTIONS, PRIORITY_OPTIONS, ASSIGNEE_OPTIONS } from "./task-constants";

function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface TaskSlideOverProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export function TaskSlideOver({ task, isOpen, onClose, onUpdate }: TaskSlideOverProps) {
    if (!task) return null;

    const days = daysUntil(task.dueDate);
    const dueLabel = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `Due in ${days}d`;
    const domainConfig = getDomainConfig(task.domain);

    return (
        <SlideoutMenu isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <SlideoutMenu.Header onClose={onClose}>
                <div className="flex flex-col gap-1 pr-8">
                    <h2 className="text-lg font-semibold text-primary">{task.title}</h2>
                    <div className="flex items-center gap-2">
                        <BadgeWithDot size="sm" color={PRIORITY_BADGE[task.priority]}>
                            {task.priority}
                        </BadgeWithDot>
                        <span className={cx("text-xs font-medium", days < 0 ? "text-error-primary" : days <= 3 ? "text-warning-primary" : "text-tertiary")}>
                            {dueLabel}
                        </span>
                    </div>
                </div>
            </SlideoutMenu.Header>

            <SlideoutMenu.Content>
                {/* Editable fields */}
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Status"
                            size="sm"
                            selectedKey={task.status}
                            onSelectionChange={(key) => onUpdate(task.id, { status: key as TaskStatus })}
                            items={STATUS_OPTIONS}
                        >
                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                        <Select
                            label="Priority"
                            size="sm"
                            selectedKey={task.priority}
                            onSelectionChange={(key) => onUpdate(task.id, { priority: key as TaskPriority })}
                            items={PRIORITY_OPTIONS}
                        >
                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Assigned to"
                            size="sm"
                            selectedKey={task.assignee}
                            onSelectionChange={(key) => onUpdate(task.id, { assignee: key as string })}
                            items={ASSIGNEE_OPTIONS}
                        >
                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-secondary">Due date</label>
                            <span className="rounded-lg bg-primary px-3.5 py-2 text-md text-primary shadow-xs ring-1 ring-primary ring-inset">
                                {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                        </div>
                    </div>
                    {task.relatedGapId && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-secondary">Source</label>
                            <span className="text-sm text-tertiary">Assessment (auto-generated)</span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="h-px bg-secondary" />

                {/* CQC Context */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-primary">CQC Context</h3>
                    <div className="flex items-center gap-3 rounded-lg border border-secondary bg-secondary_subtle p-3">
                        <DomainBadge domain={task.domain} size="md" />
                        {task.relatedGapId && <span className="text-xs text-tertiary">Linked gap: {task.relatedGapId}</span>}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-secondary" />

                {/* Description */}
                <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-primary">Description</h3>
                    <p className="text-sm text-tertiary leading-relaxed">{task.description}</p>
                </div>

                {/* Divider */}
                <div className="h-px bg-secondary" />

                {/* Quick Actions */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-primary">Quick Actions</h3>
                    <div className="flex flex-col gap-2">
                        <Button color="secondary" size="sm" iconLeading={Stars01} className="w-full justify-start">
                            Create Policy (AI)
                        </Button>
                        <Button color="secondary" size="sm" iconLeading={File06} className="w-full justify-start">
                            Upload Evidence
                        </Button>
                        <Button
                            color="secondary"
                            size="sm"
                            iconLeading={CheckSquare}
                            className="w-full justify-start"
                            onClick={() => onUpdate(task.id, { status: "DONE" })}
                        >
                            Mark Complete
                        </Button>
                    </div>
                </div>
            </SlideoutMenu.Content>
        </SlideoutMenu>
    );
}
