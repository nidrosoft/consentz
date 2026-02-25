"use client";

import { useState } from "react";
import { Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Select } from "@/components/base/select/select";
import { DialogTrigger, ModalOverlay, Modal, Dialog } from "@/components/application/modals/modal";
import { CloseButton } from "@/components/base/buttons/close-button";
import type { Task, TaskPriority, DomainSlug } from "@/types";
import { DOMAIN_OPTIONS, PRIORITY_OPTIONS, ASSIGNEE_OPTIONS } from "./task-constants";

interface AddTaskModalProps {
    onAdd: (task: Task) => void;
}

export function AddTaskModal({ onAdd }: AddTaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
    const [domain, setDomain] = useState<DomainSlug>("safe");
    const [assignee, setAssignee] = useState("Jane Smith");
    const [dueDate, setDueDate] = useState("");

    function handleSubmit(close: () => void) {
        if (!title.trim()) return;
        const newTask: Task = {
            id: `task-${Date.now()}`,
            title: title.trim(),
            description: description.trim(),
            status: "TODO",
            priority,
            assignee,
            dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            relatedGapId: null,
            domain,
        };
        onAdd(newTask);
        setTitle("");
        setDescription("");
        setPriority("MEDIUM");
        setDomain("safe");
        setAssignee("Jane Smith");
        setDueDate("");
        close();
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
                                            selectedKey={assignee}
                                            onSelectionChange={(key) => setAssignee(key as string)}
                                            items={ASSIGNEE_OPTIONS}
                                        >
                                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                        </Select>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-secondary">Due date</label>
                                            <input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                className="rounded-lg bg-primary px-3.5 py-2 text-sm text-primary shadow-xs ring-1 ring-primary ring-inset focus:ring-2 focus:ring-brand focus:outline-hidden"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button color="secondary" size="md" onClick={close}>Cancel</Button>
                                    <Button color="primary" size="md" onClick={() => handleSubmit(close)} isDisabled={!title.trim()}>
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
