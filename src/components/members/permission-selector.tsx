"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PERMISSIONS, PERMISSION_PRESETS, type Permission } from "@/lib/permissions/constants";

const PERMISSION_GROUPS: { title: string; items: { value: Permission; label: string }[] }[] = [
  {
    title: "Dashboard",
    items: [{ value: PERMISSIONS.DASHBOARD_VIEW, label: "View dashboard" }],
  },
  {
    title: "Transactions",
    items: [
      { value: PERMISSIONS.TRANSACTION_VIEW, label: "View transactions" },
      { value: PERMISSIONS.TRANSACTION_CREATE, label: "Add transactions" },
      { value: PERMISSIONS.TRANSACTION_UPDATE, label: "Edit transactions" },
      { value: PERMISSIONS.TRANSACTION_DELETE, label: "Delete transactions" },
    ],
  },
  {
    title: "Budgets",
    items: [
      { value: PERMISSIONS.BUDGET_VIEW, label: "View budgets" },
      { value: PERMISSIONS.BUDGET_CREATE, label: "Create budgets" },
      { value: PERMISSIONS.BUDGET_UPDATE, label: "Edit budgets" },
      { value: PERMISSIONS.BUDGET_DELETE, label: "Delete budgets" },
    ],
  },
  {
    title: "Analytics",
    items: [{ value: PERMISSIONS.ANALYTICS_VIEW, label: "View analytics" }],
  },
  {
    title: "Members",
    items: [
      { value: PERMISSIONS.MEMBER_VIEW, label: "View members" },
      { value: PERMISSIONS.MEMBER_INVITE, label: "Invite members" },
      { value: PERMISSIONS.MEMBER_UPDATE_PERMISSIONS, label: "Update permissions" },
      { value: PERMISSIONS.MEMBER_REMOVE, label: "Remove members" },
    ],
  },
];

export function PermissionSelector({
  name,
  defaultValue = [],
}: {
  name: string;
  defaultValue?: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultValue));

  const toggle = (permission: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  };

  const applyPreset = (permissions: Permission[]) => {
    setSelected(new Set(permissions));
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Quick setup</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PERMISSION_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset.permissions)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex max-h-80 flex-col gap-4 overflow-y-auto pr-1">
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{group.title}</p>
            <div className="flex flex-col gap-2">
              {group.items.map((item) => (
                <label
                  key={item.value}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <Checkbox
                    checked={selected.has(item.value)}
                    onCheckedChange={() => toggle(item.value)}
                  />
                  {item.label}
                  {selected.has(item.value) && (
                    <input type="hidden" name={name} value={item.value} />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
