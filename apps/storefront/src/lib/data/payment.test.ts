import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as PaymentModule from "./payment";

const fetchMock = vi.fn();

vi.mock("@/lib/medusa/config", () => ({
  medusa: { client: { fetch: fetchMock } },
}));

vi.mock("./cookies", () => ({
  getCacheOptions: vi.fn(async () => ({})),
}));

const manualProvider = { id: "pp_system_default", is_enabled: true };
const stripeProvider = { id: "pp_stripe_stripe", is_enabled: true };

let payment: typeof PaymentModule;

beforeEach(async () => {
  vi.resetModules();
  fetchMock.mockReset();
  payment = await import("./payment");
});

describe("listPaymentProviders", () => {
  it("returns payment providers sorted by ID", async () => {
    fetchMock.mockResolvedValueOnce({
      payment_providers: [stripeProvider, manualProvider],
    });

    expect(await payment.listPaymentProviders("reg_us")).toEqual([
      stripeProvider,
      manualProvider,
    ]);
  });

  it("reorders providers given out of ID order", async () => {
    fetchMock.mockResolvedValueOnce({
      payment_providers: [manualProvider, stripeProvider],
    });

    expect(await payment.listPaymentProviders("reg_us")).toEqual([
      stripeProvider,
      manualProvider,
    ]);
  });

  it("queries by region ID", async () => {
    fetchMock.mockResolvedValueOnce({ payment_providers: [] });

    await payment.listPaymentProviders("reg_us");

    expect(fetchMock).toHaveBeenCalledWith(
      "/store/payment-providers",
      expect.objectContaining({ query: { region_id: "reg_us" } }),
    );
  });

  it("throws when the region ID is missing", async () => {
    await expect(payment.listPaymentProviders("")).rejects.toThrow(
      /Missing region ID/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws a wrapped error when the fetch fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    await expect(payment.listPaymentProviders("reg_us")).rejects.toThrow(
      /Failed to fetch payment providers/,
    );
  });
});
