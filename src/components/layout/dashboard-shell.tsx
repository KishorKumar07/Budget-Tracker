"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";
import { AddTransactionSheet } from "@/components/transactions/add-transaction-sheet";
import { BulkAddDialog } from "@/components/transactions/bulk-add-dialog";
import { ChatWidget } from "@/components/ai/chat-widget";
import type { SelectableCategory } from "@/components/categories/category-selector";
import { checkInAppReminderAction } from "@/app/(dashboard)/reminder-actions";
import { PERMISSIONS } from "@/lib/permissions/constants";

type WorkspaceOption = { id: string; name: string };

export function DashboardShell({
  workspaces,
  activeWorkspaceId,
  permissions,
  userName,
  userEmail,
  expenseCategories,
  incomeCategories,
  savingsCategories,
  frequentlyUsedExpense,
  frequentlyUsedIncome,
  frequentlyUsedSavings,
  hasAnyAiKey,
  children,
}: {
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string;
  permissions: string[];
  userName: string;
  userEmail: string;
  expenseCategories: SelectableCategory[];
  incomeCategories: SelectableCategory[];
  savingsCategories: SelectableCategory[];
  frequentlyUsedExpense: SelectableCategory[];
  frequentlyUsedIncome: SelectableCategory[];
  frequentlyUsedSavings: SelectableCategory[];
  hasAnyAiKey: boolean;
  children: React.ReactNode;
}) {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);

  useEffect(() => {
    checkInAppReminderAction().then((due) => {
      if (due) {
        toast("Don't forget to log today's spending.", {
          description: "Add today's transactions before you lose track.",
        });
      }
    });
    // Runs once per app mount — a page navigation shouldn't re-trigger it.
  }, []);

  return (
    <div className="flex min-h-svh">
      <AppSidebar
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        permissions={permissions}
        userName={userName}
        userEmail={userEmail}
        onAddTransaction={() => setAddSheetOpen(true)}
        onAddMultiple={() => setBulkAddOpen(true)}
      />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        {children}
      </div>
      <MobileNav
        permissions={permissions}
        onAddClick={() => setAddSheetOpen(true)}
        onAddMultipleClick={() => setBulkAddOpen(true)}
      />

      <AddTransactionSheet
        workspaceId={activeWorkspaceId}
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        savingsCategories={savingsCategories}
        frequentlyUsedExpense={frequentlyUsedExpense}
        frequentlyUsedIncome={frequentlyUsedIncome}
        frequentlyUsedSavings={frequentlyUsedSavings}
      />

      <BulkAddDialog
        workspaceId={activeWorkspaceId}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        savingsCategories={savingsCategories}
        open={bulkAddOpen}
        onOpenChange={setBulkAddOpen}
        showTrigger={false}
      />

      {permissions.includes(PERMISSIONS.AI_USE) && (
        <ChatWidget workspaceId={activeWorkspaceId} hasAnyAiKey={hasAnyAiKey} />
      )}
    </div>
  );
}
