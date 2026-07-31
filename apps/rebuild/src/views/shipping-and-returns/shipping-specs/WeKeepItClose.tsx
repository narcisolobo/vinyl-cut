import Eyebrow from "@/components/Eyebrow";
import FeatureCard from "@/components/FeatureCard";
import { states } from "./states";
import { features } from "./features";

function WeKeepItClose() {
  return (
    <section className="mx-auto max-w-7xl px-8 py-12 md:py-16 lg:py-20 2xl:px-0">
      <div className="flex flex-col items-center gap-16 lg:flex-row">
        <div className="flex-1">
          <hgroup
            role="group"
            aria-roledescription="Heading group"
            className="mb-12"
          >
            <Eyebrow message="Shipping" />
            <h2 className="font-heading text-shadow-headline text-heading mb-6 leading-none uppercase">
              We keep it close.
            </h2>
          </hgroup>
          <p className="mb-6 max-w-[45ch] text-lg">
            We ship flat-rate across the Mountain West and Pacific Coast — and
            nowhere else, by design. Shorter transit times mean less time for a
            record to get knocked around, and it keeps us close enough to
            actually stand behind every package.
          </p>
          <div className="flex flex-wrap gap-4">
            {states.map(({ short, long }) => (
              <div
                key={short}
                className="border-accent/50 flex items-center gap-4 border px-4 py-2"
              >
                <p className="text-primary uppercase">{long}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex flex-col gap-6">
            {features.map(({ id, icon, title, description }) => (
              <FeatureCard
                key={id}
                icon={icon}
                title={title}
                description={description}
                orientation="horizontal"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
export default WeKeepItClose;
