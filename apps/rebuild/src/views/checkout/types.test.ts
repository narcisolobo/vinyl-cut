import { describe, expect, it } from "vitest";
import { HttpTypes } from "@medusajs/types";
import {
  getPaymentProviderLabel,
  isAddressComplete,
  isDeliveryComplete,
  isPaymentComplete,
  isReviewReady,
  resolveActiveStep,
} from "./types";

/** Loosely-typed cart fixture — only the fields the predicates under test actually read. */
type CartFixture = {
  id?: string;
  shipping_address?: unknown;
  billing_address?: unknown;
  email?: string | null;
  shipping_methods?: unknown[];
  payment_collection?: unknown;
};

function makeCart(overrides: CartFixture = {}): HttpTypes.StoreCart {
  return {
    id: "cart_1",
    shipping_address: null,
    billing_address: null,
    email: null,
    shipping_methods: [],
    payment_collection: null,
    ...overrides,
  } as unknown as HttpTypes.StoreCart;
}

const completeAddressFields: CartFixture = {
  shipping_address: {},
  billing_address: {},
  email: "shopper@example.com",
};

const completeDeliveryFields: CartFixture = {
  shipping_methods: [{ id: "sm_1" }],
};

const completePaymentFields: CartFixture = {
  payment_collection: {
    payment_sessions: [{ status: "pending" }],
  },
};

describe("isAddressComplete", () => {
  it("is false when any of shipping address, billing address, or email is missing", () => {
    expect(isAddressComplete(makeCart())).toBe(false);
    expect(
      isAddressComplete(makeCart({ shipping_address: {}, billing_address: {} })),
    ).toBe(false);
  });

  it("is true once shipping address, billing address, and email are all set", () => {
    expect(isAddressComplete(makeCart(completeAddressFields))).toBe(true);
  });
});

describe("isDeliveryComplete", () => {
  it("is false with no shipping methods", () => {
    expect(isDeliveryComplete(makeCart())).toBe(false);
  });

  it("is false when shipping_methods is undefined", () => {
    expect(
      isDeliveryComplete(makeCart({ shipping_methods: undefined })),
    ).toBe(false);
  });

  it("is true once a shipping method is set", () => {
    expect(isDeliveryComplete(makeCart(completeDeliveryFields))).toBe(true);
  });
});

describe("isPaymentComplete", () => {
  it("is false without a completed delivery step, even with a pending payment session", () => {
    expect(isPaymentComplete(makeCart(completePaymentFields))).toBe(false);
  });

  it("is false with delivery complete but no pending payment session", () => {
    expect(isPaymentComplete(makeCart(completeDeliveryFields))).toBe(false);
  });

  it("is true once delivery is complete and a payment session is pending", () => {
    expect(
      isPaymentComplete(
        makeCart({ ...completeDeliveryFields, ...completePaymentFields }),
      ),
    ).toBe(true);
  });
});

describe("isReviewReady", () => {
  it("is true only once address, delivery, and payment are all complete", () => {
    const cart = makeCart({
      ...completeAddressFields,
      ...completeDeliveryFields,
      ...completePaymentFields,
    });

    expect(isReviewReady(cart)).toBe(true);
  });

  it("is false when any prior step is incomplete", () => {
    const cart = makeCart({
      ...completeAddressFields,
      ...completeDeliveryFields,
    });

    expect(isReviewReady(cart)).toBe(false);
  });
});

describe("resolveActiveStep", () => {
  it("defaults to 'address' on a fresh cart with no step requested", () => {
    expect(resolveActiveStep(undefined, makeCart())).toBe("address");
  });

  it("defaults to the first incomplete step, ignoring an unset request", () => {
    const cart = makeCart(completeAddressFields);
    expect(resolveActiveStep(undefined, cart)).toBe("delivery");
  });

  it("honors a requested step at or before the first incomplete step", () => {
    const cart = makeCart({ ...completeAddressFields, ...completeDeliveryFields });
    expect(resolveActiveStep("address", cart)).toBe("address");
    expect(resolveActiveStep("delivery", cart)).toBe("delivery");
  });

  it("clamps a requested step past the first incomplete step back to the ceiling", () => {
    const cart = makeCart();
    expect(resolveActiveStep("review", cart)).toBe("address");
  });

  it("falls back to the ceiling for an unrecognized step value", () => {
    expect(resolveActiveStep("bogus", makeCart())).toBe("address");
  });

  it("resolves to 'review' once every step is complete", () => {
    const cart = makeCart({
      ...completeAddressFields,
      ...completeDeliveryFields,
      ...completePaymentFields,
    });
    expect(resolveActiveStep(undefined, cart)).toBe("review");
    expect(resolveActiveStep("review", cart)).toBe("review");
  });
});

describe("getPaymentProviderLabel", () => {
  it("returns a human-readable label for a known provider ID", () => {
    expect(getPaymentProviderLabel("pp_system_default")).toBe(
      "Manual Payment (Test Mode)",
    );
  });

  it("falls back to the raw provider ID for an unmapped provider", () => {
    expect(getPaymentProviderLabel("pp_stripe_stripe")).toBe(
      "pp_stripe_stripe",
    );
  });
});
