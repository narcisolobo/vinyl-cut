import Link from "next/link";
import type { AlbumStack } from "./album-stacks";
import AlbumCover from "./AlbumCover";
import styles from "./browse-by-genre-section.module.css";

interface AlbumStackProps {
  albumStack: AlbumStack;
}

function AlbumStack({ albumStack }: AlbumStackProps) {
  /* TODO: fill href with actual query params */
  return (
    <Link
      href={`/store?genre=${albumStack.slug}`}
      className={styles["genre-tile-link"]}
    >
      <div className={styles["album-stack"]}>
        {albumStack.covers.map(({ title, cover }) => (
          <AlbumCover key={title} cover={cover} />
        ))}
        <span className={styles["genre-label"]}>{albumStack.genre}</span>
      </div>
    </Link>
  );
}

export default AlbumStack;
