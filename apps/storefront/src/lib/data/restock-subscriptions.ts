"use server";

import { medusa } from "@/lib/medusa/config";
import {
  RestockSubscriptionSchema,
  type RestockSubscriptionState,
} from "./restock-subscription-schema";

/**
 * Soft-fails into `formError` rather than throwing — a failed
 * subscribe is low blast radius, the modal just shows an inline
 * error instead of breaking the PDP. `medusaError()` isn't used here
 * since it's built for hard-throw call sites.
 */
async function subscribeToRestock(
  _prevState: RestockSubscriptionState,
  formData: FormData,
): Promise<RestockSubscriptionState> {
  const parsed = RestockSubscriptionSchema.safeParse({
    variant_id: formData.get("variant_id"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    const emailIssue = parsed.error.issues.find(
      (issue) => issue.path[0] === "email",
    );
    return emailIssue
      ? { status: "error", emailError: emailIssue.message, formError: null }
      : {
          status: "error",
          emailError: null,
          formError: "restock-subscriptions.ts: Missing or invalid variant.",
        };
  }

  try {
    // The route responds with `res.sendStatus(201)` — a plain-text
    // body ("Created"), not JSON. Overriding `accept` here stops the
    // SDK from trying (and failing) to `JSON.parse` it; we only care
    // that the request didn't throw.
    await medusa.client.fetch("/store/restock-subscriptions", {
      method: "POST",
      body: parsed.data,
      headers: { accept: "text/plain" },
    });
  } catch (error) {
    console.error(
      "restock-subscriptions.ts: Failed to create restock subscription.",
      error,
    );
    return {
      status: "error",
      emailError: null,
      formError: "Something went wrong — please try again.",
    };
  }

  return { status: "success", emailError: null, formError: null };
}

export { subscribeToRestock };
