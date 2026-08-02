import { describe, expect, it } from "vitest";
import { HttpTypes } from "@medusajs/types";
import { sortProducts } from "./sort-products";

function variant(
  calculatedAmount: number | undefined,
): HttpTypes.StoreProductVariant {
  return {
    calculated_price:
      calculatedAmount === undefined
        ? {}
        : { calculated_amount: calculatedAmount },
  } as unknown as HttpTypes.StoreProductVariant;
}

function product(
  id: string,
  overrides: Partial<HttpTypes.StoreProduct> = {},
): HttpTypes.StoreProduct {
  return {
    id,
    variants: [],
    ...overrides,
  } as unknown as HttpTypes.StoreProduct;
}

describe("sortProducts", () => {
  it("sorts by cheapest variant price ascending", () => {
    const cheap = product("cheap", { variants: [variant(500)] });
    const pricey = product("pricey", { variants: [variant(2000)] });

    expect(sortProducts([pricey, cheap], "price-asc")).toEqual([
      cheap,
      pricey,
    ]);
  });

  it("sorts by cheapest variant price descending", () => {
    const cheap = product("cheap", { variants: [variant(500)] });
    const pricey = product("pricey", { variants: [variant(2000)] });

    expect(sortProducts([cheap, pricey], "price-desc")).toEqual([
      pricey,
      cheap,
    ]);
  });

  it("uses the minimum price across multiple variants", () => {
    const multi = product("multi", {
      variants: [variant(3000), variant(800)],
    });
    const single = product("single", { variants: [variant(1500)] });

    expect(sortProducts([single, multi], "price-asc")).toEqual([
      multi,
      single,
    ]);
  });

  it("treats a missing calculated_amount as 0", () => {
    const free = product("free", { variants: [variant(undefined)] });
    const priced = product("priced", { variants: [variant(100)] });

    expect(sortProducts([priced, free], "price-asc")).toEqual([
      free,
      priced,
    ]);
  });

  it("sorts products with no variants to the end of price-asc", () => {
    const noVariants = product("no-variants", { variants: [] });
    const priced = product("priced", { variants: [variant(100)] });

    expect(sortProducts([noVariants, priced], "price-asc")).toEqual([
      priced,
      noVariants,
    ]);
  });

  it("sorts products with no variants to the front of price-desc", () => {
    const noVariants = product("no-variants", { variants: [] });
    const priced = product("priced", { variants: [variant(100)] });

    expect(sortProducts([priced, noVariants], "price-desc")).toEqual([
      noVariants,
      priced,
    ]);
  });

  it("does not mutate the input array", () => {
    const cheap = product("cheap", { variants: [variant(500)] });
    const pricey = product("pricey", { variants: [variant(2000)] });
    const original = [pricey, cheap];

    sortProducts(original, "price-asc");

    expect(original).toEqual([pricey, cheap]);
  });
});
