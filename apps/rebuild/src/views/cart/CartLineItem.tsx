import LocalizedClientLink from "@/components/LocalizedClientLink";
import { formatPrice } from "@/lib/utils/format-price";
import { HttpTypes } from "@medusajs/types";
import Image from "next/image";
import CartItemQuantitySelect from "./CartItemQuantitySelect";
import RemoveLineItemButton from "./RemoveLineItemButton";

type CartLineItemProps = {
  item: HttpTypes.StoreCartLineItem;
  currencyCode: string;
};

function CartLineItem({ item, currencyCode }: CartLineItemProps) {
  return (
    <tr>
      <td className="w-24">
        <LocalizedClientLink
          href={`/albums/${item.product_handle}`}
          className="relative block aspect-square w-20"
        >
          <Image
            src={item.thumbnail!}
            alt={item.title}
            className="rounded-box absolute inset-0 object-cover object-center"
            quality={75}
            sizes="80px"
            fill
          />
        </LocalizedClientLink>
      </td>
      <td>
        <h3 className="text-sm font-semibold">
          <LocalizedClientLink href={`/albums/${item.product_handle}`}>
            {item.title}
          </LocalizedClientLink>
        </h3>
        <p className="text-xs opacity-70">Condition: {item.variant?.title}</p>
      </td>
      <td>
        <div className="flex items-center gap-3">
          <CartItemQuantitySelect
            lineId={item.id}
            quantity={item.quantity}
            item={item}
          />
          <RemoveLineItemButton lineId={item.id} />
        </div>
      </td>
      <td className="hidden sm:table-cell">
        {formatPrice({ amount: item.unit_price, currencyCode })}
      </td>
      <td className="text-right">
        {formatPrice({ amount: item.total ?? 0, currencyCode })}
      </td>
    </tr>
  );
}

export default CartLineItem;
