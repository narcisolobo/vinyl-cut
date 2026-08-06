import { HttpTypes } from "@medusajs/types";

type CartWithItems = HttpTypes.StoreCart & {
  items: NonNullable<HttpTypes.StoreCart["items"]>;
};

export type { CartWithItems };
