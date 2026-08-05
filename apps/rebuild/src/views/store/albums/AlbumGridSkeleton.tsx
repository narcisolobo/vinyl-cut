import AlbumGridCardSkeleton from "./AlbumGridCardSkeleton";

/** Matches DEFAULT_PRODUCTS_PER_PAGE's divisibility so placeholder rows stay clean at every breakpoint. */
const SKELETON_CARD_COUNT = 12;

function AlbumGridSkeleton() {
  return (
    <ul
      role="list"
      className="grid list-none grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <AlbumGridCardSkeleton key={index} />
      ))}
    </ul>
  );
}

export default AlbumGridSkeleton;
