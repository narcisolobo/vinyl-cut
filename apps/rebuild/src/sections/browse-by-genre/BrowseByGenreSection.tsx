import Eyebrow from "@/components/Eyebrow";
import { genreStacks } from "./genre-stacks";
import AlbumStack from "@/components/album-stack/AlbumStack";

function BrowseByGenreSection() {
  const filter = genreStacks.filter;

  return (
    <section className="bg-base-100 overflow-hidden px-8 py-12 md:py-16 lg:py-20">
      <hgroup role="group" aria-roledescription="Heading group">
        <Eyebrow message="Choose your crate" />
        <h2 className="font-heading text-shadow-headline text-heading mb-24 uppercase">
          Browse by Genre.
        </h2>
      </hgroup>
      <div className="flex flex-col items-center justify-between gap-20 p-3 lg:grid lg:grid-cols-3">
        {genreStacks.stacks.map((stack) => (
          <AlbumStack key={stack.slug} filter={filter} albumStack={stack} />
        ))}
      </div>
    </section>
  );
}

export default BrowseByGenreSection;
