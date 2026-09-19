import "server-only";
import {
  getIncomeTotals,
  getExpenseTotals,
  getSavingsTotals,
  getCategorySpending,
  getMonthlyTrend,
} from "./transaction-service";
import { getWorkspaceBudgets } from "./budget-service";
import { calculateBalance, calculateMonthOverMonthChange } from "@/lib/calculations/finance";

function previousMonth(month: number, year: number) {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
}

export async function getMonthComparison(workspaceId: string, month: number, year: number) {
  const prev = previousMonth(month, year);

  const [currentIncome, currentExpenses, currentSavings, previousIncome, previousExpenses, previousSavings] =
    await Promise.all([
      getIncomeTotals(workspaceId, month, year),
      getExpenseTotals(workspaceId, month, year),
      getSavingsTotals(workspaceId, month, year),
      getIncomeTotals(workspaceId, prev.month, prev.year),
      getExpenseTotals(workspaceId, prev.month, prev.year),
      getSavingsTotals(workspaceId, prev.month, prev.year),
    ]);

  return {
    current: {
      income: currentIncome,
      expenses: currentExpenses,
      savings: currentSavings,
      balance: calculateBalance(currentIncome, currentExpenses, currentSavings),
    },
    previous: {
      income: previousIncome,
      expenses: previousExpenses,
      savings: previousSavings,
      balance: calculateBalance(previousIncome, previousExpenses, previousSavings),
    },
    expenseChangePercent: calculateMonthOverMonthChange(currentExpenses, previousExpenses),
    incomeChangePercent: calculateMonthOverMonthChange(currentIncome, previousIncome),
    savingsChangePercent: calculateMonthOverMonthChange(currentSavings, previousSavings),
  };
}

export type Insight = { text: string; tone: "positive" | "neutral" | "warning" };

/**
 * Simple rule-based insights — no AI, per product spec (§33). Each rule
 * is a plain comparison against last month or against budget usage.
 */
export async function getInsights(
  workspaceId: string,
  month: number,
  year: number,
  currency: string
): Promise<Insight[]> {
  const insights: Insight[] = [];
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  const [comparison, categorySpending, prevCategorySpending, budgets] = await Promise.all([
    getMonthComparison(workspaceId, month, year),
    getCategorySpending(workspaceId, month, year),
    getCategorySpending(workspaceId, ...(month === 1 ? [12, year - 1] as const : [month - 1, year] as const)),
    getWorkspaceBudgets(workspaceId, month, year),
  ]);

  // Savings insight
  if (comparison.current.savings > 0) {
    insights.push({
      text: `You put ${formatter.format(comparison.current.savings)} into savings this month.`,
      tone: "positive",
    });
  } else if (comparison.current.income > 0 && comparison.current.balance > 0) {
    insights.push({
      text: `You have ${formatter.format(comparison.current.balance)} left over this month.`,
      tone: "positive",
    });
  }

  // Category month-over-month comparison (top category only, to avoid noise)
  if (categorySpending.length > 0) {
    const top = categorySpending[0];
    const prevTop = prevCategorySpending.find((c) => c.category.id === top.category.id);
    if (prevTop && prevTop.total > 0) {
      const change = calculateMonthOverMonthChange(top.total, prevTop.total);
      if (Math.abs(change) >= 10) {
        insights.push({
          text: `You spent ${Math.abs(Math.round(change))}% ${change > 0 ? "more" : "less"} on ${top.category.name} than last month.`,
          tone: change > 0 ? "warning" : "positive",
        });
      }
    }
  }

  // Budget usage insight (highest-usage budget only)
  const budgetUsages = budgets
    .map((b) => ({ name: b.category.name, usage: Number(b.amount) > 0 ? (b.spent / Number(b.amount)) * 100 : 0 }))
    .sort((a, b) => b.usage - a.usage);

  if (budgetUsages.length > 0 && budgetUsages[0].usage >= 80) {
    insights.push({
      text: `You've used ${Math.round(budgetUsages[0].usage)}% of your ${budgetUsages[0].name} budget.`,
      tone: budgetUsages[0].usage >= 100 ? "warning" : "neutral",
    });
  }

  // Overall expense trend insight
  if (comparison.previous.expenses > 0 && Math.abs(comparison.expenseChangePercent) >= 5) {
    insights.push({
      text: `Overall spending is ${Math.abs(Math.round(comparison.expenseChangePercent))}% ${comparison.expenseChangePercent > 0 ? "higher" : "lower"} than last month.`,
      tone: comparison.expenseChangePercent > 0 ? "warning" : "positive",
    });
  }

  return insights;
}

export { getMonthlyTrend, getCategorySpending };
