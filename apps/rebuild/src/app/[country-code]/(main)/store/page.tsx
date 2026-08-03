import Divider from "@/components/Divider";
import { type SortOptions } from "@/types/sort-options";
import Albums from "@/views/store/albums/Albums";
import StoreFilterAndSort from "@/views/store/filter-and-sort/StoreFilterAndSort";
import StoreHeader from "@/views/store/header/StoreHeader";
import { Metadata } from "next";
import { Suspense } from "react";

const metadata: Metadata = {
  title: "Store | The Vinyl Cut",
  description:
    "Browse new and used vinyl by genre, era, or condition — from Mint to Good, honestly graded and ready to ship across the Mountain West and Pacific Coast.",
};

// TEMPORARY: overrides products.ts's `cache: "force-cache"` so catalog
// fixes (replace_release.py, admin edits) show up immediately instead
// of needing a `.next/cache` wipe. Remove once done verifying the
// catalog — the store page should go back to being cacheable.
//
// Must be `export const` right here, not re-exported below — Next.js
// statically parses route segment config and won't recognize it
// otherwise ("Next.js can't recognize the exported `dynamic` field in
// route. It mustn't be reexported.").
export const dynamic = "force-dynamic";

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
    <main>
      <StoreHeader />
      <Divider />
      <Suspense fallback={<div className="bg-base-300 h-27" />}>
        <StoreFilterAndSort />
      </Suspense>
      <Divider />
      <Albums
        countryCode={countryCode}
        sort={sort}
        page={page}
        genre={genre}
        era={era}
        condition={condition}
      />
    </main>
  );
}

export { metadata };
export default StorePage;
