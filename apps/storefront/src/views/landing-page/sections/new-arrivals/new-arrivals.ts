import type { StaticImageData } from "next/image";
import elMalQuerer from "./covers/el-mal-querer.jpg";
import blackSabbath from "./covers/black-sabbath.jpg";
import soulfulTapestry from "./covers/soulful-tapestry.jpg";
import pinkMoon from "./covers/pink-moon.jpg";

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
    handle: "rosalia-el-mal-querer",
  },
  {
    title: "Black Sabbath",
    artist: "Black Sabbath",
    cover: blackSabbath,
    handle: "black-sabbath-black-sabbath",
  },
  {
    title: "Soulful Tapestry",
    artist: "Honey Cone",
    cover: soulfulTapestry,
    handle: "honey-cone-soulful-tapestry",
  },
  {
    title: "Pink Moon",
    artist: "Nick Drake",
    cover: pinkMoon,
    handle: "nick-drake-pink-moon",
  },
];

export { newArrivals };
export type { NewArrival };
