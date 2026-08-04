import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, setMock, store } = vi.hoisted(() => {
  const store = new Map<string, string>();
  const setMock = vi.fn((name: string, value: string) => {
    store.set(name, value);
  });
  const cookiesMock = vi.fn(async () => ({
    get: (name: string) =>
      store.has(name) ? { value: store.get(name)! } : undefined,
    set: setMock,
  }));

  return { cookiesMock, setMock, store };
});

vi.mock("next/headers", () => ({ cookies: cookiesMock }));

import {
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies";

beforeEach(() => {
  store.clear();
  setMock.mockClear();
  cookiesMock.mockClear();
});

describe("getCacheTag", () => {
  it("returns '' when there's no cache id cookie", async () => {
    expect(await getCacheTag("regions")).toBe("");
  });

  it("namespaces the tag with the cache id cookie", async () => {
    store.set("_medusa_cache_id", "abc123");

    expect(await getCacheTag("regions")).toBe("regions-abc123");
  });

  it("logs and returns '' when reading cookies throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    cookiesMock.mockRejectedValueOnce(new Error("no request context"));

    expect(await getCacheTag("regions")).toBe("");
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});

describe("getCacheOptions", () => {
  it("returns {} when there's no cache id cookie", async () => {
    expect(await getCacheOptions("regions")).toEqual({});
  });

  it("returns { tags } when a cache id cookie is present", async () => {
    store.set("_medusa_cache_id", "abc123");

    expect(await getCacheOptions("regions")).toEqual({
      tags: ["regions-abc123"],
    });
  });
});

describe("cart id cookie", () => {
  it("getCartId returns undefined when unset", async () => {
    expect(await getCartId()).toBeUndefined();
  });

  it("setCartId writes the cart id cookie with the expected options", async () => {
    await setCartId("cart_123");

    expect(setMock).toHaveBeenCalledWith("_medusa_cart_id", "cart_123", {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "strict",
      secure: false,
    });
    expect(await getCartId()).toBe("cart_123");
  });

  it("removeCartId clears the cart id cookie", async () => {
    await setCartId("cart_123");
    await removeCartId();

    expect(setMock).toHaveBeenCalledWith("_medusa_cart_id", "", {
      maxAge: -1,
    });
  });

  it("getCartId throws a wrapped error when reading cookies fails", async () => {
    cookiesMock.mockRejectedValueOnce(new Error("no request context"));

    await expect(getCartId()).rejects.toThrow(
      /Failed to read "_medusa_cart_id"/,
    );
  });

  it("setCartId throws a wrapped error when writing cookies fails", async () => {
    cookiesMock.mockRejectedValueOnce(new Error("no request context"));

    await expect(setCartId("cart_123")).rejects.toThrow(
      /Failed to set "_medusa_cart_id"/,
    );
  });

  it("removeCartId throws a wrapped error when clearing cookies fails", async () => {
    cookiesMock.mockRejectedValueOnce(new Error("no request context"));

    await expect(removeCartId()).rejects.toThrow(
      /Failed to clear "_medusa_cart_id"/,
    );
  });
});
