import CopyPane from "./copy/CopyPane";
import FunkySun from "./funky-sun/FunkySun";

function HeroSection() {
  return (
    <section
      id="home"
      className="vc-gradient relative flex min-h-[70dvh] items-center overflow-hidden px-8 pt-48 pb-24 md:pb-28 lg:pb-32"
    >
      <CopyPane />
      <FunkySun />
    </section>
  );
}

export default HeroSection;
