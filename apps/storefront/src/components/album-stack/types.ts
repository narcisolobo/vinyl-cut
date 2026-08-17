import { type StaticImageData } from "next/image";

type AlbumCover = {
  title: string;
  cover: StaticImageData;
};

type AlbumStack = {
  slug: string;
  label: string;
  covers: AlbumCover[];
};

type AlbumStacks = {
  filter: "genre" | "era";
  stacks: AlbumStack[];
};

export type { AlbumCover, AlbumStack, AlbumStacks };
