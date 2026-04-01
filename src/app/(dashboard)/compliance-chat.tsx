"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useCallback, memo } from "react";
import { MessageChatCircle, Send01, X, RefreshCcw01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import ReactMarkdown, { type Components } from "react-markdown";

const SUGGESTIONS = [
    "What are my most critical compliance gaps?",
    "How do I prepare for a CQC inspection?",
    "What evidence do I need for the Safe domain?",
    "How does the compliance score work?",
];

const transport = new DefaultChatTransport({ api: "/api/chat" });

const markdownComponents: Components = {
    h1: ({ children }) => (
        <h3 className="mt-3 mb-1.5 text-sm font-bold text-primary first:mt-0">{children}</h3>
    ),
    h2: ({ children }) => (
        <h4 className="mt-3 mb-1.5 text-[13px] font-bold text-primary first:mt-0">{children}</h4>
    ),
    h3: ({ children }) => (
        <h5 className="mt-2.5 mb-1 text-[13px] font-semibold text-primary first:mt-0">{children}</h5>
    ),
    p: ({ children }) => (
        <p className="mb-2 last:mb-0">{children}</p>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold text-primary">{children}</strong>
    ),
    em: ({ children }) => (
        <em className="italic text-secondary">{children}</em>
    ),
    ul: ({ children }) => (
        <ul className="mb-2 ml-0.5 space-y-1 last:mb-0">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-2 ml-0.5 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
    ),
    li: ({ children }) => (
        <li className="flex gap-1.5 text-[13px] leading-relaxed">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-fg-quaternary" />
            <span className="flex-1">{children}</span>
        </li>
    ),
    code: ({ children }) => (
        <code className="rounded bg-tertiary px-1 py-0.5 text-xs font-medium text-brand-secondary">{children}</code>
    ),
    hr: () => (
        <hr className="my-2 border-tertiary" />
    ),
};

const ChatMarkdown = memo(function ChatMarkdown({ content }: { content: string }) {
    return (
        <ReactMarkdown components={markdownComponents}>
            {content}
        </ReactMarkdown>
    );
});

function getMessageText(
    parts: Array<{ type: string; text?: string }>,
): string {
    return parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
}

export function ComplianceChat() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const { messages, sendMessage, status, setMessages } = useChat({
        transport,
    });

    const isActive = status === "submitted" || status === "streaming";

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, status, scrollToBottom]);

    function handleSuggestion(text: string) {
        sendMessage({ text });
    }

    function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || isActive) return;
        sendMessage({ text: input });
        setInput("");
    }

    function clearChat() {
        setMessages([]);
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center rounded-full bg-brand-solid text-white shadow-lg transition duration-100 hover:bg-brand-solid_hover hover:shadow-xl"
                aria-label="Open CQC Compliance Assistant"
            >
                <MessageChatCircle className="size-6" />
            </button>
        );
    }

    return (
        <div className="fixed right-6 bottom-6 z-50 flex h-[600px] w-[420px] flex-col rounded-2xl border border-secondary bg-primary shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-secondary px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-brand-secondary">
                        <MessageChatCircle className="size-4 text-fg-brand-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-primary">CQC Compliance Assistant</h3>
                        <p className="text-xs text-tertiary">Ask anything about CQC compliance</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="rounded-md p-1.5 text-fg-quaternary transition duration-100 hover:bg-primary_hover hover:text-fg-secondary"
                            aria-label="Clear chat"
                            title="Clear chat"
                        >
                            <RefreshCcw01 className="size-4" />
                        </button>
                    )}
                    <button
                        onClick={() => setOpen(false)}
                        className="rounded-md p-1.5 text-fg-quaternary transition duration-100 hover:bg-primary_hover hover:text-fg-secondary"
                        aria-label="Close chat"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto scroll-smooth p-4">
                {messages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center px-2">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-brand-secondary">
                            <MessageChatCircle className="size-6 text-fg-brand-primary" />
                        </div>
                        <p className="mt-3 text-sm font-medium text-primary">How can I help you today?</p>
                        <p className="mt-1 text-center text-xs text-tertiary">
                            Ask me about CQC compliance, your gaps, policies, or how to use this tool.
                        </p>
                        <div className="mt-5 w-full space-y-2">
                            {SUGGESTIONS.map((text) => (
                                <button
                                    key={text}
                                    onClick={() => handleSuggestion(text)}
                                    className="block w-full rounded-lg border border-secondary px-3 py-2.5 text-left text-xs text-secondary transition duration-100 hover:border-brand hover:bg-primary_hover hover:text-primary"
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m) => {
                    const text = getMessageText(m.parts);
                    if (!text) return null;

                    return (
                        <div
                            key={m.id}
                            className={cx(
                                "flex gap-2",
                                m.role === "user" ? "justify-end" : "justify-start",
                            )}
                        >
                            {m.role === "assistant" && (
                                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-secondary">
                                    <MessageChatCircle className="size-3 text-fg-brand-primary" />
                                </div>
                            )}
                            <div
                                className={cx(
                                    "max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed",
                                    m.role === "user"
                                        ? "bg-brand-solid text-white"
                                        : "bg-secondary text-primary",
                                )}
                            >
                                {m.role === "assistant" ? (
                                    <ChatMarkdown content={text} />
                                ) : (
                                    text
                                )}
                            </div>
                        </div>
                    );
                })}

                {status === "submitted" && (
                    <div className="flex gap-2">
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-secondary">
                            <MessageChatCircle className="size-3 text-fg-brand-primary" />
                        </div>
                        <div className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-2">
                            <span className="size-1.5 animate-bounce rounded-full bg-fg-quaternary [animation-delay:0ms]" />
                            <span className="size-1.5 animate-bounce rounded-full bg-fg-quaternary [animation-delay:150ms]" />
                            <span className="size-1.5 animate-bounce rounded-full bg-fg-quaternary [animation-delay:300ms]" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleFormSubmit} className="border-t border-secondary p-3">
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about CQC compliance..."
                        className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none placeholder:text-placeholder transition duration-100 focus:border-brand focus:ring-1 focus:ring-brand"
                        disabled={isActive}
                    />
                    <Button
                        type="submit"
                        color="primary"
                        size="sm"
                        isDisabled={!input.trim() || isActive}
                        iconLeading={Send01}
                    />
                </div>
                <p className="mt-2 text-center text-[10px] text-quaternary">
                    AI-powered assistant. Not a substitute for professional legal or compliance advice.
                </p>
            </form>
        </div>
    );
}
