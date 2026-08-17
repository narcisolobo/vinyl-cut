import { describe, expect, it } from "vitest";
import { formatPrice } from "./format-price";

describe("formatPrice", () => {
  it("formats cents as a dollar-and-cents string", () => {
    expect(formatPrice({ amount: 1675, currencyCode: "usd" })).toBe("$16.75");
  });

  it("rounds to two decimal places", () => {
    expect(formatPrice({ amount: 100, currencyCode: "usd" })).toBe("$1.00");
  });

  it("accepts a lowercase currency code", () => {
    expect(formatPrice({ amount: 500, currencyCode: "usd" })).toBe("$5.00");
  });

  it("formats zero as a dollar amount", () => {
    expect(formatPrice({ amount: 0, currencyCode: "usd" })).toBe("$0.00");
  });
});
