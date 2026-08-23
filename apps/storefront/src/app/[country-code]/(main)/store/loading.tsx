import AlbumsSkeleton from "@/views/store/albums/AlbumsSkeleton";

/**
 * The inline `<Suspense fallback={<AlbumsSkeleton />}>` around `Albums`
 * in `page.tsx` never actually shows during pagination -- confirmed
 * live via a MutationObserver across a real ~1s+ transition, the
 * fallback simply never mounts. Only the `loading.js` file convention
 * gets Next's "instant loading state on navigation" treatment; an
 * ad-hoc inline Suspense boundary doesn't. This file is that
 * mechanism, reusing the same skeleton component.
 */
function Loading() {
  return <AlbumsSkeleton />;
}

export default Loading;
