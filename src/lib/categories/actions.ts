"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceMembership } from "@/lib/auth/guards";
import { createCategorySchema, archiveCategorySchema, renameCategorySchema } from "@/lib/validations/category";
import {
  createCustomCategory,
  deleteCategory,
  archiveCategory,
  unarchiveCategory,
  renameCategory,
} from "@/server/services/category-service";
import { safeErrorMessage } from "@/lib/utils/safe-error-message";

export type ActionState = { error?: string; success?: boolean; categoryId?: string };

export async function createCategoryAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createCategorySchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    type: formData.get("type"),
    icon: formData.get("icon"),
    parentId: formData.get("parentId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { userId } = await requireWorkspaceMembership(parsed.data.workspaceId);

  try {
    const category = await createCustomCategory(parsed.data.workspaceId, userId, {
      name: parsed.data.name,
      type: parsed.data.type,
      icon: parsed.data.icon,
      parentId: parsed.data.parentId,
    });

    revalidatePath("/transactions");
    revalidatePath("/settings/categories");
    return { success: true, categoryId: category.id };
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }
}

export type DeleteCategoryState = { error?: string; inUseCount?: number; success?: boolean };

export async function deleteCategoryAction(
  workspaceId: string,
  categoryId: string
): Promise<DeleteCategoryState> {
  const parsed = archiveCategorySchema.safeParse({ workspaceId, categoryId });
  if (!parsed.success) return { error: "Invalid request." };

  await requireWorkspaceMembership(parsed.data.workspaceId);

  try {
    await deleteCategory(parsed.data.workspaceId, parsed.data.categoryId);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "CATEGORY_IN_USE" && error instanceof Error) {
      const match = error.message.match(/(\d+) transaction/);
      return { error: error.message, inUseCount: match ? Number(match[1]) : undefined };
    }
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/transactions");
  revalidatePath("/settings/categories");
  return { success: true };
}

export async function archiveCategoryAction(workspaceId: string, categoryId: string) {
  const parsed = archiveCategorySchema.safeParse({ workspaceId, categoryId });
  if (!parsed.success) return;

  await requireWorkspaceMembership(parsed.data.workspaceId);
  await archiveCategory(parsed.data.workspaceId, parsed.data.categoryId);

  revalidatePath("/transactions");
  revalidatePath("/settings/categories");
}

export async function unarchiveCategoryAction(workspaceId: string, categoryId: string) {
  const parsed = archiveCategorySchema.safeParse({ workspaceId, categoryId });
  if (!parsed.success) return;

  await requireWorkspaceMembership(parsed.data.workspaceId);
  await unarchiveCategory(parsed.data.workspaceId, parsed.data.categoryId);

  revalidatePath("/transactions");
  revalidatePath("/settings/categories");
}

export type RenameCategoryState = { error?: string; success?: boolean };

export async function renameCategoryAction(
  _prevState: RenameCategoryState,
  formData: FormData
): Promise<RenameCategoryState> {
  const parsed = renameCategorySchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await requireWorkspaceMembership(parsed.data.workspaceId);

  try {
    await renameCategory(parsed.data.workspaceId, parsed.data.categoryId, parsed.data.name);
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/transactions");
  revalidatePath("/settings/categories");
  return { success: true };
}
