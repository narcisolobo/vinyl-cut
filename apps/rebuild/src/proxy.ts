import { HttpTypes } from "@medusajs/types";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "dk";

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_HOUR_SECONDS = 60 * 60;
const ONE_DAY_SECONDS = 60 * 60 * 24;

interface CloudflareRequest extends NextRequest {
  cf?: { country?: string };
}

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
};

async function getRegionMap(
  cacheId: string,
): Promise<Map<string, HttpTypes.StoreRegion>> {
  const { regionMap, regionMapUpdated } = regionMapCache;

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable.",
    );
  }

  if (!PUBLISHABLE_API_KEY) {
    throw new Error(
      "Middleware.ts: Error fetching regions. Did you define a NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY environment variable.",
    );
  }

  if (regionMap.size === 0 || regionMapUpdated < Date.now() - ONE_HOUR_MS) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const response = await fetch(`${BACKEND_URL}/store/regions`, {
      method: "GET",
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY,
      },
      next: {
        revalidate: ONE_HOUR_SECONDS,
        tags: [`regions-${cacheId}`],
      },
      cache: "force-cache",
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const { regions }: HttpTypes.StoreRegionListResponse =
      await response.json();

    if (!regions?.length) {
      return new Map<string, HttpTypes.StoreRegion>();
    }

    // Create a map of country codes to regions.
    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region);
      });
    });

    regionMapCache.regionMapUpdated = Date.now();
  }

  return regionMapCache.regionMap;
}

/**
 * Determines the country code for a request by checking, in order: the URL
 * path segment, Cloudflare's geo header, Vercel's geo header, the configured
 * default region, then falling back to the first available region.
 */
async function getCountryCode(
  request: CloudflareRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>,
): Promise<string | undefined> {
  let countryCode: string | undefined;

  const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase();

  // Cloudflare Workers provides country via request.cf.country
  const cloudflareCountryCode = request.cf?.country?.toLowerCase();

  // Vercel provides x-vercel-ip-country header
  const vercelCountryCode = request.headers
    .get("x-vercel-ip-country")
    ?.toLowerCase();

  if (urlCountryCode && regionMap.has(urlCountryCode)) {
    countryCode = urlCountryCode;
  } else if (cloudflareCountryCode && regionMap.has(cloudflareCountryCode)) {
    countryCode = cloudflareCountryCode;
  } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
    countryCode = vercelCountryCode;
  } else if (regionMap.has(DEFAULT_REGION)) {
    countryCode = DEFAULT_REGION;
  } else if (regionMap.size > 0) {
    countryCode = regionMap.keys().next().value;
  }

  return countryCode;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next();
  }

  const cacheIdCookie = request.cookies.get("_medusa_cache_id");
  const cacheId = cacheIdCookie?.value || crypto.randomUUID();

  const regionMap = await getRegionMap(cacheId);
  const countryCode = await getCountryCode(request, regionMap);

  // if the country code is available, use it, otherwise use the default region
  const country = countryCode || DEFAULT_REGION;
  const firstPathSegment = request.nextUrl.pathname
    .split("/")[1]
    ?.toLowerCase();
  const urlHasCountry = firstPathSegment === country.toLowerCase();

  if (urlHasCountry) {
    if (!cacheIdCookie) {
      const response = NextResponse.next();
      response.cookies.set("_medusa_cache_id", cacheId, {
        maxAge: ONE_DAY_SECONDS,
      });
      return response;
    }
    return NextResponse.next();
  }

  // if the url doesn't have the country, redirect to it
  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname;
  const queryString = request.nextUrl.search || "";
  const redirectUrl = `${request.nextUrl.origin}/${country}${redirectPath}${queryString}`;

  return NextResponse.redirect(redirectUrl, 307);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
};
