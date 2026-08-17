type StoreUrlSearchParams = Record<string, string | undefined>;

/**
 * Builds a /store URL preserving sort/genre/era/condition and page --
 * `page` is omitted for page 1 to match the canonical URL Next.js
 * itself produces there (no lingering `?page=1`). Shared by Pagination
 * (linking to a *different* page) and Albums (building the "current
 * page" URL grid cards return to after a PDP visit) so both agree on
 * the same canonical shape.
 */
function buildStoreUrl(
  basePath: string,
  searchParams: StoreUrlSearchParams,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) {
      params.set(key, value);
    }
  }
  if (page > 1) {
    params.set("page", String(page));
  } else {
    params.delete("page");
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export { buildStoreUrl };
export type { StoreUrlSearchParams };
