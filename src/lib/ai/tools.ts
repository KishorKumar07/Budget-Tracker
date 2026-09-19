import "server-only";
import { z } from "zod";
import { PERMISSIONS, type Permission } from "@/lib/permissions/constants";
import {
  createTransaction,
  createTransactionsBulk,
  updateTransaction,
  bulkRecategorizeTransactions,
  deleteTransaction,
  getMonthlyTrend,
  getCategorySpending,
  getSubcategorySpending,
  getRecentTransactions,
} from "@/server/services/transaction-service";
import {
  createCustomCategory,
  renameCategory,
  archiveCategory,
  unarchiveCategory,
  getWorkspaceCategoriesWithSubcategories,
} from "@/server/services/category-service";
import {
  createBudget,
  updateBudgetAmount,
  deleteBudget,
  getWorkspaceBudgets,
} from "@/server/services/budget-service";
import { getMonthComparison, getInsights } from "@/server/services/analytics-service";
import {
  createTransactionSchema,
  updateTransactionSchema,
  createTransactionsBulkSchema,
  bulkRecategorizeSchema,
  deleteTransactionSchema,
} from "@/lib/validations/transaction";
import { createCategorySchema, renameCategorySchema, archiveCategorySchema } from "@/lib/validations/category";
import { createBudgetSchema, updateBudgetSchema, deleteBudgetSchema } from "@/lib/validations/budget";

export type AiToolKind = "read" | "write";

/** Which dashboard page the user should land on after a write is confirmed. */
export type AiToolTarget = "transactions" | "categories" | "budgets";

export type ToolContext = { workspaceId: string; userId: string; currency: string };

export type AiToolSpec = {
  name: string;
  kind: AiToolKind;
  requiredPermission: Permission | null;
  description: string;
  zodSchema: z.ZodTypeAny;
  target?: AiToolTarget; // write tools only
  execute: (ctx: ToolContext, args: Record<string, unknown>) => Promise<unknown>;
  summarize: (args: Record<string, unknown>, result: unknown) => string;
};

const monthYearSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

// workspaceId is always bound from the authenticated request context, never
// taken from model output — every schema below omits it from what the model
// is asked to supply.
const createTransactionArgsSchema = createTransactionSchema.omit({ workspaceId: true });
const updateTransactionArgsSchema = updateTransactionSchema.omit({ workspaceId: true });
const createTransactionsBulkArgsSchema = createTransactionsBulkSchema.omit({ workspaceId: true });
const bulkRecategorizeArgsSchema = bulkRecategorizeSchema.omit({ workspaceId: true });
const deleteTransactionArgsSchema = deleteTransactionSchema.omit({ workspaceId: true });
const createCategoryArgsSchema = createCategorySchema.omit({ workspaceId: true });
const renameCategoryArgsSchema = renameCategorySchema.omit({ workspaceId: true });
const archiveCategoryArgsSchema = archiveCategorySchema.omit({ workspaceId: true });
const createBudgetArgsSchema = createBudgetSchema.omit({ workspaceId: true });
const updateBudgetArgsSchema = updateBudgetSchema.omit({ workspaceId: true });
const deleteBudgetArgsSchema = deleteBudgetSchema.omit({ workspaceId: true });

