import ClosingCta from "@/components/ClosingCta";
import SellHero from "@/views/sell-your-records/sections/SellHero";
import VisitUs from "@/components/VisitUs";
import SellFeatures from "@/views/sell-your-records/sections/features/SellFeatures";
import SellHowTo from "@/views/sell-your-records/sections/how-to/SellHowTo";
import SellSpecs from "@/views/sell-your-records/sections/specs/SellSpecs";
import { Metadata } from "next";

const meta = {
  title: "Sell Your Records | The Vinyl Cut",
  description:
    "Bring your vinyl to The Vinyl Cut. Fair, honest grading from graders with fifty years combined experience — walk-ins welcome, no appointment needed.",
};

const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: "https://vinylcut.narcisolobo.com/sell",
    type: "website",
  },
};

function SellYourRecordsPage() {
  return (
    <main>
      <SellHero />
      <SellFeatures />
      <SellHowTo />
      <SellSpecs />
      <VisitUs className="bg-base-300" />
      <ClosingCta
        headline="Browsing Never Hurt Anybody."
        flavorText="Since you're already thinking about vinyl, might as well see what's on the shelves."
      />
    </main>
  );
}

export { metadata };
export default SellYourRecordsPage;
