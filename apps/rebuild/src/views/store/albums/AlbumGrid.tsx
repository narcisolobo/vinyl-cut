import AlbumGridCard from "./AlbumGridCard";
import { Album } from "@/types/album";

interface AlbumGridProps {
  albums: Album[];
}

function AlbumGrid({ albums }: AlbumGridProps) {
  return (
    <ul
      role="list"
      className="grid list-none grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4"
    >
      {albums.map((album) => (
        <AlbumGridCard key={album.id} album={album} />
      ))}
    </ul>
  );
}

export default AlbumGrid;
