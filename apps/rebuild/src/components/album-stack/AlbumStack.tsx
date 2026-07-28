import Link from "next/link";
import { type AlbumStack } from "./types";
import AlbumCover from "./AlbumCover";
import styles from "./album-stack.module.css";

interface AlbumStackProps {
  filter: "genre" | "era";
  albumStack: AlbumStack;
}

function AlbumStack({ filter, albumStack }: AlbumStackProps) {
  const { slug, label, covers } = albumStack;

  /* TODO: fill href with actual query params */
  return (
    <Link
      href={`/store?${filter}=${slug}`}
      className={styles["genre-tile-link"]}
    >
      <div
        className={`${styles["album-stack"]} relative aspect-square transition-transform duration-500`}
      >
        {covers.map(({ title, cover }) => (
          <AlbumCover key={title} cover={cover} />
        ))}
        <span className="btn btn-outline btn-accent text-base-content font-heading bg-base-100 absolute -bottom-3 -left-3 z-10 text-sm font-semibold whitespace-nowrap uppercase">
          {label}
        </span>
      </div>
    </Link>
  );
}

export default AlbumStack;
