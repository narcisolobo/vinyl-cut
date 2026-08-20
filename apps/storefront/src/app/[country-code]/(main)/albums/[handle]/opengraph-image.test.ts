import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type Album } from "@/types/album";

const { getProductByHandleMock, toAlbumMock } = vi.hoisted(() => ({
  getProductByHandleMock: vi.fn(),
  toAlbumMock: vi.fn(),
}));

vi.mock("@/lib/data/products", () => ({
  getProductByHandle: getProductByHandleMock,
}));

vi.mock("@/lib/utils/map-to-album", () => ({
  toAlbum: toAlbumMock,
}));

import generateImage, { generateImageMetadata } from "./opengraph-image";

// 2x2 solid-red PNG, inline so the "found" case never touches the
// network — `next/og`'s ImageResponse fetches a real `<img src>` URL to
// rasterize it, and a fake http:// URL would hang/fail in a test.
const TEST_IMAGE_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP8z8Dwn4GBgYGJAQoAHxcCAk+Uzr4AAAAASUVORK5CYII=";

const testAlbum: Album = {
  id: "prod_test",
  handle: "test-album",
  title: "Test Album",
  artist: "Test Artist",
  genre: "Rock",
  era: "1970s",
  frontImage: TEST_IMAGE_DATA_URI,
  backImage: null,
  variants: [
    {
      id: "variant_1",
      condition: "NM",
      price: { amount: 1500, currencyCode: "usd" },
      inStock: true,
    },
  ],
  label: null,
  catalogNumber: null,
  releaseYear: null,
  pressType: null,
  tracklist: [],
};

const params = Promise.resolve({
  "country-code": "us",
  handle: "test-album",
});

beforeEach(() => {
  getProductByHandleMock.mockReset();
  toAlbumMock.mockReset();
});

describe("opengraph-image", () => {
  describe("when the product fetch succeeds", () => {
    it("generateImageMetadata identifies the image by the album's handle", async () => {
      getProductByHandleMock.mockResolvedValue({});
      toAlbumMock.mockReturnValue(testAlbum);

      const metadata = await generateImageMetadata({ params });

      expect(metadata).toEqual([
        {
          id: "test-album",
          alt: "Test Artist — Test Album album cover, available at The Vinyl Cut",
          width: 1200,
          height: 630,
          contentType: "image/png",
        },
      ]);
    });

    it("Image renders a valid PNG at the configured size", async () => {
      getProductByHandleMock.mockResolvedValue({});
      toAlbumMock.mockReturnValue(testAlbum);

      const response = await generateImage({ params });

      expect(response.headers.get("content-type")).toBe("image/png");

      const buffer = Buffer.from(await response.arrayBuffer());
      expect(buffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(buffer.readUInt32BE(16)).toBe(1200);
      expect(buffer.readUInt32BE(20)).toBe(630);
    });
  });

  describe("when the product fetch fails", () => {
    it("generateImageMetadata falls back to a generic entry instead of throwing", async () => {
      getProductByHandleMock.mockResolvedValue(null);

      const metadata = await generateImageMetadata({ params });

      expect(metadata).toEqual([
        {
          id: "fallback",
          alt: "The Vinyl Cut",
          width: 1200,
          height: 630,
          contentType: "image/png",
        },
      ]);
      expect(toAlbumMock).not.toHaveBeenCalled();
    });

    it("Image renders the branded fallback.png instead of throwing", async () => {
      getProductByHandleMock.mockResolvedValue(null);

      const response = await generateImage({ params });

      expect(response.headers.get("content-type")).toBe("image/png");

      const buffer = Buffer.from(await response.arrayBuffer());
      expect(buffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(buffer.readUInt32BE(16)).toBe(1200);
      expect(buffer.readUInt32BE(20)).toBe(630);

      // Satori re-rasterizes and re-encodes the source PNG rather than
      // passing its bytes through untouched, so the output is never
      // byte-identical to fallback.png -- a non-trivial size is the
      // most this can assert without adding an image-decoding
      // dependency just to compare pixels.
      const fallbackBytes = await readFile(
        join(
          process.cwd(),
          "src/app/[country-code]/(main)/albums/[handle]/fallback.png",
        ),
      );
      expect(buffer.length).toBeGreaterThan(fallbackBytes.length / 2);
    });
  });
});
