"use client";

import { useState, useRef, useEffect } from "react";
import { MessageChatCircle, Send01, X } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export function ComplianceChat() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage() {
        if (!input.trim() || loading) return;
        const userMsg: ChatMessage = { role: "user", content: input.trim() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input.trim(), history: messages }),
            });
            const data = await res.json();
            if (data.success && data.data?.response) {
                setMessages((prev) => [...prev, { role: "assistant", content: data.data.response }]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: "Sorry, I couldn't process that request." },
                ]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Connection error. Please try again." },
            ]);
        } finally {
            setLoading(false);
        }
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center rounded-full bg-brand-solid text-white shadow-lg transition duration-100 hover:bg-brand-solid_hover"
            >
                <MessageChatCircle className="size-6" />
            </button>
        );
    }

    return (
        <div className="fixed right-6 bottom-6 z-50 flex h-[500px] w-[380px] flex-col rounded-2xl border border-secondary bg-primary shadow-2xl">
            <div className="flex items-center justify-between border-b border-secondary px-4 py-3">
                <h3 className="text-sm font-semibold text-primary">CQC Compliance Assistant</h3>
                <button
                    onClick={() => setOpen(false)}
                    className="rounded-md p-1 text-fg-quaternary hover:bg-primary_hover"
                >
                    <X className="size-4" />
                </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && (
                    <p className="pt-8 text-center text-sm text-tertiary">
                        Ask me anything about CQC compliance, regulations, or your assessment results.
                    </p>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={cx(
                            "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                            msg.role === "user"
                                ? "ml-auto bg-brand-solid text-white"
                                : "bg-secondary text-primary",
                        )}
                    >
                        {msg.content}
                    </div>
                ))}
                {loading && (
                    <div className="max-w-[85%] animate-pulse rounded-xl bg-secondary px-3 py-2 text-sm text-tertiary">
                        Thinking...
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="border-t border-secondary p-3">
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Ask about CQC compliance..."
                        className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none placeholder:text-placeholder focus:border-brand"
                    />
                    <Button
                        color="primary"
                        size="sm"
                        onClick={sendMessage}
                        isDisabled={!input.trim() || loading}
                        iconLeading={Send01}
                    />
                </div>
            </div>
        </div>
    );
}
