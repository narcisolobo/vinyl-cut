import Divider from "@/components/Divider";
import { formatPrice } from "@/lib/utils/format-price";
import { HttpTypes } from "@medusajs/types";
import CheckoutLineItem from "./CheckoutLineItem";

type CheckoutSummaryProps = {
  cart: HttpTypes.StoreCart;
};

function CheckoutSummary({ cart }: CheckoutSummaryProps) {
  const currencyCode = cart.currency_code;

  return (
    <div className="sticky top-8 flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Summary</h2>
      <Divider />
      <div className="flex flex-col gap-4">
        {cart.items?.map((item) => (
          <CheckoutLineItem
            key={item.id}
            item={item}
            currencyCode={currencyCode}
          />
        ))}
      </div>
      <Divider />
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal (excl. shipping and taxes)</span>
          <span>
            {formatPrice({
              amount: cart.item_subtotal ?? 0,
              currencyCode,
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>
            {formatPrice({
              amount: cart.shipping_subtotal ?? 0,
              currencyCode,
            })}
          </span>
        </div>
        {!!cart.discount_total && (
          <div className="text-primary flex justify-between">
            <span>Discount</span>
            <span>
              -
              {formatPrice({
                amount: cart.discount_total,
                currencyCode,
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Taxes</span>
          <span>
            {formatPrice({ amount: cart.tax_total ?? 0, currencyCode })}
          </span>
        </div>
      </div>
      <Divider />
      <div className="flex justify-between text-lg font-semibold">
        <span>Total</span>
        <span>{formatPrice({ amount: cart.total ?? 0, currencyCode })}</span>
      </div>
    </div>
  );
}

export default CheckoutSummary;
