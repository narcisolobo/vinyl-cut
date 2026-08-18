import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

vi.mock("@/lib/medusa/config", () => ({
  medusa: { client: { fetch: fetchMock } },
}));

import { subscribeToRestock } from "./restock-subscriptions";
import type { RestockSubscriptionState } from "./restock-subscription-schema";

const idleState: RestockSubscriptionState = {
  status: "idle",
  emailError: null,
  formError: null,
};

function buildFormData(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe("subscribeToRestock", () => {
  it("subscribes and returns a success state on valid input", async () => {
    fetchMock.mockResolvedValueOnce(undefined);

    const formData = buildFormData({
      variant_id: "variant_123",
      email: "ada@example.com",
    });

    const result = await subscribeToRestock(idleState, formData);

    expect(fetchMock).toHaveBeenCalledWith("/store/restock-subscriptions", {
      method: "POST",
      body: { variant_id: "variant_123", email: "ada@example.com" },
      headers: { accept: "text/plain" },
    });
    expect(result).toEqual({
      status: "success",
      emailError: null,
      formError: null,
    });
  });

  it("rejects an invalid email without calling the backend", async () => {
    const formData = buildFormData({
      variant_id: "variant_123",
      email: "not-an-email",
    });

    const result = await subscribeToRestock(idleState, formData);

    expect(result.status).toBe("error");
    expect(result.emailError).toEqual("Enter a valid email address.");
    expect(result.formError).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a missing email without calling the backend", async () => {
    const formData = buildFormData({ variant_id: "variant_123" });

    const result = await subscribeToRestock(idleState, formData);

    expect(result.status).toBe("error");
    expect(result.emailError).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a form error, not an email error, when the variant ID is missing", async () => {
    const formData = buildFormData({ email: "ada@example.com" });

    const result = await subscribeToRestock(idleState, formData);

    expect(result).toEqual({
      status: "error",
      emailError: null,
      formError: "restock-subscriptions.ts: Missing or invalid variant.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("soft-fails into formError when the backend request throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const formData = buildFormData({
      variant_id: "variant_123",
      email: "ada@example.com",
    });

    const result = await subscribeToRestock(idleState, formData);

    expect(result).toEqual({
      status: "error",
      emailError: null,
      formError: "Something went wrong — please try again.",
    });
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});
