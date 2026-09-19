"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProposedAction } from "./use-chat";

export function ProposalCard({
  proposal,
  confirmed,
  dismissed,
  onConfirm,
  onDismiss,
}: {
  proposal: ProposedAction;
  confirmed: boolean;
  dismissed: boolean;
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    await onConfirm();
    setConfirming(false);
  };

  if (confirmed) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm">
        <Check className="size-4 shrink-0 text-success" />
        <span className="text-foreground">Done — {proposal.summary}</span>
      </div>
    );
  }

  if (dismissed) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        <X className="size-4 shrink-0" />
        <span>Cancelled — {proposal.summary}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <p className="text-sm text-foreground">{proposal.summary}</p>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        {Object.entries(proposal.arguments)
          .filter(([key, value]) => value !== undefined && value !== null && key !== "rows")
          .map(([key, value]) => (
            <div key={key} className="flex justify-between gap-2">
              <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
              <span className="truncate text-foreground">{String(value)}</span>
            </div>
          ))}
      </div>
      <div className="mt-1 flex gap-2">
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={confirming}
          className={cn(confirming && "opacity-70")}
        >
          <Check className="size-3.5" />
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss} disabled={confirming}>
          <X className="size-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
