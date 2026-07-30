interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Sell Your Records", href: "/sell" },
  { label: "Shipping & Returns", href: "/shipping" },
  { label: "Store", href: "/store" },
];

export { navItems };
