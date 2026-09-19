import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required.")
    .max(60, "Keep the workspace name under 60 characters."),
});

export const updateWorkspaceSchema = z.object({
  workspaceId: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required.")
    .max(60, "Keep the workspace name under 60 characters."),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
