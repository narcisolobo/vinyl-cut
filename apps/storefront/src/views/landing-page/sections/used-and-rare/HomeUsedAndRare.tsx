import UsedAndRareCopy from "./UsedAndRareCopy";
import UsedAndRareMockup from "./UsedAndRareMockup";

function HomeUsedAndRare() {
  return (
    <section className="bg-base-100 px-8 py-12 md:py-16 lg:py-20">
      <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-center">
        <UsedAndRareCopy />
        <UsedAndRareMockup />
      </div>
    </section>
  );
}

export default HomeUsedAndRare;
