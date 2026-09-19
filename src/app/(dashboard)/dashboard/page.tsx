import { redirect } from "next/navigation";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Receipt } from "lucide-react";
import { requireAuth } from "@/lib/auth/guards";
import { getActiveWorkspace } from "@/lib/workspace/current-workspace";
import { getUserCurrency } from "@/server/services/user-service";
import {
  getIncomeTotals,
  getExpenseTotals,
  getSavingsTotals,
  getCategorySpending,
  getRecentTransactions,
  getMonthlyTrend,
} from "@/server/services/transaction-service";
import { getWorkspaceBudgets } from "@/server/services/budget-service";
import { calculateBalance, calculateSavingsRate } from "@/lib/calculations/finance";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { PageHeader } from "@/components/layout/page-header";
import { MonthSelector } from "@/components/layout/month-selector";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { CategorySpendingChart } from "@/components/dashboard/category-spending-chart";
import { BudgetSummary } from "@/components/dashboard/budget-summary";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { EmptyState } from "@/components/layout/empty-state";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { user } = await requireAuth();
  const active = await getActiveWorkspace();
  if (!active) redirect("/onboarding/workspace");

  const params = await searchParams;
  const now = new Date();
  const month = typeof params.month === "string" ? Number(params.month) : now.getMonth() + 1;
  const year = typeof params.year === "string" ? Number(params.year) : now.getFullYear();

  const workspaceId = active.workspace.id;
  const permissions = active.membership.permissions;

  const [currency, income, expenses, savings, categorySpending, recentTransactions, budgets, trend] =
    await Promise.all([
      getUserCurrency(user.id),
      getIncomeTotals(workspaceId, month, year),
      getExpenseTotals(workspaceId, month, year),
      getSavingsTotals(workspaceId, month, year),
      getCategorySpending(workspaceId, month, year),
      getRecentTransactions(workspaceId, 5),
      getWorkspaceBudgets(workspaceId, month, year),
      getMonthlyTrend(workspaceId, month, year),
    ]);

  const balance = calculateBalance(income, expenses, savings);
  const savingsRate = calculateSavingsRate(income, savings);

  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  const hasAnyActivity = income > 0 || expenses > 0 || savings > 0 || recentTransactions.length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title={active.workspace.name} />

      <div className="flex flex-col gap-6 p-4 md:p-8">
        <MonthSelector month={month} year={year} />

        {!hasAnyActivity ? (
          <EmptyState
            icon={Receipt}
            title="Your spending story starts here"
            description="Add your first transaction to start understanding where your money goes."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
              <SummaryCard label="Income" value={formatter.format(income)} icon={TrendingUp} tone="success" />
              <SummaryCard label="Expenses" value={formatter.format(expenses)} icon={TrendingDown} tone="danger" />
              <SummaryCard label="Savings" value={formatter.format(savings)} icon={PiggyBank} />
              <SummaryCard label="Balance" value={formatter.format(balance)} icon={Wallet} />
              <SummaryCard label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} icon={PiggyBank} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Income vs Expenses">
                <IncomeExpenseChart
                  currency={currency}
                  data={trend.map((t) => ({
                    label: `${MONTH_NAMES[t.month - 1].slice(0, 3)}`,
                    income: t.income,
                    expense: t.expense,
                    savings: t.savings,
                  }))}
                />
              </ChartCard>

              <ChartCard title="Spending by Category">
                <CategorySpendingChart
                  currency={currency}
                  data={categorySpending.map((c) => ({
                    name: c.category.name,
                    icon: c.category.icon,
                    value: c.total,
                    color: c.category.color,
                  }))}
                />
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {permissions.includes(PERMISSIONS.BUDGET_VIEW) && budgets.length > 0 && (
                <BudgetSummary
                  currency={currency}
                  budgets={budgets.slice(0, 4).map((b) => ({
                    id: b.id,
                    categoryName: b.category.name,
                    categoryIcon: b.category.icon,
                    spent: b.spent,
                    amount: Number(b.amount),
                  }))}
                />
              )}

              {recentTransactions.length > 0 && (
                <RecentTransactions
                  currency={currency}
                  transactions={recentTransactions.map((t) => ({
                    id: t.id,
                    amount: t.amount.toString(),
                    type: t.type,
                    description: t.description,
                    date: t.date.toISOString(),
                    category: { name: t.category.name, icon: t.category.icon, color: t.category.color },
                  }))}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
