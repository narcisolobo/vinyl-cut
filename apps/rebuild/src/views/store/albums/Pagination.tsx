import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
};

/** Rebuilds the current query string with `page` swapped in, dropping it entirely for page 1 so `?page=` doesn't linger in the URL. */
function buildPageHref(
  basePath: string,
  searchParams: Record<string, string | undefined>,
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

function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Store pagination"
      className="flex items-center justify-center gap-4 pt-12"
    >
      <div className="join">
        {hasPrevious ? (
          <Link
            href={buildPageHref(basePath, searchParams, currentPage - 1)}
            className="join-item btn"
          >
            Previous
          </Link>
        ) : (
          <button type="button" className="join-item btn btn-disabled">
            Previous
          </button>
        )}
        <span className="join-item btn btn-disabled pointer-events-none">
          Page {currentPage} of {totalPages}
        </span>
        {hasNext ? (
          <Link
            href={buildPageHref(basePath, searchParams, currentPage + 1)}
            className="join-item btn"
          >
            Next
          </Link>
        ) : (
          <button type="button" className="join-item btn btn-disabled">
            Next
          </button>
        )}
      </div>
    </nav>
  );
}

export default Pagination;
