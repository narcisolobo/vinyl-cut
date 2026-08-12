import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as ProductFiltersModule from "./product-filters";

const fetchMock = vi.fn();

vi.mock("@/lib/medusa/config", () => ({
  medusa: { client: { fetch: fetchMock } },
}));

vi.mock("./cookies", () => ({
  getCacheOptions: vi.fn(async () => ({})),
}));

const categories = [
  { id: "pcat_rock", name: "Rock" },
  { id: "pcat_1970s", name: "1970s" },
];

const conditionOption = {
  id: "opt_condition",
  title: "Condition",
  values: [
    { id: "optval_m", value: "M" },
    { id: "optval_g", value: "G" },
  ],
};

function mockFetchImplementation() {
  fetchMock.mockImplementation(async (path: string) => {
    if (path === "/store/product-categories") {
      return { product_categories: categories };
    }
    if (path === "/store/product-options") {
      return { product_options: [conditionOption] };
    }
    throw new Error(`unexpected path: ${path}`);
  });
}

let productFilters: typeof ProductFiltersModule;

beforeEach(async () => {
  vi.resetModules();
  fetchMock.mockReset();
  mockFetchImplementation();
  productFilters = await import("./product-filters");
});

describe("resolveProductFilters", () => {
  it("resolves genre and era names to category ids", async () => {
    const result = await productFilters.resolveProductFilters({
      genres: ["Rock"],
      eras: ["1970s"],
    });

    expect(result.categoryIds).toEqual(
      expect.arrayContaining(["pcat_rock", "pcat_1970s"]),
    );
    expect(result.categoryIds).toHaveLength(2);
  });

  it("drops genre/era names that don't match a known category", async () => {
    const result = await productFilters.resolveProductFilters({
      genres: ["Not A Real Genre"],
    });

    expect(result.categoryIds).toEqual([]);
  });

  it("resolves condition labels to option-value ids via the grade symbol", async () => {
    const result = await productFilters.resolveProductFilters({
      conditions: ["Mint (M)", "Good (G)"],
    });

    expect(result.optionValueIds).toEqual(
      expect.arrayContaining(["optval_m", "optval_g"]),
    );
    expect(result.optionValueIds).toHaveLength(2);
  });

  it("drops condition labels that don't match a known grade", async () => {
    const result = await productFilters.resolveProductFilters({
      conditions: ["Not A Real Condition"],
    });

    expect(result.optionValueIds).toEqual([]);
  });

  it("drops all conditions when the Condition option has no values", async () => {
    fetchMock.mockImplementation(async (path: string) => {
      if (path === "/store/product-categories") {
        return { product_categories: categories };
      }
      if (path === "/store/product-options") {
        return { product_options: [] };
      }
      throw new Error(`unexpected path: ${path}`);
    });

    const result = await productFilters.resolveProductFilters({
      conditions: ["Mint (M)"],
    });

    expect(result.optionValueIds).toEqual([]);
  });

  it("doesn't fetch the Condition option when no conditions are given", async () => {
    await productFilters.resolveProductFilters({ genres: ["Rock"] });

    expect(fetchMock).not.toHaveBeenCalledWith(
      "/store/product-options",
      expect.anything(),
    );
  });

  it("caches categories and doesn't refetch across calls", async () => {
    await productFilters.resolveProductFilters({ genres: ["Rock"] });
    await productFilters.resolveProductFilters({ genres: ["Rock"] });

    const categoryFetches = fetchMock.mock.calls.filter(
      ([path]) => path === "/store/product-categories",
    );
    expect(categoryFetches).toHaveLength(1);
  });

  it("caches the Condition option and doesn't refetch across calls", async () => {
    await productFilters.resolveProductFilters({ conditions: ["Mint (M)"] });
    await productFilters.resolveProductFilters({ conditions: ["Good (G)"] });

    const conditionFetches = fetchMock.mock.calls.filter(
      ([path]) => path === "/store/product-options",
    );
    expect(conditionFetches).toHaveLength(1);
  });

  it("logs and returns no category ids when the category fetch fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    fetchMock.mockReset();
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const result = await productFilters.resolveProductFilters({
      genres: ["Rock"],
    });

    expect(result.categoryIds).toEqual([]);
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });

  it("logs and returns no option-value ids when the Condition option fetch fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    fetchMock.mockReset();
    fetchMock.mockImplementationOnce(async () => ({
      product_categories: categories,
    }));
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const result = await productFilters.resolveProductFilters({
      conditions: ["Mint (M)"],
    });

    expect(result.optionValueIds).toEqual([]);
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});
