import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NoKeyEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-6" />
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">Set up the AI assistant</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a free Gemini API key in Settings to start chatting with your budget assistant.
        </p>
      </div>
      <Button size="sm" nativeButton={false} render={<Link href="/settings/ai" />}>
        Go to Settings
      </Button>
    </div>
  );
}
