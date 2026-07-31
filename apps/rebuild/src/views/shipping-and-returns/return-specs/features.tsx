import { ComponentType, Fragment, ReactNode } from "react";
import GradingGuideButton from "@/components/GradingGuide/GradingGuideButton";
import { type IconProps } from "@phosphor-icons/react";
import {
  SealCheckIcon,
  ShieldCheckIcon,
  ArrowUUpLeftIcon,
} from "@phosphor-icons/react/ssr";

interface Feature {
  id: number;
  icon: ComponentType<IconProps>;
  title: string;
  description: ReactNode;
}

const features: Feature[] = [
  {
    id: 1,
    icon: SealCheckIcon,
    title: "Used Records",
    description: (
      <Fragment>
        We inspect and grade every used record by hand before it hits the shelf
        (see our <GradingGuideButton label="Grading Guide" />
        ), so what&apos;s listed is what you&apos;re getting — no surprises, no
        returns for condition once it&apos;s left our hands.
      </Fragment>
    ),
  },
  {
    id: 2,
    icon: ShieldCheckIcon,
    title: "Damaged in Transit",
    description:
      "A different story. If something arrives cracked, warped, or otherwise worse than what we shipped, tell us within 7 days and we'll make it right — replacement if we've got another copy, refund if we don't.",
  },
  {
    id: 3,
    icon: ArrowUUpLeftIcon,
    title: "New Pressings",
    description:
      "Can be returned unopened within 14 days for a full refund. Once the shrink wrap's off, it's yours — same as any record shop.",
  },
];

export { features };
