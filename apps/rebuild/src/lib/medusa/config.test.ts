import { afterEach, describe, expect, it, vi } from "vitest";

describe("medusa config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("throws when NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY", "");

    await expect(import("./config")).rejects.toThrow(
      /NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY/,
    );
  });

  it("builds an sdk client when the publishable key is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY", "pk_test_123");

    const { medusa } = await import("./config");

    expect(medusa.client.fetch).toBeTypeOf("function");
  });
});
