import type { AlbumStacks } from "@/components/album-stack/types";

// 1960s
import aLoveSupreme from "./covers/1960s/a-love-supreme.jpg";
import dictionaryOfSoul from "./covers/1960s/dictionary-of-soul.jpg";
import petSounds from "./covers/1960s/pet-sounds.jpg";

// 1970s
import oneNationUnderAGroove from "./covers/1970s/one-nation-under-a-groove.jpg";
import stillBill from "./covers/1970s/still-bill.jpg";
import theHarderTheyCome from "./covers/1970s/the-harder-they-come.jpg";

// 1980s
import appetiteForDestruction from "./covers/1980s/appetite-for-destruction.jpg";
import beautyAndTheBeat from "./covers/1980s/beauty-and-the-beat.jpg";
import raisingHell from "./covers/1980s/raising-hell.jpg";

// 1990s
import deLaSoulIsDead from "./covers/1990s/de-la-soul-is-dead.jpg";
import odelay from "./covers/1990s/odelay.jpg";
import rageAgainstTheMachine from "./covers/1990s/rage-against-the-machine.jpg";

const eraStacks: AlbumStacks = {
  filter: "era",
  stacks: [
    {
      slug: "1960s",
      label: "1960s",
      covers: [
        { title: "A Love Supreme", cover: aLoveSupreme },
        { title: "Dictionary of Soul", cover: dictionaryOfSoul },
        { title: "Pet Sounds", cover: petSounds },
      ],
    },
    {
      slug: "1970s",
      label: "1970s",
      covers: [
        { title: "The Harder They Come", cover: theHarderTheyCome },
        { title: "Still Bill", cover: stillBill },
        { title: "One Nation Under a Groove", cover: oneNationUnderAGroove },
      ],
    },
    {
      slug: "1980s",
      label: "1980s",
      covers: [
        { title: "Appetite for Destruction", cover: appetiteForDestruction },
        { title: "Raising Hell", cover: raisingHell },
        { title: "Beauty and the Beat", cover: beautyAndTheBeat },
      ],
    },
    {
      slug: "1990s",
      label: "1990s",
      covers: [
        { title: "De La Soul Is Dead", cover: deLaSoulIsDead },
        { title: "Odelay", cover: odelay },
        { title: "Rage Against the Machine", cover: rageAgainstTheMachine },
      ],
    },
  ],
};

export { eraStacks };
