import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HttpTypes } from "@medusajs/types";

const {
  fetchMock,
  updateCartResourceMock,
  addShippingMethodMock,
  initiatePaymentSessionMock,
  completeCartMock,
  getCartIdMock,
  getCacheOptionsMock,
  getCacheTagMock,
  removeCartIdMock,
  redirectMock,
} = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  updateCartResourceMock: vi.fn(),
  addShippingMethodMock: vi.fn(),
  initiatePaymentSessionMock: vi.fn(),
  completeCartMock: vi.fn(),
  getCartIdMock: vi.fn(),
  getCacheOptionsMock: vi.fn(),
  getCacheTagMock: vi.fn(),
  removeCartIdMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/lib/medusa/config", () => ({
  medusa: {
    client: { fetch: fetchMock },
    store: {
      cart: {
        update: updateCartResourceMock,
        addShippingMethod: addShippingMethodMock,
        complete: completeCartMock,
      },
      payment: { initiatePaymentSession: initiatePaymentSessionMock },
    },
  },
}));

vi.mock("./cookies", () => ({
  getCartId: getCartIdMock,
  getCacheOptions: getCacheOptionsMock,
  getCacheTag: getCacheTagMock,
  removeCartId: removeCartIdMock,
}));

vi.mock("next/cache", () => ({ updateTag: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import {
  setAddresses,
  listShippingOptions,
  setShippingMethod,
  initiatePaymentSession,
  placeOrder,
} from "./checkout";

function buildFormData(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

const validShippingFields = {
  "shipping_address.first_name": "Ada",
  "shipping_address.last_name": "Lovelace",
  "shipping_address.address_1": "123 Analytical Engine Way",
  "shipping_address.city": "Los Angeles",
  "shipping_address.province": "ca",
  "shipping_address.postal_code": "90001",
  "shipping_address.country_code": "US",
  "shipping_address.phone": "555-1234",
  email: "ada@example.com",
};

const validBillingFields = {
  "billing_address.first_name": "Ada",
  "billing_address.last_name": "Lovelace",
  "billing_address.address_1": "456 Somewhere Else",
  "billing_address.city": "New York",
  "billing_address.province": "ny",
  "billing_address.postal_code": "10001",
  "billing_address.country_code": "us",
};

beforeEach(() => {
  fetchMock.mockReset();
  updateCartResourceMock.mockReset();
  addShippingMethodMock.mockReset();
  initiatePaymentSessionMock.mockReset();
  completeCartMock.mockReset();
  getCartIdMock.mockReset();
  getCacheOptionsMock.mockReset();
  getCacheTagMock.mockReset();
  removeCartIdMock.mockReset();
  redirectMock.mockReset();

  getCartIdMock.mockResolvedValue("cart_123");
  updateCartResourceMock.mockResolvedValue({ cart: { id: "cart_123" } });
  getCacheOptionsMock.mockResolvedValue({});
  getCacheTagMock.mockImplementation(async (tag: string) => tag);
});

describe("setAddresses", () => {
  it("persists a valid Western-U.S. address and redirects when same_as_billing is on", async () => {
    const formData = buildFormData({
      ...validShippingFields,
      same_as_billing: "on",
    });

    const result = await setAddresses(undefined, formData);

    expect(updateCartResourceMock).toHaveBeenCalledWith(
      "cart_123",
      expect.objectContaining({
        email: "ada@example.com",
        shipping_address: expect.objectContaining({
          country_code: "us",
          province: "ca",
        }),
        billing_address: expect.objectContaining({
          country_code: "us",
          province: "ca",
        }),
      }),
    );
    expect(redirectMock).toHaveBeenCalledWith("/us/checkout?step=delivery");
    expect(result).toBeUndefined();
  });

  it("lower-cases the province regardless of input case, to match Medusa's geo zone convention", async () => {
    const formData = buildFormData({
      ...validShippingFields,
      "shipping_address.province": "CA",
      same_as_billing: "on",
    });

    await setAddresses(undefined, formData);

    expect(updateCartResourceMock).toHaveBeenCalledWith(
      "cart_123",
      expect.objectContaining({
        shipping_address: expect.objectContaining({ province: "ca" }),
      }),
    );
  });

  it("rejects a shipping province outside the Western-U.S. allow-list", async () => {
    const formData = buildFormData({
      ...validShippingFields,
      "shipping_address.province": "ny",
      same_as_billing: "on",
    });

    const result = await setAddresses(undefined, formData);

    expect(result?.fieldErrors["shipping_address.province"]).toEqual([
      "We currently only ship to CA, OR, WA, NV, AZ, CO, UT, or NM.",
    ]);
    expect(updateCartResourceMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("rejects a shipping country outside the United States", async () => {
    const formData = buildFormData({
      ...validShippingFields,
      "shipping_address.country_code": "gb",
      same_as_billing: "on",
    });

    const result = await setAddresses(undefined, formData);

    expect(result?.fieldErrors["shipping_address.country_code"]).toEqual([
      "We currently only ship within the United States.",
    ]);
    expect(updateCartResourceMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("reports only the required-field error for a blank province, not also the region error", async () => {
    const formData = buildFormData({
      ...validShippingFields,
      "shipping_address.province": "",
      same_as_billing: "on",
    });

    const result = await setAddresses(undefined, formData);

    expect(result?.fieldErrors["shipping_address.province"]).toEqual([
      "State is required.",
    ]);
  });

  it("reports a missing required field", async () => {
    const formData = buildFormData({
      ...validShippingFields,
      "shipping_address.city": "",
      same_as_billing: "on",
    });

    const result = await setAddresses(undefined, formData);

    expect(result?.fieldErrors["shipping_address.city"]).toEqual([
      "City is required.",
    ]);
  });

  it("validates billing independently, without the shipping region restriction, when same_as_billing is off", async () => {
    const formData = buildFormData({
      ...validShippingFields,
      ...validBillingFields,
      "billing_address.city": "",
    });

    const result = await setAddresses(undefined, formData);

    expect(result?.fieldErrors["billing_address.city"]).toEqual([
      "City is required.",
    ]);
    expect(result?.fieldErrors["billing_address.province"]).toBeUndefined();
  });

  it("returns a form error, not field errors, when no cart exists", async () => {
    getCartIdMock.mockResolvedValue(undefined);
    const formData = buildFormData({
      ...validShippingFields,
      same_as_billing: "on",
    });

    const result = await setAddresses(undefined, formData);

    expect(result).toEqual({
      fieldErrors: {},
      formError:
        "checkout.ts: No existing cart found when setting addresses.",
    });
  });

  it("returns a form error when the Medusa update fails", async () => {
    updateCartResourceMock.mockRejectedValue(new Error("boom"));
    const formData = buildFormData({
      ...validShippingFields,
      same_as_billing: "on",
    });

    const result = await setAddresses(undefined, formData);

    expect(result?.formError).toBeTruthy();
    expect(result?.fieldErrors).toEqual({});
  });

  it("persists an independently valid billing address when same_as_billing is off", async () => {
    const formData = buildFormData({
      ...validShippingFields,
      ...validBillingFields,
    });

    const result = await setAddresses(undefined, formData);

    expect(updateCartResourceMock).toHaveBeenCalledWith(
      "cart_123",
      expect.objectContaining({
        billing_address: expect.objectContaining({
          city: "New York",
          province: "ny",
        }),
      }),
    );
    expect(redirectMock).toHaveBeenCalledWith("/us/checkout?step=delivery");
    expect(result).toBeUndefined();
  });

  it("returns a form error when no form data is given", async () => {
    const result = await setAddresses(undefined, null as unknown as FormData);

    expect(result).toEqual({
      fieldErrors: {},
      formError: "checkout.ts: No form data found when setting addresses.",
    });
  });

  it("stringifies a non-Error value thrown while setting addresses", async () => {
    getCartIdMock.mockRejectedValue("boom");
    const formData = buildFormData({
      ...validShippingFields,
      same_as_billing: "on",
    });

    const result = await setAddresses(undefined, formData);

    expect(result).toEqual({ fieldErrors: {}, formError: "boom" });
  });
});

describe("listShippingOptions", () => {
  it("fetches shipping options for the current cart", async () => {
    fetchMock.mockResolvedValue({
      shipping_options: [{ id: "so_1", name: "Standard" }],
    });

    const result = await listShippingOptions();

    expect(fetchMock).toHaveBeenCalledWith(
      "/store/shipping-options",
      expect.objectContaining({ query: { cart_id: "cart_123" } }),
    );
    expect(result).toEqual({
      shipping_options: [{ id: "so_1", name: "Standard" }],
    });
  });

  it("throws a wrapped error when the fetch fails", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(listShippingOptions()).rejects.toThrow(
      /Failed to fetch shipping options/,
    );
  });

  it("caches under the 'fulfillment' tag, so cart/address mutations invalidate it", async () => {
    fetchMock.mockResolvedValue({ shipping_options: [] });

    await listShippingOptions();

    expect(getCacheOptionsMock).toHaveBeenCalledWith("fulfillment");
  });
});

describe("setShippingMethod", () => {
  it("throws when cart ID is missing", async () => {
    await expect(
      setShippingMethod({ cartId: "", shippingMethodId: "so_1" }),
    ).rejects.toThrow(/Missing cart ID when setting shipping method/);
  });

  it("throws when shipping method ID is missing", async () => {
    await expect(
      setShippingMethod({ cartId: "cart_123", shippingMethodId: "" }),
    ).rejects.toThrow(
      /Missing shipping method ID when setting shipping method/,
    );
  });

  it("assigns the shipping method to the cart", async () => {
    await setShippingMethod({ cartId: "cart_123", shippingMethodId: "so_1" });

    expect(addShippingMethodMock).toHaveBeenCalledWith("cart_123", {
      option_id: "so_1",
    });
  });

  it("throws a normalized error when Medusa rejects", async () => {
    addShippingMethodMock.mockRejectedValue(new Error("boom"));

    await expect(
      setShippingMethod({ cartId: "cart_123", shippingMethodId: "so_1" }),
    ).rejects.toThrow("Error setting up the request: boom");
  });
});

describe("initiatePaymentSession", () => {
  const cart = { id: "cart_123" } as unknown as HttpTypes.StoreCart;

  it("initiates a payment session and returns the response", async () => {
    initiatePaymentSessionMock.mockResolvedValue({
      payment_collection: { id: "paycol_1" },
    });

    const result = await initiatePaymentSession(cart, {
      provider_id: "pp_stripe",
    });

    expect(initiatePaymentSessionMock).toHaveBeenCalledWith(cart, {
      provider_id: "pp_stripe",
    });
    expect(result).toEqual({ payment_collection: { id: "paycol_1" } });
  });

  it("throws a normalized error when Medusa rejects", async () => {
    initiatePaymentSessionMock.mockRejectedValue(new Error("boom"));

    await expect(
      initiatePaymentSession(cart, { provider_id: "pp_stripe" }),
    ).rejects.toThrow("Error setting up the request: boom");
  });
});

describe("placeOrder", () => {
  it("throws when no cart ID is available", async () => {
    getCartIdMock.mockResolvedValue(undefined);

    await expect(placeOrder()).rejects.toThrow(
      /No existing cart found when placing an order/,
    );
  });

  it("returns the cart and does not redirect when completion doesn't produce an order", async () => {
    completeCartMock.mockResolvedValue({
      type: "cart",
      cart: { id: "cart_123" },
    });

    const result = await placeOrder("cart_123");

    expect(result).toEqual({ id: "cart_123" });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(removeCartIdMock).not.toHaveBeenCalled();
  });

  it("clears the cart cookie and redirects to the confirmation page on a completed order", async () => {
    completeCartMock.mockResolvedValue({
      type: "order",
      order: {
        id: "order_1",
        shipping_address: { country_code: "US" },
      },
      cart: { id: "cart_123" },
    });

    const result = await placeOrder("cart_123");

    expect(removeCartIdMock).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/us/order/order_1/confirmed");
    expect(result).toEqual({ id: "cart_123" });
  });

  it("throws a normalized error when Medusa rejects completion", async () => {
    completeCartMock.mockRejectedValue(new Error("boom"));

    await expect(placeOrder("cart_123")).rejects.toThrow(
      "Error setting up the request: boom",
    );
  });
});
