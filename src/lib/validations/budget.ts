import { z } from "zod";

export const createBudgetSchema = z.object({
  workspaceId: z.string().min(1),
  categoryId: z.string().min(1, "Select a category."),
  amount: z.coerce.number().positive("Enter an amount greater than 0."),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const updateBudgetSchema = z.object({
  workspaceId: z.string().min(1),
  budgetId: z.string().min(1),
  amount: z.coerce.number().positive("Enter an amount greater than 0."),
});

export const deleteBudgetSchema = z.object({
  workspaceId: z.string().min(1),
  budgetId: z.string().min(1),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
