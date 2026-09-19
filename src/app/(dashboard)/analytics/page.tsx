import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { requireAuth } from "@/lib/auth/guards";
import { getActiveWorkspace } from "@/lib/workspace/current-workspace";
import { getUserCurrency } from "@/server/services/user-service";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { getMonthlyTrend, getCategorySpending } from "@/server/services/transaction-service";
import { getMonthComparison, getInsights } from "@/server/services/analytics-service";
import { getWorkspaceCategories } from "@/server/services/category-service";
import { PageHeader } from "@/components/layout/page-header";
import { MonthSelector } from "@/components/layout/month-selector";
import { ChartCard } from "@/components/dashboard/chart-card";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { CategoryBreakdownChart } from "@/components/analytics/category-breakdown-chart";
import { MonthComparisonCard } from "@/components/analytics/month-comparison-card";
import { InsightsList } from "@/components/analytics/insights-list";
import { EmptyState } from "@/components/layout/empty-state";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function AnalyticsPage({
  searchParams,
}: PageProps<"/analytics">) {
  const { user } = await requireAuth();
  const active = await getActiveWorkspace();
  if (!active) redirect("/onboarding/workspace");

  const permissions = active.membership.permissions;
  if (!permissions.includes(PERMISSIONS.ANALYTICS_VIEW)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const now = new Date();
  const month = typeof params.month === "string" ? Number(params.month) : now.getMonth() + 1;
  const year = typeof params.year === "string" ? Number(params.year) : now.getFullYear();

  const workspaceId = active.workspace.id;
  const currency = await getUserCurrency(user.id);

  const [trend, categorySpending, comparison, insights, allCategories] = await Promise.all([
    getMonthlyTrend(workspaceId, month, year),
    getCategorySpending(workspaceId, month, year),
    getMonthComparison(workspaceId, month, year),
    getInsights(workspaceId, month, year, currency),
    getWorkspaceCategories(workspaceId),
  ]);

  const categoriesWithSubs = new Set(
    allCategories.filter((c) => c.parentId).map((c) => c.parentId)
  );

  const hasData = trend.some((t) => t.income > 0 || t.expense > 0);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Analytics" />

      <div className="flex flex-col gap-6 p-4 md:p-8">
        <MonthSelector month={month} year={year} />

        {!hasData ? (
          <EmptyState
            icon={BarChart3}
            title="Nothing to analyze yet"
            description="Once you've logged some transactions, you'll see spending trends and insights here."
          />
        ) : (
          <>
            <InsightsList insights={insights} />

            <MonthComparisonCard
              currency={currency}
              month={month}
              currentExpenses={comparison.current.expenses}
              previousExpenses={comparison.previous.expenses}
              expenseChangePercent={comparison.expenseChangePercent}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Monthly Spending Trend">
                <IncomeExpenseChart
                  currency={currency}
                  data={trend.map((t) => ({
                    label: MONTH_NAMES[t.month - 1].slice(0, 3),
                    income: t.income,
                    expense: t.expense,
                    savings: t.savings,
                  }))}
                />
              </ChartCard>

              <ChartCard title="Category Breakdown">
                <CategoryBreakdownChart
                  currency={currency}
                  workspaceId={workspaceId}
                  month={month}
                  year={year}
                  data={categorySpending.map((c) => ({
                    id: c.category.id,
                    name: c.category.name,
                    icon: c.category.icon,
                    value: c.total,
                    color: c.category.color,
                    hasSubcategories: categoriesWithSubs.has(c.category.id),
                  }))}
                />
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
