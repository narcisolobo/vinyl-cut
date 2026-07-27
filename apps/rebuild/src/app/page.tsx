import BrowseByEraSection from "@/sections/browse-by-era/BrowseByEraSection";
import BrowseByGenreSection from "@/sections/browse-by-genre/BrowseByGenreSection";
import FeaturesSection from "@/sections/features/FeaturesSection";
import HeroSection from "@/sections/hero/HeroSection";
import NewArrivalsSection from "@/sections/new-arrivals/NewArrivalsSection";
import UsedAndRareSection from "@/sections/used-and-rare/UsedAndRareSection";
import { type Metadata } from "next";

const metadata: Metadata = {
  title: "The Vinyl Cut | Home",
  description:
    "Browse new and used vinyl at The Vinyl Cut — condition-graded records, genre and era filters, and restock alerts when sold-out pressings come back in.",
};

export default function Home() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <NewArrivalsSection />
      <BrowseByGenreSection />
      <BrowseByEraSection />
      <UsedAndRareSection />
    </main>
  );
}

export { metadata };
