"use client";

import { useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils/format-price";
import { type Album, type AlbumVariant } from "@/types/album";

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
    <li className="card bg-base-300 shadow-sm">
      <figure className="relative aspect-square">
        <Image
          src={album.frontImage}
          alt={`${album.artist} — ${album.title} cover art`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
        />
      </figure>
      <div className="card-body">
        <h4 className="card-title line-clamp-2">{album.title}</h4>
        <p className="text-primary line-clamp-2">{album.artist}</p>
        <div className="card-actions bg-base-200 justify-between">
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
