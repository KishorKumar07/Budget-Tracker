import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  BarChart3,
  Users,
  Settings,
  CalendarDays,
} from "lucide-react";
import { PERMISSIONS, type Permission } from "@/lib/permissions/constants";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
};

export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
  { label: "Transactions", href: "/transactions", icon: Receipt, permission: PERMISSIONS.TRANSACTION_VIEW },
  { label: "Calendar", href: "/calendar", icon: CalendarDays, permission: PERMISSIONS.TRANSACTION_VIEW },
  { label: "Budgets", href: "/budgets", icon: Wallet, permission: PERMISSIONS.BUDGET_VIEW },
  { label: "Analytics", href: "/analytics", icon: BarChart3, permission: PERMISSIONS.ANALYTICS_VIEW },
];

export const SECONDARY_NAV: NavItem[] = [
  { label: "Members", href: "/settings/members", icon: Users, permission: PERMISSIONS.MEMBER_VIEW },
];

export const SETTINGS_HREF = "/settings/profile";
export const SettingsIcon = Settings;

export function visibleNavItems(items: NavItem[], permissions: string[]) {
  return items.filter((item) => permissions.includes(item.permission));
}
