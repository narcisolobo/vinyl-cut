import { describe, expect, it } from "vitest";
import { type HttpTypes } from "@medusajs/types";
import { toAlbum } from "./map-to-album";

const erasCategory = { id: "pcat_eras", name: "Eras" };

function image(url: string) {
  return { id: url, url };
}

function conditionOption(value: string) {
  return { value, option: { title: "Condition" } };
}

// Shaped after the real /store/products payload for "What's Going On" —
// one condition (NM), a front+back photo pair, one genre + one era.
const marvinGaye = {
  id: "prod_01KYYXZ9J7FZKDE7E8DEFABK93",
  handle: "marvin-gaye-what-s-going-on",
  title: "What’s Going On",
  subtitle: "Marvin Gaye",
  images: [
    image("http://localhost:9000/static/TS310-front-250.jpg"),
    image("http://localhost:9000/static/TS310-front-500.jpg"),
    image("http://localhost:9000/static/TS310-back-250.jpg"),
    image("http://localhost:9000/static/TS310-back-500.jpg"),
  ],
  categories: [
    { id: "pcat_rnb", name: "R&B/Soul", parent_category: null },
    {
      id: "pcat_1970s",
      name: "1970s",
      parent_category: erasCategory,
    },
  ],
  variants: [
    {
      id: "variant_nm",
      options: [conditionOption("NM")],
      calculated_price: { calculated_amount: 1675, currency_code: "usd" },
    },
  ],
} as unknown as HttpTypes.StoreProduct;

// Shaped after the real payload for "Pet Sounds" — two conditions (one of
// them "New", outside the M/NM/VG+/VG/G grading scale), front-only photos
// at two sizes (no back cover), and no era metadata.
const petSounds = {
  id: "prod_01KYYXZFXQVW5DQAPE9EW01BW0",
  title: "Pet Sounds",
  subtitle: "The Beach Boys",
  images: [
    image("http://localhost:9000/static/ST2458-front-250.jpg"),
    image("http://localhost:9000/static/ST2458-front-500.jpg"),
  ],
  categories: [{ id: "pcat_rock", name: "Rock", parent_category: null }],
  variants: [
    {
      id: "variant_new",
      options: [conditionOption("New")],
      calculated_price: { calculated_amount: 3828, currency_code: "usd" },
    },
    {
      id: "variant_g",
      options: [conditionOption("G")],
      calculated_price: { calculated_amount: 725, currency_code: "usd" },
    },
  ],
} as unknown as HttpTypes.StoreProduct;

