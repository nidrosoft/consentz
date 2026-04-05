"use client";

import { useState } from "react";
import { Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Select } from "@/components/base/select/select";
import { DatePickerField } from "@/components/application/date-picker/date-picker-field";
import { DialogTrigger, ModalOverlay, Modal, Dialog } from "@/components/application/modals/modal";
import { CloseButton } from "@/components/base/buttons/close-button";
import type { Task, TaskPriority, DomainSlug } from "@/types";
import { useCreateTask } from "@/hooks/use-tasks";
import { useStaff } from "@/hooks/use-staff";
import { DOMAIN_OPTIONS, PRIORITY_OPTIONS } from "./task-constants";

interface AddTaskModalProps {
    onAdd: (task: Task) => void;
}

export function AddTaskModal({ onAdd }: AddTaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
    const [domain, setDomain] = useState<DomainSlug>("safe");
    const [assigneeId, setAssigneeId] = useState<string | null>(null);
    const [dueDate, setDueDate] = useState("");

    const createTask = useCreateTask();
    const { data: staffData } = useStaff({ pageSize: 100 });
    const staffList = (staffData?.data ?? []) as { id: string; first_name?: string; last_name?: string; firstName?: string; lastName?: string; name?: string }[];

    const assigneeOptions = staffList.map((s) => {
        const fullName = s.name ?? `${s.first_name ?? s.firstName ?? ""} ${s.last_name ?? s.lastName ?? ""}`.trim();
        return { id: s.id, label: fullName || "Unknown" };
    });

    function resetForm() {
        setTitle("");
        setDescription("");
        setPriority("MEDIUM");
        setDomain("safe");
        setAssigneeId(null);
        setDueDate("");
    }

    function handleSubmit(close: () => void) {
        if (!title.trim()) return;

        createTask.mutate(
            {
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                domain,
                assignedToId: assigneeId || undefined,
                dueDate: dueDate || undefined,
            },
            {
                onSuccess: (data: any) => {
                    const task: Task = {
                        id: data?.id ?? `temp-${Date.now()}`,
                        title: title.trim(),
                        description: description.trim(),
                        status: "TODO",
                        priority,
                        assignee: assigneeOptions.find((a) => a.id === assigneeId)?.label ?? "",
                        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
                        relatedGapId: null,
                        domain,
                    };
                    onAdd(task);
                    resetForm();
                    close();
                },
            },
        );
    }

    return (
        <DialogTrigger>
            <Button color="primary" size="md" iconLeading={Plus}>Add Task</Button>
            <ModalOverlay>
                <Modal className="max-w-lg">
                    <Dialog className="flex-col items-stretch rounded-xl bg-primary p-6 shadow-xl ring-1 ring-secondary">
                        {({ close }) => (
                            <>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-primary">Create New Task</h2>
                                    <CloseButton size="sm" onClick={close} />
                                </div>

                                <div className="mt-5 flex flex-col gap-4">
                                    <Input
                                        label="Task title"
                                        size="sm"
                                        placeholder="e.g. Update safeguarding policy"
                                        value={title}
                                        onChange={(v) => setTitle(v)}
                                        autoFocus
                                    />

                                    <TextArea
                                        label="Description"
                                        placeholder="Describe what needs to be done..."
                                        rows={3}
                                        value={description}
                                        onChange={(v) => setDescription(v)}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Select
                                            label="Priority"
                                            size="sm"
                                            selectedKey={priority}
                                            onSelectionChange={(key) => setPriority(key as TaskPriority)}
                                            items={PRIORITY_OPTIONS}
                                        >
                                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                        </Select>
                                        <Select
                                            label="Domain"
                                            size="sm"
                                            selectedKey={domain}
                                            onSelectionChange={(key) => setDomain(key as DomainSlug)}
                                            items={DOMAIN_OPTIONS}
                                        >
                                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Select
                                            label="Assign to"
                                            size="sm"
                                            placeholder={assigneeOptions.length === 0 ? "No staff found" : "Select..."}
                                            selectedKey={assigneeId}
                                            onSelectionChange={(key) => setAssigneeId(key as string)}
                                            items={assigneeOptions}
                                            isDisabled={assigneeOptions.length === 0}
                                        >
                                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                        </Select>
                                        <DatePickerField
                                            label="Due date"
                                            value={dueDate}
                                            onChange={(v) => setDueDate(v)}
                                            size="sm"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button color="secondary" size="md" onClick={close} isDisabled={createTask.isPending}>Cancel</Button>
                                    <Button
                                        color="primary"
                                        size="md"
                                        onClick={() => handleSubmit(close)}
                                        isDisabled={!title.trim()}
                                        isLoading={createTask.isPending}
                                    >
                                        Create Task
                                    </Button>
                                </div>
                            </>
                        )}
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </DialogTrigger>
    );
}
