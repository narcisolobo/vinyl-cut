import Eyebrow from "@/components/Eyebrow";
import Steps from "@/components/steps/Steps";
import { steps } from "./steps";

function FromCrateToCounter() {
  return (
    <section className="bg-base-300 px-8 py-12 md:py-16 lg:py-20">
      <hgroup role="group" aria-roledescription="Heading group">
        <Eyebrow message="How it Works" />
        <h2 className="font-heading text-shadow-headline text-heading mb-16 uppercase">
          From Crate to Counter.
        </h2>
      </hgroup>
      <Steps steps={steps} />
    </section>
  );
}

export default FromCrateToCounter;
