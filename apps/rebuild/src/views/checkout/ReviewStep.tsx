import { HttpTypes } from "@medusajs/types";
import { cn } from "@/lib/utils/cn";
import PlaceOrderButton from "./PlaceOrderButton";
import { isReviewReady } from "./types";

type ReviewStepProps = {
  cart: HttpTypes.StoreCart;
  isOpen: boolean;
};

function ReviewStep({ cart, isOpen }: ReviewStepProps) {
  const isReady = isReviewReady(cart);

  return (
    <section className="flex flex-col gap-4">
      <h2
        className={cn(
          "flex items-center gap-2 text-2xl font-semibold",
          !isReady && "pointer-events-none opacity-50 select-none",
        )}
      >
        Review
      </h2>
      {isOpen && isReady && (
        <div className="flex flex-col gap-4">
          <p className="text-sm opacity-70">
            By placing your order, you agree to The Vinyl Cut&apos;s Terms of
            Service and Privacy Policy.
          </p>
          <PlaceOrderButton cartId={cart.id} />
        </div>
      )}
    </section>
  );
}

export default ReviewStep;