describe("toAlbum", () => {
  it("maps title, artist, id, and handle", () => {
    const album = toAlbum(marvinGaye);

    expect(album.id).toBe("prod_01KYYXZ9J7FZKDE7E8DEFABK93");
    expect(album.handle).toBe("marvin-gaye-what-s-going-on");
    expect(album.title).toBe("What’s Going On");
    expect(album.artist).toBe("Marvin Gaye");
  });

  it("resolves the 500px front and back images from the URL, ignoring the 250px pair", () => {
    const album = toAlbum(marvinGaye);

    expect(album.frontImage).toBe(
      "http://localhost:9000/static/TS310-front-500.jpg",
    );
    expect(album.backImage).toBe(
      "http://localhost:9000/static/TS310-back-500.jpg",
    );
  });

  it("falls back to the placeholder image when there's no front photo", () => {
    const noImages = { ...marvinGaye, images: [] } as HttpTypes.StoreProduct;

    expect(toAlbum(noImages).frontImage).toBe("/placeholder-album.svg");
  });

  it("returns null backImage when there's no back photo", () => {
    expect(toAlbum(petSounds).backImage).toBeNull();
  });

  it("splits genre and era using the 'Eras' parent category", () => {
    const album = toAlbum(marvinGaye);

    expect(album.genre).toBe("R&B/Soul");
    expect(album.era).toBe("1970s");
  });

  it("returns a null era when no category is nested under 'Eras'", () => {
    const album = toAlbum(petSounds);

    expect(album.genre).toBe("Rock");
    expect(album.era).toBeNull();
  });

  it("maps every variant's condition and price, including non-grading-scale conditions", () => {
    const album = toAlbum(petSounds);

    expect(album.variants).toEqual([
      {
        id: "variant_new",
        condition: "New",
        price: { amount: 3828, currencyCode: "usd" },
        inStock: true,
      },
      {
        id: "variant_g",
        condition: "G",
        price: { amount: 725, currencyCode: "usd" },
        inStock: true,
      },
    ]);
  });

  it("treats a variant as in stock when Medusa doesn't manage its inventory", () => {
    const album = toAlbum(petSounds);

    expect(album.variants[0].inStock).toBe(true);
  });

  it("treats a managed, backorderable variant as in stock even with zero quantity", () => {
    const backorderable = {
      ...petSounds,
      variants: [
        {
          ...petSounds.variants![0],
          manage_inventory: true,
          allow_backorder: true,
          inventory_quantity: 0,
        },
      ],
    } as unknown as HttpTypes.StoreProduct;

    expect(toAlbum(backorderable).variants[0].inStock).toBe(true);
  });

  it("treats a managed, non-backorderable variant with zero quantity as out of stock", () => {
    const soldOut = {
      ...petSounds,
      variants: [
        {
          ...petSounds.variants![0],
          manage_inventory: true,
          allow_backorder: false,
          inventory_quantity: 0,
        },
      ],
    } as unknown as HttpTypes.StoreProduct;

    expect(toAlbum(soldOut).variants[0].inStock).toBe(false);
  });

  it("treats a managed, non-backorderable variant with positive quantity as in stock", () => {
    const inStock = {
      ...petSounds,
      variants: [
        {
          ...petSounds.variants![0],
          manage_inventory: true,
          allow_backorder: false,
          inventory_quantity: 3,
        },
      ],
    } as unknown as HttpTypes.StoreProduct;

    expect(toAlbum(inStock).variants[0].inStock).toBe(true);
  });

  it("treats a managed, non-backorderable variant with no inventory_quantity field as out of stock", () => {
    const noQuantityField = {
      ...petSounds,
      variants: [
        {
          ...petSounds.variants![0],
          manage_inventory: true,
          allow_backorder: false,
        },
      ],
    } as unknown as HttpTypes.StoreProduct;

    expect(toAlbum(noQuantityField).variants[0].inStock).toBe(false);
  });

  it("returns an empty-string genre when no category exists outside 'Eras'", () => {
    const onlyEra = {
      ...marvinGaye,
      categories: [
        { id: "pcat_1970s", name: "1970s", parent_category: erasCategory },
      ],
    } as unknown as HttpTypes.StoreProduct;

    expect(toAlbum(onlyEra).genre).toBe("");
  });

  it("returns an empty-string condition when no matching Condition option exists", () => {
    const noConditionOption = {
      ...petSounds,
      variants: [
        {
          id: "variant_x",
          options: [{ value: "Blue", option: { title: "Color" } }],
        },
      ],
    } as unknown as HttpTypes.StoreProduct;

    expect(toAlbum(noConditionOption).variants[0].condition).toBe("");
  });

  it("defaults price to zero USD when calculated_price is missing", () => {
    const noPrice = {
      ...petSounds,
      variants: [{ id: "variant_x", options: [conditionOption("NM")] }],
    } as unknown as HttpTypes.StoreProduct;

    expect(toAlbum(noPrice).variants[0].price).toEqual({
      amount: 0,
      currencyCode: "usd",
    });
  });

  it("defaults artist, genre, era, images, and variants when the product omits them entirely", () => {
    const bareProduct = {
      id: "prod_bare",
      handle: "bare-product",
      title: "Untitled",
    } as unknown as HttpTypes.StoreProduct;

    const album = toAlbum(bareProduct);

    expect(album.artist).toBe("");
    expect(album.genre).toBe("");
    expect(album.era).toBeNull();
    expect(album.frontImage).toBe("/placeholder-album.svg");
    expect(album.backImage).toBeNull();
    expect(album.variants).toEqual([]);
  });

  it("reads label, catalog number, release year, and press type from metadata", () => {
    const withMetadata = {
      ...marvinGaye,
      metadata: {
        label: "Tamla",
        catalog_number: "TS310",
        release_year: "1971",
        press_type: "Original Pressing",
      },
    } as unknown as HttpTypes.StoreProduct;

    const album = toAlbum(withMetadata);

    expect(album.label).toBe("Tamla");
    expect(album.catalogNumber).toBe("TS310");
    expect(album.releaseYear).toBe("1971");
    expect(album.pressType).toBe("Original Pressing");
  });

  it("treats a non-string metadata value as absent", () => {
    const badMetadata = {
      ...marvinGaye,
      metadata: { label: 12345 },
    } as unknown as HttpTypes.StoreProduct;

    expect(toAlbum(badMetadata).label).toBeNull();
  });

  it("maps a valid tracklist from metadata, defaulting malformed track fields", () => {
    const withTracklist = {
      ...marvinGaye,
      metadata: {
        tracklist: [
          { position: "A1", title: "Track One", length_ms: 200000 },
          { position: 2, title: "Track Two", length_ms: null },
          { title: "Track Three" },
          { position: "A2", title: 42, length_ms: "nope" },
        ],
      },
    } as unknown as HttpTypes.StoreProduct;

    expect(toAlbum(withTracklist).tracklist).toEqual([
      { position: "A1", title: "Track One", durationMs: 200000 },
      { position: "2", title: "Track Two", durationMs: null },
      { position: null, title: "Track Three", durationMs: null },
      { position: "A2", title: "", durationMs: null },
    ]);
  });

  it("returns an empty tracklist when metadata has no tracklist array", () => {
    const noTracklist = {
      ...marvinGaye,
      metadata: {},
    } as unknown as HttpTypes.StoreProduct;

    expect(toAlbum(noTracklist).tracklist).toEqual([]);
  });
});