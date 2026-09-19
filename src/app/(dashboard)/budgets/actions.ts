"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { createBudgetSchema, updateBudgetSchema, deleteBudgetSchema } from "@/lib/validations/budget";
import { createBudget, updateBudgetAmount, deleteBudget } from "@/server/services/budget-service";
import { safeErrorMessage } from "@/lib/utils/safe-error-message";

export type ActionState = { error?: string; success?: boolean };

export async function createBudgetAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createBudgetSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    month: formData.get("month"),
    year: formData.get("year"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the budget details." };
  }

  await requirePermission(parsed.data.workspaceId, PERMISSIONS.BUDGET_CREATE);

  try {
    await createBudget(parsed.data.workspaceId, {
      categoryId: parsed.data.categoryId,
      amount: parsed.data.amount,
      month: parsed.data.month,
      year: parsed.data.year,
    });
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateBudgetAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateBudgetSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    budgetId: formData.get("budgetId"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the budget details." };
  }

  await requirePermission(parsed.data.workspaceId, PERMISSIONS.BUDGET_UPDATE);

  try {
    await updateBudgetAmount(parsed.data.workspaceId, parsed.data.budgetId, parsed.data.amount);
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBudgetAction(workspaceId: string, budgetId: string) {
  const parsed = deleteBudgetSchema.safeParse({ workspaceId, budgetId });
  if (!parsed.success) return;

  await requirePermission(parsed.data.workspaceId, PERMISSIONS.BUDGET_DELETE);
  await deleteBudget(parsed.data.workspaceId, parsed.data.budgetId);

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}
