"use client";

import Link from "@/components/LocalizedClientLink";
import { ShoppingCartIcon } from "@phosphor-icons/react";
import { useParams, usePathname } from "next/navigation";
import { navItems } from "./nav-items";

function NavMenu() {
  const pathname = usePathname();

  const { "country-code": countryCode } = useParams() as {
    "country-code": string;
  };
  const pathWithoutCountryCode =
    pathname.replace(new RegExp(`^/${countryCode}`), "") || "/";

  return (
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
      <li>
        <button className="btn btn-ghost">
          <ShoppingCartIcon size={24} />
        </button>
      </li>
    </ul>
  );
}

export default NavMenu;
