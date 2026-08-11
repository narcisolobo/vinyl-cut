import { HttpTypes } from "@medusajs/types";

type CheckoutStep = "address" | "delivery" | "payment" | "review";

const STEP_ORDER: CheckoutStep[] = ["address", "delivery", "payment", "review"];

/** Shipping and billing addresses, plus email, are all set together by `setAddresses`. */
function isAddressComplete(cart: HttpTypes.StoreCart): boolean {
  return (
    cart.shipping_address != null &&
    cart.billing_address != null &&
    cart.email != null
  );
}

function isDeliveryComplete(cart: HttpTypes.StoreCart): boolean {
  return (cart.shipping_methods?.length ?? 0) > 0;
}

/**
 * A payment session only needs to be initiated (`"pending"`), not
 * confirmed, to count as this step being done — confirmation happens
 * at `placeOrder`.
 */
function isPaymentComplete(cart: HttpTypes.StoreCart): boolean {
  return (
    isDeliveryComplete(cart) &&
    (cart.payment_collection?.payment_sessions?.some(
      (session) => session.status === "pending",
    ) ??
      false)
  );
}

function isReviewReady(cart: HttpTypes.StoreCart): boolean {
  return (
    isAddressComplete(cart) && isDeliveryComplete(cart) && isPaymentComplete(cart)
  );
}

function isStepComplete(step: CheckoutStep, cart: HttpTypes.StoreCart): boolean {
  switch (step) {
    case "address":
      return isAddressComplete(cart);
    case "delivery":
      return isDeliveryComplete(cart);
    case "payment":
      return isPaymentComplete(cart);
    case "review":
      return isReviewReady(cart);
  }
}

/**
 * Resolves the actual active step from the `?step=` search param,
 * clamped to the first incomplete step — a shopper can't jump ahead
 * to a step whose prerequisites aren't done yet by editing the URL,
 * but can always navigate back to any completed step.
 */
function resolveActiveStep(
  requested: string | undefined,
  cart: HttpTypes.StoreCart,
): CheckoutStep {
  const firstIncomplete = STEP_ORDER.find((step) => !isStepComplete(step, cart));
  const ceiling = firstIncomplete ?? "review";

  if (!requested || !STEP_ORDER.includes(requested as CheckoutStep)) {
    return ceiling;
  }

  const requestedIndex = STEP_ORDER.indexOf(requested as CheckoutStep);
  const ceilingIndex = STEP_ORDER.indexOf(ceiling);

  return requestedIndex <= ceilingIndex ? (requested as CheckoutStep) : ceiling;
}

export {
  STEP_ORDER,
  isAddressComplete,
  isDeliveryComplete,
  isPaymentComplete,
  isReviewReady,
  resolveActiveStep,
};
export type { CheckoutStep };
