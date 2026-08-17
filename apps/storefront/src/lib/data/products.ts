"use server";

import { medusa } from "@/lib/medusa/config";
import {
  dedupeTruthy,
  type OptionValueIds,
} from "@/lib/utils/product-option-filters";
import { sortProducts } from "@/lib/utils/sort-products";
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

type ListProductsWithSortParams = {
  page?: number;
  queryParams?: ProductListQueryParams;
  sort?: SortOptions;
  countryCode: string;
  optionValueIds?: OptionValueIds;
};

/**
 * Fetches a page of products for a region, resolved from either
 * `countryCode` or `regionId` (exactly one is required). Requests a
 * fixed `fields` selection covering what product cards/detail pages
 * need — calculated price, inventory, variant/product images, options,
 * categories (with `parent_category`, needed to tell a genre category
 * from an era category), metadata, tags.
 */
async function listProducts({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: ListProductsParams): Promise<ProductListResult> {
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
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,*variants.images,*variants.options,*images,+categories.name,+categories.parent_category.name,+metadata,+tags,",
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

/**
 * Fetches products sorted by `sortBy`. `artist-asc`/`latest` sort on
 * plain columns (`subtitle`/`created_at`), so those are sorted and
 * paginated server-side via the Store API's `order` param. Price
 * isn't a real column (it's calculated per-request), so `price-asc`/
 * `price-desc` fall back to fetching 100 products to the Next.js
 * cache and sorting/paginating them client-side.
 */
async function listProductsWithSort({
  page = 1,
  queryParams,
  sort = "latest",
  countryCode,
  optionValueIds,
}: ListProductsWithSortParams): Promise<ProductListResult> {
  const limit = queryParams?.limit ?? DEFAULT_PRODUCTS_PER_PAGE;
  const optionFilters = dedupeTruthy(optionValueIds ?? []);
  const optionValueIdParams = optionFilters.length
    ? { option_value_id: optionFilters }
    : {};

  if (sort === "artist-asc" || sort === "latest") {
    const order = sort === "artist-asc" ? "subtitle" : "-created_at";

    const {
      response: { products, count },
      nextPage,
    } = await listProducts({
      pageParam: page,
      queryParams: { ...queryParams, ...optionValueIdParams, order },
      countryCode,
    });

    return {
      response: { products, count },
      nextPage,
      queryParams,
    };
  }

  const {
    response: { products },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      ...optionValueIdParams,
      limit: 100,
    },
    countryCode,
  });

  const sortedProducts = sortProducts(products, sort);
  const offset = (page - 1) * limit;
  const fetchedCount = products.length;
  const nextPage = fetchedCount > offset + limit ? page + 1 : null;
  const paginatedProducts = sortedProducts.slice(offset, offset + limit);

  return {
    response: {
      products: paginatedProducts,
      count: fetchedCount,
    },
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
