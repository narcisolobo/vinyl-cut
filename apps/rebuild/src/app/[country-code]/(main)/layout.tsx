import DrawerProvider from "@/context/DrawerProvider";
import Drawer from "@/navigation/Drawer";
import { type ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  return (
    <DrawerProvider>
      <Drawer>{children}</Drawer>
    </DrawerProvider>
  );
}

export default MainLayout;
