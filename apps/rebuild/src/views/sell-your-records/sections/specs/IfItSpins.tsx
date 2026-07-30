import Eyebrow from "@/components/Eyebrow";
import Image from "next/image";
import recordSpinning from "@/views/sell-your-records/images/record-spinning.jpg";

function IfItSpins() {
  return (
    <section className="bg-base-100 mx-auto w-full max-w-7xl overflow-hidden px-8 py-12 md:py-16 lg:py-20">
      <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
        <div className="flex-1">
          <hgroup role="group" aria-roledescription="Heading group">
            <Eyebrow message="What we're looking for" />
            <h2 className="font-heading text-shadow-headline text-heading mb-16 leading-14 uppercase">
              If it spins,
              <br /> bring it in.
            </h2>
          </hgroup>
          <p className="text-lg">
            We&apos;re always hunting for soul, funk, rock, hip-hop, and jazz
            pressings from any era — mint or well-loved, we&apos;re interested
            either way. Box sets, one-offs, entire collections.
          </p>
        </div>
        <div
          id="thin-border"
          className="border-accent/30 relative max-w-160 min-w-75 flex-1 -translate-6 border-2"
        >
          <div
            id="thick-shadow"
            className="relative aspect-4/3 translate-4 shadow-[12px_12px_0_var(--color-accent)]"
          >
            <Image
              src={recordSpinning}
              alt="Store employee at the counter with a stack of vinyl records"
              fill
              sizes="(max-width: 1024px) 90vw, 600px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default IfItSpins;
