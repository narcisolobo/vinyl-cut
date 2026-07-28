import type { IconProps } from "@phosphor-icons/react";
import {
  BellRingingIcon,
  SealCheckIcon,
  TruckIcon,
} from "@phosphor-icons/react/ssr";
import { ComponentType } from "react";

interface Feature {
  id: number;
  icon: ComponentType<IconProps>;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    id: 1,
    icon: SealCheckIcon,
    title: "Real Grading",
    description:
      "No guessing games. Every sleeve and every spin gets graded by hand, so what you see is exactly what lands in your crate.",
  },
  {
    id: 2,
    icon: BellRingingIcon,
    title: "Restock Alerts",
    description:
      "Rare pressings don't sit around. Flag a title and we'll holler the second it's back in the crates.",
  },
  {
    id: 3,
    icon: TruckIcon,
    title: "Ships the West",
    description:
      "We keep it close. Mountain West and Pacific Coast orders land quick, packed tight, no warped corners.",
  },
];

export { features };
