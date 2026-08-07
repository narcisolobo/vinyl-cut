import { HttpTypes } from "@medusajs/types";
import CartEmpty from "./CartEmpty";
import CartItemsTable from "./CartItemsTable";
import CartSummary from "./CartSummary";
import { hasItems } from "./types";

interface CartProps {
  cart: HttpTypes.StoreCart | null;
}

function Cart({ cart }: CartProps) {
  return (
    <section className="mx-auto w-full max-w-7xl flex-1 px-8 pt-24 pb-16">
      <h1 className="mb-6 text-3xl font-semibold">Cart</h1>
      {hasItems(cart) ? (
        <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-[1fr_320px]">
          <CartItemsTable cartState={cart} />
          <CartSummary cartState={cart} />
        </div>
      ) : (
        <CartEmpty />
      )}
    </section>
  );
}

export default Cart;
