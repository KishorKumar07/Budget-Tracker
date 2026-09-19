import { z } from "zod";

export const createCategorySchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().trim().min(1, "Category name is required.").max(40, "Keep it under 40 characters."),
  type: z.enum(["EXPENSE", "INCOME", "SAVINGS"]),
  icon: z.string().trim().min(1, "Pick an icon."),
  parentId: z.string().min(1).optional(),
});

export const archiveCategorySchema = z.object({
  workspaceId: z.string().min(1),
  categoryId: z.string().min(1),
});

export const renameCategorySchema = z.object({
  workspaceId: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().trim().min(1, "Category name is required.").max(40, "Keep it under 40 characters."),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
