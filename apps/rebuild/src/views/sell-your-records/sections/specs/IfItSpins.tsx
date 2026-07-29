import Eyebrow from "@/components/Eyebrow";

function IfItSpins() {
  return (
    <section className="bg-base-100 px-8 py-12 md:py-16 lg:py-20">
      <hgroup role="group" aria-roledescription="Heading group">
        <Eyebrow message="What We're Looking For" />
        <h2 className="font-heading text-shadow-headline text-heading mb-16 uppercase">
          If it spins, bring it in.
        </h2>
      </hgroup>
      <div className="flex flex-col gap-6 lg:flex-row"></div>
    </section>
  );
}

export default IfItSpins;
