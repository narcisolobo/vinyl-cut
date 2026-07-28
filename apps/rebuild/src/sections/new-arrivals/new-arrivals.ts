import type { StaticImageData } from "next/image";
import elMalQuerer from "./covers/el-mal-querer.jpg";
import homogenic from "./covers/homogenic.jpg";
import supaDupaFly from "./covers/supa-dupa-fly.jpg";
import theInfamous from "./covers/the-infamous.jpg";

type NewArrival = {
  title: string;
  artist: string;
  cover: StaticImageData | string;
  handle: string;
};

const newArrivals: NewArrival[] = [
  {
    title: "El Mal Querer",
    artist: "Rosalía",
    cover: elMalQuerer,
    handle: "el-mal-querer",
  },
  {
    title: "Homogenic",
    artist: "Björk",
    cover: homogenic,
    handle: "homogenic",
  },
  {
    title: "Supa Dupa Fly",
    artist: "Missy Elliott",
    cover: supaDupaFly,
    handle: "supa-dupa-fly",
  },
  {
    title: "The Infamous...",
    artist: "Mobb Deep",
    cover: theInfamous,
    handle: "the-infamous",
  },
];

export { newArrivals };
export type { NewArrival };
