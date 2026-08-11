import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  fetchMock,
  createCartMock,
  updateCartResourceMock,
  createLineItemMock,
  updateLineItemMock,
  deleteLineItemMock,
  getCartIdMock,
  setCartIdMock,
  getCacheOptionsMock,
  getCacheTagMock,
  getRegionMock,
  redirectMock,
} = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  createCartMock: vi.fn(),
  updateCartResourceMock: vi.fn(),
  createLineItemMock: vi.fn(),
  updateLineItemMock: vi.fn(),
  deleteLineItemMock: vi.fn(),
  getCartIdMock: vi.fn(),
  setCartIdMock: vi.fn(),
  getCacheOptionsMock: vi.fn(),
  getCacheTagMock: vi.fn(),
  getRegionMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/lib/medusa/config", () => ({
  medusa: {
    client: { fetch: fetchMock },
    store: {
      cart: {
        create: createCartMock,
        update: updateCartResourceMock,
        createLineItem: createLineItemMock,
        updateLineItem: updateLineItemMock,
        deleteLineItem: deleteLineItemMock,
      },
    },
  },
}));

vi.mock("./cookies", () => ({
  getCacheOptions: getCacheOptionsMock,
  getCacheTag: getCacheTagMock,
  getCartId: getCartIdMock,
  setCartId: setCartIdMock,
}));

