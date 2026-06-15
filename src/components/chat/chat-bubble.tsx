"use client";

import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const MarkdownRenderer = dynamic(() => import("./markdown-renderer"), {
  loading: () => <span className="animate-pulse">…</span>,
  ssr: false,
});

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  sourceCitations?: Array<{
    sourceTitle: string;
    sourceType: string;
    snippet: string;
    similarity: number;
  }>;
}

export function ChatBubble({
  role,
  content,
  isStreaming,
  sourceCitations,
}: ChatBubbleProps) {
  const isUser = role === "user";
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-ui px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-popover text-foreground prose prose-sm dark:prose-invert max-w-none",
        )}
      >
        {isUser ? content : <MarkdownRenderer content={content} />}
        {isStreaming && (
          <Loader2Icon className="ml-1 inline-block size-3 animate-spin align-middle" />
        )}
      </div>
      {!isUser && sourceCitations && sourceCitations.length > 0 && (
        <div className="flex flex-col gap-1 px-1">
          <span className="text-[10px] font-medium text-muted-foreground">
            Sources
          </span>
          {sourceCitations.map((cite, i) => (
            <span
              key={`${cite.sourceTitle}-${i}`}
              className="text-[10px] text-muted-foreground/70 leading-tight"
            >
              [{i + 1}] {cite.sourceTitle}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
