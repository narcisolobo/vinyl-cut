import { ComponentType } from "react";
import { type IconProps } from "@phosphor-icons/react";
import {
  DoorOpenIcon,
  ScalesIcon,
  SealCheckIcon,
} from "@phosphor-icons/react/ssr";

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
    title: "Fifty Years, Combined",
    description:
      "Our graders have been doing this since before grading scales had names. If it's real, we'll know it on sight.",
  },
  {
    id: 2,
    icon: ScalesIcon,
    title: "Fair Offers, No Games",
    description:
      "Cash or store credit — your call. We grade it the same way we grade what's on our shelves: honestly.",
  },
  {
    id: 3,
    icon: DoorOpenIcon,
    title: "Walk-Ins Welcome",
    description:
      "No appointment necessary. Bring a shoebox or a whole collection — we'll make time either way.",
  },
];

export { features };
