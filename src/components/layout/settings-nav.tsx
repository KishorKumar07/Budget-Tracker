"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Palette, ShieldCheck, Users, Building2, Tags, Bell, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

type SettingsNavItem = {
  label: string;
  href: string;
  icon: typeof User;
};

const BASE_ITEMS: SettingsNavItem[] = [
  { label: "Profile", href: "/settings/profile", icon: User },
  { label: "Appearance", href: "/settings/appearance", icon: Palette },
  { label: "Security", href: "/settings/security", icon: ShieldCheck },
  { label: "Reminders", href: "/settings/reminders", icon: Bell },
  { label: "AI Assistant", href: "/settings/ai", icon: Bot },
  { label: "Categories", href: "/settings/categories", icon: Tags },
];

export function SettingsNav({
  showMembers,
  showWorkspace,
}: {
  showMembers: boolean;
  showWorkspace: boolean;
}) {
  const pathname = usePathname();

  const items: SettingsNavItem[] = [
    ...BASE_ITEMS,
    ...(showMembers ? [{ label: "Members", href: "/settings/members", icon: Users }] : []),
    ...(showWorkspace ? [{ label: "Workspace", href: "/settings/workspace", icon: Building2 }] : []),
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border px-4 md:w-48 md:flex-col md:border-b-0 md:border-r md:px-3 md:py-6">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
