import Link from "next/link";
import DrawerTrigger from "./DrawerTrigger";
import NavMenu from "./NavMenu";
import { HttpTypes } from "@medusajs/types";

interface NavBarProps {
  cart: HttpTypes.StoreCart | null;
}

function NavBar({ cart }: NavBarProps) {
  return (
    <div
      className="bg-base-200 fixed top-0 z-30 w-full shadow-sm transition-all duration-300 ease-in-out"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="relative flex min-h-16 items-center justify-between p-2">
        <div className="flex-1">
          <div className="flex items-center">
            <DrawerTrigger />
            <Link
              href="/"
              className="font-brand text-primary btn btn-ghost text-shadow-logo text-4xl"
            >
              The Vinyl Cut
            </Link>
          </div>
        </div>
        <div className="flex-none">
          <NavMenu cart={cart} />
        </div>
      </div>
    </div>
  );
}

export default NavBar;