vi.mock("./regions", () => ({ getRegion: getRegionMock }));
vi.mock("next/cache", () => ({ updateTag: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import {
  retrieveCart,
  retrieveCheckoutCart,
  getOrSetCart,
  updateCart,
  addToCart,
  updateLineItem,
  deleteLineItem,
  updateRegion,
} from "./cart";

const usRegion = { id: "reg_us", name: "United States" };

beforeEach(() => {
  fetchMock.mockReset();
  createCartMock.mockReset();
  updateCartResourceMock.mockReset();
  createLineItemMock.mockReset();
  updateLineItemMock.mockReset();
  deleteLineItemMock.mockReset();
  getCartIdMock.mockReset();
  setCartIdMock.mockReset();
  getCacheOptionsMock.mockReset();
  getCacheTagMock.mockReset();
  getRegionMock.mockReset();
  redirectMock.mockReset();

  getCacheOptionsMock.mockResolvedValue({});
  getCacheTagMock.mockImplementation(async (tag: string) => tag);
  getCartIdMock.mockResolvedValue("cart_123");
  getRegionMock.mockResolvedValue(usRegion);
});

describe("retrieveCart", () => {
  it("returns null when no cart ID is given and none is cookied", async () => {
    getCartIdMock.mockResolvedValue(undefined);

    expect(await retrieveCart()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches by the given cart ID", async () => {
    fetchMock.mockResolvedValue({ cart: { id: "cart_123" } });

    expect(await retrieveCart("cart_123")).toEqual({ id: "cart_123" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/store/carts/cart_123",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("falls back to the cart ID cookie when none is given", async () => {
    getCartIdMock.mockResolvedValue("cart_from_cookie");
    fetchMock.mockResolvedValue({ cart: { id: "cart_from_cookie" } });

    expect(await retrieveCart()).toEqual({ id: "cart_from_cookie" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/store/carts/cart_from_cookie",
      expect.anything(),
    );
  });

  it("logs and returns null when the fetch fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error("network down"));

    expect(await retrieveCart("cart_123")).toBeNull();
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});

describe("retrieveCheckoutCart", () => {
  it("requests shipping-method amount and payment-session fields", async () => {
    fetchMock.mockResolvedValue({ cart: { id: "cart_123" } });

    await retrieveCheckoutCart();

    expect(fetchMock).toHaveBeenCalledWith(
      "/store/carts/cart_123",
      expect.objectContaining({
        query: {
          fields: expect.stringContaining("+shipping_methods.amount"),
        },
      }),
    );
    expect(fetchMock.mock.calls[0][1].query.fields).toContain(
      "*payment_collection.payment_sessions",
    );
  });
});

describe("getOrSetCart", () => {
  it("throws when the region can't be resolved", async () => {
    getRegionMock.mockResolvedValue(null);

    await expect(getOrSetCart("us")).rejects.toThrow(
      /Region not found for country code "us"/,
    );
  });

  it("creates a new cart and sets the cart ID cookie when none exists", async () => {
    getCartIdMock.mockResolvedValue(undefined);
    createCartMock.mockResolvedValue({
      cart: { id: "cart_new", region_id: "reg_us" },
    });

    const cart = await getOrSetCart("us");

    expect(createCartMock).toHaveBeenCalledWith({ region_id: "reg_us" });
    expect(setCartIdMock).toHaveBeenCalledWith("cart_new");
    expect(cart).toEqual({ id: "cart_new", region_id: "reg_us" });
  });

  it("updates an existing cart's region in place instead of creating a new one", async () => {
    fetchMock.mockResolvedValue({
      cart: { id: "cart_123", region_id: "reg_ca" },
    });

    const cart = await getOrSetCart("us");

    expect(createCartMock).not.toHaveBeenCalled();
    expect(updateCartResourceMock).toHaveBeenCalledWith("cart_123", {
      region_id: "reg_us",
    });
    expect(cart).toEqual({ id: "cart_123", region_id: "reg_ca" });
  });

  it("leaves the cart untouched when its region already matches", async () => {
    fetchMock.mockResolvedValue({
      cart: { id: "cart_123", region_id: "reg_us" },
    });

    await getOrSetCart("us");

    expect(createCartMock).not.toHaveBeenCalled();
    expect(updateCartResourceMock).not.toHaveBeenCalled();
  });

  it("throws a normalized error when cart creation fails", async () => {
    getCartIdMock.mockResolvedValue(undefined);
    createCartMock.mockRejectedValue(new Error("boom"));

    await expect(getOrSetCart("us")).rejects.toThrow(
      "Error setting up the request: boom",
    );
  });
});

describe("updateCart", () => {
  it("throws when no cart exists", async () => {
    getCartIdMock.mockResolvedValue(undefined);

    await expect(updateCart({ email: "a@b.com" })).rejects.toThrow(
      /No existing cart found; create one before updating/,
    );
  });

  it("updates the cart and returns it", async () => {
    updateCartResourceMock.mockResolvedValue({
      cart: { id: "cart_123", email: "a@b.com" },
    });

    const cart = await updateCart({ email: "a@b.com" });

    expect(updateCartResourceMock).toHaveBeenCalledWith("cart_123", {
      email: "a@b.com",
    });
    expect(cart).toEqual({ id: "cart_123", email: "a@b.com" });
  });

  it("throws a normalized error when the Medusa update fails", async () => {
    updateCartResourceMock.mockRejectedValue(new Error("boom"));

    await expect(updateCart({ email: "a@b.com" })).rejects.toThrow(
      "Error setting up the request: boom",
    );
  });
});

describe("addToCart", () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue({
      cart: { id: "cart_123", region_id: "reg_us" },
    });
  });

  it("throws when variant ID is missing", async () => {
    await expect(
      addToCart({ variantId: "", quantity: 1, countryCode: "us" }),
    ).rejects.toThrow(/Missing variant ID when adding to cart/);
  });

  it("creates the line item on the resolved cart", async () => {
    await addToCart({
      variantId: "variant_1",
      quantity: 2,
      countryCode: "us",
    });

    expect(createLineItemMock).toHaveBeenCalledWith("cart_123", {
      variant_id: "variant_1",
      quantity: 2,
    });
  });

  it("throws a normalized error when Medusa rejects the line item", async () => {
    createLineItemMock.mockRejectedValue(new Error("boom"));

    await expect(
      addToCart({ variantId: "variant_1", quantity: 2, countryCode: "us" }),
    ).rejects.toThrow("Error setting up the request: boom");
  });
});

describe("updateLineItem", () => {
  it("throws when the line item ID is missing", async () => {
    await expect(updateLineItem({ lineId: "", quantity: 1 })).rejects.toThrow(
      /Missing line item ID when updating line item/,
    );
  });

  it("throws when no cart exists", async () => {
    getCartIdMock.mockResolvedValue(undefined);

    await expect(
      updateLineItem({ lineId: "line_1", quantity: 1 }),
    ).rejects.toThrow(/Missing cart ID when updating line item/);
  });

  it("updates the line item's quantity", async () => {
    await updateLineItem({ lineId: "line_1", quantity: 3 });

    expect(updateLineItemMock).toHaveBeenCalledWith("cart_123", "line_1", {
      quantity: 3,
    });
  });

  it("throws a normalized error when Medusa rejects the update", async () => {
    updateLineItemMock.mockRejectedValue(new Error("boom"));

    await expect(
      updateLineItem({ lineId: "line_1", quantity: 3 }),
    ).rejects.toThrow("Error setting up the request: boom");
  });
});

describe("deleteLineItem", () => {
  it("throws when the line item ID is missing", async () => {
    await expect(deleteLineItem("")).rejects.toThrow(
      /Missing line item ID when deleting line item/,
    );
  });

  it("throws when no cart exists", async () => {
    getCartIdMock.mockResolvedValue(undefined);

    await expect(deleteLineItem("line_1")).rejects.toThrow(
      /Missing cart ID when deleting line item/,
    );
  });

  it("deletes the line item", async () => {
    await deleteLineItem("line_1");

    expect(deleteLineItemMock).toHaveBeenCalledWith("cart_123", "line_1");
  });

  it("throws a normalized error when Medusa rejects the deletion", async () => {
    deleteLineItemMock.mockRejectedValue(new Error("boom"));

    await expect(deleteLineItem("line_1")).rejects.toThrow(
      "Error setting up the request: boom",
    );
  });
});

describe("updateRegion", () => {
  it("throws when the region can't be resolved", async () => {
    getRegionMock.mockResolvedValue(null);

    await expect(updateRegion("us", "/store")).rejects.toThrow(
      /Region not found for country code "us"/,
    );
  });

  it("updates the cart's region when a cart exists, then redirects", async () => {
    updateCartResourceMock.mockResolvedValue({
      cart: { id: "cart_123", region_id: "reg_us" },
    });

    await updateRegion("us", "/store");

    expect(updateCartResourceMock).toHaveBeenCalledWith("cart_123", {
      region_id: "reg_us",
    });
    expect(redirectMock).toHaveBeenCalledWith("/us/store");
  });

  it("skips updating the cart when none exists, but still redirects", async () => {
    getCartIdMock.mockResolvedValue(undefined);

    await updateRegion("us", "/store");

    expect(updateCartResourceMock).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/us/store");
  });
});
