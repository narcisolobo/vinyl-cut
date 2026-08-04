const MAX_LENGTH = 155;

/**
 * `album.description` (built by `build_description()` in
 * etl/tools/load_catalog.py) is "artist — title\nyear · label ·
 * catalog · press type", then a blank line, then the full tracklist —
 * fine as PDP body copy, but reused as-is for `<meta
 * name="description">` it produces an absurdly long, multi-line tag
 * that search engines truncate mid-word and social previews mangle.
 * Keeps just the header line(s) before the blank line, then
 * hard-truncates on a word boundary as a safety net for unusually
 * long label/catalog text.
 */
function buildMetaDescription(description: string): string {
  const [header] = description.split("\n\n");
  if (header.length <= MAX_LENGTH) {
    return header;
  }
  return `${header.slice(0, MAX_LENGTH - 1).trimEnd()}…`;
}

export { buildMetaDescription };
