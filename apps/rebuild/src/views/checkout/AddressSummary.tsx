import LocalizedClientLink from "@/components/LocalizedClientLink";
import { HttpTypes } from "@medusajs/types";

type AddressSummaryProps = {
  cart: HttpTypes.StoreCart;
};

function AddressSummary({ cart }: AddressSummaryProps) {
  const shipping = cart.shipping_address;
  const billing = cart.billing_address;
  const sameAsBilling =
    shipping?.address_1 === billing?.address_1 &&
    shipping?.postal_code === billing?.postal_code;

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <p className="opacity-70">Contact</p>
          <p>{cart.email}</p>
          <p>{shipping?.phone}</p>
        </div>
      </div>
      <LocalizedClientLink
        href="/checkout?step=address"
        className="link link-hover w-fit text-sm"
      >
        Edit
      </LocalizedClientLink>
    </div>
  );
}

export default AddressSummary;
