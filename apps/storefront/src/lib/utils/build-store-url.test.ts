import { describe, expect, it } from "vitest";
import { buildStoreUrl } from "./build-store-url";

describe("buildStoreUrl", () => {
  it("returns the bare basePath when there are no params and page is 1", () => {
    expect(buildStoreUrl("/store", {}, 1)).toBe("/store");
  });

  it("omits `page` for page 1, even with other params present", () => {
    expect(buildStoreUrl("/store", { sort: "price-asc" }, 1)).toBe(
      "/store?sort=price-asc",
    );
  });

  it("includes `page` for page 2 and above", () => {
    expect(buildStoreUrl("/store", {}, 2)).toBe("/store?page=2");
  });

  it("combines filter/sort params with page", () => {
    const result = buildStoreUrl(
      "/store",
      { sort: "price-asc", genre: "Rock" },
      2,
    );

    expect(result).toBe("/store?sort=price-asc&genre=Rock&page=2");
  });

  it("omits undefined param values", () => {
    const result = buildStoreUrl(
      "/store",
      { sort: "price-asc", genre: undefined, era: undefined },
      1,
    );

    expect(result).toBe("/store?sort=price-asc");
  });

  it("omits empty-string param values", () => {
    const result = buildStoreUrl("/store", { sort: "", genre: "Rock" }, 1);

    expect(result).toBe("/store?genre=Rock");
  });

  it("works with a basePath that already includes a country code", () => {
    expect(buildStoreUrl("/us/store", { sort: "artist-asc" }, 3)).toBe(
      "/us/store?sort=artist-asc&page=3",
    );
  });

  it("URL-encodes param values", () => {
    expect(buildStoreUrl("/store", { genre: "R&B/Soul" }, 1)).toBe(
      "/store?genre=R%26B%2FSoul",
    );
  });
});
