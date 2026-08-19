import ClosingCta from "@/components/ClosingCta";
import HomeBrowseByEra from "@/views/landing-page/sections/browse-by-era/HomeBrowseByEra";
import HomeBrowseByGenre from "@/views/landing-page/sections/browse-by-genre/HomeBrowseByGenre";
import HomeFeatures from "@/views/landing-page/sections/features/HomeFeatures";
import HomeHero from "@/views/landing-page/sections/hero/HomeHero";
import HomeNewArrivals from "@/views/landing-page/sections/new-arrivals/HomeNewArrivals";
import HomeUsedAndRare from "@/views/landing-page/sections/used-and-rare/HomeUsedAndRare";
import { type Metadata } from "next";

const meta = {
  title: "Home | The Vinyl Cut",
  description:
    "Browse new and used vinyl at The Vinyl Cut — condition-graded records, genre and era filters, and restock alerts when sold-out pressings come back in.",
};

const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: "https://vinylcut.narcisolobo.com",
    type: "website",
  },
};

export default function Home() {
  return (
    <main>
      <HomeHero />
      <HomeFeatures />
      <HomeNewArrivals />
      <HomeBrowseByGenre />
      <HomeBrowseByEra />
      <HomeUsedAndRare />
      <ClosingCta
        headline="Time to Dig In."
        flavorText="New arrivals, deep cuts, and a few surprises — the crates are waiting."
      />
    </main>
  );
}

export { metadata };
