import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

// One-time data fix. Products created before `sort_price` existed in the
// ETL's metadata shape (see `sort_price_for` in etl/tools/load_catalog.py)
// don't have it set, so `order=metadata.sort_price` on the Store API sorts
// them as if their price were "" -- ahead of every zero-padded value on
// price-asc, since an empty string is lexicographically smaller than any
// digit. Backfills it from each product's already-set variant prices
// directly (not by re-running the ETL, which would also re-hit
// MusicBrainz/CAA and re-upload every image for no reason -- see the
// price-sort architecture discussion this migrated from).
const PAGE_SIZE = 100;

function zeroPaddedSortPrice(amounts: number[]): string {
  const lowest = Math.min(...amounts);
  return String(lowest).padStart(6, "0");
}

export default async function backfill_sort_price({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productService = container.resolve(Modules.PRODUCT);

  let skip = 0;
  let updated = 0;
  let skippedNoPrices = 0;

  while (true) {
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "metadata",
        "variants.price_set.prices.amount",
        "variants.price_set.prices.currency_code",
      ],
      pagination: { take: PAGE_SIZE, skip },
    });

    if (!products.length) {
      break;
    }

    for (const product of products) {
      const amounts = (product.variants ?? [])
        .flatMap((variant) => variant.price_set?.prices ?? [])
        .filter(
          (price): price is NonNullable<typeof price> =>
            price !== null && price.currency_code === "usd",
        )
        .map((price) => price.amount);

      if (!amounts.length) {
        logger.warn(
          `backfill-sort-price.ts: product ${product.id} has no usd variant prices, skipping.`,
        );
        skippedNoPrices++;
        continue;
      }

      await productService.updateProducts(product.id, {
        metadata: {
          ...product.metadata,
          sort_price: zeroPaddedSortPrice(amounts),
        },
      });
      updated++;
    }

    skip += PAGE_SIZE;
  }

  logger.info(
    `backfill-sort-price.ts: updated ${updated} product(s), skipped ${skippedNoPrices} with no usd price.`,
  );
}
