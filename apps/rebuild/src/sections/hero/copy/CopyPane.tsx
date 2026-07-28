import Eyebrow from "@/components/Eyebrow";
import CallToAction from "../cta/CallToAction";

function CopyPane() {
  return (
    <div className="flex flex-col items-start gap-7 pr-6">
      <Eyebrow message="Used & Rare Vinyl" />
      <h1 className="font-heading text-shadow-headline text-[clamp(2.6rem,6.2vw,6rem)] leading-none uppercase">
        Welcome
        <br />
        to the
        <br />
        <span className="text-accent text-shadow-headline-inverted">Cut.</span>
      </h1>
      <p className="text-[clamp(1.05rem,1.4vw,1.3rem)]">
        New pressings, rare finds, and records worth digging for.
      </p>
      <CallToAction />
    </div>
  );
}

export default CopyPane;
