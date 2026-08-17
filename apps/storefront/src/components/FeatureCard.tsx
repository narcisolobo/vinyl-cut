import type { IconProps } from "@phosphor-icons/react";
import { ReactNode, type ComponentType } from "react";
import { cn } from "@/lib/utils/cn";

interface FeatureCardProps {
  icon: ComponentType<IconProps>;
  title: string;
  description: string | ReactNode;
  orientation?: "vertical" | "horizontal";
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  orientation = "vertical",
}: FeatureCardProps) {
  return (
    <article className="card border-accent/50 bg-base-200 relative flex-1 border">
      <div className="bg-accent absolute top-0 left-0 h-0.75 w-1/4"></div>
      <div
        className={cn(
          "card-body",
          orientation === "horizontal" &&
            "flex-col gap-2 sm:flex-row sm:items-start sm:gap-6",
        )}
      >
        <div className="bg-accent/20 border-accent/50 mb-4 w-fit rounded-full border p-4">
          <Icon className="text-accent" size={32} />
        </div>
        <div>
          <h3 className="font-heading text-primary mb-4 text-xl">{title}</h3>
          <p className="text-lg">{description}</p>
        </div>
      </div>
    </article>
  );
}

export default FeatureCard;
