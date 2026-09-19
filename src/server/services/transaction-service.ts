import "server-only";
import { prisma } from "@/lib/db/prisma";
import { ForbiddenError } from "@/lib/auth/errors";
import { KnownError } from "@/lib/utils/safe-error-message";
import type { TransactionType, PaymentMethod } from "@/generated/prisma/client";

export type TransactionFilters = {
  search?: string;
  type?: TransactionType;
  categoryId?: string;
  month?: number;
  year?: number;
};

const PAGE_SIZE = 25;

export async function getWorkspaceTransactions(
  workspaceId: string,
  filters: TransactionFilters,
  page = 1
) {
  const where = {
    workspaceId,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.search
      ? { description: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
    ...(filters.month && filters.year
      ? {
          date: {
            gte: new Date(filters.year, filters.month - 1, 1),
            lt: new Date(filters.year, filters.month, 1),
          },
        }
      : {}),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: true,
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, pageSize: PAGE_SIZE, page };
}

export async function getTransactionForWorkspace(workspaceId: string, transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { category: true },
  });

  if (!transaction || transaction.workspaceId !== workspaceId) {
    throw new ForbiddenError("This transaction does not belong to this workspace.");
  }

  return transaction;
}

export async function createTransaction(
  workspaceId: string,
  createdById: string,
  data: {
    amount: number;
    type: TransactionType;
    categoryId: string;
    description?: string;
    date: Date;
    paymentMethod: PaymentMethod;
    notes?: string;
  }
) {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category || category.workspaceId !== workspaceId) {
    throw new ForbiddenError("This category does not belong to this workspace.");
  }

  return prisma.transaction.create({
    data: { workspaceId, createdById, ...data },
  });
}

export type BulkTransactionInput = {
  amount: number;
  type: TransactionType;
  categoryId: string;
  description?: string;
  date: Date;
  paymentMethod: PaymentMethod;
  notes?: string;
};

/**
 * Creates many transactions in one all-or-nothing operation (used by the
 * multi-row bulk-add table). Every row's category is verified to belong
 * to this workspace before any row is inserted.
 */
export async function createTransactionsBulk(
  workspaceId: string,
  createdById: string,
  rows: BulkTransactionInput[]
) {
  const categoryIds = [...new Set(rows.map((r) => r.categoryId))];
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  for (const row of rows) {
    const category = categoryById.get(row.categoryId);
    if (!category || category.workspaceId !== workspaceId) {
      throw new ForbiddenError("One or more selected categories do not belong to this workspace.");
    }
  }

  await prisma.transaction.createMany({
    data: rows.map((row) => ({ workspaceId, createdById, ...row })),
  });

  return rows.length;
}

export async function updateTransaction(
  workspaceId: string,
  transactionId: string,
  data: {
    amount: number;
    type: TransactionType;
    categoryId: string;
    description?: string;
    date: Date;
    paymentMethod: PaymentMethod;
    notes?: string;
  }
) {
  const existing = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!existing || existing.workspaceId !== workspaceId) {
    throw new ForbiddenError("This transaction does not belong to this workspace.");
  }

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category || category.workspaceId !== workspaceId) {
    throw new ForbiddenError("This category does not belong to this workspace.");
  }

  return prisma.transaction.update({
    where: { id: transactionId },
    data,
  });
}

/**
 * Reassigns many transactions to a single category in one operation. Every
 * transaction must already belong to this workspace, and the target
 * category's type (EXPENSE/INCOME/SAVINGS) must match every transaction's
 * own type — categories are typed, so mixing types in one bulk move would
 * silently mislabel data.
 */
export async function bulkRecategorizeTransactions(
  workspaceId: string,
  transactionIds: string[],
  categoryId: string
) {
  const [category, transactions] = await Promise.all([
    prisma.category.findUnique({ where: { id: categoryId } }),
    prisma.transaction.findMany({ where: { id: { in: transactionIds } } }),
  ]);

  if (!category || category.workspaceId !== workspaceId) {
    throw new ForbiddenError("This category does not belong to this workspace.");
  }

  if (transactions.length !== transactionIds.length) {
    throw new ForbiddenError("One or more transactions could not be found.");
  }

  const foreign = transactions.find((t) => t.workspaceId !== workspaceId);
  if (foreign) {
    throw new ForbiddenError("One or more transactions do not belong to this workspace.");
  }

  const mismatched = transactions.some((t) => t.type !== category.type);
  if (mismatched) {
    throw new KnownError(
      `"${category.name}" is a ${category.type.toLowerCase()} category and can't be used for transactions of a different type. Select transactions of the same type to move them together.`
    );
  }

  await prisma.transaction.updateMany({
    where: { id: { in: transactionIds }, workspaceId },
    data: { categoryId },
  });

  return transactions.length;
}

export async function deleteTransaction(workspaceId: string, transactionId: string) {
  const existing = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!existing || existing.workspaceId !== workspaceId) {
    throw new ForbiddenError("This transaction does not belong to this workspace.");
  }

  await prisma.transaction.delete({ where: { id: transactionId } });
}

