"use server";

import { medusa } from "@/lib/medusa/config";
import {
  dedupeTruthy,
  type OptionValueIds,
} from "@/lib/utils/product-option-filters";
import { type SortOptions } from "@/types/sort-options";
import { type HttpTypes } from "@medusajs/types";
import { DEFAULT_PRODUCTS_PER_PAGE } from "./product-list-defaults";
import { getRegion, retrieveRegion } from "./regions";

type ProductListQueryParams = (HttpTypes.FindParams &
  HttpTypes.StoreProductListParams) & {
  options?: string[];
  option_value_id?: string | string[];
};

type ProductListResponse = {
  products: HttpTypes.StoreProduct[];
  count: number;
};

type ProductListResult = {
  response: ProductListResponse;
  nextPage: number | null;
  queryParams?: ProductListQueryParams;
};

type ListProductsParams = {
  pageParam?: number;
  queryParams?: ProductListQueryParams;
  countryCode?: string;
  regionId?: string;
};

type FetchProductsParams = ListProductsParams & { fields: string };

type ListProductsWithSortParams = {
  page?: number;
  queryParams?: ProductListQueryParams;
  sort?: SortOptions;
  countryCode: string;
  optionValueIds?: OptionValueIds;
};

/**
 * The Store API's `/store/products` defaults include several relations
 * this store's `toAlbum` mapper never reads at all (`type`, `collection`,
 * top-level `options`, `tags`) or only reads a couple of sub-fields from
 * (`images`, `variants.options`) despite the default being a full `*`
 * expansion. Omitting an already-defaulted relation from `fields` does
 * NOT stop the API from fetching it -- it must be excluded explicitly
 * with `-field`, then the wanted sub-fields re-added with `+` (see
 * `FieldParser` in `@medusajs/framework`'s `field-parser.js`). `-`
 * exclusions must precede the `+` sub-field they narrow down to, or the
 * exclusion deletes the just-added field too (it matches by prefix).
 *
 * `calculated_price` isn't a default at all, so it's a real addition
 * either way -- narrowed here since only two of its many sub-fields are
 * used, though the expensive part (price-list/rule resolution) runs
 * regardless of which sub-fields are requested.
 */
const BASE_FIELDS =
  "-type,-collection,-options,-tags,-images,-variants.options," +
  "+images.url,+variants.options.value,+variants.options.option.title," +
  "+variants.calculated_price.calculated_amount,+variants.calculated_price.currency_code";

/**
 * Adds what only the PDP needs on top of `BASE_FIELDS`: genre/era
 * (`categories`) and label/catalog number/release year/press
 * type/tracklist (`metadata`) -- `AlbumGridCard` doesn't render any of
 * these, only `AlbumDetails` does -- plus per-variant inventory for the
 * in-stock/out-of-stock state (`AlbumGridCard`'s `VariantButton` doesn't
 * read `inStock` either, only `AlbumDetails`'s does).
 */
const PRODUCT_DETAIL_FIELDS = `${BASE_FIELDS},+categories.name,+categories.parent_category.name,+metadata,+variants.inventory_quantity`;

/**
 * Fetches a page of products for a region, resolved from either
 * `countryCode` or `regionId` (exactly one is required), with a given
 * `fields` selection. Shared by `listProducts` (PDP, `BASE_FIELDS` plus
 * detail-only relations) and `listProductsForGrid` (PLP, `BASE_FIELDS`
 * alone).
 */
async function fetchProducts({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  fields,
}: FetchProductsParams): Promise<ProductListResult> {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required");
  }

  const limit = queryParams?.limit ?? DEFAULT_PRODUCTS_PER_PAGE;
  const _pageParam = Math.max(pageParam, 1);
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit;

  let region: HttpTypes.StoreRegion | undefined | null;

  if (countryCode) {
    region = await getRegion(countryCode);
  } else {
    region = await retrieveRegion(regionId!);
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    };
  }

  // Global tag, not per-visitor: product/catalog data isn't visitor-specific
  // like carts or customers are, and a backend-triggered revalidation (on
  // order placement) has no way to know which visitors' cache-id-namespaced
  // tags to invalidate.
  const next = { tags: ["products"] };

  try {
    const { products, count } = await medusa.client.fetch<ProductListResponse>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region.id,
          fields,
          ...queryParams,
        },
        next,
        cache: "force-cache",
      },
    );

    const nextPage = count > offset + limit ? pageParam + 1 : null;

    return {
      response: { products, count },
      nextPage,
      queryParams,
    };
  } catch (error) {
    throw new Error("products.ts: Failed to fetch products from Medusa.", {
      cause: error,
    });
  }
}

/** Fetches a page of products with the full field set the PDP needs. */
async function listProducts(
  params: ListProductsParams,
): Promise<ProductListResult> {
  return fetchProducts({ ...params, fields: PRODUCT_DETAIL_FIELDS });
}

/** Fetches a page of products with only the fields `AlbumGridCard` renders. */
async function listProductsForGrid(
  params: ListProductsParams,
): Promise<ProductListResult> {
  return fetchProducts({ ...params, fields: BASE_FIELDS });
}

/**
 * Every sort option maps to a plain, indexable `order` value: `latest`/
 * `artist-asc` sort on real columns (`created_at`/`subtitle`), and
 * `price-asc`/`price-desc` sort on `metadata.sort_price` -- a zero-padded
 * string set at ETL time (see `sort_price_for` in `load_catalog.py`) so
 * that Medusa's JSONB `order=metadata.X` lexicographic comparison (verified
 * empirically against the live Store API -- it does NOT compare numerically)
 * still lands in true price order. All four sort server-side, so there's
 * no over-fetch and no client-side sort/slice at any catalog size.
 */
const SORT_ORDER: Record<SortOptions, string> = {
  latest: "-created_at",
  "artist-asc": "subtitle",
  "price-asc": "metadata.sort_price",
  "price-desc": "-metadata.sort_price",
};

/** Fetches products sorted by `sortBy`, paginated server-side via the Store API's `order` param. */
async function listProductsWithSort({
  page = 1,
  queryParams,
  sort = "latest",
  countryCode,
  optionValueIds,
}: ListProductsWithSortParams): Promise<ProductListResult> {
  const optionFilters = dedupeTruthy(optionValueIds ?? []);
  const optionValueIdParams = optionFilters.length
    ? { option_value_id: optionFilters }
    : {};

  const {
    response: { products, count },
    nextPage,
  } = await listProductsForGrid({
    pageParam: page,
    queryParams: {
      ...queryParams,
      ...optionValueIdParams,
      order: SORT_ORDER[sort],
    },
    countryCode,
  });

  return {
    response: { products, count },
    nextPage,
    queryParams,
  };
}

/**
 * Fetches a single product by its handle, for the PDP. Returns `null`
 * on no match rather than calling `notFound()` itself — callers like
 * `generateMetadata` and the page component both need this lookup but
 * want to handle a miss differently (metadata can't call `notFound()`).
 */
async function getProductByHandle(
  handle: string,
  countryCode: string,
): Promise<HttpTypes.StoreProduct | null> {
  const {
    response: { products },
  } = await listProducts({
    queryParams: { handle, limit: 1 },
    countryCode,
  });

  return products[0] ?? null;
}

export { getProductByHandle, listProducts, listProductsWithSort };
