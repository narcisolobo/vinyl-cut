import { type AlbumStacks } from "@/components/album-stack/types";

// soul
import imStillInLoveWithYou from "./covers/soul/im-still-in-love-with-you.jpg";
import songsInTheKeyOfLife from "./covers/soul/songs-in-the-key-of-life.jpg";
import whatsGoingOn from "./covers/soul/whats-going-on.jpg";

// rock
import ledZeppelinIV from "./covers/rock/led-zeppelin-iv.jpg";
import theDarkSideOfTheMoon from "./covers/rock/the-dark-side-of-the-moon.jpg";
import tommy from "./covers/rock/tommy.jpg";

// rap
import enterTheWuTang from "./covers/rap/enter-the-wu-tang.jpg";
import itTakesANation from "./covers/rap/it-takes-a-nation.jpg";
import readyToDie from "./covers/rap/ready-to-die.jpeg";

const genreStacks: AlbumStacks = {
  filter: "genre",
  stacks: [
    {
      slug: "soul",
      label: "soul",
      covers: [
        { title: "What's Going On", cover: whatsGoingOn },
        { title: "I'm Still In Love With You", cover: imStillInLoveWithYou },
        { title: "Songs in the Key of Life", cover: songsInTheKeyOfLife },
      ],
    },
    {
      slug: "rock",
      label: "rock",
      covers: [
        { title: "Tommy", cover: tommy },
        { title: "Led Zeppelin IV", cover: ledZeppelinIV },
        { title: "The Dark Side of the Moon", cover: theDarkSideOfTheMoon },
      ],
    },
    {
      slug: "hip-hop",
      label: "hip-hop",
      covers: [
        { title: "Enter the Wu-Tang", cover: enterTheWuTang },
        { title: "It Takes a Nation of Millions", cover: itTakesANation },
        { title: "Ready to Die", cover: readyToDie },
      ],
    },
  ],
};

export { genreStacks };
