"use client";

import { type ReactNode } from "react";
import AlbumGridSkeleton from "./AlbumGridSkeleton";
import { useStoreGridTransition } from "./StoreGridTransition";

interface AlbumGridStatusProps {
  children: ReactNode;
}

/** Swaps the server-rendered grid (or empty state) for `AlbumGridSkeleton`
 * while a pagination navigation is pending -- see `StoreGridTransition`. */
function AlbumGridStatus({ children }: AlbumGridStatusProps) {
  const { isPending } = useStoreGridTransition();
  return isPending ? <AlbumGridSkeleton /> : children;
}

export default AlbumGridStatus;
