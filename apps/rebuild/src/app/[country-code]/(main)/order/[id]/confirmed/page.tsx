import { retrieveOrder } from "@/lib/data/orders";
import OrderConfirmed from "@/views/order/OrderConfirmed";
import { HttpTypes } from "@medusajs/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";

const metadata: Metadata = {
  title: "Order Confirmed | The Vinyl Cut",
  robots: { index: false },
};

interface OrderConfirmedPageProps {
  params: Promise<{ "country-code": string; id: string }>;
}

async function OrderConfirmedPage({ params }: OrderConfirmedPageProps) {
  const { id } = await params;

  let order: HttpTypes.StoreOrder;

  try {
    order = await retrieveOrder(id);
  } catch (error) {
    console.error(error);
    return notFound();
  }

  return <OrderConfirmed order={order} />;
}

export { metadata };
export default OrderConfirmedPage;
