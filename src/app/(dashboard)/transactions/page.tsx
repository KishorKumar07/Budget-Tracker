import { redirect } from "next/navigation";
import { Receipt } from "lucide-react";
import { requireAuth } from "@/lib/auth/guards";
import { getActiveWorkspace } from "@/lib/workspace/current-workspace";
import { getUserCurrency } from "@/server/services/user-service";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { getWorkspaceTransactions } from "@/server/services/transaction-service";
import {
  getWorkspaceCategories,
  getWorkspaceCategoriesWithSubcategories,
  getFrequentlyUsedCategories,
} from "@/server/services/category-service";
import { getWorkspaceMemberCount } from "@/server/services/workspace-service";
import { getCategoryGroup } from "@/lib/categories/default-categories";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { BulkAddDialog } from "@/components/transactions/bulk-add-dialog";
import { TransactionsClient } from "./transactions-client";
import type { TransactionType } from "@/generated/prisma/client";

export default async function TransactionsPage({
  searchParams,
}: PageProps<"/transactions">) {
  const { user } = await requireAuth();
  const active = await getActiveWorkspace();
  if (!active) redirect("/onboarding/workspace");

  const permissions = active.membership.permissions;
  if (!permissions.includes(PERMISSIONS.TRANSACTION_VIEW)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const type = typeof params.type === "string" && params.type ? (params.type as TransactionType) : undefined;
  const categoryId = typeof params.categoryId === "string" && params.categoryId ? params.categoryId : undefined;
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;

  const [
    currency,
    { transactions, total, pageSize },
    categories,
    expenseCategoriesWithSubs,
    incomeCategoriesWithSubs,
    savingsCategoriesWithSubs,
    frequentExpense,
    frequentIncome,
    frequentSavings,
    memberCount,
  ] = await Promise.all([
    getUserCurrency(user.id),
    getWorkspaceTransactions(active.workspace.id, { search, type, categoryId }, page),
    getWorkspaceCategories(active.workspace.id),
    getWorkspaceCategoriesWithSubcategories(active.workspace.id, "EXPENSE"),
    getWorkspaceCategoriesWithSubcategories(active.workspace.id, "INCOME"),
    getWorkspaceCategoriesWithSubcategories(active.workspace.id, "SAVINGS"),
    getFrequentlyUsedCategories(active.workspace.id, "EXPENSE"),
    getFrequentlyUsedCategories(active.workspace.id, "INCOME"),
    getFrequentlyUsedCategories(active.workspace.id, "SAVINGS"),
    getWorkspaceMemberCount(active.workspace.id),
  ]);

  const canUpdate = permissions.includes(PERMISSIONS.TRANSACTION_UPDATE);
  const canDelete = permissions.includes(PERMISSIONS.TRANSACTION_DELETE);

  const serializedTransactions = transactions.map((t) => ({
    id: t.id,
    amount: t.amount.toString(),
    type: t.type,
    description: t.description,
    date: t.date.toISOString(),
    paymentMethod: t.paymentMethod,
    category: {
      id: t.category.id,
      name: t.category.name,
      icon: t.category.icon,
      color: t.category.color,
    },
    createdBy: {
      id: t.createdBy.id,
      name: t.createdBy.name,
    },
  }));

  const toSelectable = (c: (typeof categories)[number]) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    group: getCategoryGroup(c.name, c.isDefault),
  });

  const toSelectableWithSubs = (c: (typeof expenseCategoriesWithSubs)[number]) => ({
    ...toSelectable(c),
    subcategories: c.subcategories.map(toSelectable),
  });

  const canCreate = permissions.includes(PERMISSIONS.TRANSACTION_CREATE);
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE").map(toSelectable);
  const incomeCategories = categories.filter((c) => c.type === "INCOME").map(toSelectable);
  const savingsCategories = categories.filter((c) => c.type === "SAVINGS").map(toSelectable);
  const expenseCategoriesForEdit = expenseCategoriesWithSubs.map(toSelectableWithSubs);
  const incomeCategoriesForEdit = incomeCategoriesWithSubs.map(toSelectableWithSubs);
  const savingsCategoriesForEdit = savingsCategoriesWithSubs.map(toSelectableWithSubs);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Transactions"
        action={
          canCreate ? (
            <BulkAddDialog
              workspaceId={active.workspace.id}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              savingsCategories={savingsCategories}
            />
          ) : undefined
        }
      />
      <TransactionFilters categories={categories} />

      <div className="flex-1 px-4 pb-6 md:px-8">
        {serializedTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Your spending story starts here"
            description="Add your first transaction to start understanding where your money goes."
          />
        ) : (
          <TransactionsClient
            workspaceId={active.workspace.id}
            transactions={serializedTransactions}
            currency={currency}
            canUpdate={canUpdate}
            canDelete={canDelete}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            savingsCategories={savingsCategories}
            expenseCategoriesForEdit={expenseCategoriesForEdit}
            incomeCategoriesForEdit={incomeCategoriesForEdit}
            savingsCategoriesForEdit={savingsCategoriesForEdit}
            frequentlyUsedExpense={frequentExpense.map(toSelectable)}
            frequentlyUsedIncome={frequentIncome.map(toSelectable)}
            frequentlyUsedSavings={frequentSavings.map(toSelectable)}
            showCreatedBy={memberCount > 1}
            total={total}
            pageSize={pageSize}
            page={page}
          />
        )}
      </div>
    </div>
  );
}
