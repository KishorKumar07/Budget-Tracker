import { z } from "zod";

export const chatRequestSchema = z.object({
  workspaceId: z.string().min(1),
  message: z.string().trim().min(1).max(2000),
});

export const confirmRequestSchema = z.object({
  workspaceId: z.string().min(1),
  conversationId: z.string().min(1),
  proposalId: z.string().min(1),
});

export const saveApiKeySchema = z.object({
  provider: z.enum(["GEMINI", "GROK"]),
  apiKey: z.string().trim().min(1, "Enter an API key."),
  label: z.string().trim().max(60).optional(),
});

export const deleteApiKeySchema = z.object({
  provider: z.enum(["GEMINI", "GROK"]),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type ConfirmRequestInput = z.infer<typeof confirmRequestSchema>;
export type SaveApiKeyInput = z.infer<typeof saveApiKeySchema>;
