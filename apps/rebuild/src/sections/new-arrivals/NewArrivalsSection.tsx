import Eyebrow from "@/components/Eyebrow";
import { newArrivals } from "./new-arrivals";
import NewArrivalsCard from "./NewArrivalsCard";

function NewArrivalsSection() {
  return (
    <section className="bg-base-300 overflow-hidden px-8 py-12 md:py-16 lg:py-20">
      <hgroup role="group" aria-roledescription="Heading group">
        <Eyebrow message="Just in" />
        <h2 className="font-heading text-shadow-headline text-heading mb-24 text-3xl uppercase">
          Hot off the press.
        </h2>
      </hgroup>
      <div className="flex flex-col items-center justify-between gap-6 p-3 lg:grid lg:grid-cols-4">
        {newArrivals.map(({ title, artist, cover, handle }) => (
          <NewArrivalsCard
            key={title}
            title={title}
            artist={artist}
            cover={cover}
            handle={handle}
          />
        ))}
      </div>
    </section>
  );
}

export default NewArrivalsSection;
