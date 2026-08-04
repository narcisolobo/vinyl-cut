import { describe, expect, it } from "vitest";
import { buildMetaDescription } from "./build-meta-description";

describe("buildMetaDescription", () => {
  it("drops the tracklist after the blank line", () => {
    const description =
      "Marvin Gaye — What’s Going On\n1971 · Tamla · TS310 · 12\" Vinyl\n\nTracklist:\nA1. What’s Going On (4:00)\nA2. What’s Happening Brother (2:57)";

    expect(buildMetaDescription(description)).toBe(
      'Marvin Gaye — What’s Going On\n1971 · Tamla · TS310 · 12" Vinyl',
    );
  });

  it("returns the whole string unchanged when there's no blank line", () => {
    expect(buildMetaDescription("Artist — Title")).toBe("Artist — Title");
  });

  it("hard-truncates an unusually long header on a word boundary", () => {
    const header = "Artist — " + "a very long title ".repeat(10).trim();
    const description = `${header}\n\nTracklist:\nA1. Track (1:00)`;

    const result = buildMetaDescription(description);

    expect(result.length).toBeLessThanOrEqual(155);
    expect(result.endsWith("…")).toBe(true);
  });
});
