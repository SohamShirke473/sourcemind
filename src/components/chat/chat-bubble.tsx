"use client";

import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function ChatBubble({ role, content, timestamp }: ChatBubbleProps) {
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
      </div>
      <span className="px-1 text-[10px] text-muted-foreground">
        {timestamp}
      </span>
    </div>
  );
}
