import Eyebrow from "@/components/Eyebrow";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import recordCrate from "../images/record-crate.jpg";

function SellHero() {
  return (
    <section
      id="home"
      className="vc-gradient overflow-hidden px-8 pt-32 pb-24 md:pb-28 lg:pb-32"
    >
      <div className="relative isolate">
        <div className="z-10">
          <hgroup
            role="group"
            aria-roledescription="Heading group"
            className="mb-12"
          >
            <Eyebrow message="We buy vinyl" />
            <h1 className="font-heading text-shadow-headline text-[clamp(2.6rem,6.2vw,6rem)] leading-none uppercase">
              Bring Us
              <br /> Your{" "}
              <span className="text-accent text-shadow-headline-inverted">
                Crates.
              </span>
            </h1>
          </hgroup>
          <p className="mb-8 text-[clamp(1.05rem,1.4vw,1.3rem)] md:max-w-[35ch] lg:max-w-[50ch]">
            Downsizing, decluttering, or just done with that box in the closet —
            come in and let&apos;s see what you&apos;ve got. No appointment, no
            pressure, no lowball games.
          </p>
          <button className="btn btn-lg text-primary btn-accent md:btn-outline hover:text-primary-content font-bold tracking-widest uppercase">
            Get Directions
            <ArrowRightIcon />
          </button>
        </div>
        <div className="outline-accent border-base-content absolute z-0 hidden aspect-square w-[clamp(400px,80vw,1024px)] overflow-hidden rounded-full border-8 shadow-[0px_30px_60px_oklch(0_0_0/0.4)] outline-4 md:top-1/4 md:left-1/2 md:block">
          <Image
            src={recordCrate}
            alt="Photo of man browsing records in a crate"
            fill
            sizes="(max-width: 1024px) 40vw, 500px"
            className="object-cover"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}

export default SellHero;
