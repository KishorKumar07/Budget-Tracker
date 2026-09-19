"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { NoKeyEmptyState } from "./no-key-empty-state";
import { useChat } from "./use-chat";

export function ChatPanel({ workspaceId, hasAnyAiKey }: { workspaceId: string; hasAnyAiKey: boolean }) {
  const { messages, loadingHistory, sending, error, loadHistory, sendMessage, confirmProposal, dismissProposal } =
    useChat(workspaceId);

  useEffect(() => {
    if (hasAnyAiKey) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnyAiKey]);

  if (!hasAnyAiKey) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Budget Assistant</SheetTitle>
        </SheetHeader>
        <NoKeyEmptyState />
      </>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle>Budget Assistant</SheetTitle>
      </SheetHeader>

      {loadingHistory ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {messages.length === 0 && (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Ask me about your spending, or tell me to add a transaction, category, or budget.
            </div>
          )}
          <MessageList
            messages={messages}
            onConfirm={confirmProposal}
            onDismiss={dismissProposal}
            sending={sending}
          />
        </>
      )}

      {error && (
        <p className="px-4 pb-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      <MessageInput onSend={sendMessage} disabled={sending} />
    </div>
  );
}