export async function getIncomeTotals(workspaceId: string, month: number, year: number) {
  const result = await prisma.transaction.aggregate({
    where: {
      workspaceId,
      type: "INCOME",
      date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
    },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

export async function getExpenseTotals(workspaceId: string, month: number, year: number) {
  const result = await prisma.transaction.aggregate({
    where: {
      workspaceId,
      type: "EXPENSE",
      date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
    },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

export async function getSavingsTotals(workspaceId: string, month: number, year: number) {
  const result = await prisma.transaction.aggregate({
    where: {
      workspaceId,
      type: "SAVINGS",
      date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
    },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

/**
 * Income and expense totals per month, oldest to newest, ending at
 * (month, year) inclusive.
 */
export async function getMonthlyTrend(
  workspaceId: string,
  month: number,
  year: number,
  monthsBack = 6
) {
  const rangeStart = new Date(year, month - monthsBack, 1);
  const rangeEnd = new Date(year, month, 1);

  const transactions = await prisma.transaction.findMany({
    where: { workspaceId, date: { gte: rangeStart, lt: rangeEnd } },
    select: { amount: true, type: true, date: true },
  });

  const buckets: { month: number; year: number; income: number; expense: number; savings: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    buckets.push({ month: d.getMonth() + 1, year: d.getFullYear(), income: 0, expense: 0, savings: 0 });
  }

  for (const t of transactions) {
    const bucket = buckets.find(
      (b) => b.month === t.date.getMonth() + 1 && b.year === t.date.getFullYear()
    );
    if (!bucket) continue;
    if (t.type === "INCOME") bucket.income += Number(t.amount);
    else if (t.type === "SAVINGS") bucket.savings += Number(t.amount);
    else bucket.expense += Number(t.amount);
  }

  return buckets;
}

/**
 * Spending by top-level category for the month — a subcategory's spend is
 * rolled up into its parent, so "Food & Dining" reflects everything spent
 * across its subcategories too. Use getSubcategorySpending for the
 * per-subcategory breakdown of one specific parent.
 */
export async function getCategorySpending(workspaceId: string, month: number, year: number) {
  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      workspaceId,
      type: "EXPENSE",
      date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
    },
    _sum: { amount: true },
  });

  if (grouped.length === 0) return [];

  const categories = await prisma.category.findMany({
    where: { id: { in: grouped.map((g) => g.categoryId) } },
  });
  const byId = new Map(categories.map((c) => [c.id, c]));

  const totalsByTopLevelId = new Map<string, number>();
  for (const g of grouped) {
    const category = byId.get(g.categoryId);
    if (!category) continue;
    const topLevelId = category.parentId ?? category.id;
    totalsByTopLevelId.set(
      topLevelId,
      (totalsByTopLevelId.get(topLevelId) ?? 0) + Number(g._sum.amount ?? 0)
    );
  }

  const topLevelIds = [...totalsByTopLevelId.keys()];
  const topLevelCategories = await prisma.category.findMany({ where: { id: { in: topLevelIds } } });
  const topLevelById = new Map(topLevelCategories.map((c) => [c.id, c]));

  return topLevelIds
    .map((id) => ({
      category: topLevelById.get(id),
      total: totalsByTopLevelId.get(id) ?? 0,
    }))
    .filter((g): g is { category: NonNullable<typeof g.category>; total: number } => !!g.category)
    .sort((a, b) => b.total - a.total);
}

/**
 * Spending broken down by subcategory (plus a "direct" bucket for spend
 * logged straight against the parent) for one top-level category.
 */
export async function getSubcategorySpending(
  workspaceId: string,
  parentCategoryId: string,
  month: number,
  year: number
) {
  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      workspaceId,
      type: "EXPENSE",
      category: { OR: [{ id: parentCategoryId }, { parentId: parentCategoryId }] },
      date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
    },
    _sum: { amount: true },
  });

  if (grouped.length === 0) return [];

  const categories = await prisma.category.findMany({
    where: { id: { in: grouped.map((g) => g.categoryId) } },
  });
  const byId = new Map(categories.map((c) => [c.id, c]));

  return grouped
    .map((g) => ({
      category: byId.get(g.categoryId),
      total: Number(g._sum.amount ?? 0),
    }))
    .filter((g): g is { category: NonNullable<typeof g.category>; total: number } => !!g.category)
    .sort((a, b) => b.total - a.total);
}

/**
 * All transactions in a month, for the calendar view — grouped by day
 * (1-31) so the page can render a per-day summary without a query per cell.
 */
export async function getMonthTransactionsByDay(workspaceId: string, month: number, year: number) {
  const transactions = await prisma.transaction.findMany({
    where: {
      workspaceId,
      date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
    },
    include: {
      category: true,
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  const byDay = new Map<number, typeof transactions>();
  for (const t of transactions) {
    const day = t.date.getDate();
    const list = byDay.get(day) ?? [];
    list.push(t);
    byDay.set(day, list);
  }

  return byDay;
}

export async function getRecentTransactions(workspaceId: string, limit = 5) {
  return prisma.transaction.findMany({
    where: { workspaceId },
    include: { category: true },
    orderBy: { date: "desc" },
    take: limit,
  });
}
