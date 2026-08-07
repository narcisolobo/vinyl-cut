"use client";

import { formatPrice } from "@/lib/utils/format-price";
import { type Album, type AlbumVariant } from "@/types/album";
import LocalizedClientLink from "@/components/LocalizedClientLink";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useState, ViewTransition } from "react";
import AddToCartButton from "./AddToCartButton";
import VariantButton from "./VariantButton";
import ImageButton from "./ImageButton";
import AlbumTracklist from "./AlbumTracklist";

interface AlbumDetailsProps {
  album: Album;
  backHref: string;
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

function AlbumDetails({ album, backHref }: AlbumDetailsProps) {
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
    <section className="mx-auto max-w-5xl px-8 pt-24 pb-16">
      <LocalizedClientLink
        href={backHref}
        transitionTypes={["nav-back"]}
        scroll={false}
        className="btn btn-ghost btn-sm btn-primary mb-4"
      >
        <CaretLeftIcon size={16} />
        Back to Store
      </LocalizedClientLink>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <ViewTransition
            name={`album-cover-${album.handle}`}
            share="morph"
            default="none"
          >
            <div className="relative aspect-square">
              <Image
                src={selectedImage}
                alt={`${album.artist} — ${album.title} cover art`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="rounded-box object-cover"
                loading="eager"
                priority
              />
            </div>
          </ViewTransition>
          <div className="flex items-center gap-2">
            <ImageButton
              altText={`${album.artist} - ${album.title} front cover`}
              imageUrl={album.frontImage}
              selectedImage={selectedImage}
              onSelect={setSelectedImage}
            />
            {album.backImage && (
              <ImageButton
                altText={`${album.artist} - ${album.title} back cover`}
                imageUrl={album.backImage}
                selectedImage={selectedImage}
                onSelect={setSelectedImage}
              />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-semibold">{album.title}</h1>
            <h2 className="text-primary text-xl">{album.artist}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="badge badge-soft badge-primary">
              {album.genre}
            </span>
            {album.era && (
              <span className="badge badge-soft badge-primary">
                {album.era}
              </span>
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
                <VariantButton
                  key={variant.id}
                  variant={variant}
                  selectedVariantId={selectedVariantId}
                  onSelect={setSelectedVariantId}
                />
              ))}
            </div>
          </div>

          <AddToCartButton variantId={selectedVariantId} />

          {album.tracklist.length > 0 && (
            <AlbumTracklist tracklist={album.tracklist} />
          )}
        </div>
      </div>
    </section>
  );
}

export default AlbumDetails;
