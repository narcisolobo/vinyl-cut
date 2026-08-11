import type { CartWithItems } from "./types";
import CartLineItem from "./CartLineItem";

type CartItemsTableProps = {
  cartState: CartWithItems;
};

function CartItemsTable({ cartState }: CartItemsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th className="hidden sm:table-cell"></th>
            <th>Item</th>
            <th>Quantity</th>
            <th className="hidden sm:table-cell">Price</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {cartState.items
            .sort((a, b) => {
              return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1;
            })
            .map((item) => (
              <CartLineItem
                key={item.id}
                item={item}
                currencyCode={cartState.currency_code}
              />
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default CartItemsTable;
