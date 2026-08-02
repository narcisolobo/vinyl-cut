import Divider from "@/components/Divider";
import StoreFilterAndSort from "@/views/store/filter-and-sort/StoreFilterAndSort";
import StoreHeader from "@/views/store/header/StoreHeader";
import { Metadata } from "next";
import { Suspense } from "react";

const metadata: Metadata = {
  title: "Store | The Vinyl Cut",
  description:
    "Browse new and used vinyl by genre, era, or condition — from Mint to Good, honestly graded and ready to ship across the Mountain West and Pacific Coast.",
};

function StorePage() {
  return (
    <main>
      <StoreHeader />
      <Divider />
      <Suspense fallback={<div className="bg-base-300 h-17" />}>
        <StoreFilterAndSort />
      </Suspense>
    </main>
  );
}

export { metadata };
export default StorePage;
