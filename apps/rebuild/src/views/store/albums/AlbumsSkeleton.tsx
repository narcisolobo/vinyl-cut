import AlbumGridSkeleton from "./AlbumGridSkeleton";

function AlbumsSkeleton() {
  return (
    <section className="px-8 2xl:px-0" role="status">
      <span className="sr-only">Loading albums…</span>
      <div className="max-w-8xl mx-auto">
        <AlbumGridSkeleton />
      </div>
    </section>
  );
}

export default AlbumsSkeleton;
