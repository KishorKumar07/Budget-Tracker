import "server-only";
import { prisma } from "@/lib/db/prisma";
import { ForbiddenError } from "@/lib/auth/errors";
import { KnownError } from "@/lib/utils/safe-error-message";

export async function getWorkspaceBudgets(workspaceId: string, month: number, year: number) {
  const budgets = await prisma.budget.findMany({
    where: { workspaceId, month, year },
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });

  if (budgets.length === 0) return [];

  const spendByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      workspaceId,
      type: "EXPENSE",
      categoryId: { in: budgets.map((b) => b.categoryId) },
      date: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
    _sum: { amount: true },
  });

  const spentById = new Map(
    spendByCategory.map((s) => [s.categoryId, Number(s._sum.amount ?? 0)])
  );

  return budgets.map((budget) => ({
    ...budget,
    spent: spentById.get(budget.categoryId) ?? 0,
  }));
}

export async function getBudgetedCategoryIds(workspaceId: string, month: number, year: number) {
  const budgets = await prisma.budget.findMany({
    where: { workspaceId, month, year },
    select: { categoryId: true },
  });
  return new Set(budgets.map((b) => b.categoryId));
}

export async function createBudget(
  workspaceId: string,
  data: { categoryId: string; amount: number; month: number; year: number }
) {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category || category.workspaceId !== workspaceId) {
    throw new ForbiddenError("This category does not belong to this workspace.");
  }

  const existing = await prisma.budget.findUnique({
    where: {
      workspaceId_categoryId_month_year: {
        workspaceId,
        categoryId: data.categoryId,
        month: data.month,
        year: data.year,
      },
    },
  });

  if (existing) {
    throw new KnownError("A budget already exists for this category this month.");
  }

  return prisma.budget.create({ data: { workspaceId, ...data } });
}

export async function updateBudgetAmount(workspaceId: string, budgetId: string, amount: number) {
  const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
  if (!budget || budget.workspaceId !== workspaceId) {
    throw new ForbiddenError("This budget does not belong to this workspace.");
  }

  return prisma.budget.update({ where: { id: budgetId }, data: { amount } });
}

export async function deleteBudget(workspaceId: string, budgetId: string) {
  const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
  if (!budget || budget.workspaceId !== workspaceId) {
    throw new ForbiddenError("This budget does not belong to this workspace.");
  }

  await prisma.budget.delete({ where: { id: budgetId } });
}
