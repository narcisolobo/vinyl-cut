"use client";

import { useParams, usePathname } from "next/navigation";
import { useDrawer } from "@/hooks/use-drawer";
import { navItems } from "./nav-items";
import Link from "@/components/LocalizedClientLink";

function DrawerMenu() {
  const { closeDrawer } = useDrawer();
  const pathname = usePathname();

  const { "country-code": countryCode } = useParams() as {
    "country-code": string;
  };
  const pathWithoutCountryCode =
    pathname.replace(new RegExp(`^/${countryCode}`), "") || "/";

  return (
    <ul className="menu bg-base-200 min-h-full w-80 p-4 text-lg">
      {navItems.map((link) => {
        const isActive = link.href === pathWithoutCountryCode;

        return (
          <li key={link.href} className="uppercase">
            <Link
              href={link.href}
              onClick={closeDrawer}
              className={`link-primary ${isActive ? "menu-active" : ""}`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default DrawerMenu;
