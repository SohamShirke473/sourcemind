"use client";

import { Loader2Icon, SendHorizonalIcon } from "lucide-react";
import type { KeyboardEvent } from "react";
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="sticky bottom-0 border-t border-border bg-card p-4"
    >
      <div className="flex gap-3 rounded-ui border border-border bg-card px-4 py-3">
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your sources..."
          disabled={isLoading}
          rows={5}
          className="min-h-[140px] flex-1 resize-none overflow-y-auto border-none bg-transparent px-0 text-sm outline-none placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 leading-relaxed"
        />
        <PillButton
          variant="primary"
          size="icon"
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
          className="self-end"
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
