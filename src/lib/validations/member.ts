import { z } from "zod";
import { ALL_PERMISSIONS } from "@/lib/permissions/constants";

const permissionEnum = z.enum(ALL_PERMISSIONS as [string, ...string[]]);

export const inviteMemberSchema = z.object({
  workspaceId: z.string().min(1),
  email: z.string().email("Enter a valid email address."),
  permissions: z.array(permissionEnum).min(1, "Select at least one permission."),
});

export const updateMemberPermissionsSchema = z.object({
  workspaceId: z.string().min(1),
  memberUserId: z.string().min(1),
  permissions: z.array(permissionEnum),
});

export const removeMemberSchema = z.object({
  workspaceId: z.string().min(1),
  memberUserId: z.string().min(1),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberPermissionsInput = z.infer<typeof updateMemberPermissionsSchema>;
