import turntable from "@/images/turntable.jpeg";
import Image from "next/image";

function HeroSection() {
  return (
    <section className="bg-base-200 relative isolate flex min-h-[70vh] items-center justify-center pt-16 pb-12 md:py-16 lg:py-20">
      <Image
        src={turntable}
        alt="A closeup photo of a turntable."
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="container text-center">
        <h2 className="font-heading text-3xl">HeroSection</h2>
      </div>
    </section>
  );
}

export default HeroSection;
