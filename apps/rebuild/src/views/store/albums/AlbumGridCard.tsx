import Image from "next/image";
import { formatPrice } from "@/lib/utils/format-price";
import { type Album, type AlbumVariant } from "@/types/album";

type AlbumGridCardProps = {
  album: Album;
};

/** Cheapest variant's price — this card shows one price, not a range. */
function getLowestPrice(
  variants: AlbumVariant[],
): AlbumVariant["price"] | undefined {
  return variants.reduce<AlbumVariant["price"] | undefined>(
    (lowest, variant) =>
      !lowest || variant.price.amount < lowest.amount ? variant.price : lowest,
    undefined,
  );
}

function AlbumGridCard({ album }: AlbumGridCardProps) {
  const price = getLowestPrice(album.variants);

  return (
    <li className="card bg-base-100 shadow-sm">
      <figure className="relative aspect-square">
        <Image
          src={album.frontImage}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
        />
      </figure>
      <div className="card-body">
        <h4 className="card-title">{album.title}</h4>
        <p className="text-primary">{album.artist}</p>
        {price && <p className="font-semibold">{formatPrice(price)}</p>}
      </div>
    </li>
  );
}

export default AlbumGridCard;
