import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import { getActiveWorkspace } from "@/lib/workspace/current-workspace";
import { getUserWorkspaces } from "@/server/services/workspace-service";
import { getWorkspaceCategoriesWithSubcategories, getFrequentlyUsedCategories } from "@/server/services/category-service";
import { getCategoryGroup } from "@/lib/categories/default-categories";
import { hasAnyAiKeyConfigured } from "@/server/services/ai-key-service";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireAuth();
  const active = await getActiveWorkspace();

  if (!active) {
    redirect("/onboarding/workspace");
  }

  const [
    workspaces,
    expenseCategories,
    incomeCategories,
    savingsCategories,
    frequentExpense,
    frequentIncome,
    frequentSavings,
    hasAnyAiKey,
  ] = await Promise.all([
    getUserWorkspaces(user.id),
    getWorkspaceCategoriesWithSubcategories(active.workspace.id, "EXPENSE"),
    getWorkspaceCategoriesWithSubcategories(active.workspace.id, "INCOME"),
    getWorkspaceCategoriesWithSubcategories(active.workspace.id, "SAVINGS"),
    getFrequentlyUsedCategories(active.workspace.id, "EXPENSE"),
    getFrequentlyUsedCategories(active.workspace.id, "INCOME"),
    getFrequentlyUsedCategories(active.workspace.id, "SAVINGS"),
    hasAnyAiKeyConfigured(user.id),
  ]);

  const toSelectable = (c: { id: string; name: string; icon: string; isDefault: boolean }) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    group: getCategoryGroup(c.name, c.isDefault),
  });

  const toSelectableWithSubs = (
    c: { id: string; name: string; icon: string; isDefault: boolean; subcategories: { id: string; name: string; icon: string; isDefault: boolean }[] }
  ) => ({
    ...toSelectable(c),
    subcategories: c.subcategories.map(toSelectable),
  });

  return (
    <DashboardShell
      workspaces={workspaces.map((w) => ({ id: w.id, name: w.name }))}
      activeWorkspaceId={active.workspace.id}
      permissions={active.membership.permissions}
      userName={user.name ?? user.email ?? ""}
      userEmail={user.email ?? ""}
      expenseCategories={expenseCategories.map(toSelectableWithSubs)}
      incomeCategories={incomeCategories.map(toSelectableWithSubs)}
      savingsCategories={savingsCategories.map(toSelectableWithSubs)}
      frequentlyUsedExpense={frequentExpense.map(toSelectable)}
      frequentlyUsedIncome={frequentIncome.map(toSelectable)}
      frequentlyUsedSavings={frequentSavings.map(toSelectable)}
      hasAnyAiKey={hasAnyAiKey}
    >
      {children}
    </DashboardShell>
  );
}
