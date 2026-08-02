import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as RegionsModule from "./regions";

const fetchMock = vi.fn();

vi.mock("@/lib/medusa/config", () => ({
  medusa: { client: { fetch: fetchMock } },
}));

vi.mock("./cookies", () => ({
  getCacheOptions: vi.fn(async () => ({})),
}));

const usRegion = {
  id: "reg_us",
  name: "United States",
  countries: [{ iso_2: "us" }],
};

const caRegion = {
  id: "reg_ca",
  name: "Canada",
  countries: [{ iso_2: "ca" }],
};

let regions: typeof RegionsModule;

beforeEach(async () => {
  vi.resetModules();
  fetchMock.mockReset();
  regions = await import("./regions");
});

describe("listRegions", () => {
  it("returns the regions array from the backend", async () => {
    fetchMock.mockResolvedValueOnce({ regions: [usRegion, caRegion] });

    expect(await regions.listRegions()).toEqual([usRegion, caRegion]);
  });

  it("throws a wrapped error when the fetch fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    await expect(regions.listRegions()).rejects.toThrow(
      /Failed to fetch regions from Medusa/,
    );
  });
});

describe("retrieveRegion", () => {
  it("returns the region from the backend", async () => {
    fetchMock.mockResolvedValueOnce({ region: usRegion });

    expect(await regions.retrieveRegion("reg_us")).toEqual(usRegion);
  });

  it("throws a wrapped error when the fetch fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    await expect(regions.retrieveRegion("reg_us")).rejects.toThrow(
      /Failed to fetch region "reg_us" from Medusa/,
    );
  });
});

describe("getRegion", () => {
  it("resolves a region by country code", async () => {
    fetchMock.mockResolvedValueOnce({ regions: [usRegion, caRegion] });

    expect(await regions.getRegion("ca")).toEqual(caRegion);
  });

  it("falls back to 'us' when no country code is given", async () => {
    fetchMock.mockResolvedValueOnce({ regions: [usRegion, caRegion] });

    expect(await regions.getRegion("")).toEqual(usRegion);
  });

  it("caches resolved regions and doesn't refetch", async () => {
    fetchMock.mockResolvedValueOnce({ regions: [usRegion, caRegion] });

    await regions.getRegion("us");
    await regions.getRegion("us");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to 'us' on a warm cache, even when a country-less region cached under the empty key", async () => {
    const noIso2Region = {
      id: "reg_no_iso2",
      name: "No ISO2",
      countries: [{}],
    };
    fetchMock.mockResolvedValueOnce({
      regions: [usRegion, caRegion, noIso2Region],
    });

    // Warms the cache, incidentally caching noIso2Region under "".
    await regions.getRegion("us");

    expect(await regions.getRegion("")).toEqual(usRegion);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("logs and returns null when the region fetch fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    expect(await regions.getRegion("us")).toBeNull();
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});
