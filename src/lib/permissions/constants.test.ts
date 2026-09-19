import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  ALL_PERMISSIONS,
  DEFAULT_MEMBER_PERMISSIONS,
  PERMISSION_PRESETS,
} from "./constants";

describe("ALL_PERMISSIONS", () => {
  it("contains every permission defined in PERMISSIONS", () => {
    expect(ALL_PERMISSIONS).toEqual(expect.arrayContaining(Object.values(PERMISSIONS)));
    expect(ALL_PERMISSIONS).toHaveLength(Object.values(PERMISSIONS).length);
  });

  it("has no duplicate entries", () => {
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
  });
});

describe("DEFAULT_MEMBER_PERMISSIONS", () => {
  it("is a view-only baseline", () => {
    expect(DEFAULT_MEMBER_PERMISSIONS).toContain(PERMISSIONS.DASHBOARD_VIEW);
    expect(DEFAULT_MEMBER_PERMISSIONS).toContain(PERMISSIONS.TRANSACTION_VIEW);
    expect(DEFAULT_MEMBER_PERMISSIONS).not.toContain(PERMISSIONS.TRANSACTION_DELETE);
    expect(DEFAULT_MEMBER_PERMISSIONS).not.toContain(PERMISSIONS.WORKSPACE_DELETE);
  });
});

describe("PERMISSION_PRESETS", () => {
  it("FULL_ACCESS grants every permission", () => {
    expect(PERMISSION_PRESETS.FULL_ACCESS.permissions).toEqual(ALL_PERMISSIONS);
  });

  it("VIEW_ONLY never includes a create/update/delete permission", () => {
    const mutating = PERMISSION_PRESETS.VIEW_ONLY.permissions.filter((p) =>
      /\.(create|update|delete)$/.test(p)
    );
    expect(mutating).toHaveLength(0);
  });

  it("TRANSACTION_ACCESS grants transaction create/update but not delete", () => {
    expect(PERMISSION_PRESETS.TRANSACTION_ACCESS.permissions).toContain(
      PERMISSIONS.TRANSACTION_CREATE
    );
    expect(PERMISSION_PRESETS.TRANSACTION_ACCESS.permissions).toContain(
      PERMISSIONS.TRANSACTION_UPDATE
    );
    expect(PERMISSION_PRESETS.TRANSACTION_ACCESS.permissions).not.toContain(
      PERMISSIONS.TRANSACTION_DELETE
    );
  });

  it("every preset's permissions are a subset of ALL_PERMISSIONS", () => {
    for (const preset of Object.values(PERMISSION_PRESETS)) {
      for (const permission of preset.permissions) {
        expect(ALL_PERMISSIONS).toContain(permission);
      }
    }
  });
});
