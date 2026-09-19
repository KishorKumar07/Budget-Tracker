export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",

  TRANSACTION_VIEW: "transaction.view",
  TRANSACTION_CREATE: "transaction.create",
  TRANSACTION_UPDATE: "transaction.update",
  TRANSACTION_DELETE: "transaction.delete",

  BUDGET_VIEW: "budget.view",
  BUDGET_CREATE: "budget.create",
  BUDGET_UPDATE: "budget.update",
  BUDGET_DELETE: "budget.delete",

  ANALYTICS_VIEW: "analytics.view",

  AI_USE: "ai.use",

  MEMBER_VIEW: "member.view",
  MEMBER_INVITE: "member.invite",
  MEMBER_UPDATE_PERMISSIONS: "member.update_permissions",
  MEMBER_REMOVE: "member.remove",

  WORKSPACE_VIEW: "workspace.view",
  WORKSPACE_UPDATE: "workspace.update",
  WORKSPACE_DELETE: "workspace.delete",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

// Granted to every new workspace member by default (view-only baseline).
// Presets below build on top of this, and the creator gets ALL_PERMISSIONS.
// AI_USE is included at every level (including VIEW_ONLY) — the chat
// surface itself is always available to every member; what the assistant
// can actually DO for them is still bounded by whichever other
// permissions they hold, enforced per-tool in the AI service layer.
export const DEFAULT_MEMBER_PERMISSIONS: Permission[] = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.TRANSACTION_VIEW,
  PERMISSIONS.AI_USE,
];

export const PERMISSION_PRESETS: Record<string, { label: string; permissions: Permission[] }> = {
  VIEW_ONLY: {
    label: "View Only",
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.TRANSACTION_VIEW,
      PERMISSIONS.BUDGET_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.AI_USE,
    ],
  },
  TRANSACTION_ACCESS: {
    label: "Transaction Access",
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.TRANSACTION_VIEW,
      PERMISSIONS.TRANSACTION_CREATE,
      PERMISSIONS.TRANSACTION_UPDATE,
      PERMISSIONS.BUDGET_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.AI_USE,
    ],
  },
  FULL_ACCESS: {
    label: "Full Access",
    permissions: ALL_PERMISSIONS,
  },
};
