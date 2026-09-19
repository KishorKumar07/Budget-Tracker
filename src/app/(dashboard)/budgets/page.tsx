import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { requireAuth } from "@/lib/auth/guards";
import { getActiveWorkspace } from "@/lib/workspace/current-workspace";
import { getUserCurrency } from "@/server/services/user-service";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { getWorkspaceBudgets, getBudgetedCategoryIds } from "@/server/services/budget-service";
import { getWorkspaceCategories } from "@/server/services/category-service";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { MonthSelector } from "@/components/layout/month-selector";
import { CreateBudgetSheet } from "@/components/budgets/create-budget-sheet";
import { BudgetCard } from "@/components/budgets/budget-card";

export default async function BudgetsPage({
  searchParams,
}: PageProps<"/budgets">) {
  const { user } = await requireAuth();
  const active = await getActiveWorkspace();
  if (!active) redirect("/onboarding/workspace");

  const permissions = active.membership.permissions;
  if (!permissions.includes(PERMISSIONS.BUDGET_VIEW)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const now = new Date();
  const month = typeof params.month === "string" ? Number(params.month) : now.getMonth() + 1;
  const year = typeof params.year === "string" ? Number(params.year) : now.getFullYear();

  const canCreate = permissions.includes(PERMISSIONS.BUDGET_CREATE);
  const canUpdate = permissions.includes(PERMISSIONS.BUDGET_UPDATE);
  const canDelete = permissions.includes(PERMISSIONS.BUDGET_DELETE);

  const [currency, budgets, expenseCategories, budgetedCategoryIds] = await Promise.all([
    getUserCurrency(user.id),
    getWorkspaceBudgets(active.workspace.id, month, year),
    getWorkspaceCategories(active.workspace.id, "EXPENSE"),
    getBudgetedCategoryIds(active.workspace.id, month, year),
  ]);

  const availableCategories = expenseCategories.filter((c) => !budgetedCategoryIds.has(c.id));

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Budgets"
        action={canCreate ? (
          <CreateBudgetSheet
            workspaceId={active.workspace.id}
            month={month}
            year={year}
            availableCategories={availableCategories}
          />
        ) : undefined}
      />

      <div className="flex flex-col gap-6 p-4 md:p-8">
        <MonthSelector month={month} year={year} />

        {budgets.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No budgets set for this month"
            description="Create a budget for a category to start tracking how much you have left to spend."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                workspaceId={active.workspace.id}
                budgetId={budget.id}
                categoryName={budget.category.name}
                categoryIcon={budget.category.icon}
                spent={budget.spent}
                amount={Number(budget.amount)}
                currency={currency}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
