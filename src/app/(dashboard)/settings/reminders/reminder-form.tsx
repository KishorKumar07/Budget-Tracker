"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { updateReminderAction, type ActionState } from "./actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/layout/submit-button";
import { cn } from "@/lib/utils";

const initialState: ActionState = {};

export function ReminderForm({
  reminderEnabled,
  reminderTime,
  timezone,
}: {
  reminderEnabled: boolean;
  reminderTime: string;
  timezone: string;
}) {
  const [state, formAction] = useActionState(updateReminderAction, initialState);
  const [enabled, setEnabled] = useState(reminderEnabled);
  const [time, setTime] = useState(reminderTime);
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (state !== lastHandledState.current && state.success) {
      toast.success("Reminder settings updated.");
    }
    lastHandledState.current = state;
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="reminderEnabled">Daily reminder</Label>
          <p className="text-xs text-muted-foreground">
            Get an email and in-app nudge to log today&apos;s transactions.
          </p>
        </div>
        <Switch
          id="reminderEnabled"
          name="reminderEnabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reminderTime">Remind me at</Label>
        <Input
          id="reminderTime"
          name="reminderTime"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          suppressHydrationWarning
          className={cn("w-40", !enabled && "opacity-50")}
        />
        <p className="text-xs text-muted-foreground">
          In your timezone ({timezone}). Change your timezone in Profile settings.
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton className="w-fit">Save Changes</SubmitButton>
    </form>
  );
}
