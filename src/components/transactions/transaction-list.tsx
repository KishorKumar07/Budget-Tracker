"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteTransactionAction } from "@/app/(dashboard)/transactions/actions";
import { cn } from "@/lib/utils";

export type TransactionRow = {
  id: string;
  amount: string;
  type: "INCOME" | "EXPENSE" | "SAVINGS";
  description: string | null;
  date: string;
  paymentMethod: string;
  category: { id: string; name: string; icon: string; color: string };
  createdBy: { id: string; name: string };
};

const TYPE_BADGE_CLASSES: Record<TransactionRow["type"], string> = {
  INCOME: "bg-success/10 text-success",
  EXPENSE: "bg-muted text-muted-foreground",
  SAVINGS: "bg-sky-500/10 text-sky-500",
};

const TYPE_LABELS: Record<TransactionRow["type"], string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
  SAVINGS: "Savings",
};

export function TransactionList({
  workspaceId,
  transactions,
  currency,
  canUpdate,
  canDelete,
  showCreatedBy,
  selectedIds,
  onToggleSelect,
  onEdit,
}: {
  workspaceId: string;
  transactions: TransactionRow[];
  currency: string;
  canUpdate: boolean;
  canDelete: boolean;
  showCreatedBy: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (transaction: TransactionRow) => void;
  onEdit: (transaction: TransactionRow) => void;
}) {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });

  const showCheckboxColumn = canUpdate && !!onToggleSelect;
  const showActionsColumn = canUpdate || canDelete;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
            {showCheckboxColumn && <th className="w-10 px-4 py-2.5" />}
            <th className="px-3 py-2.5">Description</th>
            <th className="px-3 py-2.5">Category</th>
            <th className="px-3 py-2.5">Type</th>
            <th className="px-3 py-2.5">Date</th>
            {showCreatedBy && <th className="px-3 py-2.5">Added by</th>}
            <th className="px-3 py-2.5 text-right">Amount</th>
            {showActionsColumn && <th className="w-20 px-3 py-2.5" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.map((t) => (
            <TransactionTableRow
              key={t.id}
              workspaceId={workspaceId}
              transaction={t}
              formatter={formatter}
              canUpdate={canUpdate}
              canDelete={canDelete}
              showCreatedBy={showCreatedBy}
              showCheckboxColumn={showCheckboxColumn}
              showActionsColumn={showActionsColumn}
              selected={selectedIds?.has(t.id) ?? false}
              onToggleSelect={onToggleSelect}
              onEdit={onEdit}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransactionTableRow({
  workspaceId,
  transaction: t,
  formatter,
  canUpdate,
  canDelete,
  showCreatedBy,
  showCheckboxColumn,
  showActionsColumn,
  selected,
  onToggleSelect,
  onEdit,
}: {
  workspaceId: string;
  transaction: TransactionRow;
  formatter: Intl.NumberFormat;
  canUpdate: boolean;
  canDelete: boolean;
  showCreatedBy: boolean;
  showCheckboxColumn: boolean;
  showActionsColumn: boolean;
  selected: boolean;
  onToggleSelect?: (transaction: TransactionRow) => void;
  onEdit: (transaction: TransactionRow) => void;
}) {
  const [isPending, setIsPending] = useState(false);

  return (
    <tr className={cn("transition-colors hover:bg-muted/40", selected && "bg-accent/50")}>
      {showCheckboxColumn && (
        <td className="px-4 py-2.5">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect?.(t)}
            aria-label={`Select ${t.description || t.category.name}`}
          />
        </td>
      )}

      <td className="max-w-[240px] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm"
            style={{ backgroundColor: `${t.category.color}20` }}
          >
            {t.category.icon}
          </span>
          <span className="truncate font-medium text-foreground">
            {t.description || t.category.name}
          </span>
        </div>
      </td>

      <td className="max-w-[160px] px-3 py-2.5">
        <span className="truncate text-muted-foreground">{t.category.name}</span>
      </td>

      <td className="px-3 py-2.5">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            TYPE_BADGE_CLASSES[t.type]
          )}
        >
          {TYPE_LABELS[t.type]}
        </span>
      </td>

      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
        {format(new Date(t.date), "MMM d, yyyy")}
      </td>

      {showCreatedBy && (
        <td className="max-w-[140px] px-3 py-2.5">
          <span className="truncate text-muted-foreground">{t.createdBy.name}</span>
        </td>
      )}

      <td className="px-3 py-2.5 text-right">
        <span
          className={cn(
            "font-semibold tabular-nums whitespace-nowrap",
            t.type === "INCOME" ? "text-success" : t.type === "SAVINGS" ? "text-sky-500" : "text-foreground"
          )}
        >
          {t.type === "INCOME" ? "+" : "-"}
          {formatter.format(Number(t.amount))}
        </span>
      </td>

      {showActionsColumn && (
        <td className="px-3 py-2.5">
          <div className="flex items-center justify-end gap-1">
            {canUpdate && (
              <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => onEdit(t)}>
                <Pencil className="size-3.5" />
              </Button>
            )}
            {canDelete && (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label="Delete" disabled={isPending}>
                    <Trash2 className="size-3.5" />
                  </Button>
                }
                title="Delete transaction?"
                description="This action cannot be undone."
                confirmLabel="Delete"
                onConfirm={async () => {
                  setIsPending(true);
                  await deleteTransactionAction(workspaceId, t.id);
                  toast.success("Transaction deleted.");
                  setIsPending(false);
                }}
              />
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
