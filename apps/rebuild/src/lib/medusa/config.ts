import Medusa from "@medusajs/js-sdk";

// Defaults to standard port for Medusa server
const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";

if (!process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
  throw new Error(
    "config.ts: Did you define a NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY environment variable?",
  );
}

export const medusa = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
});
