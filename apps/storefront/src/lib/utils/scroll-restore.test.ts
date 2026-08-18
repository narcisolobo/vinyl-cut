import { beforeEach, describe, expect, it, vi } from "vitest";
import { consumeScrollPosition, saveScrollPosition } from "./scroll-restore";

/**
 * This suite runs under Vitest's default "node" environment (no jsdom),
 * so `window`/`sessionStorage` don't exist -- stub exactly the surface
 * scroll-restore.ts touches rather than pulling in a DOM environment
 * dependency for two small functions.
 */
function stubLocation(pathname: string, search = ""): void {
  vi.stubGlobal("window", { location: { pathname, search }, scrollY: 0 });
}

function stubSessionStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  });
  return store;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("saveScrollPosition", () => {
  it("stores the current pathname+search and scrollY", () => {
    stubLocation("/us/store", "?page=2");
    const store = stubSessionStorage();
    window.scrollY = 900;

    saveScrollPosition();

    expect(JSON.parse(store.get("vinyl-cut:plp-scroll-restore")!)).toEqual({
      url: "/us/store?page=2",
      y: 900,
    });
  });
});

describe("consumeScrollPosition", () => {
  it("returns null when nothing has been saved", () => {
    stubLocation("/us/store");
    stubSessionStorage();

    expect(consumeScrollPosition()).toBeNull();
  });

  it("returns the saved y when the current URL matches", () => {
    stubLocation("/us/store", "?page=2");
    const store = stubSessionStorage();
    store.set(
      "vinyl-cut:plp-scroll-restore",
      JSON.stringify({ url: "/us/store?page=2", y: 900 }),
    );

    expect(consumeScrollPosition()).toBe(900);
  });

  it("returns null when the saved URL doesn't match the current one", () => {
    stubLocation("/us/store", "?page=3");
    const store = stubSessionStorage();
    store.set(
      "vinyl-cut:plp-scroll-restore",
      JSON.stringify({ url: "/us/store?page=2", y: 900 }),
    );

    expect(consumeScrollPosition()).toBeNull();
  });

  it("is single-use -- consumes (removes) the saved value even on a match", () => {
    stubLocation("/us/store");
    const store = stubSessionStorage();
    store.set(
      "vinyl-cut:plp-scroll-restore",
      JSON.stringify({ url: "/us/store", y: 500 }),
    );

    consumeScrollPosition();

    expect(store.has("vinyl-cut:plp-scroll-restore")).toBe(false);
  });

  it("removes the entry and returns null on a URL mismatch too", () => {
    stubLocation("/us/store", "?page=3");
    const store = stubSessionStorage();
    store.set(
      "vinyl-cut:plp-scroll-restore",
      JSON.stringify({ url: "/us/store?page=2", y: 900 }),
    );

    consumeScrollPosition();

    expect(store.has("vinyl-cut:plp-scroll-restore")).toBe(false);
  });

  it("returns null instead of throwing on malformed stored JSON", () => {
    stubLocation("/us/store");
    const store = stubSessionStorage();
    store.set("vinyl-cut:plp-scroll-restore", "{not valid json");

    expect(consumeScrollPosition()).toBeNull();
  });
});
