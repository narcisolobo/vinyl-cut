import Divider from "@/components/Divider";
import { formatPrice } from "@/lib/utils/format-price";
import { getPaymentProviderLabel } from "@/views/checkout/types";
import { HttpTypes } from "@medusajs/types";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import OrderConfirmedItems from "./OrderConfirmedItems";

type OrderConfirmedProps = {
  order: HttpTypes.StoreOrder;
};

function OrderConfirmed({ order }: OrderConfirmedProps) {
  const currencyCode = order.currency_code;
  const shipping = order.shipping_address;
  const billing = order.billing_address;
  const sameAsBilling =
    shipping?.address_1 === billing?.address_1 &&
    shipping?.postal_code === billing?.postal_code;
  const shippingMethod = order.shipping_methods?.at(-1);
  const payment = order.payment_collections?.at(0)?.payments?.at(-1);
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pt-24 pb-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <CheckCircleIcon className="text-success" size={48} weight="fill" />
        <h1 className="text-3xl font-semibold">Thank you for your order!</h1>
        <p className="opacity-70">
          Order #{order.display_id} · {orderDate}
        </p>
        <p className="opacity-70">
          A confirmation has been sent to {order.email}
        </p>
      </div>

      <Divider />

      <div>
        <h2 className="mb-4 text-2xl font-semibold">Items</h2>
        <OrderConfirmedItems order={order} />
      </div>

      <Divider />

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal (excl. shipping and taxes)</span>
          <span>
            {formatPrice({
              amount: order.item_subtotal ?? 0,
              currencyCode,
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>
            {formatPrice({
              amount: order.shipping_subtotal ?? 0,
              currencyCode,
            })}
          </span>
        </div>
        {!!order.discount_total && (
          <div className="text-primary flex justify-between">
            <span>Discount</span>
            <span>
              -
              {formatPrice({
                amount: order.discount_total,
                currencyCode,
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Taxes</span>
          <span>
            {formatPrice({ amount: order.tax_total ?? 0, currencyCode })}
          </span>
        </div>
      </div>
      <Divider />
      <div className="flex justify-between text-lg font-semibold">
        <span>Total</span>
        <span>{formatPrice({ amount: order.total ?? 0, currencyCode })}</span>
      </div>

      <Divider />

      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="opacity-70">Shipping Address</p>
          <p className="font-semibold">
            {shipping?.first_name} {shipping?.last_name}
          </p>
          <p>{shipping?.address_1}</p>
          <p>
            {shipping?.city}, {shipping?.province?.toUpperCase()}{" "}
            {shipping?.postal_code}
          </p>
        </div>
        <div>
          <p className="opacity-70">Billing Address</p>
          <p>
            {sameAsBilling ? "Same as shipping address" : billing?.address_1}
          </p>
        </div>
        <div>
          <p className="opacity-70">Delivery & Payment</p>
          <p>{shippingMethod?.name}</p>
          {payment && <p>{getPaymentProviderLabel(payment.provider_id)}</p>}
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmed;
