import LocalizedClientLink from "@/components/LocalizedClientLink";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { type ReactNode } from "react";

interface CheckoutLayoutProps {
  children: ReactNode;
}

/**
 * Stripped-down chrome for the checkout flow — no drawer/nav menu,
 * just a back-to-cart link and the wordmark, matching the reference
 * template's minimal checkout header.
 */
function CheckoutLayout({ children }: CheckoutLayoutProps) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-base-300 relative flex h-16 shrink-0 items-center justify-center border-b px-4">
        <LocalizedClientLink
          href="/cart"
          className="btn btn-ghost absolute left-2 gap-1 text-sm"
        >
          <CaretLeftIcon size={16} />
          Back to shopping cart
        </LocalizedClientLink>
        <Link href="/" className="font-brand text-primary text-2xl">
          The Vinyl Cut
        </Link>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default CheckoutLayout;
