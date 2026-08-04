import {
  CaretDoubleLeftIcon,
  CaretDoubleRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}

/**
 * A sliding window of (up to) 3 page numbers centered on currentPage,
 * clamped to [1, totalPages] -- always exactly 3 numbers (fewer only
 * when totalPages < 3), so the component's width never changes between
 * edge and middle pages the way a pinned-first/last + ellipsis layout
 * does. Jumping to page 1 or the last page is handled separately by the
 * first/last icon buttons instead of a wider number range.
 */
function getPageWindow(currentPage: number, totalPages: number): number[] {
  let start = currentPage - 1;
  let end = currentPage + 1;
  if (start < 1) {
    end += 1 - start;
    start = 1;
  }
  if (end > totalPages) {
    start -= end - totalPages;
    end = totalPages;
  }
  start = Math.max(start, 1);

  const pages: number[] = [];
  for (let page = start; page <= end; page++) {
    pages.push(page);
  }
  return pages;
}

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
  const pageWindow = getPageWindow(currentPage, totalPages);

  return (
    <nav
      aria-label="Store pagination"
      className="flex items-center justify-center gap-4 py-6"
    >
      <div className="join">
        {hasPrevious ? (
          <Link
            href={buildPageHref(basePath, searchParams, 1)}
            aria-label="First page"
            className="join-item btn btn-sm btn-square btn-primary rounded-s-md"
          >
            <CaretDoubleLeftIcon size={16} />
          </Link>
        ) : (
          <button
            type="button"
            aria-label="First page"
            className="join-item btn btn-sm btn-square btn-disabled btn-primary rounded-s-md"
          >
            <CaretDoubleLeftIcon size={16} />
          </button>
        )}
        {hasPrevious ? (
          <Link
            href={buildPageHref(basePath, searchParams, currentPage - 1)}
            aria-label="Previous page"
            className="join-item btn btn-sm btn-square btn-primary"
          >
            <CaretLeftIcon size={16} />
          </Link>
        ) : (
          <button
            type="button"
            aria-label="Previous page"
            className="join-item btn btn-sm btn-square btn-disabled btn-primary"
          >
            <CaretLeftIcon size={16} />
          </button>
        )}
        {pageWindow.map((page) =>
          page === currentPage ? (
            <span
              key={page}
              aria-current="page"
              className="join-item btn btn-sm btn-square btn-active btn-primary pointer-events-none"
            >
              {page}
            </span>
          ) : (
            <Link
              key={page}
              href={buildPageHref(basePath, searchParams, page)}
              className="join-item btn btn-sm btn-square btn-primary"
            >
              {page}
            </Link>
          ),
        )}
        {hasNext ? (
          <Link
            href={buildPageHref(basePath, searchParams, currentPage + 1)}
            aria-label="Next page"
            className="join-item btn btn-sm btn-square btn-primary"
          >
            <CaretRightIcon size={16} />
          </Link>
        ) : (
          <button
            type="button"
            aria-label="Next page"
            className="join-item btn btn-sm btn-square btn-disabled btn-primary"
          >
            <CaretRightIcon size={16} />
          </button>
        )}
        {hasNext ? (
          <Link
            href={buildPageHref(basePath, searchParams, totalPages)}
            aria-label="Last page"
            className="join-item btn btn-sm btn-square btn-primary rounded-e-md"
          >
            <CaretDoubleRightIcon size={16} />
          </Link>
        ) : (
          <button
            type="button"
            aria-label="Last page"
            className="join-item btn btn-sm btn-square btn-disabled btn-primary rounded-e-md"
          >
            <CaretDoubleRightIcon size={16} />
          </button>
        )}
      </div>
    </nav>
  );
}

export default Pagination;
