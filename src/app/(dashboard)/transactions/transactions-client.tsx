"use client";

import { useMemo, useState } from "react";
import { TransactionList, type TransactionRow } from "@/components/transactions/transaction-list";
import { EditTransactionSheet } from "@/components/transactions/edit-transaction-sheet";
import { BulkRecategorizeBar } from "@/components/transactions/bulk-recategorize-bar";
import type { SelectableCategory } from "@/components/categories/category-selector";
import { Pagination } from "@/components/layout/pagination";

export function TransactionsClient({
  workspaceId,
  transactions,
  currency,
  canUpdate,
  canDelete,
  expenseCategories,
  incomeCategories,
  savingsCategories,
  expenseCategoriesForEdit,
  incomeCategoriesForEdit,
  savingsCategoriesForEdit,
  frequentlyUsedExpense,
  frequentlyUsedIncome,
  frequentlyUsedSavings,
  showCreatedBy,
  total,
  pageSize,
  page,
}: {
  workspaceId: string;
  transactions: TransactionRow[];
  currency: string;
  canUpdate: boolean;
  canDelete: boolean;
  expenseCategories: SelectableCategory[];
  incomeCategories: SelectableCategory[];
  savingsCategories: SelectableCategory[];
  expenseCategoriesForEdit: SelectableCategory[];
  incomeCategoriesForEdit: SelectableCategory[];
  savingsCategoriesForEdit: SelectableCategory[];
  frequentlyUsedExpense: SelectableCategory[];
  frequentlyUsedIncome: SelectableCategory[];
  frequentlyUsedSavings: SelectableCategory[];
  showCreatedBy: boolean;
  total: number;
  pageSize: number;
  page: number;
}) {
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const selectedTransactions = useMemo(
    () => transactions.filter((t) => selected.has(t.id)),
    [transactions, selected]
  );

  // A bulk move targets one category, and categories are typed — so once
  // a selection includes a type, only same-type categories are offered.
  // If the selection spans multiple types, no valid target exists.
  const selectedTypes = new Set(selectedTransactions.map((t) => t.type));
  const CATEGORIES_BY_TYPE = {
    EXPENSE: expenseCategories,
    INCOME: incomeCategories,
    SAVINGS: savingsCategories,
  } as const;
  const bulkTargetCategories =
    selectedTypes.size === 1 ? CATEGORIES_BY_TYPE[[...selectedTypes][0]] : [];

  const toggleSelect = (transaction: TransactionRow) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(transaction.id)) next.delete(transaction.id);
      else next.add(transaction.id);
      return next;
    });
  };

  return (
    <>
      <BulkRecategorizeBar
        workspaceId={workspaceId}
        selectedIds={Array.from(selected)}
        categories={bulkTargetCategories}
        onDone={() => setSelected(new Set())}
      />

      <TransactionList
        workspaceId={workspaceId}
        transactions={transactions}
        currency={currency}
        canUpdate={canUpdate}
        canDelete={canDelete}
        showCreatedBy={showCreatedBy}
        selectedIds={selected}
        onToggleSelect={toggleSelect}
        onEdit={setEditing}
      />

      <Pagination total={total} pageSize={pageSize} page={page} />

      <EditTransactionSheet
        workspaceId={workspaceId}
        transaction={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        expenseCategories={expenseCategoriesForEdit}
        incomeCategories={incomeCategoriesForEdit}
        savingsCategories={savingsCategoriesForEdit}
        frequentlyUsedExpense={frequentlyUsedExpense}
        frequentlyUsedIncome={frequentlyUsedIncome}
        frequentlyUsedSavings={frequentlyUsedSavings}
      />
    </>
  );
}
