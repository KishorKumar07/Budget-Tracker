import { describe, it, expect } from "vitest";
import {
  calculateBalance,
  calculateSavingsRate,
  calculateBudgetUsage,
  calculateRemainingBudget,
  getBudgetStatus,
  calculateMonthOverMonthChange,
} from "./finance";

describe("calculateBalance", () => {
  it("subtracts expenses from income", () => {
    expect(calculateBalance(65000, 38450)).toBe(26550);
  });

  it("returns a negative balance when expenses exceed income", () => {
    expect(calculateBalance(1000, 1500)).toBe(-500);
  });

  it("subtracts savings from income as well", () => {
    expect(calculateBalance(65000, 38450, 10000)).toBe(16550);
  });

  it("defaults savings to 0 when omitted", () => {
    expect(calculateBalance(65000, 38450, undefined)).toBe(26550);
  });
});

describe("calculateSavingsRate", () => {
  it("computes savings as a percentage of income", () => {
    expect(calculateSavingsRate(65000, 26550)).toBeCloseTo(40.8, 1);
  });

  it("returns 0 when income is zero to avoid division by zero", () => {
    expect(calculateSavingsRate(0, 0)).toBe(0);
  });

  it("returns 0 when income is negative", () => {
    expect(calculateSavingsRate(-100, 50)).toBe(0);
  });
});

describe("calculateBudgetUsage", () => {
  it("computes percentage of budget spent", () => {
    expect(calculateBudgetUsage(8000, 10000)).toBe(80);
  });

  it("can exceed 100% when over budget", () => {
    expect(calculateBudgetUsage(12000, 10000)).toBe(120);
  });

  it("returns 0 when budget is zero to avoid division by zero", () => {
    expect(calculateBudgetUsage(500, 0)).toBe(0);
  });
});

describe("calculateRemainingBudget", () => {
  it("returns the amount left in the budget", () => {
    expect(calculateRemainingBudget(10000, 8000)).toBe(2000);
  });

  it("returns a negative number when over budget", () => {
    expect(calculateRemainingBudget(10000, 11500)).toBe(-1500);
  });
});

describe("getBudgetStatus", () => {
  it("returns 'under' below 80% usage", () => {
    expect(getBudgetStatus(79.9)).toBe("under");
    expect(getBudgetStatus(0)).toBe("under");
  });

  it("returns 'near' between 80% and 99.99% usage", () => {
    expect(getBudgetStatus(80)).toBe("near");
    expect(getBudgetStatus(99.9)).toBe("near");
  });

  it("returns 'over' at 100% usage and above", () => {
    expect(getBudgetStatus(100)).toBe("over");
    expect(getBudgetStatus(150)).toBe("over");
  });
});

describe("calculateMonthOverMonthChange", () => {
  it("computes percentage change between two values", () => {
    expect(calculateMonthOverMonthChange(1180, 1000)).toBeCloseTo(18, 5);
  });

  it("computes a negative change when the value decreased", () => {
    expect(calculateMonthOverMonthChange(800, 1000)).toBeCloseTo(-20, 5);
  });

  it("returns 0 when both values are zero", () => {
    expect(calculateMonthOverMonthChange(0, 0)).toBe(0);
  });

  it("returns 100 when going from zero to a positive value", () => {
    expect(calculateMonthOverMonthChange(500, 0)).toBe(100);
  });
});
