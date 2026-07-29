import Eyebrow from "@/components/Eyebrow";
import Step from "./Step";
import { steps } from "./steps";
import styles from "./used-and-rare-copy.module.css";

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
      <ol className={`${styles.steps} flex flex-col gap-8`}>
        {steps.map(({ step, title, subtitle }) => (
          <Step key={step} step={step} title={title} subtitle={subtitle} />
        ))}
      </ol>
    </div>
  );
}

export default UsedAndRareCopy;
