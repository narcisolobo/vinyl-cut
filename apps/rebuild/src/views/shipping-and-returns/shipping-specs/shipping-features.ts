import { ComponentType } from "react";
import { type IconProps } from "@phosphor-icons/react";
import { TruckIcon, PackageIcon } from "@phosphor-icons/react/ssr";

interface Feature {
  id: number;
  icon: ComponentType<IconProps>;
  title: string;
  description: string;
  className?: string;
}

const features: Feature[] = [
  {
    id: 1,
    icon: TruckIcon,
    title: "Delivery Estimates",
    description:
      "Most orders arrive within 3–5 business days of shipping. You'll get a shipping confirmation the moment your order's packed.",
    className: "mb-6",
  },
  {
    id: 2,
    icon: PackageIcon,
    title: "Packing",
    description:
      "Every record ships in a rigid mailer, padded corners, no exceptions — new pressing or used find, doesn't matter.",
  },
];

export { features };
