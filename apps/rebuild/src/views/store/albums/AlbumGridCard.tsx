"use client";

import { useState, ViewTransition } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils/format-price";
import { saveScrollPosition } from "@/lib/utils/scroll-restore";
import { type Album, type AlbumVariant } from "@/types/album";
import LocalizedClientLink from "@/components/LocalizedClientLink";

type AlbumGridCardProps = {
  album: Album;
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

function AlbumGridCard({ album }: AlbumGridCardProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    () => getLowestPriceVariant(album.variants)?.id,
  );
  const selectedVariant = album.variants.find(
    (variant) => variant.id === selectedVariantId,
  );

  return (
    <li className="card bg-base-300 relative shadow-sm">
      <LocalizedClientLink
        href={`/albums/${album.handle}`}
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
        <div className="card-actions bg-base-200 relative z-20 justify-between">
          {selectedVariant && (
            <p className="text-2xl font-semibold">
              {formatPrice(selectedVariant.price)}
            </p>
          )}
          <div className="join">
            {album.variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariantId(variant.id)}
                aria-pressed={variant.id === selectedVariantId}
                className={`join-item btn btn-sm uppercase ${
                  variant.id === selectedVariantId
                    ? "btn-accent"
                    : "btn-primary"
                }`}
              >
                {variant.condition}
              </button>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}

export default AlbumGridCard;
