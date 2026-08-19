import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

// One-time data fix. The Admin dashboard's province Tax Region form
// stores `province_code` as the full ISO 3166-2 code lowercased (e.g.
// "us-ca"), but Medusa's tax-calculation lookup compares it directly
// against `shipping_address.province` with no country prefix (e.g.
// "ca" — see apps/storefront/src/lib/data/checkout-address.ts's own
// documented convention, and Medusa's tax-module-service.js, which
// only lowercases the address's province before matching). Regions
// created through the dashboard therefore never match a real
// storefront cart and silently fall back to the 0% country default.
// Recreates the 7 state regions the user configured via Admin with
// bare province codes so they actually match at checkout.
const STATE_RATES = [
  { province_code: "az", name: "US-ARIZONA", rate: 5.6, code: "us-az" },
  { province_code: "ca", name: "US-CALIFORNIA", rate: 7.25, code: "us-ca" },
  { province_code: "co", name: "US-COLORADO", rate: 2.9, code: "us-co" },
  { province_code: "nm", name: "US-NEW-MEXICO", rate: 4.875, code: "us-nm" },
  { province_code: "nv", name: "US-NEVADA", rate: 6.85, code: "us-nv" },
  { province_code: "ut", name: "US-UTAH", rate: 6.1, code: "us-ut" },
  { province_code: "wa", name: "US-WASHINGTON", rate: 6.5, code: "us-wa" },
];

export default async function fix_tax_region_province_codes({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const taxService = container.resolve(Modules.TAX);

  const [usRegion] = await taxService.listTaxRegions({
    country_code: "us",
    province_code: null,
  });

  if (!usRegion) {
    throw new Error(
      "fix-tax-region-province-codes.ts: No top-level US tax region found.",
    );
  }

  const staleRegions = await taxService.listTaxRegions({
    country_code: "us",
    province_code: [
      "us-az",
      "us-ca",
      "us-co",
      "us-nm",
      "us-nv",
      "us-ut",
      "us-wa",
    ],
  });

  if (staleRegions.length) {
    logger.info(
      `Deleting ${staleRegions.length} mis-coded province tax region(s)...`,
    );
    await taxService.deleteTaxRegions(staleRegions.map((r) => r.id));
  }

  logger.info("Recreating province tax regions with bare province codes...");
  for (const state of STATE_RATES) {
    await taxService.createTaxRegions({
      country_code: "us",
      province_code: state.province_code,
      parent_id: usRegion.id,
      default_tax_rate: {
        name: state.name,
        rate: state.rate,
        code: state.code,
      },
    });
  }

  logger.info("Tax region province codes fixed.");
}
