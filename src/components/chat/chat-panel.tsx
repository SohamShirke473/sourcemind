"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";

interface Citation {
  sourceTitle: string;
  sourceType: string;
  snippet: string;
  similarity: number;
}

interface DbMessage {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  sourceCitations: unknown;
  createdAt: Date;
}

function getText(parts: UIMessage["parts"]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function dbMessageToParts(content: string): UIMessage["parts"] {
  return [{ type: "text" as const, text: content }];
}

interface ChatPanelProps {
  workspaceId: string;
  chatId: string;
  initialMessages?: DbMessage[];
  onTitleChange?: (title: string) => void;
  refetchMessages?: () => void;
}

export function ChatPanel({
  workspaceId,
  chatId,
  initialMessages = [],
  onTitleChange,
  refetchMessages,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { workspaceId, chatId },
    }),
    id: chatId,
    messages: initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: dbMessageToParts(m.content),
    })),
    onFinish: ({ message }) => {
      const text = getText(message.parts);
      if (text && onTitleChange && messages.length <= 1) {
        onTitleChange(text.slice(0, 255));
      }
      refetchMessages?.();
    },
  });

  const [citationsByContent, setCitationsByContent] = useState<
    Map<string, Citation[]>
  >(new Map());

  useEffect(() => {
    const map = new Map<string, Citation[]>();
    for (const msg of initialMessages) {
      const citations = msg.sourceCitations as Citation[] | null;
      if (msg.role === "assistant" && citations?.length) {
        map.set(msg.content, citations);
      }
    }
    setCitationsByContent(map);
  }, [initialMessages]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <ChatMessages
          messages={messages}
          status={status}
          sendMessage={sendMessage}
          citationsByContent={citationsByContent}
        />
      </div>
      <ChatInput
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        status={status}
      />
    </div>
  );
}
