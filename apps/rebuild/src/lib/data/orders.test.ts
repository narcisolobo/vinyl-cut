import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as OrdersModule from "./orders";

const fetchMock = vi.fn();

vi.mock("@/lib/medusa/config", () => ({
  medusa: { client: { fetch: fetchMock } },
}));

vi.mock("./cookies", () => ({
  getCacheOptions: vi.fn(async () => ({})),
}));

const order = { id: "order_123", email: "test@example.com" };

let orders: typeof OrdersModule;

beforeEach(async () => {
  vi.resetModules();
  fetchMock.mockReset();
  orders = await import("./orders");
});

describe("retrieveOrder", () => {
  it("returns the order from the backend", async () => {
    fetchMock.mockResolvedValueOnce({ order });

    expect(await orders.retrieveOrder("order_123")).toEqual(order);
  });

  it("requests the order by ID with the expected fields", async () => {
    fetchMock.mockResolvedValueOnce({ order });

    await orders.retrieveOrder("order_123");

    expect(fetchMock).toHaveBeenCalledWith(
      "/store/orders/order_123",
      expect.objectContaining({
        query: expect.objectContaining({
          fields: expect.stringContaining("*items"),
        }),
      }),
    );
  });

  it("throws when the order ID is missing", async () => {
    await expect(orders.retrieveOrder("")).rejects.toThrow(
      /Missing order ID/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws a wrapped error when the fetch fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    await expect(orders.retrieveOrder("order_123")).rejects.toThrow(
      /Failed to retrieve order "order_123"/,
    );
  });
});
