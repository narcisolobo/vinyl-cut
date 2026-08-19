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
 * Stripe sessions stay `"pending"` from initiation straight through
 * client-side confirmation — this project has no webhook wired up
 * locally to flip that status, so `session.status` can't distinguish
 * "just initiated" from "card confirmed." Completion is tracked
 * instead via this cart metadata flag, set by `PaymentMethodForm`
 * once `stripe.confirmPayment` actually succeeds.
 */
const STRIPE_PAYMENT_CONFIRMED_METADATA_KEY = "stripe_payment_confirmed";

function isPaymentComplete(cart: HttpTypes.StoreCart): boolean {
  return (
    isDeliveryComplete(cart) &&
    cart.metadata?.[STRIPE_PAYMENT_CONFIRMED_METADATA_KEY] === true
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

/** Medusa's payment provider API returns only an `id` — no display name — so labels are mapped by hand. */
const PAYMENT_PROVIDER_LABELS: Record<string, string> = {
  pp_system_default: "Manual Payment (Test Mode)",
  pp_stripe_stripe: "Credit Card",
};

function getPaymentProviderLabel(providerId: string): string {
  return PAYMENT_PROVIDER_LABELS[providerId] ?? providerId;
}

export {
  STEP_ORDER,
  STRIPE_PAYMENT_CONFIRMED_METADATA_KEY,
  isAddressComplete,
  isDeliveryComplete,
  isPaymentComplete,
  isReviewReady,
  resolveActiveStep,
  getPaymentProviderLabel,
};
export type { CheckoutStep };