export const AI_TOOLS: AiToolSpec[] = [
  {
    name: "create_transaction",
    kind: "write",
    requiredPermission: PERMISSIONS.TRANSACTION_CREATE,
    target: "transactions",
    description: "Create a single income, expense, or savings transaction. The date field must be an ISO 8601 date string, e.g. \"2026-09-04\".",
    zodSchema: createTransactionArgsSchema,
    execute: (ctx, args) => {
      const a = createTransactionArgsSchema.parse(args);
      return createTransaction(ctx.workspaceId, ctx.userId, a);
    },
    summarize: (args) => {
      const a = createTransactionArgsSchema.parse(args);
      return `Create ${a.type.toLowerCase()} of ${a.amount} in category ${a.categoryId} on ${new Date(a.date).toDateString()}${a.description ? ` — "${a.description}"` : ""}`;
    },
  },
  {
    name: "create_transactions_bulk",
    kind: "write",
    requiredPermission: PERMISSIONS.TRANSACTION_CREATE,
    target: "transactions",
    description: "Create multiple transactions at once (up to 50 rows). Each row's date field must be an ISO 8601 date string, e.g. \"2026-09-04\".",
    zodSchema: createTransactionsBulkArgsSchema,
    execute: (ctx, args) => {
      const a = createTransactionsBulkArgsSchema.parse(args);
      return createTransactionsBulk(ctx.workspaceId, ctx.userId, a.rows);
    },
    summarize: (args) => {
      const a = createTransactionsBulkArgsSchema.parse(args);
      return `Create ${a.rows.length} transactions`;
    },
  },
  {
    name: "update_transaction",
    kind: "write",
    requiredPermission: PERMISSIONS.TRANSACTION_UPDATE,
    target: "transactions",
    description: "Update an existing transaction's amount, category, date, or other details. The date field must be an ISO 8601 date string, e.g. \"2026-09-04\".",
    zodSchema: updateTransactionArgsSchema,
    execute: (ctx, args) => {
      const a = updateTransactionArgsSchema.parse(args);
      return updateTransaction(ctx.workspaceId, a.transactionId, a);
    },
    summarize: (args) => {
      const a = updateTransactionArgsSchema.parse(args);
      return `Update transaction ${a.transactionId} to ${a.amount} in category ${a.categoryId}`;
    },
  },
  {
    name: "bulk_recategorize_transactions",
    kind: "write",
    requiredPermission: PERMISSIONS.TRANSACTION_UPDATE,
    target: "transactions",
    description: "Move multiple transactions into a different category at once.",
    zodSchema: bulkRecategorizeArgsSchema,
    execute: (ctx, args) => {
      const a = bulkRecategorizeArgsSchema.parse(args);
      return bulkRecategorizeTransactions(ctx.workspaceId, a.transactionIds, a.categoryId);
    },
    summarize: (args) => {
      const a = bulkRecategorizeArgsSchema.parse(args);
      return `Move ${a.transactionIds.length} transactions to category ${a.categoryId}`;
    },
  },
  {
    name: "delete_transaction",
    kind: "write",
    requiredPermission: PERMISSIONS.TRANSACTION_DELETE,
    target: "transactions",
    description: "Delete a transaction permanently.",
    zodSchema: deleteTransactionArgsSchema,
    execute: (ctx, args) => {
      const a = deleteTransactionArgsSchema.parse(args);
      return deleteTransaction(ctx.workspaceId, a.transactionId);
    },
    summarize: (args) => {
      const a = deleteTransactionArgsSchema.parse(args);
      return `Delete transaction ${a.transactionId}`;
    },
  },

  // Categories have no dedicated permission today — human category actions
  // only call requireWorkspaceMembership, not requirePermission. Mirrored
  // honestly here with requiredPermission: null so the AI gets exactly the
  // same access a human has, not less and not more.
  {
    name: "create_category",
    kind: "write",
    requiredPermission: null,
    target: "categories",
    description: "Create a new custom category or subcategory (expense, income, or savings).",
    zodSchema: createCategoryArgsSchema,
    execute: (ctx, args) => {
      const a = createCategoryArgsSchema.parse(args);
      return createCustomCategory(ctx.workspaceId, ctx.userId, a);
    },
    summarize: (args) => {
      const a = createCategoryArgsSchema.parse(args);
      return `Create ${a.type.toLowerCase()} category "${a.name}"${a.parentId ? ` under ${a.parentId}` : ""}`;
    },
  },
  {
    name: "rename_category",
    kind: "write",
    requiredPermission: null,
    target: "categories",
    description: "Rename an existing category.",
    zodSchema: renameCategoryArgsSchema,
    execute: (ctx, args) => {
      const a = renameCategoryArgsSchema.parse(args);
      return renameCategory(ctx.workspaceId, a.categoryId, a.name);
    },
    summarize: (args) => {
      const a = renameCategoryArgsSchema.parse(args);
      return `Rename category ${a.categoryId} to "${a.name}"`;
    },
  },
  {
    name: "archive_category",
    kind: "write",
    requiredPermission: null,
    target: "categories",
    description: "Archive a category so it no longer appears when adding new transactions.",
    zodSchema: archiveCategoryArgsSchema,
    execute: (ctx, args) => {
      const a = archiveCategoryArgsSchema.parse(args);
      return archiveCategory(ctx.workspaceId, a.categoryId);
    },
    summarize: (args) => {
      const a = archiveCategoryArgsSchema.parse(args);
      return `Archive category ${a.categoryId}`;
    },
  },
  {
    name: "unarchive_category",
    kind: "write",
    requiredPermission: null,
    target: "categories",
    description: "Restore a previously archived category.",
    zodSchema: archiveCategoryArgsSchema,
    execute: (ctx, args) => {
      const a = archiveCategoryArgsSchema.parse(args);
      return unarchiveCategory(ctx.workspaceId, a.categoryId);
    },
    summarize: (args) => {
      const a = archiveCategoryArgsSchema.parse(args);
      return `Restore category ${a.categoryId}`;
    },
  },

  {
    name: "create_budget",
    kind: "write",
    requiredPermission: PERMISSIONS.BUDGET_CREATE,
    target: "budgets",
    description: "Create a monthly spending budget for an expense category.",
    zodSchema: createBudgetArgsSchema,
    execute: (ctx, args) => {
      const a = createBudgetArgsSchema.parse(args);
      return createBudget(ctx.workspaceId, a);
    },
    summarize: (args) => {
      const a = createBudgetArgsSchema.parse(args);
      return `Create budget of ${a.amount} for category ${a.categoryId} (${a.month}/${a.year})`;
    },
  },
  {
    name: "update_budget",
    kind: "write",
    requiredPermission: PERMISSIONS.BUDGET_UPDATE,
    target: "budgets",
    description: "Change the amount of an existing budget.",
    zodSchema: updateBudgetArgsSchema,
    execute: (ctx, args) => {
      const a = updateBudgetArgsSchema.parse(args);
      return updateBudgetAmount(ctx.workspaceId, a.budgetId, a.amount);
    },
    summarize: (args) => {
      const a = updateBudgetArgsSchema.parse(args);
      return `Update budget ${a.budgetId} to ${a.amount}`;
    },
  },
  {
    name: "delete_budget",
    kind: "write",
    requiredPermission: PERMISSIONS.BUDGET_DELETE,
    target: "budgets",
    description: "Delete a budget.",
    zodSchema: deleteBudgetArgsSchema,
    execute: (ctx, args) => {
      const a = deleteBudgetArgsSchema.parse(args);
      return deleteBudget(ctx.workspaceId, a.budgetId);
    },
    summarize: (args) => {
      const a = deleteBudgetArgsSchema.parse(args);
      return `Delete budget ${a.budgetId}`;
    },
  },

  // Read-only tools — executed immediately, never proposed.
  {
    name: "get_spending_summary",
    kind: "read",
    requiredPermission: PERMISSIONS.ANALYTICS_VIEW,
    description: "Get income, expenses, savings, and balance for a month, compared to the previous month.",
    zodSchema: monthYearSchema,
    execute: (ctx, args) => {
      const a = monthYearSchema.parse(args);
      return getMonthComparison(ctx.workspaceId, a.month, a.year);
    },
    summarize: () => "Fetched spending summary",
  },
  {
    name: "get_insights",
    kind: "read",
    requiredPermission: PERMISSIONS.ANALYTICS_VIEW,
    description: "Get rule-based spending insights for a month (e.g. category changes, budget usage warnings).",
    zodSchema: monthYearSchema,
    execute: (ctx, args) => {
      const a = monthYearSchema.parse(args);
      return getInsights(ctx.workspaceId, a.month, a.year, ctx.currency);
    },
    summarize: () => "Fetched insights",
  },
  {
    name: "get_category_breakdown",
    kind: "read",
    requiredPermission: PERMISSIONS.ANALYTICS_VIEW,
    description: "Get spending broken down by top-level category for a month.",
    zodSchema: monthYearSchema,
    execute: (ctx, args) => {
      const a = monthYearSchema.parse(args);
      return getCategorySpending(ctx.workspaceId, a.month, a.year);
    },
    summarize: () => "Fetched category breakdown",
  },
  {
    name: "get_subcategory_breakdown",
    kind: "read",
    requiredPermission: PERMISSIONS.ANALYTICS_VIEW,
    description: "Get spending broken down by subcategory for one parent category, for a month.",
    zodSchema: monthYearSchema.extend({ parentCategoryId: z.string().min(1) }),
    execute: (ctx, args) => {
      const a = monthYearSchema.extend({ parentCategoryId: z.string().min(1) }).parse(args);
      return getSubcategorySpending(ctx.workspaceId, a.parentCategoryId, a.month, a.year);
    },
    summarize: () => "Fetched subcategory breakdown",
  },
  {
    name: "get_monthly_trend",
    kind: "read",
    requiredPermission: PERMISSIONS.ANALYTICS_VIEW,
    description: "Get income/expense/savings totals for the last several months, for trend questions.",
    zodSchema: monthYearSchema,
    execute: (ctx, args) => {
      const a = monthYearSchema.parse(args);
      return getMonthlyTrend(ctx.workspaceId, a.month, a.year);
    },
    summarize: () => "Fetched monthly trend",
  },
  {
    name: "get_recent_transactions",
    kind: "read",
    requiredPermission: PERMISSIONS.TRANSACTION_VIEW,
    description: "Get the most recent transactions in the workspace.",
    zodSchema: z.object({ limit: z.coerce.number().int().min(1).max(25).optional() }),
    execute: (ctx, args) => {
      const a = z.object({ limit: z.coerce.number().int().min(1).max(25).optional() }).parse(args);
      return getRecentTransactions(ctx.workspaceId, a.limit);
    },
    summarize: () => "Fetched recent transactions",
  },
  {
    name: "get_workspace_categories",
    kind: "read",
    requiredPermission: PERMISSIONS.DASHBOARD_VIEW,
    description: "List the workspace's categories and subcategories, optionally filtered by type (EXPENSE, INCOME, or SAVINGS).",
    zodSchema: z.object({ type: z.enum(["EXPENSE", "INCOME", "SAVINGS"]).optional() }),
    execute: (ctx, args) => {
      const a = z.object({ type: z.enum(["EXPENSE", "INCOME", "SAVINGS"]).optional() }).parse(args);
      return getWorkspaceCategoriesWithSubcategories(ctx.workspaceId, a.type);
    },
    summarize: () => "Fetched categories",
  },
  {
    name: "get_budgets",
    kind: "read",
    requiredPermission: PERMISSIONS.BUDGET_VIEW,
    description: "List budgets and their current spend for a month.",
    zodSchema: monthYearSchema,
    execute: (ctx, args) => {
      const a = monthYearSchema.parse(args);
      return getWorkspaceBudgets(ctx.workspaceId, a.month, a.year);
    },
    summarize: () => "Fetched budgets",
  },
];

export function findTool(name: string): AiToolSpec | undefined {
  return AI_TOOLS.find((tool) => tool.name === name);
}
