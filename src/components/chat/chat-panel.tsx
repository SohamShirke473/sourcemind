"use client";

import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";

export function ChatPanel() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <ChatMessages />
      </div>
      <ChatInput />
    </div>
  );
}
