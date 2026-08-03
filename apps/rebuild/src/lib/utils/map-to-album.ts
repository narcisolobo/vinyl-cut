import { type HttpTypes } from "@medusajs/types";
import { type Album, type AlbumVariant } from "@/types/album";

const PLACEHOLDER_IMAGE = "/placeholder-album.svg";
const FRONT_IMAGE_MARKER = "-front-500";
const BACK_IMAGE_MARKER = "-back-500";
const ERAS_CATEGORY_NAME = "Eras";
const CONDITION_OPTION_TITLE = "Condition";

/**
 * Every product photo's filename encodes both its side ("front"/"back")
 * and pixel size ("250"/"500") — Medusa's image model has no dedicated
 * field for either, so this is the only signal available. The catalog
 * is closed (no future products, only restocks of existing variants),
 * so this naming convention is guaranteed stable for everything that
 * will ever be mapped.
 */
function findImageUrl(
  images: HttpTypes.StoreProductImage[],
  marker: string,
): string | undefined {
  return images.find((image) => image.url.includes(marker))?.url;
}

/**
 * Splits a product's categories into genre/era using category
 * hierarchy: every album has exactly one genre category (top-level,
 * curated with a fallback by the ETL script) and at most one era
 * category (nested under the "Eras" parent — absent when the source
 * metadata had no known release year, so era can legitimately be
 * `null`).
 */
function resolveGenreAndEra(categories: HttpTypes.StoreProductCategory[]): {
  genre: string;
  era: string | null;
} {
  const eraCategory = categories.find(
    (category) => category.parent_category?.name === ERAS_CATEGORY_NAME,
  );
  const genreCategory = categories.find(
    (category) => category.parent_category?.name !== ERAS_CATEGORY_NAME,
  );

  return {
    genre: genreCategory?.name ?? "",
    era: eraCategory?.name ?? null,
  };
}

function toAlbumVariant(variant: HttpTypes.StoreProductVariant): AlbumVariant {
  const condition =
    variant.options?.find(
      (option) => option.option?.title === CONDITION_OPTION_TITLE,
    )?.value ?? "";

  return {
    id: variant.id,
    condition,
    price: {
      amount: variant.calculated_price?.calculated_amount ?? 0,
      currencyCode: variant.calculated_price?.currency_code ?? "usd",
    },
  };
}

/** Maps a raw Medusa product into this store's `Album` domain shape. */
function toAlbum(product: HttpTypes.StoreProduct): Album {
  const images = product.images ?? [];
  const { genre, era } = resolveGenreAndEra(product.categories ?? []);

  return {
    id: product.id,
    title: product.title,
    artist: product.subtitle ?? "",
    genre,
    era,
    frontImage: findImageUrl(images, FRONT_IMAGE_MARKER) ?? PLACEHOLDER_IMAGE,
    backImage: findImageUrl(images, BACK_IMAGE_MARKER) ?? null,
    variants: (product.variants ?? []).map(toAlbumVariant),
  };
}

export { toAlbum };
