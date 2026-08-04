import ScrollRestoration from "@/components/ScrollRestoration";
import { resolveProductFilters } from "@/lib/data/product-filters";
import { DEFAULT_PRODUCTS_PER_PAGE } from "@/lib/data/product-list-defaults";
import { listProductsWithSort } from "@/lib/data/products";
import { toAlbum } from "@/lib/utils/map-to-album";
import { type SortOptions } from "@/types/sort-options";
import AlbumGrid from "./AlbumGrid";
import Pagination from "./Pagination";

interface AlbumsProps {
  sort?: SortOptions;
  page?: string;
  genre?: string;
  era?: string;
  condition?: string;
  countryCode: string;
}

/** Splits a comma-joined `?genre=`/`?era=`/`?condition=` value into names. */
function splitFilterParam(value?: string): string[] {
  return value?.split(",").filter(Boolean) ?? [];
}

async function Albums({
  countryCode,
  sort,
  page,
  genre,
  era,
  condition,
}: AlbumsProps) {
  const { categoryIds, optionValueIds } = await resolveProductFilters({
    genres: splitFilterParam(genre),
    eras: splitFilterParam(era),
    conditions: splitFilterParam(condition),
  });

  const { response } = await listProductsWithSort({
    countryCode,
    sort,
    page: page ? Number(page) : undefined,
    queryParams: categoryIds.length ? { category_id: categoryIds } : undefined,
    optionValueIds,
  });

  const albums = response.products.map(toAlbum);
  const totalPages = Math.ceil(response.count / DEFAULT_PRODUCTS_PER_PAGE);
  const currentPage = page ? Number(page) : 1;

  return (
    <>
      <ScrollRestoration />
      <section className="px-8 2xl:px-0">
        <div className="max-w-8xl mx-auto">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/${countryCode}/store`}
            searchParams={{ sort, genre, era, condition }}
          />
          <AlbumGrid albums={albums} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/${countryCode}/store`}
            searchParams={{ sort, genre, era, condition }}
          />
        </div>
      </section>
    </>
  );
}

export default Albums;
