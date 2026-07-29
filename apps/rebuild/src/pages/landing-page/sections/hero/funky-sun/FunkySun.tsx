import Image from "next/image";
import styles from "./funky-sun.module.css";
import adapter from "@/images/adapter.svg";

function FunkySun() {
  return (
    <div className="absolute -right-60 -bottom-60 scale-50 sm:-right-55 sm:-bottom-50 sm:scale-75 lg:-right-20 lg:-bottom-20 lg:scale-100">
      <div className="relative flex min-h-130 items-center justify-center">
        <div id="funky-sun" className={styles["funky-sun"]}></div>
        <div id="vinyl" className={styles.vinyl}></div>
        <div
          id="adapter"
          className={`motion-safe:animate-spin ${styles.adapter}`}
        >
          <Image
            src={adapter}
            loading="eager"
            alt="An image of a 45 RPM record adapter"
            className="block h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}

export default FunkySun;
