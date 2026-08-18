"use client";

import Link from "@/components/LocalizedClientLink";
import CartButton from "@/views/cart/CartButton";
import { HttpTypes } from "@medusajs/types";
import { useParams, usePathname } from "next/navigation";
import { navItems } from "./nav-items";

interface NavMenuProps {
  cart: HttpTypes.StoreCart | null;
}

function NavMenu({ cart }: NavMenuProps) {
  const pathname = usePathname();

  const { "country-code": countryCode } = useParams() as {
    "country-code": string;
  };
  const pathWithoutCountryCode =
    pathname.replace(new RegExp(`^/${countryCode}`), "") || "/";

  return (
    <div className="flex items-center gap-2">
      <ul className="menu menu-horizontal gap-2">
        {navItems.map((link) => {
          const isActive = link.href === pathWithoutCountryCode;
          return (
            <li key={link.href} className="hidden uppercase lg:block">
              <Link href={link.href} className={isActive ? "menu-active" : ""}>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <CartButton cart={cart} />
    </div>
  );
}

export default NavMenu;
