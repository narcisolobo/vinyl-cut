import Providers from "@/context/Providers";
import Drawer from "@/navigation/Drawer";
import { type ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  return (
    <Providers>
      <Drawer>{children}</Drawer>
    </Providers>
  );
}

export default MainLayout;
