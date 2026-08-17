import { formatPrice } from "@/lib/utils/format-price";
import { HttpTypes } from "@medusajs/types";
import Image from "next/image";

type OrderConfirmedItemsProps = {
  order: HttpTypes.StoreOrder;
};

function OrderConfirmedItems({ order }: OrderConfirmedItemsProps) {
  const currencyCode = order.currency_code;

  return (
    <div className="flex flex-col gap-4">
      {order.items?.map((item) => (
        <div key={item.id} className="flex gap-4">
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
            <h3 className="line-clamp-2 text-sm font-semibold">
              {item.title}
            </h3>
            <p className="text-xs opacity-70">
              Condition: {item.variant?.title}
            </p>
            <p className="text-xs opacity-70">Qty: {item.quantity}</p>
          </div>
          <div className="text-sm font-semibold">
            {formatPrice({ amount: item.total, currencyCode })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default OrderConfirmedItems;
