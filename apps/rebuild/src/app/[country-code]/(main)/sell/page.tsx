import CallToAction from "@/components/CallToAction";
import BringUsYourCrates from "@/views/sell-your-records/sections/BringUsYourCrates";
import VisitUs from "@/components/VisitUs";
import NoLowBallGames from "@/views/sell-your-records/sections/features/NoLowBallGames";
import FromCrateToCounter from "@/views/sell-your-records/sections/how-to/FromCrateToCounter";
import IfItSpins from "@/views/sell-your-records/sections/specs/IfItSpins";
import { Metadata } from "next";

const metadata: Metadata = {
  title: "Sell Your Records | The Vinyl Cut",
  description:
    "Bring your vinyl to The Vinyl Cut. Fair, honest grading from graders with fifty years combined experience — walk-ins welcome, no appointment needed.",
};

function SellYourRecordsPage() {
  return (
    <main>
      <BringUsYourCrates />
      <NoLowBallGames />
      <FromCrateToCounter />
      <IfItSpins />
      <VisitUs className="bg-base-300" />
      <CallToAction
        headline="Browsing Never Hurt Anybody."
        flavorText="Since you're already thinking about vinyl, might as well see what's on the shelves."
      />
    </main>
  );
}

export { metadata };
export default SellYourRecordsPage;
