import "server-only";
import { cookies as nextCookies } from "next/headers";

type MaybeEmpty<T> = T | Record<string, never>;
type CacheTags = { tags: string[] };

const CACHE_ID_COOKIE = "_medusa_cache_id";
const CART_ID_COOKIE = "_medusa_cart_id";

/**
 * Namespaces `tag` with the `_medusa_cache_id` cookie so cache tags
 * are per-visitor. Fails soft — logs and returns `""` — since the
 * caller (`getCacheOptions`) treats an empty tag as "skip tagging,"
 * not as a broken fetch.
 */
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

/**
 * Builds the `next: { tags }` option for Next.js's data cache.
 * Returns `{}` (no tags) when there's no cache id cookie yet — the
 * fetch still happens and gets cached, just without a tag that can
 * later be targeted by `revalidateTag`.
 */
async function getCacheOptions(tag: string): Promise<MaybeEmpty<CacheTags>> {
  const cacheTag = await getCacheTag(tag);

  if (!cacheTag) {
    return {};
  }

  return { tags: [`${cacheTag}`] };
}

/** Reads the cart ID cookie. */
async function getCartId(): Promise<string | undefined> {
  try {
    const cookies = await nextCookies();
    return cookies.get(CART_ID_COOKIE)?.value;
  } catch (error) {
    throw new Error(`cookies.ts: Failed to read "${CART_ID_COOKIE}".`, {
      cause: error,
    });
  }
}

/**
 * Writes the cart ID cookie. `httpOnly` and `sameSite: "strict"` so
 * it can't be read or forged by client-side script.
 */
async function setCartId(cartId: string): Promise<void> {
  try {
    const cookies = await nextCookies();
    cookies.set(CART_ID_COOKIE, cartId, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
  } catch (error) {
    throw new Error(`cookies.ts: Failed to set "${CART_ID_COOKIE}".`, {
      cause: error,
    });
  }
}

/** Clears the cart ID cookie by expiring it immediately. */
async function removeCartId(): Promise<void> {
  try {
    const cookies = await nextCookies();
    cookies.set(CART_ID_COOKIE, "", {
      maxAge: -1,
    });
  } catch (error) {
    throw new Error(`cookies.ts: Failed to clear "${CART_ID_COOKIE}".`, {
      cause: error,
    });
  }
}

export { getCacheTag, getCacheOptions, getCartId, setCartId, removeCartId };
