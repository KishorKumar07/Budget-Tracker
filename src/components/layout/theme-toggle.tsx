"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Deliberate: next-themes' documented hydration-safety pattern — the
  // server can't know the persisted theme, so this defers rendering the
  // actual toggle state until after the client mounts.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-7 w-[84px]" />;
  }

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={theme === option.value ? "default" : "ghost"}
          size="icon-xs"
          aria-label={`${option.label} theme`}
          aria-pressed={theme === option.value}
          onClick={() => setTheme(option.value)}
        >
          <option.icon className="size-3.5" />
        </Button>
      ))}
    </div>
  );
}
