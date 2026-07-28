import Image from "next/image";
import LocalizedClientLink from "@/components/LocalizedClientLink";
import type { NewArrival } from "./new-arrivals";

function NewArrivalsCard({ cover, title, artist, handle }: NewArrival) {
  return (
    <LocalizedClientLink href={`/products/${handle}`}>
      <article className="relative isolate">
        <figure className="relative mb-4 aspect-square">
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
        </figure>
        <hgroup role="group" aria-roledescription="Heading group">
          <h3 className="text-lg font-bold lg:text-xl">{title}</h3>
          <p className="text-primary">{artist}</p>
        </hgroup>
        <span className="badge badge-accent absolute -top-2 -left-2 font-bold uppercase">
          New
        </span>
      </article>
    </LocalizedClientLink>
  );
}

export default NewArrivalsCard;
