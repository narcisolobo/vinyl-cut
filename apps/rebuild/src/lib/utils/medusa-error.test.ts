import { describe, expect, it, vi } from "vitest";
import { medusaError } from "./medusa-error";

describe("medusaError", () => {
  it("throws the capitalized, period-terminated response message", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() =>
      medusaError({
        config: { url: "/store/carts/1", baseURL: "http://localhost:9000" },
        response: {
          data: { message: "cart not found" },
          status: 404,
          headers: {},
        },
      }),
    ).toThrow("Cart not found.");

    expect(consoleError).toHaveBeenCalledWith(
      "Resource:",
      "http://localhost:9000/store/carts/1",
    );
    expect(consoleError).toHaveBeenCalledWith("Status code:", 404);

    consoleError.mockRestore();
  });

  it("falls back to stringifying the response data when it has no message", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      medusaError({
        config: { url: "/store/carts/1", baseURL: "http://localhost:9000" },
        response: { data: {}, status: 500, headers: {} },
      }),
    ).toThrow("[object Object].");

    vi.restoreAllMocks();
  });

  it("capitalizes a plain-string response body", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      medusaError({
        config: { url: "/store/carts/1", baseURL: "http://localhost:9000" },
        response: { data: "not found", status: 404, headers: {} },
      }),
    ).toThrow("Not found.");

    vi.restoreAllMocks();
  });

  it("throws with the raw request info when no response was received", () => {
    expect(() =>
      medusaError({ request: "GET /store/carts/1" }),
    ).toThrow("No response received: GET /store/carts/1");
  });

  it("throws with the original message when the request was never sent", () => {
    expect(() => medusaError({ message: "boom" })).toThrow(
      "Error setting up the request: boom",
    );
  });

  it("throws with the original message for a non-Error thrown value", () => {
    expect(() => medusaError("boom")).toThrow(
      "Error setting up the request: undefined",
    );
  });

  // Documents current behavior, not intended behavior — see the discussion
  // in the accompanying chat message about this being a real gap.
  it("throws an unrelated TypeError, not the normalized message, when a response error has no `config`", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      medusaError({
        response: { data: { message: "boom" }, status: 500, headers: {} },
      }),
    ).toThrow("Invalid URL");

    vi.restoreAllMocks();
  });
});
