import { HttpTypes } from "@medusajs/types";

interface CartProps {
  cart: HttpTypes.StoreCart | null;
}

function Cart({ cart }: CartProps) {
  return <section className="mx-auto max-w-5xl px-8 pt-24 pb-16"></section>;
}

export default Cart;
