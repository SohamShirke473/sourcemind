"use client";

import { Loader2Icon, SendHorizonalIcon } from "lucide-react";
import { PillButton } from "@/components/ui/pill-button";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: "submitted" | "streaming" | "ready" | "error";
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  status,
}: ChatInputProps) {
  const isLoading = status === "submitted" || status === "streaming";

  return (
    <form
      onSubmit={onSubmit}
      className="sticky bottom-0 border-t border-border bg-card p-4"
    >
      <div className="flex items-center gap-3 rounded-ui border border-border bg-card px-4 py-3">
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Ask anything about your sources..."
          disabled={isLoading}
          className="h-auto flex-1 border-none bg-transparent px-0 text-sm outline-none placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
        />
        <PillButton
          variant="primary"
          size="icon"
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SendHorizonalIcon className="size-4" />
          )}
        </PillButton>
      </div>
    </form>
  );
}
