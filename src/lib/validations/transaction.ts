import { z } from "zod";

export const PAYMENT_METHODS = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "OTHER"] as const;

export const createTransactionSchema = z.object({
  workspaceId: z.string().min(1),
  amount: z.coerce.number().positive("Enter an amount greater than 0."),
  type: z.enum(["INCOME", "EXPENSE", "SAVINGS"]),
  categoryId: z.string().min(1, "Select a category."),
  description: z.string().trim().max(200).optional(),
  date: z.coerce.date(),
  paymentMethod: z.enum(PAYMENT_METHODS).default("OTHER"),
  notes: z.string().trim().max(1000).optional(),
});

export const updateTransactionSchema = createTransactionSchema.extend({
  transactionId: z.string().min(1),
});

export const deleteTransactionSchema = z.object({
  workspaceId: z.string().min(1),
  transactionId: z.string().min(1),
});

export const bulkRecategorizeSchema = z.object({
  workspaceId: z.string().min(1),
  transactionIds: z.array(z.string().min(1)).min(1, "Select at least one transaction."),
  categoryId: z.string().min(1, "Select a category."),
});

const bulkRowSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than 0."),
  type: z.enum(["INCOME", "EXPENSE", "SAVINGS"]),
  categoryId: z.string().min(1, "Select a category."),
  description: z.string().trim().max(200).optional(),
  date: z.coerce.date(),
  paymentMethod: z.enum(PAYMENT_METHODS).default("OTHER"),
});

export const createTransactionsBulkSchema = z.object({
  workspaceId: z.string().min(1),
  rows: z.array(bulkRowSchema).min(1, "Add at least one row.").max(50, "Add at most 50 rows at once."),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type BulkRowInput = z.infer<typeof bulkRowSchema>;
