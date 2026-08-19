import { getProductByHandle } from "@/lib/data/products";
import { formatPrice } from "@/lib/utils/format-price";
import { getLowestPriceVariant } from "@/lib/utils/get-lowest-price-variant";
import { toAlbum } from "@/lib/utils/map-to-album";
import { type Album } from "@/types/album";
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

interface OpengraphImageParams {
  params: Promise<{ "country-code": string; handle: string }>;
}

const size = { width: 1200, height: 630 };
const contentType = "image/png";

const COLOR_BACKGROUND = "#0f172a";
const COLOR_PRIMARY = "#ffd6a7";
const COLOR_ACCENT = "#ff8904";
const COLOR_MUTED = "#c9cbd0";

/**
 * Next invokes `generateImageMetadata` during static-params collection
 * before the request's actual `[country-code]` segment is resolved, so
 * `countryCode` can arrive empty — fall back to the store's only region
 * (mirrors the default in `src/proxy.ts`) rather than throwing.
 */
async function getAlbum(
  params: OpengraphImageParams["params"],
): Promise<Album> {
  const { "country-code": countryCode, handle } = await params;
  const resolvedCountryCode =
    countryCode || process.env.NEXT_PUBLIC_DEFAULT_REGION || "us";

  const product = await getProductByHandle(handle, resolvedCountryCode);
  if (!product) notFound();

  return toAlbum(product);
}

async function generateImageMetadata({ params }: OpengraphImageParams) {
  const album = await getAlbum(params);

  return [
    {
      id: album.handle,
      alt: `${album.artist} — ${album.title} album cover, available at The Vinyl Cut`,
      ...size,
      contentType,
    },
  ];
}

async function Image({ params }: OpengraphImageParams) {
  const album = await getAlbum(params);
  const lowestPriceVariant = getLowestPriceVariant(album.variants);

  const [lobsterData, bungeeData, outfitData] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Lobster-Regular.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Bungee-Regular.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Outfit-Regular.woff")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: COLOR_BACKGROUND,
          padding: "56px",
          fontFamily: "Outfit",
        }}
      >
        <div style={{ display: "flex" }}>
          <span
            style={{
              fontFamily: "Lobster",
              fontSize: 40,
              color: COLOR_PRIMARY,
            }}
          >
            The Vinyl Cut
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: 56,
            marginTop: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 420,
              height: 420,
              flexShrink: 0,
              borderRadius: 24,
              overflow: "hidden",
              border: `4px solid ${COLOR_ACCENT}`,
            }}
          >
            <img
              src={album.frontImage}
              alt=""
              width={420}
              height={420}
              style={{ objectFit: "cover" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 16,
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <span
                style={{
                  display: "flex",
                  fontSize: 22,
                  color: COLOR_ACCENT,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  border: `2px solid ${COLOR_ACCENT}`,
                  borderRadius: 999,
                  padding: "6px 18px",
                }}
              >
                {album.genre}
              </span>
              {album.era && (
                <span
                  style={{
                    display: "flex",
                    fontSize: 22,
                    color: COLOR_ACCENT,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    border: `2px solid ${COLOR_ACCENT}`,
                    borderRadius: 999,
                    padding: "6px 18px",
                  }}
                >
                  {album.era}
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Bungee",
                fontSize: 56,
                lineHeight: 1.15,
                color: COLOR_PRIMARY,
              }}
            >
              {album.title}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 32,
                color: COLOR_ACCENT,
              }}
            >
              {album.artist}
            </div>

            {lowestPriceVariant && (
              <div
                style={{
                  display: "flex",
                  fontSize: 28,
                  color: COLOR_MUTED,
                }}
              >
                From {formatPrice(lowestPriceVariant.price)}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Lobster", data: lobsterData, style: "normal", weight: 400 },
        { name: "Bungee", data: bungeeData, style: "normal", weight: 400 },
        { name: "Outfit", data: outfitData, style: "normal", weight: 400 },
      ],
    },
  );
}

export { contentType, generateImageMetadata, size };
export default Image;
