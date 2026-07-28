import Image, { type StaticImageData } from "next/image";
import styles from "./browse-by-genre-section.module.css";

interface AlbumCoverProps {
  cover: StaticImageData;
}

function AlbumCover({ cover }: AlbumCoverProps) {
  return (
    <div className={`${styles["album-cover"]} absolute inset-0 origin-bottom`}>
      <Image
        fill
        sizes="(max-width: 1200px) 300px, (max-width: 2000px) 25vw, 500px"
        alt=""
        src={cover}
        className="object-cover"
      />
    </div>
  );
}

export default AlbumCover;
