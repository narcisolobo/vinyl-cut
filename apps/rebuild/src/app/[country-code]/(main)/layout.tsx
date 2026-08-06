import { retrieveCart } from "@/lib/data/cart";
import Providers from "@/context/Providers";
import Drawer from "@/navigation/Drawer";
import { type ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

async function MainLayout({ children }: MainLayoutProps) {
  const cart = await retrieveCart();

  return (
    <Providers>
      <Drawer cart={cart}>{children}</Drawer>
    </Providers>
  );
}

export default MainLayout;
