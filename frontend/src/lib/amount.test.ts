import { describe, expect, it } from "vitest";
import { validateAmount } from "./amount";

describe("validateAmount", () => {
  it("accepts a valid amount with two decimals", () => {
    expect(validateAmount("150.25")).toBeNull();
  });

  it("accepts a whole number", () => {
    expect(validateAmount("10")).toBeNull();
  });

  it("rejects empty input", () => {
    expect(validateAmount("")).toMatch(/ingresa un monto/i);
  });

  it("rejects negative or zero amounts", () => {
    expect(validateAmount("0")).toMatch(/mayor que cero/i);
    expect(validateAmount("-5")).not.toBeNull();
  });

  it("rejects more than two decimals", () => {
    expect(validateAmount("10.123")).toMatch(/2 decimales/i);
  });

  it("rejects amounts above the 10,000 USD limit", () => {
    expect(validateAmount("10000.01")).toMatch(/10,000 usd/i);
  });

  it("accepts exactly the limit", () => {
    expect(validateAmount("10000")).toBeNull();
  });
});
