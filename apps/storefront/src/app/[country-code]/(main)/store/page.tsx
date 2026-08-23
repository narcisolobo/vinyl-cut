import Divider from "@/components/Divider";
import { type SortOptions } from "@/types/sort-options";
import Albums from "@/views/store/albums/Albums";
import AlbumsSkeleton from "@/views/store/albums/AlbumsSkeleton";
import StoreFilterAndSort from "@/views/store/filter-and-sort/StoreFilterAndSort";
import { StoreGridTransition } from "@/views/store/StoreGridTransition";
import { Metadata } from "next";
import { Suspense, ViewTransition } from "react";

const metadata: Metadata = {
  title: "Store | The Vinyl Cut",
  description:
    "Browse new and used vinyl by genre, era, or condition — from Mint to Good, honestly graded and ready to ship across the Mountain West and Pacific Coast.",
};

// export const dynamic = "force-dynamic";

type StorePageSearchParams = {
  sort?: SortOptions;
  page?: string;
  genre?: string;
  era?: string;
  condition?: string;
};

interface StorePageProps {
  params: Promise<{ "country-code": string }>;
  searchParams: Promise<StorePageSearchParams>;
}

async function StorePage({ params, searchParams }: StorePageProps) {
  const { "country-code": countryCode } = await params;
  const { sort, page, genre, era, condition } = await searchParams;
  return (
    <ViewTransition
      enter={{
        "nav-back": "nav-back",
        default: "none",
      }}
      exit={{
        "nav-back": "nav-back",
        default: "none",
      }}
      default="none"
    >
      {/* page content */}
      <main className="vc-gradient">
        <StoreGridTransition>
          <Divider />
          <Suspense fallback={<div className="bg-base-300 h-27" />}>
            <StoreFilterAndSort />
          </Suspense>
          <Divider />
          <Suspense fallback={<AlbumsSkeleton />}>
            <Albums
              countryCode={countryCode}
              sort={sort}
              page={page}
              genre={genre}
              era={era}
              condition={condition}
            />
          </Suspense>
        </StoreGridTransition>
      </main>
    </ViewTransition>
  );
}

export { metadata };
export default StorePage;
