import "server-only";
import { prisma } from "@/lib/db/prisma";
import { ForbiddenError } from "@/lib/auth/errors";
import { KnownError } from "@/lib/utils/safe-error-message";
import type { CategoryType } from "@/generated/prisma/client";

export async function getWorkspaceCategories(workspaceId: string, type?: CategoryType) {
  return prisma.category.findMany({
    where: { workspaceId, isArchived: false, ...(type ? { type } : {}) },
    orderBy: { name: "asc" },
  });
}

/**
 * Top-level categories only, each with its active subcategories nested —
 * the shape the category picker needs for "choose category, then
 * subcategory if one exists" (subcategories are never selected directly
 * before their parent).
 */
export async function getWorkspaceCategoriesWithSubcategories(
  workspaceId: string,
  type?: CategoryType
) {
  return prisma.category.findMany({
    where: { workspaceId, isArchived: false, parentId: null, ...(type ? { type } : {}) },
    orderBy: { name: "asc" },
    include: {
      subcategories: {
        where: { isArchived: false },
        orderBy: { name: "asc" },
      },
    },
  });
}

/**
 * Top categories by how often they've been used in transactions, scoped to
 * this workspace. Pure frequency count — no AI, per product spec.
 */
export async function getFrequentlyUsedCategories(
  workspaceId: string,
  type: CategoryType,
  limit = 6
) {
  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { workspaceId, type, category: { isArchived: false } },
    _count: { categoryId: true },
    orderBy: { _count: { categoryId: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const categories = await prisma.category.findMany({
    where: { id: { in: grouped.map((g) => g.categoryId) } },
  });

  const byId = new Map(categories.map((c) => [c.id, c]));
  return grouped.map((g) => byId.get(g.categoryId)).filter((c) => c !== undefined);
}

export async function createCustomCategory(
  workspaceId: string,
  createdById: string,
  data: { name: string; type: CategoryType; icon: string; parentId?: string }
) {
  let parent = null;

  if (data.parentId) {
    parent = await prisma.category.findUnique({ where: { id: data.parentId } });

    if (!parent || parent.workspaceId !== workspaceId) {
      throw new ForbiddenError("This parent category does not belong to this workspace.");
    }
    if (parent.parentId) {
      throw new KnownError("Subcategories can only be one level deep — pick a top-level category as the parent.");
    }
    if (parent.type !== data.type) {
      throw new KnownError("A subcategory must be the same type (expense, income, or savings) as its parent category.");
    }
  }

  const DEFAULT_COLOR_BY_TYPE: Record<CategoryType, string> = {
    EXPENSE: "#94A3B8",
    INCOME: "#22C55E",
    SAVINGS: "#0EA5E9",
  };
  const color = parent?.color ?? DEFAULT_COLOR_BY_TYPE[data.type];

  return prisma.category.create({
    data: {
      workspaceId,
      createdById,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color,
      isDefault: false,
      parentId: data.parentId,
    },
  });
}

/**
 * Deletes a category only if it has no transactions. If it's in use,
 * callers should offer archiving instead (see archiveCategory) — this
 * throws so the UI can catch it and show that choice.
 */
export async function deleteCategory(workspaceId: string, categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!category || category.workspaceId !== workspaceId) {
    throw new ForbiddenError("This category does not belong to this workspace.");
  }

  const subcategoryCount = await prisma.category.count({ where: { parentId: categoryId } });
  if (subcategoryCount > 0) {
    throw new KnownError(
      `This category has ${subcategoryCount} subcategor${subcategoryCount === 1 ? "y" : "ies"}. Delete or move them first.`
    );
  }

  const transactionCount = await prisma.transaction.count({ where: { categoryId } });

  if (transactionCount > 0) {
    const error = new KnownError(
      `This category contains ${transactionCount} transaction${transactionCount === 1 ? "" : "s"}.`
    );
    (error as KnownError & { code: string }).code = "CATEGORY_IN_USE";
    throw error;
  }

  await prisma.category.delete({ where: { id: categoryId } });
}

export async function archiveCategory(workspaceId: string, categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!category || category.workspaceId !== workspaceId) {
    throw new ForbiddenError("This category does not belong to this workspace.");
  }

  // Archiving a top-level category takes its subcategories with it — a
  // subcategory isn't independently useful once its parent is hidden.
  await prisma.category.updateMany({
    where: { OR: [{ id: categoryId }, { parentId: categoryId }] },
    data: { isArchived: true },
  });
}

export async function unarchiveCategory(workspaceId: string, categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!category || category.workspaceId !== workspaceId) {
    throw new ForbiddenError("This category does not belong to this workspace.");
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { isArchived: false },
  });
}

export async function renameCategory(workspaceId: string, categoryId: string, name: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!category || category.workspaceId !== workspaceId) {
    throw new ForbiddenError("This category does not belong to this workspace.");
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: { name },
  });
}

/**
 * All categories in the workspace (active and archived), each annotated
 * with how many transactions use it — the management page needs this to
 * decide whether to offer delete vs. archive.
 */
export async function getAllWorkspaceCategoriesWithUsage(workspaceId: string) {
  const categories = await prisma.category.findMany({
    where: { workspaceId },
    orderBy: [{ isArchived: "asc" }, { name: "asc" }],
  });

  if (categories.length === 0) return [];

  const counts = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { workspaceId, categoryId: { in: categories.map((c) => c.id) } },
    _count: { categoryId: true },
  });
  const countById = new Map(counts.map((c) => [c.categoryId, c._count.categoryId]));

  return categories.map((c) => ({ ...c, transactionCount: countById.get(c.id) ?? 0 }));
}
