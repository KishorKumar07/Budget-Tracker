"use client";

import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChatBubbleTrigger } from "./chat-bubble-trigger";
import { ChatPanel } from "./chat-panel";

export function ChatWidget({
  workspaceId,
  hasAnyAiKey,
}: {
  workspaceId: string;
  hasAnyAiKey: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <ChatBubbleTrigger />
      <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-sm">
        <ChatPanel workspaceId={workspaceId} hasAnyAiKey={hasAnyAiKey} />
      </SheetContent>
    </Sheet>
  );
}
