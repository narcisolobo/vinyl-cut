import Link from "next/link";
import { type AlbumStack } from "./album-stacks";
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
      <div
        className={`${styles["album-stack"]} relative aspect-square transition-transform duration-500 transform-3d`}
      >
        {albumStack.covers.map(({ title, cover }) => (
          <AlbumCover key={title} cover={cover} />
        ))}
        <span className="btn btn-outline btn-accent text-base-content font-heading bg-base-100 absolute -bottom-3 -left-3 z-10 text-sm font-semibold whitespace-nowrap uppercase">
          {albumStack.genre}
        </span>
      </div>
    </Link>
  );
}

export default AlbumStack;
