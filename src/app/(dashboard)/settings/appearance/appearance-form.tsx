"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Deliberate: next-themes' documented hydration-safety pattern — the
  // server can't know the persisted theme, so this defers rendering the
  // actual selected state until after the client mounts.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col gap-3">
      <Label id="theme-picker-label">Theme</Label>
      <div className="grid grid-cols-3 gap-3" role="group" aria-labelledby="theme-picker-label">
        {OPTIONS.map((option) => {
          const active = mounted && theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              aria-pressed={active}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-4 py-5 text-sm font-medium transition-colors hover:bg-accent",
                active && "border-primary bg-accent"
              )}
            >
              {active && (
                <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-2.5" />
                </span>
              )}
              <option.icon className="size-5" />
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        &quot;System&quot; matches your device&apos;s light/dark setting automatically.
      </p>
    </div>
  );
}
