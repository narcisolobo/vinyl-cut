import CallToAction from "../cta/CallToAction";

function CopyPane() {
  return (
    <div className="flex flex-col items-start gap-7 pr-6">
      <div className="inline-flex items-center gap-3">
        <div className="from-accent h-0.5 w-14 bg-linear-to-r to-transparent"></div>
        <span className="text-primary text-sm font-semibold tracking-[4px] uppercase">
          Used & Rare Vinyl
        </span>
      </div>
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
