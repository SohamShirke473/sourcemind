"use client";

import type { UIMessage } from "ai";
import { ChatBubble } from "./chat-bubble";
import { ChatEmpty } from "./chat-empty";

interface Citation {
  sourceTitle: string;
  sourceType: string;
  snippet: string;
  similarity: number;
}

function extractText(parts: UIMessage["parts"]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

interface ChatMessagesProps {
  messages: UIMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
  sendMessage: (message: { text: string }) => void;
  citationsByContent?: Map<string, Citation[]>;
}

export function ChatMessages({
  messages,
  status,
  sendMessage,
  citationsByContent,
}: ChatMessagesProps) {
  if (messages.length === 0) {
    return <ChatEmpty sendMessage={sendMessage} />;
  }

  return (
    <div className="flex flex-col gap-5 px-6 py-6">
      {messages.map((message, idx) => (
        <ChatBubble
          key={message.id}
          role={message.role as "user" | "assistant"}
          content={extractText(message.parts)}
          isStreaming={
            message.role === "assistant" &&
            status === "streaming" &&
            idx === messages.length - 1
          }
          sourceCitations={
            message.role === "assistant"
              ? citationsByContent?.get(extractText(message.parts))
              : undefined
          }
        />
      ))}
    </div>
  );
}
