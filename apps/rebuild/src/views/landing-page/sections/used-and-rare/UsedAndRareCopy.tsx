import Eyebrow from "@/components/Eyebrow";
import Steps from "@/components/steps/Steps";
import { steps } from "./notify-steps";

function UsedAndRareCopy() {
  return (
    <div className="flex flex-col">
      <hgroup role="group" aria-roledescription="Heading group">
        <Eyebrow message="Mic drop" />
        <h2 className="font-heading text-shadow-headline mb-8 text-[clamp(2.6rem,4.2vw,4rem)] leading-none uppercase">
          Sold out isn&apos;t
          <br />
          goodbye.
        </h2>
        <p className="mb-8 max-w-[45ch] text-lg lg:text-xl">
          Used vinyl doesn&apos;t restock like new pressings. But when another
          copy of the same release, in the same grade, lands in the crates —
          you&apos;ll be the first to know.
        </p>
      </hgroup>
      <Steps steps={steps} />
    </div>
  );
}

export default UsedAndRareCopy;
