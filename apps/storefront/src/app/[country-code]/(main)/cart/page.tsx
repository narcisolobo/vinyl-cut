import { retrieveCartWithInventory } from "@/lib/data/cart";
import Cart from "@/views/cart/Cart";
import { StoreCart } from "@medusajs/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Cart | The Vinyl Cut",
  robots: { index: false },
  description:
    "Review your selected records before checkout — condition, price, and shipping across the Mountain West and Pacific Coast, all in one place.",
};

async function CartPage() {
  let cart: StoreCart | null = null;

  try {
    cart = await retrieveCartWithInventory();
  } catch (error) {
    console.error(error);
    return notFound();
  }

  return <Cart cart={cart} />;
}

export default CartPage;
