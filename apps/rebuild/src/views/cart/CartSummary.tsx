import Divider from "@/components/Divider";
import LocalizedClientLink from "@/components/LocalizedClientLink";
import { formatPrice } from "@/lib/utils/format-price";
import type { CartWithItems } from "./types";

type CartSummaryProps = {
  cartState: CartWithItems;
};

function CartSummary({ cartState }: CartSummaryProps) {
  const currencyCode = cartState.currency_code;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Summary</h2>
      <Divider />
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal (excl. shipping and taxes)</span>
          <span>
            {formatPrice({
              amount: cartState.item_subtotal ?? 0,
              currencyCode,
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>
            {formatPrice({
              amount: cartState.shipping_subtotal ?? 0,
              currencyCode,
            })}
          </span>
        </div>
        {!!cartState.discount_total && (
          <div className="text-primary flex justify-between">
            <span>Discount</span>
            <span>
              -
              {formatPrice({
                amount: cartState.discount_total,
                currencyCode,
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Taxes</span>
          <span>
            {formatPrice({ amount: cartState.tax_total ?? 0, currencyCode })}
          </span>
        </div>
      </div>
      <Divider />
      <div className="flex justify-between text-lg font-semibold">
        <span>Total</span>
        <span>
          {formatPrice({ amount: cartState.total ?? 0, currencyCode })}
        </span>
      </div>
      <LocalizedClientLink
        href="/checkout"
        className="btn btn-accent w-full uppercase"
      >
        Go to Checkout
      </LocalizedClientLink>
    </div>
  );
}

export default CartSummary;
