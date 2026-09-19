"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/permissions/constants";
import {
  createTransactionSchema,
  updateTransactionSchema,
  deleteTransactionSchema,
  bulkRecategorizeSchema,
  createTransactionsBulkSchema,
  type BulkRowInput,
} from "@/lib/validations/transaction";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkRecategorizeTransactions,
  createTransactionsBulk,
} from "@/server/services/transaction-service";
import { safeErrorMessage } from "@/lib/utils/safe-error-message";

export type ActionState = { error?: string; success?: boolean };

export async function createTransactionAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createTransactionSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") || undefined,
    date: formData.get("date"),
    paymentMethod: formData.get("paymentMethod") || "OTHER",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the transaction details." };
  }

  const { userId } = await requirePermission(parsed.data.workspaceId, PERMISSIONS.TRANSACTION_CREATE);

  try {
    await createTransaction(parsed.data.workspaceId, userId, {
      amount: parsed.data.amount,
      type: parsed.data.type,
      categoryId: parsed.data.categoryId,
      description: parsed.data.description,
      date: parsed.data.date,
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes,
    });
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTransactionAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateTransactionSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    transactionId: formData.get("transactionId"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") || undefined,
    date: formData.get("date"),
    paymentMethod: formData.get("paymentMethod") || "OTHER",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the transaction details." };
  }

  await requirePermission(parsed.data.workspaceId, PERMISSIONS.TRANSACTION_UPDATE);

  try {
    await updateTransaction(parsed.data.workspaceId, parsed.data.transactionId, {
      amount: parsed.data.amount,
      type: parsed.data.type,
      categoryId: parsed.data.categoryId,
      description: parsed.data.description,
      date: parsed.data.date,
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes,
    });
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTransactionAction(workspaceId: string, transactionId: string) {
  const parsed = deleteTransactionSchema.safeParse({ workspaceId, transactionId });
  if (!parsed.success) return;

  await requirePermission(parsed.data.workspaceId, PERMISSIONS.TRANSACTION_DELETE);
  await deleteTransaction(parsed.data.workspaceId, parsed.data.transactionId);

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export type BulkRecategorizeState = { error?: string; success?: boolean; movedCount?: number };

export async function bulkRecategorizeAction(
  workspaceId: string,
  transactionIds: string[],
  categoryId: string
): Promise<BulkRecategorizeState> {
  const parsed = bulkRecategorizeSchema.safeParse({ workspaceId, transactionIds, categoryId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid selection." };
  }

  await requirePermission(parsed.data.workspaceId, PERMISSIONS.TRANSACTION_UPDATE);

  let movedCount: number;
  try {
    movedCount = await bulkRecategorizeTransactions(
      parsed.data.workspaceId,
      parsed.data.transactionIds,
      parsed.data.categoryId
    );
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true, movedCount };
}

export type BulkCreateState = { error?: string; success?: boolean; createdCount?: number };

export async function createTransactionsBulkAction(
  workspaceId: string,
  rows: BulkRowInput[]
): Promise<BulkCreateState> {
  const parsed = createTransactionsBulkSchema.safeParse({ workspaceId, rows });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the transaction details." };
  }

  const { userId } = await requirePermission(parsed.data.workspaceId, PERMISSIONS.TRANSACTION_CREATE);

  let createdCount: number;
  try {
    createdCount = await createTransactionsBulk(parsed.data.workspaceId, userId, parsed.data.rows);
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true, createdCount };
}
