import Eyebrow from "@/components/Eyebrow";
import Steps from "@/components/steps/Steps";
import Image from "next/image";
import storeCounter from "../../images/store-counter.jpg";
import { steps } from "./how-to-steps";

function SellHowTo() {
  return (
    <section className="bg-base-300 px-8 py-12 md:py-16 lg:py-20">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 lg:flex-row lg:items-center">
        <div
          id="thin-border"
          className="border-accent/30 relative max-w-160 min-w-75 flex-1 -translate-6 border-2"
        >
          <div
            id="thick-shadow"
            className="relative aspect-4/3 translate-4 shadow-[12px_12px_0_var(--color-accent)]"
          >
            <Image
              src={storeCounter}
              alt="Store employee at the counter with a stack of vinyl records"
              fill
              sizes="(max-width: 1024px) 90vw, 600px"
              className="object-cover"
            />
          </div>
        </div>
        <div className="flex-1">
          <hgroup role="group" aria-roledescription="Heading group">
            <Eyebrow message="How it Works" />
            <h2 className="font-heading text-shadow-headline text-heading mb-8 leading-14 uppercase">
              From Crate to Counter.
            </h2>
          </hgroup>
          <Steps steps={steps} />
        </div>
      </div>
    </section>
  );
}

export default SellHowTo;
