import Divider from "@/components/Divider";
import LocalizedClientLink from "@/components/LocalizedClientLink";
import { formatPrice } from "@/lib/utils/format-price";
import { Fragment } from "react";
import type { CartWithItems } from "./types";
import Image from "next/image";
import RemoveLineItemButton from "./RemoveLineItemButton";

interface CartDropdownItemsProps {
  cartState: CartWithItems;
}

function CartDropdownItems({ cartState }: CartDropdownItemsProps) {
  return (
    <Fragment>
      <div className="no-scrollbar grid max-h-full grid-cols-1 gap-y-8 overflow-y-scroll">
        {cartState.items
          .sort((a, b) => {
            return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1;
          })
          .map((item) => (
            <div className="grid grid-cols-[122px_1fr] gap-x-4" key={item.id}>
              <LocalizedClientLink
                href={`/store/${item.product_handle}`}
                className="relative aspect-square w-24"
              >
                <Image
                  src={item.thumbnail!}
                  alt={item.title}
                  className="rounded-box absolute inset-0 object-cover object-center"
                  draggable={false}
                  quality={50}
                  sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                  fill
                />
              </LocalizedClientLink>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="truncate text-sm font-semibold">
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                          data-testid="product-link"
                        >
                          {item.title}
                        </LocalizedClientLink>
                      </h3>
                      <span className="text-xs opacity-70">
                        Condition: {item.variant?.title}
                      </span>
                      <span
                        className="text-xs opacity-70"
                        data-testid="cart-item-quantity"
                        data-value={item.quantity}
                      >
                        Quantity: {item.quantity}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">
                      {formatPrice({
                        amount: item.total ?? 0,
                        currencyCode: cartState.currency_code,
                      })}
                    </span>
                  </div>
                </div>
                <RemoveLineItemButton lineId={item.id} />
              </div>
            </div>
          ))}
      </div>
      <div className="flex flex-col gap-y-4">
        <Divider />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            Subtotal{" "}
            <span className="font-normal opacity-70">(excl. taxes)</span>
          </span>
          <span
            className="text-lg font-semibold"
            data-testid="cart-subtotal"
            data-value={cartState.subtotal ?? 0}
          >
            {formatPrice({
              amount: cartState.subtotal ?? 0,
              currencyCode: cartState.currency_code,
            })}
          </span>
        </div>
        <LocalizedClientLink
          href="/cart"
          className="btn btn-accent w-full uppercase"
          data-testid="go-to-cart-button"
        >
          Go to Cart
        </LocalizedClientLink>
      </div>
    </Fragment>
  );
}

export default CartDropdownItems;
