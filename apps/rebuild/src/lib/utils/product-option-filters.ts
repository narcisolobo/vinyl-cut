const OPTION_VALUE_QUERY_KEY = "optionValueIds";

type OptionValueIds = string[];

type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

/** Drops empty strings, then deduplicates what's left. */
function dedupeTruthy(values: string[]): OptionValueIds {
  return Array.from(new Set(values.filter(Boolean)));
}

/**
 * Reads option-value filter IDs out of a search params object,
 * deduplicated. Accepts either a real `URLSearchParams` (client
 * components, via `useSearchParams()`) or the plain object Next.js
 * passes as `searchParams` to Server Component pages.
 */
function parseOptionValueIds(searchParams: SearchParamsLike): OptionValueIds {
  if (searchParams instanceof URLSearchParams) {
    return dedupeTruthy(searchParams.getAll(OPTION_VALUE_QUERY_KEY));
  }

  const paramValue = searchParams[OPTION_VALUE_QUERY_KEY];

  if (Array.isArray(paramValue)) {
    return dedupeTruthy(paramValue);
  }

  if (typeof paramValue === "string" && paramValue.length > 0) {
    return dedupeTruthy(paramValue.split(","));
  }

  return [];
}

export type { OptionValueIds };
export { OPTION_VALUE_QUERY_KEY, dedupeTruthy, parseOptionValueIds };
