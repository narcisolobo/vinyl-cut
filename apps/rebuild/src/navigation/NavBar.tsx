"use client";

import Link from "next/link";
import DrawerTrigger from "./DrawerTrigger";
import NavMenu from "./NavMenu";
import { useEffect, useState } from "react";

const SCROLL_THRESHOLD_PX = 64;

function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed top-0 z-10 w-full transition-all duration-300 ease-in-out ${
        isScrolled ? "bg-base-100 shadow-sm" : "bg-transparent shadow-none"
      }`}
    >
      <div className="relative flex min-h-16 items-center justify-between p-2">
        <div className="flex-1">
          <div className="flex items-center">
            <DrawerTrigger />
            <Link
              href="/"
              className="font-brand text-accent btn btn-ghost text-4xl"
            >
              The Vinyl Cut
            </Link>
          </div>
        </div>
        <div className="flex-none">
          <NavMenu />
        </div>
      </div>
    </div>
  );
}

export default NavBar;
