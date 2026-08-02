"use server";

import { medusa } from "@/lib/medusa/config";
import { HttpTypes } from "@medusajs/types";
import { getCacheOptions } from "./cookies";

type RegionResponse = { region: HttpTypes.StoreRegion };
type RegionsResponse = { regions: HttpTypes.StoreRegion[] };

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

async function getRegion(
  countryCode: string,
): Promise<HttpTypes.StoreRegion | undefined | null> {
  if (regionMap.has(countryCode)) {
    return regionMap.get(countryCode);
  }

  try {
    const regions = await listRegions();

    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMap.set(c?.iso_2 ?? "", region);
      });
    });

    return countryCode ? regionMap.get(countryCode) : regionMap.get("us");
  } catch (error) {
    console.error(
      `regions.ts: Could not resolve region for country code "${countryCode}".`,
      error,
    );
    return null;
  }
}

export { getRegion, listRegions, retrieveRegion };
