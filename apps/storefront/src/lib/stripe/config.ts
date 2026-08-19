import { loadStripe } from "@stripe/stripe-js";

if (!process.env.NEXT_PUBLIC_STRIPE_KEY) {
  throw new Error(
    "config.ts: Did you define a NEXT_PUBLIC_STRIPE_KEY environment variable?",
  );
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);

export { stripePromise };
