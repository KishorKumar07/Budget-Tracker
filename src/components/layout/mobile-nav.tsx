"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Receipt, BarChart3, Menu, Plus, Layers } from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions/constants";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function MobileNav({
  permissions,
  onAddClick,
  onAddMultipleClick,
}: {
  permissions: string[];
  onAddClick: () => void;
  onAddMultipleClick: () => void;
}) {
  const pathname = usePathname();
  const canCreateTransaction = permissions.includes(PERMISSIONS.TRANSACTION_CREATE);

  const items = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard, show: permissions.includes(PERMISSIONS.DASHBOARD_VIEW) },
    { label: "Transactions", href: "/transactions", icon: Receipt, show: permissions.includes(PERMISSIONS.TRANSACTION_VIEW) },
  ].filter((i) => i.show);

  const trailingItems = [
    { label: "Analytics", href: "/analytics", icon: BarChart3, show: permissions.includes(PERMISSIONS.ANALYTICS_VIEW) },
    { label: "More", href: "/settings/profile", icon: Menu, show: true },
  ].filter((i) => i.show);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
      <div className="flex items-center justify-around px-2 py-1.5">
        {items.map((item) => (
          <MobileNavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
        ))}

        {canCreateTransaction && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Add transaction"
              className="flex flex-col items-center gap-0.5 px-3"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Plus className="size-5" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top">
              <DropdownMenuItem onClick={onAddClick}>
                <Receipt className="size-4" />
                Single Transaction
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddMultipleClick}>
                <Layers className="size-4" />
                Add Multiple
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {trailingItems.map((item) => (
          <MobileNavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
        ))}
      </div>
    </nav>
  );
}

function MobileNavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-14 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}
