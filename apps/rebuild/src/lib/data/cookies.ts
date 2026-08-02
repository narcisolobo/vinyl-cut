import "server-only";
import { cookies as nextCookies } from "next/headers";

type MaybeEmpty<T> = T | Record<string, never>;
type CacheTags = { tags: string[] };

const CACHE_ID_COOKIE = "_medusa_cache_id";
const CART_ID_COOKIE = "_medusa_cart_id";

async function getCacheTag(tag: string): Promise<string> {
  try {
    const cookies = await nextCookies();
    const cacheId = cookies.get(CACHE_ID_COOKIE)?.value;

    if (!cacheId) {
      return "";
    }

    return `${tag}-${cacheId}`;
  } catch (error) {
    console.error(`cookies.ts: Failed to read "${CACHE_ID_COOKIE}".`, error);
    return "";
  }
}

async function getCacheOptions(tag: string): Promise<MaybeEmpty<CacheTags>> {
  const cacheTag = await getCacheTag(tag);

  if (!cacheTag) {
    return {};
  }

  return { tags: [`${cacheTag}`] };
}

async function getCartId(): Promise<string | undefined> {
  const cookies = await nextCookies();
  return cookies.get(CART_ID_COOKIE)?.value;
}

async function setCartId(cartId: string): Promise<void> {
  const cookies = await nextCookies();
  cookies.set(CART_ID_COOKIE, cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

async function removeCartId(): Promise<void> {
  const cookies = await nextCookies();
  cookies.set(CART_ID_COOKIE, "", {
    maxAge: -1,
  });
}

export { getCacheTag, getCacheOptions, getCartId, setCartId, removeCartId };
