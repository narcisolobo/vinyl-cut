import { formatPrice } from "@/lib/utils/format-price";
import { HttpTypes } from "@medusajs/types";
import Image from "next/image";

type CheckoutLineItemProps = {
  item: HttpTypes.StoreCartLineItem;
  currencyCode: string;
};

function CheckoutLineItem({ item, currencyCode }: CheckoutLineItemProps) {
  return (
    <div className="flex gap-4">
      <div className="relative aspect-square w-16 shrink-0">
        <Image
          src={item.thumbnail!}
          alt={item.title}
          className="rounded-box absolute inset-0 object-cover object-center"
          quality={75}
          sizes="64px"
          fill
        />
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <h3 className="line-clamp-2 text-sm font-semibold">{item.title}</h3>
        <p className="text-xs opacity-70">Condition: {item.variant?.title}</p>
        <p className="text-xs opacity-70">Qty: {item.quantity}</p>
      </div>
      <div className="text-sm font-semibold">
        {formatPrice({ amount: item.total ?? 0, currencyCode })}
      </div>
    </div>
  );
}

export default CheckoutLineItem;
