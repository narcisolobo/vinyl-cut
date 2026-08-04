"use client";

import { formatPrice } from "@/lib/utils/format-price";
import { type Album, type AlbumVariant } from "@/types/album";
import Image from "next/image";
import { useState } from "react";

interface AlbumDetailsProps {
  album: Album;
}

/** Cheapest variant — selected by default so the price starts low. */
function getLowestPriceVariant(
  variants: AlbumVariant[],
): AlbumVariant | undefined {
  return variants.reduce<AlbumVariant | undefined>(
    (lowest, variant) =>
      !lowest || variant.price.amount < lowest.price.amount ? variant : lowest,
    undefined,
  );
}

/** Mirrors etl/tools/load_catalog.py's format_duration: m:ss, no leading zero on minutes. */
function formatDuration(durationMs: number | null): string {
  if (!durationMs) {
    return "?:??";
  }
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function AlbumDetails({ album }: AlbumDetailsProps) {
  const [selectedImage, setSelectedImage] = useState<string>(album.frontImage);
  const [selectedVariantId, setSelectedVariantId] = useState(
    () => getLowestPriceVariant(album.variants)?.id,
  );
  const selectedVariant = album.variants.find(
    (variant) => variant.id === selectedVariantId,
  );

  const metadataLine = [
    album.releaseYear,
    album.label,
    album.catalogNumber,
    album.pressType,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-8 pt-32 pb-16 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="relative aspect-square">
          <Image
            src={selectedImage}
            alt={`${album.artist} — ${album.title} cover art`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="rounded-box object-cover"
            priority
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedImage(album.frontImage)}
            aria-pressed={selectedImage === album.frontImage}
            className="relative aspect-square w-1/4"
          >
            <Image
              src={album.frontImage}
              alt={`${album.artist} — ${album.title} front cover`}
              fill
              sizes="33vw"
              className={`rounded-box object-cover ${
                selectedImage === album.frontImage
                  ? "border-primary border"
                  : ""
              }`}
            />
          </button>
          {album.backImage && (
            <button
              type="button"
              onClick={() => setSelectedImage(album.backImage!)}
              aria-pressed={selectedImage === album.backImage}
              className="relative aspect-square w-1/4"
            >
              <Image
                src={album.backImage}
                alt={`${album.artist} — ${album.title} back cover`}
                fill
                sizes="33vw"
                className={`rounded-box object-cover ${
                  selectedImage === album.backImage
                    ? "border-primary border"
                    : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold">{album.title}</h1>
          <p className="text-primary text-xl">{album.artist}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="badge badge-soft badge-primary">{album.genre}</span>
          {album.era && (
            <span className="badge badge-soft badge-primary">{album.era}</span>
          )}
        </div>

        {metadataLine && (
          <p className="text-base-content/70 text-sm">{metadataLine}</p>
        )}

        <div className="flex flex-col gap-3">
          {selectedVariant && (
            <p className="text-3xl font-semibold">
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

        {/* Not wired to the cart module yet -- Medusa's cart/checkout flow is separate scope. */}
        <button
          type="button"
          className="btn btn-accent btn-lg"
          disabled={!selectedVariant}
        >
          Add to Cart
        </button>

        {album.tracklist.length > 0 && (
          <div>
            <h2 className="mb-2 text-lg font-semibold">Tracklist</h2>
            <ol className="flex flex-col gap-1">
              {album.tracklist.map((track, index) => (
                <li
                  key={`${track.position ?? index}-${track.title}`}
                  className="flex justify-between gap-4 text-sm"
                >
                  <span>
                    {track.position ? `${track.position}. ` : ""}
                    {track.title}
                  </span>
                  <span className="text-base-content/60">
                    {formatDuration(track.durationMs)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlbumDetails;
