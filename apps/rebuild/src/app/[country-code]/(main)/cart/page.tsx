import { retrieveCart } from "@/lib/data/cart";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Cart | The Vinyl Cut",
  robots: { index: false },
  description:
    "Review your selected records before checkout — condition, price, and shipping across the Mountain West and Pacific Coast, all in one place.",
};

async function CartPage() {
  try {
    const cart = await retrieveCart();
  } catch (error) {
    console.error(error);
    return notFound();
  }

  return <div />;
}

export default CartPage;
