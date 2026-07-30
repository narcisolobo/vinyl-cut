import BringUsYourCrates from "@/views/sell-your-records/sections/BringUsYourCrates";
import VisitUs from "@/views/sell-your-records/sections/cta/VisitUs";
import NoLowBallGames from "@/views/sell-your-records/sections/features/NoLowBallGames";
import FromCrateToCounter from "@/views/sell-your-records/sections/how-to/FromCrateToCounter";
import IfItSpins from "@/views/sell-your-records/sections/specs/IfItSpins";

function SellYourRecordsPage() {
  return (
    <main>
      <BringUsYourCrates />
      <NoLowBallGames />
      <FromCrateToCounter />
      <IfItSpins />
      <VisitUs />
    </main>
  );
}

export default SellYourRecordsPage;
