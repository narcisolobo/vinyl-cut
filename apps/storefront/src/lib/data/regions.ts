"use server";

import { medusa } from "@/lib/medusa/config";
import { type HttpTypes } from "@medusajs/types";
import { getCacheOptions } from "./cookies";

type RegionResponse = { region: HttpTypes.StoreRegion };
type RegionsResponse = { regions: HttpTypes.StoreRegion[] };

/**
 * Fetches every region from Medusa. Throws — rather than failing
 * soft — since callers need real region data to render.
 */
async function listRegions(): Promise<HttpTypes.StoreRegion[]> {
  const next = {
    ...(await getCacheOptions("regions")),
  };

  try {
    const { regions } = await medusa.client.fetch<RegionsResponse>(
      `/store/regions`,
      {
        method: "GET",
        next,
        cache: "force-cache",
      },
    );

    return regions;
  } catch (error) {
    throw new Error("regions.ts: Failed to fetch regions from Medusa.", {
      cause: error,
    });
  }
}

/**
 * Fetches a single region by ID. Throws — rather than failing
 * soft — since callers need real region data to render.
 */
async function retrieveRegion(id: string): Promise<HttpTypes.StoreRegion> {
  const next = {
    ...(await getCacheOptions(["regions", id].join("-"))),
  };

  try {
    const { region } = await medusa.client.fetch<RegionResponse>(
      `/store/regions/${id}`,
      {
        method: "GET",
        next,
        cache: "force-cache",
      },
    );

    return region;
  } catch (error) {
    throw new Error(`regions.ts: Failed to fetch region "${id}" from Medusa.`, {
      cause: error,
    });
  }
}

const regionMap = new Map<string, HttpTypes.StoreRegion>();

/**
 * Resolves a region by country code, caching the full country-code
 * → region map in memory after the first successful fetch so repeat
 * calls don't re-hit Medusa. Falls back to `"us"` when no country
 * code is given. Fails soft — logs and returns `null` — rather than
 * throwing, since callers already handle a missing region instead
 * of crashing the page.
 */
async function getRegion(
  countryCode: string,
): Promise<HttpTypes.StoreRegion | undefined | null> {
  const cacheKey = countryCode || "us";

  if (regionMap.has(cacheKey)) {
    return regionMap.get(cacheKey);
  }

  try {
    const regions = await listRegions();

    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMap.set(c?.iso_2 ?? "", region);
      });
    });

    return regionMap.get(cacheKey);
  } catch (error) {
    console.error(
      `regions.ts: Could not resolve region for country code "${countryCode}".`,
      error,
    );
    return null;
  }
}

export { getRegion, listRegions, retrieveRegion };
