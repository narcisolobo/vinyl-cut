import CopyPane from "./copy/CopyPane";
import FunkySun from "./funky-sun/FunkySun";
import styles from "./hero-section.module.css";

function HeroSection() {
  return (
    <section
      id="home"
      className={`flex items-center justify-between min-h-[70dvh] overflow-hidden px-8 pt-48 pb-24 md:pb-28 lg:pb-32 ${styles.home}`}
    >
      <div className="flex w-full items-center justify-between gap-6">
        <CopyPane />
        <FunkySun />
      </div>
    </section>
  );
}

export default HeroSection;
