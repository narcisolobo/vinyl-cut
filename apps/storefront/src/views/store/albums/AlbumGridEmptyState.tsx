import LocalizedClientLink from "@/components/LocalizedClientLink";

function AlbumGridEmptyState() {
  return (
    <div role="status" className="hero py-16">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h3 className="text-2xl font-semibold">
            No albums match those filters
          </h3>
          <p className="text-base-content/70 py-4">
            Try removing a filter to see more of the crate.
          </p>
          <LocalizedClientLink
            href="/store"
            className="btn btn-accent uppercase"
          >
            Clear filters
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  );
}

export default AlbumGridEmptyState;
