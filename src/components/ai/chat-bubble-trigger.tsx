"use client";

import { Sparkles } from "lucide-react";
import { SheetTrigger } from "@/components/ui/sheet";

export function ChatBubbleTrigger() {
  return (
    <SheetTrigger
      aria-label="Open budget assistant"
      className="fixed right-4 bottom-4 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 md:right-6 md:bottom-6"
    >
      <Sparkles className="size-5" />
    </SheetTrigger>
  );
}
