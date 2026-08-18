import AlbumGridCard from "./AlbumGridCard";
import { Album } from "@/types/album";

interface AlbumGridProps {
  albums: Album[];
  returnTo: string;
}

function AlbumGrid({ albums, returnTo }: AlbumGridProps) {
  return (
    <ul
      role="list"
      className="grid list-none grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      {albums.map((album) => (
        <AlbumGridCard key={album.id} album={album} returnTo={returnTo} />
      ))}
    </ul>
  );
}

export default AlbumGrid;
