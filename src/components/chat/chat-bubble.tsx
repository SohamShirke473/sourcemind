"use client";

import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

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
            : "border border-border bg-popover text-foreground",
        )}
      >
        {content}
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
