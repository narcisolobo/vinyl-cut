import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProductByHandle, listProducts, listProductsWithSort } from "./products";

const { fetchMock, getRegionMock, retrieveRegionMock, sortProductsMock } =
  vi.hoisted(() => ({
    fetchMock: vi.fn(),
    getRegionMock: vi.fn(),
    retrieveRegionMock: vi.fn(),
    sortProductsMock: vi.fn(),
  }));

vi.mock("@/lib/medusa/config", () => ({
  medusa: { client: { fetch: fetchMock } },
}));

vi.mock("./cookies", () => ({
  getCacheOptions: vi.fn(async () => ({})),
}));

vi.mock("./regions", () => ({
  getRegion: getRegionMock,
  retrieveRegion: retrieveRegionMock,
}));

vi.mock("@/lib/utils/sort-products", () => ({
  sortProducts: sortProductsMock,
}));

const region = { id: "reg_us" };

beforeEach(() => {
  fetchMock.mockReset();
  getRegionMock.mockReset();
  retrieveRegionMock.mockReset();
  sortProductsMock.mockReset();

  getRegionMock.mockResolvedValue(region);
  retrieveRegionMock.mockResolvedValue(region);
  sortProductsMock.mockImplementation((products) => products);
});

describe("listProducts", () => {
  it("throws when neither countryCode nor regionId is given", async () => {
    await expect(listProducts({})).rejects.toThrow(
      "Country code or region ID is required",
    );
  });

  it("resolves the region via getRegion when countryCode is given", async () => {
    fetchMock.mockResolvedValueOnce({ products: [], count: 0 });

    await listProducts({ countryCode: "us" });

    expect(getRegionMock).toHaveBeenCalledWith("us");
    expect(retrieveRegionMock).not.toHaveBeenCalled();
  });

  it("resolves the region via retrieveRegion when only regionId is given", async () => {
    fetchMock.mockResolvedValueOnce({ products: [], count: 0 });

    await listProducts({ regionId: "reg_us" });

    expect(retrieveRegionMock).toHaveBeenCalledWith("reg_us");
    expect(getRegionMock).not.toHaveBeenCalled();
  });

  it("returns an empty result when the region can't be resolved", async () => {
    getRegionMock.mockResolvedValueOnce(null);

    const result = await listProducts({ countryCode: "xx" });

    expect(result).toEqual({
      response: { products: [], count: 0 },
      nextPage: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches with the resolved region_id and the computed offset", async () => {
    fetchMock.mockResolvedValueOnce({ products: [], count: 0 });

    await listProducts({
      countryCode: "us",
      pageParam: 3,
      queryParams: { limit: 10 },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/store/products",
      expect.objectContaining({
        query: expect.objectContaining({
          limit: 10,
          offset: 20,
          region_id: "reg_us",
        }),
      }),
    );
  });

  it("returns nextPage as null when there are no more results", async () => {
    fetchMock.mockResolvedValueOnce({ products: [{ id: "p1" }], count: 1 });

    const result = await listProducts({ countryCode: "us" });

    expect(result.nextPage).toBeNull();
  });

  it("returns the next page number when more results remain", async () => {
    fetchMock.mockResolvedValueOnce({
      products: Array(12).fill({ id: "p" }),
      count: 20,
    });

    const result = await listProducts({
      countryCode: "us",
      pageParam: 1,
      queryParams: { limit: 12 },
    });

    expect(result.nextPage).toBe(2);
  });

  it("throws a wrapped error when the fetch fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    await expect(listProducts({ countryCode: "us" })).rejects.toThrow(
      /Failed to fetch products from Medusa/,
    );
  });
});

describe("listProductsWithSort", () => {
  it("requests order=-created_at for the default 'latest' sort, no over-fetch", async () => {
    fetchMock.mockResolvedValueOnce({ products: [{ id: "p1" }], count: 1 });

    const result = await listProductsWithSort({ countryCode: "us" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/store/products",
      expect.objectContaining({
        query: expect.objectContaining({ order: "-created_at" }),
      }),
    );
    expect(sortProductsMock).not.toHaveBeenCalled();
    expect(result.response.products).toEqual([{ id: "p1" }]);
  });

  it("requests order=subtitle for artist-asc", async () => {
    fetchMock.mockResolvedValueOnce({ products: [], count: 0 });

    await listProductsWithSort({ countryCode: "us", sort: "artist-asc" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/store/products",
      expect.objectContaining({
        query: expect.objectContaining({ order: "subtitle" }),
      }),
    );
    expect(sortProductsMock).not.toHaveBeenCalled();
  });

  it("over-fetches 100 and slices client-side for price-asc, defaulting to page 1", async () => {
    const fetched = Array.from({ length: 15 }, (_, i) => ({ id: `p${i}` }));
    fetchMock.mockResolvedValueOnce({ products: fetched, count: 15 });

    const result = await listProductsWithSort({
      countryCode: "us",
      sort: "price-asc",
      queryParams: { limit: 12 },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/store/products",
      expect.objectContaining({
        query: expect.objectContaining({ limit: 100 }),
      }),
    );
    expect(sortProductsMock).toHaveBeenCalledWith(fetched, "price-asc");
    expect(result.response.products).toHaveLength(12);
    expect(result.response.count).toBe(15);
    expect(result.nextPage).toBe(2);
  });

  it("returns null nextPage on the last price-sorted page", async () => {
    const fetched = Array.from({ length: 15 }, (_, i) => ({ id: `p${i}` }));
    fetchMock.mockResolvedValueOnce({ products: fetched, count: 15 });

    const result = await listProductsWithSort({
      countryCode: "us",
      sort: "price-asc",
      page: 2,
      queryParams: { limit: 12 },
    });

    expect(result.response.products).toHaveLength(3);
    expect(result.nextPage).toBeNull();
  });

  it("dedupes optionValueIds and passes them as option_value_id", async () => {
    fetchMock.mockResolvedValueOnce({ products: [], count: 0 });

    await listProductsWithSort({
      countryCode: "us",
      optionValueIds: ["a", "b", "a"],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/store/products",
      expect.objectContaining({
        query: expect.objectContaining({ option_value_id: ["a", "b"] }),
      }),
    );
  });

  it("omits option_value_id when no option filters are given", async () => {
    fetchMock.mockResolvedValueOnce({ products: [], count: 0 });

    await listProductsWithSort({ countryCode: "us" });

    const query = fetchMock.mock.calls[0][1].query;
    expect(query).not.toHaveProperty("option_value_id");
  });
});

describe("getProductByHandle", () => {
  it("requests a single product filtered by handle", async () => {
    fetchMock.mockResolvedValueOnce({
      products: [{ id: "p1", handle: "what-s-going-on" }],
      count: 1,
    });

    await getProductByHandle("what-s-going-on", "us");

    expect(fetchMock).toHaveBeenCalledWith(
      "/store/products",
      expect.objectContaining({
        query: expect.objectContaining({
          handle: "what-s-going-on",
          limit: 1,
        }),
      }),
    );
  });

  it("returns the matched product", async () => {
    const product = { id: "p1", handle: "what-s-going-on" };
    fetchMock.mockResolvedValueOnce({ products: [product], count: 1 });

    const result = await getProductByHandle("what-s-going-on", "us");

    expect(result).toEqual(product);
  });

  it("returns null when no product matches the handle", async () => {
    fetchMock.mockResolvedValueOnce({ products: [], count: 0 });

    const result = await getProductByHandle("does-not-exist", "us");

    expect(result).toBeNull();
  });
});
