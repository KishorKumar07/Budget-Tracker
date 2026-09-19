"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ProposalCard } from "./proposal-card";
import type { ChatMessageItem, ProposedAction } from "./use-chat";

export function MessageList({
  messages,
  onConfirm,
  onDismiss,
  sending,
}: {
  messages: ChatMessageItem[];
  onConfirm: (proposal: ProposedAction) => Promise<void>;
  onDismiss: (proposalId: string) => void;
  sending: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn("flex flex-col gap-1.5", message.role === "USER" ? "items-end" : "items-start")}
        >
          {message.content && (
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                message.role === "USER"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {message.content}
            </div>
          )}

          {message.proposedAction && (
            <div className="w-full max-w-[85%]">
              <ProposalCard
                proposal={message.proposedAction}
                confirmed={message.confirmed}
                dismissed={message.dismissed ?? false}
                onConfirm={() => onConfirm(message.proposedAction!)}
                onDismiss={() => onDismiss(message.proposedAction!.id)}
              />
            </div>
          )}
        </div>
      ))}

      {sending && (
        <div className="flex items-start">
          <div className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-2">
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
