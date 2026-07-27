import Link from "next/link";
import DrawerTrigger from "./DrawerTrigger";
import { ShoppingCartIcon } from "@phosphor-icons/react";

function NavBar() {
  return (
    <div className="bg-base-100 fixed top-0 w-full shadow-sm">
      <div className="relative flex min-h-16 items-center justify-between p-2">
        <div className="flex-1">
          <div className="flex items-center">
            <DrawerTrigger />
            <Link
              href="/"
              className="font-brand text-accent btn btn-ghost text-4xl"
            >
              Vinyl Cut
            </Link>
          </div>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal gap-2">
            <li>
              <button className="btn btn-ghost">
                <ShoppingCartIcon size={24} />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default NavBar;
