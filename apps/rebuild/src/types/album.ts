type AlbumPrice = {
  amount: number;
  currencyCode: string;
};

type AlbumVariant = {
  id: string;
  condition: string;
  price: AlbumPrice;
  inStock: boolean;
};

type AlbumTrack = {
  position: string | null;
  title: string;
  durationMs: number | null;
};

type Album = {
  id: string;
  handle: string;
  title: string;
  artist: string;
  genre: string;
  era: string | null;
  frontImage: string;
  backImage: string | null;
  variants: AlbumVariant[];
  label: string | null;
  catalogNumber: string | null;
  releaseYear: string | null;
  pressType: string | null;
  tracklist: AlbumTrack[];
};

export type { Album, AlbumVariant, AlbumPrice, AlbumTrack };
