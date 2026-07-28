import Image, { type StaticImageData } from "next/image";
import styles from "./browse-by-genre-section.module.css";

interface AlbumCoverProps {
  cover: StaticImageData;
}

function AlbumCover({ cover }: AlbumCoverProps) {
  return (
    <div className={styles["album-cover"]}>
      <Image
        fill
        sizes="300px"
        alt=""
        src={cover}
        className={styles["cover-image"]}
      />
    </div>
  );
}

export default AlbumCover;
