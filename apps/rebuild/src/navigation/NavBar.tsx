import Link from "next/link";
import DrawerTrigger from "./DrawerTrigger";
import NavMenu from "./NavMenu";

function NavBar() {
  return (
    <div className="bg-base-200 fixed top-0 z-10 w-full shadow-sm transition-all duration-300 ease-in-out">
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
