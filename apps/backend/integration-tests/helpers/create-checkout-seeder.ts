import { MedusaContainer } from '@medusajs/framework/types';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import { AdminHeaders, createAdminUser, generateStoreHeaders } from './admin-auth';

type CreateCheckoutSeederParams = {
  api: any;
  container: MedusaContainer;
  /** Lower-case province codes the fulfillment set's service zone allows — an address outside this list gets zero shipping options, same restriction pattern the real store uses for its 8-state region. */
  provinces?: string[];
  /**
   * `default_tax_rate` on a country-level tax region, plus an explicit
   * override on a `ca` province-level child region — mirrors the real
   * store's Admin config, where every state has its own rate except
   * Oregon, which has none and falls back to the country default (0%).
   */
  withTaxRegions?: boolean;
  /** Percent rate on the `ca` province tax region, only used when `withTaxRegions` is true. */
  caTaxRatePercent?: number;
  /** Cents, matching this project's price convention (see apps/storefront/src/lib/utils/format-price.ts) — not Medusa's generic major-unit default. */
  itemPriceCents?: number;
  shippingPriceCents?: number;
};

type CheckoutSeeder = {
  adminHeaders: AdminHeaders;
  storeHeaders: { headers: { [key: string]: string } };
  region: { id: string; [key: string]: unknown };
  salesChannel: { id: string; [key: string]: unknown };
  product: {
    id: string;
    variants: { id: string; [key: string]: unknown }[];
    [key: string]: unknown;
  };
  shippingOption: { id: string; [key: string]: unknown };
};

async function createCheckoutSeeder({
  api,
  container,
  provinces = ['ca'],
  withTaxRegions = false,
  caTaxRatePercent = 7.25,
  itemPriceCents = 1175,
  shippingPriceCents = 695,
}: CreateCheckoutSeederParams): Promise<CheckoutSeeder> {
  const adminHeaders = await createAdminUser(container);
  const storeHeaders = await generateStoreHeaders(container);

  const region = (
    await api.post(
      '/admin/regions',
      { name: 'Test region', currency_code: 'usd' },
      adminHeaders,
    )
  ).data.region;

  const salesChannel = (
    await api.post(
      '/admin/sales-channels',
      { name: 'Test channel', description: 'channel' },
      adminHeaders,
    )
  ).data.sales_channel;

  const stockLocation = (
    await api.post(
      '/admin/stock-locations',
      { name: 'Test location' },
      adminHeaders,
    )
  ).data.stock_location;

  const inventoryItem = (
    await api.post(
      '/admin/inventory-items',
      { sku: 'test-variant' },
      adminHeaders,
    )
  ).data.inventory_item;

  await api.post(
    `/admin/inventory-items/${inventoryItem.id}/location-levels`,
    { location_id: stockLocation.id, stocked_quantity: 10 },
    adminHeaders,
  );

  await api.post(
    `/admin/stock-locations/${stockLocation.id}/sales-channels`,
    { add: [salesChannel.id] },
    adminHeaders,
  );

  const shippingProfile = (
    await api.post(
      '/admin/shipping-profiles',
      { name: 'Test profile', type: 'default' },
      adminHeaders,
    )
  ).data.shipping_profile;

  const product = (
    await api.post(
      '/admin/products',
      {
        title: 'Test Record',
        status: 'published',
        shipping_profile_id: shippingProfile.id,
        options: [{ title: 'Condition', values: ['VG'] }],
        variants: [
          {
            title: 'VG',
            sku: 'test-variant',
            inventory_items: [
              { inventory_item_id: inventoryItem.id, required_quantity: 1 },
            ],
            prices: [{ currency_code: 'usd', amount: itemPriceCents }],
            options: { Condition: 'VG' },
          },
        ],
      },
      adminHeaders,
    )
  ).data.product;

  const fulfillmentSets = (
    await api.post(
      `/admin/stock-locations/${stockLocation.id}/fulfillment-sets?fields=*fulfillment_sets`,
      { name: 'Test fulfillment set', type: 'shipping' },
      adminHeaders,
    )
  ).data.stock_location.fulfillment_sets;

  const fulfillmentSet = (
    await api.post(
      `/admin/fulfillment-sets/${fulfillmentSets[0].id}/service-zones`,
      {
        name: 'Test zone',
        geo_zones: provinces.map((province_code) => ({
          type: 'province',
          country_code: 'us',
          province_code,
        })),
      },
      adminHeaders,
    )
  ).data.fulfillment_set;

  await api.post(
    `/admin/stock-locations/${stockLocation.id}/fulfillment-providers`,
    { add: ['manual_manual'] },
    adminHeaders,
  );

  const remoteLink = container.resolve(ContainerRegistrationKeys.LINK);
  await remoteLink.create([
    {
      [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id },
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    },
    {
      [Modules.PRODUCT]: { variant_id: product.variants[0].id },
      [Modules.INVENTORY]: { inventory_item_id: inventoryItem.id },
    },
  ]);

  const shippingOption = (
    await api.post(
      '/admin/shipping-options',
      {
        name: 'Standard Shipping',
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        provider_id: 'manual_manual',
        price_type: 'flat',
        type: {
          label: 'Standard',
          description: 'Standard flat-rate shipping.',
          code: 'standard',
        },
        prices: [{ currency_code: 'usd', amount: shippingPriceCents }],
        rules: [],
      },
      adminHeaders,
    )
  ).data.shipping_option;

  if (withTaxRegions) {
    const taxService = container.resolve(Modules.TAX);
    const usRegion = (
      await taxService.createTaxRegions([
        {
          country_code: 'us',
          // Omitting provider_id stores null, not a default — resolving
          // it then throws (AwilixResolutionError: Could not resolve
          // 'null'). "tp_system" is Medusa's built-in system tax
          // provider's real container-registration key.
          provider_id: 'tp_system',
          default_tax_rate: { name: 'US Default', rate: 0, code: 'US_DEFAULT' },
        },
      ])
    )[0];

    await taxService.createTaxRegions([
      {
        country_code: 'us',
        province_code: 'ca',
        parent_id: usRegion.id,
        // provider_id is only settable on the top-level region — a
        // province-level child inherits it from its parent; setting it
        // here trips the DB's CK_tax_region_provider_top_level check
        // constraint.
        default_tax_rate: {
          name: 'CA Sales Tax',
          rate: caTaxRatePercent,
          code: 'CA_STD',
        },
      },
    ]);
  }

  return { adminHeaders, storeHeaders, region, salesChannel, product, shippingOption };
}

export { createCheckoutSeeder };
export type { CheckoutSeeder };
