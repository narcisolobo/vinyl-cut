import Eyebrow from "@/components/Eyebrow";
import FeatureCard from "@/components/FeatureCard";
import { features } from "./features";

function WhatsListedIsWhatYouGet() {
  return (
    <section className="bg-base-300 px-8 py-12 md:py-16 lg:py-20 2xl:px-0">
      <div className="mx-auto max-w-7xl">
        <hgroup
          role="group"
          aria-roledescription="Heading group"
          className="mb-12"
        >
          <Eyebrow message="Returns" />
          <h2 className="font-heading text-shadow-headline text-heading mb-6 leading-none uppercase">
            What&apos;s listed is
            <br /> what you get.
          </h2>
        </hgroup>
        <div className="flex flex-col gap-6 lg:flex-row">
          {features.map(({ id, icon, title, description }) => (
            <FeatureCard
              key={id}
              icon={icon}
              title={title}
              description={description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhatsListedIsWhatYouGet;
