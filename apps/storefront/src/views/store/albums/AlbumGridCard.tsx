"use client";

import Divider from "@/components/Divider";
import LocalizedClientLink from "@/components/LocalizedClientLink";
import { formatPrice } from "@/lib/utils/format-price";
import { saveScrollPosition } from "@/lib/utils/scroll-restore";
import { type Album, type AlbumVariant } from "@/types/album";
import Image from "next/image";
import { useState, ViewTransition } from "react";
import VariantButton from "./VariantButton";

type AlbumGridCardProps = {
  album: Album;
  returnTo: string;
};

/** Cheapest variant — selected by default so the card's price starts low. */
function getLowestPriceVariant(
  variants: AlbumVariant[],
): AlbumVariant | undefined {
  return variants.reduce<AlbumVariant | undefined>(
    (lowest, variant) =>
      !lowest || variant.price.amount < lowest.price.amount ? variant : lowest,
    undefined,
  );
}

function AlbumGridCard({ album, returnTo }: AlbumGridCardProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    () => getLowestPriceVariant(album.variants)?.id,
  );
  const selectedVariant = album.variants.find(
    (variant) => variant.id === selectedVariantId,
  );

  return (
    <li className="card card-sm lg:card-md bg-base-300 relative shadow-sm">
      <LocalizedClientLink
        href={`/albums/${album.handle}?from=${encodeURIComponent(returnTo)}`}
        onClick={saveScrollPosition}
        className="absolute inset-0 z-10"
      >
        <span className="sr-only">{`${album.artist} — ${album.title}`}</span>
      </LocalizedClientLink>
      <figure className="relative aspect-square">
        <ViewTransition
          name={`album-cover-${album.handle}`}
          share="morph"
          default="none"
        >
          <Image
            src={album.frontImage}
            alt={`${album.artist} — ${album.title} cover art`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        </ViewTransition>
      </figure>
      <div className="card-body">
        <h4 className="card-title line-clamp-2">{album.title}</h4>
        <p className="text-primary line-clamp-2">{album.artist}</p>
        <Divider />
        <div className="card-actions relative z-20 items-center justify-between">
          {selectedVariant && (
            <p className="text-2xl font-semibold md:text-lg xl:text-2xl">
              {formatPrice(selectedVariant.price)}
            </p>
          )}
          <div className="join">
            {album.variants.map((variant) => (
              <VariantButton
                key={variant.id}
                variant={variant}
                selectedVariantId={selectedVariantId}
                onSelect={setSelectedVariantId}
              />
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}

export default AlbumGridCard;
