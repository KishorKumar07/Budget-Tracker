export function calculateBalance(totalIncome: number, totalExpenses: number, totalSavings = 0) {
  return totalIncome - totalExpenses - totalSavings;
}

export function calculateSavingsRate(totalIncome: number, totalSavings: number) {
  if (totalIncome <= 0) return 0;
  return (totalSavings / totalIncome) * 100;
}

export function calculateBudgetUsage(categoryExpenses: number, categoryBudget: number) {
  if (categoryBudget <= 0) return 0;
  return (categoryExpenses / categoryBudget) * 100;
}

export function calculateRemainingBudget(categoryBudget: number, categoryExpenses: number) {
  return categoryBudget - categoryExpenses;
}

export type BudgetStatus = "under" | "near" | "over";

export function getBudgetStatus(usagePercent: number): BudgetStatus {
  if (usagePercent >= 100) return "over";
  if (usagePercent >= 80) return "near";
  return "under";
}

export function calculateMonthOverMonthChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / previous) * 100;
}
