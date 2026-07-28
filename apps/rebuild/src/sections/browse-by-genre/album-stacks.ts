import { type StaticImageData } from "next/image";

// soul
import imStillInLoveWithYou from "./covers/im-still-in-love-with-you.jpg";
import songsInTheKeyOfLife from "./covers/songs-in-the-key-of-life.jpg";
import whatsGoingOn from "./covers/whats-going-on.jpg";

// rock
import ledZeppelinIV from "./covers/led-zeppelin-iv.jpg";
import theDarkSideOfTheMoon from "./covers/the-dark-side-of-the-moon.jpg";
import tommy from "./covers/tommy.jpg";

// rap
import enterTheWuTang from "./covers/enter-the-wu-tang.jpg";
import itTakesANation from "./covers/it-takes-a-nation.jpg";
import readyToDie from "./covers/ready-to-die.jpeg";

interface AlbumCover {
  title: string;
  cover: StaticImageData;
}

interface AlbumStack {
  slug: string;
  genre: string;
  covers: AlbumCover[];
}

const albumStacks: AlbumStack[] = [
  {
    slug: "soul",
    genre: "soul",
    covers: [
      { title: "What's Going On", cover: whatsGoingOn },
      { title: "I'm Still In Love With You", cover: imStillInLoveWithYou },
      { title: "Songs in the Key of Life", cover: songsInTheKeyOfLife },
    ],
  },
  {
    slug: "rock",
    genre: "rock",
    covers: [
      { title: "Tommy", cover: tommy },
      { title: "Led Zeppelin IV", cover: ledZeppelinIV },
      { title: "The Dark Side of the Moon", cover: theDarkSideOfTheMoon },
    ],
  },
  {
    slug: "rap",
    genre: "rap",
    covers: [
      { title: "Enter the Wu-Tang", cover: enterTheWuTang },
      { title: "It Takes a Nation of Millions", cover: itTakesANation },
      { title: "Ready to Die", cover: readyToDie },
    ],
  },
];

export { albumStacks, type AlbumStack };
