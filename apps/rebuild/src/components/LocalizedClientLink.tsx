"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactNode } from "react";

/**
 * Use this component to create a Next.js `<Link />` that persists the current country code in the url,
 * without having to explicitly pass it as a prop.
 */

interface LocalizedClientLinkProps {
  children: ReactNode;
  href: string;
  className?: string;
  onClick?: () => void;
  passHref?: true;
  [x: string]: unknown;
}

function LocalizedClientLink({
  children,
  href,
  ...props
}: LocalizedClientLinkProps) {
  const { "country-code": countryCode } = useParams() ?? {};

  return (
    <Link href={`/${countryCode}${href}`} {...props}>
      {children}
    </Link>
  );
}

export default LocalizedClientLink;
