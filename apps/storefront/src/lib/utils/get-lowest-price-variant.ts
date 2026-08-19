import { type AlbumVariant } from "@/types/album";

/** Cheapest variant — selected by default so the displayed price starts low. */
function getLowestPriceVariant(
  variants: AlbumVariant[],
): AlbumVariant | undefined {
  return variants.reduce<AlbumVariant | undefined>(
    (lowest, variant) =>
      !lowest || variant.price.amount < lowest.price.amount ? variant : lowest,
    undefined,
  );
}

export { getLowestPriceVariant };
