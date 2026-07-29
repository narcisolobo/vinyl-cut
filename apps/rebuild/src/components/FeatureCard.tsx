import type { IconProps } from "@phosphor-icons/react";
import { type ComponentType } from "react";

interface FeatureCardProps {
  icon: ComponentType<IconProps>;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <article className="card border-accent/50 bg-base-200 relative flex-1 border">
      <div className="bg-accent absolute top-0 left-0 h-0.75 w-1/4"></div>
      <div className="card-body">
        <div className="bg-accent/20 border-accent/50 mb-4 w-fit rounded-full border p-4">
          <Icon className="text-accent" size={32} />
        </div>
        <h3 className="font-heading text-primary text-xl">{title}</h3>
        <p className="text-lg">{description}</p>
      </div>
    </article>
  );
}

export default FeatureCard;
