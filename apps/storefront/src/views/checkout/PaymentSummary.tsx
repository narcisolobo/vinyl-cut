import LocalizedClientLink from "@/components/LocalizedClientLink";
import { HttpTypes } from "@medusajs/types";
import { getPaymentProviderLabel } from "./types";

type PaymentSummaryProps = {
  cart: HttpTypes.StoreCart;
};

function PaymentSummary({ cart }: PaymentSummaryProps) {
  const session = cart.payment_collection?.payment_sessions?.at(-1);

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <p className="opacity-70">Payment Method</p>
        <p className="font-semibold">
          {session && getPaymentProviderLabel(session.provider_id)}
        </p>
      </div>
      <LocalizedClientLink
        href="/checkout?step=payment"
        className="link link-hover w-fit text-sm"
      >
        Edit
      </LocalizedClientLink>
    </div>
  );
}

export default PaymentSummary;
