import { retrieveCartWithInventory } from "@/lib/data/cart";
import Cart from "@/views/cart/Cart";
import { StoreCart } from "@medusajs/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";

const meta = {
  title: "Cart | The Vinyl Cut",
  robots: { index: false },
  description:
    "Review your selected records before checkout — condition, price, and shipping across the Mountain West and Pacific Coast, all in one place.",
};

const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: "https://vinylcut.narcisolobo.com/cart",
    type: "website",
  },
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

export { metadata };
export default CartPage;
