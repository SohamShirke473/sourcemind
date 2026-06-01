"use client";

import { ChatBubble } from "./chat-bubble";
import { ChatEmpty } from "./chat-empty";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    role: "user",
    content: "What are the main topics covered in these documents?",
    timestamp: "2:34 PM",
  },
  {
    id: "2",
    role: "assistant",
    content:
      "Based on the sources provided, the main topics include React component architecture, state management patterns, and server-side rendering strategies. Each document approaches these from a different angle — the PDF focuses on practical examples while the article discusses theoretical foundations.",
    timestamp: "2:34 PM",
  },
  {
    id: "3",
    role: "user",
    content: "Can you create a summary of the key points?",
    timestamp: "2:35 PM",
  },
];

export function ChatMessages() {
  if (MOCK_MESSAGES.length === 0) {
    return <ChatEmpty />;
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-6 py-6">
      {MOCK_MESSAGES.map((message) => (
        <ChatBubble
          key={message.id}
          role={message.role}
          content={message.content}
          timestamp={message.timestamp}
        />
      ))}
    </div>
  );
}
