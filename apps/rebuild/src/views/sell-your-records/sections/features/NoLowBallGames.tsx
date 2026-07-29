import Eyebrow from "@/components/Eyebrow";
import { features } from "./features";
import FeatureCard from "@/components/FeatureCard";

function NoLowBallGames() {
  return (
    <section className="bg-base-100 px-8 py-12 md:py-16 lg:py-20">
      <hgroup role="group" aria-roledescription="Heading group">
        <Eyebrow message="Three things we get right" />
        <h2 className="font-heading text-shadow-headline text-heading mb-16 uppercase">
          Straight Up, No Skips.
        </h2>
      </hgroup>
      <div className="flex flex-col gap-6 lg:flex-row">
        {features.map((feature) => (
          <FeatureCard
            key={feature.id}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </section>
  );
}

export default NoLowBallGames;
