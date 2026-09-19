"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { updateProfileAction, type ActionState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SubmitButton } from "@/components/layout/submit-button";
import { CURRENCIES, TIMEZONES } from "@/lib/validations/profile";

const initialState: ActionState = {};

const CURRENCY_LABELS: Record<(typeof CURRENCIES)[number], string> = {
  INR: "₹ Indian Rupee",
  USD: "$ US Dollar",
  EUR: "€ Euro",
  GBP: "£ British Pound",
  AUD: "$ Australian Dollar",
  CAD: "$ Canadian Dollar",
  JPY: "¥ Japanese Yen",
  SGD: "$ Singapore Dollar",
};

const TIMEZONE_LABELS: Record<(typeof TIMEZONES)[number], string> = {
  "Asia/Kolkata": "India (IST)",
  "Asia/Dubai": "Dubai (GST)",
  "Asia/Singapore": "Singapore (SGT)",
  "Europe/London": "London (GMT/BST)",
  "Europe/Berlin": "Berlin (CET)",
  "America/New_York": "New York (ET)",
  "America/Los_Angeles": "Los Angeles (PT)",
  "America/Chicago": "Chicago (CT)",
  "Australia/Sydney": "Sydney (AET)",
  UTC: "UTC",
};

export function ProfileForm({
  name,
  email,
  image,
  currency,
  timezone,
}: {
  name: string;
  email: string;
  image: string | null;
  currency: string;
  timezone: string;
}) {
  const [state, formAction] = useActionState(updateProfileAction, initialState);
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (state !== lastHandledState.current && state.success) {
      toast.success("Profile updated.");
    }
    lastHandledState.current = state;
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarImage src={image ?? undefined} />
          <AvatarFallback className="text-lg">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input key={name} id="name" name="name" defaultValue={name} maxLength={80} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email-display">Email</Label>
        <Input id="email-display" value={email} disabled />
        <p className="text-xs text-muted-foreground">Email can&apos;t be changed.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="currency">Currency</Label>
          <NativeSelect id="currency" name="currency" defaultValue={currency}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {CURRENCY_LABELS[c]}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="timezone">Timezone</Label>
          <NativeSelect id="timezone" name="timezone" defaultValue={timezone}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {TIMEZONE_LABELS[tz]}
              </option>
            ))}
          </NativeSelect>
        </div>
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
