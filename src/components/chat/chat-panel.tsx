"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTRPC } from "@/trpc/client";
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

function buildCitationsMap(messages: DbMessage[]): Map<string, Citation[]> {
  const map = new Map<string, Citation[]>();
  for (const msg of messages) {
    const citations = msg.sourceCitations as Citation[] | null;
    if (msg.role === "assistant" && citations?.length) {
      map.set(msg.content, citations);
    }
  }
  return map;
}

const PAGE_SIZE = 50;

function getText(parts: UIMessage["parts"]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function dbToUIMessage(m: DbMessage): UIMessage {
  return {
    id: m.id,
    role: m.role,
    parts: [{ type: "text" as const, text: m.content }],
  };
}

interface ChatPanelProps {
  workspaceId: string;
  chatId: string;
  onTitleChange?: (title: string) => void;
}

export function ChatPanel({
  workspaceId,
  chatId,
  onTitleChange,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const prevScrollHeight = useRef(0);
  const pendingScrollRestore = useRef(false);
  const initialMsgCount = useRef(0);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [loaded, setLoaded] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [prependVersion, setPrependVersion] = useState(0);
  const [citationsByContent, setCitationsByContent] = useState<
    Map<string, Citation[]>
  >(new Map());

  const { messages, status, sendMessage, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { workspaceId, chatId },
    }),
    id: chatId,
    onFinish: ({ message }) => {
      const text = getText(message.parts);
      if (text && onTitleChange && initialMsgCount.current <= 1) {
        onTitleChange(text.slice(0, 255));
      }
    },
  });

  const loadMessages = useCallback(
    async (offset: number) => {
      const result = await queryClient.fetchQuery(
        trpc.chat.getMessages.queryOptions({
          chatId,
          limit: PAGE_SIZE,
          offset,
        }),
      );
      return result;
    },
    [chatId, trpc.chat.getMessages, queryClient],
  );

  useEffect(() => {
    offsetRef.current = 0;
    setHasMore(true);
    setLoadingOlder(false);
    pendingScrollRestore.current = false;
    setLoaded(false);
    setMessages([]);

    loadMessages(0).then((result) => {
      setHasMore(result.hasMore);
      offsetRef.current = result.messages.length;
      initialMsgCount.current = result.messages.length;

      setCitationsByContent(buildCitationsMap(result.messages));

      const uiMessages = result.messages.map(dbToUIMessage);
      setMessages(uiMessages);
      setLoaded(true);
    });
  }, [loadMessages, setMessages]);

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMore) return;
    setLoadingOlder(true);

    const result = await loadMessages(offsetRef.current);
    setHasMore(result.hasMore);
    offsetRef.current += result.messages.length;

    setCitationsByContent((prev) => {
      const next = new Map(prev);
      for (const msg of result.messages) {
        const citations = msg.sourceCitations as Citation[] | null;
        if (msg.role === "assistant" && citations?.length) {
          next.set(msg.content, citations);
        }
      }
      return next;
    });

    const olderUiMessages = result.messages.map(dbToUIMessage);

    setMessages((prev) => [...olderUiMessages, ...prev]);
    setLoadingOlder(false);
    pendingScrollRestore.current = true;
    setPrependVersion((v) => v + 1);
  }, [loadMessages, loadingOlder, hasMore, setMessages]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop } = scrollRef.current;

    if (scrollTop <= 10 && !loadingOlder && hasMore) {
      prevScrollHeight.current = scrollRef.current.scrollHeight;
      loadOlderMessages();
    }
  }, [loadOlderMessages, loadingOlder, hasMore]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!scrollRef.current || !pendingScrollRestore.current) return;
    const newHeight = scrollRef.current.scrollHeight;
    scrollRef.current.scrollTop = newHeight - prevScrollHeight.current;
    pendingScrollRestore.current = false;
    void prependVersion;
  }, [prependVersion]);

  useEffect(() => {
    if (!scrollRef.current || status === "ready") return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [status]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  if (!loaded) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {loadingOlder && (
          <div className="flex justify-center py-2 text-xs text-muted-foreground">
            Loading older messages...
          </div>
        )}
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
