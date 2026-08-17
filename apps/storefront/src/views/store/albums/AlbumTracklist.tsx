import { AlbumTrack } from "@/types/album";

interface AlbumTracklistProps {
  tracklist: AlbumTrack[];
}

/** Mirrors etl/tools/load_catalog.py's format_duration: m:ss, no leading zero on minutes. */
function formatDuration(durationMs: number | null): string {
  if (!durationMs) {
    return "?:??";
  }
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function AlbumTracklist({ tracklist }: AlbumTracklistProps) {
  return (
    <section>
      <h3 className="mb-2 text-lg font-semibold">Tracklist</h3>
      <ol className="flex flex-col gap-1">
        {tracklist.map((track, index) => (
          <li
            key={`${track.position ?? index}-${track.title}`}
            className="flex justify-between gap-4 text-sm"
          >
            <span>
              {track.position ? `${track.position}. ` : ""}
              {track.title}
            </span>
            <span className="text-base-content/60">
              {formatDuration(track.durationMs)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default AlbumTracklist;
