import Eyebrow from "@/components/Eyebrow";
import { albumStacks } from "./album-stacks";
import AlbumStack from "./AlbumStack";

function BrowseByGenreSection() {
  return (
    <section className="bg-base-100 overflow-hidden px-8 py-12 md:py-16 lg:py-20">
      <hgroup role="group" aria-roledescription="Heading group">
        <Eyebrow message="Choose your crate" />
        <h2 className="font-heading text-shadow-headline text-heading mb-24 text-3xl uppercase">
          Browse by Genre.
        </h2>
      </hgroup>
      <div className="flex flex-col items-center gap-20 lg:flex-row">
        {albumStacks.map((albumStack) => (
          <AlbumStack key={albumStack.slug} albumStack={albumStack} />
        ))}
      </div>
    </section>
  );
}

export default BrowseByGenreSection;
