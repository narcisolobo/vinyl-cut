"use client";

import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";
import Link from "next/link";
import { ShoppingCartIcon } from "@phosphor-icons/react";

function NavMenu() {
  const pathname = usePathname();

  return (
    <ul className="menu menu-horizontal gap-2">
      {navItems.map((link) => {
        const isActive = link.href === pathname;
        return (
          <li key={link.href} className="hidden lg:block">
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
