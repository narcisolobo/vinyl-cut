type AlbumPrice = {
  amount: number;
  currencyCode: string;
};

type AlbumVariant = {
  id: string;
  condition: string;
  price: AlbumPrice;
};

type Album = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  era: string | null;
  frontImage: string;
  backImage: string | null;
  variants: AlbumVariant[];
};

export type { Album, AlbumVariant, AlbumPrice };
