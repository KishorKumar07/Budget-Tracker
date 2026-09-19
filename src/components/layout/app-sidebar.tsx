"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, SECONDARY_NAV, SETTINGS_HREF, SettingsIcon, visibleNavItems } from "@/config/nav";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { ThemeToggle } from "./theme-toggle";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { LogOut, Plus, Receipt, Layers, ChevronDown } from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions/constants";

type WorkspaceOption = { id: string; name: string };

export function AppSidebar({
  workspaces,
  activeWorkspaceId,
  permissions,
  userName,
  userEmail,
  onAddTransaction,
  onAddMultiple,
}: {
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string;
  permissions: string[];
  userName: string;
  userEmail: string;
  onAddTransaction: () => void;
  onAddMultiple: () => void;
}) {
  const pathname = usePathname();
  const primaryItems = visibleNavItems(PRIMARY_NAV, permissions);
  const secondaryItems = visibleNavItems(SECONDARY_NAV, permissions);
  const canAddTransaction = permissions.includes(PERMISSIONS.TRANSACTION_CREATE);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex flex-col gap-2 p-4">
        <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} />
        {canAddTransaction && (
          <DropdownMenu>
            <div className="flex w-full">
              <Button onClick={onAddTransaction} className="flex-1 rounded-r-none">
                <Plus className="size-4" />
                Add Transaction
              </Button>
              <DropdownMenuTrigger
                render={
                  <Button
                    className="rounded-l-none border-l border-primary-foreground/20 px-2"
                    aria-label="More add options"
                  />
                }
              >
                <ChevronDown className="size-4" />
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onAddTransaction}>
                <Receipt className="size-4" />
                Single Transaction
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddMultiple}>
                <Layers className="size-4" />
                Add Multiple
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {primaryItems.map((item) => (
          <NavLink key={item.href} href={item.href} active={pathname.startsWith(item.href)}>
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}

        {secondaryItems.length > 0 && (
          <div className="my-3 h-px bg-sidebar-border" />
        )}

        {secondaryItems.map((item) => (
          <NavLink key={item.href} href={item.href} active={pathname.startsWith(item.href)}>
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}

        <NavLink href={SETTINGS_HREF} active={pathname.startsWith("/settings") && !pathname.startsWith("/settings/members")}>
          <SettingsIcon className="size-4" />
          Settings
        </NavLink>
      </nav>

      <div className="flex flex-col gap-3 border-t border-sidebar-border p-4">
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      {children}
    </Link>
  );
}
