import LocalizedClientLink from "@/components/LocalizedClientLink";
import { formatPrice } from "@/lib/utils/format-price";
import { HttpTypes } from "@medusajs/types";

type ShippingSummaryProps = {
  cart: HttpTypes.StoreCart;
};

function ShippingSummary({ cart }: ShippingSummaryProps) {
  const method = cart.shipping_methods?.at(-1);

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <p className="opacity-70">Delivery Method</p>
        <p className="font-semibold">{method?.name}</p>
        {method && (
          <p>
            {formatPrice({
              amount: method.amount,
              currencyCode: cart.currency_code,
            })}
          </p>
        )}
      </div>
      <LocalizedClientLink
        href="/checkout?step=delivery"
        className="link link-hover w-fit text-sm"
      >
        Edit
      </LocalizedClientLink>
    </div>
  );
}

export default ShippingSummary;
