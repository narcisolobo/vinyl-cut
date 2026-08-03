import { medusa } from "@/lib/medusa/config";
import { type HttpTypes } from "@medusajs/types";
import { getCacheOptions } from "./cookies";

type ProductOptionValue = { id: string; value: string };
type ProductOption = { id: string; title: string; values?: ProductOptionValue[] };
type ProductOptionsResponse = { product_options: ProductOption[] };
type ProductCategoriesResponse = {
  product_categories: HttpTypes.StoreProductCategory[];
};

type StoreFilterSelections = {
  genres?: string[];
  eras?: string[];
  conditions?: string[];
};

type ResolvedProductFilters = {
  categoryIds: string[];
  optionValueIds: string[];
};

const CONDITION_OPTION_TITLE = "Condition";

/**
 * Maps this store's condition-filter display labels (as they appear
 * in `store-filter-utils.ts`'s `CONDITIONS` and in the `?condition=`
 * URL param) to the grade symbol Medusa's shared "Condition" option
 * actually stores as each value's `value` field — see
 * `etl/tools/load_catalog.py`'s `CONDITION_GRADES`.
 */
const CONDITION_GRADE_BY_LABEL: Record<string, string> = {
  "Mint (M)": "M",
  "Near Mint (NM)": "NM",
  "Very Good Plus (VG+)": "VG+",
  "Very Good (VG)": "VG",
  "Good (G)": "G",
};

let categoryIdByName: Map<string, string> | null = null;
let conditionValueIdByGrade: Map<string, string> | null = null;

/**
 * Fetches every product category and caches a name → id map in
 * memory. Genre and era filter values are category names (see
 * `GENRES`/`ERAS` in `store-filter-utils.ts`), so this is what turns
 * a URL's `?genre=Rock` into the `category_id` the Store API filters
 * on. Fails soft — logs and returns an empty map — since a caller
 * that can't resolve filters can still show the unfiltered catalog
 * instead of crashing the store page.
 */
async function getCategoryIdByName(): Promise<Map<string, string>> {
  if (categoryIdByName) {
    return categoryIdByName;
  }

  const next = { ...(await getCacheOptions("product-categories")) };

  try {
    const { product_categories } =
      await medusa.client.fetch<ProductCategoriesResponse>(
        "/store/product-categories",
        {
          method: "GET",
          query: { limit: 100 },
          next,
          cache: "force-cache",
        },
      );

    categoryIdByName = new Map(
      product_categories.map((category) => [category.name, category.id]),
    );
    return categoryIdByName;
  } catch (error) {
    console.error(
      "product-filters.ts: Failed to fetch product categories from Medusa.",
      error,
    );
    return new Map();
  }
}

/**
 * Fetches the shared "Condition" product option — via the custom
 * `/store/product-options` route in `apps/backend`, since Medusa's
 * built-in Store API has no route for a catalog-wide option — and
 * caches a grade → option-value-id map in memory. Fails soft, same
 * reasoning as `getCategoryIdByName`.
 */
async function getConditionValueIdByGrade(): Promise<Map<string, string>> {
  if (conditionValueIdByGrade) {
    return conditionValueIdByGrade;
  }

  const next = { ...(await getCacheOptions("condition-option")) };

  try {
    const { product_options } =
      await medusa.client.fetch<ProductOptionsResponse>(
        "/store/product-options",
        {
          method: "GET",
          query: { title: CONDITION_OPTION_TITLE },
          next,
          cache: "force-cache",
        },
      );

    const values = product_options[0]?.values ?? [];
    conditionValueIdByGrade = new Map(
      values.map((value) => [value.value, value.id]),
    );
    return conditionValueIdByGrade;
  } catch (error) {
    console.error(
      "product-filters.ts: Failed to fetch the Condition option from Medusa.",
      error,
    );
    return new Map();
  }
}

/**
 * Translates this store's URL filter values — category names for
 * genre/era, display labels for condition — into the Medusa IDs
 * `listProductsWithSort` filters on (`category_id`/`option_value_id`).
 * Names/labels that don't resolve (e.g. a stale filter pill for a
 * renamed category) are silently dropped rather than thrown on.
 */
async function resolveProductFilters({
  genres = [],
  eras = [],
  conditions = [],
}: StoreFilterSelections): Promise<ResolvedProductFilters> {
  const [categoryMap, conditionMap] = await Promise.all([
    getCategoryIdByName(),
    conditions.length
      ? getConditionValueIdByGrade()
      : Promise.resolve(new Map<string, string>()),
  ]);

  const categoryIds = [...genres, ...eras]
    .map((name) => categoryMap.get(name))
    .filter((id): id is string => Boolean(id));

  const optionValueIds = conditions
    .map((label) => CONDITION_GRADE_BY_LABEL[label])
    .map((grade) => (grade ? conditionMap.get(grade) : undefined))
    .filter((id): id is string => Boolean(id));

  return { categoryIds, optionValueIds };
}

export type { StoreFilterSelections, ResolvedProductFilters };
export { resolveProductFilters };
