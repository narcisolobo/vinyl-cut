"use client";

import { buildStoreUrl } from "@/lib/utils/build-store-url";
import {
  CaretDoubleLeftIcon,
  CaretDoubleRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { type MouseEvent } from "react";
import { useStoreGridTransition } from "./StoreGridTransition";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
  position: "top" | "bottom";
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

/** Lets a plain click navigate through the shared transition (so
 * `AlbumGridStatus` can show a loading state), while cmd/ctrl/shift/alt-
 * clicks fall through to the browser's native new-tab/new-window handling
 * for the link's real `href`. */
function useNavigateOnClick(href: string) {
  const { navigate } = useStoreGridTransition();

  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    navigate(href);
  };
}

function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams,
  position,
}: PaginationProps) {
  const firstHref = buildStoreUrl(basePath, searchParams, 1);
  const prevHref = buildStoreUrl(basePath, searchParams, currentPage - 1);
  const nextHref = buildStoreUrl(basePath, searchParams, currentPage + 1);
  const lastHref = buildStoreUrl(basePath, searchParams, totalPages);

  const onFirstClick = useNavigateOnClick(firstHref);
  const onPrevClick = useNavigateOnClick(prevHref);
  const onNextClick = useNavigateOnClick(nextHref);
  const onLastClick = useNavigateOnClick(lastHref);

  if (totalPages <= 1) {
    return null;
  }

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const pageWindow = getPageWindow(currentPage, totalPages);

  return (
    <nav
      aria-label="Store pagination"
      data-testid={`pagination-${position}`}
      className="flex items-center justify-center gap-4 py-6"
    >
      <div className="join">
        {hasPrevious ? (
          <Link
            href={firstHref}
            onClick={onFirstClick}
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
            href={prevHref}
            onClick={onPrevClick}
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
        {pageWindow.map((page) => {
          const href = buildStoreUrl(basePath, searchParams, page);
          return page === currentPage ? (
            <span
              key={page}
              aria-current="page"
              className="join-item btn btn-sm btn-square btn-active btn-primary pointer-events-none"
            >
              {page}
            </span>
          ) : (
            <PaginationNumberLink key={page} href={href} page={page} />
          );
        })}
        {hasNext ? (
          <Link
            href={nextHref}
            onClick={onNextClick}
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
            href={lastHref}
            onClick={onLastClick}
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

function PaginationNumberLink({ href, page }: { href: string; page: number }) {
  const onClick = useNavigateOnClick(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className="join-item btn btn-sm btn-square btn-primary"
    >
      {page}
    </Link>
  );
}

export default Pagination;
